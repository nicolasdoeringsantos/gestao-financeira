import { json, readBody, getUserFromRequest } from './_shared.js';

const VALID_TYPES = new Set(['entrada', 'saida']);
const VALID_PAYMENTS = new Set(['dinheiro', 'pix', 'cartao_debito', 'cartao_credito', 'outros']);

function validateEntry(e) {
  if (!e || typeof e !== 'object') return 'Dados inválidos.';
  if (!VALID_TYPES.has(e.type)) return 'Tipo inválido.';
  if (typeof e.description !== 'string' || !e.description.trim()) return 'Descrição obrigatória.';
  if (typeof e.amount !== 'number' || !Number.isFinite(e.amount) || e.amount <= 0) {
    return 'Valor inválido.';
  }
  if (!VALID_PAYMENTS.has(e.payment_method)) return 'Forma de pagamento inválida.';
  if (typeof e.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(e.date)) return 'Data inválida.';
  return null;
}

export async function onRequestGet({ request, env }) {
  const user = await getUserFromRequest(env, request);
  if (!user) return json({ error: 'Não autenticado' }, 401);

  const { results } = await env.DB.prepare(
    `SELECT id, type, description, amount, payment_method, date, created_at
     FROM cash_entries WHERE user_id = ? ORDER BY date DESC, created_at DESC`
  )
    .bind(user.id)
    .all();
  return json(results);
}

export async function onRequestPost({ request, env }) {
  const user = await getUserFromRequest(env, request);
  if (!user) return json({ error: 'Não autenticado' }, 401);

  const body = await readBody(request);
  const error = validateEntry(body);
  if (error) return json({ error }, 400);

  const id = typeof body.id === 'string' && body.id ? body.id : crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO cash_entries (id, user_id, type, description, amount, payment_method, date)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(id, user.id, body.type, body.description.trim(), body.amount, body.payment_method, body.date)
    .run();

  return json({ id }, 201);
}

export async function onRequestDelete({ request, env }) {
  const user = await getUserFromRequest(env, request);
  if (!user) return json({ error: 'Não autenticado' }, 401);

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return json({ error: 'Id do lançamento é obrigatório.' }, 400);

  const result = await env.DB.prepare('DELETE FROM cash_entries WHERE id = ? AND user_id = ?')
    .bind(id, user.id)
    .run();
  if (result.meta.changes === 0) {
    return json({ error: 'Lançamento não encontrado.' }, 404);
  }
  return json({ ok: true });
}