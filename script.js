let chart;

let products = JSON.parse(localStorage.getItem("products")) || {};

let currentProduct = localStorage.getItem("currentProduct") || null;

function saveProducts() {
  localStorage.setItem("products", JSON.stringify(products));
  localStorage.setItem("currentProduct", currentProduct);
}

function loadProducts() {
  const savedProducts = localStorage.getItem("products");
  const savedCurrentProduct = localStorage.getItem("currentProduct");

  if (savedProducts) {
    products = JSON.parse(savedProducts);
  }

  if (savedCurrentProduct) {
    currentProduct = savedCurrentProduct;
  }
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
}

  if (currentProduct && products[currentProduct]) {
    select.value = currentProduct;
  }


function addProduct() {

  const name = document.getElementById("productName").value;
  const buyPrice = Number(document.getElementById("productBuyPrice").value);
  const quantity = Number(document.getElementById("quantity").value);

  if (!name || !buyPrice || !quantity) {
    alert("商品名・仕入価格・個数を入力してください");
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
      history: []
    };

  }

  currentProduct = name;

  refreshProductSelect();
  saveProducts();
  renderChart();
  renderRanking();
  calculateTotalAsset();

  document.getElementById("productName").value = "";
  document.getElementById("productBuyPrice").value = "";
  document.getElementById("quantity").value = "";

}



function addData() {
  if (!currentProduct) {
    alert("商品を選択してください");
    return;
  }

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
 saveProducts();
renderChart();
renderRanking();
calculateTotalAsset();
}

function renderChart() {
  if (!currentProduct || !products[currentProduct]) {
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

  const history = products[currentProduct].history;
  const buyPrice = products[currentProduct].buyPrice;
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

  const firstDate = history.length > 0 ? history[0].date : "未登録";
  const last = history.length > 0 ? history[history.length - 1] : null;

  let bestMarket = "未登録";
  let bestPrice = 0;
  let profit = 0;

  if (last) {
  bestPrice = Math.max(
  last.mercari,
  last.snkrdunk,
  last.sommelier,
  last.homura
);

if (bestPrice === last.mercari) bestMarket = "メルカリ";
if (bestPrice === last.snkrdunk) bestMarket = "スニダン";
if (bestPrice === last.sommelier) bestMarket = "ソムリエ";
if (bestPrice === last.homura) bestMarket = "ホムラ";
    profit = bestPrice - buyPrice;
  }

  const profitRate = Math.round((profit / buyPrice) * 100);

  document.getElementById("summaryText").textContent =
    "参入日：" + firstDate +
    " / 仕入れ価格：" + buyPrice +
    " / 現在の最高販路：" + bestMarket +
    " / 現在の最大利益：" + profit + "（" + profitRate + "%）";

    let holdingDays = 0;
let profitPerDay = 0;

if (history.length > 0) {
  holdingDays = history.length - 1;

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
  renderTable();
}

refreshProductSelect();
renderChart();

  function renderTable() {
  const table = document.getElementById("productTable");

  table.innerHTML = "";

  if (Object.keys(products).length === 0) {
  document.getElementById("rankingProfitText").textContent = "利益額ランキング：未計算";
  document.getElementById("rankingRateText").textContent = "利益率ランキング：未計算";
  document.getElementById("rankingSpeedText").textContent = "1日あたり利益ランキング：未計算";
  return;
}

  for (const name in products) {
    const product = products[name];

    if (product.history.length === 0) continue;

    const last = product.history[product.history.length - 1];

    const buy = product.buyPrice;
    const mercari = last.mercari;
    const snkrdunk = last.snkrdunk;
    const purchase = last.purchase;

    let bestMarket = "";

    const sommelier = last.sommelier;
const homura = last.homura;

const bestPrice = Math.max(mercari, snkrdunk, sommelier, homura);

if (bestPrice === mercari) bestMarket = "メルカリ";
if (bestPrice === snkrdunk) bestMarket = "スニダン";
if (bestPrice === sommelier) bestMarket = "ソムリエ";
if (bestPrice === homura) bestMarket = "ホムラ";

    const profit = bestPrice - buy;
    const profitRate = Math.round((profit / buy) * 100);

    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${name}</td>
      <td>${buy}</td>
      <td>${mercari}</td>
      <td>${snkrdunk}</td>
      <td>${purchase}</td>
      <td>${bestMarket}</td>
      <td style="color:${profit >= 0 ? 'green' : 'red'}">${profit}</td>
      <td>${profitRate}%</td>
      <td><button onclick="deleteProduct('${name}')">削除</button></td>
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

  if (currentProduct === name) {
    currentProduct = "";
  }

  saveProducts();
  refreshProductSelect();
  renderChart();
  renderRanking();
  calculateTotalAsset();
}

function renderRanking() {
  const items = [];

  for (const name in products) {
    const product = products[name];

    if (!product.history || product.history.length === 0) continue;

    const last = product.history[product.history.length - 1];
    const buy = product.buyPrice;

    const bestPrice = Math.max(
  last.mercari,
  last.snkrdunk,
  last.sommelier,
  last.homura
);

    const profit = bestPrice - buy;
    const profitRate = Math.round((profit / buy) * 100);

    const holdingDays = product.history.length - 1;
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

  

  // 選択中商品も解除
  if (currentProduct === name) {
    currentProduct = null;
  }

  // localStorage を完全に更新
  localStorage.setItem("products", JSON.stringify(products));
  localStorage.setItem("currentProduct", currentProduct || "");

  // 画面を更新
  refreshProductSelect();
  renderTable();
  renderChart();

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

  for (const name in products) {
    const product = products[name];

    if (!product.history.length) continue;

    const last = product.history[product.history.length - 1];

    const bestPrice = Math.max(
      last.mercari,
      last.snkrdunk,
      last.purchase
    );

    totalValue += bestPrice * product.quantity;
   totalCost += product.buyPrice * product.quantity;
  }

  const totalProfit = totalValue - totalCost;

  document.getElementById("totalAsset").textContent =
    "ポケカ資産総額：" + totalValue.toLocaleString() + "円";

  document.getElementById("totalCost").textContent =
    "投資額合計：" + totalCost.toLocaleString() + "円";

  document.getElementById("totalProfit").textContent =
    "含み益合計：" + totalProfit.toLocaleString() + "円";
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

      for (const name in importedData) {
        products[name] = importedData[name];
      }

      const names = Object.keys(products);
      currentProduct = names.length ? names[0] : "";

      saveProducts();
      refreshProductSelect();
      renderTable();
      renderChart();
      renderRanking();
      calculateTotalAsset();

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


window.addEventListener("load", loadDraft);
document.getElementById("date").addEventListener("input", saveDraft);
document.getElementById("mercari").addEventListener("input", saveDraft);
document.getElementById("snkrdunk").addEventListener("input", saveDraft);
document.getElementById("sommelier").addEventListener("input", saveDraft);
document.getElementById("homura").addEventListener("input", saveDraft);

loadProducts();
refreshProductSelect();
renderTable();
renderChart();
renderRanking();
calculateTotalAsset();