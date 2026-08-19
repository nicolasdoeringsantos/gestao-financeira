import { json, readBody, getUserFromRequest } from './_shared.js';

export async function onRequestPut({ request, env }) {
  const user = await getUserFromRequest(env, request);
  if (!user) return json({ error: 'Não autenticado' }, 401);

  const body = await readBody(request);
  if (!body || typeof body.monthly_goal !== 'number' || !Number.isFinite(body.monthly_goal) || body.monthly_goal < 0) {
    return json({ error: 'Meta mensal inválida.' }, 400);
  }

  await env.DB.prepare('UPDATE users SET monthly_goal = ? WHERE id = ?')
    .bind(body.monthly_goal, user.id)
    .run();

  return json({ ok: true, monthly_goal: body.monthly_goal });
}