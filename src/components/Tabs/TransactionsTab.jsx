import React, { useState, useMemo } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Download,
  Filter,
  Inbox,
  ArrowUpRight,
  ArrowDownRight,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { formatBRL, downloadCSV, formatDateBR } from '../../utils/formatters.js';

const typeLabel = { venda: 'Venda', compra: 'Compra', ajuste: 'Ajuste' };
const typeBadge = {
  venda: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/25',
  compra: 'bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/25',
  ajuste: 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/25',
};

export const TransactionsTab = ({
  transactions,
  products,
  categories,
  customers,
  newTransaction,
  setNewTransaction,
  editingTransactionId,
  setEditingTransactionId,
  onSaveTransaction,
  onDeleteTransaction,
  txError,
  setTxError,
  filters,
  setFilters,
}) => {
  const [showForm, setShowForm] = useState(false);

  const netAmount = (t) =>
    t.type === 'venda'
      ? (Number(t.amount) || 0) - (Number(t.discount) || 0)
      : Number(t.amount) || 0;

  const handleProductChange = (e) => {
    setTxError('');
    const productId = e.target.value;
    const product = products.find((p) => p.id === productId);
    if (product) {
      const type = newTransaction.type;
      setNewTransaction({
        ...newTransaction,
        product_id: productId,
        name: product.name,
        amount:
          type === 'ajuste'
            ? 0
            : type === 'venda'
              ? Number(product.sale_price) || 0
              : Number(product.cost_price) || 0,
        discount: 0,
        quantity: 1,
      });
    } else {
      setNewTransaction({ ...newTransaction, product_id: '' });
    }
  };

  const handleTypeChange = (value) => {
    setTxError('');
    const product = products.find((p) => p.id === newTransaction.product_id);
    setNewTransaction({
      ...newTransaction,
      type: value,
      discount: value === 'venda' ? newTransaction.discount : 0,
      amount:
        value === 'ajuste'
          ? 0
          : product
            ? value === 'venda'
              ? Number(product.sale_price) || 0
              : Number(product.cost_price) || 0
            : newTransaction.amount,
    });
  };

  const filteredTransactions = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    const today = new Date().toISOString().slice(0, 10);

    return transactions.filter((t) => {
      if (filters.type && t.type !== filters.type) return false;
      if (filters.category && (t.category || '') !== filters.category) return false;
      if (filters.status && t.status !== filters.status) return false;
      if (filters.period === 'hoje' && t.date !== today) return false;
      if (
        filters.period === '7d' &&
        t.date < new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10)
      )
        return false;
      if (
        filters.period === '30d' &&
        t.date < new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10)
      )
        return false;
      if (
        filters.period === '90d' &&
        t.date < new Date(Date.now() - 89 * 86400000).toISOString().slice(0, 10)
      )
        return false;
      if (q) {
        const hay = `${t.name} ${t.category} ${t.type} ${t.customer_name || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [transactions, filters]);

  const exportCSV = () => {
    downloadCSV(
      `transacoes-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        ['Data', 'Tipo', 'Descrição', 'Quantidade', 'Categoria', 'Valor (R$)', 'Desconto (R$)', 'Status', 'Cliente', 'Produto'],
        ...filteredTransactions.map((t) => [
          t.date,
          typeLabel[t.type] || t.type,
          t.name,
          t.quantity,
          t.category || 'Sem categoria',
          netAmount(t).toFixed(2),
          Number(t.discount) || 0,
          t.status === 'fiado' ? 'Fiado (A receber)' : 'Pago',
          t.customer_name || '',
          t.product_name || '',
        ]),
      ]
    );
  };

  const inputClass =
    'w-full rounded-xl border border-slate-700/70 bg-slate-800/60 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30';
  const labelClass = 'mb-1.5 block text-xs font-semibold tracking-wide text-slate-300';

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/20 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Transações & Lançamentos</h2>
          <p className="mt-1 text-xs text-slate-400">
            Acompanhe todo o histórico de vendas, compras e ajustes de estoque em um só lugar.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {transactions.length > 0 && (
            <button
              type="button"
              onClick={exportCSV}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Exportar CSV</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-blue-900/30 transition hover:from-blue-500 hover:to-indigo-500"
          >
            <Plus className="h-4 w-4" />
            <span>{showForm ? 'Fechar Formulário' : 'Nova Transação'}</span>
          </button>
        </div>
      </div>

      {/* Transaction Register/Edit Form (Collapsible or if editing) */}
      {(showForm || editingTransactionId) && (
        <section className="rounded-2xl border border-blue-500/30 bg-slate-900/90 p-5 shadow-xl shadow-black/40 animate-in fade-in duration-200">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-100">
              {editingTransactionId ? 'Editar Transação' : 'Registrar Nova Transação'}
            </h3>
            {editingTransactionId && (
              <button
                type="button"
                onClick={() => {
                  setEditingTransactionId(null);
                  setShowForm(false);
                }}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Cancelar Edição
              </button>
            )}
          </div>

          <form onSubmit={onSaveTransaction} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Produto */}
            <div className="sm:col-span-2 lg:col-span-3">
              <label className={labelClass}>Vincular Produto do Estoque (Opcional)</label>
              <select
                className={inputClass}
                name="product_id"
                value={newTransaction.product_id || ''}
                onChange={handleProductChange}
              >
                <option value="">— Item avulso (sem vínculo ao estoque) —</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Estoque: {p.stock_qty} un. | Venda: {formatBRL(Number(p.sale_price) || 0)})
                  </option>
                ))}
              </select>
            </div>

            {/* Tipo */}
            <div className="sm:col-span-2 lg:col-span-3">
              <label className={labelClass}>Tipo de Transação</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'venda', label: 'Venda (Receita)', color: 'border-emerald-500 text-emerald-400' },
                  { value: 'compra', label: 'Compra / Custo', color: 'border-rose-500 text-rose-400' },
                  { value: 'ajuste', label: 'Ajuste de Estoque', color: 'border-amber-500 text-amber-400' },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => handleTypeChange(item.value)}
                    className={`rounded-xl border p-2.5 text-center text-xs font-bold transition ${
                      newTransaction.type === item.value
                        ? `${item.color} bg-white/5 ring-1 ring-white/10`
                        : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Descrição */}
            <div className="sm:col-span-2">
              <label className={labelClass}>Descrição do Item</label>
              <input
                className={inputClass}
                name="name"
                readOnly={Boolean(newTransaction.product_id)}
                placeholder="Ex.: Venda de brigadeiro gourmet"
                value={newTransaction.name}
                onChange={(e) => setNewTransaction({ ...newTransaction, name: e.target.value })}
                required
              />
            </div>

            {/* Categoria */}
            <div>
              <label className={labelClass}>Categoria</label>
              <select
                className={inputClass}
                name="category"
                value={newTransaction.category || ''}
                onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
              >
                <option value="">— Sem categoria —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Valor */}
            <div>
              <label className={labelClass}>
                {newTransaction.type === 'venda'
                  ? 'Valor Total da Venda (R$)'
                  : newTransaction.type === 'compra'
                    ? 'Custo Total da Compra (R$)'
                    : 'Valor (R$)'}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={inputClass}
                disabled={newTransaction.type === 'ajuste'}
                placeholder="0,00"
                value={newTransaction.amount}
                onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
              />
            </div>

            {/* Quantidade */}
            <div>
              <label className={labelClass}>
                {newTransaction.type === 'ajuste' ? 'Qtd Ajustada (+ ou -)' : 'Quantidade'}
              </label>
              <input
                type="number"
                step="any"
                className={inputClass}
                value={newTransaction.quantity}
                onChange={(e) => setNewTransaction({ ...newTransaction, quantity: e.target.value })}
              />
            </div>

            {/* Desconto (se venda) */}
            {newTransaction.type === 'venda' && (
              <div>
                <label className={labelClass}>Desconto Concedido (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className={inputClass}
                  placeholder="0,00"
                  value={newTransaction.discount}
                  onChange={(e) => setNewTransaction({ ...newTransaction, discount: e.target.value })}
                />
              </div>
            )}

            {/* Status (Pago vs Fiado) */}
            {newTransaction.type === 'venda' && (
              <div>
                <label className={labelClass}>Condição de Pagamento</label>
                <select
                  className={inputClass}
                  value={newTransaction.status}
                  onChange={(e) => setNewTransaction({ ...newTransaction, status: e.target.value })}
                >
                  <option value="pago">À vista / Pago</option>
                  <option value="fiado">Fiado (A receber)</option>
                </select>
              </div>
            )}

            {/* Cliente */}
            {newTransaction.type === 'venda' && (
              <div>
                <label className={labelClass}>Cliente Vinculado</label>
                <select
                  className={inputClass}
                  value={newTransaction.customer_id || ''}
                  onChange={(e) => setNewTransaction({ ...newTransaction, customer_id: e.target.value })}
                >
                  <option value="">— Cliente avulso —</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Data */}
            <div>
              <label className={labelClass}>Data da Operação</label>
              <input
                type="date"
                className={inputClass}
                value={newTransaction.date}
                onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
              />
            </div>

            {/* Error banner */}
            {txError && (
              <div className="sm:col-span-2 lg:col-span-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
                {txError}
              </div>
            )}

            {/* Action buttons */}
            <div className="sm:col-span-2 lg:col-span-3 flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingTransactionId(null);
                }}
                className="rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-900/30 transition hover:from-blue-500 hover:to-indigo-500"
              >
                {editingTransactionId ? 'Salvar Alterações' : 'Confirmar Transação'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Filter toolbar */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg shadow-black/20">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <input
            className={inputClass}
            placeholder="Buscar por descrição, cliente..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />

          <select
            className={inputClass}
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          >
            <option value="">Todos os tipos</option>
            <option value="venda">Vendas</option>
            <option value="compra">Compras</option>
            <option value="ajuste">Ajustes</option>
          </select>

          <select
            className={inputClass}
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          >
            <option value="">Todas as categorias</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            className={inputClass}
            value={filters.status || ''}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">Todos os status</option>
            <option value="pago">Pago (À vista)</option>
            <option value="fiado">Fiado (A receber)</option>
          </select>

          <select
            className={inputClass}
            value={filters.period}
            onChange={(e) => setFilters({ ...filters, period: e.target.value })}
          >
            <option value="">Todo o período</option>
            <option value="hoje">Hoje</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
          </select>

          {(filters.search || filters.type || filters.category || filters.status || filters.period) && (
            <button
              type="button"
              onClick={() =>
                setFilters({ search: '', type: '', category: '', status: '', period: '' })
              }
              className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-700"
            >
              <X className="h-3.5 w-3.5" />
              Limpar Filtros
            </button>
          )}
        </div>
      </section>

      {/* Transactions list */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/20">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-100">
            Histórico ({filteredTransactions.length} registros)
          </h3>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700/70 py-12 text-center">
            <Inbox className="h-10 w-10 text-slate-500" />
            <p className="mt-2 text-sm font-semibold text-slate-300">Nenhuma transação encontrada</p>
            <p className="text-xs text-slate-500">Tente ajustar os filtros ou adicione uma nova transação.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-800 bg-slate-950/80 text-xs font-semibold text-slate-400">
                <tr>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Descrição / Cliente</th>
                  <th className="px-4 py-3 text-right">Qtd</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3 text-right">Valor Líquido</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredTransactions.map((t) => (
                  <tr key={t.id} className="transition hover:bg-slate-800/40">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-300">
                      {formatDateBR(t.date)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                          typeBadge[t.type] || typeBadge.venda
                        }`}
                      >
                        {typeLabel[t.type] || t.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-100">{t.name}</span>
                        {Number(t.discount) > 0 && (
                          <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] text-rose-400">
                            −{formatBRL(Number(t.discount))} desc.
                          </span>
                        )}
                        {t.type === 'venda' && t.status === 'fiado' && (
                          <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
                            Fiado
                          </span>
                        )}
                      </div>
                      {t.customer_name && (
                        <p className="text-[11px] text-sky-400">Cliente: {t.customer_name}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-300">
                      {Number(t.quantity) || 1}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {t.category || '—'}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-bold tabular-nums ${
                        t.type === 'venda'
                          ? 'text-emerald-400'
                          : t.type === 'compra'
                            ? 'text-rose-400'
                            : 'text-slate-400'
                      }`}
                    >
                      {t.type === 'ajuste'
                        ? '—'
                        : t.type === 'compra'
                          ? formatBRL(-Math.abs(netAmount(t)))
                          : formatBRL(netAmount(t))}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTransactionId(t.id);
                            setNewTransaction({
                              id: t.id,
                              type: t.type,
                              name: t.name,
                              amount: t.amount,
                              discount: Number(t.discount) || 0,
                              quantity: t.quantity,
                              category: t.category || '',
                              date: t.date,
                              product_id: t.product_id || '',
                              status: t.status === 'fiado' ? 'fiado' : 'pago',
                              customer_id: t.customer_id || '',
                            });
                            setShowForm(true);
                          }}
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-700/50 hover:text-blue-400"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteTransaction(t.id)}
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-700/50 hover:text-rose-400"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
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
