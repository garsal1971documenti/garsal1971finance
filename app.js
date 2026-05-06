import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const fallbackTransactions = [
  { description: "Stipendio", category: "Entrate", amount: 2450, type: "income" },
  { description: "Affitto", category: "Casa", amount: -720, type: "expense" },
  { description: "Supermercato", category: "Spesa", amount: -86.4, type: "expense" },
  { description: "Abbonamenti", category: "Tempo libero", amount: -32.99, type: "expense" },
  { description: "Carburante", category: "Trasporti", amount: -58, type: "expense" }
];

const fallbackPortfolios = [
  {
    id: "demo",
    name: "Demo investimenti",
    positions: [
      {
        id: "demo-aapl",
        symbol: "AAPL.US",
        name: "Apple",
        purchase_date: "2026-04-15",
        quantity: 5,
        purchase_price: 185.5,
        current_price: 185.5,
        price_date: "demo"
      }
    ]
  }
];

const budgets = [
  { category: "Casa", used: 720, limit: 850 },
  { category: "Spesa", used: 286, limit: 420 },
  { category: "Trasporti", used: 118, limit: 220 },
  { category: "Tempo libero", used: 96, limit: 180 }
];

const config = window.GARSAL_FINANCE_CONFIG ?? {};
const hasSupabaseConfig = Boolean(config.supabaseUrl && config.supabaseAnonKey);
const supabase = hasSupabaseConfig
  ? createClient(config.supabaseUrl, config.supabaseAnonKey)
  : null;

let transactions = [...fallbackTransactions];
let portfolios = [...fallbackPortfolios];
let currentUser = null;

const euro = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR"
});

const numberFormatter = new Intl.NumberFormat("it-IT", {
  maximumFractionDigits: 4
});

const transactionList = document.querySelector("#transactionList");
const budgetList = document.querySelector("#budgetList");
const portfolioList = document.querySelector("#portfolioList");
const transactionDialog = document.querySelector("#transactionDialog");
const positionDialog = document.querySelector("#positionDialog");
const transactionForm = document.querySelector("#transactionForm");
const positionForm = document.querySelector("#positionForm");
const authForm = document.querySelector("#authForm");
const signupButton = document.querySelector("#signupButton");
const logoutButton = document.querySelector("#logoutButton");
const authTitle = document.querySelector("#authTitle");
const authMessage = document.querySelector("#authMessage");

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#039;"
    }[character];
  });
}

function parseAmount(value) {
  return Number.parseFloat(String(value).replace(",", "."));
}

function getPortfolioRows() {
  return portfolios.flatMap((portfolio) => {
    return portfolio.positions.map((position) => ({
      ...position,
      portfolioName: portfolio.name
    }));
  });
}

function calculateWealth() {
  return getPortfolioRows().reduce(
    (totals, position) => {
      const quantity = Number(position.quantity);
      const purchasePrice = Number(position.purchase_price);
      const currentPrice = Number(position.current_price ?? position.purchase_price);
      const invested = quantity * purchasePrice;
      const market = quantity * currentPrice;

      totals.invested += invested;
      totals.market += market;
      totals.gain += market - invested;
      return totals;
    },
    { invested: 0, market: 0, gain: 0 }
  );
}

function renderTotals() {
  const income = transactions
    .filter((transaction) => transaction.amount > 0)
    .reduce((total, transaction) => total + Number(transaction.amount), 0);
  const expenses = transactions
    .filter((transaction) => transaction.amount < 0)
    .reduce((total, transaction) => total + Math.abs(Number(transaction.amount)), 0);
  const balance = income - expenses;
  const savingRate = income === 0 ? 0 : Math.round((balance / income) * 100);
  const wealth = calculateWealth();

  document.querySelector("#currentBalance").textContent = euro.format(balance);
  document.querySelector("#incomeTotal").textContent = euro.format(income);
  document.querySelector("#expenseTotal").textContent = euro.format(expenses);
  document.querySelector("#savingRate").textContent = `${savingRate}%`;
  document.querySelector("#wealthTotal").textContent = euro.format(wealth.market);
  document.querySelector("#wealthTrend").textContent = `${wealth.gain >= 0 ? "+" : ""}${euro.format(wealth.gain)}`;
  document.querySelector("#wealthTrend").className = `trend ${wealth.gain >= 0 ? "positive" : "warning"}`;
  document.querySelector("#investedTotal").textContent = euro.format(wealth.invested);
  document.querySelector("#marketTotal").textContent = euro.format(wealth.market);
  document.querySelector("#gainTotal").textContent = euro.format(wealth.gain);
  document.querySelector("#gainTotal").className = wealth.gain >= 0 ? "positive" : "warning";
}

