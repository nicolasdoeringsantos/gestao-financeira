import { json, readBody, getUserFromRequest } from './_shared.js';

const VALID_TYPES = new Set(['venda', 'compra', 'ajuste']);

function validateTransaction(t) {
  if (!t || typeof t !== 'object') return 'Dados inválidos.';
  if (!VALID_TYPES.has(t.type)) return 'Tipo inválido.';
  if (typeof t.name !== 'string' || !t.name.trim()) return 'Descrição obrigatória.';
  if (typeof t.amount !== 'number' || !Number.isFinite(t.amount)) return 'Valor inválido.';
  if (typeof t.quantity !== 'number' || !Number.isFinite(t.quantity)) return 'Quantidade inválida.';
  if (typeof t.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(t.date)) return 'Data inválida.';
  if (t.product_id != null && typeof t.product_id !== 'string') return 'Produto inválido.';
  if (t.customer_id != null && !Number.isInteger(Number(t.customer_id))) return 'Cliente inválido.';
  if (
    t.discount != null &&
    (typeof t.discount !== 'number' || !Number.isFinite(t.discount) || t.discount < 0)
  ) {
    return 'Desconto inválido.';
  }
  if (t.status != null && !['pago', 'fiado'].includes(t.status)) {
    return 'Status de pagamento inválido.';
  }
  if (t.type !== 'ajuste' && (t.amount <= 0 || t.quantity <= 0)) {
    return 'Compra/venda exigem valor e quantidade maiores que zero.';
  }
  if (t.type === 'ajuste' && Number(t.discount || 0) !== 0) {
    return 'Desconto não se aplica a ajustes.';
  }
  if (t.discount && t.type === 'venda' && Number(t.discount) >= Number(t.amount)) {
    return 'Desconto deve ser menor que o valor da venda.';
  }
  return null;
}

function stockDelta(type, quantity) {
  if (type === 'compra') return Math.abs(quantity);
  if (type === 'venda') return -Math.abs(quantity);
  return quantity; // ajuste
}

export async function onRequestGet({ request, env }) {
  const user = await getUserFromRequest(env, request);
  if (!user) return json({ error: 'Não autenticado' }, 401);

  const { results } = await env.DB.prepare(
    `SELECT t.id, t.type, t.name, t.amount, t.quantity, t.category, t.date, t.created_at, t.product_id, t.discount, t.status, t.received_at, t.customer_id,
            p.name AS product_name, p.cost_price AS product_cost, p.sale_price AS product_sale,
            c.name AS customer_name
     FROM transactions t
     LEFT JOIN products p ON p.id = t.product_id
     LEFT JOIN customers c ON c.id = t.customer_id
     WHERE t.user_id = ? ORDER BY t.date DESC, t.created_at DESC`
  )
    .bind(user.id)
    .all();
  return json(results);
}

