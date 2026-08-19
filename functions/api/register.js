import {
  json,
  readBody,
  hashPassword,
  generateSalt,
  createSession,
  sessionCookie,
  isLocalDev,
} from './_shared.js';

export async function onRequestPost({ request, env }) {
  const body = await readBody(request);
  const email = String(body?.email || '').trim().toLowerCase();
  const password = String(body?.password || '');

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'Informe um e-mail válido.' }, 400);
  }
  if (password.length < 6) {
    return json({ error: 'A senha deve ter pelo menos 6 caracteres.' }, 400);
  }

  const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?')
    .bind(email)
    .first();
  if (existing) {
    return json({ error: 'Este e-mail já está cadastrado.' }, 409);
  }

  const salt = generateSalt();
  const passwordHash = await hashPassword(password, salt);
  const result = await env.DB.prepare(
    'INSERT INTO users (email, password_hash, salt) VALUES (?, ?, ?)'
  )
    .bind(email, passwordHash, salt)
    .run();
  const userId = result.meta.last_row_id;
  const token = await createSession(env, userId);

  return json({ id: userId, email }, 201, {
    'Set-Cookie': sessionCookie(token, !isLocalDev(env)),
  });
}
