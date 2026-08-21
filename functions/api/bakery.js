import { json, readBody, getUserFromRequest } from './_shared.js';

async function ensureTables(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS ingredients (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      package_qty REAL NOT NULL DEFAULT 1,
      unit TEXT NOT NULL DEFAULT 'kg',
      package_price REAL NOT NULL DEFAULT 0,
      unit_cost REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS recipes (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      yield_packages REAL NOT NULL DEFAULT 1,
      package_unit_name TEXT NOT NULL DEFAULT 'pacotes',
      extra_costs REAL NOT NULL DEFAULT 0,
      total_cost REAL NOT NULL DEFAULT 0,
      cost_per_package REAL NOT NULL DEFAULT 0,
      suggested_price REAL NOT NULL DEFAULT 0,
      items_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `).catch(() => {});
}

export async function onRequestGet({ request, env }) {
  const user = await getUserFromRequest(env, request);
  if (!user) return json({ error: 'Não autenticado' }, 401);

  await ensureTables(env.DB);

  const [ingredientsRes, recipesRes] = await Promise.all([
    env.DB.prepare(
      `SELECT id, name, package_qty, unit, package_price, unit_cost, created_at
       FROM ingredients WHERE user_id = ? ORDER BY name COLLATE NOCASE ASC`
    ).bind(user.id).all().catch(() => ({ results: [] })),
    env.DB.prepare(
      `SELECT id, name, yield_packages, package_unit_name, extra_costs, total_cost, cost_per_package, suggested_price, items_json, created_at
       FROM recipes WHERE user_id = ? ORDER BY name COLLATE NOCASE ASC`
    ).bind(user.id).all().catch(() => ({ results: [] })),
  ]);

  const recipes = (recipesRes.results || []).map((r) => {
    let items = [];
    try {
      items = JSON.parse(r.items_json || '[]');
    } catch {}
    return { ...r, items };
  });

  return json({
    ingredients: ingredientsRes.results || [],
    recipes,
  });
}

export async function onRequestPost({ request, env }) {
  const user = await getUserFromRequest(env, request);
  if (!user) return json({ error: 'Não autenticado' }, 401);

  await ensureTables(env.DB);
  const body = await readBody(request);
  if (!body) return json({ error: 'Dados inválidos.' }, 400);

  const { action } = body;

  if (action === 'save_ingredient') {
    const { id, name, package_qty, unit, package_price } = body;
    if (!name || !name.trim()) return json({ error: 'Nome do ingrediente é obrigatório.' }, 400);
    const pQty = Number(package_qty) > 0 ? Number(package_qty) : 1;
    const pPrice = Number(package_price) >= 0 ? Number(package_price) : 0;
    const unitCost = pPrice / pQty;
    const itemUnit = unit || 'kg';
    const ingId = id || crypto.randomUUID();

    await env.DB.prepare(
      `INSERT INTO ingredients (id, user_id, name, package_qty, unit, package_price, unit_cost)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       package_qty = excluded.package_qty,
       unit = excluded.unit,
       package_price = excluded.package_price,
       unit_cost = excluded.unit_cost`
    )
      .bind(ingId, user.id, name.trim(), pQty, itemUnit, pPrice, unitCost)
      .run();

    return json({ id: ingId, ok: true }, 201);
  }

  if (action === 'delete_ingredient') {
    const { id } = body;
    if (!id) return json({ error: 'Id é obrigatório.' }, 400);
    await env.DB.prepare('DELETE FROM ingredients WHERE id = ? AND user_id = ?')
      .bind(id, user.id)
      .run();
    return json({ ok: true });
  }

  if (action === 'save_recipe') {
    const {
      id,
      name,
      yield_packages,
      package_unit_name,
      extra_costs,
      total_cost,
      cost_per_package,
      suggested_price,
      items,
    } = body;

    if (!name || !name.trim()) return json({ error: 'Nome da receita é obrigatório.' }, 400);
    const yPkgs = Number(yield_packages) > 0 ? Number(yield_packages) : 1;
    const pkgUnit = (package_unit_name || 'pacotes').trim();
    const extra = Number(extra_costs) >= 0 ? Number(extra_costs) : 0;
    const totCost = Number(total_cost) >= 0 ? Number(total_cost) : 0;
    const costPerPkg = yPkgs > 0 ? totCost / yPkgs : totCost;
    const sugPrice = Number(suggested_price) >= 0 ? Number(suggested_price) : 0;
    const itemsJson = JSON.stringify(Array.isArray(items) ? items : []);
    const recId = id || crypto.randomUUID();

    await env.DB.prepare(
      `INSERT INTO recipes (id, user_id, name, yield_packages, package_unit_name, extra_costs, total_cost, cost_per_package, suggested_price, items_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       yield_packages = excluded.yield_packages,
       package_unit_name = excluded.package_unit_name,
       extra_costs = excluded.extra_costs,
       total_cost = excluded.total_cost,
       cost_per_package = excluded.cost_per_package,
       suggested_price = excluded.suggested_price,
       items_json = excluded.items_json`
    )
      .bind(
        recId,
        user.id,
        name.trim(),
        yPkgs,
        pkgUnit,
        extra,
        totCost,
        costPerPkg,
        sugPrice,
        itemsJson
      )
      .run();

    return json({ id: recId, ok: true }, 201);
  }

  if (action === 'delete_recipe') {
    const { id } = body;
    if (!id) return json({ error: 'Id é obrigatório.' }, 400);
    await env.DB.prepare('DELETE FROM recipes WHERE id = ? AND user_id = ?')
      .bind(id, user.id)
      .run();
    return json({ ok: true });
  }

  return json({ error: 'Ação não suportada.' }, 400);
}
