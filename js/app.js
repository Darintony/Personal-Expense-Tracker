/* ============================================
   FinTrack — app.js (Overhauled)
   Full-featured Personal Expense Tracker
   ============================================ */

'use strict';

/* ── Local Storage Keys ── */
const LS = {
  TRANSACTIONS: 'ft_transactions',
  CATEGORIES:   'ft_categories',
  BUDGET:       'ft_budget',
  THEME:        'ft_theme',
  MODE:         'ft_mode',
  CAT_BUDGET:   'ft_cat_budgets',
  SUBSCRIPTIONS:'ft_subscriptions',
  SPLITTER:     'ft_splitter',
  GOALS:        'ft_goals',
  WISHLIST:     'ft_wishlist',
  SCRATCHPAD:   'ft_scratchpad',
  USERNAME:     'ft_username',
  PIN:          'ft_pin',
  SESSION_ACTIVE:'ft_session_active',
  LOANS:        'ft_loans',
};

/* ── Default Categories ── */
const DEFAULT_CATEGORIES = [
  { name:'Food',          type:'expense' },
  { name:'Transport',     type:'expense' },
  { name:'Shopping',      type:'expense' },
  { name:'Rent',          type:'expense' },
  { name:'Entertainment', type:'expense' },
  { name:'Medical',       type:'expense' },
  { name:'Education',     type:'expense' },
  { name:'Salary',        type:'income'  },
  { name:'Freelance',     type:'income'  },
  { name:'Other',         type:'both'    },
];

/* ── Category Icons Map for Lucide ── */
const CATEGORY_ICONS = {
  'food': 'coffee',
  'transport': 'car',
  'shopping': 'shopping-bag',
  'rent': 'home',
  'entertainment': 'film',
  'medical': 'activity',
  'education': 'book-open',
  'salary': 'briefcase',
  'freelance': 'laptop',
  'other': 'help-circle'
};

function getCategoryIcon(catName) {
  const norm = String(catName).toLowerCase().trim();
  return CATEGORY_ICONS[norm] || 'tag';
}

/* ── Keyword Auto-Tagging Map ── */
const KEYWORD_CATEGORIES = [
  { keywords: ['swiggy', 'zomato', 'restaurant', 'food', 'cafe', 'starbucks', 'mcdonald', 'hotel', 'dining', 'bake', 'grocery', 'eats'], category: 'Food' },
  { keywords: ['uber', 'ola', 'rapido', 'metro', 'fuel', 'petrol', 'diesel', 'irctc', 'train', 'flight', 'travel', 'bus', 'auto', 'toll'], category: 'Transport' },
  { keywords: ['amazon', 'flipkart', 'myntra', 'shopping', 'clothing', 'retail', 'dmart', 'apparel', 'fashion', 'store', 'bazaar'], category: 'Shopping' },
  { keywords: ['rent', 'landlord', 'society', 'house', 'maintenance', 'flat'], category: 'Rent' },
  { keywords: ['netflix', 'prime', 'spotify', 'movie', 'cinema', 'bookmyshow', 'hotstar', 'ticket', 'game', 'play', 'club'], category: 'Entertainment' },
  { keywords: ['hospital', 'pharmacy', 'medical', 'doctor', 'clinic', 'medicine', 'health', 'apollo', 'care'], category: 'Medical' },
  { keywords: ['school', 'college', 'course', 'udemy', 'coursera', 'book', 'fees', 'tuition', 'class'], category: 'Education' },
  { keywords: ['salary', 'paycheck', 'payroll', 'ach credit', 'employer', 'salary credit'], category: 'Salary' },
  { keywords: ['freelance', 'upwork', 'fiverr', 'consulting', 'invoice', 'credit interest', 'dividend'], category: 'Freelance' }
];

function guessCategory(name) {
  const norm = String(name).toLowerCase();
  for (const item of KEYWORD_CATEGORIES) {
    for (const kw of item.keywords) {
      if (norm.includes(kw)) {
        return item.category;
      }
    }
  }
  return 'Other';
}

/* ── State ── */
const State = {
  transactions: [],
  categories: [],
  budgets: {},
  categoryBudgets: {},
  charts: {},
  currentReport: [],
  currentReportTitle: '',
  sortCol: 'date',
  sortDir: 'desc',
  // Statement Importer Temporary Workspace
  importHeaders: [],
  importRawRows: [],
  parsedTransactions: [],
  
  // Student & Productivity Modules
  subscriptions: [],
  splitter: { roommates: ['You'], bills: [] },
  goals: [],
  wishlist: [],
  loans: [],
};

/* ── Utility Helpers ── */
const fmt = (n) => '₹' + parseFloat(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const fmtDate = (d) => { 
  if (!d) return '—';
  const dt = new Date(d); 
  return isNaN(dt) ? d : dt.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }); 
};
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const $ = (id) => document.getElementById(id);
const today = () => new Date().toISOString().split('T')[0];

/* ── Date Parser for Statements ── */
function parseStatementDate(dateStr) {
  if (!dateStr) return today();
  const clean = String(dateStr).trim();
  
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
  
  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const parts = clean.split(/[-/.]/);
  if (parts.length === 3) {
    let day = parseInt(parts[0], 10);
    let month = parts[1];
    let year = parseInt(parts[2], 10);
    
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const idx = months.indexOf(month.toLowerCase().slice(0, 3));
    if (idx !== -1) {
      month = idx + 1;
    } else {
      month = parseInt(month, 10);
    }
    
    if (year < 100) {
      year += (year > 50 ? 1900 : 2000);
    }
    
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }
  return today();
}

/* ── Toast Notifications ── */
function toast(msg, type='info', duration=3000) {
  const c = $('toast-container');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  
  let icon = 'info';
  if (type === 'success') icon = 'check-circle';
  if (type === 'error') icon = 'alert-triangle';
  if (type === 'warning') icon = 'alert-circle';
  
  t.innerHTML = `<i data-lucide="${icon}"></i> <span>${msg}</span>`;
  c.appendChild(t);
  
  if (window.lucide) lucide.createIcons();
  
  setTimeout(() => {
    t.classList.add('out');
    setTimeout(() => t.remove(), 300);
  }, duration);
}

/* ── Local Storage Helpers ── */
const load = (k, def) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } };
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

