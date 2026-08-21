import React, { useState, useMemo } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  TrendingUp,
  TrendingDown,
  Percent,
  Calendar,
  PieChart as PieIcon,
  BarChart3,
  CreditCard,
  Target,
  Download,
} from 'lucide-react';
import {
  ChartEmpty,
  getChartBaseOptions,
  getDoughnutOptions,
} from '../Charts/CustomChartComponents.jsx';
import {
  formatBRL,
  formatPercent,
  monthNames,
  chartPalette,
  downloadCSV,
} from '../../utils/formatters.js';

export const AnalyticsTab = ({
  transactions,
  cashEntries,
  products,
  theme,
  selectedMonth,
  setSelectedMonth,
}) => {
  const isDark = theme !== 'light';
  const [timeRange, setTimeRange] = useState('6m'); // '7d', '30d', '6m', '12m'

  const netAmount = (t) =>
    t.type === 'venda'
      ? (Number(t.amount) || 0) - (Number(t.discount) || 0)
      : Number(t.amount) || 0;

  // Compute time buckets based on selected timeRange
  const trendData = useMemo(() => {
    const now = new Date();
    let buckets = [];

    if (timeRange === '7d') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        const key = d.toISOString().slice(0, 10);
        const label = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
        buckets.push({ key, label, revenue: 0, expenses: 0, countSales: 0 });
      }
      transactions.forEach((t) => {
        const b = buckets.find((item) => item.key === t.date);
        if (b) {
          const val = netAmount(t);
          if (t.type === 'venda') {
            b.revenue += val;
            b.countSales += 1;
          } else if (t.type === 'compra') {
            b.expenses += Math.abs(val);
          }
        }
      });
    } else if (timeRange === '30d') {
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        const key = d.toISOString().slice(0, 10);
        const label = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
        buckets.push({ key, label, revenue: 0, expenses: 0, countSales: 0 });
      }
      transactions.forEach((t) => {
        const b = buckets.find((item) => item.key === t.date);
        if (b) {
          const val = netAmount(t);
          if (t.type === 'venda') {
            b.revenue += val;
            b.countSales += 1;
          } else if (t.type === 'compra') {
            b.expenses += Math.abs(val);
          }
        }
      });
    } else if (timeRange === '6m') {
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = `${monthNames[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`;
        buckets.push({ key, label, revenue: 0, expenses: 0, countSales: 0 });
      }
      transactions.forEach((t) => {
        const key = (t.date || '').slice(0, 7);
        const b = buckets.find((item) => item.key === key);
        if (b) {
          const val = netAmount(t);
          if (t.type === 'venda') {
            b.revenue += val;
            b.countSales += 1;
          } else if (t.type === 'compra') {
            b.expenses += Math.abs(val);
          }
        }
      });
    } else {
      // 12m
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = `${monthNames[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`;
        buckets.push({ key, label, revenue: 0, expenses: 0, countSales: 0 });
      }
      transactions.forEach((t) => {
        const key = (t.date || '').slice(0, 7);
        const b = buckets.find((item) => item.key === key);
        if (b) {
          const val = netAmount(t);
          if (t.type === 'venda') {
            b.revenue += val;
            b.countSales += 1;
          } else if (t.type === 'compra') {
            b.expenses += Math.abs(val);
          }
        }
      });
    }

    return buckets;
  }, [transactions, timeRange]);

  const hasTrendData = trendData.some((b) => b.revenue > 0 || b.expenses > 0);

  // Line Chart Config for Revenue vs Expenses vs Net Profit
  const mainLineData = {
    labels: trendData.map((b) => b.label),
    datasets: [
      {
        label: 'Faturamento',
        data: trendData.map((b) => b.revenue),
        borderColor: '#3b82f6',
        backgroundColor: (ctx) => {
          const { chart } = ctx;
          const { ctx: c, chartArea } = chart;
          if (!chartArea) return 'rgba(59, 130, 246, 0.1)';
          const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          g.addColorStop(0, 'rgba(59, 130, 246, 0.35)');
          g.addColorStop(1, 'rgba(59, 130, 246, 0.01)');
          return g;
        },
        borderWidth: 2.5,
        tension: 0.35,
        fill: true,
        pointBackgroundColor: '#3b82f6',
        pointHoverRadius: 6,
      },
      {
        label: 'Custos',
        data: trendData.map((b) => b.expenses),
        borderColor: '#f43f5e',
        backgroundColor: (ctx) => {
          const { chart } = ctx;
          const { ctx: c, chartArea } = chart;
          if (!chartArea) return 'rgba(244, 63, 94, 0.1)';
          const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          g.addColorStop(0, 'rgba(244, 63, 94, 0.3)');
          g.addColorStop(1, 'rgba(244, 63, 94, 0.01)');
          return g;
        },
        borderWidth: 2,
        tension: 0.35,
        fill: true,
        pointBackgroundColor: '#f43f5e',
        pointHoverRadius: 6,
      },
      {
        label: 'Lucro Líquido',
        data: trendData.map((b) => b.revenue - b.expenses),
        borderColor: '#10b981',
        backgroundColor: (ctx) => {
          const { chart } = ctx;
          const { ctx: c, chartArea } = chart;
          if (!chartArea) return 'rgba(16, 185, 129, 0.1)';
          const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          g.addColorStop(0, 'rgba(16, 185, 129, 0.35)');
          g.addColorStop(1, 'rgba(16, 185, 129, 0.01)');
          return g;
        },
        borderWidth: 2.5,
        tension: 0.35,
        fill: true,
        pointBackgroundColor: '#10b981',
        pointHoverRadius: 6,
      },
    ],
  };

  // Expenses by Category Breakdown
  const expensesByCategory = useMemo(() => {
    const map = {};
    let total = 0;
    transactions.forEach((t) => {
      if (t.type !== 'compra') return;
      const cat = (t.category || '').trim() || 'Sem categoria';
      const val = Math.abs(Number(t.amount)) || 0;
      map[cat] = (map[cat] || 0) + val;
      total += val;
    });

    const list = Object.entries(map)
      .map(([label, value]) => ({
        label,
        value,
        percent: total > 0 ? (value / total) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);

    return { list, total };
  }, [transactions]);

  const expensesDoughnutData = {
    labels: expensesByCategory.list.map((e) => e.label),
    datasets: [
      {
        data: expensesByCategory.list.map((e) => e.value),
        backgroundColor: chartPalette,
        borderWidth: 2,
        borderColor: isDark ? '#0f172a' : '#ffffff',
        hoverOffset: 4,
      },
    ],
  };

  // Payment methods breakdown
  const paymentMethodsData = useMemo(() => {
    const map = {
      dinheiro: { label: 'Dinheiro', value: 0 },
      pix: { label: 'Pix', value: 0 },
      cartao_debito: { label: 'Cartão de Débito', value: 0 },
      cartao_credito: { label: 'Cartão de Crédito', value: 0 },
      outros: { label: 'Outros', value: 0 },
    };

    cashEntries.forEach((c) => {
      if (c.type === 'entrada') {
        const method = c.payment_method || 'dinheiro';
        if (map[method]) {
          map[method].value += Math.abs(Number(c.amount)) || 0;
        } else {
          map.outros.value += Math.abs(Number(c.amount)) || 0;
        }
      }
    });

    const list = Object.values(map).filter((item) => item.value > 0);
    const total = list.reduce((acc, i) => acc + i.value, 0);

    return { list, total };
  }, [cashEntries]);

  const paymentDoughnutData = {
    labels: paymentMethodsData.list.map((i) => i.label),
    datasets: [
      {
        data: paymentMethodsData.list.map((i) => i.value),
        backgroundColor: [
          '#10b981', // green - dinheiro
          '#06b6d4', // cyan - pix
          '#3b82f6', // blue - debito
          '#8b5cf6', // purple - credito
          '#64748b', // slate - outros
        ],
        borderWidth: 2,
        borderColor: isDark ? '#0f172a' : '#ffffff',
      },
    ],
  };

  // Top profitable products
  const productProfitRanking = useMemo(() => {
    const map = {};
    transactions.forEach((t) => {
      if (t.type !== 'venda') return;
      if (t.product_id) {
        const cost = Number(t.product_cost) || 0;
        const sale = Number(t.product_sale) || (Number(t.amount) / Math.max(1, Number(t.quantity)));
        const qty = Math.abs(Number(t.quantity)) || 1;
        const profit = qty * (sale - cost) - (Number(t.discount) || 0);
        const key = t.product_id;
        if (!map[key]) {
          map[key] = { name: t.product_name || t.name, profit: 0, qty: 0, revenue: 0 };
        }
        map[key].profit += profit;
        map[key].qty += qty;
        map[key].revenue += netAmount(t);
      } else {
        const name = (t.name || '').trim();
        if (!name) return;
        if (!map[name]) {
          map[name] = { name, profit: 0, qty: 0, revenue: 0 };
        }
        const val = netAmount(t);
        map[name].profit += val;
        map[name].qty += Math.abs(Number(t.quantity)) || 1;
        map[name].revenue += val;
      }
    });

    return Object.values(map)
      .filter((p) => p.profit > 0)
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 6);
  }, [transactions]);

  const productProfitBarData = {
    labels: productProfitRanking.map((p) => p.name),
    datasets: [
      {
        label: 'Lucro gerado (R$)',
        data: productProfitRanking.map((p) => p.profit),
        backgroundColor: '#8b5cf6',
        borderRadius: 8,
      },
    ],
  };

  // Cash entries flow evolution (Last 7 days or 30 days)
  const cashFlowTrend = useMemo(() => {
    const now = new Date();
    const days = timeRange === '7d' ? 7 : 14;
    const buckets = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      const label = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      buckets.push({ key, label, entrada: 0, saida: 0 });
    }
    cashEntries.forEach((c) => {
      const b = buckets.find((item) => item.key === c.date);
      if (b) {
        const val = Math.abs(Number(c.amount)) || 0;
        if (c.type === 'entrada') b.entrada += val;
        else if (c.type === 'saida') b.saida += val;
      }
    });
    return buckets;
  }, [cashEntries, timeRange]);

  const cashFlowBarData = {
    labels: cashFlowTrend.map((b) => b.label),
    datasets: [
      {
        label: 'Entradas (R$)',
        data: cashFlowTrend.map((b) => b.entrada),
        backgroundColor: '#10b981',
        borderRadius: 6,
      },
      {
        label: 'Saídas (R$)',
        data: cashFlowTrend.map((b) => b.saida),
        backgroundColor: '#f43f5e',
        borderRadius: 6,
      },
    ],
  };

  // Annual comparison data
  const currentYear = new Date().getFullYear();
  const annualComparison = useMemo(() => {
    const cyKey = String(currentYear);
    const pyKey = String(currentYear - 1);
    let cyRev = 0, cyExp = 0, pyRev = 0, pyExp = 0;

    transactions.forEach((t) => {
      const yr = (t.date || '').slice(0, 4);
      const val = netAmount(t);
      if (yr === cyKey) {
        if (t.type === 'venda') cyRev += val;
        else if (t.type === 'compra') cyExp += Math.abs(val);
      } else if (yr === pyKey) {
        if (t.type === 'venda') pyRev += val;
        else if (t.type === 'compra') pyExp += Math.abs(val);
      }
    });

    return {
      hasData: cyRev > 0 || cyExp > 0 || pyRev > 0 || pyExp > 0,
      datasets: [
        {
          label: `${currentYear}`,
          data: [cyRev, cyExp, cyRev - cyExp],
          backgroundColor: '#3b82f6',
          borderRadius: 8,
        },
        {
          label: `${currentYear - 1}`,
          data: [pyRev, pyExp, pyRev - pyExp],
          backgroundColor: '#94a3b8',
          borderRadius: 8,
        },
      ],
    };
  }, [transactions, currentYear]);

  // Periodic detailed performance table with REAL Ticket Médio
  const periodStats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const weekAgo = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
    const monthKey = selectedMonth || new Date().toISOString().slice(0, 7);
    const yearKey = String(new Date().getFullYear());

    const compute = (filterFn) => {
      const list = transactions.filter(filterFn);
      let revenue = 0;
      let expenses = 0;
      let salesCount = 0;

      list.forEach((t) => {
        const val = netAmount(t);
        if (t.type === 'venda') {
          revenue += val;
          salesCount += 1;
        } else if (t.type === 'compra') {
          expenses += Math.abs(val);
        }
      });

      const netProfit = revenue - expenses;
      const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
      // REAL Ticket Médio
      const ticketMedio = salesCount > 0 ? revenue / salesCount : 0;

      return { revenue, expenses, netProfit, margin, ticketMedio, salesCount };
    };

    return {
      daily: compute((t) => t.date === today),
      weekly: compute((t) => t.date >= weekAgo && t.date <= today),
      monthly: compute((t) => (t.date || '').slice(0, 7) === monthKey),
      annual: compute((t) => (t.date || '').slice(0, 4) === yearKey),
    };
  }, [transactions, selectedMonth]);

  const baseOptions = getChartBaseOptions(isDark);
  const doughnutOptions = getDoughnutOptions(isDark);

  const exportAnalyticsSummary = () => {
    const rows = [
      ['Período', 'Faturamento (R$)', 'Custos (R$)', 'Lucro Líquido (R$)', 'Margem (%)', 'Vendas (Qtd)', 'Ticket Médio (R$)'],
      [
        'Hoje',
        periodStats.daily.revenue.toFixed(2),
        periodStats.daily.expenses.toFixed(2),
        periodStats.daily.netProfit.toFixed(2),
        periodStats.daily.margin.toFixed(1),
        periodStats.daily.salesCount,
        periodStats.daily.ticketMedio.toFixed(2),
      ],
      [
        'Últimos 7 dias',
        periodStats.weekly.revenue.toFixed(2),
        periodStats.weekly.expenses.toFixed(2),
        periodStats.weekly.netProfit.toFixed(2),
        periodStats.weekly.margin.toFixed(1),
        periodStats.weekly.salesCount,
        periodStats.weekly.ticketMedio.toFixed(2),
      ],
      [
        `Mês (${selectedMonth})`,
        periodStats.monthly.revenue.toFixed(2),
        periodStats.monthly.expenses.toFixed(2),
        periodStats.monthly.netProfit.toFixed(2),
        periodStats.monthly.margin.toFixed(1),
        periodStats.monthly.salesCount,
        periodStats.monthly.ticketMedio.toFixed(2),
      ],
      [
        `Ano (${currentYear})`,
        periodStats.annual.revenue.toFixed(2),
        periodStats.annual.expenses.toFixed(2),
        periodStats.annual.netProfit.toFixed(2),
        periodStats.annual.margin.toFixed(1),
        periodStats.annual.salesCount,
        periodStats.annual.ticketMedio.toFixed(2),
      ],
    ];

    downloadCSV(`relatorio-executivo-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  return (
    <div className="space-y-6">
      {/* Analytics Header & Time Horizon Control */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/20 sm:flex-row sm:items-center">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-100">
            <BarChart3 className="h-6 w-6 text-blue-400" />
            Central de Gráficos & Inteligência Financeira
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Visualize a evolução do seu negócio, lucratividade, fluxo de caixa e custos em tempo real.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Time range selector */}
          <div className="flex rounded-xl border border-slate-800 bg-slate-950/80 p-1">
            {[
              { id: '7d', label: '7 Dias' },
              { id: '30d', label: '30 Dias' },
              { id: '6m', label: '6 Meses' },
              { id: '12m', label: '12 Meses' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTimeRange(tab.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  timeRange === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={exportAnalyticsSummary}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-600 hover:bg-slate-700"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Exportar Relatório</span>
          </button>
        </div>
      </div>

      {/* Main Full-width Line Chart: Faturamento x Custos x Lucro */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/20">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-100">
              Evolução: Faturamento, Custos e Lucro Líquido
            </h3>
            <p className="text-xs text-slate-400">
              Curva de desempenho financeiro no período selecionado ({timeRange.toUpperCase()})
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1 text-blue-400">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Faturamento
            </span>
            <span className="flex items-center gap-1 text-rose-400">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Custos
            </span>
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Lucro Líquido
            </span>
          </div>
        </div>

        <div className="h-80 w-full">
          {hasTrendData ? (
            <Line data={mainLineData} options={baseOptions} />
          ) : (
            <ChartEmpty message="Nenhuma transação registrada no período selecionado." />
          )}
        </div>
      </section>

      {/* Secondary Charts: 2 Columns */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Despesas por Categoria */}
        <section className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/20">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-100">Despesas por Categoria</h3>
              <p className="text-xs text-slate-400">Para onde está indo o seu dinheiro</p>
            </div>
            <span className="rounded-lg border border-slate-800 bg-slate-950/60 px-2.5 py-1 text-xs font-semibold text-rose-400">
              Total: {formatBRL(expensesByCategory.total)}
            </span>
          </div>

          <div className="relative flex flex-1 items-center justify-center min-h-[260px]">
            {expensesByCategory.list.length > 0 ? (
              <div className="h-64 w-full">
                <Doughnut data={expensesDoughnutData} options={doughnutOptions} />
              </div>
            ) : (
              <ChartEmpty message="Nenhuma despesa ou compra registrada." />
            )}
          </div>

          {expensesByCategory.list.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-800/80 pt-3 sm:grid-cols-3">
              {expensesByCategory.list.slice(0, 6).map((c, idx) => (
                <div key={c.label} className="flex items-center gap-1.5 text-xs text-slate-300">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: chartPalette[idx % chartPalette.length] }}
                  />
                  <span className="truncate">{c.label}:</span>
                  <span className="font-semibold text-slate-100">{c.percent.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Formas de Pagamento / Entradas de Caixa */}
        <section className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/20">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-100">Recebimentos por Forma</h3>
              <p className="text-xs text-slate-400">Distribuição dos pagamentos recebidos</p>
            </div>
            <span className="rounded-lg border border-slate-800 bg-slate-950/60 px-2.5 py-1 text-xs font-semibold text-emerald-400">
              Total: {formatBRL(paymentMethodsData.total)}
            </span>
          </div>

          <div className="relative flex flex-1 items-center justify-center min-h-[260px]">
            {paymentMethodsData.list.length > 0 ? (
              <div className="h-64 w-full">
                <Doughnut data={paymentDoughnutData} options={doughnutOptions} />
              </div>
            ) : (
              <ChartEmpty message="Nenhum recebimento lançado no caixa." />
            )}
          </div>

          {paymentMethodsData.list.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-800/80 pt-3 sm:grid-cols-3">
              {paymentMethodsData.list.map((m) => (
                <div key={m.label} className="text-xs text-slate-300">
                  <span className="text-slate-400">{m.label}: </span>
                  <span className="font-semibold text-slate-100">{formatBRL(m.value)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Tertiary Charts: Fluxo de Caixa & Produtos mais Lucrativos */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Fluxo de Caixa (Entradas vs Saídas) */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/20">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-100">Fluxo de Caixa Diário</h3>
            <p className="text-xs text-slate-400">Entradas e saídas de valores no caixa</p>
          </div>
          <div className="h-64">
            {cashEntries.length > 0 ? (
              <Bar data={cashFlowBarData} options={baseOptions} />
            ) : (
              <ChartEmpty message="Sem movimentações de caixa registradas." />
            )}
          </div>
        </section>

        {/* Ranking de Lucro por Produto */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/20">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-100">Produtos Mais Lucrativos (Top 6)</h3>
            <p className="text-xs text-slate-400">Produtos que mais geraram margem e lucro líquido</p>
          </div>
          <div className="h-64">
            {productProfitRanking.length > 0 ? (
              <Bar data={productProfitBarData} options={baseOptions} />
            ) : (
              <ChartEmpty message="Registre vendas de produtos para visualizar o ranking de lucro." />
            )}
          </div>
        </section>
      </div>

      {/* Comparativo Anual */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/20">
        <div className="mb-4">
          <h3 className="text-base font-bold text-slate-100">Comparativo Anual: {currentYear} vs. {currentYear - 1}</h3>
          <p className="text-xs text-slate-400">
            Comparação de Faturamento, Custos e Lucro acumulado ano a ano
          </p>
        </div>
        <div className="h-72">
          {annualComparison.hasData ? (
            <Bar
              data={{
                labels: ['Faturamento', 'Custos', 'Lucro Líquido'],
                datasets: annualComparison.datasets,
              }}
              options={baseOptions}
            />
          ) : (
            <ChartEmpty message="Registre transações para comparar os anos fiscais." />
          )}
        </div>
      </section>

      {/* Executive Performance Table with REAL Ticket Médio */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/20">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-100">Quadro Executivo de Desempenho</h3>
            <p className="text-xs text-slate-400">
              Resumo comparativo consolidado com Ticket Médio real e margens calculadas
            </p>
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            Filtrar Mês:
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value || new Date().toISOString().slice(0, 7))}
              className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-blue-500"
            />
          </label>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-800 bg-slate-950/80 text-xs font-semibold text-slate-400">
              <tr>
                <th className="px-4 py-3">Período</th>
                <th className="px-4 py-3 text-right">Faturamento</th>
                <th className="px-4 py-3 text-right">Custos</th>
                <th className="px-4 py-3 text-right">Lucro Líquido</th>
                <th className="px-4 py-3 text-right">Margem</th>
                <th className="px-4 py-3 text-right">Vendas</th>
                <th className="px-4 py-3 text-right">Ticket Médio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {[
                { title: 'Hoje (Diário)', data: periodStats.daily },
                { title: 'Últimos 7 Dias', data: periodStats.weekly },
                { title: `Mês Atual (${selectedMonth})`, data: periodStats.monthly },
                { title: `Ano (${currentYear})`, data: periodStats.annual },
              ].map(({ title, data }) => (
                <tr key={title} className="transition hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-semibold text-slate-200">{title}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-100">
                    {formatBRL(data.revenue)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-rose-400">
                    {formatBRL(data.expenses)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right tabular-nums font-bold ${
                      data.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {formatBRL(data.netProfit)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-purple-400">
                    {formatPercent(data.margin, 1)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-300">
                    {data.salesCount}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-blue-400">
                    {formatBRL(data.ticketMedio)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
