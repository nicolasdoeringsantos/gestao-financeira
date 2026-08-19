import React, { useState, useEffect, useMemo } from 'react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS } from 'chart.js/auto';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Percent,
  Plus,
  Trash2,
  Pencil,
  Sun,
  Moon,
  LayoutDashboard,
  Package,
  BarChart3,
  ClipboardList,
  Inbox,
  Boxes,
  Users,
  Tags,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

const STORAGE_KEY = 'financial-dashboard-transactions';

const typeLabel = { venda: 'Venda', compra: 'Compra', ajuste: 'Ajuste' };
const typeBadge = {
  venda: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/25',
  compra: 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/25',
  ajuste: 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/25',
};

const monthNames = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];
const chartPalette = ['#3b82f6', '#8b5cf6', '#34d399', '#fbbf24', '#fb923c', '#f43f5e'];

const ChartEmpty = ({ message }) => (
  <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-700/70 px-4 text-center text-sm text-slate-500">
    {message}
  </div>
);

const EmptyState = ({ icon: Icon, title, hint }) => (
  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700/70 px-4 py-8 text-center">
    <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/50 text-slate-500">
      <Icon className="h-6 w-6" />
    </div>
    <p className="text-sm font-semibold text-slate-300">{title}</p>
    {hint && <p className="mt-1 max-w-sm text-xs text-slate-500">{hint}</p>}
  </div>
);

const Logo = ({ size = 'h-9 w-9' }) => (
  <div
    className={`inline-flex ${size} items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 shadow-lg shadow-blue-900/40`}
  >
    <Wallet className="h-1/2 w-1/2 text-white" />
  </div>
);

const Skeleton = () => (
  <div className="min-h-screen animate-pulse p-4 sm:p-6">
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="h-16 rounded-2xl bg-slate-800/50" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-slate-800/50" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-72 rounded-2xl bg-slate-800/50" />
        <div className="h-72 rounded-2xl bg-slate-800/50" />
      </div>
      <div className="h-48 rounded-2xl bg-slate-800/50" />
      <div className="h-48 rounded-2xl bg-slate-800/50" />
    </div>
  </div>
);

const TrendBadge = ({ current, previous, invert = false }) => {
  const diff = (Number(current) || 0) - (Number(previous) || 0);
  if (diff === 0) return null;
  const up = diff > 0;
  const good = invert ? !up : up;
  return (
    <span
      className={`mt-1.5 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
        good ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
      }`}
    >
      {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {Math.abs(diff).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      <span className="font-normal opacity-70">vs ontem</span>
    </span>
  );
};

const emptyTransaction = () => ({
  id: crypto.randomUUID(),
  type: 'venda',
  name: '',
  amount: 0,
  discount: 0,
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
  cost_price: 0,
  sale_price: 0,
  stock_qty: 0,
  min_stock: 0,
});

const emptyCash = () => ({
  type: 'entrada',
  description: '',
  amount: 0,
  payment_method: 'dinheiro',
  date: new Date().toISOString().slice(0, 10),
});

const paymentLabels = {
  dinheiro: 'Dinheiro',
  pix: 'Pix',
  cartao_debito: 'Cartão de débito',
  cartao_credito: 'Cartão de crédito',
  outros: 'Outros',
};

const paymentOptions = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'pix', label: 'Pix' },
  { value: 'cartao_debito', label: 'Cartão de débito' },
  { value: 'cartao_credito', label: 'Cartão de crédito' },
  { value: 'outros', label: 'Outros' },
];