function renderTransactions() {
  transactionList.innerHTML = transactions
    .map((transaction) => {
      const amount = Number(transaction.amount);
      const amountClass = amount > 0 ? "positive" : "warning";

      return `
        <div class="transaction-row">
          <div class="transaction-meta">
            <span class="category-dot" aria-hidden="true"></span>
            <div>
              <p class="transaction-title">${escapeHTML(transaction.description)}</p>
              <p class="transaction-category">${escapeHTML(transaction.category)}</p>
            </div>
          </div>
          <span class="transaction-amount ${amountClass}">
            ${euro.format(amount)}
          </span>
        </div>
      `;
    })
    .join("");
}

function renderBudgets() {
  budgetList.innerHTML = budgets
    .map((budget) => {
      const percent = Math.min(Math.round((budget.used / budget.limit) * 100), 100);

      return `
        <div class="budget-item">
          <div class="budget-row">
            <span>${budget.category}</span>
            <span>${euro.format(budget.used)} / ${euro.format(budget.limit)}</span>
          </div>
          <div class="progress-track" aria-label="${budget.category} ${percent}%">
            <span style="width: ${percent}%"></span>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderPortfolios() {
  if (portfolios.length === 0) {
    portfolioList.innerHTML = `
      <p class="price-note">Nessun titolo inserito. Usa + Titolo per creare un portafoglio e aggiungere il primo carico.</p>
    `;
    return;
  }

  portfolioList.innerHTML = portfolios
    .map((portfolio) => {
      const positionsHTML = portfolio.positions
        .map((position) => {
          const quantity = Number(position.quantity);
          const purchasePrice = Number(position.purchase_price);
          const currentPrice = Number(position.current_price ?? position.purchase_price);
          const invested = quantity * purchasePrice;
          const market = quantity * currentPrice;
          const gain = market - invested;

          return `
            <div class="position-row">
              <div class="position-main">
                <strong>${escapeHTML(position.symbol)}</strong>
                <p>${escapeHTML(position.name || position.symbol)} · ${escapeHTML(position.purchase_date)}</p>
              </div>
              <div class="position-grid">
                <div>
                  <span class="position-label">Quantit&agrave;</span>
                  <span class="position-value">${numberFormatter.format(quantity)}</span>
                </div>
                <div>
                  <span class="position-label">Carico</span>
                  <span class="position-value">${euro.format(purchasePrice)}</span>
                </div>
                <div>
                  <span class="position-label">Prezzo oggi</span>
                  <span class="position-value">${euro.format(currentPrice)}</span>
                </div>
                <div>
                  <span class="position-label">Valore</span>
                  <span class="position-value">${euro.format(market)}</span>
                </div>
                <div>
                  <span class="position-label">Risultato</span>
                  <span class="position-value ${gain >= 0 ? "positive" : "warning"}">${euro.format(gain)}</span>
                </div>
              </div>
            </div>
          `;
        })
        .join("");

      const portfolioMarket = portfolio.positions.reduce((total, position) => {
        return total + Number(position.quantity) * Number(position.current_price ?? position.purchase_price);
      }, 0);

      return `
        <article class="portfolio-card">
          <div class="portfolio-header">
            <div>
              <h3>${escapeHTML(portfolio.name)}</h3>
              <p>${portfolio.positions.length} titoli o carichi</p>
            </div>
            <strong>${euro.format(portfolioMarket)}</strong>
          </div>
          ${positionsHTML}
        </article>
      `;
    })
    .join("");
}

function renderAuthState() {
  if (!hasSupabaseConfig) {
    authTitle.textContent = "Collega Supabase";
    authMessage.textContent = "Crea config.js con URL e anon key Supabase. Intanto vedi dati demo locali.";
    authForm.classList.add("hidden");
    logoutButton.classList.add("hidden");
    return;
  }

  if (currentUser) {
    authTitle.textContent = "Database collegato";
    authMessage.textContent = `Accesso effettuato come ${currentUser.email}. Movimenti e patrimonio sono sincronizzati con Supabase.`;
    authForm.classList.add("hidden");
    logoutButton.classList.remove("hidden");
    return;
  }

  authTitle.textContent = "Accedi";
  authMessage.textContent = "Accedi o crea un account per salvare movimenti e patrimonio nel database Supabase.";
  authForm.classList.remove("hidden");
  logoutButton.classList.add("hidden");
}

function renderAll() {
  renderTotals();
  renderTransactions();
  renderBudgets();
  renderPortfolios();
  renderAuthState();
}

async function fetchDailyPrice(symbol) {
  const normalizedSymbol = symbol.trim().toLowerCase();
  const url = `https://stooq.com/q/l/?s=${encodeURIComponent(normalizedSymbol)}&f=sd2t2c&h&e=csv`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Servizio prezzi non disponibile");
  }

  const csv = await response.text();
  const [headerLine, dataLine] = csv.trim().split(/\r?\n/);
  const headers = headerLine.split(",");
  const values = dataLine.split(",");
  const row = Object.fromEntries(headers.map((header, index) => [header, values[index]]));
  const close = Number(row.Close);

  if (!Number.isFinite(close) || close <= 0) {
    throw new Error(`Prezzo non trovato per ${symbol}`);
  }

  return {
    current_price: close,
    price_date: row.Date || new Date().toISOString().slice(0, 10)
  };
}

async function enrichPositionPrice(position) {
  try {
    const price = await fetchDailyPrice(position.symbol);
    return { ...position, ...price };
  } catch {
    return {
      ...position,
      current_price: Number(position.current_price ?? position.purchase_price),
      price_date: position.price_date ?? "prezzo di carico"
    };
  }
}

async function refreshPortfolioPrices() {
  portfolios = await Promise.all(
    portfolios.map(async (portfolio) => ({
      ...portfolio,
      positions: await Promise.all(portfolio.positions.map(enrichPositionPrice))
    }))
  );

  renderAll();
}

async function loadTransactions() {
  if (!supabase || !currentUser) {
    transactions = [...fallbackTransactions];
    renderAll();
    return;
  }

  const { data, error } = await supabase
    .from("transactions")
    .select("id, description, category, amount, type, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    authMessage.textContent = `Errore lettura Supabase: ${error.message}`;
    return;
  }

  transactions = data;
  renderAll();
}

async function loadPortfolios() {
  if (!supabase || !currentUser) {
    portfolios = [...fallbackPortfolios];
    await refreshPortfolioPrices();
    return;
  }

  const { data, error } = await supabase
    .from("portfolios")
    .select(`
      id,
      name,
      portfolio_positions (
        id,
        symbol,
        name,
        purchase_date,
        quantity,
        purchase_price,
        current_price,
        price_date
      )
    `)
    .order("created_at", { ascending: true });

  if (error) {
    authMessage.textContent = `Errore lettura patrimonio: ${error.message}`;
    portfolios = [];
    renderAll();
    return;
  }

  portfolios = data.map((portfolio) => ({
    id: portfolio.id,
    name: portfolio.name,
    positions: portfolio.portfolio_positions ?? []
  }));
  await refreshPortfolioPrices();
}

async function refreshSession() {
  if (!supabase) {
    renderAll();
    return;
  }

  const { data } = await supabase.auth.getSession();
  currentUser = data.session?.user ?? null;
  await Promise.all([loadTransactions(), loadPortfolios()]);
}

async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    authMessage.textContent = `Accesso non riuscito: ${error.message}`;
    return;
  }

  currentUser = data.user;
  await Promise.all([loadTransactions(), loadPortfolios()]);
}

