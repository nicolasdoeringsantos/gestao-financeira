import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  ArrowLeftRight,
  Package,
  Wallet,
  Users,
  Calculator,
  Settings,
  Sun,
  Moon,
  Plus,
  LogOut,
  Wheat,
} from 'lucide-react';

export const tabs = [
  { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
  { id: 'bakery', label: 'Padaria & Fichas', icon: Wheat },
  { id: 'analytics', label: 'Gráficos & Analytics', icon: TrendingUp },
  { id: 'transactions', label: 'Transações', icon: ArrowLeftRight },
  { id: 'stock', label: 'Estoque', icon: Package },
  { id: 'cash', label: 'Caixa & Fiado', icon: Wallet },
  { id: 'customers', label: 'Clientes', icon: Users },
  { id: 'pricing', label: 'Precificação', icon: Calculator },
  { id: 'settings', label: 'Configurações', icon: Settings },
];

export const Navbar = ({
  activeTab,
  setActiveTab,
  theme,
  setTheme,
  user,
  onLogout,
  onOpenQuickAction,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#0b1220]/85 backdrop-blur-md transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Top bar */}
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 shadow-md shadow-indigo-950/50">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-lg font-extrabold tracking-tight text-transparent">
                  GestãoPro
                </span>
                <span className="rounded-md border border-blue-500/30 bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-blue-400">
                  Financeiro
                </span>
              </div>
              <p className="hidden text-xs text-slate-400 sm:block">
                Controle inteligente, precificação e estoque
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Action Button */}
            <button
              type="button"
              onClick={onOpenQuickAction}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-blue-900/30 transition-all duration-200 hover:from-blue-500 hover:to-indigo-500 active:scale-95 sm:text-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Nova Ação</span>
            </button>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="rounded-xl border border-slate-800 bg-slate-900/80 p-2.5 text-slate-300 transition hover:border-slate-700 hover:bg-slate-800 hover:text-white"
              aria-label={theme === 'light' ? 'Tema escuro' : 'Tema claro'}
              title={theme === 'light' ? 'Tema escuro' : 'Tema claro'}
            >
              {theme === 'light' ? <Moon className="h-4 w-4 text-amber-500" /> : <Sun className="h-4 w-4 text-amber-400" />}
            </button>

            {/* User details */}
            {user && (
              <div className="hidden items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-300 md:flex">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="max-w-[150px] truncate font-medium text-slate-200">{user.email}</span>
              </div>
            )}

            {/* Logout button */}
            <button
              type="button"
              onClick={onLogout}
              className="rounded-xl border border-slate-800 bg-slate-900/80 p-2.5 text-slate-400 transition hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-400"
              title="Sair da conta"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Desktop & Tablet) */}
        <nav className="flex space-x-1 overflow-x-auto py-2 no-scrollbar border-t border-slate-800/60">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`group flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 shadow-sm ring-1 ring-blue-500/30'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <Icon
                  className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