/* ── App Object ── */
const App = {

  /* ───────── INIT ───────── */
  init() {
    State.transactions = load(LS.TRANSACTIONS, []);
    State.categories   = load(LS.CATEGORIES,   DEFAULT_CATEGORIES);
    State.budgets      = load(LS.BUDGET,        {});
    State.categoryBudgets = load(LS.CAT_BUDGET, {});
    State.subscriptions = load(LS.SUBSCRIPTIONS, []);
    State.splitter     = load(LS.SPLITTER,      { roommates: ['You'], bills: [] });
    State.goals        = load(LS.GOALS,         []);
    State.wishlist     = load(LS.WISHLIST,      []);
    State.loans        = load(LS.LOANS,         []);

    // Theme & Mode
    const theme = load(LS.THEME, 'blue');
    const mode  = load(LS.MODE,  'light');
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.mode  = mode;
    
    document.querySelectorAll('.theme-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.theme === theme);
    });

    // Notepad notes loading
    $('notepadArea').value = localStorage.getItem(LS.SCRATCHPAD) || '';

    this.bindEvents();
    this.navigate('dashboard');
    this.populateCategoryDropdowns();
    
    // Check passcode app lock
    this.checkAppLock();
    
    if (window.lucide) lucide.createIcons();
  },

  /* ───────── NAVIGATION ───────── */
  navigate(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    const p = $(`page-${page}`);
    if (p) p.classList.add('active');
    
    const nav = document.querySelector(`[data-page="${page}"]`);
    if (nav) nav.classList.add('active');
    
    const titles = {
      'dashboard':'Dashboard','transactions':'Transactions','add-transaction':'Add Transaction',
      'budget':'Budget','statistics':'Statistics','reports':'Reports',
      'categories':'Categories','import-export':'Import / Export','backup':'Backup & Restore',
      'subscriptions':'Subscriptions','bill-splitter':'Bill Splitter','goals-wishlist':'Goals & Wishlist'
    };
    $('pageTitle').textContent = titles[page] || page;
    this.closeSidebar();

    if (page === 'dashboard')       this.renderDashboard();
    if (page === 'transactions')    this.renderTransactions();
    if (page === 'budget')          this.renderBudget();
    if (page === 'statistics')      this.renderStatistics();
    if (page === 'categories')      this.renderCategories();
    if (page === 'add-transaction') this.prepareForm();
    if (page === 'subscriptions')   this.renderSubscriptions();
    if (page === 'bill-splitter')   this.renderBillSplitter();
    if (page === 'goals-wishlist')  this.renderGoalsWishlist();
    
    if (window.lucide) lucide.createIcons();
  },

  /* ───────── EVENTS ───────── */
  bindEvents() {
    // Nav links
    document.querySelectorAll('.nav-item[data-page]').forEach(a => {
      a.addEventListener('click', e => { e.preventDefault(); this.navigate(a.dataset.page); });
    });

    // Hamburger Mobile Menu
    $('hamburger').addEventListener('click', () => this.toggleSidebar());
    $('sidebarOverlay').addEventListener('click', () => this.closeSidebar());

    // Dark Mode Toggle
    $('darkToggle').addEventListener('click', () => {
      const cur = document.documentElement.dataset.mode;
      const next = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.mode = next;
      save(LS.MODE, next);
      
      const icon = $('darkToggle').querySelector('i');
      if (icon) {
        icon.setAttribute('data-lucide', next === 'dark' ? 'sun' : 'moon');
        if (window.lucide) lucide.createIcons();
      }
      setTimeout(() => this.renderDashboard(), 100);
    });

    // Theme Customizer
    document.querySelectorAll('.theme-btn').forEach(b => {
      b.addEventListener('click', () => {
        document.documentElement.dataset.theme = b.dataset.theme;
        save(LS.THEME, b.dataset.theme);
        document.querySelectorAll('.theme-btn').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        this.renderDashboard();
      });
    });

    // Type Toggle
    document.querySelectorAll('.type-btn').forEach(b => {
      b.addEventListener('click', () => {
        document.querySelectorAll('.type-btn').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        $('txType').value = b.dataset.type;
        this.populateCategoryDropdowns();
      });
    });

    // Notes Character Counter
    $('txNotes').addEventListener('input', () => {
      $('notesCount').textContent = `${$('txNotes').value.length}/200`;
    });

    // Global Search Auto-dropdown
    $('globalSearch').addEventListener('input', e => this.liveSearch(e.target.value));
    document.addEventListener('click', e => {
      if (!e.target.closest('.search-wrap')) $('searchDropdown').classList.remove('open');
    });

    // Slash keyboard shortcut for search
    document.addEventListener('keydown', e => {
      if (e.key === '/' && document.activeElement !== $('globalSearch') && 
          document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        $('globalSearch').focus();
      }
    });

    // Preset Default values
    $('txDate').value = today();
    $('budgetMonth').value = today().slice(0,7);
    
    // Add real-time validator highlights to form fields
    ['txName', 'txAmount', 'txDate'].forEach(id => {
      $(id).addEventListener('input', () => {
        const el = $(id);
        if (el.value.trim() === '' || (id === 'txAmount' && parseFloat(el.value) <= 0)) {
          el.classList.remove('valid');
          el.classList.add('invalid');
        } else {
          el.classList.remove('invalid');
          el.classList.add('valid');
        }
      });
    });

    // Notepad Toggle & Autosave Events
    $('toggleNotepad').addEventListener('click', () => {
      $('notepadDrawer').classList.toggle('open');
    });
    $('closeNotepad').addEventListener('click', () => {
      $('notepadDrawer').classList.remove('open');
    });
    $('notepadArea').addEventListener('input', e => {
      localStorage.setItem(LS.SCRATCHPAD, e.target.value);
    });

    // Lock Screen Toggle
    $('lockToggle').addEventListener('click', () => {
      this.lockApp();
    });
  },

  toggleSidebar() {
    $('sidebar').classList.toggle('open');
    $('sidebarOverlay').classList.toggle('open');
    $('hamburger').classList.toggle('open');
  },
  closeSidebar() {
    $('sidebar').classList.remove('open');
    $('sidebarOverlay').classList.remove('open');
    $('hamburger').classList.remove('open');
  },

  /* ───────── DROPDOWNS ───────── */
  populateCategoryDropdowns() {
    const type = $('txType').value;
    const cats = State.categories.filter(c => c.type === type || c.type === 'both');
    $('txCategory').innerHTML = cats.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
    
    $('filterCategory').innerHTML = '<option value="">All Categories</option>' +
      State.categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
      
    // Populate budgets tab category selector
    $('budgetCategory').innerHTML = State.categories
      .filter(c => c.type === 'expense' || c.type === 'both')
      .map(c => `<option value="${c.name}">${c.name}</option>`).join('');
  },

  /* ───────── DASHBOARD RENDERING ───────── */
  renderDashboard() {
    const txs = State.transactions;
    const income  = txs.filter(t => t.type==='income').reduce((s,t)=>s+t.amount,0);
    const expense = txs.filter(t => t.type==='expense').reduce((s,t)=>s+t.amount,0);
    const balance = income - expense;

    $('dash-income').textContent  = fmt(income);
    $('dash-expense').textContent = fmt(expense);
    $('dash-balance').textContent = fmt(balance);
    $('dash-count').textContent   = txs.length;

    // Top Category
    const catMap = {};
    txs.filter(t=>t.type==='expense').forEach(t => { catMap[t.category]=(catMap[t.category]||0)+t.amount; });
    const topCat = Object.entries(catMap).sort((a,b)=>b[1]-a[1])[0];
    $('dash-top-cat').textContent = topCat ? `${topCat[0]} (${fmt(topCat[1])})` : '—';

    // Monthly Savings
    const now = new Date();
    const mm = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    const monthInc  = txs.filter(t=>t.type==='income'&&t.date.startsWith(mm)).reduce((s,t)=>s+t.amount,0);
    const monthExp  = txs.filter(t=>t.type==='expense'&&t.date.startsWith(mm)).reduce((s,t)=>s+t.amount,0);
    $('dash-savings').textContent = fmt(monthInc - monthExp);

    // Dashboard widgets (Recent activity list)
    this.renderRecentActivityWidget();

    // Rebuild charts
    this.buildCategoryChart(catMap);
    this.buildIncomeExpenseChart(txs);
    this.buildTrendChart(txs);

    // Render smart financial insights
    this.renderInsights();
  },

  renderRecentActivityWidget() {
    const recent = State.transactions.slice().reverse().slice(0, 5);
    const el = $('dashboardRecentList');
    if (!recent.length) {
      el.innerHTML = `<p style="padding:1rem; text-align:center; color:var(--text-muted); font-size:0.85rem;">No recent transactions.</p>`;
      return;
    }
    el.innerHTML = recent.map(t => `
      <div class="recent-item">
        <div class="recent-left">
          <div class="recent-icon"><i data-lucide="${getCategoryIcon(t.category)}"></i></div>
          <div class="recent-details">
            <span class="recent-name">${this.esc(t.name)}</span>
            <span class="recent-meta">${t.category} · ${fmtDate(t.date)}</span>
          </div>
        </div>
        <div class="recent-right">
          <span class="recent-amount ${t.type}">${t.type==='income'?'+':'-'}${fmt(t.amount)}</span>
        </div>
      </div>`).join('');
      
    if (window.lucide) lucide.createIcons();
  },

  addQuickTx(category, type) {
    const defaultAmt = category === 'Food' ? 100 : category === 'Transport' ? 300 : 50000;
    const nameMap = { 'Food': 'Coffee / Snack', 'Transport': 'Cab / Fuel', 'Salary': 'Monthly Salary' };
    const name = nameMap[category] || 'Quick Entry';
    
    // Look up the last entered transaction in this category to use as a smart pre-fill default
    const lastTx = State.transactions.slice().reverse().find(t => t.category === category && t.name === name);
    const prefillAmt = lastTx ? lastTx.amount : defaultAmt;
    
    const amtStr = prompt(`Enter amount for ${name}:`, prefillAmt);
    if (amtStr === null) return; // User cancelled
    
    const amt = parseFloat(amtStr.replace(/,/g, '').replace(/[^\d.-]/g, ''));
    if (isNaN(amt) || amt <= 0) {
      toast('Invalid amount entered. Please enter a positive number.', 'error');
      return;
    }
    
    State.transactions.push({ id:uid(), type, name, category, amount:amt, date:today(), notes: 'Quick entry' });
    toast(`Quick ${type==='income'?'Income':'Expense'} Added! (${fmt(amt)})`, 'success');
    
    save(LS.TRANSACTIONS, State.transactions);
    this.renderDashboard();
    this.checkBudgetAlert();
  },

  getChartColors() {
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
    return { accent, text: getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim(),
             border: getComputedStyle(document.documentElement).getPropertyValue('--border').trim() };
  },

  destroyChart(key) {
    if (State.charts[key]) { State.charts[key].destroy(); delete State.charts[key]; }
  },

  buildCategoryChart(catMap) {
    this.destroyChart('category');
    const labels = Object.keys(catMap);
    const data   = Object.values(catMap);
    if (!labels.length) return;
    const colors = ['#4F46E5','#10B981','#F59E0B','#EF4444','#8B5CF6','#06B6D4','#F97316','#EC4899','#6366F1','#14B8A6'];
    State.charts.category = new Chart($('categoryChart'), {
      type: 'pie',
      data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0 }] },
      options: {
        responsive: true, maintainAspectRatio: true,
        plugins: {
          legend: { position:'bottom', labels:{ color: this.getChartColors().text, font:{size:11, family:'DM Sans'} } },
          tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${fmt(ctx.raw)}` } }
        }
      }
    });
  },

  buildIncomeExpenseChart(txs) {
    this.destroyChart('incomeExpense');
    const months = this.getLast6Months();
    const incData = months.map(m => txs.filter(t=>t.type==='income'&&t.date.startsWith(m)).reduce((s,t)=>s+t.amount,0));
    const expData = months.map(m => txs.filter(t=>t.type==='expense'&&t.date.startsWith(m)).reduce((s,t)=>s+t.amount,0));
    const c = this.getChartColors();
    State.charts.incomeExpense = new Chart($('incomeExpenseChart'), {
      type:'bar',
      data:{
        labels: months.map(m=>{ const [y,mo]=m.split('-'); return new Date(y,mo-1).toLocaleString('default',{month:'short'}); }),
        datasets:[
          { label:'Income',  data:incData, backgroundColor:'rgba(16,185,129,.75)',  borderRadius:6 },
          { label:'Expense', data:expData, backgroundColor:'rgba(239,68,68,.75)',   borderRadius:6 }
        ]
      },
      options:{ responsive:true, maintainAspectRatio:true,
        plugins:{ legend:{labels:{color:c.text, font:{family:'DM Sans'}}}, tooltip:{callbacks:{label:ctx=>` ${ctx.dataset.label}: ${fmt(ctx.raw)}`}} },
        scales:{ x:{ticks:{color:c.text, font:{family:'DM Sans'}}, grid:{display:false}}, y:{ticks:{color:c.text, font:{family:'DM Sans'}, callback:v=>'₹'+v}, grid:{color:c.border}} }
      }
    });
  },

  buildTrendChart(txs) {
    this.destroyChart('trend');
    const months = this.getLast12Months();
    const data   = months.map(m => txs.filter(t=>t.type==='expense'&&t.date.startsWith(m)).reduce((s,t)=>s+t.amount,0));
    const c = this.getChartColors();
    State.charts.trend = new Chart($('trendChart'), {
      type:'line',
      data:{
        labels: months.map(m=>{ const [y,mo]=m.split('-'); return new Date(y,mo-1).toLocaleString('default',{month:'short',year:'2-digit'}); }),
        datasets:[{ label:'Monthly Expenses', data, borderColor:c.accent, backgroundColor:'rgba(79,70,229,.05)', fill:true, tension:.35, borderWidth:3, pointRadius:4, pointBackgroundColor:c.accent }]
      },
      options:{ responsive:true, maintainAspectRatio:true,
        plugins:{ legend:{labels:{color:c.text, font:{family:'DM Sans'}}}, tooltip:{callbacks:{label:ctx=>` ${fmt(ctx.raw)}`}} },
        scales:{ x:{ticks:{color:c.text, font:{family:'DM Sans'}}, grid:{display:false}}, y:{ticks:{color:c.text, font:{family:'DM Sans'}, callback:v=>'₹'+v}, grid:{color:c.border}} }
      }
    });
  },

  getLast6Months() { return this.getLastNMonths(6); },
  getLast12Months(){ return this.getLastNMonths(12); },
  getLastNMonths(n) {
    const months = [];
    const d = new Date();
    for (let i=n-1;i>=0;i--) {
      const t = new Date(d.getFullYear(), d.getMonth()-i, 1);
      months.push(`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}`);
    }
    return months;
  },

  /* ───────── TRANSACTIONS TAB ───────── */
  renderTransactions(txs) {
    const data = txs || State.transactions;
    const tbody = $('transactionTableBody');
    if (!data.length) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:3rem;color:var(--text-muted)">No transactions found.</td></tr>`;
      return;
    }
    
    this.updateSortHeaders();

    tbody.innerHTML = data.map(t => `
      <tr id="tr-${t.id}">
        <td><input type="checkbox" class="row-check" data-id="${t.id}" onchange="App.handleRowSelect(this)"/></td>
        <td>${fmtDate(t.date)}</td>
        <td style="font-weight:700">${this.esc(t.name)}</td>
        <td><span class="badge badge-${t.type}">${t.type}</span></td>
        <td><span style="display:inline-flex; align-items:center; gap:0.4rem;"><i data-lucide="${getCategoryIcon(t.category)}" style="width:14px; height:14px;"></i> ${this.esc(t.category)}</span></td>
        <td class="amount-${t.type}">${t.type==='income'?'+':'-'}${fmt(t.amount)}</td>
        <td style="max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--text-muted);font-size:.8rem">${this.esc(t.notes||'—')}</td>
        <td>
          <div class="action-btns">
            <button class="btn-icon" onclick="App.viewTx('${t.id}')" title="View details"><i data-lucide="eye"></i></button>
            <button class="btn-icon" onclick="App.editTx('${t.id}')" title="Edit"><i data-lucide="edit-3"></i></button>
            <button class="btn-icon del" onclick="App.deleteTx('${t.id}')" title="Delete"><i data-lucide="trash-2"></i></button>
          </div>
        </td>
      </tr>`).join('');
      
    if (window.lucide) lucide.createIcons();
    this.updateFloatingBar();
  },

  /* Sorting Column Elements */
  sortTransactions(col) {
    if (State.sortCol === col) {
      State.sortDir = State.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      State.sortCol = col;
      State.sortDir = 'asc';
    }
    
    State.transactions.sort((a, b) => {
      let valA = a[col];
      let valB = b[col];
      
      if (col === 'amount') {
        valA = parseFloat(valA) || 0;
        valB = parseFloat(valB) || 0;
      } else {
        valA = String(valA).toLowerCase();
        valB = String(valB).toLowerCase();
      }
      
      if (valA < valB) return State.sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return State.sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    
    this.renderTransactions();
  },

  updateSortHeaders() {
    const cols = ['date', 'name', 'category', 'amount'];
    cols.forEach(c => {
      const el = $(`sort-${c}-icon`);
      if (el) {
        if (State.sortCol === c) {
          el.textContent = State.sortDir === 'asc' ? ' ↑' : ' ↓';
        } else {
          el.textContent = ' ↕';
        }
      }
    });
  },

  applyFilters() {
    const type    = $('filterType').value;
    const cat     = $('filterCategory').value;
    const from    = $('filterDateFrom').value;
    const to      = $('filterDateTo').value;
    const minAmt  = parseFloat($('filterAmtMin').value)||0;
    const maxAmt  = parseFloat($('filterAmtMax').value)||Infinity;
    
    let txs = State.transactions;
    if (type)  txs = txs.filter(t=>t.type===type);
    if (cat)   txs = txs.filter(t=>t.category===cat);
    if (from)  txs = txs.filter(t=>t.date>=from);
    if (to)    txs = txs.filter(t=>t.date<=to);
    txs = txs.filter(t=>t.amount>=minAmt&&t.amount<=maxAmt);
    
    this.renderTransactions(txs);
  },

  clearFilters() {
    ['filterType','filterCategory','filterDateFrom','filterDateTo','filterAmtMin','filterAmtMax'].forEach(id=>{ 
      const el=$(id); 
      if(el.tagName==='SELECT') el.selectedIndex=0; else el.value=''; 
    });
    this.renderTransactions();
  },

  toggleSelectAll(cb) {
    document.querySelectorAll('.row-check').forEach(c => {
      c.checked = cb.checked;
      this.handleRowSelect(c);
    });
    $('selectAll').checked = cb.checked;
    $('selectAllHead').checked = cb.checked;
  },

  handleRowSelect(cb) {
    const tr = $(`tr-${cb.dataset.id}`);
    if (tr) {
      tr.classList.toggle('row-selected', cb.checked);
    }
    this.updateFloatingBar();
  },

  updateFloatingBar() {
    const checked = document.querySelectorAll('.row-check:checked');
    const bar = $('floatingBar');
    if (checked.length > 0) {
      $('floatingBarText').textContent = `${checked.length} transaction(s) selected`;
      bar.classList.add('open');
    } else {
      bar.classList.remove('open');
    }
  },

  clearSelection() {
    document.querySelectorAll('.row-check').forEach(c => {
      c.checked = false;
      this.handleRowSelect(c);
    });
    $('selectAll').checked = false;
    $('selectAllHead').checked = false;
  },

  bulkDelete() {
    const ids = [...document.querySelectorAll('.row-check:checked')].map(c=>c.dataset.id);
    if (!ids.length) { toast('No transactions selected.','warning'); return; }
    
    this.confirm(`Permanently delete ${ids.length} transaction(s)?`, () => {
      State.transactions = State.transactions.filter(t=>!ids.includes(t.id));
      save(LS.TRANSACTIONS, State.transactions);
      this.renderTransactions();
      this.renderDashboard();
      this.clearSelection();
      toast(`${ids.length} transaction(s) deleted.`, 'success');
    });
  },

  viewTx(id) {
    const t = State.transactions.find(x=>x.id===id);
    if (!t) return;
    $('viewModalBody').innerHTML = `
      <div class="view-row"><span class="view-label">Name</span><span class="view-val">${this.esc(t.name)}</span></div>
      <div class="view-row"><span class="view-label">Type</span><span class="view-val"><span class="badge badge-${t.type}">${t.type}</span></span></div>
      <div class="view-row"><span class="view-label">Category</span><span class="view-val">${this.esc(t.category)}</span></div>
      <div class="view-row"><span class="view-label">Amount</span><span class="view-val amount-${t.type}">${fmt(t.amount)}</span></div>
      <div class="view-row"><span class="view-label">Date</span><span class="view-val">${fmtDate(t.date)}</span></div>
      <div class="view-row"><span class="view-label">Notes</span><span class="view-val" style="max-width:260px;word-wrap:break-word">${this.esc(t.notes||'—')}</span></div>
    `;
    this.openModal('viewModal');
  },

  editTx(id) {
    const t = State.transactions.find(x=>x.id===id);
    if (!t) return;
    $('editId').value     = t.id;
    $('txName').value     = t.name;
    $('txAmount').value   = t.amount;
    $('txDate').value     = t.date;
    $('txNotes').value    = t.notes||'';
    $('txType').value     = t.type;
    $('notesCount').textContent = `${(t.notes||'').length}/200`;
    
    document.querySelectorAll('.type-btn').forEach(b => b.classList.toggle('active', b.dataset.type===t.type));
    this.populateCategoryDropdowns();
    $('txCategory').value = t.category;
    $('formTitle').textContent = 'Edit Transaction';
    
    // Set validator states to valid
    ['txName', 'txAmount', 'txDate'].forEach(id => $(id).classList.add('valid'));
    
    this.navigate('add-transaction');
    setTimeout(()=>{ $('txName').focus(); },100);
  },

  deleteTx(id) {
    this.confirm('Delete this transaction?', () => {
      State.transactions = State.transactions.filter(t=>t.id!==id);
      save(LS.TRANSACTIONS, State.transactions);
      this.renderTransactions();
      this.renderDashboard();
      toast('Transaction deleted.','success');
    });
  },

  /* ───────── TRANSACTION FORM ───────── */
  prepareForm() {
    if (!$('editId').value) {
      $('formTitle').textContent = 'Add Transaction';
      this.resetForm();
    }
  },

  adjustAmount(amt) {
    const field = $('txAmount');
    const val = parseFloat(field.value) || 0;
    field.value = (val + amt).toFixed(2);
    field.classList.remove('invalid');
    field.classList.add('valid');
  },

  saveTransaction() {
    const id       = $('editId').value;
    const type     = $('txType').value;
    const name     = $('txName').value.trim();
    const category = $('txCategory').value;
    const amtRaw   = parseFloat($('txAmount').value);
    const date     = $('txDate').value;
    const notes    = $('txNotes').value.trim();

    let invalid = false;
    if (!name) { $('txName').classList.add('invalid'); invalid = true; }
    if (!amtRaw || amtRaw <= 0) { $('txAmount').classList.add('invalid'); invalid = true; }
    if (!date) { $('txDate').classList.add('invalid'); invalid = true; }
    
    if (invalid) {
      toast('Please correct the highlighted fields.', 'error');
      return;
    }
    
    if (date > today()) { toast('Date cannot be in the future.','error'); return; }
    if (notes.length > 200) { toast('Notes cannot exceed 200 characters.','error'); return; }

    if (id) {
      const idx = State.transactions.findIndex(t=>t.id===id);
      State.transactions[idx] = { id, type, name, category, amount:amtRaw, date, notes };
      toast('Transaction updated successfully!','success');
    } else {
      State.transactions.push({ id:uid(), type, name, category, amount:amtRaw, date, notes });
      toast('Transaction added successfully!','success');
    }
    
    save(LS.TRANSACTIONS, State.transactions);
    this.checkBudgetAlert();
    this.resetForm();
    this.navigate('transactions');
  },

  resetForm() {
    $('editId').value   = '';
    $('txName').value   = '';
    $('txAmount').value = '';
    $('txDate').value   = today();
    $('txNotes').value  = '';
    $('notesCount').textContent = '0/200';
    
    ['txName', 'txAmount', 'txDate'].forEach(id => $(id).classList.remove('valid', 'invalid'));
    
    document.querySelectorAll('.type-btn').forEach(b=>b.classList.remove('active'));
    document.querySelector('.type-btn[data-type="expense"]').classList.add('active');
    $('txType').value = 'expense';
    
    this.populateCategoryDropdowns();
    $('formTitle').textContent = 'Add Transaction';
  },

  /* ───────── BUDGETS TAB ───────── */
  saveBudget() {
    const month  = $('budgetMonth').value;
    const amount = parseFloat($('budgetAmount').value);
    if (!month || isNaN(amount) || amount<=0) { toast('Enter valid month and amount.','error'); return; }
    State.budgets[month] = amount;
    save(LS.BUDGET, State.budgets);
    toast('Global monthly budget set!','success');
    this.renderBudget();
    this.checkBudgetAlert();
  },

  saveCategoryBudget() {
    const month = $('budgetMonth').value;
    const cat = $('budgetCategory').value;
    const amount = parseFloat($('budgetCategoryAmount').value);
    
    if (!month || !cat || isNaN(amount) || amount <= 0) {
      toast('Enter valid month, category and amount.', 'error');
      return;
    }
    
    State.categoryBudgets[`${month}_${cat}`] = amount;
    save(LS.CAT_BUDGET, State.categoryBudgets);
    
    toast(`Category budget for ${cat} set to ${fmt(amount)}!`, 'success');
    $('budgetCategoryAmount').value = '';
    this.renderBudget();
    this.checkBudgetAlert();
  },

  renderBudget() {
    // 1. Render Monthly Budgets
    const html = Object.entries(State.budgets).sort((a,b)=>b[0].localeCompare(a[0])).map(([month, budget]) => {
      const spent = State.transactions
        .filter(t=>t.type==='expense'&&t.date.startsWith(month))
        .reduce((s,t)=>s+t.amount,0);
      const pct  = budget > 0 ? Math.min((spent/budget)*100, 100) : 0;
      const over = spent > budget;
      const warn = pct >= 75;
      const cls  = over ? 'over' : warn ? 'warn' : '';
      const d    = new Date(month+'-01');
      const label= d.toLocaleString('default',{month:'long',year:'numeric'});
      return `
        <div class="budget-item">
          <div class="budget-meta">
            <span class="budget-month">${label}</span>
            <span class="budget-amounts">${fmt(spent)} / ${fmt(budget)}</span>
          </div>
          <div class="progress-bar"><div class="progress-fill ${cls}" style="width:${pct.toFixed(1)}%"></div></div>
          <div class="budget-status" style="color:${over?'var(--danger)':warn?'var(--warning)':'var(--success)'}">
            ${over ? `⚠ Budget exceeded by ${fmt(spent-budget)}` : warn ? `⚠ ${pct.toFixed(0)}% used — approaching limit` : `✓ ${fmt(budget-spent)} remaining`}
          </div>
        </div>`;
    }).join('') || '<p style="color:var(--text-muted)">No global budgets set yet.</p>';
    $('budgetDisplay').innerHTML = html;

    // 2. Render Category budgets based on currently selected month
    const activeMonth = $('budgetMonth').value || today().slice(0, 7);
    const catBudgetsHtml = Object.entries(State.categoryBudgets || {})
      .filter(([key]) => key.startsWith(activeMonth + '_'))
      .map(([key, limit]) => {
        const catName = key.split('_')[1];
        const spent = State.transactions
          .filter(t => t.type === 'expense' && t.category === catName && t.date.startsWith(activeMonth))
          .reduce((sum, t) => sum + t.amount, 0);
        const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
        const over = spent > limit;
        const warn = pct >= 75;
        const cls = over ? 'over' : warn ? 'warn' : '';
        return `
          <div class="cat-budget-card">
            <div class="cat-budget-meta">
              <span class="cat-budget-title"><i data-lucide="${getCategoryIcon(catName)}"></i> ${catName}</span>
              <span>${fmt(spent)} / ${fmt(limit)}</span>
            </div>
            <div class="progress-bar"><div class="progress-fill ${cls}" style="width:${pct.toFixed(1)}%"></div></div>
            <div class="budget-status" style="color:${over ? 'var(--danger)' : warn ? 'var(--warning)' : 'var(--success)'}">
              ${over ? `⚠ Over by ${fmt(spent - limit)}` : warn ? `⚠ ${pct.toFixed(0)}% used` : `✓ ${fmt(limit - spent)} left`}
            </div>
          </div>`;
      }).join('') || '<p style="color:var(--text-muted); font-size:0.9rem;">No category budgets configured for this month.</p>';
    $('categoryBudgetsDisplay').innerHTML = catBudgetsHtml;
    
    // 3. Render Student Daily Survival Calculator
    const now = new Date();
    const curMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    const budget = State.budgets[curMonth] || 0;
    const spent = State.transactions
      .filter(t => t.type === 'expense' && t.date.startsWith(curMonth))
      .reduce((sum, t) => sum + t.amount, 0);

    const getRemainingDaysInMonth = () => {
      const year = now.getFullYear();
      const month = now.getMonth();
      const totalDays = new Date(year, month + 1, 0).getDate();
      const currentDay = now.getDate();
      return Math.max(totalDays - currentDay + 1, 1);
    };
    
    const remDays = getRemainingDaysInMonth();
    if (budget > 0) {
      const remaining = Math.max(budget - spent, 0);
      const limit = remaining / remDays;
      $('dailySurvivalLimit').textContent = fmt(limit);
      $('survivalDaysRemaining').textContent = `${remDays} day(s) remaining this month (Budget: ${fmt(budget)}, Spent: ${fmt(spent)})`;
    } else {
      $('dailySurvivalLimit').textContent = '₹0.00';
      $('survivalDaysRemaining').textContent = 'Set a monthly budget above to see daily limit';
    }

    // 4. Render 50/30/20 Budget split helper
    const monthIncome = State.transactions
      .filter(t => t.type === 'income' && t.date.startsWith(curMonth))
      .reduce((sum, t) => sum + t.amount, 0);
    const monthNeeds = State.transactions
      .filter(t => t.type === 'expense' && ['food', 'transport', 'rent', 'medical', 'education'].includes(t.category.toLowerCase()) && t.date.startsWith(curMonth))
      .reduce((sum, t) => sum + t.amount, 0);
    const monthWants = State.transactions
      .filter(t => t.type === 'expense' && !['food', 'transport', 'rent', 'medical', 'education'].includes(t.category.toLowerCase()) && t.date.startsWith(curMonth))
      .reduce((sum, t) => sum + t.amount, 0);
      
    const denom = monthIncome > 0 ? monthIncome : (monthNeeds + monthWants || 1);
    const needsPct = (monthNeeds / denom) * 100;
    const wantsPct = (monthWants / denom) * 100;
    const monthSavings = monthIncome > 0 ? Math.max(monthIncome - monthNeeds - monthWants, 0) : 0;
    const savingsPct = monthIncome > 0 ? (monthSavings / denom) * 100 : 0;
    
    $('needsPctLabel').textContent = `${needsPct.toFixed(0)}% (${fmt(monthNeeds)})`;
    $('needsPctFill').style.width = `${Math.min(needsPct, 100)}%`;
    
    $('wantsPctLabel').textContent = `${wantsPct.toFixed(0)}% (${fmt(monthWants)})`;
    $('wantsPctFill').style.width = `${Math.min(wantsPct, 100)}%`;
    
    $('savingsPctLabel').textContent = `${savingsPct.toFixed(0)}% (${fmt(monthSavings)})`;
    $('savingsPctFill').style.width = `${Math.min(savingsPct, 100)}%`;
    
    // Custom Student financial advice
    let advice = '';
    if (monthIncome === 0) {
      advice = '💡 <strong>Pro-Tip:</strong> Log your monthly allowance or income first to calculate accurate 50/30/20 student budgeting advice.';
    } else if (needsPct > 50) {
      advice = `🚨 <strong>Needs at ${needsPct.toFixed(0)}%:</strong> You are spending more than 50% on fixed costs. Try cooking roommate meals or choosing public transport to lower variable expenses.`;
    } else if (wantsPct > 30) {
      advice = `⚠️ <strong>Wants at ${wantsPct.toFixed(0)}%:</strong> Fun spending is above the 30% limit. Consider putting impulsive purchases on our 30-day wishlist lock!`;
    } else if (savingsPct < 20) {
      advice = `💡 <strong>Savings at ${savingsPct.toFixed(0)}%:</strong> Your monthly savings rate is under 20%. Try setting a Piggy Bank Goal to build good habits!`;
    } else {
      advice = '🎉 <strong>Excellent work!</strong> Your student finances perfectly match the 50/30/20 spending rule. Keep tracking!';
    }
    $('financialAdviceBox').innerHTML = advice;
    
    if (window.lucide) lucide.createIcons();
  },

  checkBudgetAlert() {
    const now   = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    
    // Check Global
    const budget= State.budgets[month];
    if (budget) {
      const spent = State.transactions.filter(t=>t.type==='expense'&&t.date.startsWith(month)).reduce((s,t)=>s+t.amount,0);
      if (spent > budget) toast(`⚠ Budget exceeded! Spent ${fmt(spent)} of ${fmt(budget)}.`, 'error', 5000);
      else if (spent/budget >= 0.75) toast(`⚠ 75% of your monthly budget used.`, 'warning', 4000);
    }
    
    // Check Category Budgets
    Object.entries(State.categoryBudgets || {})
      .filter(([key]) => key.startsWith(month + '_'))
      .forEach(([key, limit]) => {
        const catName = key.split('_')[1];
        const spent = State.transactions
          .filter(t => t.type === 'expense' && t.category === catName && t.date.startsWith(month))
          .reduce((sum, t) => sum + t.amount, 0);
        if (spent > limit) {
          toast(`⚠ Category Budget exceeded for ${catName}! Spent ${fmt(spent)} of ${fmt(limit)}.`, 'error', 5000);
        } else if (spent / limit >= 0.75) {
          toast(`⚠ 75% of your budget for ${catName} has been used.`, 'warning', 4000);
        }
      });
  },

  /* ───────── STATISTICS ───────── */
  renderStatistics() {
    const txs     = State.transactions;
    const income  = txs.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
    const expense = txs.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
    const expenses= txs.filter(t=>t.type==='expense');
    const incomes = txs.filter(t=>t.type==='income');

    // Avg Daily
    const days30exp = expenses.filter(t=>{ const d=new Date(t.date),n=new Date(); return (n-d)/86400000<=30; });
    const avgDaily  = days30exp.length ? days30exp.reduce((s,t)=>s+t.amount,0)/30 : 0;

    // Avg Monthly
    const months = [...new Set(expenses.map(t=>t.date.slice(0,7)))];
    const avgMonthly = months.length ? expense/months.length : 0;

    const largestExp = expenses.length ? Math.max(...expenses.map(t=>t.amount)) : 0;
    const largestInc = incomes.length  ? Math.max(...incomes.map(t=>t.amount))  : 0;

    const stats = [
      { label:'Total Income',           val:fmt(income)    },
      { label:'Total Expense',           val:fmt(expense)   },
      { label:'Available Balance',       val:fmt(income-expense) },
      { label:'Avg Daily Expense (30d)', val:fmt(avgDaily)  },
      { label:'Avg Monthly Expense',     val:fmt(avgMonthly)},
      { label:'Largest Expense',         val:fmt(largestExp)},
      { label:'Largest Income',          val:fmt(largestInc)},
    ];
    $('statsGrid').innerHTML = stats.map(s=>`
      <div class="stat-card">
        <div class="stat-label">${s.label}</div>
        <div class="stat-value">${s.val}</div>
      </div>`).join('');

    // Savings Chart
    this.destroyChart('savings');
    const mths   = this.getLast12Months();
    const svData = mths.map(m=>{
      const inc = txs.filter(t=>t.type==='income'&&t.date.startsWith(m)).reduce((s,t)=>s+t.amount,0);
      const exp = txs.filter(t=>t.type==='expense'&&t.date.startsWith(m)).reduce((s,t)=>s+t.amount,0);
      return inc - exp;
    });
    const c = this.getChartColors();
    State.charts.savings = new Chart($('savingsChart'), {
      type:'bar',
      data:{
        labels: mths.map(m=>{ const [y,mo]=m.split('-'); return new Date(y,mo-1).toLocaleString('default',{month:'short',year:'2-digit'}); }),
        datasets:[{ label:'Savings', data:svData,
          backgroundColor: svData.map(v=>v>=0?'rgba(16,185,129,.75)':'rgba(239,68,68,.75)'), borderRadius:4 }]
      },
      options:{ responsive:true, maintainAspectRatio:true,
        plugins:{legend:{labels:{color:c.text, font:{family:'DM Sans'}}},tooltip:{callbacks:{label:ctx=>` ${fmt(ctx.raw)}`}}},
        scales:{x:{ticks:{color:c.text, font:{family:'DM Sans'}}, grid:{display:false}},y:{ticks:{color:c.text, font:{family:'DM Sans'},callback:v=>'₹'+v}, grid:{color:c.border}}}
      }
    });

    // Category Breakdown Chart
    this.destroyChart('statsCategory');
    const catMap={};
    expenses.forEach(t=>{catMap[t.category]=(catMap[t.category]||0)+t.amount;});
    const catLabels=Object.keys(catMap), catData=Object.values(catMap);
    if (catLabels.length) {
      const colors=['#4F46E5','#10B981','#F59E0B','#EF4444','#8B5CF6','#06B6D4','#F97316','#EC4899'];
      State.charts.statsCategory = new Chart($('statsCategoryChart'), {
        type:'doughnut',
        data:{labels:catLabels,datasets:[{data:catData,backgroundColor:colors,borderWidth:0}]},
        options:{responsive:true,maintainAspectRatio:true,
          plugins:{legend:{position:'bottom',labels:{color:c.text,font:{size:11, family:'DM Sans'}}},
          tooltip:{callbacks:{label:ctx=>` ${ctx.label}: ${fmt(ctx.raw)}`}}}
        }
      });
    }
  },

  /* ───────── REPORTS ───────── */
  generateReport(type) {
    const now = new Date();
    let txs = State.transactions;
    let title = '';

    if (type === 'daily') {
      const d = today();
      txs = txs.filter(t=>t.date===d);
      title = `Daily Report — ${fmtDate(d)}`;
    } else if (type === 'weekly') {
      const d = new Date(); d.setDate(d.getDate()-7);
      txs = txs.filter(t=>new Date(t.date)>=d);
      title = 'Weekly Report (Last 7 Days)';
    } else if (type === 'monthly') {
      const mm = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
      txs = txs.filter(t=>t.date.startsWith(mm));
      title = `Monthly Report — ${now.toLocaleString('default',{month:'long',year:'numeric'})}`;
    } else if (type === 'yearly') {
      txs = txs.filter(t=>t.date.startsWith(String(now.getFullYear())));
      title = `Yearly Report — ${now.getFullYear()}`;
    } else if (type === 'category') {
      title = 'Category-wise Expense Report';
      const catMap={};
      txs.filter(t=>t.type==='expense').forEach(t=>{
        if(!catMap[t.category]) catMap[t.category]={category:t.category,count:0,total:0};
        catMap[t.category].count++;
        catMap[t.category].total+=t.amount;
      });
      const rows = Object.values(catMap).sort((a,b)=>b.total-a.total);
      
      $('reportTitle').textContent = title;
      $('reportHead').innerHTML = '<tr><th>Category</th><th>Transactions</th><th>Total Amount</th></tr>';
      $('reportBody').innerHTML = rows.map(r=>`<tr><td><strong>${this.esc(r.category)}</strong></td><td>${r.count}</td><td class="amount-expense">${fmt(r.total)}</td></tr>`).join('');
      
      // Update Summaries for Category
      const totalExp = rows.reduce((s,r) => s+r.total, 0);
      $('report-sum-income').textContent = '₹0.00';
      $('report-sum-expense').textContent = fmt(totalExp);
      $('report-sum-net').textContent = fmt(-totalExp);
      
      $('reportResult').classList.remove('hidden');
      
      this.buildReportChart(rows.map(r=>r.category), rows.map(r=>r.total));
      
      State.currentReport = rows.map(r=>['Category','Transactions','Amount'].reduce((o,k,i)=>{o[k]=i===0?r.category:i===1?r.count:r.total;return o;},{}));
      State.currentReportTitle = title;
      return;
    }

    this.displayReportData(txs, title);
  },

  generateCustomReport() {
    const from = $('reportFromDate').value;
    const to = $('reportToDate').value;
    if (!from || !to) {
      toast('Select starting and ending dates.', 'error');
      return;
    }
    if (from > to) {
      toast('Start Date cannot be after End Date.', 'error');
      return;
    }
    const filtered = State.transactions.filter(t => t.date >= from && t.date <= to);
    const title = `Custom Report: ${fmtDate(from)} to ${fmtDate(to)}`;
    this.displayReportData(filtered, title);
  },

  displayReportData(txs, title) {
    const income = txs.filter(t => t.type === 'income').reduce((s,t) => s+t.amount, 0);
    const expense = txs.filter(t => t.type === 'expense').reduce((s,t) => s+t.amount, 0);
    const net = income - expense;

    $('reportTitle').textContent = title;
    $('report-sum-income').textContent = fmt(income);
    $('report-sum-expense').textContent = fmt(expense);
    $('report-sum-net').textContent = fmt(net);
    
    // Set text colors
    $('report-sum-net').className = 'report-widget-val ' + (net >= 0 ? 'amount-income' : 'amount-expense');

    $('reportHead').innerHTML = '<tr><th>Date</th><th>Name</th><th>Type</th><th>Category</th><th>Amount</th><th>Notes</th></tr>';
    $('reportBody').innerHTML = txs.slice().reverse().map(t=>`
      <tr>
        <td>${fmtDate(t.date)}</td>
        <td style="font-weight:700">${this.esc(t.name)}</td>
        <td><span class="badge badge-${t.type}">${t.type}</span></td>
        <td>${this.esc(t.category)}</td>
        <td class="amount-${t.type}">${fmt(t.amount)}</td>
        <td style="color:var(--text-muted);font-size:.8rem">${this.esc(t.notes||'—')}</td>
      </tr>`).join('');
      
    $('reportResult').classList.remove('hidden');

    // Report Chart
    const catMap = {};
    txs.filter(t=>t.type==='expense').forEach(t=>{ catMap[t.category] = (catMap[t.category]||0) + t.amount; });
    this.buildReportChart(Object.keys(catMap), Object.values(catMap));

    State.currentReport = txs.map(t=>({ Date:fmtDate(t.date), Name:t.name, Type:t.type, Category:t.category, Amount:t.amount, Notes:t.notes||'' }));
    State.currentReportTitle = title;
  },

  buildReportChart(labels, data) {
    this.destroyChart('report');
    if (!labels.length) {
      // Clear canvas context
      const canvas = $('reportChart');
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0,0,canvas.width,canvas.height);
      return;
    }
    const colors=['#4F46E5','#10B981','#F59E0B','#EF4444','#8B5CF6','#06B6D4','#F97316','#EC4899'];
    State.charts.report = new Chart($('reportChart'), {
      type: 'doughnut',
      data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0 }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position:'bottom', labels:{ color: this.getChartColors().text, font:{size:10, family:'DM Sans'} } }
        }
      }
    });
  },

  exportReport(fmt) { this.doExport(State.currentReport, State.currentReportTitle, fmt); },
  exportAll(format)  { this.doExport(State.transactions.map(t=>({ Date:fmtDate(t.date), Name:t.name, Type:t.type, Category:t.category, Amount:t.amount, Notes:t.notes||'' })), 'All Transactions', format); },

  doExport(data, title, format) {
    if (!data||!data.length) { toast('No data to export.','warning'); return; }
    if (format==='csv')   this.exportCSV(data, title);
    if (format==='excel') this.exportExcel(data, title);
    if (format==='pdf')   this.exportPDF(data, title);
  },

  exportCSV(data, title) {
    const keys = Object.keys(data[0]);
    const rows = [keys.join(','), ...data.map(r=>keys.map(k=>`"${String(r[k]).replace(/"/g,'""')}"`).join(','))];
    this.downloadFile(rows.join('\n'), `${title}.csv`, 'text/csv');
    toast('CSV exported!','success');
  },

  exportExcel(data, title) {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `${title}.xlsx`);
    toast('Excel exported!','success');
  },

  exportPDF(data, title) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation:'landscape' });
    doc.setFontSize(16);
    doc.text(title, 14, 18);
    doc.setFontSize(10);
    const keys = Object.keys(data[0]);
    let y = 30;
    
    doc.setFillColor(79,70,229);
    doc.setTextColor(255,255,255);
    doc.rect(14, y-6, doc.internal.pageSize.width-28, 8, 'F');
    keys.forEach((k,i)=>doc.text(k, 16+i*(doc.internal.pageSize.width-28)/keys.length, y));
    y+=6; doc.setTextColor(0,0,0);
    data.forEach(row => {
      if(y>190){ doc.addPage(); y=20; }
      keys.forEach((k,i)=>doc.text(String(row[k]).slice(0,18), 16+i*(doc.internal.pageSize.width-28)/keys.length, y));
      y+=7;
    });
    doc.save(`${title}.pdf`);
    toast('PDF exported!','success');
  },

  downloadFile(content, filename, mime) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content],{type:mime}));
    a.download = filename;
    a.click();
  },

  /* ───────── CATEGORIES ───────── */
  renderCategories() {
    $('categoriesList').innerHTML = State.categories.map((c,i)=>`
      <div class="category-chip">
        <div>
          <div class="cat-name"><i data-lucide="${getCategoryIcon(c.name)}" style="width:14px; height:14px; vertical-align:middle; margin-right:4px;"></i> ${this.esc(c.name)}</div>
          <div class="cat-type">${c.type}</div>
        </div>
        ${i >= DEFAULT_CATEGORIES.length ? `<button class="cat-del" onclick="App.deleteCategory(${i})" title="Delete">✕</button>` : ''}
      </div>`).join('');
      
    if (window.lucide) lucide.createIcons();
  },

  addCategory() {
    const name = $('newCatName').value.trim();
    const type = $('newCatType').value;
    if (!name) { toast('Category name is required.','error'); return; }
    if (State.categories.find(c=>c.name.toLowerCase()===name.toLowerCase())) { toast('Category already exists.','warning'); return; }
    State.categories.push({ name, type });
    save(LS.CATEGORIES, State.categories);
    $('newCatName').value = '';
    this.renderCategories();
    this.populateCategoryDropdowns();
    toast('Category added!','success');
  },

  deleteCategory(idx) {
    this.confirm('Delete this category?', () => {
      State.categories.splice(idx,1);
      save(LS.CATEGORIES, State.categories);
      this.renderCategories();
      this.populateCategoryDropdowns();
      toast('Category deleted.','success');
    });
  },

  /* ───────── LIVE SEARCH ───────── */
  liveSearch(q) {
    const dd = $('searchDropdown');
    if (!q.trim()) { dd.classList.remove('open'); return; }
    const term = q.toLowerCase();
    const results = State.transactions.filter(t=>
      t.name.toLowerCase().includes(term)||
      t.category.toLowerCase().includes(term)||
      (t.notes&&t.notes.toLowerCase().includes(term))
    ).slice(0,8);
    if (!results.length) { dd.innerHTML='<div class="search-result-item">No results found.</div>'; dd.classList.add('open'); return; }
    dd.innerHTML = results.map(t=>`
      <div class="search-result-item" onclick="App.viewTx('${t.id}')">
        <strong>${this.esc(t.name)}</strong> — <span style="color:var(--text-muted);font-size:.8rem">${this.esc(t.category)} · ${fmtDate(t.date)} · <span class="amount-${t.type}">${fmt(t.amount)}</span></span>
      </div>`).join('');
    dd.classList.add('open');
  },

  /* ───────── SMART BANK STATEMENT IMPORTER ───────── */
  handleImportFile(event) {
    if (typeof XLSX === 'undefined') {
      toast('Excel library (SheetJS) is not loaded. Please check your internet connection and reload the page.', 'error', 5000);
      return;
    }
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {type: 'array'});
        const wsName = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsName];
        const rawData = XLSX.utils.sheet_to_json(ws, {header: 1, defval: ''});
        
        if (!rawData || !rawData.length) {
          toast('The spreadsheet is empty.','error');
          return;
        }

        // Clean rawData rows and strip extra spaces
        const cleanedRawData = rawData.map(row => 
          Array.isArray(row) ? row.map(cell => cell !== undefined && cell !== null ? String(cell).trim() : '') : []
        ).filter(row => row.length > 0);

        if (cleanedRawData.length === 0) {
          toast('No data cells found in the sheet.','error');
          return;
        }

        // Detect if standard FinTrack format
        let isStandard = false;
        let standardRowIdx = -1;
        
        for (let i = 0; i < Math.min(cleanedRawData.length, 5); i++) {
          const headers = cleanedRawData[i].map(h => h.toLowerCase());
          if (['date', 'name', 'type', 'category', 'amount'].every(h => headers.includes(h))) {
            isStandard = true;
            standardRowIdx = i;
            break;
          }
        }

        if (isStandard) {
          // Standard FinTrack format import
          const headers = cleanedRawData[standardRowIdx].map(h => h.toLowerCase());
          const dateIdx = headers.indexOf('date');
          const nameIdx = headers.indexOf('name');
          const typeIdx = headers.indexOf('type');
          const catIdx = headers.indexOf('category');
          const amtIdx = headers.indexOf('amount');
          const notesIdx = headers.indexOf('notes');

          const imported = [];
          for (let i = standardRowIdx + 1; i < cleanedRawData.length; i++) {
            const row = cleanedRawData[i];
            const name = row[nameIdx];
            const amtStr = row[amtIdx] ? String(row[amtIdx]).replace(/,/g, '').replace(/[^\d.-]/g, '') : '0';
            const amt = parseFloat(amtStr);
            if (name && amt > 0) {
              imported.push({
                id: uid(),
                type: String(row[typeIdx] || 'expense').toLowerCase().trim(),
                name: name,
                category: row[catIdx] || 'Other',
                amount: amt,
                date: parseStatementDate(row[dateIdx]),
                notes: notesIdx !== -1 ? row[notesIdx] : ''
              });
            }
          }

          State.transactions.push(...imported);
          save(LS.TRANSACTIONS, State.transactions);
          toast(`Successfully imported ${imported.length} transactions!`,'success');
          this.renderTransactions();
          this.renderDashboard();
        } else {
          // Bank Statement visual mapper
          this.launchStatementColumnMapper(cleanedRawData);
        }
      } catch(err) {
        console.error("Importer Error:", err);
        const errMsg = String(err.message || err).toLowerCase();
        if (errMsg.includes('password') || errMsg.includes('decrypt') || errMsg.includes('encrypt') || errMsg.includes('crypto') || errMsg.includes('protected')) {
          toast('🔒 Password-Protected Statement: Please open the file in Excel or Google Sheets, unlock it with your bank password, and save/export an unprotected copy to upload here.', 'warning', 12000);
        } else {
          toast(`Error reading file: ${err.message}. Confirm sheet format.`, 'error', 6000);
        }
      }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = '';
  },

  launchStatementColumnMapper(rawData) {
    // 1. Skip header metadata block by searching for any banking keyword in rows with at least 3 non-empty cells
    let headerRowIdx = 0;
    const bankKeywords = ['date', 'desc', 'particular', 'narration', 'debit', 'credit', 'amount', 'trans', 'withdraw', 'deposit', 'ref', 'chq', 'balance'];
    for (let i = 0; i < Math.min(rawData.length, 30); i++) {
      const row = rawData[i];
      if (!row) continue;
      
      const nonEmptyCells = row.filter(cell => String(cell).trim() !== '');
      if (nonEmptyCells.length >= 3) {
        const hasKeyword = row.some(cell => {
          const str = String(cell).toLowerCase();
          return bankKeywords.some(kw => str.includes(kw));
        });
        if (hasKeyword) {
          headerRowIdx = i;
          break;
        }
      }
    }

    if (!rawData[headerRowIdx]) {
      toast('Failed to identify header columns.', 'error');
      return;
    }

    const headers = rawData[headerRowIdx].map((h, idx) => h ? String(h).trim() : `Column ${idx + 1}`);
    const dataRows = rawData.slice(headerRowIdx + 1).filter(r => r.some(c => c !== ''));

    State.importHeaders = headers;
    State.importRawRows = dataRows;

    // Populate Selector Dropdowns
    const optHtml = headers.map((h, i) => `<option value="${i}">${h}</option>`).join('');
    ['mapDate', 'mapDesc', 'mapAmount', 'mapDebit', 'mapCredit'].forEach(id => {
      $(id).innerHTML = optHtml;
    });
    
    // Type indicator dropdown (allows "No Type Column")
    $('mapTypeIndicator').innerHTML = '<option value="">No Type Column (Auto Sign)</option>' + 
      headers.map((h, i) => `<option value="${i}">${h}</option>`).join('');

    // Smart Auto-selection heuristics
    let hasDebitCredit = false;
    headers.forEach((h, idx) => {
      const norm = h.toLowerCase();
      if (norm.includes('date') || norm.includes('dt')) $('mapDate').value = idx;
      if (norm.includes('desc') || norm.includes('particular') || norm.includes('narration') || norm.includes('remark')) $('mapDesc').value = idx;
      if (norm.includes('amount') || norm.includes('amt') || norm.includes('txn value') || norm.includes('val')) $('mapAmount').value = idx;
      
      if (norm.includes('debit') || norm.includes('withdraw') || norm.includes('dr') || norm.includes('payment')) {
        $('mapDebit').value = idx;
        hasDebitCredit = true;
      }
      if (norm.includes('credit') || norm.includes('deposit') || norm.includes('cr') || norm.includes('receipt')) {
        $('mapCredit').value = idx;
        hasDebitCredit = true;
      }
      if (norm.includes('type') || norm.includes('dr/cr') || norm.includes('cr/dr') || norm.includes('indicator') || norm.includes('mode')) {
        $('mapTypeIndicator').value = idx;
      }
    });

    if (hasDebitCredit) {
      document.querySelector('input[name="amtType"][value="split"]').checked = true;
      this.toggleAmountMapping('split');
    } else {
      document.querySelector('input[name="amtType"][value="single"]').checked = true;
      this.toggleAmountMapping('single');
    }

    // Populate raw table preview
    let previewHtml = '<thead><tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr></thead><tbody>';
    dataRows.slice(0, 5).forEach(row => {
      previewHtml += '<tr>' + headers.map((_, i) => `<td>${this.esc(row[i] || '')}</td>`).join('') + '</tr>';
    });
    previewHtml += '</tbody>';
    $('importPreviewTable').innerHTML = previewHtml;

    // Open workspace in modal
    $('importReviewWorkspace').style.display = 'none';
    this.openModal('importMapperModal');
  },

  toggleAmountMapping(type) {
    if (type === 'single') {
      $('mapSingleAmtCol').style.display = 'flex';
      $('mapTypeIndicatorCard').style.display = 'flex';
      document.querySelectorAll('.split-amt-col').forEach(el => el.style.display = 'none');
    } else {
      $('mapSingleAmtCol').style.display = 'none';
      $('mapTypeIndicatorCard').style.display = 'none';
      document.querySelectorAll('.split-amt-col').forEach(el => el.style.display = 'flex');
    }
  },

  parseStatementWithMapping() {
    const dateIdx = parseInt($('mapDate').value);
    const descIdx = parseInt($('mapDesc').value);
    const amtType = document.querySelector('input[name="amtType"]:checked').value;
    
    const amtIdx = parseInt($('mapAmount').value);
    const debitIdx = parseInt($('mapDebit').value);
    const creditIdx = parseInt($('mapCredit').value);
    const typeIndicatorVal = $('mapTypeIndicator').value;
    const typeColIdx = typeIndicatorVal !== '' ? parseInt(typeIndicatorVal) : NaN;

    if (isNaN(dateIdx) || isNaN(descIdx)) {
      toast('Please select valid columns for mapping.', 'error');
      return;
    }
    if (amtType === 'single' && isNaN(amtIdx)) {
      toast('Please select the amount column.', 'error');
      return;
    }
    if (amtType === 'split' && (isNaN(debitIdx) || isNaN(creditIdx))) {
      toast('Please select both debit and credit columns.', 'error');
      return;
    }

    const parsed = [];
    
    State.importRawRows.forEach(row => {
      const rawDate = row[dateIdx] !== undefined && row[dateIdx] !== null ? String(row[dateIdx]).trim() : '';
      const rawDesc = row[descIdx] !== undefined && row[descIdx] !== null ? String(row[descIdx]).trim() : '';
      if (!rawDate && !rawDesc) return; // Skip empty rows

      const date = parseStatementDate(rawDate);
      let amount = 0;
      let type = 'expense';

      if (amtType === 'single') {
        const rawAmt = row[amtIdx] !== undefined && row[amtIdx] !== null ? String(row[amtIdx]).trim() : '';
        const val = parseFloat(rawAmt.replace(/,/g, '').replace(/[^\d.-]/g, ''));
        if (isNaN(val) || val === 0) return;
        
        amount = Math.abs(val);

        if (!isNaN(typeColIdx) && typeColIdx >= 0) {
          const rawType = row[typeColIdx] !== undefined && row[typeColIdx] !== null ? String(row[typeColIdx]).trim().toLowerCase() : '';
          // Detect debit indicators
          if (rawType.includes('dr') || rawType.includes('w') || rawType.includes('debit') || rawType.includes('exp') || rawType.includes('payment') || rawType.includes('withd') || rawType === 'd' || rawType === 'db') {
            type = 'expense';
          } else if (rawType.includes('cr') || rawType.includes('d') || rawType.includes('credit') || rawType.includes('inc') || rawType.includes('deposit') || rawType.includes('receipt') || rawType === 'c') {
            type = 'income';
          } else {
            type = val < 0 ? 'expense' : 'income'; // fallback to numeric sign
          }
        } else {
          type = val < 0 ? 'expense' : 'income';
        }
      } else {
        const rawDebit = row[debitIdx] !== undefined && row[debitIdx] !== null ? String(row[debitIdx]).trim() : '';
        const rawCredit = row[creditIdx] !== undefined && row[creditIdx] !== null ? String(row[creditIdx]).trim() : '';
        
        const debit = parseFloat(rawDebit.replace(/,/g, '').replace(/[^\d.-]/g, ''));
        const credit = parseFloat(rawCredit.replace(/,/g, '').replace(/[^\d.-]/g, ''));
        
        if (!isNaN(debit) && debit > 0) {
          amount = debit;
          type = 'expense';
        } else if (!isNaN(credit) && credit > 0) {
          amount = credit;
          type = 'income';
        } else {
          return; // Skip transaction if neither credit nor debit is a valid positive value
        }
      }

      const category = guessCategory(rawDesc);
      parsed.push({ id: uid(), date, name: rawDesc, type, amount, category });
    });

    State.parsedTransactions = parsed;

    if (parsed.length === 0) {
      toast('No transactions parsed with the selected column mapping. Check amount fields.', 'warning');
      return;
    }

    // Render review items
    $('reviewCount').textContent = parsed.length;
    const catOptionsHtml = State.categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
    
    $('reviewTableBody').innerHTML = parsed.map((t, idx) => `
      <tr id="review-row-${idx}">
        <td><input type="checkbox" class="review-row-check" data-idx="${idx}" checked onchange="App.handleReviewSelect(this)"/></td>
        <td><input type="date" value="${t.date}" id="rev-date-${idx}"/></td>
        <td><input type="text" value="${this.esc(t.name)}" id="rev-name-${idx}"/></td>
        <td>
          <select id="rev-type-${idx}">
            <option value="expense" ${t.type==='expense'?'selected':''}>Expense</option>
            <option value="income" ${t.type==='income'?'selected':''}>Income</option>
          </select>
        </td>
        <td><input type="number" value="${t.amount}" step="0.01" id="rev-amt-${idx}" style="font-family:var(--font-mono); font-weight:600;"/></td>
        <td>
          <select id="rev-cat-${idx}">
            ${catOptionsHtml}
          </select>
        </td>
      </tr>`).join('');

    // Pre-select category classifications on review list selectors
    parsed.forEach((t, idx) => {
      $(`rev-cat-${idx}`).value = t.category;
    });

    $('importReviewWorkspace').style.display = 'block';
    
    // Scroll to review workspace
    setTimeout(() => {
      $('importReviewWorkspace').scrollIntoView({ behavior: 'smooth' });
    }, 100);
  },

  toggleReviewSelectAll(cb) {
    document.querySelectorAll('.review-row-check').forEach(el => {
      el.checked = cb.checked;
      this.handleReviewSelect(el);
    });
  },

  handleReviewSelect(cb) {
    const tr = $(`review-row-${cb.dataset.idx}`);
    if (tr) {
      tr.style.opacity = cb.checked ? '1' : '0.45';
    }
  },

  finalizeImport() {
    const checkedBoxes = document.querySelectorAll('.review-row-check:checked');
    if (!checkedBoxes.length) {
      toast('No transactions checked for import.', 'warning');
      return;
    }

    const imported = [];
    checkedBoxes.forEach(cb => {
      const idx = parseInt(cb.dataset.idx);
      const date = $(`rev-date-${idx}`).value;
      const name = $(`rev-name-${idx}`).value.trim();
      const type = $(`rev-type-${idx}`).value;
      const amount = parseFloat($(`rev-amt-${idx}`).value) || 0;
      const category = $(`rev-cat-${idx}`).value;

      if (name && amount > 0 && date) {
        imported.push({ id: uid(), date, name, type, amount, category, notes: 'Imported via bank statement' });
      }
    });

    State.transactions.push(...imported);
    save(LS.TRANSACTIONS, State.transactions);
    
    this.closeModal('importMapperModal');
    toast(`Successfully imported ${imported.length} bank statement transactions!`, 'success');
    
    this.navigate('transactions');
    this.renderDashboard();
  },

  /* ───────── BACKUP & RESTORE ───────── */
  createBackup() {
    const data = {
      transactions: State.transactions,
      categories: State.categories,
      budgets: State.budgets,
      categoryBudgets: State.categoryBudgets,
      subscriptions: State.subscriptions,
      splitter: State.splitter,
      goals: State.goals,
      wishlist: State.wishlist,
      loans: State.loans,
      exportedAt: new Date().toISOString()
    };
    this.downloadFile(JSON.stringify(data,null,2), `fintrack-backup-${today()}.json`, 'application/json');
    toast('Data backup file downloaded successfully!','success');
  },

  restoreBackup(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target.result);
        this.confirm('This will OVERWRITE your current ledger, budgets, and categories. Proceed?', () => {
          if (data.transactions) { State.transactions=data.transactions; save(LS.TRANSACTIONS,State.transactions); }
          if (data.categories)   { State.categories=data.categories;     save(LS.CATEGORIES,State.categories); }
          if (data.budgets)      { State.budgets=data.budgets;           save(LS.BUDGET,State.budgets); }
          if (data.categoryBudgets) { State.categoryBudgets=data.categoryBudgets; save(LS.CAT_BUDGET,State.categoryBudgets); }
          if (data.subscriptions) { State.subscriptions=data.subscriptions; save(LS.SUBSCRIPTIONS,State.subscriptions); }
          if (data.splitter)     { State.splitter=data.splitter;         save(LS.SPLITTER,State.splitter); }
          if (data.goals)        { State.goals=data.goals;               save(LS.GOALS,State.goals); }
          if (data.wishlist)     { State.wishlist=data.wishlist;         save(LS.WISHLIST,State.wishlist); }
          if (data.loans)        { State.loans=data.loans;               save(LS.LOANS,State.loans); }
          toast('Database restored!','success');
          this.navigate('dashboard');
        });
      } catch { toast('Invalid backup file structure.','error'); }
    };
    reader.readAsText(file);
    event.target.value='';
  },

  resetAll() {
    this.confirm('⚠ Are you sure? This will delete ALL transactions, budgets, custom themes and restore original categories!', () => {
      [LS.TRANSACTIONS,LS.CATEGORIES,LS.BUDGET,LS.CAT_BUDGET,LS.SUBSCRIPTIONS,LS.SPLITTER,LS.GOALS,LS.WISHLIST,LS.SCRATCHPAD,LS.LOANS].forEach(k=>localStorage.removeItem(k));
      State.transactions=[]; 
      State.categories=[...DEFAULT_CATEGORIES]; 
      State.budgets={};
      State.categoryBudgets={};
      State.subscriptions=[];
      State.splitter={ roommates: ['You'], bills: [] };
      State.goals=[];
      State.wishlist=[];
      State.loans=[];
      $('notepadArea').value = '';
      save(LS.CATEGORIES, State.categories);
      toast('Full database reset completed.','warning');
      this.navigate('dashboard');
    });
  },

  /* ───────── MODAL UI CONTROLS ───────── */
  openModal(id)  { $(id).classList.add('open'); },
  closeModal(id) { $(id).classList.remove('open'); },

  confirm(msg, cb) {
    $('confirmMessage').textContent = msg;
    this.openModal('confirmModal');
    const btn = $('confirmOk');
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.addEventListener('click', () => { this.closeModal('confirmModal'); cb(); });
  },

  /* ───────── UTILITY ───────── */
  esc(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  },

  /* ───────── SUBSCRIPTIONS MODULE ───────── */
  saveSubscription() {
    const name = $('subName').value.trim();
    const amount = parseFloat($('subAmount').value);
    const category = $('subCategory').value;
    const date = $('subDate').value;
    const cycle = $('subCycle').value;
    
    if (!name || isNaN(amount) || amount <= 0 || !date) {
      toast('Please fill in all subscription fields.', 'error');
      return;
    }
    
    State.subscriptions.push({ id: uid(), name, amount, category, date, cycle });
    save(LS.SUBSCRIPTIONS, State.subscriptions);
    
    // Reset inputs
    $('subName').value = '';
    $('subAmount').value = '';
    $('subDate').value = '';
    
    toast('Subscription registered!', 'success');
    this.renderSubscriptions();
  },

  deleteSubscription(id) {
    this.confirm('Delete this subscription reminder?', () => {
      State.subscriptions = State.subscriptions.filter(s => s.id !== id);
      save(LS.SUBSCRIPTIONS, State.subscriptions);
      this.renderSubscriptions();
      toast('Subscription deleted.', 'info');
    });
  },

  markPaidSubscription(id) {
    const sub = State.subscriptions.find(s => s.id === id);
    if (!sub) return;
    
    const getNextDueDate = (startDateStr, cycle) => {
      const start = new Date(startDateStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let next = new Date(start);
      while (next < today) {
        if (cycle === 'monthly') {
          next.setMonth(next.getMonth() + 1);
        } else {
          next.setFullYear(next.getFullYear() + 1);
        }
      }
      return next.toISOString().split('T')[0];
    };

    const nextDue = getNextDueDate(sub.date, sub.cycle);
    
    // Add transaction to main ledger
    const tx = {
      id: uid(),
      type: 'expense',
      name: `Paid ${sub.name}`,
      category: sub.category,
      amount: sub.amount,
      date: nextDue,
      notes: `Recurring subscription payment for ${sub.name}`
    };
    State.transactions.push(tx);
    save(LS.TRANSACTIONS, State.transactions);
    
    // Advance next billing date of the subscription to avoid showing same due date
    const currentNextDue = new Date(nextDue);
    if (sub.cycle === 'monthly') {
      currentNextDue.setMonth(currentNextDue.getMonth() + 1);
    } else {
      currentNextDue.setFullYear(currentNextDue.getFullYear() + 1);
    }
    sub.date = currentNextDue.toISOString().split('T')[0];
    save(LS.SUBSCRIPTIONS, State.subscriptions);
    
    toast(`Paid ${sub.name} of ${fmt(sub.amount)} logged!`, 'success');
    this.renderSubscriptions();
    this.renderDashboard();
  },

  renderSubscriptions() {
    const getNextDueDate = (startDateStr, cycle) => {
      const start = new Date(startDateStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let next = new Date(start);
      while (next < today) {
        if (cycle === 'monthly') {
          next.setMonth(next.getMonth() + 1);
        } else {
          next.setFullYear(next.getFullYear() + 1);
        }
      }
      return next.toISOString().split('T')[0];
    };

    // Calculate total monthly commitments
    let totalMonthly = 0;
    State.subscriptions.forEach(s => {
      totalMonthly += s.cycle === 'monthly' ? s.amount : s.amount / 12;
    });
    $('subMonthlyCommitment').textContent = fmt(totalMonthly);

    const tbody = $('subscriptionsListBody');
    if (State.subscriptions.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:2rem; color:var(--text-muted);">No recurring bills scheduled.</td></tr>`;
      return;
    }

    tbody.innerHTML = State.subscriptions.map(s => {
      const nextDue = getNextDueDate(s.date, s.cycle);
      const isDueSoon = (new Date(nextDue) - new Date()) / (1000 * 3600 * 24) <= 3;
      const dueStyle = isDueSoon ? 'color:var(--danger); font-weight:700;' : '';

      return `
        <tr>
          <td style="font-weight:700;">${this.esc(s.name)}</td>
          <td style="text-transform:capitalize;">${s.cycle}</td>
          <td style="font-family:var(--font-mono);">${fmt(s.amount)}</td>
          <td style="${dueStyle}">${fmtDate(nextDue)}</td>
          <td>
            <div class="action-btns">
              <button class="btn-secondary" style="padding:0.3rem 0.6rem; font-size:0.75rem;" onclick="App.markPaidSubscription('${s.id}')"><i data-lucide="check"></i> Mark Paid</button>
              <button class="btn-icon del" onclick="App.deleteSubscription('${s.id}')"><i data-lucide="trash-2"></i></button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons();
  },

  /* ───────── ROOMMATE SPLITTER MODULE ───────── */
  addRoommate() {
    const name = $('roommateName').value.trim();
    if (!name) return;
    if (State.splitter.roommates.includes(name)) {
      toast('Roommate already added.', 'warning');
      return;
    }
    State.splitter.roommates.push(name);
    save(LS.SPLITTER, State.splitter);
    $('roommateName').value = '';
    this.renderBillSplitter();
  },

  deleteRoommate(name) {
    if (name === 'You') {
      toast('Cannot remove yourself.', 'warning');
      return;
    }
    this.confirm(`Remove ${name} and recalculate splits?`, () => {
      State.splitter.roommates = State.splitter.roommates.filter(r => r !== name);
      State.splitter.bills.forEach(b => {
        if (b.paidBy === name) b.paidBy = 'You';
      });
      save(LS.SPLITTER, State.splitter);
      this.renderBillSplitter();
      toast(`${name} removed.`, 'info');
    });
  },

  saveSharedBill() {
    const desc = $('splitDesc').value.trim();
    const amount = parseFloat($('splitAmount').value);
    const paidBy = $('splitPaidBy').value;
    
    if (!desc || isNaN(amount) || amount <= 0 || !paidBy) {
      toast('Please fill in all bill details.', 'error');
      return;
    }
    
    State.splitter.bills.push({
      id: uid(),
      desc,
      amount,
      paidBy,
      date: today()
    });
    save(LS.SPLITTER, State.splitter);
    
    $('splitDesc').value = '';
    $('splitAmount').value = '';
    
    toast('Shared bill logged!', 'success');
    this.renderBillSplitter();
  },

  logBillShare(id) {
    const bill = State.splitter.bills.find(b => b.id === id);
    if (!bill) return;
    
    const N = State.splitter.roommates.length;
    const share = bill.amount / N;
    
    const tx = {
      id: uid(),
      type: 'expense',
      name: `Split Share: ${bill.desc}`,
      category: 'Other',
      amount: share,
      date: today(),
      notes: `My 1/${N} share of bill: ${bill.desc} (Total: ${fmt(bill.amount)}) paid by ${bill.paidBy}`
    };
    
    State.transactions.push(tx);
    save(LS.TRANSACTIONS, State.transactions);
    toast(`Logged your share of ${fmt(share)} to main ledger!`, 'success');
    this.renderDashboard();
  },

  deleteSharedBill(id) {
    this.confirm('Delete this shared bill and recalculate debts?', () => {
      State.splitter.bills = State.splitter.bills.filter(b => b.id !== id);
      save(LS.SPLITTER, State.splitter);
      this.renderBillSplitter();
      toast('Bill deleted.', 'info');
    });
  },

  renderBillSplitter() {
    const chipsHtml = State.splitter.roommates.map(name => `
      <span class="roommate-chip">
        ${this.esc(name)}
        ${name !== 'You' ? `<button onclick="App.deleteRoommate('${name}')">✕</button>` : ''}
      </span>
    `).join('');
    $('roommateChipsContainer').innerHTML = chipsHtml;

    const optHtml = State.splitter.roommates.map(name => `<option value="${name}">${name}</option>`).join('');
    $('splitPaidBy').innerHTML = optHtml;

    const N = State.splitter.roommates.length;
    const balances = {};
    State.splitter.roommates.forEach(r => balances[r] = 0);
    
    State.splitter.bills.forEach(b => {
      const share = b.amount / N;
      balances[b.paidBy] += b.amount;
      State.splitter.roommates.forEach(r => {
        balances[r] -= share;
      });
    });

    const debtors = [];
    const creditors = [];
    Object.entries(balances).forEach(([name, bal]) => {
      if (bal < -0.01) debtors.push({ name, amount: -bal });
      else if (bal > 0.01) creditors.push({ name, amount: bal });
    });
    
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);
    
    const debts = [];
    let dIdx = 0, cIdx = 0;
    while (dIdx < debtors.length && cIdx < creditors.length) {
      const debtor = debtors[dIdx];
      const creditor = creditors[cIdx];
      const settleAmount = Math.min(debtor.amount, creditor.amount);
      debts.push({ from: debtor.name, to: creditor.name, amount: settleAmount });
      
      debtor.amount -= settleAmount;
      creditor.amount -= settleAmount;
      if (debtor.amount < 0.01) dIdx++;
      if (creditor.amount < 0.01) cIdx++;
    }

    const settlementsEl = $('roommateSettlementsDisplay');
    if (debts.length === 0) {
      settlementsEl.innerHTML = `<div style="color:var(--success); font-weight:600;"><i data-lucide="check-circle" style="width:16px; height:16px; vertical-align:middle; margin-right:4px;"></i> All room expenses settled! No debts.</div>`;
    } else {
      settlementsEl.innerHTML = debts.map(d => `
        <div class="settlement-item">
          <div><strong>${this.esc(d.from)}</strong> owes <strong>${this.esc(d.to)}</strong></div>
          <div style="font-family:var(--font-mono); font-weight:700; color:var(--accent);">${fmt(d.amount)}</div>
        </div>
      `).join('');
    }

    const listBody = $('splitBillsListBody');
    if (State.splitter.bills.length === 0) {
      listBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:2rem; color:var(--text-muted);">No shared bills recorded yet.</td></tr>`;
    } else {
      listBody.innerHTML = State.splitter.bills.map(b => {
        const yourShare = b.amount / N;
        return `
          <tr>
            <td style="font-weight:700;">${this.esc(b.desc)}</td>
            <td style="font-family:var(--font-mono);">${fmt(b.amount)}</td>
            <td>${this.esc(b.paidBy)}</td>
            <td style="font-family:var(--font-mono); font-weight:600; color:var(--accent);">${fmt(yourShare)}</td>
            <td>
              <div class="action-btns">
                <button class="btn-secondary" style="padding:0.3rem 0.6rem; font-size:0.75rem;" onclick="App.logBillShare('${b.id}')"><i data-lucide="file-plus"></i> Log Share</button>
                <button class="btn-icon del" onclick="App.deleteSharedBill('${b.id}')"><i data-lucide="trash-2"></i></button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }

    // Set default date for loan input if empty
    if (!$('loanDate').value) {
      $('loanDate').value = today();
    }

    // Render P2P Loans
    const loansBody = $('directLoansListBody');
    if (!State.loans || State.loans.length === 0) {
      loansBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:2rem; color:var(--text-muted);">No direct loans recorded.</td></tr>`;
    } else {
      loansBody.innerHTML = State.loans.map(l => {
        const typeBadge = l.type === 'lent' 
          ? `<span class="badge badge-income">Lent</span>`
          : `<span class="badge badge-expense">Borrowed</span>`;
        const amtClass = l.type === 'lent' ? 'amount-income' : 'amount-expense';
        const prefix = l.type === 'lent' ? '+' : '-';
        return `
          <tr>
            <td style="font-weight:700;">${this.esc(l.person)}</td>
            <td>${typeBadge}</td>
            <td class="${amtClass}" style="font-family:var(--font-mono); font-weight:700;">${prefix}${fmt(l.amount)}</td>
            <td style="font-size:0.8rem; color:var(--text-muted);">
              <div>${fmtDate(l.date)}</div>
              <div style="font-style:italic; max-width:150px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${this.esc(l.notes)}">${this.esc(l.notes || '—')}</div>
            </td>
            <td>
              <div class="action-btns">
                <button class="btn-secondary" style="padding:0.3rem 0.6rem; font-size:0.75rem; background-color:var(--success); border-color:var(--success); color:#fff;" onclick="App.settleDirectLoan('${l.id}')"><i data-lucide="check"></i> Settle</button>
                <button class="btn-icon del" onclick="App.deleteDirectLoan('${l.id}')"><i data-lucide="trash-2"></i></button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }
    
    if (window.lucide) lucide.createIcons();
  },

  /* ───────── SAVINGS GOALS & WISHLIST MODULE ───────── */
  saveSavingsGoal() {
    const name = $('goalName').value.trim();
    const target = parseFloat($('goalTarget').value);
    const dateStr = $('goalDate').value;
    
    if (!name || isNaN(target) || target <= 0 || !dateStr) {
      toast('Please fill in all savings goal fields.', 'error');
      return;
    }
    
    State.goals.push({ id: uid(), name, target, date: dateStr, saved: 0 });
    save(LS.GOALS, State.goals);
    
    $('goalName').value = '';
    $('goalTarget').value = '';
    $('goalDate').value = '';
    
    toast('Savings Goal registered! Start saving!', 'success');
    this.renderGoalsWishlist();
  },

  addGoalSavings(id) {
    const goal = State.goals.find(g => g.id === id);
    if (!goal) return;
    
    const remaining = goal.target - goal.saved;
    const amtStr = prompt(`Enter amount to add to savings for "${goal.name}" (Target remaining: ${fmt(remaining)}):`);
    if (amtStr === null) return;
    
    const amt = parseFloat(amtStr.replace(/,/g, '').replace(/[^\d.-]/g, ''));
    if (isNaN(amt) || amt <= 0) {
      toast('Please enter a positive amount.', 'error');
      return;
    }
    
    goal.saved = Math.min(goal.saved + amt, goal.target);
    save(LS.GOALS, State.goals);
    
    if (goal.saved >= goal.target) {
      toast(`🎉 Congratulations! You achieved your savings goal: "${goal.name}"!`, 'success', 6000);
    } else {
      toast(`Added ${fmt(amt)} to savings for "${goal.name}"!`, 'success');
    }
    this.renderGoalsWishlist();
  },

  deleteGoal(id) {
    this.confirm('Delete this savings goal?', () => {
      State.goals = State.goals.filter(g => g.id !== id);
      save(LS.GOALS, State.goals);
      this.renderGoalsWishlist();
      toast('Goal deleted.', 'info');
    });
  },

  addImpulsiveWish() {
    const name = $('wishName').value.trim();
    const amount = parseFloat($('wishAmount').value);
    const category = $('wishCategory').value;
    
    if (!name || isNaN(amount) || amount <= 0) {
      toast('Please fill in all wishlist fields.', 'error');
      return;
    }
    
    State.wishlist.push({ id: uid(), name, amount, category, date: today() });
    save(LS.WISHLIST, State.wishlist);
    
    $('wishName').value = '';
    $('wishAmount').value = '';
    
    toast('Item placed in 30-day cooling-off chamber. Practice mindful buying!', 'warning');
    this.renderGoalsWishlist();
  },

  buyWishItem(id) {
    const item = State.wishlist.find(w => w.id === id);
    if (!item) return;
    
    const getDaysRemaining = (startDateStr) => {
      const start = new Date(startDateStr);
      const now = new Date();
      now.setHours(0,0,0,0);
      start.setHours(0,0,0,0);
      const diffTime = now - start;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(30 - diffDays, 0);
    };

    const daysLeft = getDaysRemaining(item.date);
    if (daysLeft > 0) {
      toast('🔒 Cooling-off timer is still active. Please wait to prevent impulsive buying!', 'error');
      return;
    }
    
    const tx = {
      id: uid(),
      type: 'expense',
      name: `Wishlist: ${item.name}`,
      category: item.category,
      amount: item.amount,
      date: today(),
      notes: 'Mindful purchase from wishlist cooling-off chamber!'
    };
    State.transactions.push(tx);
    save(LS.TRANSACTIONS, State.transactions);
    
    State.wishlist = State.wishlist.filter(w => w.id !== id);
    save(LS.WISHLIST, State.wishlist);
    
    toast(`Congratulations on your mindful purchase: "${item.name}"!`, 'success');
    this.renderGoalsWishlist();
    this.renderDashboard();
  },

  deleteWishItem(id) {
    this.confirm('Remove this item from your wishlist?', () => {
      State.wishlist = State.wishlist.filter(w => w.id !== id);
      save(LS.WISHLIST, State.wishlist);
      this.renderGoalsWishlist();
      toast('Item removed from wishlist.', 'info');
    });
  },

  renderGoalsWishlist() {
    const getRemainingMonths = (targetYYYYMM) => {
      const now = new Date();
      const curY = now.getFullYear();
      const curM = now.getMonth();
      const parts = targetYYYYMM.split('-');
      const tarY = parseInt(parts[0]);
      const tarM = parseInt(parts[1]) - 1;
      const totalMonths = (tarY - curY) * 12 + (tarM - curM);
      return Math.max(totalMonths, 1);
    };

    const getDaysRemaining = (startDateStr) => {
      const start = new Date(startDateStr);
      const now = new Date();
      now.setHours(0,0,0,0);
      start.setHours(0,0,0,0);
      const diffTime = now - start;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(30 - diffDays, 0);
    };

    // 1. Render Savings Goals
    const goalsList = $('savingsGoalsDisplayList');
    if (State.goals.length === 0) {
      goalsList.innerHTML = `<p style="color:var(--text-muted); font-size:0.9rem;">No savings goals set yet. Save for a major purchase!</p>`;
    } else {
      goalsList.innerHTML = State.goals.map(g => {
        const pct = g.target > 0 ? Math.min((g.saved / g.target) * 100, 100) : 0;
        const remMonths = getRemainingMonths(g.date);
        const remAmount = Math.max(g.target - g.saved, 0);
        const neededPerMonth = remAmount / remMonths;
        const d = new Date(g.date + '-01');
        const monthLabel = d.toLocaleString('default', { month: 'long', year: 'numeric' });
        
        return `
          <div class="goal-item form-card" style="margin-bottom:0; padding:1.25rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
              <span style="font-weight:700; font-family:var(--font-display);">${this.esc(g.name)}</span>
              <span style="font-family:var(--font-mono); font-size:0.85rem; color:var(--text-muted);">${fmt(g.saved)} / ${fmt(g.target)}</span>
            </div>
            <div class="progress-bar" style="margin-bottom:0.5rem;"><div class="progress-fill" style="width:${pct.toFixed(1)}%"></div></div>
            <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.75rem; color:var(--text-muted);">
              <span>Target: ${monthLabel} · ${pct.toFixed(0)}% Saved</span>
              <span>Need ${fmt(neededPerMonth)}/mo</span>
            </div>
            <div style="display:flex; gap:0.5rem; margin-top:0.75rem;">
              <button class="btn-secondary" style="padding:0.4rem 0.8rem; font-size:0.75rem;" onclick="App.addGoalSavings('${g.id}')"><i data-lucide="piggy-bank" style="width:12px; height:12px;"></i> Add Savings</button>
              <button class="btn-ghost" style="padding:0.4rem 0.8rem; font-size:0.75rem; color:var(--danger); border-color:var(--danger-light);" onclick="App.deleteGoal('${g.id}')">Delete</button>
            </div>
          </div>
        `;
      }).join('');
    }

    // 2. Render Impulsive Wishlist
    const wishList = $('impulsiveWishlistDisplay');
    if (State.wishlist.length === 0) {
      wishList.innerHTML = `<p style="color:var(--text-muted); font-size:0.9rem;">Your cooling-off chamber is empty. Good job budgeting!</p>`;
    } else {
      wishList.innerHTML = State.wishlist.map(w => {
        const daysLeft = getDaysRemaining(w.date);
        const isExpired = daysLeft <= 0;
        return `
          <div class="wish-item form-card" style="margin-bottom:0; padding:1.25rem; border-color:${isExpired ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'};">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.25rem;">
              <span style="font-weight:700; font-family:var(--font-display);">${this.esc(w.name)}</span>
              <span style="font-family:var(--font-mono); font-size:0.9rem; font-weight:700; color:var(--accent);">${fmt(w.amount)}</span>
            </div>
            <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:0.75rem;">
              Category: ${this.esc(w.category)} · Added: ${fmtDate(w.date)}
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
              <span class="cooldown-timer" style="font-size:0.8rem; font-weight:700; color:${isExpired ? 'var(--success)' : 'var(--warning)'}; display:flex; align-items:center; gap:0.25rem;">
                <i data-lucide="${isExpired ? 'unlock' : 'lock'}" style="width:14px; height:14px;"></i>
                ${isExpired ? 'Cooling-off complete!' : `${daysLeft} day(s) remaining`}
              </span>
              <div style="display:flex; gap:0.4rem;">
                <button class="btn-primary" style="padding:0.4rem 0.8rem; font-size:0.75rem;" ${isExpired ? '' : 'disabled'} onclick="App.buyWishItem('${w.id}')"><i data-lucide="shopping-cart" style="width:12px; height:12px;"></i> Buy Now</button>
                <button class="btn-ghost" style="padding:0.4rem 0.8rem; font-size:0.75rem;" onclick="App.deleteWishItem('${w.id}')">Remove</button>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }
    
    if (window.lucide) lucide.createIcons();
  },

  /* ───────── INSIGHTS ENGINE ───────── */
  renderInsights() {
    const txs = State.transactions;
    const now = new Date();
    const curMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    
    const monthInc = txs.filter(t=>t.type==='income'&&t.date.startsWith(curMonth)).reduce((s,t)=>s+t.amount,0);
    const monthExp = txs.filter(t=>t.type==='expense'&&t.date.startsWith(curMonth)).reduce((s,t)=>s+t.amount,0);
    
    const insights = [];
    
    if (monthInc > 0) {
      const savings = monthInc - monthExp;
      const rate = (savings / monthInc) * 100;
      if (rate < 10) {
        insights.push({
          type: 'warning',
          icon: 'alert-triangle',
          text: `Your savings rate is low (**${rate.toFixed(0)}%**). Try cutting down on wants to save at least 20% of your income.`
        });
      } else if (rate >= 30) {
        insights.push({
          type: 'success',
          icon: 'sparkles',
          text: `Outstanding! You saved **${rate.toFixed(0)}%** of your income this month. Keep up this disciplined piggy bank habit.`
        });
      }
    } else {
      insights.push({
        type: 'info',
        icon: 'briefcase',
        text: 'Log your monthly allowance, stipend, or salary to unlock savings rate analysis and custom budgeting feedback.'
      });
    }

    const catMap = {};
    txs.filter(t=>t.type==='expense'&&t.date.startsWith(curMonth)).forEach(t => {
      catMap[t.category] = (catMap[t.category]||0) + t.amount;
    });
    
    if (monthExp > 0) {
      Object.entries(catMap).forEach(([cat, amt]) => {
        const pct = (amt / monthExp) * 100;
        if (pct >= 40) {
          insights.push({
            type: 'warning',
            icon: 'shopping-bag',
            text: `High spending on **${cat}** detected! It constitutes **${pct.toFixed(0)}%** of your total monthly expenses.`
          });
        }
      });
    }

    if (State.subscriptions && State.subscriptions.length > 0) {
      let subTotal = 0;
      State.subscriptions.forEach(s => {
        subTotal += s.cycle === 'monthly' ? s.amount : s.amount / 12;
      });
      if (monthInc > 0) {
        const subPct = (subTotal / monthInc) * 100;
        if (subPct > 15) {
          insights.push({
            type: 'warning',
            icon: 'bell',
            text: `Subscribed services consume **${subPct.toFixed(0)}%** of your income. Audit your subscriptions to cancel unused logs.`
          });
        }
      }
    }

    const budget = State.budgets[curMonth] || 0;
    if (budget > 0) {
      const budgetPct = (monthExp / budget) * 100;
      if (budgetPct >= 80 && budgetPct <= 100) {
        insights.push({
          type: 'warning',
          icon: 'shield-alert',
          text: `You have consumed **${budgetPct.toFixed(0)}%** of your global budget. Slow down spending for the rest of the month.`
        });
      }
    }

    if (insights.length === 0) {
      insights.push({
        type: 'success',
        icon: 'check-circle',
        text: 'All budget gauges and saving balances are looking healthy! Keep tracking your daily ledger.'
      });
    }

    const el = $('insightsList');
    if (el) {
      el.innerHTML = insights.map(ins => `
        <div style="padding:0.75rem 1rem; border-radius:var(--radius-sm); border:1px solid var(--border); background:var(--input-bg); border-left:3px solid ${ins.type==='success'?'var(--success)':ins.type==='warning'?'var(--warning)':'var(--accent)'}; display:flex; gap:0.5rem; align-items:flex-start;">
          <i data-lucide="${ins.icon}" style="width:16px; height:16px; color:${ins.type==='success'?'var(--success)':ins.type==='warning'?'var(--warning)':'var(--accent)'}; margin-top:2px; flex-shrink:0;"></i>
          <span style="color:var(--text-primary); font-size:0.8rem;">${this.escMarkdown(ins.text)}</span>
        </div>
      `).join('');
      if (window.lucide) lucide.createIcons();
    }
  },
  
  escMarkdown(text) {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  },

  /* ───────── PASSCODE APP LOCK SCREEN ───────── */
  currentPinEntry: '',

  checkAppLock() {
    const username = localStorage.getItem(LS.USERNAME);
    const sessionActive = sessionStorage.getItem(LS.SESSION_ACTIVE) === 'true';
    
    if (!username) {
      // First time use -> Show Registration screen
      $('lockScreen').style.display = 'flex';
      $('lockRegisterForm').style.display = 'flex';
      $('lockLoginForm').style.display = 'none';
      $('lockScreenSubtitle').textContent = 'Create a secure local account to save your transaction ledger.';
    } else if (!sessionActive) {
      // Username exists but session is not active -> Show PIN Entry
      $('lockScreen').style.display = 'flex';
      $('lockRegisterForm').style.display = 'none';
      $('lockLoginForm').style.display = 'flex';
      $('loginGreeting').textContent = `Welcome back, ${username}!`;
      $('lockScreenSubtitle').textContent = 'Enter your 4-digit passcode PIN to access your ledger.';
      this.currentPinEntry = '';
      this.updatePinDots();
    } else {
      // Active session -> Hide lockscreen
      $('lockScreen').style.display = 'none';
    }
  },

  lockApp() {
    sessionStorage.removeItem(LS.SESSION_ACTIVE);
    this.checkAppLock();
    toast('App locked successfully!', 'info');
  },

  registerLocalAccount() {
    const user = $('regUsername').value.trim();
    const pin = $('regPin').value.trim();
    
    if (!user) {
      toast('Please enter a username.', 'error');
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      toast('Passcode must be exactly 4 digits.', 'error');
      return;
    }
    
    localStorage.setItem(LS.USERNAME, user);
    localStorage.setItem(LS.PIN, pin);
    sessionStorage.setItem(LS.SESSION_ACTIVE, 'true');
    
    $('regUsername').value = '';
    $('regPin').value = '';
    
    $('lockScreen').style.display = 'none';
    toast(`Account registered! Welcome, ${user}!`, 'success');
    this.renderDashboard();
  },

  pressPinKey(key) {
    if (this.currentPinEntry.length >= 4) return;
    this.currentPinEntry += key;
    this.updatePinDots();
    
    if (this.currentPinEntry.length === 4) {
      // Small timeout to allow the dot to animate filled state
      setTimeout(() => this.loginLocalAccount(), 150);
    }
  },

  clearPin() {
    this.currentPinEntry = '';
    this.updatePinDots();
  },

  backspacePin() {
    if (this.currentPinEntry.length === 0) return;
    this.currentPinEntry = this.currentPinEntry.slice(0, -1);
    this.updatePinDots();
  },

  updatePinDots() {
    for (let i = 1; i <= 4; i++) {
      const dot = $(`dot-${i}`);
      if (dot) {
        dot.classList.toggle('filled', this.currentPinEntry.length >= i);
      }
    }
  },

  loginLocalAccount() {
    const correctPin = localStorage.getItem(LS.PIN);
    if (this.currentPinEntry === correctPin) {
      sessionStorage.setItem(LS.SESSION_ACTIVE, 'true');
      $('lockScreen').style.display = 'none';
      toast('Passcode verified! Welcome back.', 'success');
      this.renderDashboard();
    } else {
      // Incorrect PIN -> Shake card and clear input
      const card = document.querySelector('.lock-card');
      card.classList.add('shake');
      toast('Incorrect Access PIN. Please try again.', 'error');
      setTimeout(() => {
        card.classList.remove('shake');
        this.clearPin();
      }, 400);
    }
  },

  resetPinReset() {
    this.confirm('🚨 WIPE ALL DATA? This will permanently delete your ledger, PIN passcode, and all local settings!', () => {
      localStorage.clear();
      sessionStorage.clear();
      toast('All data wiped. Refreshing app...', 'warning');
      setTimeout(() => window.location.reload(), 1000);
    });
  },

  /* ───────── PEER-TO-PEER LOANS Ledger MODULE ───────── */
  saveDirectLoan() {
    const person = $('loanPerson').value.trim();
    const amount = parseFloat($('loanAmount').value);
    const type = $('loanType').value;
    const date = $('loanDate').value;
    const notes = $('loanNotes').value.trim();
    
    if (!person || isNaN(amount) || amount <= 0 || !date) {
      toast('Please fill in all required loan fields.', 'error');
      return;
    }
    
    const newLoan = {
      id: uid(),
      person,
      amount,
      type,
      date,
      notes
    };
    
    State.loans.push(newLoan);
    save(LS.LOANS, State.loans);
    
    // Reset form fields
    $('loanPerson').value = '';
    $('loanAmount').value = '';
    $('loanNotes').value = '';
    $('loanDate').value = today();
    
    toast(`P2P loan entry for ${person} saved!`, 'success');
    this.renderBillSplitter();
  },

  deleteDirectLoan(id) {
    this.confirm('Delete this loan record without settling?', () => {
      State.loans = State.loans.filter(l => l.id !== id);
      save(LS.LOANS, State.loans);
      this.renderBillSplitter();
      toast('Loan entry deleted.', 'info');
    });
  },

  settleDirectLoan(id) {
    const loan = State.loans.find(l => l.id === id);
    if (!loan) return;
    
    this.confirm(`Mark loan with ${loan.person} for ${fmt(loan.amount)} as settled and log to main ledger?`, () => {
      // Sync to main ledger:
      // If Lent, it means we got paid back -> Income
      // If Borrowed, it means we paid them back -> Expense
      const txType = loan.type === 'lent' ? 'income' : 'expense';
      const txName = loan.type === 'lent' 
        ? `Repayment from ${loan.person}` 
        : `Repayment to ${loan.person}`;
      const txCategory = 'Other'; // default category
      
      const newTx = {
        id: uid(),
        type: txType,
        name: txName,
        category: txCategory,
        amount: loan.amount,
        date: today(),
        notes: `Settled P2P loan from ${fmtDate(loan.date)}. Original notes: ${loan.notes || 'none'}`
      };
      
      State.transactions.push(newTx);
      save(LS.TRANSACTIONS, State.transactions);
      
      // Remove loan
      State.loans = State.loans.filter(l => l.id !== id);
      save(LS.LOANS, State.loans);
      
      toast(`Loan settled and logged as ${txType === 'income' ? 'Income' : 'Expense'}!`, 'success');
      this.renderBillSplitter();
      this.renderDashboard();
    });
  },

};

/* ── Boot FinTrack ── */
document.addEventListener('DOMContentLoaded', () => App.init());
