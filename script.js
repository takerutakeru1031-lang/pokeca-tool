let chart;

let products = JSON.parse(localStorage.getItem("products")) || {};

let currentProduct = localStorage.getItem("currentProduct") || null;
let currentChartProduct = localStorage.getItem("currentChartProduct") || null;
let editingQuantityProduct = null;

function saveProducts() {
  localStorage.setItem("products", JSON.stringify(products));
  localStorage.setItem("currentProduct", currentProduct);
  localStorage.setItem("currentChartProduct", currentChartProduct);
}

function loadProducts() {
  const savedProducts = localStorage.getItem("products");
  const savedCurrentProduct = localStorage.getItem("currentProduct");
  const savedCurrentChartProduct = localStorage.getItem("currentChartProduct");

  if (savedProducts) {
    products = JSON.parse(savedProducts);
  }
  normalizeProductsData();

  if (savedCurrentProduct) {
    currentProduct = savedCurrentProduct;
  }

  if (savedCurrentChartProduct) {
    currentChartProduct = savedCurrentChartProduct;
  }
  if (!currentChartProduct && currentProduct) {
    currentChartProduct = currentProduct;
  }
    if (!currentChartProduct) {
    const names = Object.keys(products);
    if (names.length > 0) {
      currentChartProduct = names[0];
    }
  }

  if (editingQuantityProduct && !products[editingQuantityProduct]) {
    editingQuantityProduct = null;
  }
}

function sortHistoryByDate(history) {
  if (!Array.isArray(history)) return [];

  return history.sort((a, b) => {
    const dateA = parseFlexibleDate(a.date);
    const dateB = parseFlexibleDate(b.date);

    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;

    return dateA - dateB;
  });
}

function normalizeProductsData() {
  for (const name in products) {
    const product = products[name] || {};

    product.buyPrice = Number(product.buyPrice) || 0;
    product.quantity = Number(product.quantity) || 0;
    product.soldQuantity = Number(product.soldQuantity) || 0;
    product.realizedProfit = Number(product.realizedProfit) || 0;
    product.history = Array.isArray(product.history) ? product.history : [];

    product.history = product.history.map(item => ({
      date: item.date || "",
      mercari: Number(item.mercari) || 0,
      snkrdunk: Number(item.snkrdunk) || 0,
      sommelier: Number(item.sommelier) || 0,
      homura: Number(item.homura) || 0,
      purchase: Number(item.purchase) || Math.max(Number(item.sommelier) || 0, Number(item.homura) || 0)
    }));

    sortHistoryByDate(product.history);
    products[name] = product;
  }
}

function parseFlexibleDate(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return null;

  const parts = dateStr.split("/");

  // YYYY/MM/DD format
  if (parts.length === 3) {
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);

    if (!year || !month || !day) return null;

    return new Date(year, month - 1, day);
  }

  // MM/DD format (fallback)
  if (parts.length === 2) {
    const month = Number(parts[0]);
    const day = Number(parts[1]);

    if (!month || !day) return null;

    const year = new Date().getFullYear();
    return new Date(year, month - 1, day);
  }

  return null;
}

