import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';
import { formatBRL } from '../../utils/formatters.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const ChartEmpty = ({ message = 'Nenhum dado disponível para exibição.' }) => (
  <div className="flex h-full min-h-[200px] w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-700/60 bg-slate-900/30 p-6 text-center text-sm text-slate-400">
    <div className="mb-2 h-2 w-2 rounded-full bg-slate-600 animate-ping" />
    <p>{message}</p>
  </div>
);

export const getChartBaseOptions = (isDark = true) => {
  const tickColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? 'rgba(148, 163, 184, 0.08)' : 'rgba(100, 116, 139, 0.12)';
  const tooltipBg = isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)';
  const tooltipTitle = isDark ? '#f8fafc' : '#0f172a';
  const tooltipBody = isDark ? '#cbd5e1' : '#334155';
  const tooltipBorder = isDark ? 'rgba(51, 65, 85, 0.8)' : 'rgba(203, 213, 225, 0.9)';

  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          color: tickColor,
          boxWidth: 10,
          boxHeight: 10,
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 16,
          font: {
            size: 12,
            weight: '500',
            family: 'inherit',
          },
        },
      },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: tooltipTitle,
        bodyColor: tooltipBody,
        borderColor: tooltipBorder,
        borderWidth: 1,
        padding: 12,
        cornerRadius: 10,
        boxPadding: 6,
        usePointStyle: true,
        titleFont: { size: 13, weight: '600' },
        bodyFont: { size: 12, weight: '500' },
        callbacks: {
          label: (ctx) => {
            const v = ctx.parsed?.y !== undefined ? ctx.parsed.y : ctx.parsed;
            if (typeof v === 'number') {
              return ` ${ctx.dataset.label || ctx.label || ''}: ${formatBRL(v)}`;
            }
            return ` ${ctx.dataset.label || ctx.label || ''}: ${v}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: gridColor, drawBorder: false },
        ticks: { color: tickColor, font: { size: 11 } },
      },
      y: {
        grid: { color: gridColor, drawBorder: false },
        ticks: {
          color: tickColor,
          font: { size: 11 },
          callback: (value) => {
            if (Math.abs(value) >= 1000) {
              return `R$ ${(value / 1000).toFixed(0)}k`;
            }
            return `R$ ${value}`;
          },
        },
      },
    },
  };
};

export const getDoughnutOptions = (isDark = true) => {
  const base = getChartBaseOptions(isDark);
  return {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      ...base.plugins,
      legend: {
        position: 'bottom',
        labels: {
          ...base.plugins.legend.labels,
          padding: 12,
        },
      },
    },
  };
};
