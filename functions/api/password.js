import {
  json,
  readBody,
  getUserFromRequest,
  generateSalt,
  hashPassword,
} from './_shared.js';

export async function onRequestPut({ request, env }) {
  const user = await getUserFromRequest(env, request);
  if (!user) return json({ error: 'Não autenticado' }, 401);

  const body = await readBody(request);
  if (!body || typeof body !== 'object') return json({ error: 'Dados inválidos.' }, 400);
  const currentPassword = String(body.current_password || '');
  const newPassword = String(body.new_password || '');
  if (!currentPassword || !newPassword) {
    return json({ error: 'Informe a senha atual e a nova senha.' }, 400);
  }
  if (newPassword.length < 8) {
    return json({ error: 'A nova senha deve ter pelo menos 8 caracteres.' }, 400);
  }

  const dbUser = await env.DB.prepare('SELECT salt, password_hash FROM users WHERE id = ?')
    .bind(user.id)
    .first();
  if (!dbUser) return json({ error: 'Usuário não encontrado.' }, 404);

  const currentHash = await hashPassword(currentPassword, dbUser.salt);
  if (currentHash !== dbUser.password_hash) {
    return json({ error: 'Senha atual incorreta.' }, 400);
  }

  const salt = generateSalt();
  const newHash = await hashPassword(newPassword, salt);
  await env.DB.prepare('UPDATE users SET salt = ?, password_hash = ? WHERE id = ?')
    .bind(salt, newHash, user.id)
    .run();

  return json({ ok: true });
}