import React, { useState } from 'react';
import { X, ShoppingBag, Plus, ArrowLeftRight, Package, Wallet } from 'lucide-react';
import { formatBRL } from '../../utils/formatters.js';

export const QuickActionModal = ({
  isOpen,
  onClose,
  products,
  categories,
  customers,
  onSaveTransaction,
  onSaveCash,
  defaultMode = 'venda',
}) => {
  if (!isOpen) return null;

  const [mode, setMode] = useState(defaultMode); // 'venda' | 'compra' | 'caixa'
  const [form, setForm] = useState({
    name: '',
    amount: '',
    quantity: 1,
    discount: '',
    category: '',
    product_id: '',
    customer_id: '',
    status: 'pago',
    date: new Date().toISOString().slice(0, 10),
    cash_type: 'entrada',
    payment_method: 'dinheiro',
  });
  const [error, setError] = useState('');

  const handleProductSelect = (e) => {
    const pId = e.target.value;
    const prod = products.find((p) => p.id === pId);
    if (prod) {
      setForm({
        ...form,
        product_id: pId,
        name: prod.name,
        amount: mode === 'venda' ? prod.sale_price : prod.cost_price,
      });
    } else {
      setForm({ ...form, product_id: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'caixa') {
      if (!form.name.trim()) {
        setError('Informe a descrição do lançamento.');
        return;
      }
      if (Number(form.amount) <= 0) {
        setError('Informe um valor maior que zero.');
        return;
      }
      const success = await onSaveCash({
        type: form.cash_type,
        description: form.name.trim(),
        amount: Math.abs(Number(form.amount)),
        payment_method: form.payment_method,
        date: form.date,
      });
      if (success) onClose();
    } else {
      if (!form.name.trim()) {
        setError('Informe a descrição ou selecione um produto.');
        return;
      }
      if (Number(form.amount) <= 0) {
        setError('Informe um valor maior que zero.');
        return;
      }
      const success = await onSaveTransaction({
        type: mode,
        name: form.name.trim(),
        amount: Math.abs(Number(form.amount)),
        quantity: Math.abs(Number(form.quantity)) || 1,
        discount: mode === 'venda' ? Math.abs(Number(form.discount)) || 0 : 0,
        category: form.category || null,
        product_id: form.product_id || null,
        customer_id: form.customer_id || null,
        status: form.status,
        date: form.date,
      });
      if (success) onClose();
    }
  };

  const inputClass =
    'w-full rounded-xl border border-slate-700/70 bg-slate-800/60 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30';
  const labelClass = 'mb-1.5 block text-xs font-semibold tracking-wide text-slate-300';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-100">Nova Operação Rápida</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="mb-5 grid grid-cols-3 gap-2">
          {[
            { id: 'venda', label: 'Venda', icon: ShoppingBag, color: 'text-emerald-400 border-emerald-500/50' },
            { id: 'compra', label: 'Compra / Custo', icon: ArrowLeftRight, color: 'text-rose-400 border-rose-500/50' },
            { id: 'caixa', label: 'Lançar Caixa', icon: Wallet, color: 'text-blue-400 border-blue-500/50' },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = mode === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setMode(item.id)}
                className={`flex flex-col items-center gap-1 rounded-xl border p-2.5 text-xs font-bold transition ${
                  isSelected
                    ? `${item.color} bg-white/5 ring-1 ring-white/10`
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode !== 'caixa' && (
            <div>
              <label className={labelClass}>Vincular Produto (Opcional)</label>
              <select className={inputClass} value={form.product_id} onChange={handleProductSelect}>
                <option value="">— Item avulso (sem estoque) —</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Estoque: {p.stock_qty} | {formatBRL(mode === 'venda' ? p.sale_price : p.cost_price)})
                  </option>
                ))}
              </select>
            </div>
          )}

          {mode === 'caixa' && (
            <div>
              <label className={labelClass}>Tipo do Lançamento</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, cash_type: 'entrada' })}
                  className={`rounded-xl border p-2 text-xs font-bold transition ${
                    form.cash_type === 'entrada'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400'
                  }`}
                >
                  + Entrada
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, cash_type: 'saida' })}
                  className={`rounded-xl border p-2 text-xs font-bold transition ${
                    form.cash_type === 'saida'
                      ? 'border-rose-500 bg-rose-500/10 text-rose-400'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400'
                  }`}
                >
                  − Saída
                </button>
              </div>
            </div>
          )}

          <div>
            <label className={labelClass}>Descrição</label>
            <input
              className={inputClass}
              placeholder="Ex.: Venda de doce, Compra de insumo..."
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Valor Total (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={inputClass}
                placeholder="0,00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
            </div>

            {mode !== 'caixa' ? (
              <div>
                <label className={labelClass}>Quantidade</label>
                <input
                  type="number"
                  step="any"
                  className={inputClass}
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                />
              </div>
            ) : (
              <div>
                <label className={labelClass}>Forma de Pagamento</label>
                <select
                  className={inputClass}
                  value={form.payment_method}
                  onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                >
                  <option value="dinheiro">Dinheiro</option>
                  <option value="pix">Pix</option>
                  <option value="cartao_debito">Cartão de Débito</option>
                  <option value="cartao_credito">Cartão de Crédito</option>
                  <option value="outros">Outros</option>
                </select>
              </div>
            )}
          </div>

          {mode === 'venda' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Condição</label>
                <select
                  className={inputClass}
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="pago">Pago (À vista)</option>
                  <option value="fiado">Fiado (A receber)</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Cliente</label>
                <select
                  className={inputClass}
                  value={form.customer_id}
                  onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
                >
                  <option value="">— Avulso —</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {error && (
            <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400 font-semibold">
              {error}
            </p>
          )}

          <div className="mt-6 flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-900/30 transition hover:from-blue-500 hover:to-indigo-500"
            >
              Salvar Operação
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