async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    authMessage.textContent = `Registrazione non riuscita: ${error.message}`;
    return;
  }

  currentUser = data.session?.user ?? null;
  authMessage.textContent = currentUser
    ? "Account creato e accesso effettuato."
    : "Account creato. Se Supabase richiede conferma email, controlla la posta.";
  await Promise.all([loadTransactions(), loadPortfolios()]);
}

async function getOrCreatePortfolio(name) {
  const existing = portfolios.find((portfolio) => portfolio.name.toLowerCase() === name.toLowerCase());

  if (existing) {
    return existing;
  }

  if (!supabase || !currentUser) {
    const portfolio = {
      id: crypto.randomUUID(),
      name,
      positions: []
    };
    portfolios.push(portfolio);
    return portfolio;
  }

  const { data, error } = await supabase
    .from("portfolios")
    .insert({ name })
    .select("id, name")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const portfolio = { ...data, positions: [] };
  portfolios.push(portfolio);
  return portfolio;
}

document.querySelector("#addTransactionButton").addEventListener("click", () => {
  transactionDialog.showModal();
});

document.querySelector("#addPositionButton").addEventListener("click", () => {
  positionDialog.showModal();
});

document.querySelector("#refreshPricesButton").addEventListener("click", async () => {
  await refreshPortfolioPrices();
});

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(authForm);
  await signIn(String(data.get("email")), String(data.get("password")));
});

