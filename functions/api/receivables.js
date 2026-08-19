import { json, readBody, getUserFromRequest } from './_shared.js';

const VALID_PAYMENTS = new Set(['dinheiro', 'pix', 'cartao_debito', 'cartao_credito', 'outros']);

export async function onRequestPost({ request, env }) {
  const user = await getUserFromRequest(env, request);
  if (!user) return json({ error: 'Não autenticado' }, 401);

  const body = await readBody(request);
  if (!body || typeof body.transaction_id !== 'string' || !body.transaction_id) {
    return json({ error: 'Id da transação é obrigatório.' }, 400);
  }

  const paymentMethod =
    typeof body.payment_method === 'string' && VALID_PAYMENTS.has(body.payment_method)
      ? body.payment_method
      : 'dinheiro';

  const tx = await env.DB.prepare(
    `SELECT t.id, t.type, t.status, t.name, t.amount, c.name AS customer_name
     FROM transactions t
     LEFT JOIN customers c ON c.id = t.customer_id
     WHERE t.id = ? AND t.user_id = ?`
  )
    .bind(body.transaction_id, user.id)
    .first();
  if (!tx) return json({ error: 'Transação não encontrada.' }, 404);
  if (tx.type !== 'venda') return json({ error: 'Apenas vendas podem ser recebidas.' }, 400);
  if (tx.status === 'pago') return json({ error: 'Esta venda já foi recebida.' }, 400);

  await env.DB.prepare(
    "UPDATE transactions SET status = 'pago', received_at = datetime('now') WHERE id = ? AND user_id = ?"
  )
    .bind(body.transaction_id, user.id)
    .run();

  const description = tx.customer_name
    ? `Recebimento de fiado — ${tx.customer_name}`
    : 'Recebimento de fiado';
  const id = crypto.randomUUID();
  const today = new Date().toISOString().slice(0, 10);
  await env.DB.prepare(
    `INSERT INTO cash_entries (id, user_id, type, description, amount, payment_method, date)
     VALUES (?, ?, 'entrada', ?, ?, ?, ?)`
  )
    .bind(id, user.id, description, tx.amount, paymentMethod, today)
    .run();

  return json({ ok: true, cash_entry_id: id });
}