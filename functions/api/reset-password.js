import { json, readBody, generateSalt, hashPassword } from './_shared.js';

export async function onRequestPost({ request, env }) {
  const body = await readBody(request);
  const token = String(body?.token || '');
  const newPassword = String(body?.new_password || '');

  if (!token) return json({ error: 'Token inválido.' }, 400);
  if (newPassword.length < 8) {
    return json({ error: 'A nova senha deve ter pelo menos 8 caracteres.' }, 400);
  }

  const row = await env.DB.prepare(
    `SELECT pr.token, pr.used, pr.expires_at, u.id AS user_id, u.salt
     FROM password_resets pr
     JOIN users u ON u.id = pr.user_id
     WHERE pr.token = ?`
  )
    .bind(token)
    .first();

  if (!row) return json({ error: 'Link inválido ou já utilizado.' }, 400);
  if (row.used) return json({ error: 'Link já utilizado.' }, 400);
  if (row.expires_at < Math.floor(Date.now() / 1000)) {
    return json({ error: 'Link expirado. Solicite uma nova recuperação.' }, 400);
  }

  const salt = generateSalt();
  const hash = await hashPassword(newPassword, salt);
  await env.DB.prepare('UPDATE users SET salt = ?, password_hash = ? WHERE id = ?')
    .bind(salt, hash, row.user_id)
    .run();
  await env.DB.prepare('UPDATE password_resets SET used = 1 WHERE token = ?')
    .bind(token)
    .run();
  await env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(row.user_id).run();

  return json({ ok: true });
}