function getDaysBetween(startStr, endStr) {
  const startDate = parseFlexibleDate(startStr);
  const endDate = parseFlexibleDate(endStr);

  if (!startDate || !endDate) return 0;

  const diffMs = endDate - startDate;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : 0;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeForSingleQuote(str) {
  return String(str)
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'");
}

function getQuantityInputId(name) {
  return "editQuantityInput_" + encodeURIComponent(name);
}


function getSafeRemainingQuantity(product) {
  const quantity = Number(product.quantity) || 0;
  const soldQuantity = Number(product.soldQuantity) || 0;
  return Math.max(0, quantity - soldQuantity);
}

function refreshAllUI() {
  refreshProductSelect();
  renderChart();
  renderTable();
  renderRanking();
  calculateTotalAsset();
}

function refreshProductSelect() {
  const select = document.getElementById("productSelect");
  select.innerHTML = "";

  for (const name in products) {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  }

  if (currentProduct && products[currentProduct]) {
    select.value = currentProduct;
  }
  const sellSelect = document.getElementById("sellProductSelect");

  if (sellSelect) {
    sellSelect.innerHTML = select.innerHTML;
  }

  const chartSelect = document.getElementById("chartProductSelect");

  if (chartSelect) {
    chartSelect.innerHTML = select.innerHTML;

    if (!currentChartProduct) {
      currentChartProduct = select.value || null;
    }

    if (currentChartProduct && products[currentChartProduct]) {
      chartSelect.value = currentChartProduct;
    }
  }
}

function changeProduct() {
  const selectedProduct = document.getElementById("productSelect").value;

  if (!selectedProduct || !products[selectedProduct]) {
    return;
  }

  currentProduct = selectedProduct;
  saveProducts();
}


function addProduct() {

  const name = document.getElementById("productName").value;
  const buyPrice = Number(document.getElementById("productBuyPrice").value);
  const quantity = Number(document.getElementById("quantity").value);

  if (!name || !buyPrice || !quantity) {
    alert("商品名・仕入価格・個数を入力してください");
    return;
  }
    if (!Number.isInteger(quantity) || quantity <= 0) {
    alert("個数は1以上の整数で入力してください");
    return;
  }

  if (products[name]) {

    const oldQty = products[name].quantity;
    const oldPrice = products[name].buyPrice;

    const newTotalCost =
      (oldPrice * oldQty) +
      (buyPrice * quantity);

    const newQty =
      oldQty + quantity;

    const avgPrice =
      Math.round(newTotalCost / newQty);

    products[name].quantity =
      newQty;

    products[name].buyPrice =
      avgPrice;

  } else {
products[name] = {
  buyPrice: buyPrice,
  quantity: quantity,
  soldQuantity: 0,
  realizedProfit: 0,
  history: []
};

  }

  currentProduct = name;
  currentChartProduct = name;

  saveProducts();
  refreshAllUI();

  document.getElementById("productName").value = "";
  document.getElementById("productBuyPrice").value = "";
  document.getElementById("quantity").value = "";

}



function addData() {
  const selectedProduct = document.getElementById("productSelect").value;

  if (!selectedProduct || !products[selectedProduct]) {
    alert("商品を選択してください");
    return;
  }

  currentProduct = selectedProduct;

  const date = document.getElementById("date").value;
  const mercari = Number(document.getElementById("mercari").value);
  const snkrdunk = Number(document.getElementById("snkrdunk").value);
 const sommelier = Number(document.getElementById("sommelier").value);
const homura = Number(document.getElementById("homura").value);
const purchase = Math.max(sommelier, homura);

  if (!date || !mercari || !snkrdunk || !sommelier || !homura) {
    alert("日付と価格を全部入れてください");
    return;
  }

  const history = products[currentProduct].history

const existingIndex =
  history.findIndex(item => item.date === date);

if (existingIndex !== -1) {
  history[existingIndex] = {
    date,
    mercari,
    snkrdunk,
    sommelier,
    homura,
    purchase
  };
} else {
  history.push({
    date,
    mercari,
    snkrdunk,
    sommelier,
    homura,
    purchase
  });
}

sortHistoryByDate(history);
products[currentProduct].lastUpdated = date;
saveProducts();
refreshAllUI();
localStorage.removeItem("draftData");

alert(currentProduct + " に記録しました");
}

function renderChart() {
  let chartProduct = currentChartProduct;

  if (!chartProduct || !products[chartProduct]) {
    if (currentProduct && products[currentProduct]) {
      chartProduct = currentProduct;
      currentChartProduct = currentProduct;
    } else {
      const names = Object.keys(products);
      if (names.length > 0) {
        chartProduct = names[0];
        currentChartProduct = names[0];
      }
    }
  }

  if (!chartProduct || !products[chartProduct]) {
    if (chart) {
      chart.destroy();
      chart = null;
    }

    document.getElementById("summaryText").textContent = "商品情報：未選択";
    document.getElementById("marketChangeText").textContent = "市場変化：未計算";
    document.getElementById("entryPositionText").textContent = "参入ポジション：未計算";
    document.getElementById("holdingPeriodText").textContent = "保有日数：未計算";
    return;
  }

  const history = products[chartProduct].history;
  const buyPrice = products[chartProduct].buyPrice;
  const labels = history.map(d => d.date);

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: "仕入価格",
        data: history.map(() => buyPrice)
      },
      {
        label: "メルカリ価格",
        data: history.map(d => d.mercari)
      },
      {
        label: "スニダン価格",
        data: history.map(d => d.snkrdunk)
      },
      {
        label: "買取価格",
        data: history.map(d => d.purchase)
      }
    ]
  };

  if (!history || history.length === 0) {
    if (chart) {
      chart.destroy();
      chart = null;
    }

    document.getElementById("summaryText").textContent = "商品情報：" + chartProduct + "（価格履歴なし）";
    document.getElementById("marketChangeText").textContent = "市場変化：未計算";
    document.getElementById("entryPositionText").textContent = "参入ポジション：未計算";
    document.getElementById("holdingPeriodText").textContent = "保有日数：未計算";
    return;
  }

  const firstDate = history.length > 0 ? history[0].date : "未登録";
  const last = history.length > 0 ? history[history.length - 1] : null;

  let bestMarket = "未登録";
  let bestPrice = 0;
  let profit = 0;

  if (last) {
    const mercariNet = Math.round((last.mercari || 0) * 0.9);
    const snkrdunkNet = Math.round((last.snkrdunk || 0) * 0.9);

    bestPrice = Math.max(
      mercariNet,
      snkrdunkNet,
      last.sommelier || 0,
      last.homura || 0
    );

    if (bestPrice === mercariNet) bestMarket = "メルカリ";
    if (bestPrice === snkrdunkNet) bestMarket = "スニダン";
    if (bestPrice === last.sommelier) bestMarket = "ソムリエ";
    if (bestPrice === last.homura) bestMarket = "ホムラ";
    profit = bestPrice - buyPrice;
  }

    const profitRate = buyPrice > 0 ? Math.round((profit / buyPrice) * 100) : 0;

  document.getElementById("summaryText").textContent =
    "参入日：" + firstDate +
    " / 仕入れ価格：" + buyPrice +
    " / 現在の最高販路：" + bestMarket +
    " / 現在の最大利益：" + profit + "（" + profitRate + "%）";

  let holdingDays = 0;
  let profitPerDay = 0;

  if (history.length > 0) {
    holdingDays = getDaysBetween(history[0].date, last.date);

    if (holdingDays > 0) {
      profitPerDay = Math.round(profit / holdingDays);
    }
  }

