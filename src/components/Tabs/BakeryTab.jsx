import React, { useState, useMemo } from 'react';
import {
  Wheat,
  Plus,
  Trash2,
  Pencil,
  Sparkles,
  Layers,
  Calculator,
  ArrowRight,
  Package,
  ShoppingBag,
  DollarSign,
  Info,
  CheckCircle2,
  ArrowUpRight,
  Flame,
  ChefHat,
} from 'lucide-react';
import { formatBRL, formatPercent } from '../../utils/formatters.js';
import { useToast } from '../Toast.jsx';

// Unit conversion helper: calculates cost for a given ingredient and used quantity
export const calculateItemCost = (ingredient, usedQty, usedUnit) => {
  if (!ingredient || !usedQty || Number(usedQty) <= 0) return 0;
  const pQty = Number(ingredient.package_qty) || 1;
  const pPrice = Number(ingredient.package_price) || 0;
  if (pPrice <= 0 || pQty <= 0) return 0;

  const baseUnitCost = pPrice / pQty; // cost per package unit (e.g. per kg, per L, per un)
  const pkgUnit = (ingredient.unit || 'kg').toLowerCase();
  const uUnit = (usedUnit || pkgUnit).toLowerCase();
  const q = Number(usedQty);

  // Conversion logic:
  // kg to g
  if (pkgUnit === 'kg' && uUnit === 'g') return (baseUnitCost / 1000) * q;
  if (pkgUnit === 'g' && uUnit === 'kg') return baseUnitCost * 1000 * q;
  // L to ml
  if (pkgUnit === 'l' && uUnit === 'ml') return (baseUnitCost / 1000) * q;
  if (pkgUnit === 'ml' && uUnit === 'l') return baseUnitCost * 1000 * q;

  // Direct unit match or un, cx, etc.
  return baseUnitCost * q;
};

