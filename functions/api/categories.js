import { json, readBody, getUserFromRequest } from './_shared.js';

function validateCategory(c) {
  if (!c || typeof c !== 'object') return 'Dados inválidos.';
  if (typeof c.name !== 'string' || !c.name.trim()) return 'Nome da categoria é obrigatório.';
  return null;
}

export async function onRequestGet({ request, env }) {
  const user = await getUserFromRequest(env, request);
  if (!user) return json({ error: 'Não autenticado' }, 401);

  const { results } = await env.DB.prepare(
    'SELECT id, name FROM categories WHERE user_id = ? ORDER BY name COLLATE NOCASE ASC'
  )
    .bind(user.id)
    .all();
  return json(results);
}

export async function onRequestPost({ request, env }) {
  const user = await getUserFromRequest(env, request);
  if (!user) return json({ error: 'Não autenticado' }, 401);

  const body = await readBody(request);
  const error = validateCategory(body);
  if (error) return json({ error }, 400);

  const name = body.name.trim();
  const existing = await env.DB.prepare('SELECT id FROM categories WHERE user_id = ? AND name = ?')
    .bind(user.id, name)
    .first();
  if (existing) return json({ error: 'Categoria já existe.' }, 400);

  const id = typeof body.id === 'string' && body.id ? body.id : crypto.randomUUID();
  await env.DB.prepare('INSERT INTO categories (id, user_id, name) VALUES (?, ?, ?)')
    .bind(id, user.id, name)
    .run();

  return json({ id }, 201);
}

export async function onRequestPut({ request, env }) {
  const user = await getUserFromRequest(env, request);
  if (!user) return json({ error: 'Não autenticado' }, 401);

  const body = await readBody(request);
  if (typeof body.id !== 'string' || !body.id) {
    return json({ error: 'Id da categoria é obrigatório.' }, 400);
  }
  const error = validateCategory(body);
  if (error) return json({ error }, 400);

  const result = await env.DB.prepare('UPDATE categories SET name = ? WHERE id = ? AND user_id = ?')
    .bind(body.name.trim(), body.id, user.id)
    .run();
  if (result.meta.changes === 0) {
    return json({ error: 'Categoria não encontrada.' }, 404);
  }
  return json({ ok: true });
}

export async function onRequestDelete({ request, env }) {
  const user = await getUserFromRequest(env, request);
  if (!user) return json({ error: 'Não autenticado' }, 401);

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return json({ error: 'Id da categoria é obrigatório.' }, 400);

  const result = await env.DB.prepare('DELETE FROM categories WHERE id = ? AND user_id = ?')
    .bind(id, user.id)
    .run();
  if (result.meta.changes === 0) {
    return json({ error: 'Categoria não encontrada.' }, 404);
  }
  return json({ ok: true });
}