document.getElementById("holdingPeriodText").textContent =
  "保有日数：" + holdingDays +
  "日 / 1日あたり利益：" + profitPerDay;
  if (history.length > 0) {
    const first = history[0];

    const mercariDiff = last.mercari - first.mercari;
    const snkrdunkDiff = last.snkrdunk - first.snkrdunk;
    const purchaseDiff = last.purchase - first.purchase;

    document.getElementById("marketChangeText").textContent =
      "参入日メルカリ：" + first.mercari +
      " → 現在：" + last.mercari +
      "（" + mercariDiff + "） / " +
      "参入日スニダン：" + first.snkrdunk +
      " → 現在：" + last.snkrdunk +
      "（" + snkrdunkDiff + "） / " +
      "参入日買取：" + first.purchase +
      " → 現在：" + last.purchase +
      "（" + purchaseDiff + "）";

    const entryMercariDiff = buyPrice - first.mercari;
    const entrySnkrdunkDiff = buyPrice - first.snkrdunk;
    const entryPurchaseDiff = buyPrice - first.purchase;

    document.getElementById("entryPositionText").textContent =
      "参入時メルカリとの差：" + entryMercariDiff +
      " / 参入時スニダンとの差：" + entrySnkrdunkDiff +
      " / 参入時買取との差：" + entryPurchaseDiff;
  } else {
    document.getElementById("marketChangeText").textContent = "市場変化：未計算";
    document.getElementById("entryPositionText").textContent = "参入ポジション：未計算";
  }

  if (chart) {
    chart.destroy();
  }

 chart = new Chart(document.getElementById("chart"), {
  type: "line",
  data: chartData,
  options: {
    plugins: {
      legend: {
        display: true
      }
    },
    scales: {
      y: {
        beginAtZero: false
      }
    }
  },
  plugins: [{
    id: "profitZoneBackground",
    beforeDraw(chart) {

      const {
        ctx,
        chartArea: { top, bottom, left, right },
        scales: { y }
      } = chart;

      const entryY = y.getPixelForValue(buyPrice);

      ctx.save();

      // 利益ゾーン（上）
      ctx.fillStyle = "rgba(0,255,0,0.08)";
      ctx.fillRect(left, top, right - left, entryY - top);

      // 損ゾーン（下）
      ctx.fillStyle = "rgba(255,0,0,0.08)";
      ctx.fillRect(left, entryY, right - left, bottom - entryY);

      ctx.restore();
    }
  }]
});
}



  function renderTable() {
  const table = document.getElementById("productTable");

  table.innerHTML = "";

  if (Object.keys(products).length === 0) {
  document.getElementById("rankingProfitText").textContent = "利益額ランキング：未計算";
  document.getElementById("rankingRateText").textContent = "利益率ランキング：未計算";
  document.getElementById("rankingSpeedText").textContent = "1日あたり利益ランキング：未計算";
  return;
}

 const rows = [];

for (const name in products) {
  const product = products[name];

  if (product.history.length === 0) continue;

  const last = product.history[product.history.length - 1];

  const buy = product.buyPrice;
  const mercari = last.mercari;
  const snkrdunk = last.snkrdunk;
  const purchase = last.purchase;

  const sommelier = last.sommelier;
  const homura = last.homura;

  const mercariNet = Math.round(mercari * 0.9);
  const snkrdunkNet = Math.round(snkrdunk * 0.9);

  const bestPrice = Math.max(
    mercariNet,
    snkrdunkNet,
    sommelier,
    homura
  );

  let bestMarket = "";

  if (bestPrice === mercariNet) bestMarket = "メルカリ";
  if (bestPrice === snkrdunkNet) bestMarket = "スニダン";
  if (bestPrice === sommelier) bestMarket = "ソムリエ";
  if (bestPrice === homura) bestMarket = "ホムラ";

  const profit = bestPrice - buy;
  const profitRate = buy > 0 ? Math.round((profit / buy) * 100) : 0;

  const soldQuantity = Number(product.soldQuantity) || 0;
  const remainingQuantity = getSafeRemainingQuantity(product);

  rows.push({
  name,
  buy,
  mercariNet,
  snkrdunkNet,
  purchase,
  bestMarket,
  profit,
  profitRate,
  quantity: product.quantity,
  soldQuantity,
  remainingQuantity,
  lastUpdated: product.lastUpdated || "-"
});
}

rows.sort((a, b) => b.profit - a.profit);

for (const item of rows) {
  const row = document.createElement("tr");
  const isEditing = editingQuantityProduct === item.name;
  const safeName = escapeHtml(item.name);
  const safeJsName = escapeForSingleQuote(item.name);
  const inputId = getQuantityInputId(item.name);

  row.innerHTML = `
  <td>${safeName}</td>
  <td>${item.buy}</td>
  <td>${item.mercariNet}</td>
  <td>${item.snkrdunkNet}</td>
  <td>${item.purchase}</td>
  <td>${item.bestMarket}</td>
  <td style="color:${item.profit >= 0 ? 'green' : 'red'}">${item.profit}</td>
  <td>${item.profitRate}%</td>
  <td>${isEditing ? `<input id="${inputId}" type="number" min="0" step="1" value="${item.quantity}" style="width:80px;">` : item.quantity}</td>
  <td>${item.soldQuantity}</td>
  <td>${item.remainingQuantity}</td>
  <td>${item.lastUpdated || "-"}</td>
  <td>
    ${isEditing
      ? `<button onclick="saveEditedProductQuantity('${safeJsName}')">保存</button> <button onclick="cancelEditProductQuantity()">キャンセル</button>`
      : `<button onclick="startEditProductQuantity('${safeJsName}')">数量訂正</button> <button onclick="deleteProduct('${safeJsName}')">削除</button>`}
  </td>
`;

  table.appendChild(row);
}

renderRanking();
}

