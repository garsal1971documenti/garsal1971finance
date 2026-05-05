const transactions = [
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

const euro = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR"
});

const transactionList = document.querySelector("#transactionList");
const budgetList = document.querySelector("#budgetList");
const dialog = document.querySelector("#transactionDialog");
const form = document.querySelector("#transactionForm");

function renderTotals() {
  const income = transactions
    .filter((transaction) => transaction.amount > 0)
    .reduce((total, transaction) => total + transaction.amount, 0);
  const expenses = transactions
    .filter((transaction) => transaction.amount < 0)
    .reduce((total, transaction) => total + Math.abs(transaction.amount), 0);
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
      const amountClass = transaction.amount > 0 ? "positive" : "warning";

      return `
        <div class="transaction-row">
          <div class="transaction-meta">
            <span class="category-dot" aria-hidden="true"></span>
            <div>
              <p class="transaction-title">${transaction.description}</p>
              <p class="transaction-category">${transaction.category}</p>
            </div>
          </div>
          <span class="transaction-amount ${amountClass}">
            ${euro.format(transaction.amount)}
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

document.querySelector("#addTransactionButton").addEventListener("click", () => {
  dialog.showModal();
});

form.addEventListener("submit", (event) => {
  if (event.submitter?.value === "cancel") {
    return;
  }

  event.preventDefault();
  const data = new FormData(form);
  const amount = Number.parseFloat(String(data.get("amount")).replace(",", "."));

  if (Number.isNaN(amount)) {
    return;
  }

  transactions.unshift({
    description: String(data.get("description")),
    category: String(data.get("category")),
    amount: data.get("category") === "Entrate" ? Math.abs(amount) : -Math.abs(amount),
    type: data.get("category") === "Entrate" ? "income" : "expense"
  });

  renderTotals();
  renderTransactions();
  form.reset();
  dialog.close();
});

renderTotals();
renderTransactions();
renderBudgets();
