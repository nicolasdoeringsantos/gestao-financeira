import {
  json,
  readBody,
  hashPassword,
  isLockedOut,
  recordLoginFailure,
  createSession,
  sessionCookie,
  isLocalDev,
} from './_shared.js';

export async function onRequestPost({ request, env }) {
  const body = await readBody(request);
  const email = String(body?.email || '').trim().toLowerCase();
  const password = String(body?.password || '');
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';

  if (!email || !password) {
    return json({ error: 'Informe e-mail e senha.' }, 400);
  }
  if (await isLockedOut(env, email, ip)) {
    return json({ error: 'Muitas tentativas. Tente novamente em alguns minutos.' }, 429);
  }

  const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?')
    .bind(email)
    .first();
  if (!user) {
    await recordLoginFailure(env, email, ip);
    return json({ error: 'E-mail ou senha incorretos.' }, 401);
  }

  const passwordHash = await hashPassword(password, user.salt);
  if (passwordHash !== user.password_hash) {
    await recordLoginFailure(env, email, ip);
    return json({ error: 'E-mail ou senha incorretos.' }, 401);
  }

  const now = Math.floor(Date.now() / 1000);
  await env.DB.prepare('DELETE FROM sessions WHERE user_id = ? AND expires_at < ?')
    .bind(user.id, now)
    .run();
  const token = await createSession(env, user.id);

  return json({ id: user.id, email: user.email }, 200, {
    'Set-Cookie': sessionCookie(token, !isLocalDev(env)),
  });
}
