import { json, getUserFromRequest, clearSessionCookie, isLocalDev } from './_shared.js';

export async function onRequestGet({ request, env }) {
  const user = await getUserFromRequest(env, request);
  if (!user) return json({ error: 'Não autenticado' }, 401);

  const row = await env.DB.prepare('SELECT monthly_goal FROM users WHERE id = ?')
    .bind(user.id)
    .first();
  return json({ ...user, monthly_goal: Number(row?.monthly_goal) || 0 });
}

export async function onRequestPost({ request, env }) {
  const user = await getUserFromRequest(env, request);
  if (!user) return json({ error: 'Não autenticado' }, 401);

  const cookies = (request.headers.get('cookie') || '')
    .split(';')
    .map((p) => p.trim())
    .filter(Boolean);
  const token = cookies
    .map((p) => p.split('='))
    .find(([k]) => k === '__session')?.[1];

  if (token) {
    await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
  }
  return json({ ok: true }, 200, { 'Set-Cookie': clearSessionCookie(!isLocalDev(env)) });
}
