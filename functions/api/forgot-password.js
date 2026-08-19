import { json, readBody, isLocalDev } from './_shared.js';

const RESET_TTL_SECONDS = 60 * 60;

export async function onRequestPost({ request, env }) {
  const body = await readBody(request);
  const email = String(body?.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'Informe um e-mail válido.' }, 400);
  }

  const user = await env.DB.prepare('SELECT id FROM users WHERE email = ?')
    .bind(email)
    .first();

  if (!user) {
    return json({ ok: true });
  }

  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const token = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  const expiresAt = Math.floor(Date.now() / 1000) + RESET_TTL_SECONDS;

  await env.DB.prepare('DELETE FROM password_resets WHERE user_id = ?')
    .bind(user.id)
    .run();
  await env.DB.prepare('DELETE FROM password_resets WHERE expires_at < ?')
    .bind(Math.floor(Date.now() / 1000))
    .run();
  await env.DB.prepare(
    'INSERT INTO password_resets (token, user_id, expires_at) VALUES (?, ?, ?)'
  )
    .bind(token, user.id, expiresAt)
    .run();

  const origin = new URL(request.url).origin;
  const resetLink = `${origin}/?reset=${token}`;

  const canSend = env.EMAIL && typeof env.EMAIL.send === 'function' && env.SENDER_EMAIL;

  if (canSend) {
    try {
      await env.EMAIL.send({
        to: email,
        from: { email: env.SENDER_EMAIL, name: 'Gestão Financeira' },
        subject: 'Recuperação de senha',
        html: `
          <p>Você solicitou a recuperação de senha.</p>
          <p><a href="${resetLink}">Clique aqui para definir uma nova senha</a></p>
          <p>O link é válido por 60 minutos.</p>
        `,
        text: `Acesse o link a seguir para definir uma nova senha (válido por 60 minutos): ${resetLink}`,
      });
    } catch {
      return json({ error: 'Não foi possível enviar o e-mail. Tente novamente.' }, 500);
    }
    return json({ ok: true });
  }

  if (isLocalDev(env)) {
    return json({ ok: true, devLink: resetLink });
  }

  return json(
    { error: 'O envio de e-mail ainda não está configurado para este aplicativo.' },
    500
  );
}