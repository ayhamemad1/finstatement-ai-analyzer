const STORAGE_KEY = "finstatement-ai-analyzer-v1";

const state = {
  rawRows: [],
  transactions: [],
  filteredTransactions: [],
  analytics: null,
  serverReady: false,
  hasServerKey: false,
  settings: {
    apiKey: "",
    model: "gpt-4.1-mini"
  }
};

const els = {
  navItems: document.querySelectorAll(".nav-item"),
  views: document.querySelectorAll(".view"),
  viewTitle: document.getElementById("view-title"),
  serverDot: document.getElementById("server-dot"),
  serverStatus: document.getElementById("server-status"),
  txCount: document.getElementById("tx-count"),
  dateRange: document.getElementById("date-range"),
  incomeKpi: document.getElementById("income-kpi"),
  expenseKpi: document.getElementById("expense-kpi"),
  netKpi: document.getElementById("net-kpi"),
  riskKpi: document.getElementById("risk-kpi"),
  merchantList: document.getElementById("merchant-list"),
  findingsList: document.getElementById("findings-list"),
  anomalyList: document.getElementById("anomaly-list"),
  aiMemo: document.getElementById("ai-memo"),
  aiCaption: document.getElementById("ai-caption"),
  transactionBody: document.getElementById("transaction-body"),
  searchInput: document.getElementById("search-input"),
  categoryFilter: document.getElementById("category-filter"),
  fileInput: document.getElementById("file-input"),
  pasteInput: document.getElementById("paste-input"),
  parsePaste: document.getElementById("parse-paste"),
  clearData: document.getElementById("clear-data"),
  loadSample: document.getElementById("load-sample"),
  exportJson: document.getElementById("export-json"),
  runAi: document.getElementById("run-ai"),
  apiKey: document.getElementById("api-key"),
  modelSelect: document.getElementById("model-select"),
  cashflowChart: document.getElementById("cashflow-chart"),
  categoryChart: document.getElementById("category-chart")
};

const categories = [
  { name: "Income", keywords: ["salary", "payroll", "deposit", "refund", "credit"] },
  { name: "Housing", keywords: ["rent", "mortgage", "residence", "apartment"] },
  { name: "Groceries", keywords: ["grocery", "carrefour", "market", "supermarket", "food"] },
  { name: "Transport", keywords: ["uber", "taxi", "fuel", "gas", "metro", "parking"] },
  { name: "Telecom", keywords: ["stc", "telecom", "mobile", "internet", "fiber"] },
  { name: "Shopping", keywords: ["amazon", "noon", "store", "marketplace", "electronics"] },
  { name: "Dining", keywords: ["restaurant", "coffee", "cafe", "dinner", "lunch"] },
  { name: "Health", keywords: ["medical", "clinic", "pharmacy", "hospital"] },
  { name: "Travel", keywords: ["flight", "hotel", "booking", "airline"] },
  { name: "Savings", keywords: ["savings", "investment", "transfer"] },
  { name: "Subscriptions", keywords: ["subscription", "netflix", "apple.com", "spotify"] },
  { name: "Cash", keywords: ["atm", "cash withdrawal"] }
];

const money = (value) => new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
}).format(value || 0);

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

function parseAmount(value) {
  if (value === null || value === undefined) return 0;
  const normalized = String(value)
    .replace(/[^\d.,()\-+]/g, "")
    .replace(/,/g, "");
  if (!normalized) return 0;
  const negative = normalized.includes("(") || normalized.startsWith("-");
  const number = Number(normalized.replace(/[()+]/g, ""));
  if (!Number.isFinite(number)) return 0;
  return negative ? -Math.abs(number) : number;
}

function splitCsvLine(line) {
  const cells = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if ((char === "," || char === "\t") && !quoted) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  cells.push(current.trim());
  return cells;
}

function parseDelimited(text) {
  const lines = String(text).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return [];

  const headers = splitCsvLine(lines[0]).map((header) => header.toLowerCase().trim());
  const rows = [];

  for (const line of lines.slice(1)) {
    const values = splitCsvLine(line);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });
    rows.push(row);
  }

  return rows;
}