export async function onRequestPost({ request, env }) {
  const user = await getUserFromRequest(env, request);
  if (!user) return json({ error: 'Não autenticado' }, 401);

  const body = await readBody(request);
  const error = validateTransaction(body);
  if (error) return json({ error }, 400);

  const id = typeof body.id === 'string' && body.id ? body.id : crypto.randomUUID();
  const name = body.name.trim();
  const category = typeof body.category === 'string' ? body.category : '';
  const discount = typeof body.discount === 'number' && body.discount > 0 ? body.discount : 0;
  const status = body.type === 'venda' && body.status === 'fiado' ? 'fiado' : 'pago';
  const productId = typeof body.product_id === 'string' && body.product_id ? body.product_id : null;
  const customerId =
    body.customer_id != null && Number.isInteger(Number(body.customer_id))
      ? Number(body.customer_id)
      : null;

  if (customerId) {
    const customer = await env.DB.prepare('SELECT id FROM customers WHERE id = ? AND user_id = ?')
      .bind(customerId, user.id)
      .first();
    if (!customer) return json({ error: 'Cliente não encontrado.' }, 400);
  }

  if (productId) {
    const product = await env.DB.prepare('SELECT stock_qty FROM products WHERE id = ? AND user_id = ?')
      .bind(productId, user.id)
      .first();
    if (!product) return json({ error: 'Produto não encontrado.' }, 400);

    const newStock = product.stock_qty + stockDelta(body.type, body.quantity);
    if (newStock < 0) {
      return json({ error: 'Estoque insuficiente para esta movimentação.' }, 400);
    }
    await env.DB.prepare('UPDATE products SET stock_qty = ? WHERE id = ? AND user_id = ?')
      .bind(newStock, productId, user.id)
      .run();
  }

  await env.DB.prepare(
    `INSERT INTO transactions (id, user_id, type, name, amount, quantity, category, date, product_id, discount, status, customer_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(id, user.id, body.type, name, body.amount, body.quantity, category, body.date, productId, discount, status, customerId)
    .run();

  return json({ id }, 201);
}

export async function onRequestPut({ request, env }) {
  const user = await getUserFromRequest(env, request);
  if (!user) return json({ error: 'Não autenticado' }, 401);

  const body = await readBody(request);
  if (typeof body.id !== 'string' || !body.id) {
    return json({ error: 'Id da transação é obrigatório.' }, 400);
  }
  const error = validateTransaction(body);
  if (error) return json({ error }, 400);

  const tx = await env.DB.prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?')
    .bind(body.id, user.id)
    .first();
  if (!tx) return json({ error: 'Transação não encontrada.' }, 404);

  const oldProductId = tx.product_id;
  const newProductId = typeof body.product_id === 'string' && body.product_id ? body.product_id : null;
  const oldDelta = oldProductId ? stockDelta(tx.type, tx.quantity) : 0;
  const newDelta = newProductId ? stockDelta(body.type, body.quantity) : 0;

  if (newProductId) {
    const product = await env.DB.prepare('SELECT stock_qty FROM products WHERE id = ? AND user_id = ?')
      .bind(newProductId, user.id)
      .first();
    if (!product) return json({ error: 'Produto não encontrado.' }, 400);
    const restored = oldProductId === newProductId ? product.stock_qty - oldDelta : product.stock_qty;
    if (restored + newDelta < 0) {
      return json({ error: 'Estoque insuficiente para esta movimentação.' }, 400);
    }
  }

  if (oldProductId) {
    const product = await env.DB.prepare('SELECT stock_qty FROM products WHERE id = ? AND user_id = ?')
      .bind(oldProductId, user.id)
      .first();
    if (product) {
      await env.DB.prepare('UPDATE products SET stock_qty = ? WHERE id = ? AND user_id = ?')
        .bind(product.stock_qty - oldDelta, oldProductId, user.id)
        .run();
    }
  }

  if (newProductId) {
    const product = await env.DB.prepare('SELECT stock_qty FROM products WHERE id = ? AND user_id = ?')
      .bind(newProductId, user.id)
      .first();
    const newStock = product.stock_qty + newDelta;
    await env.DB.prepare('UPDATE products SET stock_qty = ? WHERE id = ? AND user_id = ?')
      .bind(newStock, newProductId, user.id)
      .run();
  }

  const name = body.name.trim();
  const category = typeof body.category === 'string' ? body.category : '';
  const discount = typeof body.discount === 'number' && body.discount > 0 ? body.discount : 0;
  const status = body.type === 'venda' && body.status === 'fiado' ? 'fiado' : 'pago';
  const customerId =
    body.customer_id != null && Number.isInteger(Number(body.customer_id))
      ? Number(body.customer_id)
      : null;

  if (customerId) {
    const customer = await env.DB.prepare('SELECT id FROM customers WHERE id = ? AND user_id = ?')
      .bind(customerId, user.id)
      .first();
    if (!customer) return json({ error: 'Cliente não encontrado.' }, 400);
  }

  await env.DB.prepare(
    `UPDATE transactions
     SET type = ?, name = ?, amount = ?, quantity = ?, category = ?, date = ?, product_id = ?, discount = ?, status = ?, customer_id = ?
     WHERE id = ? AND user_id = ?`
  )
    .bind(
      body.type,
      name,
      body.amount,
      body.quantity,
      category,
      body.date,
      newProductId,
      discount,
      status,
      customerId,
      body.id,
      user.id
    )
    .run();

  return json({ ok: true });
}

export async function onRequestDelete({ request, env }) {
  const user = await getUserFromRequest(env, request);
  if (!user) return json({ error: 'Não autenticado' }, 401);

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return json({ error: 'Id da transação é obrigatório.' }, 400);

  const tx = await env.DB.prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?')
    .bind(id, user.id)
    .first();
  if (!tx) return json({ error: 'Transação não encontrada.' }, 404);

  if (tx.product_id) {
    const product = await env.DB.prepare('SELECT stock_qty FROM products WHERE id = ? AND user_id = ?')
      .bind(tx.product_id, user.id)
      .first();
    if (product) {
      await env.DB.prepare('UPDATE products SET stock_qty = ? WHERE id = ? AND user_id = ?')
        .bind(product.stock_qty - stockDelta(tx.type, tx.quantity), tx.product_id, user.id)
        .run();
    }
  }

  await env.DB.prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?')
    .bind(id, user.id)
    .run();

  return json({ ok: true });
}
