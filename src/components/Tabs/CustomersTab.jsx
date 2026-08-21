import React, { useState, useMemo } from 'react';
import { Users, Plus, Pencil, Trash2, Phone, ShoppingCart, AlertCircle } from 'lucide-react';
import { formatBRL } from '../../utils/formatters.js';

export const CustomersTab = ({
  customers,
  customerForm,
  setCustomerForm,
  editingCustomerId,
  setEditingCustomerId,
  onSaveCustomer,
  onDeleteCustomer,
  customerMsg,
  customerError,
}) => {
  const [showForm, setShowForm] = useState(false);

  const customerStats = useMemo(() => {
    let totalPurchases = 0;
    let totalOpenDebt = 0;

    customers.forEach((c) => {
      totalPurchases += Number(c.total_spent) || 0;
      totalOpenDebt += Number(c.open_balance) || 0;
    });

    return { totalPurchases, totalOpenDebt };
  }, [customers]);

  const inputClass =
    'w-full rounded-xl border border-slate-700/70 bg-slate-800/60 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30';
  const labelClass = 'mb-1.5 block text-xs font-semibold tracking-wide text-slate-300';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/20 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Carteira de Clientes</h2>
          <p className="mt-1 text-xs text-slate-400">
            Acompanhe o volume de compras, histórico de pedidos e saldos em aberto de cada cliente.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowForm(!showForm);
            setEditingCustomerId(null);
          }}
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-blue-900/30 transition hover:from-blue-500 hover:to-indigo-500"
        >
          <Plus className="h-4 w-4" />
          <span>{showForm ? 'Fechar Formulário' : 'Novo Cliente'}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-md">
          <p className="text-xs text-slate-400">Total de Clientes</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-100">{customers.length}</p>
          <p className="mt-1 text-[11px] text-slate-500">Cadastros ativos</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-md">
          <p className="text-xs text-slate-400">Faturamento Acumulado</p>
          <p className="mt-1 text-2xl font-extrabold text-emerald-400">
            {formatBRL(customerStats.totalPurchases)}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Total vendido para clientes cadastrados</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-md">
          <p className="text-xs text-slate-400">Total em Aberto (Fiado)</p>
          <p
            className={`mt-1 text-2xl font-extrabold ${
              customerStats.totalOpenDebt > 0 ? 'text-amber-400' : 'text-slate-100'
            }`}
          >
            {formatBRL(customerStats.totalOpenDebt)}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Saldos devedores pendentes</p>
        </div>
      </div>

      {/* Form to Add / Edit */}
      {(showForm || editingCustomerId) && (
        <section className="rounded-2xl border border-blue-500/30 bg-slate-900/90 p-5 shadow-xl shadow-black/40 animate-in fade-in duration-200">
          <h3 className="mb-4 text-base font-bold text-slate-100">
            {editingCustomerId ? 'Editar Dados do Cliente' : 'Cadastrar Novo Cliente'}
          </h3>

          <form onSubmit={onSaveCustomer} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className={labelClass}>Nome Completo</label>
              <input
                className={inputClass}
                placeholder="Ex.: Maria Fernanda Silva"
                value={customerForm.name}
                onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className={labelClass}>WhatsApp / Telefone (Opcional)</label>
              <input
                className={inputClass}
                placeholder="Ex.: (11) 98765-4321"
                value={customerForm.phone}
                onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
              />
            </div>

            <div className="flex items-end gap-3 sm:col-span-2 lg:col-span-1">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingCustomerId(null);
                }}
                className="rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-900/30 transition hover:from-blue-500 hover:to-indigo-500"
              >
                {editingCustomerId ? 'Salvar Alterações' : 'Cadastrar Cliente'}
              </button>
            </div>

            {customerMsg && (
              <p className="sm:col-span-2 lg:col-span-3 text-xs text-emerald-400 font-semibold">
                {customerMsg}
              </p>
            )}
            {customerError && (
              <p className="sm:col-span-2 lg:col-span-3 text-xs text-rose-400 font-semibold">
                {customerError}
              </p>
            )}
          </form>
        </section>
      )}

      {/* Customers Table */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/20">
        <h3 className="mb-4 text-base font-bold text-slate-100">Clientes Cadastrados</h3>

        {customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700/70 py-10 text-center">
            <Users className="h-10 w-10 text-slate-500" />
            <p className="mt-2 text-sm font-semibold text-slate-300">Nenhum cliente cadastrado</p>
            <p className="text-xs text-slate-500">Cadastre clientes para registrar fiados e histórico de compras.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-800 bg-slate-950/80 text-xs font-semibold text-slate-400">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Contato</th>
                  <th className="px-4 py-3 text-right">Compras Realizadas</th>
                  <th className="px-4 py-3 text-right">Total Comprado</th>
                  <th className="px-4 py-3 text-right">Saldo Devedor (Fiado)</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {customers.map((c) => {
                  const debt = Number(c.open_balance) || 0;
                  return (
                    <tr key={c.id} className="transition hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-semibold text-slate-100">{c.name}</td>
                      <td className="px-4 py-3 text-slate-400">
                        {c.phone ? (
                          <span className="flex items-center gap-1.5 text-xs text-slate-300">
                            <Phone className="h-3.5 w-3.5 text-slate-500" />
                            {c.phone}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-300">
                        {Number(c.total_sales) || 0} compras
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold text-emerald-400">
                        {formatBRL(Number(c.total_spent) || 0)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {debt > 0 ? (
                          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-400">
                            {formatBRL(debt)}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">Sem dívidas</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCustomerId(c.id);
                              setCustomerForm({ name: c.name, phone: c.phone || '' });
                              setShowForm(true);
                            }}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700/50 hover:text-blue-400"
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteCustomer(c)}
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
    </div>
  );
};