export const BakeryTab = ({
  ingredients = [],
  recipes = [],
  onSaveIngredient,
  onDeleteIngredient,
  onSaveRecipe,
  onDeleteRecipe,
  onSendToProducts,
}) => {
  const { addToast } = useToast();

  // Active subtab: 'calculator' (Ficha Técnica) | 'ingredients' (Banco de Insumos) | 'recipes_list' (Receitas Salvas)
  const [subTab, setSubTab] = useState('calculator');

  // Ingredient Form State
  const [ingForm, setIngForm] = useState({
    id: null,
    name: '',
    package_qty: 1,
    unit: 'kg',
    package_price: '',
  });
  const [showIngForm, setShowIngForm] = useState(false);

  // Recipe Form State
  const [recipeId, setRecipeId] = useState(null);
  const [recipeName, setRecipeName] = useState('');
  const [yieldPackages, setYieldPackages] = useState(10);
  const [packageUnitName, setPackageUnitName] = useState('pacotes');
  const [extraCosts, setExtraCosts] = useState(3.5); // ex: gás / energia / embalagens
  const [desiredMargin, setDesiredMargin] = useState(100); // 100% markup
  const [recipeItems, setRecipeItems] = useState([
    { ingredient_id: '', used_qty: 500, used_unit: 'g' },
  ]);

  // Handle adding ingredient line in recipe
  const handleAddRecipeItem = () => {
    setRecipeItems([...recipeItems, { ingredient_id: '', used_qty: 100, used_unit: 'g' }]);
  };

  const handleRemoveRecipeItem = (index) => {
    setRecipeItems(recipeItems.filter((_, i) => i !== index));
  };

  const handleRecipeItemChange = (index, field, value) => {
    const updated = [...recipeItems];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'ingredient_id') {
      const ing = ingredients.find((i) => i.id === value);
      if (ing) {
        // default used unit based on ingredient unit
        if (ing.unit === 'kg') updated[index].used_unit = 'g';
        else if (ing.unit === 'l') updated[index].used_unit = 'ml';
        else updated[index].used_unit = ing.unit;
      }
    }
    setRecipeItems(updated);
  };

  // Recipe Totals Calculations
  const recipeCalculations = useMemo(() => {
    let ingredientsCost = 0;
    const itemDetails = recipeItems.map((item) => {
      const ing = ingredients.find((i) => i.id === item.ingredient_id);
      const cost = calculateItemCost(ing, item.used_qty, item.used_unit);
      ingredientsCost += cost;
      return { ...item, ingredient: ing, cost };
    });

    const extra = Number(extraCosts) >= 0 ? Number(extraCosts) : 0;
    const totalCost = ingredientsCost + extra;
    const yPkgs = Number(yieldPackages) > 0 ? Number(yieldPackages) : 1;
    const costPerPackage = totalCost / yPkgs;

    // Markup & suggested sale price
    const margin = Number(desiredMargin) >= 0 ? Number(desiredMargin) : 0;
    const suggestedPricePerPackage = costPerPackage * (1 + margin / 100);
    const profitPerPackage = suggestedPricePerPackage - costPerPackage;
    const totalBatchRevenue = suggestedPricePerPackage * yPkgs;
    const totalBatchProfit = profitPerPackage * yPkgs;

    return {
      ingredientsCost,
      extra,
      totalCost,
      yPkgs,
      costPerPackage,
      suggestedPricePerPackage,
      profitPerPackage,
      totalBatchRevenue,
      totalBatchProfit,
      itemDetails,
    };
  }, [recipeItems, ingredients, extraCosts, yieldPackages, desiredMargin]);

  // Ingredient Save Handler
  const handleIngredientSubmit = async (e) => {
    e.preventDefault();
    if (!ingForm.name.trim()) return;

    await onSaveIngredient({
      id: ingForm.id,
      name: ingForm.name.trim(),
      package_qty: Number(ingForm.package_qty) || 1,
      unit: ingForm.unit,
      package_price: Math.abs(Number(ingForm.package_price)) || 0,
    });

    setIngForm({ id: null, name: '', package_qty: 1, unit: 'kg', package_price: '' });
    setShowIngForm(false);
  };

  // Recipe Save Handler
  const handleSaveRecipeSubmit = async () => {
    if (!recipeName.trim()) {
      addToast('Informe o nome da receita.', 'error');
      return;
    }

    const payload = {
      id: recipeId || crypto.randomUUID(),
      name: recipeName.trim(),
      yield_packages: Number(yieldPackages) || 1,
      package_unit_name: packageUnitName.trim() || 'pacotes',
      extra_costs: Number(extraCosts) || 0,
      total_cost: recipeCalculations.totalCost,
      cost_per_package: recipeCalculations.costPerPackage,
      suggested_price: recipeCalculations.suggestedPricePerPackage,
      items: recipeItems.filter((i) => i.ingredient_id && Number(i.used_qty) > 0),
    };

    const ok = await onSaveRecipe(payload);
    if (ok) {
      addToast(`Receita "${payload.name}" salva com sucesso!`);
    }
  };

  // Load a saved recipe into the calculator
  const handleLoadRecipe = (rec) => {
    setRecipeId(rec.id);
    setRecipeName(rec.name);
    setYieldPackages(rec.yield_packages || 10);
    setPackageUnitName(rec.package_unit_name || 'pacotes');
    setExtraCosts(rec.extra_costs || 0);
    setRecipeItems(
      Array.isArray(rec.items) && rec.items.length > 0
        ? rec.items
        : [{ ingredient_id: '', used_qty: 100, used_unit: 'g' }]
    );
    setSubTab('calculator');
    addToast(`Receita "${rec.name}" carregada na Ficha Técnica.`);
  };

  // Reset form
  const handleNewRecipe = () => {
    setRecipeId(null);
    setRecipeName('');
    setYieldPackages(10);
    setPackageUnitName('pacotes');
    setExtraCosts(3.5);
    setRecipeItems([{ ingredient_id: '', used_qty: 500, used_unit: 'g' }]);
  };

  const inputClass =
    'w-full rounded-xl border border-slate-700/70 bg-slate-800/60 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30';
  const labelClass = 'mb-1.5 block text-xs font-semibold tracking-wide text-slate-300';

  return (
    <div className="space-y-6">
      {/* Header & Sub-navigation */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-amber-950/30 p-6 shadow-xl shadow-black/20 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30 shadow-md">
              <Wheat className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-100">
                Ficha Técnica & Custos de Padaria
              </h2>
              <p className="text-xs text-slate-400">
                Calcule o custo exato de cada ingrediente, custo por fornada e custo unitário por pacote.
              </p>
            </div>
          </div>
        </div>

        {/* Subtab buttons */}
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950/80 p-1">
          <button
            type="button"
            onClick={() => setSubTab('calculator')}
            className={`rounded-lg px-3.5 py-2 text-xs font-bold transition ${
              subTab === 'calculator'
                ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🥖 Ficha Técnica da Receita
          </button>
          <button
            type="button"
            onClick={() => setSubTab('ingredients')}
            className={`rounded-lg px-3.5 py-2 text-xs font-bold transition ${
              subTab === 'ingredients'
                ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🌾 Insumos / Ingredientes ({ingredients.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('recipes_list')}
            className={`rounded-lg px-3.5 py-2 text-xs font-bold transition ${
              subTab === 'recipes_list'
                ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            📋 Receitas Salvas ({recipes.length})
          </button>
        </div>
      </div>

      {/* SUBTAB 1: CALCULATOR / FICHA TÉCNICA */}
      {subTab === 'calculator' && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Left Col: Recipe Composition (7 cols) */}
            <section className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/20 lg:col-span-7">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ChefHat className="h-5 w-5 text-amber-400" />
                  <h3 className="text-base font-bold text-slate-100">
                    {recipeId ? 'Editando Ficha Técnica' : 'Montador de Receita'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleNewRecipe}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-200"
                >
                  Limpar / Nova Receita
                </button>
              </div>

              {/* Recipe Name & Yield in Packages */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="sm:col-span-3">
                  <label className={labelClass}>Nome do Produto / Receita</label>
                  <input
                    className={inputClass}
                    placeholder="Ex.: Pão Francês 500g, Bolo de Cenoura, Pão de Queijo..."
                    value={recipeName}
                    onChange={(e) => setRecipeName(e.target.value)}
                  />
                </div>

                <div>
                  <label className={labelClass}>Rendimento (Quantos Pacotes)</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    className={`${inputClass} font-bold text-amber-400 border-amber-500/40`}
                    value={yieldPackages}
                    onChange={(e) => setYieldPackages(Number(e.target.value))}
                  />
                  <p className="mt-1 text-[10px] text-slate-500">Qtd de pacotes ou unidades geradas</p>
                </div>

                <div>
                  <label className={labelClass}>Tipo de Embalagem / Unidade</label>
                  <input
                    className={inputClass}
                    placeholder="Ex.: pacotes, unidades, potes"
                    value={packageUnitName}
                    onChange={(e) => setPackageUnitName(e.target.value)}
                  />
                </div>

                <div>
                  <label className={labelClass}>Custos Operacionais (Gás/Energia)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={inputClass}
                    value={extraCosts}
                    onChange={(e) => setExtraCosts(Number(e.target.value))}
                  />
                  <p className="mt-1 text-[10px] text-slate-500">Gás, forno e embalagens da fornada</p>
                </div>
              </div>

              {/* Ingredients List */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className={labelClass}>Ingredientes Utilizados na Receita</label>
                  {ingredients.length === 0 && (
                    <button
                      type="button"
                      onClick={() => setSubTab('ingredients')}
                      className="text-[11px] font-semibold text-amber-400 hover:underline"
                    >
                      + Cadastrar ingredientes primeiro
                    </button>
                  )}
                </div>

                <div className="space-y-2.5">
                  {recipeItems.map((item, idx) => {
                    const selectedIng = ingredients.find((i) => i.id === item.ingredient_id);
                    const itemCost = calculateItemCost(selectedIng, item.used_qty, item.used_unit);

                    return (
                      <div
                        key={idx}
                        className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/60 p-3"
                      >
                        {/* Ingredient Select */}
                        <div className="min-w-[160px] flex-1">
                          <select
                            className={inputClass}
                            value={item.ingredient_id}
                            onChange={(e) =>
                              handleRecipeItemChange(idx, 'ingredient_id', e.target.value)
                            }
                          >
                            <option value="">— Selecione o ingrediente —</option>
                            {ingredients.map((ing) => (
                              <option key={ing.id} value={ing.id}>
                                {ing.name} ({formatBRL(ing.package_price)} / {ing.package_qty}{ing.unit})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Used Quantity */}
                        <div className="w-24">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="Qtd"
                            className={inputClass}
                            value={item.used_qty}
                            onChange={(e) =>
                              handleRecipeItemChange(idx, 'used_qty', Number(e.target.value))
                            }
                          />
                        </div>

                        {/* Unit Select */}
                        <div className="w-20">
                          <select
                            className={inputClass}
                            value={item.used_unit}
                            onChange={(e) =>
                              handleRecipeItemChange(idx, 'used_unit', e.target.value)
                            }
                          >
                            <option value="g">g</option>
                            <option value="kg">kg</option>
                            <option value="ml">ml</option>
                            <option value="l">L</option>
                            <option value="un">un</option>
                            <option value="cx">cx</option>
                          </select>
                        </div>

                        {/* Calculated Cost of this line */}
                        <div className="min-w-[80px] text-right font-bold text-slate-200 text-xs">
                          {formatBRL(itemCost)}
                        </div>

                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveRecipeItem(idx)}
                          disabled={recipeItems.length <= 1}
                          className="p-1.5 text-slate-500 hover:text-rose-400 disabled:opacity-30"
                          title="Remover ingrediente"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={handleAddRecipeItem}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-700 px-3 py-2 text-xs font-bold text-amber-400 hover:border-amber-500/50 hover:bg-amber-500/5 transition"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Outro Ingrediente
                </button>
              </div>
            </section>

            {/* Right Col: Cost Summary & Package Pricing (5 cols) */}
            <section className="space-y-6 lg:col-span-5">
              {/* Highlight Card: Cost Per Package */}
              <div className="relative overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 p-5 shadow-xl shadow-black/30">
                <div className="flex items-center justify-between">
                  <span className="rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[11px] font-extrabold text-amber-400">
                    CUSTO UNITÁRIO CALCULADO
                  </span>
                  <span className="text-xs text-slate-400">
                    Rendimento: <strong className="text-slate-100">{recipeCalculations.yPkgs} {packageUnitName}</strong>
                  </span>
                </div>

                {/* THE MAIN METRIC: COST PER PACKAGE */}
                <div className="mt-4">
                  <p className="text-xs text-slate-400">Custo por {packageUnitName.slice(0, -1) || 'pacote'}:</p>
                  <p className="mt-1 text-3xl font-black tracking-tight text-amber-400 sm:text-4xl">
                    {formatBRL(recipeCalculations.costPerPackage)}
                  </p>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2 border-t border-slate-800 pt-3 text-xs">
                  <div>
                    <span className="text-slate-500">Custo dos Insumos:</span>
                    <p className="font-bold text-slate-200">
                      {formatBRL(recipeCalculations.ingredientsCost)}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Custo da Fornada Total:</span>
                    <p className="font-bold text-slate-200">
                      {formatBRL(recipeCalculations.totalCost)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Pricing & Markup Simulator */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/20">
                <h4 className="mb-3 text-sm font-bold text-slate-100">
                  Precificação & Margem de Venda
                </h4>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <label className={labelClass}>Margem de Lucro Desejada (%)</label>
                      <span className="text-xs font-bold text-purple-400">{desiredMargin}%</span>
                    </div>
                    <div className="flex gap-2">
                      {[50, 100, 150, 200].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setDesiredMargin(m)}
                          className={`flex-1 rounded-lg border py-1 text-xs font-bold transition ${
                            desiredMargin === m
                              ? 'border-purple-500 bg-purple-500/10 text-purple-300 ring-1 ring-purple-500/30'
                              : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          +{m}%
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">Preço de Venda Sugerido (por {packageUnitName.slice(0, -1) || 'pacote'}):</span>
                      <span className="text-base font-extrabold text-emerald-400">
                        {formatBRL(recipeCalculations.suggestedPricePerPackage)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">Lucro Líquido por Pacote:</span>
                      <span className="text-xs font-bold text-emerald-300">
                        {formatBRL(recipeCalculations.profitPerPackage)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-800/80 pt-2">
                      <span className="text-xs text-slate-400">Lucro Total da Fornada ({recipeCalculations.yPkgs} un):</span>
                      <span className="text-sm font-extrabold text-emerald-400">
                        {formatBRL(recipeCalculations.totalBatchProfit)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 pt-2">
                    <button
                      type="button"
                      onClick={handleSaveRecipeSubmit}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-amber-950/40 transition hover:from-amber-500 hover:to-orange-500"
                    >
                      <ChefHat className="h-4 w-4" />
                      Salvar Ficha Técnica da Receita
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (!recipeName.trim()) {
                          addToast('Informe o nome da receita antes de enviar.', 'error');
                          return;
                        }
                        onSendToProducts({
                          name: recipeName.trim(),
                          cost_price: Number(recipeCalculations.costPerPackage.toFixed(2)),
                          sale_price: Number(recipeCalculations.suggestedPricePerPackage.toFixed(2)),
                          stock_qty: recipeCalculations.yPkgs,
                          min_stock: Math.ceil(recipeCalculations.yPkgs * 0.2),
                        });
                        addToast(`"${recipeName}" cadastrado no Catálogo de Produtos e Estoque!`);
                      }}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-600/40 bg-emerald-500/10 py-2.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition"
                    >
                      <Package className="h-4 w-4" />
                      Cadastrar Pacote no Estoque de Produtos
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* SUBTAB 2: INGREDIENTS DATABASE */}
      {subTab === 'ingredients' && (
        <div className="space-y-6">
          <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/20 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-base font-bold text-slate-100">Banco de Ingredientes & Insumos</h3>
              <p className="text-xs text-slate-400">
                Cadastre o preço pago e o tamanho das embalagens de compra para cálculo automático de custos.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setIngForm({ id: null, name: '', package_qty: 1, unit: 'kg', package_price: '' });
                setShowIngForm(!showIngForm);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-amber-950/30 hover:from-amber-500 hover:to-orange-500 transition"
            >
              <Plus className="h-4 w-4" />
              <span>{showIngForm ? 'Fechar Formulário' : 'Novo Ingrediente'}</span>
            </button>
          </div>

          {/* Ingredient Form */}
          {showIngForm && (
            <section className="rounded-2xl border border-amber-500/30 bg-slate-900/90 p-5 shadow-xl shadow-black/40 animate-in fade-in duration-200">
              <h4 className="mb-4 text-sm font-bold text-slate-100">
                {ingForm.id ? 'Editar Ingrediente' : 'Cadastrar Ingrediente / Insumo'}
              </h4>

              <form onSubmit={handleIngredientSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className={labelClass}>Nome do Ingrediente</label>
                  <input
                    className={inputClass}
                    placeholder="Ex.: Farinha de Trigo Especial, Manteiga..."
                    value={ingForm.name}
                    onChange={(e) => setIngForm({ ...ingForm, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>Quantidade na Embalagem</label>
                  <input
                    type="number"
                    min="0.001"
                    step="any"
                    className={inputClass}
                    placeholder="Ex.: 5 (para saco de 5kg)"
                    value={ingForm.package_qty}
                    onChange={(e) => setIngForm({ ...ingForm, package_qty: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>Unidade de Compra</label>
                  <select
                    className={inputClass}
                    value={ingForm.unit}
                    onChange={(e) => setIngForm({ ...ingForm, unit: e.target.value })}
                  >
                    <option value="kg">Quilograma (kg)</option>
                    <option value="g">Grama (g)</option>
                    <option value="l">Litro (L)</option>
                    <option value="ml">Mililitro (ml)</option>
                    <option value="un">Unidade (un)</option>
                    <option value="cx">Caixa (cx)</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Preço Pago na Embalagem (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={inputClass}
                    placeholder="Ex.: 22,50"
                    value={ingForm.package_price}
                    onChange={(e) => setIngForm({ ...ingForm, package_price: e.target.value })}
                    required
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-4 flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowIngForm(false)}
                    className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-5 py-2 text-xs font-bold text-white hover:from-amber-500 hover:to-orange-500 shadow-md"
                  >
                    {ingForm.id ? 'Salvar Alterações' : 'Salvar Ingrediente'}
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* Ingredients Table */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/20">
            {ingredients.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700/70 py-10 text-center">
                <Wheat className="h-10 w-10 text-slate-500" />
                <p className="mt-2 text-sm font-semibold text-slate-300">Nenhum ingrediente cadastrado</p>
                <p className="text-xs text-slate-500">Adicione farinha, fermento, manteiga e insumos para compor suas receitas.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-800 bg-slate-950/80 text-xs font-semibold text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Ingrediente</th>
                      <th className="px-4 py-3 text-right">Embalagem de Compra</th>
                      <th className="px-4 py-3 text-right">Preço Pago</th>
                      <th className="px-4 py-3 text-right">Custo Unitário</th>
                      <th className="px-4 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {ingredients.map((ing) => {
                      const pQty = Number(ing.package_qty) || 1;
                      const pPrice = Number(ing.package_price) || 0;
                      const unitCost = pPrice / pQty;

                      return (
                        <tr key={ing.id} className="transition hover:bg-slate-800/40">
                          <td className="px-4 py-3 font-semibold text-slate-100">{ing.name}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-slate-300">
                            {pQty} {ing.unit}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-rose-400">
                            {formatBRL(pPrice)}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums font-bold text-amber-400">
                            {formatBRL(unitCost)} / {ing.unit}
                            {ing.unit === 'kg' && (
                              <span className="block text-[10px] text-slate-400">
                                ({formatBRL(unitCost / 1000)} / g)
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setIngForm({
                                    id: ing.id,
                                    name: ing.name,
                                    package_qty: ing.package_qty,
                                    unit: ing.unit,
                                    package_price: ing.package_price,
                                  });
                                  setShowIngForm(true);
                                }}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700/50 hover:text-blue-400"
                                title="Editar"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteIngredient(ing.id)}
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
      )}

      {/* SUBTAB 3: SAVED RECIPES */}
      {subTab === 'recipes_list' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/20">
            <div>
              <h3 className="text-base font-bold text-slate-100">Fichas Técnicas Salvas</h3>
              <p className="text-xs text-slate-400">
                Acesse suas receitas, custos por pacote e envie direto para o estoque.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                handleNewRecipe();
                setSubTab('calculator');
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-amber-950/30 hover:from-amber-500 hover:to-orange-500"
            >
              <Plus className="h-4 w-4" />
              <span>Nova Receita</span>
            </button>
          </div>

          {recipes.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700/70 bg-slate-900/50 py-12 text-center">
              <ChefHat className="h-10 w-10 text-slate-500" />
              <p className="mt-2 text-sm font-semibold text-slate-300">Nenhuma receita salva ainda</p>
              <p className="text-xs text-slate-500">Crie sua primeira ficha técnica na aba "Ficha Técnica da Receita".</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recipes.map((rec) => (
                <div
                  key={rec.id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/20 hover:border-amber-500/30 transition"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-bold text-slate-100">{rec.name}</h4>
                      <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                        {rec.yield_packages} {rec.package_unit_name || 'pct'}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2 rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Custo Total da Fornada:</span>
                        <span className="font-semibold text-slate-200">{formatBRL(rec.total_cost)}</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-800/80 pt-1.5">
                        <span className="text-slate-400">CUSTO POR PACOTE:</span>
                        <span className="font-extrabold text-amber-400 text-sm">
                          {formatBRL(rec.cost_per_package)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Preço de Venda Sugerido:</span>
                        <span className="font-bold text-emerald-400">
                          {formatBRL(rec.suggested_price)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3">
                    <button
                      type="button"
                      onClick={() => handleLoadRecipe(rec)}
                      className="text-xs font-bold text-amber-400 hover:text-amber-300"
                    >
                      Abrir Ficha Técnica →
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteRecipe(rec.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400"
                      title="Excluir receita"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
