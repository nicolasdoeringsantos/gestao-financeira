import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Wallet,
  Sun,
  Moon,
  LayoutDashboard,
  TrendingUp,
  Package,
  ArrowLeftRight,
  Calculator,
  Users,
  Settings,
  Plus,
  BarChart3,
  Wheat,
} from 'lucide-react';

import { ToastProvider, useToast } from '../components/Toast.jsx';
import { Navbar, tabs } from '../components/Navbar.jsx';
import { OverviewTab } from '../components/Tabs/OverviewTab.jsx';
import { BakeryTab } from '../components/Tabs/BakeryTab.jsx';
import { AnalyticsTab } from '../components/Tabs/AnalyticsTab.jsx';
import { TransactionsTab } from '../components/Tabs/TransactionsTab.jsx';
import { StockTab } from '../components/Tabs/StockTab.jsx';
import { CashTab } from '../components/Tabs/CashTab.jsx';
import { CustomersTab } from '../components/Tabs/CustomersTab.jsx';
import { PricingTab } from '../components/Tabs/PricingTab.jsx';
import { SettingsTab } from '../components/Tabs/SettingsTab.jsx';
import { QuickActionModal } from '../components/Modals/QuickActionModal.jsx';
import { ConfirmModal } from '../components/Modals/ConfirmModal.jsx';
import { formatBRL } from '../utils/formatters.js';

const emptyTransaction = () => ({
  id: crypto.randomUUID(),
  type: 'venda',
  name: '',
  amount: '',
  discount: '',
  quantity: 1,
  category: '',
  date: new Date().toISOString().slice(0, 10),
  product_id: '',
  status: 'pago',
  customer_id: '',
});

const emptyCustomer = () => ({
  name: '',
  phone: '',
});

const emptyProduct = () => ({
  name: '',
  cost_price: '',
  sale_price: '',
  stock_qty: '',
  min_stock: '',
});

const emptyCash = () => ({
  type: 'entrada',
  description: '',
  amount: '',
  payment_method: 'dinheiro',
  date: new Date().toISOString().slice(0, 10),
});

// Default starter ingredients for bakery if empty
const defaultBakeryIngredients = [
  { id: 'ing-1', name: 'Farinha de Trigo Especial', package_qty: 5, unit: 'kg', package_price: 22.5, unit_cost: 4.5 },
  { id: 'ing-2', name: 'Fermento Biológico Fresco', package_qty: 500, unit: 'g', package_price: 8.9, unit_cost: 0.0178 },
  { id: 'ing-3', name: 'Manteiga sem Sal', package_qty: 500, unit: 'g', package_price: 18.0, unit_cost: 0.036 },
  { id: 'ing-4', name: 'Açúcar Cristal', package_qty: 5, unit: 'kg', package_price: 19.5, unit_cost: 3.9 },
  { id: 'ing-5', name: 'Ovos Médios', package_qty: 30, unit: 'un', package_price: 24.0, unit_cost: 0.8 },
  { id: 'ing-6', name: 'Leite Integral', package_qty: 1, unit: 'l', package_price: 5.5, unit_cost: 5.5 },
  { id: 'ing-7', name: 'Embalagem Saco Kraft / Plástico', package_qty: 100, unit: 'un', package_price: 25.0, unit_cost: 0.25 },
  { id: 'ing-8', name: 'Sal Refinado', package_qty: 1, unit: 'kg', package_price: 3.2, unit_cost: 3.2 },
];

const Logo = ({ size = 'h-10 w-10' }) => (
  <div
    className={`inline-flex ${size} items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 shadow-xl shadow-indigo-950/50`}
  >
    <Wallet className="h-1/2 w-1/2 text-white" />
  </div>
);

const Skeleton = () => (
  <div className="min-h-screen animate-pulse p-4 sm:p-6">
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="h-16 rounded-2xl bg-slate-800/40" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-slate-800/40" />
        ))}
      </div>
      <div className="h-80 rounded-2xl bg-slate-800/40" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-72 rounded-2xl bg-slate-800/40" />
        <div className="h-72 rounded-2xl bg-slate-800/40" />
      </div>
    </div>
  </div>
);

