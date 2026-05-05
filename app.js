import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const fallbackTransactions = [
  { description: "Stipendio", category: "Entrate", amount: 2450, type: "income" },
  { description: "Affitto", category: "Casa", amount: -720, type: "expense" },
  { description: "Supermercato", category: "Spesa", amount: -86.4, type: "expense" },
  { description: "Abbonamenti", category: "Tempo libero", amount: -32.99, type: "expense" },
  { description: "Carburante", category: "Trasporti", amount: -58, type: "expense" }
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
let currentUser = null;

const euro = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR"
});

const transactionList = document.querySelector("#transactionList");
const budgetList = document.querySelector("#budgetList");
const dialog = document.querySelector("#transactionDialog");
const form = document.querySelector("#transactionForm");
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

function renderTotals() {
  const income = transactions
    .filter((transaction) => transaction.amount > 0)
    .reduce((total, transaction) => total + Number(transaction.amount), 0);
  const expenses = transactions
    .filter((transaction) => transaction.amount < 0)
    .reduce((total, transaction) => total + Math.abs(Number(transaction.amount)), 0);
  const balance = income - expenses;
  const savingRate = income === 0 ? 0 : Math.round((balance / income) * 100);

  document.querySelector("#currentBalance").textContent = euro.format(balance);
  document.querySelector("#incomeTotal").textContent = euro.format(income);
  document.querySelector("#expenseTotal").textContent = euro.format(expenses);
  document.querySelector("#savingRate").textContent = `${savingRate}%`;
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
    authMessage.textContent = `Accesso effettuato come ${currentUser.email}. I movimenti sono sincronizzati con Supabase.`;
    authForm.classList.add("hidden");
    logoutButton.classList.remove("hidden");
    return;
  }

  authTitle.textContent = "Accedi";
  authMessage.textContent = "Accedi o crea un account per salvare i movimenti nel database Supabase.";
  authForm.classList.remove("hidden");
  logoutButton.classList.add("hidden");
}

function renderAll() {
  renderTotals();
  renderTransactions();
  renderBudgets();
  renderAuthState();
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

async function refreshSession() {
  if (!supabase) {
    renderAll();
    return;
  }

  const { data } = await supabase.auth.getSession();
  currentUser = data.session?.user ?? null;
  await loadTransactions();
}

async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    authMessage.textContent = `Accesso non riuscito: ${error.message}`;
    return;
  }

  currentUser = data.user;
  await loadTransactions();
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
  await loadTransactions();
}

document.querySelector("#addTransactionButton").addEventListener("click", () => {
  dialog.showModal();
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
  await loadTransactions();
});

form.addEventListener("submit", async (event) => {
  if (event.submitter?.value === "cancel") {
    return;
  }

  event.preventDefault();
  const data = new FormData(form);
  const amount = Number.parseFloat(String(data.get("amount")).replace(",", "."));

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

  form.reset();
  dialog.close();
});

await refreshSession();