signupButton.addEventListener("click", async () => {
  const data = new FormData(authForm);
  await signUp(String(data.get("email")), String(data.get("password")));
});

logoutButton.addEventListener("click", async () => {
  await supabase.auth.signOut();
  currentUser = null;
  await Promise.all([loadTransactions(), loadPortfolios()]);
});

transactionForm.addEventListener("submit", async (event) => {
  if (event.submitter?.value === "cancel") {
    return;
  }

  event.preventDefault();
  const data = new FormData(transactionForm);
  const amount = parseAmount(data.get("amount"));

  if (Number.isNaN(amount)) {
    return;
  }

  const transaction = {
    description: String(data.get("description")),
    category: String(data.get("category")),
    amount: data.get("category") === "Entrate" ? Math.abs(amount) : -Math.abs(amount),
    type: data.get("category") === "Entrate" ? "income" : "expense"
  };

  if (supabase && currentUser) {
    const { error } = await supabase.from("transactions").insert(transaction);

    if (error) {
      authMessage.textContent = `Errore salvataggio: ${error.message}`;
      return;
    }

    await loadTransactions();
  } else {
    transactions.unshift(transaction);
    renderAll();
  }

  transactionForm.reset();
  transactionDialog.close();
});

positionForm.addEventListener("submit", async (event) => {
  if (event.submitter?.value === "cancel") {
    return;
  }

  event.preventDefault();
  const data = new FormData(positionForm);
  const quantity = parseAmount(data.get("quantity"));
  const purchasePrice = parseAmount(data.get("purchasePrice"));

  if (Number.isNaN(quantity) || Number.isNaN(purchasePrice)) {
    authMessage.textContent = "Quantita e prezzo di carico devono essere numeri validi.";
    return;
  }

  try {
    const portfolio = await getOrCreatePortfolio(String(data.get("portfolio")).trim());
    const basePosition = {
      portfolio_id: portfolio.id,
      symbol: String(data.get("symbol")).trim().toUpperCase(),
      name: String(data.get("name") || data.get("symbol")).trim(),
      purchase_date: String(data.get("purchaseDate")),
      quantity,
      purchase_price: purchasePrice
    };
    const pricedPosition = await enrichPositionPrice(basePosition);

    if (supabase && currentUser) {
      const { error } = await supabase.from("portfolio_positions").insert(pricedPosition);

      if (error) {
        authMessage.textContent = `Errore salvataggio titolo: ${error.message}`;
        return;
      }

      await loadPortfolios();
    } else {
      portfolio.positions.unshift({
        ...pricedPosition,
        id: crypto.randomUUID()
      });
      renderAll();
    }

    positionForm.reset();
    positionDialog.close();
  } catch (error) {
    authMessage.textContent = `Errore patrimonio: ${error.message}`;
  }
});

await refreshSession();