function exportCSV() {
  let csv = "商品名,日付,メルカリ,スニダン,買取\n";

  for (const name in products) {
    const history = products[name].history;

    for (const item of history) {
      csv +=
        name + "," +
        item.date + "," +
        item.mercari + "," +
        item.snkrdunk + "," +
        item.purchase + "\n";
    }
  }

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "price-history.csv";
  a.click();

  URL.revokeObjectURL(url);
  }


function deleteProduct(name) {
  delete products[name];

  if (editingQuantityProduct === name) {
    editingQuantityProduct = null;
  }

  const names = Object.keys(products);

  if (currentProduct === name) {
    currentProduct = names.length ? names[0] : "";
  }
  if (currentChartProduct === name) {
    currentChartProduct = names.length ? names[0] : "";
  }

  saveProducts();
  refreshAllUI();
}

function startEditProductQuantity(name) {
  if (!products[name]) {
    alert("商品が見つかりません");
    return;
  }

  editingQuantityProduct = name;
  renderTable();

  const input = document.getElementById(getQuantityInputId(name));
  if (input) {
    input.focus();
    input.select();
  }
}

function cancelEditProductQuantity() {
  editingQuantityProduct = null;
  renderTable();
}

function saveEditedProductQuantity(name) {
  const product = products[name];

  if (!product) {
    alert("商品が見つかりません");
    return;
  }

  const input = document.getElementById(getQuantityInputId(name));
  if (!input) {
    alert("数量入力欄が見つかりません");
    return;
  }

  const soldQuantity = Number(product.soldQuantity) || 0;
  const newQuantity = Number(input.value);

  if (!Number.isInteger(newQuantity) || newQuantity < 0) {
    alert("0以上の整数で入力してください");
    return;
  }

  if (newQuantity < soldQuantity) {
    alert("売却済み個数より少なくはできません");
    return;
  }

  product.quantity = newQuantity;
  editingQuantityProduct = null;

  saveProducts();
  refreshAllUI();
}


