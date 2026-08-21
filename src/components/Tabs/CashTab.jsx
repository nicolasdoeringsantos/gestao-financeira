import React, { useState, useMemo } from 'react';
import {
  Wallet,
  Plus,
  Trash2,
  CheckCircle2,
  Download,
  ArrowDownLeft,
  ArrowUpRight,
  ClipboardList,
  DollarSign,
} from 'lucide-react';
import { formatBRL, downloadCSV, formatDateBR } from '../../utils/formatters.js';

const paymentLabels = {
  dinheiro: 'Dinheiro',
  pix: 'Pix',
  cartao_debito: 'Cartão de Débito',
  cartao_credito: 'Cartão de Crédito',
  outros: 'Outros',
};

const paymentOptions = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'pix', label: 'Pix' },
  { value: 'cartao_debito', label: 'Cartão de Débito' },
  { value: 'cartao_credito', label: 'Cartão de Crédito' },
  { value: 'outros', label: 'Outros' },
];

export const CashTab = ({
  cashEntries,
  cashForm,
  setCashForm,
  onSaveCash,
  onDeleteCash,
  cashError,
  receivables,
  onReceiveTransaction,
  receivePayment,
  setReceivePayment,
}) => {
  const [showCashForm, setShowCashForm] = useState(false);

  const netAmount = (t) =>
    t.type === 'venda'
      ? (Number(t.amount) || 0) - (Number(t.discount) || 0)
      : Number(t.amount) || 0;

  const cashSummary = useMemo(() => {
    let entradas = 0;
    let saidas = 0;

    cashEntries.forEach((c) => {
      const val = Math.abs(Number(c.amount)) || 0;
      if (c.type === 'entrada') entradas += val;
      else if (c.type === 'saida') saidas += val;
    });

    const balance = entradas - saidas;
    const receivablesTotal = receivables.reduce((acc, t) => acc + netAmount(t), 0);

    return { entradas, saidas, balance, receivablesTotal };
  }, [cashEntries, receivables]);

  const exportCashCSV = () => {
    downloadCSV(
      `caixa-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        ['Data', 'Tipo', 'Descrição', 'Forma de Pagamento', 'Valor (R$)'],
        ...cashEntries.map((c) => [
          c.date,
          c.type === 'entrada' ? 'Entrada' : 'Saída',
          c.description,
          paymentLabels[c.payment_method] || c.payment_method,
          c.type === 'entrada' ? c.amount : -Math.abs(c.amount),
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
          <h2 className="text-xl font-bold text-slate-100">Fluxo de Caixa & Contas a Receber</h2>
          <p className="mt-1 text-xs text-slate-400">
            Acompanhe o saldo financeiro real, entradas, retiradas e liquidação de fiados.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {cashEntries.length > 0 && (
            <button
              type="button"
              onClick={exportCashCSV}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Exportar Extrato</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowCashForm(!showCashForm)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-blue-900/30 transition hover:from-blue-500 hover:to-indigo-500"
          >
            <Plus className="h-4 w-4" />
            <span>{showCashForm ? 'Fechar Formulário' : 'Novo Lançamento'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-md">
          <p className="text-xs text-slate-400">Saldo Atual em Caixa</p>
          <p
            className={`mt-1 text-2xl font-extrabold ${
              cashSummary.balance >= 0 ? 'text-slate-100' : 'text-rose-400'
            }`}
          >
            {formatBRL(cashSummary.balance)}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Disponibilidade líquida</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-md">
          <p className="text-xs text-slate-400">Total Entradas</p>
          <p className="mt-1 text-2xl font-extrabold text-emerald-400">
            {formatBRL(cashSummary.entradas)}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Recebimentos no caixa</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-md">
          <p className="text-xs text-slate-400">Total Saídas</p>
          <p className="mt-1 text-2xl font-extrabold text-rose-400">
            {formatBRL(cashSummary.saidas)}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Pagamentos e sangrias</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-md">
          <p className="text-xs text-slate-400">Fiados a Receber</p>
          <p className="mt-1 text-2xl font-extrabold text-amber-400">
            {formatBRL(cashSummary.receivablesTotal)}
          </p>
          <p className="mt-1 text-[11px] text-amber-500 font-semibold">
            {receivables.length} vendas pendentes
          </p>
        </div>
      </div>

      {/* Cash Form (Collapsible) */}
      {showCashForm && (
        <section className="rounded-2xl border border-blue-500/30 bg-slate-900/90 p-5 shadow-xl shadow-black/40 animate-in fade-in duration-200">
          <h3 className="mb-4 text-base font-bold text-slate-100">Novo Lançamento de Caixa</h3>

          <form onSubmit={onSaveCash} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className={labelClass}>Tipo de Lançamento</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCashForm({ ...cashForm, type: 'entrada' })}
                  className={`rounded-xl border p-2 text-center text-xs font-bold transition ${
                    cashForm.type === 'entrada'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30'
                      : 'border-slate-700 bg-slate-800/40 text-slate-400'
                  }`}
                >
                  + Entrada
                </button>
                <button
                  type="button"
                  onClick={() => setCashForm({ ...cashForm, type: 'saida' })}
                  className={`rounded-xl border p-2 text-center text-xs font-bold transition ${
                    cashForm.type === 'saida'
                      ? 'border-rose-500 bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/30'
                      : 'border-slate-700 bg-slate-800/40 text-slate-400'
                  }`}
                >
                  − Saída
                </button>
              </div>
            </div>

            <div className="lg:col-span-2">
              <label className={labelClass}>Descrição do Lançamento</label>
              <input
                className={inputClass}
                name="description"
                placeholder="Ex.: Aporte inicial, Pagamento de luz, Venda rápida..."
                value={cashForm.description}
                onChange={(e) => setCashForm({ ...cashForm, description: e.target.value })}
                required
              />
            </div>

            <div>
              <label className={labelClass}>Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={inputClass}
                placeholder="0,00"
                value={cashForm.amount}
                onChange={(e) => setCashForm({ ...cashForm, amount: e.target.value })}
                required
              />
            </div>

            <div>
              <label className={labelClass}>Forma de Pagamento</label>
              <select
                className={inputClass}
                value={cashForm.payment_method}
                onChange={(e) => setCashForm({ ...cashForm, payment_method: e.target.value })}
              >
                {paymentOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Data do Lançamento</label>
              <input
                type="date"
                className={inputClass}
                value={cashForm.date}
                onChange={(e) => setCashForm({ ...cashForm, date: e.target.value })}
              />
            </div>

            {cashError && (
              <div className="sm:col-span-2 lg:col-span-5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
                {cashError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 sm:col-span-2 lg:col-span-4">
              <button
                type="button"
                onClick={() => setShowCashForm(false)}
                className="rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-900/30 transition hover:from-blue-500 hover:to-indigo-500"
              >
                Registrar no Caixa
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Contas a Receber (Fiados) */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/20">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-100">Contas a Receber (Fiados Pendentes)</h3>
            <p className="text-xs text-slate-400">
              Vendas registradas a prazo. Ao receber, o valor entra no fluxo de caixa automaticamente.
            </p>
          </div>

          {receivables.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span>Receber como:</span>
              <select
                className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-100 outline-none"
                value={receivePayment}
                onChange={(e) => setReceivePayment(e.target.value)}
              >
                {paymentOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {receivables.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700/70 py-8 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            <p className="mt-2 text-sm font-semibold text-slate-300">Sem fiados em aberto</p>
            <p className="text-xs text-slate-500">Todas as vendas a receber foram liquidadas com sucesso.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-800 bg-slate-950/80 text-xs font-semibold text-slate-400">
                <tr>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Descrição</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3 text-right">Valor Pendente</th>
                  <th className="px-4 py-3 text-right">Liquidação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {receivables.map((t) => (
                  <tr key={t.id} className="transition hover:bg-slate-800/40">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-300">
                      {formatDateBR(t.date)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-100">{t.name}</td>
                    <td className="px-4 py-3 text-slate-300">{t.customer_name || 'Cliente Avulso'}</td>
                    <td className="px-4 py-3 text-right font-extrabold tabular-nums text-amber-400">
                      {formatBRL(netAmount(t))}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onReceiveTransaction(t.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-600/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400 transition hover:bg-emerald-500/20"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Baixar Fiado
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Extrato do Caixa */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/20">
        <h3 className="mb-4 text-base font-bold text-slate-100">Extrato de Lançamentos de Caixa</h3>

        {cashEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700/70 py-8 text-center">
            <Wallet className="h-8 w-8 text-slate-500" />
            <p className="mt-2 text-sm font-semibold text-slate-300">Nenhum lançamento no caixa</p>
            <p className="text-xs text-slate-500">Adicione entradas e saídas para manter o extrato atualizado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-800 bg-slate-950/80 text-xs font-semibold text-slate-400">
                <tr>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Descrição</th>
                  <th className="px-4 py-3">Forma de Pagamento</th>
                  <th className="px-4 py-3 text-right">Valor</th>
                  <th className="px-4 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {cashEntries.map((c) => (
                  <tr key={c.id} className="transition hover:bg-slate-800/40">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-300">
                      {formatDateBR(c.date)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          c.type === 'entrada'
                            ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/25'
                            : 'bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/25'
                        }`}
                      >
                        {c.type === 'entrada' ? '+ Entrada' : '− Saída'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-100">{c.description}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {paymentLabels[c.payment_method] || c.payment_method}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-extrabold tabular-nums ${
                        c.type === 'entrada' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {c.type === 'entrada' ? '+' : '−'} {formatBRL(Math.abs(Number(c.amount)))}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onDeleteCash(c.id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700/50 hover:text-rose-400"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
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
