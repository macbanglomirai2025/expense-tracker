const form = document.getElementById("transaction-form");
const list = document.getElementById("transaction-list");
const incomeDisplay = document.getElementById("incomeTotal");
const expenseDisplay = document.getElementById("expenseTotal");
const balanceDisplay = document.getElementById("balanceTotal");
const filterType = document.getElementById("filterType");
const searchInput = document.getElementById("search");
const themeToggle = document.getElementById("themeToggle");

let editingId = null;
let monthlyChart;
let categoryChart;

/* -------- Dark Mode -------- */
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const mode = document.body.classList.contains("dark") ? "dark" : "light";
  localStorage.setItem("theme", mode);
  themeToggle.textContent = mode === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode";
});

if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
  themeToggle.textContent = "☀️ Light Mode";
}

/* -------- Fetch Transactions -------- */
async function fetchTransactions() {
  const res = await fetch("/api/transactions");
  const transactions = await res.json();

  list.innerHTML = "";

  let income = 0;
  let expense = 0;
  const monthlyData = {};
  const categoryData = {};

  transactions.forEach(tx => {

    if (filterType.value !== "all" && tx.type !== filterType.value) return;
    if (searchInput.value &&
        !tx.title.toLowerCase().includes(searchInput.value.toLowerCase())) return;

    if (tx.type === "income") income += tx.amount;
    else expense += tx.amount;

    const monthKey = new Date(tx.date)
      .toLocaleString("default", { month: "short" });

    monthlyData[monthKey] = (monthlyData[monthKey] || 0) + tx.amount;
    categoryData[tx.category] = (categoryData[tx.category] || 0) + tx.amount;

    const li = document.createElement("li");
    li.innerHTML = `
      <div>
        <strong>${tx.title}</strong> - ₹${tx.amount}
        <br>
        ${tx.category} | ${tx.type} | ${new Date(tx.date).toLocaleDateString()}
      </div>
      <div>
        <button onclick="editTransaction('${tx._id}', '${tx.title}', '${tx.amount}', '${tx.category}', '${tx.date}', '${tx.type}')">✏️</button>
        <button onclick="deleteTransaction('${tx._id}')">❌</button>
      </div>
    `;
    list.appendChild(li);
  });

  incomeDisplay.innerText = income;
  expenseDisplay.innerText = expense;
  balanceDisplay.innerText = income - expense;

  renderMonthlyChart(monthlyData);
  renderCategoryChart(categoryData);
}

/* -------- Charts -------- */
function renderMonthlyChart(data) {
  const ctx = document.getElementById("monthlyChart");
  if (monthlyChart) monthlyChart.destroy();

  monthlyChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(data),
      datasets: [{
        label: "Monthly Total",
        data: Object.values(data),
      }]
    }
  });
}

function renderCategoryChart(data) {
  const ctx = document.getElementById("categoryChart");
  if (categoryChart) categoryChart.destroy();

  categoryChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: Object.keys(data),
      datasets: [{
        data: Object.values(data),
      }]
    }
  });
}

/* -------- Form Submit -------- */
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("title").value;
  const amount = Number(document.getElementById("amount").value);
  const category = document.getElementById("category").value;
  const date = document.getElementById("date").value;
  const type = document.getElementById("type").value;

  const payload = { title, amount, category, date, type };

  if (editingId) {
    await fetch(`/api/transactions/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    editingId = null;
  } else {
    await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  }

  form.reset();
  fetchTransactions();
});

async function deleteTransaction(id) {
  await fetch(`/api/transactions/${id}`, { method: "DELETE" });
  fetchTransactions();
}

function editTransaction(id, title, amount, category, date, type) {
  editingId = id;
  document.getElementById("title").value = title;
  document.getElementById("amount").value = amount;
  document.getElementById("category").value = category;
  document.getElementById("date").value = date.split("T")[0];
  document.getElementById("type").value = type;
}

filterType.addEventListener("change", fetchTransactions);
searchInput.addEventListener("input", fetchTransactions);

fetchTransactions();