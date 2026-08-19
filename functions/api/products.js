import { json, readBody, getUserFromRequest } from './_shared.js';

function validateProduct(p) {
  if (!p || typeof p !== 'object') return 'Dados inválidos.';
  if (typeof p.name !== 'string' || !p.name.trim()) return 'Nome do produto é obrigatório.';
  const numeric = (v, allowZero = true) =>
    typeof v === 'number' && Number.isFinite(v) && (allowZero ? v >= 0 : v > 0);
  if (!numeric(p.cost_price)) return 'Custo inválido.';
  if (!numeric(p.sale_price)) return 'Valor de venda inválido.';
  if (!numeric(p.stock_qty)) return 'Quantidade em estoque inválida.';
  if (p.min_stock != null && !numeric(p.min_stock)) return 'Estoque mínimo inválido.';
  return null;
}

export async function onRequestGet({ request, env }) {
  const user = await getUserFromRequest(env, request);
  if (!user) return json({ error: 'Não autenticado' }, 401);

  const { results } = await env.DB.prepare(
    `SELECT id, name, cost_price, sale_price, stock_qty, min_stock, created_at
     FROM products WHERE user_id = ? ORDER BY name COLLATE NOCASE ASC`
  )
    .bind(user.id)
    .all();
  return json(results);
}

export async function onRequestPost({ request, env }) {
  const user = await getUserFromRequest(env, request);
  if (!user) return json({ error: 'Não autenticado' }, 401);

  const body = await readBody(request);
  const error = validateProduct(body);
  if (error) return json({ error }, 400);

  const id = typeof body.id === 'string' && body.id ? body.id : crypto.randomUUID();
  const name = body.name.trim();
  const minStock = typeof body.min_stock === 'number' && body.min_stock > 0 ? body.min_stock : 0;

  await env.DB.prepare(
    `INSERT INTO products (id, user_id, name, cost_price, sale_price, stock_qty, min_stock)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(id, user.id, name, body.cost_price, body.sale_price, body.stock_qty, minStock)
    .run();

  return json({ id }, 201);
}

export async function onRequestPut({ request, env }) {
  const user = await getUserFromRequest(env, request);
  if (!user) return json({ error: 'Não autenticado' }, 401);

  const body = await readBody(request);
  if (typeof body.id !== 'string' || !body.id) return json({ error: 'Id do produto é obrigatório.' }, 400);
  const error = validateProduct(body);
  if (error) return json({ error }, 400);

  const result = await env.DB.prepare(
    `UPDATE products
     SET name = ?, cost_price = ?, sale_price = ?, stock_qty = ?, min_stock = ?
     WHERE id = ? AND user_id = ?`
  )
    .bind(
      body.name.trim(),
      body.cost_price,
      body.sale_price,
      body.stock_qty,
      typeof body.min_stock === 'number' && body.min_stock > 0 ? body.min_stock : 0,
      body.id,
      user.id
    )
    .run();

  if (result.meta.changes === 0) {
    return json({ error: 'Produto não encontrado.' }, 404);
  }
  return json({ ok: true });
}

export async function onRequestDelete({ request, env }) {
  const user = await getUserFromRequest(env, request);
  if (!user) return json({ error: 'Não autenticado' }, 401);

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return json({ error: 'Id do produto é obrigatório.' }, 400);

  const result = await env.DB.prepare('DELETE FROM products WHERE id = ? AND user_id = ?')
    .bind(id, user.id)
    .run();
  if (result.meta.changes === 0) {
    return json({ error: 'Produto não encontrado.' }, 404);
  }
  return json({ ok: true });
}
