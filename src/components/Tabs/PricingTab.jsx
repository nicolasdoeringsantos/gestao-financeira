import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Percent,
  TrendingUp,
  DollarSign,
  Info,
  Layers,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { formatBRL, formatPercent } from '../../utils/formatters.js';

export const PricingTab = () => {
  const [productName, setProductName] = useState('');
  const [acquisitionCost, setAcquisitionCost] = useState(25);
  const [variableCostPct, setVariableCostPct] = useState(8); // e.g. impostos + taxas de cartão + embalagem
  const [fixedCostPct, setFixedCostPct] = useState(12); // rateio de custos fixos
  const [desiredPrice, setDesiredPrice] = useState(65);

  const calculations = useMemo(() => {
    const acq = Number(acquisitionCost) || 0;
    const varPct = Number(variableCostPct) || 0;
    const fixPct = Number(fixedCostPct) || 0;
    const price = Number(desiredPrice) || 0;

    const variableCostValue = (varPct / 100) * price;
    const fixedCostValue = (fixPct / 100) * price;
    const totalCosts = acq + variableCostValue + fixedCostValue;
    const grossProfit = price - acq;
    const netProfit = price - totalCosts;
    const marginPercentage = price > 0 ? (netProfit / price) * 100 : 0;
    const markup = totalCosts > 0 ? price / totalCosts : 0;

    // Break-even price (preço mínimo para não ter prejuízo):
    // Preço_mínimo = Custo_aquisição / (1 - (varPct + fixPct) / 100)
    const combinedPct = (varPct + fixPct) / 100;
    const breakEvenPrice = combinedPct < 1 ? acq / (1 - combinedPct) : 0;

    // Descontos simulados
    const atDiscount5 = price * 0.95;
    const netProfit5 = atDiscount5 - (acq + (varPct / 100) * atDiscount5 + (fixPct / 100) * atDiscount5);
    const margin5 = atDiscount5 > 0 ? (netProfit5 / atDiscount5) * 100 : 0;

    const atDiscount10 = price * 0.9;
    const netProfit10 = atDiscount10 - (acq + (varPct / 100) * atDiscount10 + (fixPct / 100) * atDiscount10);
    const margin10 = atDiscount10 > 0 ? (netProfit10 / atDiscount10) * 100 : 0;

    return {
      totalCosts,
      grossProfit,
      netProfit,
      marginPercentage,
      markup,
      breakEvenPrice,
      variableCostValue,
      fixedCostValue,
      simulations: {
        disc5: { price: atDiscount5, netProfit: netProfit5, margin: margin5 },
        disc10: { price: atDiscount10, netProfit: netProfit10, margin: margin10 },
      },
    };
  }, [acquisitionCost, variableCostPct, fixedCostPct, desiredPrice]);

  const inputClass =
    'w-full rounded-xl border border-slate-700/70 bg-slate-800/60 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30';
  const labelClass = 'mb-1.5 block text-xs font-semibold tracking-wide text-slate-300';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/20">
        <h2 className="flex items-center gap-2 text-xl font-bold text-slate-100">
          <Calculator className="h-6 w-6 text-purple-400" />
          Calculadora Inteligente de Precificação & Markup
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Descubra o preço de venda ideal, ponto de equilíbrio e margem real considerando todos os custos operacionais e tributários.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Form Inputs (5 cols) */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/20 lg:col-span-5">
          <h3 className="mb-4 text-base font-bold text-slate-200">Parâmetros de Custo</h3>

          <div className="space-y-4">
            <div>
              <label className={labelClass}>Nome do Produto ou Serviço</label>
              <input
                className={inputClass}
                placeholder="Ex.: Bolo de Cenoura com Chocolate"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className={labelClass}>Custo Direto / Aquisição (R$)</label>
                <span className="text-[11px] text-slate-500">Matéria-prima ou compra</span>
              </div>
              <input
                type="number"
                min="0"
                step="0.01"
                className={inputClass}
                value={acquisitionCost}
                onChange={(e) => setAcquisitionCost(Number(e.target.value))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between">
                  <label className={labelClass}>Custos Variáveis (%)</label>
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  className={inputClass}
                  value={variableCostPct}
                  onChange={(e) => setVariableCostPct(Number(e.target.value))}
                />
                <p className="mt-1 text-[10px] text-slate-500">Taxas de cartão, comissões, impostos</p>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className={labelClass}>Custos Fixos (%)</label>
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  className={inputClass}
                  value={fixedCostPct}
                  onChange={(e) => setFixedCostPct(Number(e.target.value))}
                />
                <p className="mt-1 text-[10px] text-slate-500">Aluguel, luz, salários proporcionais</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className={labelClass}>Preço de Venda Proposto (R$)</label>
                <span className="text-[11px] font-semibold text-blue-400">Preço ao cliente</span>
              </div>
              <input
                type="number"
                min="0"
                step="0.01"
                className={`${inputClass} text-base font-bold text-emerald-400 border-emerald-500/30`}
                value={desiredPrice}
                onChange={(e) => setDesiredPrice(Number(e.target.value))}
              />
            </div>
          </div>
        </section>

        {/* Results & Break-even (7 cols) */}
        <section className="space-y-6 lg:col-span-7">
          {/* Main Results Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/20">
            <h3 className="mb-4 text-base font-bold text-slate-200">Resultado Financeiro por Unidade</h3>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
                <p className="text-xs text-slate-400">Custos Totais</p>
                <p className="mt-1 text-lg font-bold text-slate-100">
                  {formatBRL(calculations.totalCosts)}
                </p>
                <p className="mt-1 text-[10px] text-slate-500">
                  Direto + {formatPercent(Number(variableCostPct) + Number(fixedCostPct), 0)}% rateio
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
                <p className="text-xs text-slate-400">Lucro Bruto</p>
                <p className="mt-1 text-lg font-bold text-blue-400">
                  {formatBRL(calculations.grossProfit)}
                </p>
                <p className="mt-1 text-[10px] text-slate-500">Preço − Aquisição</p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
                <p className="text-xs text-slate-400">Lucro Líquido</p>
                <p
                  className={`mt-1 text-lg font-bold ${
                    calculations.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {formatBRL(calculations.netProfit)}
                </p>
                <p className="mt-1 text-[10px] text-slate-500">Livre no bolso</p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
                <p className="text-xs text-slate-400">Margem Líquida</p>
                <p
                  className={`mt-1 text-lg font-bold ${
                    calculations.marginPercentage >= 0 ? 'text-purple-400' : 'text-rose-400'
                  }`}
                >
                  {calculations.marginPercentage.toFixed(1)}%
                </p>
                <p className="mt-1 text-[10px] text-slate-500">Markup: {calculations.markup.toFixed(2)}x</p>
              </div>
            </div>

            {/* Ponto de Equilíbrio (Break-Even Point) */}
            <div className="mt-5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-400" />
                  <span className="text-sm font-bold text-indigo-300">
                    Ponto de Equilíbrio Unitário (Break-Even)
                  </span>
                </div>
                <span className="text-base font-extrabold text-indigo-200">
                  {formatBRL(calculations.breakEvenPrice)}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-300">
                Este é o preço mínimo absoluto que você deve cobrar para não ter prejuízo, cobrindo exatamente o custo de aquisição e os percentuais variáveis e fixos.
              </p>
            </div>
          </div>

          {/* Discount Simulator */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/20">
            <h3 className="mb-3 text-sm font-bold text-slate-200">Simulador de Cenários & Descontos</h3>
            <p className="mb-3 text-xs text-slate-400">
              Veja como conceder descontos promocionais impacta a margem líquida real do produto:
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <span className="text-xs font-semibold text-slate-400">Sem Desconto</span>
                <p className="mt-1 text-sm font-bold text-slate-200">{formatBRL(desiredPrice)}</p>
                <p className="mt-1 text-xs text-emerald-400">
                  Lucro: {formatBRL(calculations.netProfit)} ({calculations.marginPercentage.toFixed(1)}%)
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <span className="text-xs font-semibold text-amber-400">Com 5% de Desconto</span>
                <p className="mt-1 text-sm font-bold text-slate-200">
                  {formatBRL(calculations.simulations.disc5.price)}
                </p>
                <p className="mt-1 text-xs text-amber-400">
                  Lucro: {formatBRL(calculations.simulations.disc5.netProfit)} ({calculations.simulations.disc5.margin.toFixed(1)}%)
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <span className="text-xs font-semibold text-rose-400">Com 10% de Desconto</span>
                <p className="mt-1 text-sm font-bold text-slate-200">
                  {formatBRL(calculations.simulations.disc10.price)}
                </p>
                <p className="mt-1 text-xs text-rose-400">
                  Lucro: {formatBRL(calculations.simulations.disc10.netProfit)} ({calculations.simulations.disc10.margin.toFixed(1)}%)
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