function renderRanking() {
  const items = [];

  for (const name in products) {
    const product = products[name];

    if (!product.history || product.history.length === 0) continue;

    const last = product.history[product.history.length - 1];
    const buy = product.buyPrice;

   const mercariNet = last.mercari * 0.9;
const snkrdunkNet = last.snkrdunk * 0.9;

const bestPrice = Math.max(
  mercariNet,
  snkrdunkNet,
  last.sommelier,
  last.homura
);

    const profit = bestPrice - buy;
    const profitRate = buy > 0 ? Math.round((profit / buy) * 100) : 0;

    const firstDate = product.history[0].date;
    const lastDate = last.date;
    const holdingDays = getDaysBetween(firstDate, lastDate);
    let profitPerDay = 0;

    if (holdingDays > 0) {
      profitPerDay = Math.round(profit / holdingDays);
    }

    items.push({
      name,
      profit,
      profitRate,
      profitPerDay
    });
  }

  if (items.length === 0) {
    document.getElementById("rankingProfitText").textContent = "利益額ランキング：未計算";
    document.getElementById("rankingRateText").textContent = "利益率ランキング：未計算";
    document.getElementById("rankingSpeedText").textContent = "1日あたり利益ランキング：未計算";
    return;
  }

  const byProfit = [...items].sort((a, b) => b.profit - a.profit);
  const byRate = [...items].sort((a, b) => b.profitRate - a.profitRate);
  const bySpeed = [...items].sort((a, b) => b.profitPerDay - a.profitPerDay);

  function formatRanking(list, label, unit = "") {
    let text = label + "：";

    for (let i = 0; i < Math.min(3, list.length); i++) {
      const item = list[i];

      let value;
      if (unit === "%") {
        value = item.profitRate;
      } else if (unit === "speed") {
        value = item.profitPerDay;
      } else {
        value = item.profit;
      }

      text +=
        (i + 1) +
        "位 " +
        item.name +
        "（<span style='color:" +
        (value >= 0 ? "green" : "red") +
        "'>" +
        value +
        (unit === "%" ? "%" : "") +
        "</span>） ";
    }

    return text;
  }

  document.getElementById("rankingProfitText").innerHTML =
    formatRanking(byProfit, "利益額ランキング");

  document.getElementById("rankingRateText").innerHTML =
    formatRanking(byRate, "利益率ランキング", "%");

  document.getElementById("rankingSpeedText").innerHTML =
    formatRanking(bySpeed, "1日あたり利益ランキング", "speed");
}

function openMercari() {
  const productName = document.getElementById("productSelect").value;
  if (!productName) {
    alert("商品を選択してください");
    return;
  }
  window.open(
    "https://www.mercari.com/jp/search/?keyword=" + encodeURIComponent(productName),
    "_blank"
  );
}
function openSnkrdunk() {
  const productName = document.getElementById("productSelect").value;
  if (!productName) {
    alert("商品を選択してください");
    return;
  }
  window.open(
    "https://snkrdunk.com/search?keyword=" + encodeURIComponent(productName),
    "_blank"
  );
}
function openSommelier() {
  window.open("https://somurie-kaitori.com/", "_blank");
}
function openHomura() {
  window.open("https://kaitori-homura.com/", "_blank");
}

async function fetchMercariPrice(productName) {
  return null;
}

async function fetchSnkrdunkPrice(productName) {
  return null;
}

async function fetchSommelierPrice(productName) {
  return null;
}

async function fetchHomuraPrice(productName) {
  return null;
}