const Dashboard = () => {
  const [productName, setProductName] = useState('');
  const [acquisitionCost, setAcquisitionCost] = useState(0);
  const [variableCostPct, setVariableCostPct] = useState(0);
  const [fixedCostPct, setFixedCostPct] = useState(0);
  const [desiredPrice, setDesiredPrice] = useState(0);

  const [transactions, setTransactions] = useState([]);
  const [newTransaction, setNewTransaction] = useState(emptyTransaction);
  const [txError, setTxError] = useState('');
  const [editingTransactionId, setEditingTransactionId] = useState(null);

  const [products, setProducts] = useState([]);
  const [productForm, setProductForm] = useState(emptyProduct);
  const [editingProductId, setEditingProductId] = useState(null);

  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');

  const [cashEntries, setCashEntries] = useState([]);
  const [cashForm, setCashForm] = useState(emptyCash);
  const [cashError, setCashError] = useState('');

  const [filters, setFilters] = useState({ search: '', type: '', category: '', period: '' });

  const [customers, setCustomers] = useState([]);
  const [customerForm, setCustomerForm] = useState(emptyCustomer);
  const [editingCustomerId, setEditingCustomerId] = useState(null);
  const [customerMsg, setCustomerMsg] = useState('');
  const [customerError, setCustomerError] = useState('');

  const [theme, setTheme] = useState(() => localStorage.getItem('gf-theme') || 'dark');

  const [confirmState, setConfirmState] = useState(null);

  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [resetToken, setResetToken] = useState(null);
  const [resetForm, setResetForm] = useState({ password: '', confirm: '' });
  const [resetError, setResetError] = useState('');
  const [resetDone, setResetDone] = useState(false);

  const [goalInput, setGoalInput] = useState(0);
  const [goalMsg, setGoalMsg] = useState('');

  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [receivePayment, setReceivePayment] = useState('dinheiro');

  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    localStorage.setItem('gf-theme', theme);
  }, [theme]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reset = params.get('reset');
    if (reset) setResetToken(reset);

    (async () => {
      try {
        const res = await fetch('/api/me');
        if (res.ok) {
          const me = await res.json();
          setUser(me);
          setGoalInput(Number(me.monthly_goal) || 0);
          const [txRes, prodRes, catRes, cashRes, custRes] = await Promise.all([
            fetch('/api/transactions'),
            fetch('/api/products'),
            fetch('/api/categories'),
            fetch('/api/cash'),
            fetch('/api/customers'),
          ]);
          if (txRes.ok) setTransactions(await txRes.json());
          if (prodRes.ok) setProducts(await prodRes.json());
          if (catRes.ok) setCategories(await catRes.json());
          if (cashRes.ok) setCashEntries(await cashRes.json());
          if (custRes.ok) setCustomers(await custRes.json());
        }
      } catch {
        // sem sessão ou erro de rede: mantém deslogado
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  const calculations = useMemo(() => {
    const variableCostValue = (variableCostPct / 100) * desiredPrice;
    const fixedCostValue = (fixedCostPct / 100) * desiredPrice;
    const totalCosts = acquisitionCost + variableCostValue + fixedCostValue;
    const grossProfit = desiredPrice - acquisitionCost;
    const netProfit = desiredPrice - totalCosts;
    const marginPercentage = desiredPrice > 0 ? (netProfit / desiredPrice) * 100 : 0;
    const markup = totalCosts > 0 ? desiredPrice / totalCosts : 0;

    return { totalCosts, grossProfit, netProfit, marginPercentage, markup };
  }, [acquisitionCost, variableCostPct, fixedCostPct, desiredPrice]);

  const filtered = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const weekAgo = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .slice(0, 10);
    const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
    const lastYearStart = new Date(new Date().getFullYear() - 1, 0, 1).toISOString().slice(0, 10);

    return {
      daily: transactions.filter((t) => t.date === today),
      yesterday: transactions.filter((t) => t.date === yesterday),
      weekly: transactions.filter((t) => t.date >= weekAgo && t.date <= today),
      monthly: transactions.filter((t) => t.date >= monthStart && t.date <= today),
      annual: transactions.filter((t) => t.date >= yearStart && t.date <= today),
      lastYear: transactions.filter((t) => t.date >= lastYearStart && t.date < yearStart),
    };
  }, [transactions]);

  const netAmount = (t) =>
    t.type === 'venda'
      ? (Number(t.amount) || 0) - (Number(t.discount) || 0)
      : Number(t.amount) || 0;

  const totals = useMemo(() => {
    const calc = (list) =>
      list.reduce(
        (acc, t) => {
          const value = netAmount(t);
          if (t.type === 'venda') acc.revenue += value;
          else if (t.type === 'compra') acc.expenses += Math.abs(value);
          return acc;
        },
        { revenue: 0, expenses: 0 }
      );
    const daily = calc(filtered.daily);
    const weekly = calc(filtered.weekly);
    const monthly = calc(filtered.monthly);
    const annual = calc(filtered.annual);
    const lastYear = calc(filtered.lastYear);
    const yesterday = calc(filtered.yesterday);
    return {
      daily,
      weekly,
      monthly,
      annual,
      lastYear,
      yesterday,
      net: (t) => t.revenue - t.expenses,
      margin: (t) =>
        t.revenue > 0 ? ((t.revenue - t.expenses) / t.revenue) * 100 : 0,
    };
  }, [filtered]);

  const loadTransactions = async () => {
    try {
      const res = await fetch('/api/transactions');
      if (res.ok) setTransactions(await res.json());
    } catch {
      // ignora erro de rede
    }
  };

  const loadProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) setProducts(await res.json());
    } catch {
      // ignora erro de rede
    }
  };

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) setCategories(await res.json());
    } catch {
      // ignora erro de rede
    }
  };

  const loadCash = async () => {
    try {
      const res = await fetch('/api/cash');
      if (res.ok) setCashEntries(await res.json());
    } catch {
      // ignora erro de rede
    }
  };

  const loadCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      if (res.ok) setCustomers(await res.json());
    } catch {
      // ignora erro de rede
    }
  };

  const downloadCSV = (filename, rows) => {
    const csv = rows
      .map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';'))
      .join('\r\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleProductChange = (e) => {
    setProductForm({ ...productForm, [e.target.name]: e.target.value });
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (!productForm.name.trim()) return;
    const payload = {
      name: productForm.name.trim(),
      cost_price: Number(productForm.cost_price) || 0,
      sale_price: Number(productForm.sale_price) || 0,
      stock_qty: Number(productForm.stock_qty) || 0,
      min_stock: Number(productForm.min_stock) || 0,
    };
    const res = await fetch(
      editingProductId ? '/api/products' : '/api/products',
      {
        method: editingProductId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingProductId ? { ...payload, id: editingProductId } : payload),
      }
    );
    if (res.ok) {
      setProductForm(emptyProduct());
      setEditingProductId(null);
      await Promise.all([loadProducts(), loadTransactions()]);
    }
  };

  const handleEditProduct = (p) => {
    setEditingProductId(p.id);
    setProductForm({
      name: p.name,
      cost_price: p.cost_price,
      sale_price: p.sale_price,
      stock_qty: p.stock_qty,
      min_stock: p.min_stock || 0,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteProduct = async (id) => {
    const res = await fetch(`/api/products?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (res.ok) await loadProducts();
  };

  const startTransactionFor = (product, type) => {
    setTxError('');
    setNewTransaction({
      ...emptyTransaction(),
      type,
      product_id: product.id,
      name: product.name,
      amount:
        type === 'ajuste'
          ? 0
          : type === 'venda'
            ? Number(product.sale_price) || 0
            : Number(product.cost_price) || 0,
      quantity: 1,
    });
    document
      .getElementById('registrar-transacao')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const importLocalTransactions = async () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const local = JSON.parse(stored);
      if (!Array.isArray(local) || local.length === 0) return;
      for (const t of local) {
        await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: t.id,
            type: t.type || (Number(t.amount) >= 0 ? 'venda' : 'compra'),
            name: t.name,
            amount: Math.abs(Number(t.amount)) || 0,
            quantity: Number(t.quantity) || 1,
            category: t.category || '',
            date: t.date,
          }),
        });
      }
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // mantém os dados locais caso a importação falhe
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const res = await fetch(authMode === 'login' ? '/api/login' : '/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || 'Erro ao autenticar.');
        return;
      }
      setUser({ id: data.id, email: data.email });
      await importLocalTransactions();
      await loadTransactions();
    } catch {
      setAuthError('Erro de conexão. Tente novamente.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/me', { method: 'POST' });
    } catch {
      // segue para o logout local mesmo com erro
    }
    setUser(null);
    setTransactions([]);
    setProducts([]);
    setCategories([]);
    setCashEntries([]);
    setCustomers([]);
    setNewTransaction(emptyTransaction());
    setEditingTransactionId(null);
    setReceivePayment('dinheiro');
    setFilters({ search: '', type: '', category: '', period: '' });
  };

  const handleNewTransactionChange = (e) => {
    setTxError('');
    setNewTransaction({
      ...newTransaction,
      [e.target.name]: e.target.value,
    });
  };

  const handleTransactionProductChange = (e) => {
    setTxError('');
    const productId = e.target.value;
    const product = products.find((p) => p.id === productId);
    if (product) {
      const type = newTransaction.type;
      setNewTransaction({
        ...newTransaction,
        product_id: productId,
        name: product.name,
        amount:
          type === 'ajuste'
            ? 0
            : type === 'venda'
              ? Number(product.sale_price) || 0
              : Number(product.cost_price) || 0,
        discount: 0,
        quantity: 1,
      });
    } else {
      setNewTransaction({ ...newTransaction, product_id: '' });
    }
  };

  const handleTransactionTypeChange = (value) => {
    setTxError('');
    const product = products.find((p) => p.id === newTransaction.product_id);
    setNewTransaction({
      ...newTransaction,
      type: value,
      discount: value === 'venda' ? newTransaction.discount : 0,
      amount:
        value === 'ajuste'
          ? 0
          : product
            ? value === 'venda'
              ? Number(product.sale_price) || 0
              : Number(product.cost_price) || 0
            : newTransaction.amount,
    });
  };

  const handleNewTransactionSubmit = async (e) => {
    e.preventDefault();
    setTxError('');
    if (!newTransaction.name.trim()) return;
    if (newTransaction.type !== 'ajuste') {
      if (Number(newTransaction.amount) <= 0) return;
      if (Number(newTransaction.quantity) <= 0) return;
    }
    const amount =
      newTransaction.type === 'ajuste'
        ? 0
        : Math.abs(Number(newTransaction.amount));
    const quantity =
      newTransaction.type === 'ajuste'
        ? Number(newTransaction.quantity) || 0
        : Math.abs(Number(newTransaction.quantity));
    const discount =
      newTransaction.type === 'venda'
        ? Math.abs(Number(newTransaction.discount) || 0)
        : 0;
    const payload = {
      ...newTransaction,
      product_id: newTransaction.product_id || null,
      customer_id: newTransaction.customer_id || null,
      amount,
      quantity,
      discount,
    };
    const res = await fetch('/api/transactions', {
      method: editingTransactionId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingTransactionId ? { ...payload, id: editingTransactionId } : payload),
    });
    if (res.ok) {
      setNewTransaction(emptyTransaction());
      setEditingTransactionId(null);
      await Promise.all([loadTransactions(), loadProducts()]);
    } else {
      const data = await res.json().catch(() => ({}));
      setTxError(data.error || 'Erro ao registrar a transação.');
    }
  };

  const handleEditTransaction = (t) => {
    setTxError('');
    setEditingTransactionId(t.id);
    setNewTransaction({
      id: t.id,
      type: t.type,
      name: t.name,
      amount: t.amount,
      discount: Number(t.discount) || 0,
      quantity: t.quantity,
      category: t.category || '',
      date: t.date,
      product_id: t.product_id || '',
      status: t.status === 'fiado' ? 'fiado' : 'pago',
      customer_id: t.customer_id || '',
    });
    document
      .getElementById('registrar-transacao')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCancelEditTransaction = () => {
    setEditingTransactionId(null);
    setNewTransaction(emptyTransaction());
    setTxError('');
  };

  const handleDeleteTransaction = async (id) => {
    const res = await fetch(`/api/transactions?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (res.ok) await Promise.all([loadTransactions(), loadProducts()]);
  };

  const confirmThen = (title, message, fn) => {
    setConfirmState({ title, message, onConfirm: fn });
  };

  const confirmDeleteTransaction = (id) => {
    confirmThen(
      'Excluir transação?',
      'Esta ação não pode ser desfeita. O estoque do produto será recalculado.',
      async () => {
        await handleDeleteTransaction(id);
        setConfirmState(null);
      }
    );
  };

  const confirmDeleteProduct = (p) => {
    confirmThen(
      'Excluir produto?',
      `O produto "${p.name}" e seu estoque serão removidos. As transações já registradas são mantidas.`,
      async () => {
        const res = await fetch(`/api/products?id=${encodeURIComponent(p.id)}`, {
          method: 'DELETE',
        });
        if (res.ok) await loadProducts();
        setConfirmState(null);
      }
    );
  };

  const confirmDeleteCash = (id) => {
    confirmThen(
      'Excluir lançamento?',
      'Este lançamento de caixa será removido e o saldo será recalculado.',
      async () => {
        await handleDeleteCash(id);
        setConfirmState(null);
      }
    );
  };

  const confirmDeleteCategory = (id) => {
    confirmThen(
      'Excluir categoria?',
      'A categoria será removida da lista. As transações que a usam são mantidas.',
      async () => {
        await handleDeleteCategory(id);
        setConfirmState(null);
      }
    );
  };

  const handleCashChange = (e) => {
    setCashError('');
    setCashForm({ ...cashForm, [e.target.name]: e.target.value });
  };

  const handleCashSubmit = async (e) => {
    e.preventDefault();
    setCashError('');
    if (!cashForm.description.trim()) return;
    if (Number(cashForm.amount) <= 0) {
      setCashError('Informe um valor maior que zero.');
      return;
    }
    const res = await fetch('/api/cash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...cashForm,
        description: cashForm.description.trim(),
        amount: Math.abs(Number(cashForm.amount)),
      }),
    });
    if (res.ok) {
      setCashForm(emptyCash());
      await loadCash();
    } else {
      const data = await res.json().catch(() => ({}));
      setCashError(data.error || 'Erro ao registrar o lançamento.');
    }
  };

  const handleDeleteCash = async (id) => {
    const res = await fetch(`/api/cash?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (res.ok) await loadCash();
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
      await loadCategories();
    }
  };

  const handleDeleteCategory = async (id) => {
    const res = await fetch(`/api/categories?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (res.ok) await loadCategories();
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMsg('');
    setPasswordError('');
    if (passwordForm.new_password.length < 8) {
      setPasswordError('A nova senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm) {
      setPasswordError('A confirmação não confere com a nova senha.');
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
    } else {
      setPasswordError(data.error || 'Erro ao alterar a senha.');
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotMsg('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
      setForgotMsg('Informe um e-mail válido.');
      return;
    }
    const res = await fetch('/api/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: forgotEmail }),
    });
    const data = await res.json().catch(() => ({}));
    if (data.devLink) {
      setForgotMsg(`Link de recuperação (ambiente de desenvolvimento): ${data.devLink}`);
    } else if (res.ok) {
      setForgotMsg('Se o e-mail existir, enviaremos um link de recuperação.');
    } else {
      setForgotMsg(data.error || 'Erro ao solicitar a recuperação.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetError('');
    if (resetForm.password.length < 8) {
      setResetError('A nova senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (resetForm.password !== resetForm.confirm) {
      setResetError('A confirmação não confere com a nova senha.');
      return;
    }
    const res = await fetch('/api/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: resetToken, new_password: resetForm.password }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setResetDone(true);
      window.history.replaceState({}, '', window.location.pathname);
    } else {
      setResetError(data.error || 'Erro ao redefinir a senha.');
    }
  };

  const handleGoalSubmit = async (e) => {
    e.preventDefault();
    setGoalMsg('');
    const value = Number(goalInput) || 0;
    const res = await fetch('/api/goal', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monthly_goal: value }),
    });
    if (res.ok) {
      setUser({ ...user, monthly_goal: value });
      setGoalMsg(value > 0 ? 'Meta definida!' : 'Meta removida.');
    }
  };

  const handleReceive = async (id) => {
    const res = await fetch('/api/receivables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction_id: id, payment_method: receivePayment }),
    });
    if (res.ok) {
      await loadTransactions();
      await loadCustomers();
      await loadCash();
    }
  };

  const handleCustomerChange = (e) => {
    setCustomerError('');
    setCustomerMsg('');
    setCustomerForm({ ...customerForm, [e.target.name]: e.target.value });
  };

  const handleCustomerSubmit = async (e) => {
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
    const wasEditing = editingCustomerId;
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setCustomerForm(emptyCustomer());
      setEditingCustomerId(null);
      setCustomerMsg(
        data.id
          ? `Cliente "${payload.name}" cadastrado.`
          : wasEditing
            ? 'Cliente atualizado.'
            : 'Cliente salvo.'
      );
      await loadCustomers();
    } else {
      setCustomerError(data.error || 'Erro ao salvar o cliente.');
    }
  };

  const handleEditCustomer = (c) => {
    setEditingCustomerId(c.id);
    setCustomerForm({ name: c.name, phone: c.phone || '' });
    setCustomerMsg('');
    setCustomerError('');
  };

  const handleCancelEditCustomer = () => {
    setEditingCustomerId(null);
    setCustomerForm(emptyCustomer());
    setCustomerMsg('');
    setCustomerError('');
  };

  const handleDeleteCustomer = async (id) => {
    const res = await fetch(`/api/customers?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      await Promise.all([loadCustomers(), loadTransactions()]);
    }
  };

  const confirmDeleteCustomer = (c) => {
    confirmThen(
      'Excluir cliente?',
      `O cliente "${c.name}" será removido. As transações dele serão mantidas, mas sem vínculo ao cliente.`,
      async () => {
        await handleDeleteCustomer(c.id);
        setConfirmState(null);
      }
    );
  };

  const exportTransactionsCSV = () => {
    downloadCSV(
      `transacoes-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        ['Data', 'Tipo', 'Descrição', 'Quantidade', 'Categoria', 'Valor', 'Desconto', 'Produto'],
        ...filteredTransactions.map((t) => [
          t.date,
          typeLabel[t.type] || t.type,
          t.name,
          t.quantity,
          t.category,
          netAmount(t).toFixed(2),
          Number(t.discount) || 0,
          t.product_name || '',
        ]),
      ]
    );
  };

  const exportProductsCSV = () => {
    downloadCSV(
      `produtos-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        ['Produto', 'Custo', 'Venda', 'Estoque', 'Mínimo', 'Valor em estoque'],
        ...products.map((p) => [
          p.name,
          p.cost_price,
          p.sale_price,
          p.stock_qty,
          p.min_stock || 0,
          ((Number(p.cost_price) || 0) * (Number(p.stock_qty) || 0)).toFixed(2),
        ]),
      ]
    );
  };

  const exportCashCSV = () => {
    downloadCSV(
      `caixa-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        ['Data', 'Tipo', 'Descrição', 'Forma de pagamento', 'Valor'],
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

  const formatBRL = (v) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const scrollToSection = (id) => {
    if (id === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const filteredTransactions = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return transactions.filter((t) => {
      if (filters.type && t.type !== filters.type) return false;
      if (filters.category && (t.category || '') !== filters.category) return false;
      if (filters.period === 'hoje' && t.date !== new Date().toISOString().slice(0, 10)) return false;
      if (filters.period === '7d' && t.date < new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10)) return false;
      if (filters.period === '30d' && t.date < new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10)) return false;
      if (filters.period === '90d' && t.date < new Date(Date.now() - 89 * 86400000).toISOString().slice(0, 10)) return false;
      if (q) {
        const hay = `${t.name} ${t.category} ${t.type} ${t.customer_name || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [transactions, filters]);

  const lowStockProducts = useMemo(
    () => products.filter((p) => Number(p.min_stock) > 0 && Number(p.stock_qty) <= Number(p.min_stock)),
    [products]
  );

  const replenish = useMemo(() => {
    const days = 30;
    const cutoff = new Date(Date.now() - (days - 1) * 86400000).toISOString().slice(0, 10);
    const sold = {};
    transactions.forEach((t) => {
      if (t.type === 'venda' && t.product_id && t.date >= cutoff) {
        sold[t.product_id] = (sold[t.product_id] || 0) + Math.abs(Number(t.quantity) || 0);
      }
    });
    return products
      .map((p) => {
        const stock = Number(p.stock_qty) || 0;
        const min = Number(p.min_stock) || 0;
        const soldQty = sold[p.id] || 0;
        const daily = soldQty / days;
        const coverage = daily > 0 ? stock / daily : Infinity;
        const needsRestock = (min > 0 && stock <= min) || (daily > 0 && coverage < 7);
        const suggested = needsRestock
          ? Math.max(1, Math.ceil(Math.max(min, daily * 7)) - stock)
          : 0;
        return { ...p, soldQty, daily, coverage, suggested };
      })
      .filter((p) => p.suggested > 0)
      .sort((a, b) => a.coverage - b.coverage);
  }, [products, transactions]);

  const cashBalance = useMemo(
    () =>
      cashEntries.reduce(
        (acc, c) =>
          acc + (c.type === 'entrada' ? Math.abs(Number(c.amount)) : -Math.abs(Number(c.amount))),
        0
      ),
    [cashEntries]
  );

  const monthTotals = useMemo(() => {
    const list = transactions.filter((t) => (t.date || '').slice(0, 7) === selectedMonth);
    return list.reduce(
      (acc, t) => {
        const value = netAmount(t);
        if (t.type === 'venda') acc.revenue += value;
        else if (t.type === 'compra') acc.expenses += Math.abs(value);
        return acc;
      },
      { revenue: 0, expenses: 0 }
    );
  }, [transactions, selectedMonth]);

  const monthLabel = selectedMonth
    ? `${monthNames[Number(selectedMonth.slice(5, 7)) - 1]}/${selectedMonth.slice(0, 4)}`
    : '';

  const receivables = useMemo(
    () => transactions.filter((t) => t.type === 'venda' && t.status === 'fiado'),
    [transactions]
  );
  const receivablesTotal = receivables.reduce((acc, t) => acc + netAmount(t), 0);
  const goalRevenuePct =
    Number(user?.monthly_goal) > 0
      ? Math.min(100, (totals.monthly.revenue / Number(user.monthly_goal)) * 100)
      : 0;

  const trendBuckets = useMemo(() => {
    const now = new Date();
    const buckets = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return {
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: monthNames[d.getMonth()],
        revenue: 0,
        expenses: 0,
      };
    });
    transactions.forEach((t) => {
      const bucket = buckets.find((b) => b.key === (t.date || '').slice(0, 7));
      if (!bucket) return;
      const value = netAmount(t);
      if (t.type === 'venda') bucket.revenue += value;
      else if (t.type === 'compra') bucket.expenses += Math.abs(value);
    });
    return buckets;
  }, [transactions]);

  const hasTrendData = trendBuckets.some((b) => b.revenue || b.expenses);

  const topExpenses = useMemo(() => {
    const map = {};
    transactions.forEach((t) => {
      if (t.type !== 'compra') return;
      const key = (t.category || '').trim() || 'Sem categoria';
      map[key] = (map[key] || 0) + (Math.abs(Number(t.amount)) || 0);
    });
    return Object.entries(map)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [transactions]);

  const productProfit = useMemo(() => {
    const map = {};
    transactions.forEach((t) => {
      if (t.type !== 'venda') return;
      if (t.product_id) {
        const profit =
          Math.abs(Number(t.quantity) || 0) *
          ((Number(t.product_sale) || 0) - (Number(t.product_cost) || 0));
        const key = `p:${t.product_id}`;
        map[key] = {
          name: t.product_name || t.name,
          profit: (map[key]?.profit || 0) + profit,
        };
      } else {
        const name = (t.name || '').trim();
        if (!name) return;
        map[name] = {
          name,
          profit: (map[name]?.profit || 0) + netAmount(t),
        };
      }
    });
    return Object.values(map)
      .filter((p) => p.profit > 0)
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 6);
  }, [transactions]);

  const revenueData = {
    labels: trendBuckets.map((b) => b.label),
    datasets: [
      {
        label: 'Faturamento',
        data: trendBuckets.map((b) => b.revenue),
        borderColor: '#3b82f6',
        backgroundColor: (ctx) => {
          const { chart } = ctx;
          const { ctx: c, chartArea } = chart;
          if (!chartArea) return 'rgba(59, 130, 246, 0.15)';
          const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          g.addColorStop(0, 'rgba(59, 130, 246, 0.35)');
          g.addColorStop(1, 'rgba(59, 130, 246, 0)');
          return g;
        },
        tension: 0.3,
        fill: true,
      },
      {
        label: 'Lucro',
        data: trendBuckets.map((b) => b.revenue - b.expenses),
        borderColor: '#34d399',
        backgroundColor: (ctx) => {
          const { chart } = ctx;
          const { ctx: c, chartArea } = chart;
          if (!chartArea) return 'rgba(52, 211, 153, 0.15)';
          const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          g.addColorStop(0, 'rgba(52, 211, 153, 0.35)');
          g.addColorStop(1, 'rgba(52, 211, 153, 0)');
          return g;
        },
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const expenseData = {
    labels: topExpenses.map((e) => e.label),
    datasets: [
      {
        data: topExpenses.map((e) => e.value),
        backgroundColor: chartPalette,
      },
    ],
  };

  const profitabilityData = {
    labels: productProfit.map((p) => p.name),
    datasets: [
      {
        data: productProfit.map((p) => p.profit),
        backgroundColor: chartPalette,
      },
    ],
  };

  const currentYear = new Date().getFullYear();
  const hasAnnualData =
    totals.annual.revenue || totals.annual.expenses ||
    totals.lastYear.revenue || totals.lastYear.expenses;
  const annualComparisonData = {
    labels: ['Faturamento', 'Custos', 'Lucro Líquido'],
    datasets: [
      {
        label: String(currentYear),
        data: [
          totals.annual.revenue,
          totals.annual.expenses,
          totals.net(totals.annual),
        ],
        backgroundColor: '#3b82f6',
      },
      {
        label: String(currentYear - 1),
        data: [
          totals.lastYear.revenue,
          totals.lastYear.expenses,
          totals.net(totals.lastYear),
        ],
        backgroundColor: '#34d399',
      },
    ],
  };

  const chartGrid = 'rgba(148, 163, 184, 0.12)';
  const chartTick = '#94a3b8';
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: chartTick, boxWidth: 12, boxHeight: 12, padding: 14, usePointStyle: true },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#e2e8f0',
        bodyColor: '#94a3b8',
        borderColor: 'rgba(148, 163, 184, 0.25)',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        boxPadding: 4,
        callbacks: {
          label: (ctx) => {
            const v = ctx.parsed?.y !== undefined ? ctx.parsed.y : ctx.parsed;
            return ctx.dataset.label
              ? `${ctx.dataset.label}: ${formatBRL(v)}`
              : `${ctx.label}: ${formatBRL(v)}`;
          },
        },
      },
    },
  };
  const lineBarOptions = {
    ...chartOptions,
    scales: {
      x: { grid: { color: chartGrid }, ticks: { color: chartTick } },
      y: { grid: { color: chartGrid }, ticks: { color: chartTick } },
    },
  };
  const pieOptions = {
    ...chartOptions,
    plugins: { ...chartOptions.plugins, legend: { ...chartOptions.plugins.legend, position: 'bottom' } },
  };

  const inputClass =
    'w-full rounded-lg border border-slate-700/70 bg-slate-800/50 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30';
  const labelClass = 'mb-1.5 block text-xs font-semibold tracking-wide text-slate-400';

  if (loading) {
    return <Skeleton />;
  }

  if (!user) {
    return (
      <div className="relative flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 p-8 shadow-2xl shadow-black/40 backdrop-blur">
          <div className="mb-6 text-center">
            <Logo size="h-14 w-14" />
            <h1 className="mt-3 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-2xl font-bold text-transparent">
              Gestão Financeira
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Acesse para gerenciar suas finanças, precificação e estoque.
            </p>
          </div>

          {resetToken ? (
            <>
              <h2 className="mb-4 text-lg font-semibold text-slate-200">Definir nova senha</h2>
              {resetDone ? (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-3 text-sm text-emerald-400">
                  Senha redefinida com sucesso! Você já pode <button type="button" onClick={() => window.location.reload()} className="font-semibold text-emerald-300 underline">entrar</button>.
                </div>
              ) : (
                <>
                  {resetError && (
                    <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                      {resetError}
                    </div>
                  )}
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div>
                      <label className={labelClass}>Nova senha (mínimo 8 caracteres)</label>
                      <input
                        type="password"
                        className={inputClass}
                        value={resetForm.password}
                        onChange={(e) => setResetForm({ ...resetForm, password: e.target.value })}
                        minLength={8}
                        required
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Confirmar nova senha</label>
                      <input
                        type="password"
                        className={inputClass}
                        value={resetForm.confirm}
                        onChange={(e) => setResetForm({ ...resetForm, confirm: e.target.value })}
                        minLength={8}
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/40 transition hover:from-blue-500 hover:to-indigo-500"
                    >
                      Redefinir senha
                    </button>
                  </form>
                </>
              )}
            </>
          ) : forgotMode ? (
            <>
              <h2 className="mb-4 text-lg font-semibold text-slate-200">Recuperar senha</h2>
              <p className="mb-4 text-sm text-slate-400">
                Informe seu e-mail cadastrado para receber o link de recuperação.
              </p>
              {forgotMsg && (
                <div
                  className={`mb-4 rounded-lg border px-3 py-2 text-sm ${
                    forgotMsg.startsWith('Se o e-mail') || forgotMsg.includes('ambiente de desenvolvimento')
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                      : 'border-red-500/30 bg-red-500/10 text-red-400'
                  }`}
                >
                  {forgotMsg}
                </div>
              )}
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className={labelClass}>E-mail</label>
                  <input
                    type="email"
                    className={inputClass}
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="voce@empresa.com.br"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/40 transition hover:from-blue-500 hover:to-indigo-500"
                >
                  Enviar link
                </button>
              </form>
              <button
                type="button"
                onClick={() => {
                  setForgotMode(false);
                  setForgotMsg('');
                }}
                className="mt-4 w-full text-center text-sm text-blue-400 transition hover:text-blue-300"
              >
                Voltar para o login
              </button>
            </>
          ) : (
            <>
              {authError && (
                <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                  {authError}
                </div>
              )}
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div>
                  <label className={labelClass}>E-mail</label>
                  <input
                    type="email"
                    className={inputClass}
                    value={authForm.email}
                    onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                    placeholder="voce@empresa.com.br"
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>Senha</label>
                  <input
                    type="password"
                    className={inputClass}
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
                  className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/40 transition hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50"
                >
                  {authLoading ? 'Aguarde...' : authMode === 'login' ? 'Entrar' : 'Criar conta'}
                </button>
              </form>
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'register' : 'login');
                  setAuthError('');
                }}
                className="mt-4 w-full text-center text-sm text-blue-400 transition hover:text-blue-300"
              >
                {authMode === 'login' ? 'Não tem conta? Criar conta' : 'Já tem conta? Entrar'}
              </button>
              {authMode === 'login' && (
                <button
                  type="button"
                  onClick={() => setForgotMode(true)}
                  className="mt-2 w-full text-center text-sm text-slate-500 transition hover:text-slate-300"
                >
                  Esqueci minha senha
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#0b1220]/80 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Logo size="h-9 w-9 shrink-0" />
            <div className="min-w-0">
              <h1 className="truncate bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-lg font-bold text-transparent sm:text-xl">
                Gestão Financeira
              </h1>
              <p className="hidden truncate text-xs text-slate-400 sm:block">
                Ferramenta de precificação e controle financeiro para pequenas empresas
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="rounded-lg border border-slate-700 p-2 text-slate-300 transition hover:border-slate-500 hover:bg-slate-800/70"
              aria-label={theme === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'}
              title={theme === 'light' ? 'Tema escuro' : 'Tema claro'}
            >
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
            <span className="hidden items-center gap-2 rounded-full border border-slate-700/70 bg-slate-800/50 px-3 py-1.5 text-xs text-slate-300 sm:inline-flex">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              {user.email}
            </span>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 transition hover:border-slate-500 hover:bg-slate-800/70 hover:text-white"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 pb-28 pt-6 sm:px-6 lg:pb-6">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-200">Indicadores de hoje</h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <div className="group rounded-2xl border border-slate-800 bg-slate-900/70 p-4 transition hover:border-slate-700 hover:bg-slate-900">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20">
                <Wallet className="h-5 w-5" />
              </div>
              <p className="text-sm text-slate-400">Faturamento total</p>
              <p className="mt-1 text-2xl font-bold text-slate-100">
                {formatBRL(totals.daily.revenue)}
              </p>
              <TrendBadge current={totals.daily.revenue} previous={totals.yesterday.revenue} />
            </div>
            <div className="group rounded-2xl border border-slate-800 bg-slate-900/70 p-4 transition hover:border-slate-700 hover:bg-slate-900">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20">
                <TrendingDown className="h-5 w-5" />
              </div>
              <p className="text-sm text-slate-400">Custos totais</p>
              <p className="mt-1 text-2xl font-bold text-slate-100">
                {formatBRL(totals.daily.expenses)}
              </p>
              <TrendBadge current={totals.daily.expenses} previous={totals.yesterday.expenses} invert />
            </div>
            <div className="group rounded-2xl border border-slate-800 bg-slate-900/70 p-4 transition hover:border-slate-700 hover:bg-slate-900">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
                <TrendingUp className="h-5 w-5" />
              </div>
              <p className="text-sm text-slate-400">Lucro líquido</p>
              <p className="mt-1 text-2xl font-bold text-emerald-400">
                {formatBRL(totals.net(totals.daily))}
              </p>
              <TrendBadge current={totals.net(totals.daily)} previous={totals.net(totals.yesterday)} />
            </div>
            <div className="group rounded-2xl border border-slate-800 bg-slate-900/70 p-4 transition hover:border-slate-700 hover:bg-slate-900">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/20">
                <Percent className="h-5 w-5" />
              </div>
              <p className="text-sm text-slate-400">Margem média</p>
              <p className="mt-1 text-2xl font-bold text-slate-100">
                {totals.margin(totals.daily).toFixed(1)}%
              </p>
            </div>
            <div className="group rounded-2xl border border-slate-800 bg-slate-900/70 p-4 transition hover:border-slate-700 hover:bg-slate-900">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 ring-1 ring-teal-500/20">
                <Wallet className="h-5 w-5" />
              </div>
              <p className="text-sm text-slate-400">Saldo em caixa</p>
              <p
                className={`mt-1 text-2xl font-bold ${cashBalance >= 0 ? 'text-slate-100' : 'text-rose-400'}`}
              >
                {formatBRL(cashBalance)}
              </p>
            </div>
          </div>
        </section>

        {Number(user?.monthly_goal) > 0 && (
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/20">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-slate-200">
                Meta do mês ({monthLabel})
              </h2>
              <p className="text-sm text-slate-400">
                <span className="font-semibold text-slate-100">{formatBRL(totals.monthly.revenue)}</span>
                {' de '}
                {formatBRL(Number(user.monthly_goal))}
              </p>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className={`h-full rounded-full transition-all ${
                  goalRevenuePct >= 100
                    ? 'bg-emerald-500'
                    : goalRevenuePct >= 70
                      ? 'bg-blue-500'
                      : 'bg-amber-500'
                }`}
                style={{ width: `${goalRevenuePct}%` }}
              />
            </div>
            <p className={`mt-2 text-sm ${goalRevenuePct >= 100 ? 'text-emerald-400' : 'text-slate-400'}`}>
              {goalRevenuePct >= 100
                ? `Meta alcançada! 🎉`
                : `${goalRevenuePct.toFixed(0)}% da meta atingida`}
            </p>
          </section>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/20">
            <h2 className="mb-4 text-lg font-semibold text-slate-200">Calculadora de Precificação</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelClass}>Nome do produto/serviço</label>
                <input
                  className={inputClass}
                  placeholder="Ex.: Bolo de pote"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Custo de aquisição/produção (R$)</label>
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={acquisitionCost}
                  onChange={(e) => setAcquisitionCost(Number(e.target.value))}
                />
              </div>
              <div>
                <label className={labelClass}>Custos variáveis (%)</label>
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={variableCostPct}
                  onChange={(e) => setVariableCostPct(Number(e.target.value))}
                />
              </div>
              <div>
                <label className={labelClass}>Custos fixos proporcionais (%)</label>
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={fixedCostPct}
                  onChange={(e) => setFixedCostPct(Number(e.target.value))}
                />
              </div>
              <div>
                <label className={labelClass}>Preço de venda desejado (R$)</label>
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={desiredPrice}
                  onChange={(e) => setDesiredPrice(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="mt-5 space-y-3 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-sm text-slate-400">Custos totais</span>
                <span className="font-semibold text-slate-100">{formatBRL(calculations.totalCosts)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-sm text-slate-400">Lucro bruto</span>
                <span className="font-semibold text-blue-400">
                  {formatBRL(calculations.grossProfit)}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-sm text-slate-400">Lucro líquido</span>
                <span
                  className={`font-bold ${calculations.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
                >
                  {formatBRL(calculations.netProfit)}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-sm text-slate-400">Margem de lucro</span>
                <span
                  className={`font-bold ${calculations.marginPercentage >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
                >
                  {calculations.marginPercentage.toFixed(2)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Markup sugerido</span>
                <span className="font-bold text-purple-400">
                  {calculations.markup.toFixed(2)}x
                </span>
              </div>
            </div>
          </section>

          <section id="registrar-transacao" className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/20">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-slate-200">Registrar Transação</h2>
              {editingTransactionId && (
                <button
                  type="button"
                  onClick={handleCancelEditTransaction}
                  className="text-xs text-slate-400 transition hover:text-slate-200"
                >
                  Cancelar edição
                </button>
              )}
            </div>
            {editingTransactionId && (
              <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-400">
                Editando uma transação existente. Ao salvar, o estoque é recalculado automaticamente.
              </div>
            )}
            <form onSubmit={handleNewTransactionSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelClass}>Produto</label>
                <select
                  className={inputClass}
                  name="product_id"
                  value={newTransaction.product_id || ''}
                  onChange={handleTransactionProductChange}
                >
                  <option value="">— Produto avulso (sem estoque) —</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (estoque: {p.stock_qty})
                    </option>
                  ))}
                </select>
                {(() => {
                  const sel = products.find((p) => p.id === newTransaction.product_id);
                  if (!sel) return null;
                  return (
                    <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                      <span className="rounded-md border border-slate-700/70 bg-slate-800/40 px-2 py-1.5 text-slate-300">
                        Custo: <span className="font-semibold text-slate-100">{formatBRL(Number(sel.cost_price) || 0)}</span>
                      </span>
                      <span className="rounded-md border border-slate-700/70 bg-slate-800/40 px-2 py-1.5 text-slate-300">
                        Venda: <span className="font-semibold text-emerald-400">{formatBRL(Number(sel.sale_price) || 0)}</span>
                      </span>
                      <span className="rounded-md border border-slate-700/70 bg-slate-800/40 px-2 py-1.5 text-slate-300">
                        Estoque: <span className="font-semibold text-slate-100">{sel.stock_qty}</span>
                      </span>
                    </div>
                  );
                })()}
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Tipo de transação</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'venda', label: 'Venda', hint: 'Receita' },
                    { value: 'compra', label: 'Compra', hint: 'Custo' },
                    { value: 'ajuste', label: 'Ajuste de estoque', hint: 'Sem valor financeiro' },
                  ].map(({ value, label, hint }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleTransactionTypeChange(value)}
                      className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                        newTransaction.type === value
                          ? 'border-blue-500/60 bg-blue-500/10 text-blue-300 ring-1 ring-blue-500/30'
                          : 'border-slate-700 bg-slate-800/40 text-slate-300 hover:border-slate-500 hover:bg-slate-800'
                      }`}
                    >
                      <span className="block font-semibold">{label}</span>
                      <span className="block text-xs text-slate-500">{hint}</span>
                    </button>
                  ))}
                </div>
              </div>
              {newTransaction.type === 'venda' && (
                <div className="sm:col-span-2">
                  <label className={labelClass}>Recebimento</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'pago', label: 'À vista (pago)' },
                      { value: 'fiado', label: 'Fiado (a receber)' },
                    ].map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          setNewTransaction({ ...newTransaction, status: value })
                        }
                        className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                          newTransaction.status === value
                            ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/30'
                            : 'border-slate-700 bg-slate-800/40 text-slate-300 hover:border-slate-500 hover:bg-slate-800'
                        }`}
                      >
                        <span className="block font-semibold">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {newTransaction.type === 'venda' && (
                <div className="sm:col-span-2">
                  <label className={labelClass}>Cliente</label>
                  <select
                    className={inputClass}
                    name="customer_id"
                    value={newTransaction.customer_id || ''}
                    onChange={handleNewTransactionChange}
                  >
                    <option value="">— Cliente avulso —</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                        {c.phone ? ` (${c.phone})` : ''}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-slate-500">
                    Escolha um cliente para registrar a venda no histórico dele. Clientes avulsos
                    seguem sem vínculo.
                  </p>
                </div>
              )}
              <div className="sm:col-span-2">
                <label className={labelClass}>Descrição</label>
                <input
                  className={inputClass}
                  name="name"
                  readOnly={Boolean(newTransaction.product_id)}
                  placeholder={
                    newTransaction.type === 'compra'
                      ? 'Ex.: Compra - Farinha 25kg'
                      : newTransaction.type === 'ajuste'
                        ? 'Ex.: Ajuste - Quebra de estoque'
                        : 'Ex.: Venda - Bolo de pote'
                  }
                  value={newTransaction.name}
                  onChange={handleNewTransactionChange}
                />
              </div>
              <div className={newTransaction.type === 'venda' ? 'sm:col-span-2' : ''}>
                <label className={labelClass}>
                  {newTransaction.type === 'venda'
                    ? 'Valor da venda (R$)'
                    : newTransaction.type === 'compra'
                      ? 'Custo da compra (R$)'
                      : 'Valor (R$)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className={inputClass}
                  name="amount"
                  placeholder={newTransaction.type === 'ajuste' ? 'Sem valor financeiro' : '0,00'}
                  value={newTransaction.amount}
                  disabled={newTransaction.type === 'ajuste'}
                  onChange={handleNewTransactionChange}
                />
              </div>
              <div>
                <label className={labelClass}>
                  {newTransaction.type === 'venda'
                    ? 'Quantidade vendida'
                    : newTransaction.type === 'compra'
                      ? 'Quantidade comprada'
                      : 'Quantidade (+ entrada / - saída)'}
                </label>
                <input
                  type="number"
                  step="any"
                  className={inputClass}
                  name="quantity"
                  placeholder={newTransaction.type === 'ajuste' ? 'Ex.: 5 ou -5' : '1'}
                  value={newTransaction.quantity}
                  onChange={handleNewTransactionChange}
                />
              </div>
              {newTransaction.type === 'venda' && (
                <div>
                  <label className={labelClass}>Desconto (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className={inputClass}
                    name="discount"
                    placeholder="0,00"
                    value={newTransaction.discount}
                    onChange={handleNewTransactionChange}
                  />
                </div>
              )}
              <div>
                <label className={labelClass}>Categoria</label>
                <select
                  className={inputClass}
                  name="category"
                  value={newTransaction.category}
                  onChange={handleNewTransactionChange}
                >
                  <option value="">— Sem categoria —</option>
                  {newTransaction.category &&
                    !categories.some((c) => c.name === newTransaction.category) && (
                      <option value={newTransaction.category}>{newTransaction.category}</option>
                    )}
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Data</label>
                <input
                  type="date"
                  className={inputClass}
                  name="date"
                  value={newTransaction.date}
                  onChange={handleNewTransactionChange}
                />
              </div>
              <div className="sm:col-span-2">
                {txError && (
                  <div className="mb-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-400">
                    {txError}
                  </div>
                )}
              </div>
              <div className="sm:col-span-2 flex items-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 transition hover:from-blue-500 hover:to-indigo-500"
                >
                  {editingTransactionId ? (
                    <>
                      <Pencil className="h-4 w-4" />
                      Salvar alterações
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Adicionar transação
                    </>
                  )}
                </button>
                {editingTransactionId && (
                  <button
                    type="button"
                    onClick={handleCancelEditTransaction}
                    className="ml-2 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:bg-slate-800/70"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>

            <div className="mt-6">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-300">
                  Histórico ({filteredTransactions.length})
                </h3>
                {transactions.length > 0 && (
                  <button
                    type="button"
                    onClick={exportTransactionsCSV}
                    className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-300 transition hover:border-slate-500 hover:bg-slate-800/70"
                  >
                    Exportar CSV
                  </button>
                )}
              </div>

              <div className="mb-3 grid grid-cols-2 gap-2 lg:grid-cols-5">
                <input
                  className={inputClass}
                  placeholder="Buscar..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
                <select
                  className={inputClass}
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                >
                  <option value="">Todos os tipos</option>
                  <option value="venda">Venda</option>
                  <option value="compra">Compra</option>
                  <option value="ajuste">Ajuste</option>
                </select>
                <select
                  className={inputClass}
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                >
                  <option value="">Todas as categorias</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <select
                  className={inputClass}
                  value={filters.period}
                  onChange={(e) => setFilters({ ...filters, period: e.target.value })}
                >
                  <option value="">Todo o período</option>
                  <option value="hoje">Hoje</option>
                  <option value="7d">Últimos 7 dias</option>
                  <option value="30d">Últimos 30 dias</option>
                  <option value="90d">Últimos 90 dias</option>
                </select>
                {(filters.search || filters.type || filters.category || filters.period) && (
                  <button
                    type="button"
                    onClick={() => setFilters({ search: '', type: '', category: '', period: '' })}
                    className="rounded-lg border border-slate-700 px-2 py-1.5 text-xs text-slate-300 transition hover:border-slate-500 hover:bg-slate-800/70"
                  >
                    Limpar filtros
                  </button>
                )}
              </div>

              {transactions.length === 0 ? (
                <EmptyState
                  icon={Inbox}
                  title="Nenhuma transação ainda"
                  hint="Registre sua primeira venda, compra ou ajuste para começar a acompanhar suas finanças."
                />
              ) : filteredTransactions.length === 0 ? (
                <EmptyState
                  icon={Inbox}
                  title="Nada corresponde aos filtros"
                  hint="Ajuste ou limpe os filtros para ver as transações registradas."
                />
              ) : (
                <div className="max-h-64 overflow-auto rounded-xl border border-slate-800">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-slate-950/90 text-left text-xs text-slate-400 backdrop-blur">
                      <tr>
                        <th className="px-3 py-2">Data</th>
                        <th className="px-3 py-2">Tipo</th>
                        <th className="px-3 py-2">Descrição</th>
                        <th className="px-3 py-2 text-right">Qtd</th>
                        <th className="px-3 py-2">Categoria</th>
                        <th className="px-3 py-2 text-right">Valor</th>
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.map((t) => (
                        <tr key={t.id} className="border-t border-slate-800 transition hover:bg-slate-800/40">
                          <td className="whitespace-nowrap px-3 py-2 text-slate-300">{t.date}</td>
                          <td className="px-3 py-2">
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${typeBadge[t.type] || typeBadge.venda}`}
                            >
                              {typeLabel[t.type] || typeLabel.venda}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-slate-200">
                            {t.name}
                            {Number(t.discount) > 0 && (
                              <span className="ml-1 rounded bg-rose-500/10 px-1 py-0.5 text-xs text-rose-400">
                                −{formatBRL(Number(t.discount))}
                              </span>
                            )}
                            {t.type === 'venda' && t.status === 'fiado' && (
                              <span className="ml-1 rounded bg-amber-500/10 px-1 py-0.5 text-xs text-amber-400">
                                Fiado
                              </span>
                            )}
                            {t.customer_name && (
                              <span className="ml-1 rounded bg-sky-500/10 px-1 py-0.5 text-xs text-sky-400">
                                {t.customer_name}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums text-slate-300">
                            {Number(t.quantity) || 0}
                          </td>
                          <td className="px-3 py-2 text-slate-400">{t.category}</td>
                          <td
                            className={`px-3 py-2 text-right font-medium tabular-nums ${
                              t.type === 'venda'
                                ? 'text-emerald-400'
                                : t.type === 'compra'
                                  ? 'text-rose-400'
                                  : 'text-slate-500'
                            }`}
                          >
                            {t.type === 'ajuste'
                              ? '—'
                              : t.type === 'compra'
                                ? formatBRL(-Math.abs(netAmount(t)))
                                : formatBRL(netAmount(t))}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleEditTransaction(t)}
                                className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-700/50 hover:text-blue-400"
                                aria-label="Editar transação"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => confirmDeleteTransaction(t.id)}
                                className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-700/50 hover:text-rose-400"
                                aria-label="Excluir transação"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </div>

        <section id="produtos" className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/20">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-200">Produtos e Estoque</h2>
            <div className="flex items-center gap-2">
              {lowStockProducts.length > 0 && (
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs text-amber-400">
                  {lowStockProducts.length} produto(s) com estoque baixo
                </span>
              )}
              {products.length > 0 && (
                <button
                  type="button"
                  onClick={exportProductsCSV}
                  className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-300 transition hover:border-slate-500 hover:bg-slate-800/70"
                >
                  Exportar CSV
                </button>
              )}
              {editingProductId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingProductId(null);
                    setProductForm(emptyProduct());
                  }}
                  className="text-xs text-slate-400 transition hover:text-slate-200"
                >
                  Cancelar edição
                </button>
              )}
            </div>
          </div>

          <form onSubmit={handleProductSubmit} className="mb-6 grid grid-cols-1 gap-4 rounded-xl border border-slate-800 bg-slate-950/50 p-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className={labelClass}>Nome do produto</label>
              <input
                className={inputClass}
                name="name"
                placeholder="Ex.: Bolo de pote"
                value={productForm.name}
                onChange={handleProductChange}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Custo (R$)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className={inputClass}
                name="cost_price"
                placeholder="0,00"
                value={productForm.cost_price}
                onChange={handleProductChange}
              />
            </div>
            <div>
              <label className={labelClass}>Valor de venda (R$)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className={inputClass}
                name="sale_price"
                placeholder="0,00"
                value={productForm.sale_price}
                onChange={handleProductChange}
              />
            </div>
            <div>
              <label className={labelClass}>Quantidade</label>
              <input
                type="number"
                min="0"
                step="any"
                className={inputClass}
                name="stock_qty"
                placeholder="0"
                value={productForm.stock_qty}
                onChange={handleProductChange}
              />
            </div>
            <div>
              <label className={labelClass}>Estoque mínimo (alerta)</label>
              <input
                type="number"
                min="0"
                step="any"
                className={inputClass}
                name="min_stock"
                placeholder="0"
                value={productForm.min_stock}
                onChange={handleProductChange}
              />
            </div>
            <div className="flex items-end justify-end sm:col-span-2 lg:col-span-5">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 transition hover:from-blue-500 hover:to-indigo-500"
              >
                <Plus className="h-4 w-4" />
                {editingProductId ? 'Salvar' : 'Adicionar produto'}
              </button>
            </div>
          </form>

          {products.length === 0 ? (
            <EmptyState
              icon={Package}
              title="Nenhum produto cadastrado"
              hint="Adicione produtos acima para criar seu estoque e agilizar o registro de vendas."
            />
          ) : (
            <div className="overflow-auto rounded-xl border border-slate-800">
              <table className="w-full text-sm">
                <thead className="bg-slate-950/90 text-left text-xs text-slate-400">
                  <tr>
                    <th className="px-3 py-2">Produto</th>
                    <th className="px-3 py-2 text-right">Custo</th>
                    <th className="px-3 py-2 text-right">Venda</th>
                    <th className="px-3 py-2 text-right">Estoque</th>
                    <th className="px-3 py-2 text-right">Mín.</th>
                    <th className="px-3 py-2 text-right">Valor em estoque</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className="border-t border-slate-800 transition hover:bg-slate-800/40">
                      <td className="px-3 py-2 font-medium text-slate-200">{p.name}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-300">
                        {formatBRL(Number(p.cost_price) || 0)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-emerald-400">
                        {formatBRL(Number(p.sale_price) || 0)}
                      </td>
                      <td
                        className={`px-3 py-2 text-right tabular-nums ${
                          Number(p.stock_qty) < 0 ? 'font-semibold text-rose-400' : 'text-slate-200'
                        }`}
                      >
                        {p.stock_qty}
                        {Number(p.min_stock) > 0 && Number(p.stock_qty) <= Number(p.min_stock) && (
                          <span className="ml-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
                            Estoque baixo
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-300">
                        {Number(p.min_stock) || 0}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-300">
                        {formatBRL((Number(p.cost_price) || 0) * (Number(p.stock_qty) || 0))}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => startTransactionFor(p, 'venda')}
                            className="rounded-md border border-emerald-700/50 bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/20"
                            aria-label="Registrar venda do produto"
                          >
                            Vender
                          </button>
                          <button
                            type="button"
                            onClick={() => startTransactionFor(p, 'compra')}
                            className="rounded-md border border-amber-700/50 bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-400 transition hover:bg-amber-500/20"
                            aria-label="Registrar compra do produto"
                          >
                            Comprar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditProduct(p)}
                            className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-700/50 hover:text-blue-400"
                            aria-label="Editar produto"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => confirmDeleteProduct(p)}
                            className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-700/50 hover:text-rose-400"
                            aria-label="Excluir produto"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/20">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-slate-200">Reposição sugerida</h2>
              <span className="text-sm text-slate-400">
                Baseado no estoque mínimo e nas vendas dos últimos 30 dias
              </span>
            </div>
            {replenish.length === 0 ? (
              <EmptyState
                icon={Boxes}
                title="Estoque em dia"
                hint="Todos os produtos estão com estoque adequado. Nenhuma reposição sugerida no momento."
              />
            ) : (
              <div className="overflow-auto rounded-xl border border-slate-800">
                <table className="w-full text-sm">
                  <thead className="bg-slate-950/90 text-left text-xs text-slate-400">
                    <tr>
                      <th className="px-3 py-2">Produto</th>
                      <th className="px-3 py-2 text-right">Estoque atual</th>
                      <th className="px-3 py-2 text-right">Mín.</th>
                      <th className="px-3 py-2 text-right">Vendidos (30d)</th>
                      <th className="px-3 py-2 text-right">Média/dia</th>
                      <th className="px-3 py-2 text-right">Sugestão de compra</th>
                    </tr>
                  </thead>
                  <tbody>
                    {replenish.map((p) => (
                      <tr key={p.id} className="border-t border-slate-800 transition hover:bg-slate-800/40">
                        <td className="px-3 py-2 font-medium text-slate-200">{p.name}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-slate-300">{p.stock_qty}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-slate-300">
                          {Number(p.min_stock) || 0}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-slate-300">{p.soldQty}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-slate-300">
                          {p.daily.toFixed(1)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-400">
                            +{p.suggested} un.
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/20">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-slate-200">Caixa</h2>
              {cashEntries.length > 0 && (
                <button
                  type="button"
                  onClick={exportCashCSV}
                  className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-300 transition hover:border-slate-500 hover:bg-slate-800/70"
                >
                  Exportar CSV
                </button>
              )}
            </div>

            <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <p className="text-xs text-slate-500">Entradas</p>
                <p className="mt-1 text-lg font-bold text-emerald-400">
                  {formatBRL(
                    cashEntries
                      .filter((c) => c.type === 'entrada')
                      .reduce((a, c) => a + Math.abs(Number(c.amount)), 0)
                  )}
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <p className="text-xs text-slate-500">Saídas</p>
                <p className="mt-1 text-lg font-bold text-rose-400">
                  {formatBRL(
                    cashEntries
                      .filter((c) => c.type === 'saida')
                      .reduce((a, c) => a + Math.abs(Number(c.amount)), 0)
                  )}
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <p className="text-xs text-slate-500">Saldo</p>
                <p className={`mt-1 text-lg font-bold ${cashBalance >= 0 ? 'text-slate-100' : 'text-rose-400'}`}>
                  {formatBRL(cashBalance)}
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <p className="text-xs text-slate-500">A receber (fiado)</p>
                <p className="mt-1 text-lg font-bold text-amber-400">
                  {formatBRL(receivablesTotal)}
                </p>
              </div>
            </div>

            <form onSubmit={handleCashSubmit} className="mb-6 grid grid-cols-1 gap-4 rounded-xl border border-slate-800 bg-slate-950/50 p-4 sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <label className={labelClass}>Tipo</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'entrada', label: 'Entrada' },
                    { value: 'saida', label: 'Saída' },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setCashForm({ ...cashForm, type: value })}
                      className={`rounded-lg border px-2 py-2 text-left text-xs transition ${
                        cashForm.type === value
                          ? value === 'entrada'
                            ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/30'
                            : 'border-rose-500/60 bg-rose-500/10 text-rose-300 ring-1 ring-rose-500/30'
                          : 'border-slate-700 bg-slate-800/40 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>Descrição</label>
                <input
                  className={inputClass}
                  name="description"
                  placeholder="Ex.: Caixa inicial, Gás, Venda avulsa..."
                  value={cashForm.description}
                  onChange={handleCashChange}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Valor (R$)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={inputClass}
                  name="amount"
                  placeholder="0,00"
                  value={cashForm.amount}
                  onChange={handleCashChange}
                />
              </div>
              <div>
                <label className={labelClass}>Forma de pagamento</label>
                <select
                  className={inputClass}
                  name="payment_method"
                  value={cashForm.payment_method}
                  onChange={handleCashChange}
                >
                  {paymentOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col">
                <label className={labelClass}>Data</label>
                <div className="flex flex-1 items-end gap-2">
                  <input
                    type="date"
                    className={inputClass}
                    name="date"
                    value={cashForm.date}
                    onChange={handleCashChange}
                  />
                  <button
                    type="submit"
                    className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 transition hover:from-blue-500 hover:to-indigo-500"
                  >
                    <Plus className="h-4 w-4" />
                    Lançar
                  </button>
                </div>
              </div>
              {cashError && (
                <div className="sm:col-span-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-400 lg:col-span-5">
                  {cashError}
                </div>
              )}
            </form>

            {cashEntries.length === 0 ? (
              <EmptyState
                icon={Wallet}
                title="Nenhum lançamento de caixa"
                hint="Registre entradas e saídas para acompanhar seu saldo no dia a dia."
              />
            ) : (
              <div className="max-h-64 overflow-auto rounded-xl border border-slate-800">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-slate-950/90 text-left text-xs text-slate-400 backdrop-blur">
                    <tr>
                      <th className="px-3 py-2">Data</th>
                      <th className="px-3 py-2">Tipo</th>
                      <th className="px-3 py-2">Descrição</th>
                      <th className="px-3 py-2">Forma</th>
                      <th className="px-3 py-2 text-right">Valor</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cashEntries.map((c) => (
                      <tr key={c.id} className="border-t border-slate-800 transition hover:bg-slate-800/40">
                        <td className="whitespace-nowrap px-3 py-2 text-slate-300">{c.date}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                              c.type === 'entrada'
                                ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/25'
                                : 'bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/25'
                            }`}
                          >
                            {c.type === 'entrada' ? 'Entrada' : 'Saída'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-200">{c.description}</td>
                        <td className="px-3 py-2 text-slate-400">
                          {paymentLabels[c.payment_method] || c.payment_method}
                        </td>
                        <td
                          className={`px-3 py-2 text-right font-medium tabular-nums ${
                            c.type === 'entrada' ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {c.type === 'entrada' ? '+' : '−'}{' '}
                          {formatBRL(Math.abs(Number(c.amount)))}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => confirmDeleteCash(c.id)}
                            className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-700/50 hover:text-rose-400"
                            aria-label="Excluir lançamento"
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

<section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/20">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-slate-200">Contas a receber</h2>
              <div className="flex flex-wrap items-center gap-2">
                {receivables.length > 0 && (
                  <label className="flex items-center gap-2 text-xs text-slate-400">
                    Receber como
                    <select
                      className="rounded-lg border border-slate-700 bg-slate-800/60 px-2 py-1 text-xs text-slate-200 outline-none transition focus:border-blue-500"
                      value={receivePayment}
                      onChange={(e) => setReceivePayment(e.target.value)}
                    >
                      {paymentOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <span className="text-sm text-slate-400">
                  Total em aberto:{' '}
                  <span className="font-semibold text-amber-400">{formatBRL(receivablesTotal)}</span>
                </span>
              </div>
            </div>
            {receivables.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="Nenhum fiado pendente"
                hint="Ao registrar uma venda como 'Fiado (a receber)', ela aparece aqui até ser recebida."
              />
            ) : (
              <div className="max-h-64 overflow-auto rounded-xl border border-slate-800">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-slate-950/90 text-left text-xs text-slate-400 backdrop-blur">
                    <tr>
                      <th className="px-3 py-2">Data</th>
                      <th className="px-3 py-2">Descrição</th>
                      <th className="px-3 py-2">Cliente</th>
                      <th className="px-3 py-2 text-right">Valor</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {receivables.map((t) => (
                      <tr key={t.id} className="border-t border-slate-800 transition hover:bg-slate-800/40">
                        <td className="whitespace-nowrap px-3 py-2 text-slate-300">{t.date}</td>
                        <td className="px-3 py-2 text-slate-200">{t.name}</td>
                        <td className="px-3 py-2 text-slate-300">{t.customer_name || '—'}</td>
                        <td className="px-3 py-2 text-right font-medium tabular-nums text-amber-400">
                          {formatBRL(netAmount(t))}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleReceive(t.id)}
                            className="rounded-md border border-emerald-700/50 bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/20"
                          >
                            Receber
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section id="clientes" className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/20">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-slate-200">Clientes</h2>
                {customers.length > 0 && (
                  <span className="text-sm text-slate-400">
                    {customers.length} cliente(s) cadastrado(s)
                  </span>
                )}
              </div>

              <form onSubmit={handleCustomerSubmit} className="mb-5 grid grid-cols-1 gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-4 sm:grid-cols-[1fr_1fr_auto]">
                <div>
                  <label className={labelClass}>Nome do cliente</label>
                  <input
                    className={inputClass}
                    name="name"
                    placeholder="Ex.: Maria Oliveira"
                    value={customerForm.name}
                    onChange={handleCustomerChange}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>Telefone (opcional)</label>
                  <input
                    className={inputClass}
                    name="phone"
                    placeholder="Ex.: (11) 99999-0000"
                    value={customerForm.phone}
                    onChange={handleCustomerChange}
                  />
                </div>
                <div className="flex items-end gap-2">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 transition hover:from-blue-500 hover:to-indigo-500"
                  >
                    {editingCustomerId ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    {editingCustomerId ? 'Salvar' : 'Adicionar cliente'}
                  </button>
                  {editingCustomerId && (
                    <button
                      type="button"
                      onClick={handleCancelEditCustomer}
                      className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:bg-slate-800/70"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
                {customerMsg && (
                  <p className="text-xs text-emerald-400 sm:col-span-3">{customerMsg}</p>
                )}
                {customerError && (
                  <p className="text-xs text-rose-400 sm:col-span-3">{customerError}</p>
                )}
              </form>

              {customers.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="Nenhum cliente cadastrado"
                  hint="Adicione clientes para vincular vendas, acompanhar o histórico e controlar o fiado por cliente."
                />
              ) : (
                <div className="overflow-auto rounded-xl border border-slate-800">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-950/90 text-left text-xs text-slate-400">
                      <tr>
                        <th className="px-3 py-2">Cliente</th>
                        <th className="px-3 py-2 text-right">Transações</th>
                        <th className="px-3 py-2 text-right">Total comprado</th>
                        <th className="px-3 py-2 text-right">Em aberto (fiado)</th>
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map((c) => (
                        <tr key={c.id} className="border-t border-slate-800 transition hover:bg-slate-800/40">
                          <td className="px-3 py-2">
                            <span className="font-medium text-slate-200">{c.name}</span>
                            {c.phone && <span className="ml-1 text-xs text-slate-500">{c.phone}</span>}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums text-slate-300">
                            {Number(c.total_sales) || 0}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums text-slate-300">
                            {formatBRL(Number(c.total_spent) || 0)}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {Number(c.open_balance) > 0 ? (
                              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-400">
                                {formatBRL(Number(c.open_balance))}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-500">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleEditCustomer(c)}
                                className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-700/50 hover:text-blue-400"
                                aria-label="Editar cliente"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => confirmDeleteCustomer(c)}
                                className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-700/50 hover:text-rose-400"
                                aria-label="Excluir cliente"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/20">
              <h2 className="mb-4 text-lg font-semibold text-slate-200">Categorias</h2>
              <p className="mb-4 text-sm text-slate-500">
                Crie categorias para usar no registro de transações e manter os relatórios organizados.
              </p>
              <form onSubmit={handleAddCategory} className="mb-4 flex gap-2">
                <input
                  className={inputClass}
                  placeholder="Nova categoria (ex.: Insumos, Vendas...)"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                />
                <button
                  type="submit"
                  className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 transition hover:from-blue-500 hover:to-indigo-500"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar
                </button>
              </form>
              {categories.length === 0 ? (
                <EmptyState
                  icon={Tags}
                  title="Nenhuma categoria"
                  hint="Crie categorias para manter os relatórios organizados."
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <span
                      key={c.id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/50 px-3 py-1 text-sm text-slate-200"
                    >
                      {c.name}
                      <button
                        type="button"
                        onClick={() => confirmDeleteCategory(c.id)}
                        className="text-slate-500 transition hover:text-rose-400"
                        aria-label={`Excluir categoria ${c.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/20">
              <h2 className="mb-4 text-lg font-semibold text-slate-200">Configurações</h2>

              <div className="mb-6 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <h3 className="mb-2 text-sm font-semibold text-slate-300">Meta mensal de faturamento</h3>
                <p className="mb-3 text-xs text-slate-500">
                  Defina um valor e acompanhe o progresso no dashboard.
                </p>
                <form onSubmit={handleGoalSubmit} className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={inputClass}
                    value={goalInput}
                    onChange={(e) => {
                      setGoalInput(e.target.value);
                      setGoalMsg('');
                    }}
                    placeholder="0,00"
                  />
                  <button
                    type="submit"
                    className="inline-flex shrink-0 items-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 transition hover:from-blue-500 hover:to-indigo-500"
                  >
                    Salvar
                  </button>
                </form>
                {goalMsg && (
                  <p className="mt-2 text-xs text-emerald-400">{goalMsg}</p>
                )}
              </div>

              <h3 className="mb-3 text-sm font-semibold text-slate-300">Alterar senha</h3>
              {passwordMsg && (
                <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
                  {passwordMsg}
                </div>
              )}
              {passwordError && (
                <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-400">
                  {passwordError}
                </div>
              )}
              <form onSubmit={handlePasswordSubmit} className="space-y-3">
                <div>
                  <label className={labelClass}>Senha atual</label>
                  <input
                    type="password"
                    className={inputClass}
                    value={passwordForm.current_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>Nova senha (mínimo 8 caracteres)</label>
                  <input
                    type="password"
                    className={inputClass}
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                    minLength={8}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>Confirmar nova senha</label>
                  <input
                    type="password"
                    className={inputClass}
                    value={passwordForm.confirm}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                    minLength={8}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 transition hover:from-blue-500 hover:to-indigo-500"
                >
                  Alterar senha
                </button>
              </form>
            </section>
          </div>

        <section id="relatorios" className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/20">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-200">Relatórios</h2>
            <label className="flex items-center gap-2 text-sm text-slate-400">
              Mês
              <input
                type="month"
                className={inputClass}
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value || new Date().toISOString().slice(0, 7))}
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { title: 'Diário', data: totals.daily },
              { title: 'Semanal', data: totals.weekly },
              { title: monthLabel ? `Mensal (${monthLabel})` : 'Mensal', data: monthTotals },
              { title: 'Anual', data: totals.annual },
            ].map(({ title, data }) => (
              <div key={title} className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <h3 className="mb-3 text-sm font-semibold text-slate-300">{title}</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Faturamento</dt>
                    <dd className="font-medium text-slate-200">{formatBRL(data.revenue)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Custos</dt>
                    <dd className="font-medium text-slate-200">{formatBRL(data.expenses)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Lucro líquido</dt>
                    <dd
                      className={`font-bold ${totals.net(data) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
                    >
                      {formatBRL(totals.net(data))}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Ticket médio</dt>
                    <dd className="font-medium text-slate-200">
                      {data.revenue > 0
                        ? formatBRL(data.revenue)
                        : formatBRL(0)}
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/20">
          <h2 className="mb-4 text-lg font-semibold text-slate-200">Visualizações</h2>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="h-64">
              <h3 className="mb-2 text-sm font-semibold text-slate-400">
                Faturamento vs. Lucro
              </h3>
              {hasTrendData ? (
                <Line data={revenueData} options={lineBarOptions} />
              ) : (
                <ChartEmpty message="Sem transações nos últimos 6 meses." />
              )}
            </div>
            <div className="h-64">
              <h3 className="mb-2 text-sm font-semibold text-slate-400">Maiores despesas</h3>
              {topExpenses.length > 0 ? (
                <Bar data={expenseData} options={lineBarOptions} />
              ) : (
                <ChartEmpty message="Nenhuma despesa registrada." />
              )}
            </div>
            <div className="h-64">
              <h3 className="mb-2 text-sm font-semibold text-slate-400">
                Produtos mais lucrativos
              </h3>
              {productProfit.length > 0 ? (
                <Pie data={profitabilityData} options={pieOptions} />
              ) : (
                <ChartEmpty message="Registre vendas para ver os produtos mais lucrativos." />
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/20">
          <h2 className="mb-4 text-lg font-semibold text-slate-200">Comparação Anual</h2>
          <p className="mb-4 text-sm text-slate-500">
            Ano atual vs. ano anterior com base nas transações registradas.
          </p>
          <div className="h-72">
            {hasAnnualData ? (
              <Bar data={annualComparisonData} options={lineBarOptions} />
            ) : (
              <ChartEmpty message="Registre transações para comparar os anos." />
            )}
          </div>
        </section>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-800 bg-[#0b1220]/90 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-md items-stretch justify-between">
          {[
            { id: 'top', label: 'Início', icon: LayoutDashboard },
            { id: 'clientes', label: 'Cadastrar cliente', icon: Users },
            { id: 'produtos', label: 'Cadastrar produto', icon: Package },
            { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={label}
              type="button"
              onClick={() => scrollToSection(id)}
              className="flex flex-1 flex-col items-center gap-1 px-1 py-2.5 text-center text-[10px] font-medium leading-tight text-slate-400 transition hover:text-slate-200 active:text-blue-400"
            >
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </button>
          ))}
        </div>
      </nav>

      {confirmState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-100">{confirmState.title}</h3>
            <p className="mt-2 text-sm text-slate-400">{confirmState.message}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmState(null)}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmState.onConfirm}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;