function findColumn(row, candidates) {
  const keys = Object.keys(row);
  return keys.find((key) => candidates.some((candidate) => key.includes(candidate)));
}

function inferMerchant(description) {
  return String(description)
    .replace(/\b(payment|purchase|pos|card|transfer|bill|riyadh|jeddah|ksa|saudi)\b/gi, " ")
    .replace(/\d+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .slice(0, 3)
    .join(" ")
    .toUpperCase() || "UNKNOWN";
}

function categorize(description, amount) {
  const lower = String(description).toLowerCase();
  for (const category of categories) {
    if (category.keywords.some((keyword) => lower.includes(keyword))) {
      if (category.name === "Income" && amount < 0) continue;
      return category.name;
    }
  }
  return amount >= 0 ? "Income" : "Uncategorized";
}

function normalizeRows(rows) {
  return rows.map((row, index) => {
    const dateCol = findColumn(row, ["date", "posting", "value"]);
    const descCol = findColumn(row, ["description", "details", "merchant", "narration", "particular"]);
    const debitCol = findColumn(row, ["debit", "withdrawal", "paid out"]);
    const creditCol = findColumn(row, ["credit", "deposit", "paid in"]);
    const amountCol = findColumn(row, ["amount"]);
    const balanceCol = findColumn(row, ["balance"]);

    const debit = parseAmount(row[debitCol]);
    const credit = parseAmount(row[creditCol]);
    let amount = parseAmount(row[amountCol]);

    if (!amount) {
      amount = credit ? Math.abs(credit) : -Math.abs(debit);
    }

    const description = row[descCol] || "Unlabeled transaction";
    const date = new Date(row[dateCol]);
    const normalizedDate = Number.isNaN(date.getTime())
      ? new Date().toISOString().slice(0, 10)
      : date.toISOString().slice(0, 10);

    return {
      id: `tx-${index + 1}`,
      date: normalizedDate,
      description,
      merchant: inferMerchant(description),
      amount,
      type: amount >= 0 ? "Credit" : "Debit",
      category: categorize(description, amount),
      balance: parseAmount(row[balanceCol]),
      flags: []
    };
  }).filter((tx) => tx.description && tx.amount !== 0);
}

function groupBy(items, keyFn) {
  return items.reduce((acc, item) => {
    const key = keyFn(item);
    acc[key] = acc[key] || [];
    acc[key].push(item);
    return acc;
  }, {});
}

function summarize() {
  const txs = state.transactions;
  const income = txs.filter((tx) => tx.amount > 0).reduce((sum, tx) => sum + tx.amount, 0);
  const expenses = Math.abs(txs.filter((tx) => tx.amount < 0).reduce((sum, tx) => sum + tx.amount, 0));
  const byCategory = {};
  const byMonth = {};
  const byMerchant = {};

  txs.forEach((tx) => {
    const month = tx.date.slice(0, 7);
    byMonth[month] = byMonth[month] || { income: 0, expenses: 0, net: 0 };
    if (tx.amount >= 0) byMonth[month].income += tx.amount;
    else byMonth[month].expenses += Math.abs(tx.amount);
    byMonth[month].net += tx.amount;

    if (tx.amount < 0) {
      byCategory[tx.category] = (byCategory[tx.category] || 0) + Math.abs(tx.amount);
      byMerchant[tx.merchant] = (byMerchant[tx.merchant] || 0) + Math.abs(tx.amount);
    }
  });

  const expenseAmounts = txs.filter((tx) => tx.amount < 0).map((tx) => Math.abs(tx.amount));
  const avgExpense = expenseAmounts.reduce((sum, amount) => sum + amount, 0) / (expenseAmounts.length || 1);
  const anomalies = txs.filter((tx) => Math.abs(tx.amount) > avgExpense * 2.4 && tx.amount < 0);
  const recurring = Object.entries(groupBy(txs, (tx) => `${tx.merchant}-${Math.round(Math.abs(tx.amount))}`))
    .filter(([, rows]) => rows.length >= 2)
    .map(([key, rows]) => ({ key, count: rows.length, merchant: rows[0].merchant, amount: Math.abs(rows[0].amount) }));

  txs.forEach((tx) => {
    tx.flags = [];
    if (anomalies.some((item) => item.id === tx.id)) tx.flags.push("Large");
    if (recurring.some((item) => item.merchant === tx.merchant && Math.round(item.amount) === Math.round(Math.abs(tx.amount)))) tx.flags.push("Recurring");
  });

  const concentration = expenses
    ? Math.max(0, ...Object.values(byMerchant)) / expenses
    : 0;
  const riskScore = Math.round(Math.min(100, anomalies.length * 12 + concentration * 45 + (expenses > income ? 25 : 0)));

  state.analytics = {
    summary: { income, expenses, net: income - expenses, riskScore },
    categoryTotals: byCategory,
    cashflow: byMonth,
    anomalies,
    recurring,
    topMerchants: Object.entries(byMerchant)
      .map(([merchant, amount]) => ({ merchant, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8)
  };
}

function localFindings() {
  const data = state.analytics;
  if (!data || !state.transactions.length) {
    return ["Import a bank statement to generate insights."];
  }

  const findings = [];
  const { income, expenses, net, riskScore } = data.summary;
  const topCategory = Object.entries(data.categoryTotals).sort((a, b) => b[1] - a[1])[0];

  findings.push(`Net cashflow is ${money(net)} after ${money(income)} income and ${money(expenses)} expenses.`);
  if (topCategory) findings.push(`${topCategory[0]} is the largest expense category at ${money(topCategory[1])}.`);
  if (data.anomalies.length) findings.push(`${data.anomalies.length} large transactions need review.`);
  if (data.recurring.length) findings.push(`${data.recurring.length} recurring payment patterns were detected.`);
  if (expenses > income) findings.push("Expenses exceed income in this statement period.");
  findings.push(`Overall risk score is ${riskScore}/100.`);

  return findings;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    transactions: state.transactions,
    settings: { ...state.settings, apiKey: "" }
  }));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const saved = JSON.parse(raw);
    state.transactions = saved.transactions || [];
    state.settings = { ...state.settings, ...(saved.settings || {}) };
    summarize();
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function renderAll() {
  summarize();
  applyFilters();
  renderKpis();
  renderTables();
  renderLists();
  renderCharts();
  renderSettings();
  saveState();
}

function renderKpis() {
  const analytics = state.analytics || { summary: { income: 0, expenses: 0, net: 0, riskScore: 0 } };
  const dates = state.transactions.map((tx) => tx.date).sort();

  els.txCount.textContent = state.transactions.length;
  els.dateRange.textContent = dates.length ? `${dates[0]} to ${dates.at(-1)}` : "No data";
  els.incomeKpi.textContent = money(analytics.summary.income);
  els.expenseKpi.textContent = money(analytics.summary.expenses);
  els.netKpi.textContent = money(analytics.summary.net);
  els.riskKpi.textContent = analytics.summary.riskScore;
}

function renderTables() {
  if (!state.filteredTransactions.length) {
    els.transactionBody.innerHTML = `<tr><td colspan="8">No transactions match the current filters.</td></tr>`;
    return;
  }

  els.transactionBody.innerHTML = state.filteredTransactions.map((tx) => `
    <tr>
      <td>${tx.date}</td>
      <td>${escapeHtml(tx.description)}</td>
      <td>${escapeHtml(tx.merchant)}</td>
      <td><span class="badge">${escapeHtml(tx.category)}</span></td>
      <td>${tx.type}</td>
      <td class="${tx.amount >= 0 ? "amount-positive" : "amount-negative"}">${money(tx.amount)}</td>
      <td>${tx.balance ? money(tx.balance) : "-"}</td>
      <td>${tx.flags.map((flag) => `<span class="badge">${flag}</span>`).join(" ") || "-"}</td>
    </tr>
  `).join("");
}

function renderLists() {
  const data = state.analytics;
  const categoriesAvailable = [...new Set(state.transactions.map((tx) => tx.category))].sort();
  els.categoryFilter.innerHTML = `<option value="all">All categories</option>` +
    categoriesAvailable.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join("");

  if (!data || !state.transactions.length) {
    els.merchantList.innerHTML = `<div class="list-item"><p>Load a statement to see top merchants.</p></div>`;
    els.findingsList.innerHTML = `<div class="finding"><p>Insights will appear after import.</p></div>`;
    els.anomalyList.innerHTML = `<div class="list-item"><p>No statement loaded.</p></div>`;
    return;
  }

  els.merchantList.innerHTML = data.topMerchants.map((item) => `
    <div class="list-item">
      <strong><span>${escapeHtml(item.merchant)}</span><span>${money(item.amount)}</span></strong>
      <p>${Math.round((item.amount / (data.summary.expenses || 1)) * 100)}% of total expenses</p>
    </div>
  `).join("");

  els.findingsList.innerHTML = localFindings().map((finding, index) => `
    <div class="finding">
      <strong><span>Finding ${index + 1}</span></strong>
      <p>${escapeHtml(finding)}</p>
    </div>
  `).join("");

  els.anomalyList.innerHTML = data.anomalies.length
    ? data.anomalies.map((tx) => `
      <div class="list-item">
        <strong><span>${escapeHtml(tx.merchant)}</span><span>${money(tx.amount)}</span></strong>
        <p>${tx.date} - ${escapeHtml(tx.description)}</p>
      </div>
    `).join("")
    : `<div class="list-item"><p>No high-value anomalies detected.</p></div>`;
}

function renderSettings() {
  els.apiKey.value = state.settings.apiKey;
  els.modelSelect.value = state.settings.model;
}

function applyFilters() {
  const query = els.searchInput.value.toLowerCase().trim();
  const category = els.categoryFilter.value || "all";

  state.filteredTransactions = state.transactions.filter((tx) => {
    const matchesQuery = !query || [tx.description, tx.merchant, tx.category, tx.type]
      .join(" ")
      .toLowerCase()
      .includes(query);
    const matchesCategory = category === "all" || tx.category === category;
    return matchesQuery && matchesCategory;
  });
}

function drawCashflowChart() {
  const canvas = els.cashflowChart;
  const ctx = canvas.getContext("2d");
  const data = state.analytics?.cashflow || {};
  const months = Object.keys(data).sort();

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#111620";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (!months.length) {
    ctx.fillStyle = "#97a3b6";
    ctx.fillText("Load sample or import a statement", 32, 48);
    return;
  }

  const maxValue = Math.max(...months.flatMap((month) => [data[month].income, data[month].expenses]), 1);
  const barWidth = Math.min(80, (canvas.width - 90) / months.length / 2.6);
  const baseY = canvas.height - 48;

  months.forEach((month, index) => {
    const x = 55 + index * ((canvas.width - 100) / months.length);
    const incomeHeight = (data[month].income / maxValue) * 210;
    const expenseHeight = (data[month].expenses / maxValue) * 210;

    ctx.fillStyle = "#34d399";
    ctx.fillRect(x, baseY - incomeHeight, barWidth, incomeHeight);
    ctx.fillStyle = "#fb7185";
    ctx.fillRect(x + barWidth + 8, baseY - expenseHeight, barWidth, expenseHeight);
    ctx.fillStyle = "#97a3b6";
    ctx.fillText(month, x - 8, baseY + 22);
  });
}

