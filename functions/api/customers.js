import { json, readBody, getUserFromRequest } from './_shared.js';

export async function onRequestGet({ request, env }) {
  const user = await getUserFromRequest(env, request);
  if (!user) return json({ error: 'Não autenticado' }, 401);

  const { results } = await env.DB.prepare(
    `SELECT c.id, c.name, c.phone, c.created_at,
            (SELECT COUNT(*) FROM transactions t WHERE t.customer_id = c.id) AS total_sales,
            (SELECT COALESCE(SUM(ABS(t.amount)), 0) FROM transactions t WHERE t.customer_id = c.id AND t.type = 'venda') AS total_spent,
            (SELECT COALESCE(SUM(t.amount - COALESCE(t.discount, 0)), 0) FROM transactions t WHERE t.customer_id = c.id AND t.type = 'venda' AND t.status = 'fiado') AS open_balance
     FROM customers c
     WHERE c.user_id = ?
     ORDER BY c.name COLLATE NOCASE`
  )
    .bind(user.id)
    .all();
  return json(results);
}

export async function onRequestPost({ request, env }) {
  const user = await getUserFromRequest(env, request);
  if (!user) return json({ error: 'Não autenticado' }, 401);

  const body = await readBody(request);
  const name = String(body?.name || '').trim();
  if (!name) return json({ error: 'Informe o nome do cliente.' }, 400);

  const phone = String(body?.phone || '').trim();

  const result = await env.DB.prepare(
    'INSERT INTO customers (user_id, name, phone) VALUES (?, ?, ?)'
  )
    .bind(user.id, name, phone)
    .run();

  return json({ id: result.meta.last_row_id, name, phone }, 201);
}

export async function onRequestPut({ request, env }) {
  const user = await getUserFromRequest(env, request);
  if (!user) return json({ error: 'Não autenticado' }, 401);

  const body = await readBody(request);
  const id = Number(body?.id);
  if (!Number.isInteger(id) || id <= 0) {
    return json({ error: 'Id do cliente é obrigatório.' }, 400);
  }
  const name = String(body?.name || '').trim();
  if (!name) return json({ error: 'Informe o nome do cliente.' }, 400);
  const phone = String(body?.phone || '').trim();

  const existing = await env.DB.prepare('SELECT id FROM customers WHERE id = ? AND user_id = ?')
    .bind(id, user.id)
    .first();
  if (!existing) return json({ error: 'Cliente não encontrado.' }, 404);

  await env.DB.prepare('UPDATE customers SET name = ?, phone = ? WHERE id = ? AND user_id = ?')
    .bind(name, phone, id, user.id)
    .run();

  return json({ ok: true });
}

export async function onRequestDelete({ request, env }) {
  const user = await getUserFromRequest(env, request);
  if (!user) return json({ error: 'Não autenticado' }, 401);

  const url = new URL(request.url);
  const id = Number(url.searchParams.get('id'));
  if (!Number.isInteger(id) || id <= 0) {
    return json({ error: 'Id do cliente é obrigatório.' }, 400);
  }

  const existing = await env.DB.prepare('SELECT id FROM customers WHERE id = ? AND user_id = ?')
    .bind(id, user.id)
    .first();
  if (!existing) return json({ error: 'Cliente não encontrado.' }, 404);

  await env.DB.prepare('UPDATE transactions SET customer_id = NULL WHERE customer_id = ? AND user_id = ?')
    .bind(id, user.id)
    .run();
  await env.DB.prepare('DELETE FROM customers WHERE id = ? AND user_id = ?')
    .bind(id, user.id)
    .run();

  return json({ ok: true });
}