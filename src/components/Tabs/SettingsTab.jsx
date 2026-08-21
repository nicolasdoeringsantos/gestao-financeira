import React from 'react';
import { Settings, Target, Tags, KeyRound, Plus, Trash2, ShieldCheck } from 'lucide-react';
import { formatBRL } from '../../utils/formatters.js';

export const SettingsTab = ({
  user,
  goalInput,
  setGoalInput,
  onSaveGoal,
  goalMsg,
  categories,
  newCategory,
  setNewCategory,
  onAddCategory,
  onDeleteCategory,
  passwordForm,
  setPasswordForm,
  onSavePassword,
  passwordMsg,
  passwordError,
}) => {
  const inputClass =
    'w-full rounded-xl border border-slate-700/70 bg-slate-800/60 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30';
  const labelClass = 'mb-1.5 block text-xs font-semibold tracking-wide text-slate-300';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/20">
        <h2 className="text-xl font-bold text-slate-100">Configurações & Metas do Sistema</h2>
        <p className="mt-1 text-xs text-slate-400">
          Personalize metas de faturamento, gerencie categorias e configure sua segurança.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Meta Mensal */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/20">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Meta Mensal de Faturamento</h3>
              <p className="text-xs text-slate-400">Acompanhe seu progresso na Visão Geral e nos Gráficos</p>
            </div>
          </div>

          <form onSubmit={onSaveGoal} className="space-y-3">
            <div>
              <label className={labelClass}>Valor Alvo Mensal (R$)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={inputClass}
                  placeholder="0,00"
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                />
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-900/30 transition hover:from-blue-500 hover:to-indigo-500 shrink-0"
                >
                  Salvar Meta
                </button>
              </div>
            </div>
            {goalMsg && <p className="text-xs text-emerald-400 font-semibold">{goalMsg}</p>}
          </form>
        </section>

        {/* Gerenciador de Categorias */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/20">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
              <Tags className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Categorias de Transações</h3>
              <p className="text-xs text-slate-400">Organize suas despesas e receitas para relatórios precisos</p>
            </div>
          </div>

          <form onSubmit={onAddCategory} className="mb-4 flex gap-2">
            <input
              className={inputClass}
              placeholder="Nova categoria (ex.: Embalagens, Insumos...)"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-blue-900/30 transition hover:from-blue-500 hover:to-indigo-500 shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Adicionar</span>
            </button>
          </form>

          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <span
                key={c.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1 text-xs font-medium text-slate-200"
              >
                {c.name}
                <button
                  type="button"
                  onClick={() => onDeleteCategory(c.id)}
                  className="p-0.5 text-slate-400 hover:text-rose-400"
                  title="Excluir"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </section>

        {/* Alterar Senha */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/20 lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Segurança & Alteração de Senha</h3>
              <p className="text-xs text-slate-400">Altere a senha de acesso da sua conta ({user?.email})</p>
            </div>
          </div>

          <form onSubmit={onSavePassword} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className={labelClass}>Senha Atual</label>
              <input
                type="password"
                className={inputClass}
                value={passwordForm.current_password}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, current_password: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label className={labelClass}>Nova Senha (Mínimo 8 caracteres)</label>
              <input
                type="password"
                minLength={8}
                className={inputClass}
                value={passwordForm.new_password}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, new_password: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label className={labelClass}>Confirmar Nova Senha</label>
              <input
                type="password"
                minLength={8}
                className={inputClass}
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                required
              />
            </div>

            {passwordMsg && (
              <p className="sm:col-span-3 text-xs text-emerald-400 font-semibold">{passwordMsg}</p>
            )}
            {passwordError && (
              <p className="sm:col-span-3 text-xs text-rose-400 font-semibold">{passwordError}</p>
            )}

            <div className="sm:col-span-3 flex justify-end">
              <button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-900/30 transition hover:from-blue-500 hover:to-indigo-500"
              >
                Atualizar Senha
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};