function drawCategoryChart() {
  const canvas = els.categoryChart;
  const ctx = canvas.getContext("2d");
  const totals = state.analytics?.categoryTotals || {};
  const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const colors = ["#38bdf8", "#34d399", "#f59e0b", "#a78bfa", "#fb7185", "#60a5fa", "#f472b6", "#22c55e"];

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#111620";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (!entries.length) {
    ctx.fillStyle = "#97a3b6";
    ctx.fillText("No category data yet", 32, 48);
    return;
  }

  const total = entries.reduce((sum, [, amount]) => sum + amount, 0);
  let angle = -Math.PI / 2;
  const centerX = 150;
  const centerY = 158;
  const radius = 92;

  entries.forEach(([category, amount], index) => {
    const slice = (amount / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, angle, angle + slice);
    ctx.closePath();
    ctx.fillStyle = colors[index % colors.length];
    ctx.fill();
    angle += slice;

    ctx.fillStyle = colors[index % colors.length];
    ctx.fillRect(280, 45 + index * 28, 12, 12);
    ctx.fillStyle = "#eef3f8";
    ctx.fillText(`${category} ${Math.round((amount / total) * 100)}%`, 300, 56 + index * 28);
  });
}

function renderCharts() {
  drawCashflowChart();
  drawCategoryChart();
}

