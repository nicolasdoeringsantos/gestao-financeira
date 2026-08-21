import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Percent,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingBag,
  Plus,
  Clock,
  CheckCircle2,
  Boxes,
  Users,
  Target,
  Calculator,
} from 'lucide-react';
import { ChartEmpty, getChartBaseOptions } from '../Charts/CustomChartComponents.jsx';
import { formatBRL, formatPercent, monthNames } from '../../utils/formatters.js';

export const OverviewTab = ({
  user,
  transactions,
  products,
  cashEntries,
  receivables,
  onNavigateTab,
  onOpenQuickAction,
  onReceiveTransaction,
  theme,
}) => {
  const isDark = theme !== 'light';

  const netAmount = (t) =>
    t.type === 'venda'
      ? (Number(t.amount) || 0) - (Number(t.discount) || 0)
      : Number(t.amount) || 0;

  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const currentMonthStr = new Date().toISOString().slice(0, 7);

  // Totals calculations
  const stats = useMemo(() => {
    let todayRev = 0, todayExp = 0, yestRev = 0, yestExp = 0;
    let monthRev = 0, monthExp = 0, monthSalesCount = 0;

    transactions.forEach((t) => {
      const val = netAmount(t);
      const isToday = t.date === todayStr;
      const isYesterday = t.date === yesterdayStr;
      const isCurrentMonth = (t.date || '').slice(0, 7) === currentMonthStr;

      if (t.type === 'venda') {
        if (isToday) todayRev += val;
        if (isYesterday) yestRev += val;
        if (isCurrentMonth) {
          monthRev += val;
          monthSalesCount += 1;
        }
      } else if (t.type === 'compra') {
        if (isToday) todayExp += Math.abs(val);
        if (isYesterday) yestExp += Math.abs(val);
        if (isCurrentMonth) monthExp += Math.abs(val);
      }
    });

    const monthNet = monthRev - monthExp;
    const monthMargin = monthRev > 0 ? (monthNet / monthRev) * 100 : 0;
    const monthTicketMedio = monthSalesCount > 0 ? monthRev / monthSalesCount : 0;

    return {
      today: { revenue: todayRev, expenses: todayExp, net: todayRev - todayExp },
      yesterday: { revenue: yestRev, expenses: yestExp, net: yestRev - yestExp },
      month: {
        revenue: monthRev,
        expenses: monthExp,
        net: monthNet,
        margin: monthMargin,
        ticketMedio: monthTicketMedio,
        salesCount: monthSalesCount,
      },
    };
  }, [transactions, todayStr, yesterdayStr, currentMonthStr]);

  // Cash balance
  const cashBalance = useMemo(
    () =>
      cashEntries.reduce(
        (acc, c) =>
          acc + (c.type === 'entrada' ? Math.abs(Number(c.amount)) : -Math.abs(Number(c.amount))),
        0
      ),
    [cashEntries]
  );

  // Total receivables
  const receivablesTotal = useMemo(
    () => receivables.reduce((acc, t) => acc + netAmount(t), 0),
    [receivables]
  );

  // Low stock products
  const lowStock = useMemo(
    () => products.filter((p) => Number(p.min_stock) > 0 && Number(p.stock_qty) <= Number(p.min_stock)),
    [products]
  );

  // Mini trend chart for past 14 days
  const miniTrendData = useMemo(() => {
    const now = new Date();
    const days = 14;
    const buckets = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      const label = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      buckets.push({ key, label, revenue: 0, profit: 0 });
    }
    transactions.forEach((t) => {
      const b = buckets.find((item) => item.key === t.date);
      if (b) {
        const val = netAmount(t);
        if (t.type === 'venda') {
          b.revenue += val;
          b.profit += val;
        } else if (t.type === 'compra') {
          b.profit -= Math.abs(val);
        }
      }
    });
    return buckets;
  }, [transactions]);

  const hasMiniTrend = miniTrendData.some((b) => b.revenue > 0 || b.profit !== 0);

  const miniLineData = {
    labels: miniTrendData.map((b) => b.label),
    datasets: [
      {
        label: 'Faturamento',
        data: miniTrendData.map((b) => b.revenue),
        borderColor: '#3b82f6',
        backgroundColor: (ctx) => {
          const { chart } = ctx;
          const { ctx: c, chartArea } = chart;
          if (!chartArea) return 'rgba(59, 130, 246, 0.1)';
          const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          g.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
          g.addColorStop(1, 'rgba(59, 130, 246, 0.01)');
          return g;
        },
        borderWidth: 2,
        tension: 0.3,
        fill: true,
      },
      {
        label: 'Lucro Líquido',
        data: miniTrendData.map((b) => b.profit),
        borderColor: '#10b981',
        backgroundColor: (ctx) => {
          const { chart } = ctx;
          const { ctx: c, chartArea } = chart;
          if (!chartArea) return 'rgba(16, 185, 129, 0.1)';
          const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          g.addColorStop(0, 'rgba(16, 185, 129, 0.3)');
          g.addColorStop(1, 'rgba(16, 185, 129, 0.01)');
          return g;
        },
        borderWidth: 2,
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const miniChartOptions = {
    ...getChartBaseOptions(isDark),
    plugins: {
      ...getChartBaseOptions(isDark).plugins,
      legend: { display: false },
    },
  };

  // Goal & Run-rate forecast
  const monthlyGoal = Number(user?.monthly_goal) || 0;
  const goalProgress = monthlyGoal > 0 ? Math.min(100, (stats.month.revenue / monthlyGoal) * 100) : 0;
  
  // Forecast projection
  const currentDay = new Date().getDate();
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const projectedMonthRevenue = currentDay > 0 ? (stats.month.revenue / currentDay) * daysInMonth : 0;
  const projectedGoalProgress = monthlyGoal > 0 ? (projectedMonthRevenue / monthlyGoal) * 100 : 0;

  const currentMonthName = monthNames[new Date().getMonth()];

  return (
    <div className="space-y-6">
      {/* Quick Greeting & Action Bar */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-blue-950/40 p-6 shadow-xl shadow-black/20 sm:flex-row sm:items-center">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
            Visão Geral em Tempo Real
          </span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-100">
            Painel de Controle Financeiro
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Resumo consolidado das vendas, margem, saldo de caixa e alertas operacionais.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenQuickAction('venda')}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-900/30 transition hover:from-blue-500 hover:to-indigo-500 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Nova Venda
          </button>
          <button
            type="button"
            onClick={() => onOpenQuickAction('compra')}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-xs font-semibold text-slate-200 transition hover:border-slate-600 hover:bg-slate-700"
          >
            <ShoppingBag className="h-4 w-4 text-rose-400" />
            Nova Compra / Despesa
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('pricing')}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-xs font-semibold text-slate-200 transition hover:border-slate-600 hover:bg-slate-700"
          >
            <Calculator className="h-4 w-4 text-purple-400" />
            Precificar
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {/* Faturamento Hoje */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 p-4 transition-all duration-200 hover:border-slate-700 hover:bg-slate-900 shadow-md">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Faturamento Hoje</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-slate-100">{formatBRL(stats.today.revenue)}</p>
          <div className="mt-2 flex items-center gap-1 text-[11px]">
            {stats.today.revenue >= stats.yesterday.revenue ? (
              <span className="flex items-center text-emerald-400">
                <ArrowUpRight className="h-3.5 w-3.5" />
                +{formatBRL(stats.today.revenue - stats.yesterday.revenue)}
              </span>
            ) : (
              <span className="flex items-center text-rose-400">
                <ArrowDownRight className="h-3.5 w-3.5" />
                {formatBRL(stats.today.revenue - stats.yesterday.revenue)}
              </span>
            )}
            <span className="text-slate-500">vs ontem</span>
          </div>
        </div>

        {/* Faturamento do Mês */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 p-4 transition-all duration-200 hover:border-slate-700 hover:bg-slate-900 shadow-md">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Faturamento ({currentMonthName})</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-indigo-300">{formatBRL(stats.month.revenue)}</p>
          <p className="mt-2 text-[11px] text-slate-400">{stats.month.salesCount} vendas realizadas</p>
        </div>

        {/* Custos do Mês */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 p-4 transition-all duration-200 hover:border-slate-700 hover:bg-slate-900 shadow-md">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Custos ({currentMonthName})</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-rose-400">{formatBRL(stats.month.expenses)}</p>
          <p className="mt-2 text-[11px] text-slate-400">Despesas e compras</p>
        </div>

        {/* Lucro Líquido do Mês */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 p-4 transition-all duration-200 hover:border-slate-700 hover:bg-slate-900 shadow-md">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Lucro Líquido Mês</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
              <Percent className="h-4 w-4" />
            </div>
          </div>
          <p
            className={`text-xl font-extrabold ${
              stats.month.net >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatBRL(stats.month.net)}
          </p>
          <p className="mt-2 text-[11px] text-slate-400">
            Margem: <span className="font-semibold text-emerald-400">{stats.month.margin.toFixed(1)}%</span>
          </p>
        </div>

        {/* Saldo em Caixa */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 p-4 transition-all duration-200 hover:border-slate-700 hover:bg-slate-900 shadow-md">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Saldo em Caixa</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 ring-1 ring-teal-500/20">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <p
            className={`text-xl font-extrabold ${
              cashBalance >= 0 ? 'text-slate-100' : 'text-rose-400'
            }`}
          >
            {formatBRL(cashBalance)}
          </p>
          <button
            type="button"
            onClick={() => onNavigateTab('cash')}
            className="mt-2 text-[11px] font-semibold text-teal-400 hover:underline"
          >
            Ver extrato →
          </button>
        </div>

        {/* Ticket Médio Real */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 p-4 transition-all duration-200 hover:border-slate-700 hover:bg-slate-900 shadow-md">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Ticket Médio</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/20">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-purple-400">
            {formatBRL(stats.month.ticketMedio)}
          </p>
          <p className="mt-2 text-[11px] text-slate-400">Média por pedido</p>
        </div>
      </div>

      {/* Monthly Goal Progress & Projection Card */}
      {monthlyGoal > 0 && (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/20">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  Meta Mensal de Faturamento ({currentMonthName})
                </h3>
                <p className="text-xs text-slate-400">
                  Dia {currentDay} de {daysInMonth} ({Math.round((currentDay / daysInMonth) * 100)}% do mês percorrido)
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400">Atingido: </span>
              <span className="text-sm font-extrabold text-blue-400">
                {formatBRL(stats.month.revenue)}
              </span>
              <span className="text-xs text-slate-400"> de {formatBRL(monthlyGoal)}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative h-3.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                goalProgress >= 100
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : goalProgress >= 70
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500'
              }`}
              style={{ width: `${goalProgress}%` }}
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span
              className={`font-semibold ${
                goalProgress >= 100 ? 'text-emerald-400' : 'text-slate-300'
              }`}
            >
              {goalProgress >= 100 ? '🎉 Meta batida com sucesso!' : `${goalProgress.toFixed(1)}% da meta alcançada`}
            </span>

            <span className="text-slate-400">
              Ritmo atual: Projeção de{' '}
              <span className="font-bold text-indigo-300">
                {formatBRL(projectedMonthRevenue)}
              </span>{' '}
              ({projectedGoalProgress.toFixed(0)}% da meta)
            </span>
          </div>
        </section>
      )}

      {/* Two Columns: Quick Trends & Operational Alerts */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Trend Chart (2 Cols) */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/20 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-100">Tendência Rápida (14 Dias)</h3>
              <p className="text-xs text-slate-400">Faturamento vs. Lucro diário recente</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('analytics')}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300"
            >
              Ver analytics completo →
            </button>
          </div>

          <div className="h-64">
            {hasMiniTrend ? (
              <Line data={miniLineData} options={miniChartOptions} />
            ) : (
              <ChartEmpty message="Sem transações suficientes nos últimos 14 dias." />
            )}
          </div>
        </section>

        {/* Operational Alerts & Action items (1 Col) */}
        <section className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/20">
          <div>
            <h3 className="mb-3 text-base font-bold text-slate-100">Alertas Operacionais</h3>

            {/* Low stock notice */}
            {lowStock.length > 0 ? (
              <div className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs">
                <div className="flex items-center gap-2 font-bold text-amber-400">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{lowStock.length} produto(s) com estoque baixo!</span>
                </div>
                <p className="mt-1 text-slate-300">
                  Itens abaixo do estoque mínimo configurado.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigateTab('stock')}
                  className="mt-2 inline-flex items-center gap-1 font-bold text-amber-300 hover:underline"
                >
                  Repor estoque →
                </button>
              </div>
            ) : (
              <div className="mb-3 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Estoque regular. Nenhum alerta pendente.</span>
              </div>
            )}

            {/* Receivables notice */}
            {receivables.length > 0 ? (
              <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-400">Contas a Receber (Fiado)</span>
                  <span className="font-extrabold text-blue-300">
                    {formatBRL(receivablesTotal)}
                  </span>
                </div>
                <p className="mt-1 text-slate-300">
                  {receivables.length} venda(s) pendente(s) de liquidação.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigateTab('cash')}
                  className="mt-2 inline-flex items-center gap-1 font-bold text-blue-300 hover:underline"
                >
                  Liquidar fiados no caixa →
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-xs text-slate-400">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>Nenhum fiado em aberto no momento.</span>
              </div>
            )}
          </div>

          <div className="mt-4 border-t border-slate-800/80 pt-3">
            <p className="text-xs text-slate-400">Acesso rápido aos módulos:</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onNavigateTab('transactions')}
                className="rounded-lg border border-slate-800 bg-slate-950/60 p-2 text-center text-xs font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                Transações
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('customers')}
                className="rounded-lg border border-slate-800 bg-slate-950/60 p-2 text-center text-xs font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                Clientes
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