const DashboardInner = () => {
  const { addToast } = useToast();

  // Navigation & theme
  const [activeTab, setActiveTab] = useState('overview');
  const [theme, setTheme] = useState(() => localStorage.getItem('gf-theme') || 'dark');

  // Core data states
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cashEntries, setCashEntries] = useState([]);
  const [customers, setCustomers] = useState([]);

  // Bakery data states
  const [ingredients, setIngredients] = useState(() => {
    const saved = localStorage.getItem('gf-ingredients');
    return saved ? JSON.parse(saved) : defaultBakeryIngredients;
  });
  const [recipes, setRecipes] = useState(() => {
    const saved = localStorage.getItem('gf-recipes');
    return saved ? JSON.parse(saved) : [];
  });

  // Form states
  const [newTransaction, setNewTransaction] = useState(emptyTransaction);
  const [editingTransactionId, setEditingTransactionId] = useState(null);
  const [txError, setTxError] = useState('');

  const [productForm, setProductForm] = useState(emptyProduct);
  const [editingProductId, setEditingProductId] = useState(null);

  const [customerForm, setCustomerForm] = useState(emptyCustomer);
  const [editingCustomerId, setEditingCustomerId] = useState(null);
  const [customerMsg, setCustomerMsg] = useState('');
  const [customerError, setCustomerError] = useState('');

  const [cashForm, setCashForm] = useState(emptyCash);
  const [cashError, setCashError] = useState('');

  const [newCategory, setNewCategory] = useState('');
  const [goalInput, setGoalInput] = useState('');
  const [goalMsg, setGoalMsg] = useState('');

  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [receivePayment, setReceivePayment] = useState('dinheiro');

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm: '',
  });
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Modals
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [quickActionDefaultMode, setQuickActionDefaultMode] = useState('venda');
  const [confirmModal, setConfirmModal] = useState(null);

  // Filters
  const [filters, setFilters] = useState({ search: '', type: '', category: '', status: '', period: '' });

  // Auth modes
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Apply theme
  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    localStorage.setItem('gf-theme', theme);
  }, [theme]);

  // Sync ingredients and recipes to localStorage
  useEffect(() => {
    localStorage.setItem('gf-ingredients', JSON.stringify(ingredients));
  }, [ingredients]);

  useEffect(() => {
    localStorage.setItem('gf-recipes', JSON.stringify(recipes));
  }, [recipes]);

  // Initial load
  const loadAllData = useCallback(async () => {
    try {
      const [txRes, prodRes, catRes, cashRes, custRes, bakeryRes] = await Promise.all([
        fetch('/api/transactions'),
        fetch('/api/products'),
        fetch('/api/categories'),
        fetch('/api/cash'),
        fetch('/api/customers'),
        fetch('/api/bakery').catch(() => null),
      ]);
      if (txRes && txRes.ok) setTransactions(await txRes.json());
      if (prodRes && prodRes.ok) setProducts(await prodRes.json());
      if (catRes && catRes.ok) setCategories(await catRes.json());
      if (cashRes && cashRes.ok) setCashEntries(await cashRes.json());
      if (custRes && custRes.ok) setCustomers(await custRes.json());
      if (bakeryRes && bakeryRes.ok) {
        const bData = await bakeryRes.json();
        if (bData.ingredients && bData.ingredients.length > 0) setIngredients(bData.ingredients);
        if (bData.recipes && bData.recipes.length > 0) setRecipes(bData.recipes);
      }
    } catch {
      // ignore network errors
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/me');
        if (res.ok) {
          const me = await res.json();
          setUser(me);
          setGoalInput(Number(me.monthly_goal) || '');
          await loadAllData();
        }
      } catch {
        // user not logged in
      } finally {
        setLoading(false);
      }
    })();
  }, [loadAllData]);

  // Quick Action Modal helpers
  const handleOpenQuickAction = (mode = 'venda') => {
    setQuickActionDefaultMode(mode);
    setQuickActionOpen(true);
  };

  // Auth handlers
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const endpoint = authMode === 'login' ? '/api/login' : '/api/register';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setUser(data.user);
        setGoalInput(Number(data.user?.monthly_goal) || '');
        await loadAllData();
        addToast(authMode === 'login' ? 'Bem-vindo de volta!' : 'Conta criada com sucesso!');
      } else {
        setAuthError(data.error || 'Erro na autenticação.');
      }
    } catch {
      setAuthError('Erro de conexão com o servidor.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/me', { method: 'POST' });
    } catch {
      // proceed anyway
    }
    setUser(null);
    setTransactions([]);
    setProducts([]);
    setCategories([]);
    setCashEntries([]);
    setCustomers([]);
    setActiveTab('overview');
    addToast('Sessão encerrada com sucesso.', 'info');
  };

  // Bakery Handlers
  const handleSaveIngredient = async (ingData) => {
    const id = ingData.id || crypto.randomUUID();
    const unitCost = (Number(ingData.package_price) || 0) / (Number(ingData.package_qty) || 1);
    const item = { ...ingData, id, unit_cost: unitCost };

    // Update local state
    setIngredients((prev) => {
      const exists = prev.some((i) => i.id === id);
      if (exists) return prev.map((i) => (i.id === id ? item : i));
      return [...prev, item];
    });

    // Try backend API
    fetch('/api/bakery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save_ingredient', ...item }),
    }).catch(() => {});

    addToast(`Ingrediente "${item.name}" salvo com sucesso!`);
    return true;
  };

  const handleDeleteIngredient = (id) => {
    setConfirmModal({
      title: 'Excluir Ingrediente?',
      message: 'Este ingrediente será removido do banco de insumos.',
      onConfirm: async () => {
        setIngredients((prev) => prev.filter((i) => i.id !== id));
        fetch('/api/bakery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete_ingredient', id }),
        }).catch(() => {});
        addToast('Ingrediente removido.', 'info');
        setConfirmModal(null);
      },
    });
  };

  const handleSaveRecipe = async (recipeData) => {
    const id = recipeData.id || crypto.randomUUID();
    const item = { ...recipeData, id };

    setRecipes((prev) => {
      const exists = prev.some((r) => r.id === id);
      if (exists) return prev.map((r) => (r.id === id ? item : r));
      return [...prev, item];
    });

    fetch('/api/bakery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save_recipe', ...item }),
    }).catch(() => {});

    return true;
  };

  const handleDeleteRecipe = (id) => {
    setConfirmModal({
      title: 'Excluir Ficha Técnica da Receita?',
      message: 'Esta receita será removida da lista.',
      onConfirm: async () => {
        setRecipes((prev) => prev.filter((r) => r.id !== id));
        fetch('/api/bakery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete_recipe', id }),
        }).catch(() => {});
        addToast('Receita excluída.', 'info');
        setConfirmModal(null);
      },
    });
  };

  const handleSendRecipeToProducts = async (prodData) => {
    const existing = products.find((p) => p.name.toLowerCase() === prodData.name.toLowerCase());
    const payload = {
      id: existing ? existing.id : crypto.randomUUID(),
      name: prodData.name,
      cost_price: Number(prodData.cost_price),
      sale_price: Number(prodData.sale_price),
      stock_qty: (Number(existing?.stock_qty) || 0) + Number(prodData.stock_qty),
      min_stock: Number(prodData.min_stock),
    };

    const res = await fetch('/api/products', {
      method: existing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      await loadAllData();
    } else {
      // Local fallback
      setProducts((prev) => {
        if (existing) return prev.map((p) => (p.id === existing.id ? payload : p));
        return [...prev, payload];
      });
    }
  };

  // Transactions handlers
  const handleSaveTransaction = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setTxError('');

    if (!newTransaction.name.trim()) {
      setTxError('Informe a descrição da transação.');
      return false;
    }
    if (newTransaction.type !== 'ajuste' && Number(newTransaction.amount) <= 0) {
      setTxError('Informe um valor maior que zero.');
      return false;
    }

    const payload = {
      ...newTransaction,
      product_id: newTransaction.product_id || null,
      customer_id: newTransaction.customer_id || null,
      amount: newTransaction.type === 'ajuste' ? 0 : Math.abs(Number(newTransaction.amount)),
      quantity: Math.abs(Number(newTransaction.quantity)) || 1,
      discount: newTransaction.type === 'venda' ? Math.abs(Number(newTransaction.discount) || 0) : 0,
    };

    const res = await fetch('/api/transactions', {
      method: editingTransactionId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingTransactionId ? { ...payload, id: editingTransactionId } : payload),
    });

    if (res.ok) {
      setNewTransaction(emptyTransaction());
      setEditingTransactionId(null);
      await loadAllData();
      addToast(
        editingTransactionId
          ? 'Transação atualizada com sucesso!'
          : `${payload.type === 'venda' ? 'Venda' : payload.type === 'compra' ? 'Compra' : 'Ajuste'} registrado!`
      );
      return true;
    } else {
      const data = await res.json().catch(() => ({}));
      setTxError(data.error || 'Erro ao salvar a transação.');
      return false;
    }
  };

  const handleQuickModalTransaction = async (txData) => {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(txData),
    });

    if (res.ok) {
      await loadAllData();
      addToast(`${txData.type === 'venda' ? 'Venda' : 'Compra'} de ${formatBRL(txData.amount)} registrada!`);
      return true;
    } else {
      const data = await res.json().catch(() => ({}));
      addToast(data.error || 'Erro ao registrar operação.', 'error');
      return false;
    }
  };

  const handleDeleteTransaction = (id) => {
    setConfirmModal({
      title: 'Excluir Transação?',
      message: 'Esta transação será removida e o estoque do produto será recalculado automaticamente.',
      onConfirm: async () => {
        const res = await fetch(`/api/transactions?id=${encodeURIComponent(id)}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          await loadAllData();
          addToast('Transação excluída com sucesso.', 'info');
        }
        setConfirmModal(null);
      },
    });
  };

  // Products handlers
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productForm.name.trim()) return;

    const payload = {
      name: productForm.name.trim(),
      cost_price: Math.abs(Number(productForm.cost_price)) || 0,
      sale_price: Math.abs(Number(productForm.sale_price)) || 0,
      stock_qty: Number(productForm.stock_qty) || 0,
      min_stock: Math.abs(Number(productForm.min_stock)) || 0,
    };

    const res = await fetch('/api/products', {
      method: editingProductId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingProductId ? { ...payload, id: editingProductId } : payload),
    });

    if (res.ok) {
      setProductForm(emptyProduct());
      setEditingProductId(null);
      await loadAllData();
      addToast(editingProductId ? 'Produto atualizado!' : `Produto "${payload.name}" cadastrado!`);
    } else {
      const data = await res.json().catch(() => ({}));
      addToast(data.error || 'Erro ao salvar o produto.', 'error');
    }
  };

  const handleDeleteProduct = (p) => {
    setConfirmModal({
      title: 'Excluir Produto?',
      message: `O produto "${p.name}" e seu saldo de estoque serão removidos. As transações anteriores serão mantidas.`,
      onConfirm: async () => {
        const res = await fetch(`/api/products?id=${encodeURIComponent(p.id)}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          await loadAllData();
          addToast('Produto excluído.', 'info');
        }
        setConfirmModal(null);
      },
    });
  };

  const handleQuickSell = (product) => {
    setNewTransaction({
      ...emptyTransaction(),
      type: 'venda',
      product_id: product.id,
      name: product.name,
      amount: Number(product.sale_price) || 0,
      quantity: 1,
    });
    setActiveTab('transactions');
  };

  const handleQuickBuy = (product) => {
    setNewTransaction({
      ...emptyTransaction(),
      type: 'compra',
      product_id: product.id,
      name: `Compra: ${product.name}`,
      amount: Number(product.cost_price) || 0,
      quantity: Math.max(1, (Number(product.min_stock) || 1) - (Number(product.stock_qty) || 0)),
    });
    setActiveTab('transactions');
  };

  // Customers handlers
  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    setCustomerError('');
    setCustomerMsg('');
    if (!customerForm.name.trim()) return;

    const payload = {
      name: customerForm.name.trim(),
      phone: customerForm.phone.trim(),
    };

    const res = await fetch('/api/customers', {
      method: editingCustomerId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingCustomerId ? { ...payload, id: editingCustomerId } : payload),
    });

    if (res.ok) {
      setCustomerForm(emptyCustomer());
      setEditingCustomerId(null);
      await loadAllData();
      addToast(editingCustomerId ? 'Cliente atualizado!' : `Cliente "${payload.name}" cadastrado!`);
    } else {
      const data = await res.json().catch(() => ({}));
      setCustomerError(data.error || 'Erro ao salvar o cliente.');
    }
  };

  const handleDeleteCustomer = (c) => {
    setConfirmModal({
      title: 'Excluir Cliente?',
      message: `O cliente "${c.name}" será removido. O histórico de transações será mantido.`,
      onConfirm: async () => {
        const res = await fetch(`/api/customers?id=${encodeURIComponent(c.id)}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          await loadAllData();
          addToast('Cliente excluído.', 'info');
        }
        setConfirmModal(null);
      },
    });
  };

  // Cash handlers
  const handleSaveCash = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setCashError('');

    if (!cashForm.description.trim()) {
      setCashError('Informe a descrição do lançamento.');
      return false;
    }
    if (Number(cashForm.amount) <= 0) {
      setCashError('Informe um valor maior que zero.');
      return false;
    }

    const payload = {
      ...cashForm,
      description: cashForm.description.trim(),
      amount: Math.abs(Number(cashForm.amount)),
    };

    const res = await fetch('/api/cash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setCashForm(emptyCash());
      await loadAllData();
      addToast(
        `${payload.type === 'entrada' ? 'Entrada' : 'Saída'} de ${formatBRL(payload.amount)} lançada no caixa!`
      );
      return true;
    } else {
      const data = await res.json().catch(() => ({}));
      setCashError(data.error || 'Erro ao registrar no caixa.');
      return false;
    }
  };

  const handleQuickModalCash = async (cashData) => {
    const res = await fetch('/api/cash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cashData),
    });

    if (res.ok) {
      await loadAllData();
      addToast(`Lançamento de ${formatBRL(cashData.amount)} efetuado no caixa!`);
      return true;
    } else {
      const data = await res.json().catch(() => ({}));
      addToast(data.error || 'Erro ao registrar lançamento.', 'error');
      return false;
    }
  };

  const handleDeleteCash = (id) => {
    setConfirmModal({
      title: 'Excluir Lançamento de Caixa?',
      message: 'Este lançamento será removido e o saldo será recalculado.',
      onConfirm: async () => {
        const res = await fetch(`/api/cash?id=${encodeURIComponent(id)}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          await loadAllData();
          addToast('Lançamento de caixa removido.', 'info');
        }
        setConfirmModal(null);
      },
    });
  };

  // Receivables settlement
  const handleReceiveTransaction = async (id) => {
    const res = await fetch('/api/receivables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction_id: id, payment_method: receivePayment }),
    });

    if (res.ok) {
      await loadAllData();
      addToast('Fiado recebido e creditado no caixa com sucesso!');
    } else {
      const data = await res.json().catch(() => ({}));
      addToast(data.error || 'Erro ao baixar o fiado.', 'error');
    }
  };

  // Goal & Categories
  const handleSaveGoal = async (e) => {
    e.preventDefault();
    setGoalMsg('');
    const val = Number(goalInput) || 0;
    const res = await fetch('/api/goal', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monthly_goal: val }),
    });

    if (res.ok) {
      setUser({ ...user, monthly_goal: val });
      setGoalMsg(val > 0 ? 'Meta mensal salva com sucesso!' : 'Meta removida.');
      addToast('Meta mensal atualizada!');
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCategory.trim() }),
    });

    if (res.ok) {
      setNewCategory('');
      await loadAllData();
      addToast('Categoria adicionada!');
    }
  };

  const handleDeleteCategory = (id) => {
    setConfirmModal({
      title: 'Excluir Categoria?',
      message: 'A categoria será removida. As transações associadas serão mantidas.',
      onConfirm: async () => {
        const res = await fetch(`/api/categories?id=${encodeURIComponent(id)}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          await loadAllData();
          addToast('Categoria removida.', 'info');
        }
        setConfirmModal(null);
      },
    });
  };

  // Password change
  const handleSavePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg('');
    setPasswordError('');

    if (passwordForm.new_password.length < 8) {
      setPasswordError('A nova senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm) {
      setPasswordError('A confirmação de senha não confere.');
      return;
    }

    const res = await fetch('/api/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setPasswordMsg('Senha alterada com sucesso.');
      setPasswordForm({ current_password: '', new_password: '', confirm: '' });
      addToast('Senha atualizada com sucesso!');
    } else {
      setPasswordError(data.error || 'Erro ao alterar a senha.');
    }
  };

  // Fiados
  const receivables = useMemo(
    () => transactions.filter((t) => t.type === 'venda' && t.status === 'fiado'),
    [transactions]
  );

  if (loading) {
    return <Skeleton />;
  }

  // Auth Screen
  if (!user) {
    return (
      <div className="relative flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-black/50 backdrop-blur-md">
          <div className="mb-6 text-center">
            <Logo size="h-16 w-16" />
            <h1 className="mt-4 bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-2xl font-extrabold text-transparent">
              Gestão Financeira Pro
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Controle financeiro, precificação e estoque de alta precisão
            </p>
          </div>

          {authError && (
            <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-300">E-mail</label>
              <input
                type="email"
                className="w-full rounded-xl border border-slate-700/80 bg-slate-800/70 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                placeholder="seu.email@empresa.com"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-300">Senha</label>
              <input
                type="password"
                className="w-full rounded-xl border border-slate-700/80 bg-slate-800/70 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                placeholder="mínimo 6 caracteres"
                minLength={6}
                required
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-xl shadow-blue-900/30 transition hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50"
            >
              {authLoading ? 'Carregando...' : authMode === 'login' ? 'Entrar no Sistema' : 'Criar Minha Conta'}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setAuthMode(authMode === 'login' ? 'register' : 'login');
              setAuthError('');
            }}
            className="mt-5 w-full text-center text-xs font-semibold text-blue-400 transition hover:text-blue-300"
          >
            {authMode === 'login' ? 'Novo por aqui? Criar uma conta' : 'Já possui conta? Fazer Login'}
          </button>
        </div>
      </div>
    );
  }

  // Dashboard Main Render
  return (
    <div className="min-h-screen transition-colors">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        setTheme={setTheme}
        user={user}
        onLogout={handleLogout}
        onOpenQuickAction={() => handleOpenQuickAction('venda')}
      />

      <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:pb-12">
        {activeTab === 'overview' && (
          <OverviewTab
            user={user}
            transactions={transactions}
            products={products}
            cashEntries={cashEntries}
            receivables={receivables}
            onNavigateTab={setActiveTab}
            onOpenQuickAction={handleOpenQuickAction}
            onReceiveTransaction={handleReceiveTransaction}
            theme={theme}
          />
        )}

        {activeTab === 'bakery' && (
          <BakeryTab
            ingredients={ingredients}
            recipes={recipes}
            onSaveIngredient={handleSaveIngredient}
            onDeleteIngredient={handleDeleteIngredient}
            onSaveRecipe={handleSaveRecipe}
            onDeleteRecipe={handleDeleteRecipe}
            onSendToProducts={handleSendRecipeToProducts}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsTab
            transactions={transactions}
            cashEntries={cashEntries}
            products={products}
            theme={theme}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsTab
            transactions={transactions}
            products={products}
            categories={categories}
            customers={customers}
            newTransaction={newTransaction}
            setNewTransaction={setNewTransaction}
            editingTransactionId={editingTransactionId}
            setEditingTransactionId={setEditingTransactionId}
            onSaveTransaction={handleSaveTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            txError={txError}
            setTxError={setTxError}
            filters={filters}
            setFilters={setFilters}
          />
        )}

        {activeTab === 'stock' && (
          <StockTab
            products={products}
            transactions={transactions}
            productForm={productForm}
            setProductForm={setProductForm}
            editingProductId={editingProductId}
            setEditingProductId={setEditingProductId}
            onSaveProduct={handleSaveProduct}
            onDeleteProduct={handleDeleteProduct}
            onQuickSell={handleQuickSell}
            onQuickBuy={handleQuickBuy}
          />
        )}

        {activeTab === 'cash' && (
          <CashTab
            cashEntries={cashEntries}
            cashForm={cashForm}
            setCashForm={setCashForm}
            onSaveCash={handleSaveCash}
            onDeleteCash={handleDeleteCash}
            cashError={cashError}
            receivables={receivables}
            onReceiveTransaction={handleReceiveTransaction}
            receivePayment={receivePayment}
            setReceivePayment={setReceivePayment}
          />
        )}

        {activeTab === 'customers' && (
          <CustomersTab
            customers={customers}
            customerForm={customerForm}
            setCustomerForm={setCustomerForm}
            editingCustomerId={editingCustomerId}
            setEditingCustomerId={setEditingCustomerId}
            onSaveCustomer={handleSaveCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            customerMsg={customerMsg}
            customerError={customerError}
          />
        )}

        {activeTab === 'pricing' && <PricingTab />}

        {activeTab === 'settings' && (
          <SettingsTab
            user={user}
            goalInput={goalInput}
            setGoalInput={setGoalInput}
            onSaveGoal={handleSaveGoal}
            goalMsg={goalMsg}
            categories={categories}
            newCategory={newCategory}
            setNewCategory={setNewCategory}
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategory}
            passwordForm={passwordForm}
            setPasswordForm={setPasswordForm}
            onSavePassword={handleSavePassword}
            passwordMsg={passwordMsg}
            passwordError={passwordError}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-800/80 bg-[#0b1220]/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-md items-stretch justify-around py-1">
          {[
            { id: 'overview', label: 'Início', icon: LayoutDashboard },
            { id: 'bakery', label: 'Padaria', icon: Wheat },
            { id: 'analytics', label: 'Gráficos', icon: TrendingUp },
            { id: 'transactions', label: 'Transações', icon: ArrowLeftRight },
            { id: 'stock', label: 'Estoque', icon: Package },
            { id: 'cash', label: 'Caixa', icon: Wallet },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-1 flex-col items-center gap-0.5 py-1 text-center text-[10px] font-semibold transition ${
                  isActive ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Modals */}
      <QuickActionModal
        isOpen={quickActionOpen}
        onClose={() => setQuickActionOpen(false)}
        products={products}
        categories={categories}
        customers={customers}
        onSaveTransaction={handleQuickModalTransaction}
        onSaveCash={handleQuickModalCash}
        defaultMode={quickActionDefaultMode}
      />

      <ConfirmModal
        isOpen={Boolean(confirmModal)}
        title={confirmModal?.title}
        message={confirmModal?.message}
        onConfirm={confirmModal?.onConfirm}
        onCancel={() => setConfirmModal(null)}
      />
    </div>
  );
};

const Dashboard = () => (
  <ToastProvider>
    <DashboardInner />
  </ToastProvider>
);

export default Dashboard;