async function loadSample() {
  const response = await fetch("./sample-statement.csv");
  const text = await response.text();
  state.transactions = normalizeRows(parseDelimited(text));
  renderAll();
}

async function handleFile(file) {
  const text = await file.text();
  const rows = file.name.endsWith(".json") ? JSON.parse(text) : parseDelimited(text);
  state.transactions = normalizeRows(Array.isArray(rows) ? rows : rows.transactions || []);
  renderAll();
}

function switchView(view) {
  els.navItems.forEach((item) => item.classList.toggle("active", item.dataset.view === view));
  els.views.forEach((item) => item.classList.toggle("active", item.id === `${view}-view`));
  els.viewTitle.textContent = view[0].toUpperCase() + view.slice(1);
}

function exportJson() {
  const blob = new Blob([JSON.stringify({
    generatedAt: new Date().toISOString(),
    transactions: state.transactions,
    analytics: state.analytics
  }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "financial-statement-analysis.json";
  link.click();
  URL.revokeObjectURL(url);
}

function localMemo() {
  return localFindings().map((finding) => `- ${finding}`).join("\n");
}

async function runAiAnalysis() {
  if (!state.transactions.length) {
    switchView("import");
    return;
  }

  els.aiMemo.textContent = "Analyzing statement...";
  switchView("insights");

  const payload = {
    apiKey: state.settings.apiKey,
    model: state.settings.model,
    ...state.analytics
  };

  try {
    if (!state.serverReady) throw new Error("Server unavailable");
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "OpenAI request failed");
    els.aiMemo.textContent = data.text;
    els.aiCaption.textContent = `Generated with ${data.model}`;
  } catch (error) {
    els.aiMemo.textContent = `${localMemo()}\n\nLocal fallback used: ${error.message}`;
    els.aiCaption.textContent = "Local rule-based memo";
  }
}

async function checkServer() {
  try {
    const response = await fetch("/api/health");
    const data = await response.json();
    state.serverReady = Boolean(data.ok);
    state.hasServerKey = Boolean(data.hasServerKey);
    els.serverDot.className = "dot ready";
    els.serverStatus.textContent = state.hasServerKey ? "OpenAI proxy ready" : "Server ready, add key";
  } catch {
    state.serverReady = false;
    els.serverDot.className = "dot error";
    els.serverStatus.textContent = "Static local mode";
  }
}

function wireEvents() {
  els.navItems.forEach((item) => item.addEventListener("click", () => switchView(item.dataset.view)));
  els.loadSample.addEventListener("click", loadSample);
  els.exportJson.addEventListener("click", exportJson);
  els.runAi.addEventListener("click", runAiAnalysis);
  els.parsePaste.addEventListener("click", () => {
    state.transactions = normalizeRows(parseDelimited(els.pasteInput.value));
    renderAll();
  });
  els.clearData.addEventListener("click", () => {
    state.transactions = [];
    state.filteredTransactions = [];
    state.analytics = null;
    els.aiMemo.textContent = "Load transactions and click AI analysis to generate a finance review.";
    renderAll();
  });
  els.fileInput.addEventListener("change", (event) => {
    const [file] = event.target.files;
    if (file) handleFile(file);
  });
  els.searchInput.addEventListener("input", () => {
    applyFilters();
    renderTables();
  });
  els.categoryFilter.addEventListener("change", () => {
    applyFilters();
    renderTables();
  });
  els.apiKey.addEventListener("input", () => {
    state.settings.apiKey = els.apiKey.value.trim();
    saveState();
  });
  els.modelSelect.addEventListener("change", () => {
    state.settings.model = els.modelSelect.value;
    saveState();
  });
}

loadState();
wireEvents();
await checkServer();
renderAll();
