import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  Boxes,
  TrendingUp,
  Download,
  ShoppingBag,
  ArrowDownRight,
  Sparkles,
} from 'lucide-react';
import { formatBRL, downloadCSV } from '../../utils/formatters.js';

export const StockTab = ({
  products,
  transactions,
  productForm,
  setProductForm,
  editingProductId,
  setEditingProductId,
  onSaveProduct,
  onDeleteProduct,
  onQuickSell,
  onQuickBuy,
}) => {
  const [showForm, setShowForm] = useState(false);

  // Inventory stats
  const stockStats = useMemo(() => {
    let totalCost = 0;
    let totalSale = 0;
    let totalUnits = 0;
    let lowStockCount = 0;

    products.forEach((p) => {
      const qty = Number(p.stock_qty) || 0;
      const cost = Number(p.cost_price) || 0;
      const sale = Number(p.sale_price) || 0;
      const min = Number(p.min_stock) || 0;

      totalUnits += qty;
      totalCost += cost * Math.max(0, qty);
      totalSale += sale * Math.max(0, qty);

      if (min > 0 && qty <= min) {
        lowStockCount += 1;
      }
    });

    const potentialProfit = totalSale - totalCost;

    return { totalCost, totalSale, totalUnits, lowStockCount, potentialProfit };
  }, [products]);

  // Replenishment suggestions
  const replenish = useMemo(() => {
    const days = 30;
    const cutoff = new Date(Date.now() - (days - 1) * 86400000).toISOString().slice(0, 10);
    const sold = {};
    transactions.forEach((t) => {
      if (t.type === 'venda' && t.product_id && t.date >= cutoff) {
        sold[t.product_id] = (sold[t.product_id] || 0) + Math.abs(Number(t.quantity) || 0);
      }
    });

    return products
      .map((p) => {
        const stock = Number(p.stock_qty) || 0;
        const min = Number(p.min_stock) || 0;
        const soldQty = sold[p.id] || 0;
        const daily = soldQty / days;
        const coverage = daily > 0 ? stock / daily : Infinity;
        const needsRestock = (min > 0 && stock <= min) || (daily > 0 && coverage < 7);
        const suggested = needsRestock
          ? Math.max(1, Math.ceil(Math.max(min, daily * 7)) - stock)
          : 0;
        return { ...p, soldQty, daily, coverage, suggested };
      })
      .filter((p) => p.suggested > 0)
      .sort((a, b) => a.coverage - b.coverage);
  }, [products, transactions]);

  const exportProductsCSV = () => {
    downloadCSV(
      `estoque-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        ['Produto', 'Custo (R$)', 'Venda (R$)', 'Estoque Atual', 'Estoque Mínimo', 'Valor em Estoque (R$)'],
        ...products.map((p) => [
          p.name,
          p.cost_price,
          p.sale_price,
          p.stock_qty,
          p.min_stock || 0,
          ((Number(p.cost_price) || 0) * (Number(p.stock_qty) || 0)).toFixed(2),
        ]),
      ]
    );
  };

  const inputClass =
    'w-full rounded-xl border border-slate-700/70 bg-slate-800/60 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30';
  const labelClass = 'mb-1.5 block text-xs font-semibold tracking-wide text-slate-300';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/20 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Catálogo de Produtos & Estoque</h2>
          <p className="mt-1 text-xs text-slate-400">
            Controle quantidades, custos, margens e reposição de mercadorias.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {products.length > 0 && (
            <button
              type="button"
              onClick={exportProductsCSV}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Exportar CSV</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setShowForm(!showForm);
              setEditingProductId(null);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-blue-900/30 transition hover:from-blue-500 hover:to-indigo-500"
          >
            <Plus className="h-4 w-4" />
            <span>{showForm ? 'Fechar' : 'Novo Produto'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-md">
          <p className="text-xs text-slate-400">Total de Produtos</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-100">{products.length}</p>
          <p className="mt-1 text-[11px] text-slate-500">{stockStats.totalUnits} un. em estoque</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-md">
          <p className="text-xs text-slate-400">Capital em Estoque (Custo)</p>
          <p className="mt-1 text-2xl font-extrabold text-blue-400">{formatBRL(stockStats.totalCost)}</p>
          <p className="mt-1 text-[11px] text-slate-500">Investimento imobilizado</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-md">
          <p className="text-xs text-slate-400">Potencial de Venda</p>
          <p className="mt-1 text-2xl font-extrabold text-emerald-400">{formatBRL(stockStats.totalSale)}</p>
          <p className="mt-1 text-[11px] text-emerald-500">
            Lucro pot.: {formatBRL(stockStats.potentialProfit)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-md">
          <p className="text-xs text-slate-400">Estoque Baixo</p>
          <p
            className={`mt-1 text-2xl font-extrabold ${
              stockStats.lowStockCount > 0 ? 'text-amber-400' : 'text-slate-100'
            }`}
          >
            {stockStats.lowStockCount}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Itens com alerta de compra</p>
        </div>
      </div>

      {/* Form to Add / Edit */}
      {(showForm || editingProductId) && (
        <section className="rounded-2xl border border-blue-500/30 bg-slate-900/90 p-5 shadow-xl shadow-black/40 animate-in fade-in duration-200">
          <h3 className="mb-4 text-base font-bold text-slate-100">
            {editingProductId ? 'Editar Produto' : 'Cadastrar Novo Produto'}
          </h3>

          <form onSubmit={onSaveProduct} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <label className={labelClass}>Nome do Produto</label>
              <input
                className={inputClass}
                placeholder="Ex.: Trufa Tradicional 45g"
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className={labelClass}>Preço de Custo (R$)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className={inputClass}
                placeholder="0,00"
                value={productForm.cost_price}
                onChange={(e) => setProductForm({ ...productForm, cost_price: e.target.value })}
              />
            </div>

            <div>
              <label className={labelClass}>Preço de Venda (R$)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className={inputClass}
                placeholder="0,00"
                value={productForm.sale_price}
                onChange={(e) => setProductForm({ ...productForm, sale_price: e.target.value })}
              />
            </div>

            <div>
              <label className={labelClass}>Estoque Inicial</label>
              <input
                type="number"
                step="any"
                className={inputClass}
                placeholder="0"
                value={productForm.stock_qty}
                onChange={(e) => setProductForm({ ...productForm, stock_qty: e.target.value })}
              />
            </div>

            <div>
              <label className={labelClass}>Estoque Mínimo (Alerta)</label>
              <input
                type="number"
                min="0"
                step="any"
                className={inputClass}
                placeholder="0"
                value={productForm.min_stock}
                onChange={(e) => setProductForm({ ...productForm, min_stock: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-end gap-3 sm:col-span-2 lg:col-span-4">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingProductId(null);
                }}
                className="rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-900/30 transition hover:from-blue-500 hover:to-indigo-500"
              >
                {editingProductId ? 'Salvar Alterações' : 'Salvar Produto'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Products Table */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/20">
        <h3 className="mb-4 text-base font-bold text-slate-100">Produtos Cadastrados</h3>

        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700/70 py-12 text-center">
            <Package className="h-10 w-10 text-slate-500" />
            <p className="mt-2 text-sm font-semibold text-slate-300">Nenhum produto cadastrado</p>
            <p className="text-xs text-slate-500">Adicione produtos para gerenciar o estoque e acelerar suas vendas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-800 bg-slate-950/80 text-xs font-semibold text-slate-400">
                <tr>
                  <th className="px-4 py-3">Produto</th>
                  <th className="px-4 py-3 text-right">Custo</th>
                  <th className="px-4 py-3 text-right">Venda</th>
                  <th className="px-4 py-3 text-right">Margem</th>
                  <th className="px-4 py-3 text-right">Estoque</th>
                  <th className="px-4 py-3 text-right">Mínimo</th>
                  <th className="px-4 py-3 text-right">Total em Estoque</th>
                  <th className="px-4 py-3 text-right">Ações Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {products.map((p) => {
                  const cost = Number(p.cost_price) || 0;
                  const sale = Number(p.sale_price) || 0;
                  const qty = Number(p.stock_qty) || 0;
                  const min = Number(p.min_stock) || 0;
                  const margin = sale > 0 ? ((sale - cost) / sale) * 100 : 0;
                  const isLow = min > 0 && qty <= min;

                  return (
                    <tr key={p.id} className="transition hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-semibold text-slate-100">{p.name}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-300">
                        {formatBRL(cost)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold text-emerald-400">
                        {formatBRL(sale)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-purple-400">
                        {margin.toFixed(0)}%
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        <span
                          className={`font-bold ${
                            qty < 0 ? 'text-rose-400' : isLow ? 'text-amber-400' : 'text-slate-100'
                          }`}
                        >
                          {qty} un.
                        </span>
                        {isLow && (
                          <span className="ml-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                            Baixo
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-400">
                        {min > 0 ? `${min} un.` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-200">
                        {formatBRL(cost * Math.max(0, qty))}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onQuickSell(p)}
                            className="rounded-lg border border-emerald-600/40 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20"
                            title="Registrar venda rápida deste produto"
                          >
                            Vender
                          </button>
                          <button
                            type="button"
                            onClick={() => onQuickBuy(p)}
                            className="rounded-lg border border-blue-600/40 bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-400 hover:bg-blue-500/20"
                            title="Registrar compra / reposição"
                          >
                            Comprar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProductId(p.id);
                              setProductForm({
                                name: p.name,
                                cost_price: p.cost_price,
                                sale_price: p.sale_price,
                                stock_qty: p.stock_qty,
                                min_stock: p.min_stock || 0,
                              });
                              setShowForm(true);
                            }}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700/50 hover:text-blue-400"
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteProduct(p)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700/50 hover:text-rose-400"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Suggested Restock Section */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/20">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-100">Reposição Sugerida de Estoque</h3>
            <p className="text-xs text-slate-400">
              Cálculo baseado no consumo médio diário dos últimos 30 dias e estoque mínimo.
            </p>
          </div>
        </div>

        {replenish.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700/70 py-8 text-center">
            <Boxes className="h-8 w-8 text-emerald-400" />
            <p className="mt-2 text-sm font-semibold text-slate-300">Estoque 100% equilibrado</p>
            <p className="text-xs text-slate-500">Nenhum produto precisa de compra urgente no momento.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-800 bg-slate-950/80 text-xs font-semibold text-slate-400">
                <tr>
                  <th className="px-4 py-3">Produto</th>
                  <th className="px-4 py-3 text-right">Estoque Atual</th>
                  <th className="px-4 py-3 text-right">Estoque Mínimo</th>
                  <th className="px-4 py-3 text-right">Vendas (30d)</th>
                  <th className="px-4 py-3 text-right">Média / Dia</th>
                  <th className="px-4 py-3 text-right">Sugestão de Compra</th>
                  <th className="px-4 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {replenish.map((p) => (
                  <tr key={p.id} className="transition hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-semibold text-slate-100">{p.name}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-rose-400 font-bold">
                      {p.stock_qty} un.
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-400">
                      {p.min_stock || 0} un.
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-300">
                      {p.soldQty} un.
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-300">
                      {p.daily.toFixed(1)} /dia
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-xs font-bold text-blue-400">
                        +{p.suggested} unidades
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onQuickBuy(p)}
                        className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-500"
                      >
                        Comprar Agora
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