function calculateTotalAsset() {
  let totalValue = 0;
  let totalCost = 0;
let totalRealizedProfit = 0;
  for (const name in products) {
    const product = products[name];
totalRealizedProfit += product.realizedProfit || 0;

    if (!product.history || product.history.length === 0) continue;

    const last = product.history[product.history.length - 1];

    const mercariNet = Math.round((last.mercari || 0) * 0.9);
    const snkrdunkNet = Math.round((last.snkrdunk || 0) * 0.9);

    const bestPrice = Math.max(
      mercariNet,
      snkrdunkNet,
      last.sommelier || 0,
      last.homura || 0
    );
  const remainingQuantity = getSafeRemainingQuantity(product);
totalValue += bestPrice * remainingQuantity;
totalCost += product.buyPrice * remainingQuantity;
  }

  const totalProfit = totalValue - totalCost;

  document.getElementById("totalAsset").textContent =
    "ポケカ資産総額：" + totalValue.toLocaleString() + "円";

  document.getElementById("totalCost").textContent =
    "投資額合計：" + totalCost.toLocaleString() + "円";

  document.getElementById("totalProfit").textContent =
    "含み益合計：" + totalProfit.toLocaleString() + "円";

  document.getElementById("realizedProfit").textContent =
    "確定益合計：" + totalRealizedProfit.toLocaleString() + "円";
}
function exportJSON() {
  const dataStr = JSON.stringify(products, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "products_backup.json";
  a.click();
}

function importJSON() {
  document.getElementById("jsonFileInput").click();
}

document.getElementById("jsonFileInput").addEventListener("change", function (event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (e) {
    try {
      const importedData = JSON.parse(e.target.result);

      products = importedData;
      normalizeProductsData();
      const names = Object.keys(products);
      currentProduct = names.length ? names[0] : "";
      currentChartProduct = names.length ? names[0] : "";

      saveProducts();
      refreshAllUI();

      alert("復元成功！");
    } catch (error) {
      alert("JSON読込に失敗しました");
      console.error(error);
    }
  };

  reader.readAsText(file);
});
function saveDraft() {

  const draft = {

    date: document.getElementById("date").value,
    mercari: document.getElementById("mercari").value,
    snkrdunk: document.getElementById("snkrdunk").value,
    sommelier: document.getElementById("sommelier").value,
    homura: document.getElementById("homura").value

  };

  localStorage.setItem("draftData", JSON.stringify(draft));
}



function loadDraft() {

  const draft = JSON.parse(localStorage.getItem("draftData"));

  if (!draft) return;

  document.getElementById("date").value = draft.date || "";
  document.getElementById("mercari").value = draft.mercari || "";
  document.getElementById("snkrdunk").value = draft.snkrdunk || "";
  document.getElementById("sommelier").value = draft.sommelier || "";
  document.getElementById("homura").value = draft.homura || "";

}

window.addEventListener("load", function () {
  loadProducts();
  loadDraft();

  refreshAllUI();

  document.getElementById("date").addEventListener("input", saveDraft);
  document.getElementById("mercari").addEventListener("input", saveDraft);
  document.getElementById("snkrdunk").addEventListener("input", saveDraft);
  document.getElementById("sommelier").addEventListener("input", saveDraft);
  document.getElementById("homura").addEventListener("input", saveDraft);
});

function recordSale() {
 const selectedProduct =
  document.getElementById("sellProductSelect").value;

if (!selectedProduct || !products[selectedProduct]) {
  alert("商品を選択してください");
  return;
}

  const sellQuantity = Number(document.getElementById("sellQuantity").value);
  const sellPrice = Number(document.getElementById("sellPrice").value);

  if (!Number.isInteger(sellQuantity) || sellQuantity <= 0 || !sellPrice) {
    alert("売却個数は1以上の整数、売却単価を入力してください");
    return;
  }

 const product = products[selectedProduct];
  const remaining = getSafeRemainingQuantity(product);

  if (sellQuantity > remaining) {
    alert("残数を超えています");
    return;
  }

  if (remaining <= 0) {
    alert("この商品はもう残っていません");
    return;
  }

  const profitPerItem = sellPrice - product.buyPrice;
  const realizedProfit = profitPerItem * sellQuantity;

  product.soldQuantity = (product.soldQuantity || 0) + sellQuantity;
  product.realizedProfit = (product.realizedProfit || 0) + realizedProfit;

  saveProducts();
  refreshAllUI();

  document.getElementById("sellQuantity").value = "";
  document.getElementById("sellPrice").value = "";
 }
 function changeChartProduct() {
  const chartProduct = document.getElementById("chartProductSelect").value;

  currentChartProduct = chartProduct;

  saveProducts();
  refreshAllUI();
}
