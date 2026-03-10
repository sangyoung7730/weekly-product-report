const fs = require('fs');
const data = require('./data.json');

const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>주차별 생활재 공급수량 & 매출 조회</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Malgun Gothic', '맑은 고딕', sans-serif; background: #f0f2f5; color: #333; }
.header { background: linear-gradient(135deg, #1a73e8, #0d47a1); color: white; padding: 20px 30px; }
.header h1 { font-size: 22px; font-weight: 600; }
.header p { font-size: 13px; opacity: 0.85; margin-top: 4px; }
.controls { background: #fff; padding: 16px 30px; border-bottom: 1px solid #ddd; display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
.controls label { font-size: 13px; font-weight: 600; color: #555; }
.controls select, .controls input { padding: 8px 12px; border: 1px solid #ccc; border-radius: 6px; font-size: 13px; font-family: inherit; }
.controls input[type="text"] { width: 260px; }
.controls select { min-width: 100px; }
.btn { padding: 8px 20px; background: #1a73e8; color: white; border: none; border-radius: 6px; font-size: 13px; cursor: pointer; font-family: inherit; }
.btn:hover { background: #1557b0; }
.btn-export { background: #0f9d58; }
.btn-export:hover { background: #0b7a45; }
.summary { padding: 12px 30px; background: #e8f0fe; font-size: 13px; color: #1a73e8; border-bottom: 1px solid #c5d9f5; }
.table-wrap { padding: 16px; overflow-x: auto; }
table { border-collapse: collapse; width: 100%; font-size: 12px; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
thead th { background: #f8f9fa; color: #333; font-weight: 600; padding: 10px 8px; border-bottom: 2px solid #ddd; position: sticky; top: 0; z-index: 10; white-space: nowrap; }
thead th.week-col { min-width: 75px; }
tbody td { padding: 8px; border-bottom: 1px solid #eee; text-align: right; white-space: nowrap; }
tbody td.code-col { text-align: center; }
tbody td.name-col { text-align: left; font-weight: 500; min-width: 200px; position: sticky; left: 0; background: white; z-index: 5; }
tbody tr:hover td { background: #e8f0fe; }
tbody tr:hover td.name-col { background: #e8f0fe; }
td.total-col { font-weight: 700; background: #fffde7 !important; }
th.total-col { background: #fff9c4 !important; }
.zero { color: #bbb; }
.negative { color: #d32f2f; }
.tabs { display: flex; gap: 2px; margin-left: auto; }
.tab { padding: 8px 18px; border: 1px solid #ccc; background: #f5f5f5; cursor: pointer; font-size: 13px; border-radius: 6px 6px 0 0; font-family: inherit; }
.tab.active { background: #1a73e8; color: white; border-color: #1a73e8; }
.chart-area { padding: 20px 30px; background: white; margin: 16px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); display: none; }
.chart-area.visible { display: block; }
canvas { max-height: 350px; }
.pagination { padding: 12px 30px; display: flex; gap: 8px; align-items: center; justify-content: center; font-size: 13px; }
.pagination button { padding: 6px 14px; border: 1px solid #ccc; background: white; border-radius: 4px; cursor: pointer; font-family: inherit; }
.pagination button:hover { background: #e8f0fe; }
.pagination button.active { background: #1a73e8; color: white; border-color: #1a73e8; }
.pagination button:disabled { opacity: 0.4; cursor: default; }
.week-range-wrap { display: flex; align-items: center; gap: 6px; }
.year-btn { padding: 8px 18px; border: 2px solid #1a73e8; background: white; color: #1a73e8; cursor: pointer; font-size: 13px; font-weight: 600; font-family: inherit; border-radius: 6px; transition: all 0.2s; }
.year-btn.active { background: #1a73e8; color: white; }
.year-btn:hover { background: #e8f0fe; }
.year-btn.active:hover { background: #1557b0; }
.year-btns { display: flex; gap: 4px; }
.compare-row { background: #f3e5f5 !important; }
.compare-row td { border-bottom: 2px solid #ce93d8; font-style: italic; }
.compare-row td.name-col { background: #f3e5f5 !important; }
.compare-header { background: #f3e5f5 !important; color: #7b1fa2 !important; }
.yoy-up { color: #0f9d58; font-weight: 600; }
.yoy-down { color: #d32f2f; font-weight: 600; }
.yoy-same { color: #999; }
</style>
</head>
<body>
<div class="header">
  <h1>주차별 생활재 공급수량 & 매출 조회</h1>
  <p id="headerInfo">축수산팀 | 1주 ~ 52주</p>
</div>
<div class="controls">
  <label>연도</label>
  <div class="year-btns">
    <button class="year-btn active" onclick="setYear('2025',this)">2025</button>
    <button class="year-btn" onclick="setYear('2024',this)">2024</button>
    <button class="year-btn" onclick="setYear('compare',this)">연도 비교</button>
  </div>
  <label>품목 검색</label>
  <input type="text" id="search" placeholder="품목명 또는 코드 입력..." oninput="applyFilter()">
  <label>보기</label>
  <select id="viewMode" onchange="applyFilter()">
    <option value="qty">공급수량</option>
    <option value="sales">매출</option>
    <option value="both">수량 + 매출</option>
  </select>
  <div class="week-range-wrap">
    <label>주차</label>
    <select id="weekFrom" onchange="applyFilter()"></select>
    <span>~</span>
    <select id="weekTo" onchange="applyFilter()"></select>
  </div>
  <label>정렬</label>
  <select id="sortBy" onchange="applyFilter()">
    <option value="code">코드순</option>
    <option value="name">이름순</option>
    <option value="qtyTotal">수량합계 높은순</option>
    <option value="salesTotal">매출합계 높은순</option>
  </select>
  <button class="btn btn-export" onclick="exportCSV()">CSV 다운로드</button>
  <div class="tabs">
    <button class="tab active" onclick="setView('table',this)">표</button>
    <button class="tab" onclick="setView('chart',this)">차트</button>
  </div>
</div>
<div class="summary" id="summary"></div>
<div class="chart-area" id="chartArea">
  <canvas id="chart"></canvas>
</div>
<div class="table-wrap" id="tableArea">
  <table>
    <thead id="thead"></thead>
    <tbody id="tbody"></tbody>
  </table>
</div>
<div class="pagination" id="pagination"></div>

<script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
<script>
const ALL_DATA = ${JSON.stringify(data)};
let currentYear = '2025';
let filtered = [];
let currentView = 'table';
const PAGE_SIZE = 50;
let currentPage = 1;

function getCurrentData() {
  if (currentYear === 'compare') return ALL_DATA['2025'];
  return ALL_DATA[currentYear] || [];
}

// Build a lookup map for compare mode
function buildLookup(year) {
  const map = {};
  (ALL_DATA[year] || []).forEach(item => {
    map[item.code + '|' + item.name] = item;
  });
  return map;
}

// init week selectors
const wf = document.getElementById('weekFrom');
const wt = document.getElementById('weekTo');
for (let i = 1; i <= 52; i++) {
  wf.innerHTML += '<option value="'+(i-1)+'"' + (i===1?' selected':'') + '>'+i+'주</option>';
  wt.innerHTML += '<option value="'+(i-1)+'"' + (i===52?' selected':'') + '>'+i+'주</option>';
}

function setYear(year, btn) {
  currentYear = year;
  document.querySelectorAll('.year-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  applyFilter();
}

function applyFilter() {
  const q = document.getElementById('search').value.trim().toLowerCase();
  const sort = document.getElementById('sortBy').value;
  const srcData = getCurrentData();

  filtered = srcData.filter(item => {
    if (!q) return true;
    return item.name.toLowerCase().includes(q) || String(item.code).includes(q);
  });

  filtered.sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name, 'ko');
    if (sort === 'qtyTotal') return b.qtyTotal - a.qtyTotal;
    if (sort === 'salesTotal') return b.salesTotal - a.salesTotal;
    return a.code - b.code;
  });

  // Update header
  const yearLabel = currentYear === 'compare' ? '2024 vs 2025 비교' : currentYear + '년';
  document.getElementById('headerInfo').textContent =
    '축수산팀 | ' + yearLabel + ' | 총 ' + filtered.length + '개 품목 | 1주 ~ 52주';

  currentPage = 1;
  render();
}

function fmt(v) {
  return v.toLocaleString();
}

function cls(v) {
  return v === 0 ? 'zero' : v < 0 ? 'negative' : '';
}

function render() {
  const mode = document.getElementById('viewMode').value;
  const wFrom = parseInt(document.getElementById('weekFrom').value);
  const wTo = parseInt(document.getElementById('weekTo').value);
  const weeks = [];
  for (let i = wFrom; i <= wTo; i++) weeks.push(i);

  // summary
  let totalQty = 0, totalSales = 0;
  filtered.forEach(item => {
    weeks.forEach(w => { totalQty += item.qty[w]; totalSales += item.sales[w]; });
  });
  const yearLabel = currentYear === 'compare' ? '2025년 기준' : currentYear + '년';
  document.getElementById('summary').innerHTML =
    yearLabel + ' 조회 결과: <b>' + filtered.length + '</b>개 품목 | ' +
    '선택 기간 수량합계: <b>' + fmt(totalQty) + '</b> | ' +
    '선택 기간 매출합계: <b>' + fmt(totalSales) + '</b>원';

  if (currentView === 'chart') {
    renderChart(weeks, mode);
    return;
  }

  if (currentYear === 'compare') {
    renderCompare(weeks, mode);
    return;
  }

  // header
  let th = '';
  if (mode === 'both') {
    th = '<tr><th rowspan="2">코드</th><th rowspan="2">품목명</th>';
    weeks.forEach(w => { th += '<th colspan="2" class="week-col">' + (w+1) + '주</th>'; });
    th += '<th rowspan="2" class="total-col">수량합계</th><th rowspan="2" class="total-col">매출합계</th></tr><tr>';
    weeks.forEach(() => { th += '<th>수량</th><th>매출</th>'; });
    th += '</tr>';
  } else {
    th = '<tr><th>코드</th><th>품목명</th>';
    weeks.forEach(w => { th += '<th class="week-col">' + (w+1) + '주</th>'; });
    th += '<th class="total-col">합계</th></tr>';
  }
  document.getElementById('thead').innerHTML = th;

  // pagination
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageData = filtered.slice(start, start + PAGE_SIZE);

  // body
  let tb = '';
  pageData.forEach(item => {
    tb += '<tr><td class="code-col">' + item.code + '</td><td class="name-col">' + item.name + '</td>';
    let rq = 0, rs = 0;
    weeks.forEach(w => {
      if (mode === 'qty') { const v = item.qty[w]; rq += v; tb += '<td class="' + cls(v) + '">' + fmt(v) + '</td>'; }
      else if (mode === 'sales') { const v = item.sales[w]; rs += v; tb += '<td class="' + cls(v) + '">' + fmt(v) + '</td>'; }
      else {
        const q = item.qty[w], s = item.sales[w]; rq += q; rs += s;
        tb += '<td class="' + cls(q) + '">' + fmt(q) + '</td><td class="' + cls(s) + '">' + fmt(s) + '</td>';
      }
    });
    if (mode === 'both') tb += '<td class="total-col">' + fmt(rq) + '</td><td class="total-col">' + fmt(rs) + '</td>';
    else tb += '<td class="total-col">' + fmt(mode === 'qty' ? rq : rs) + '</td>';
    tb += '</tr>';
  });
  document.getElementById('tbody').innerHTML = tb;
  renderPagination(totalPages);
}

function renderCompare(weeks, mode) {
  const lookup24 = buildLookup('2024');

  // header
  let th = '';
  if (mode === 'both') {
    th = '<tr><th rowspan="2">코드</th><th rowspan="2">품목명</th>';
    weeks.forEach(w => { th += '<th colspan="2" class="week-col">' + (w+1) + '주</th>'; });
    th += '<th rowspan="2" class="total-col">수량합계</th><th rowspan="2" class="total-col">매출합계</th></tr><tr>';
    weeks.forEach(() => { th += '<th>수량</th><th>매출</th>'; });
    th += '</tr>';
  } else {
    th = '<tr><th>코드</th><th>품목명</th>';
    weeks.forEach(w => { th += '<th class="week-col">' + (w+1) + '주</th>'; });
    th += '<th class="total-col">합계</th></tr>';
  }
  document.getElementById('thead').innerHTML = th;

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageData = filtered.slice(start, start + PAGE_SIZE);

  let tb = '';
  pageData.forEach(item => {
    const key = item.code + '|' + item.name;
    const prev = lookup24[key];
    const emptyItem = { qty: new Array(52).fill(0), sales: new Array(52).fill(0), qtyTotal: 0, salesTotal: 0 };
    const p = prev || emptyItem;

    // 2025 row
    tb += '<tr><td class="code-col">' + item.code + '</td><td class="name-col">' + item.name + ' <span style="color:#1a73e8;font-size:11px">[25]</span></td>';
    let rq = 0, rs = 0;
    weeks.forEach(w => {
      if (mode === 'qty') { const v = item.qty[w]; rq += v; tb += '<td class="' + cls(v) + '">' + fmt(v) + '</td>'; }
      else if (mode === 'sales') { const v = item.sales[w]; rs += v; tb += '<td class="' + cls(v) + '">' + fmt(v) + '</td>'; }
      else {
        const q = item.qty[w], s = item.sales[w]; rq += q; rs += s;
        tb += '<td class="' + cls(q) + '">' + fmt(q) + '</td><td class="' + cls(s) + '">' + fmt(s) + '</td>';
      }
    });
    if (mode === 'both') tb += '<td class="total-col">' + fmt(rq) + '</td><td class="total-col">' + fmt(rs) + '</td>';
    else tb += '<td class="total-col">' + fmt(mode === 'qty' ? rq : rs) + '</td>';
    tb += '</tr>';

    // 2024 row
    tb += '<tr class="compare-row"><td class="code-col"></td><td class="name-col">' + (prev ? '' : '(24년 없음) ') + '<span style="color:#7b1fa2;font-size:11px">[24]</span></td>';
    let prq = 0, prs = 0;
    weeks.forEach(w => {
      if (mode === 'qty') { const v = p.qty[w]; prq += v; tb += '<td class="' + cls(v) + '">' + fmt(v) + '</td>'; }
      else if (mode === 'sales') { const v = p.sales[w]; prs += v; tb += '<td class="' + cls(v) + '">' + fmt(v) + '</td>'; }
      else {
        const q = p.qty[w], s = p.sales[w]; prq += q; prs += s;
        tb += '<td class="' + cls(q) + '">' + fmt(q) + '</td><td class="' + cls(s) + '">' + fmt(s) + '</td>';
      }
    });
    if (mode === 'both') tb += '<td class="total-col">' + fmt(prq) + '</td><td class="total-col">' + fmt(prs) + '</td>';
    else tb += '<td class="total-col">' + fmt(mode === 'qty' ? prq : prs) + '</td>';
    tb += '</tr>';

    // YoY diff row
    tb += '<tr style="background:#e8f5e9;border-bottom:3px solid #ccc"><td class="code-col"></td><td class="name-col" style="background:#e8f5e9"><span style="font-size:11px;color:#555">증감</span></td>';
    weeks.forEach(w => {
      if (mode === 'qty') {
        const d = item.qty[w] - p.qty[w];
        tb += '<td class="' + (d > 0 ? 'yoy-up' : d < 0 ? 'yoy-down' : 'yoy-same') + '">' + (d > 0 ? '+' : '') + fmt(d) + '</td>';
      } else if (mode === 'sales') {
        const d = item.sales[w] - p.sales[w];
        tb += '<td class="' + (d > 0 ? 'yoy-up' : d < 0 ? 'yoy-down' : 'yoy-same') + '">' + (d > 0 ? '+' : '') + fmt(d) + '</td>';
      } else {
        const dq = item.qty[w] - p.qty[w], ds = item.sales[w] - p.sales[w];
        tb += '<td class="' + (dq > 0 ? 'yoy-up' : dq < 0 ? 'yoy-down' : 'yoy-same') + '">' + (dq > 0 ? '+' : '') + fmt(dq) + '</td>';
        tb += '<td class="' + (ds > 0 ? 'yoy-up' : ds < 0 ? 'yoy-down' : 'yoy-same') + '">' + (ds > 0 ? '+' : '') + fmt(ds) + '</td>';
      }
    });
    // total diff
    const tqd = rq - prq, tsd = rs - prs;
    if (mode === 'both') {
      tb += '<td class="total-col ' + (tqd > 0 ? 'yoy-up' : tqd < 0 ? 'yoy-down' : 'yoy-same') + '">' + (tqd > 0 ? '+' : '') + fmt(tqd) + '</td>';
      tb += '<td class="total-col ' + (tsd > 0 ? 'yoy-up' : tsd < 0 ? 'yoy-down' : 'yoy-same') + '">' + (tsd > 0 ? '+' : '') + fmt(tsd) + '</td>';
    } else {
      const td = mode === 'qty' ? tqd : tsd;
      tb += '<td class="total-col ' + (td > 0 ? 'yoy-up' : td < 0 ? 'yoy-down' : 'yoy-same') + '">' + (td > 0 ? '+' : '') + fmt(td) + '</td>';
    }
    tb += '</tr>';
  });

  document.getElementById('tbody').innerHTML = tb;
  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  let pg = '';
  if (totalPages > 1) {
    pg += '<button ' + (currentPage===1?'disabled':'') + ' onclick="goPage(' + (currentPage-1) + ')">이전</button>';
    const startP = Math.max(1, currentPage - 4);
    const endP = Math.min(totalPages, startP + 9);
    for (let p = startP; p <= endP; p++) {
      pg += '<button class="' + (p===currentPage?'active':'') + '" onclick="goPage('+p+')">' + p + '</button>';
    }
    pg += '<button ' + (currentPage===totalPages?'disabled':'') + ' onclick="goPage(' + (currentPage+1) + ')">다음</button>';
    pg += '<span style="margin-left:12px">' + currentPage + ' / ' + totalPages + ' 페이지 (총 ' + filtered.length + '건)</span>';
  }
  document.getElementById('pagination').innerHTML = pg;
}

function goPage(p) { currentPage = p; render(); }

let chartInstance = null;
function renderChart(weeks, mode) {
  document.getElementById('chartArea').classList.add('visible');
  document.getElementById('tableArea').style.display = 'none';
  document.getElementById('pagination').style.display = 'none';

  const labels = weeks.map(w => (w+1) + '주');
  const colors = ['#1a73e8','#e8710a','#0f9d58','#d32f2f','#9c27b0'];

  let datasets = [];

  if (currentYear === 'compare') {
    // Compare mode chart: show top 3 items, each with 24/25 lines
    const lookup24 = buildLookup('2024');
    const top3 = filtered.slice(0, 3);
    const emptyItem = { qty: new Array(52).fill(0), sales: new Array(52).fill(0) };

    top3.forEach((item, idx) => {
      const key = item.code + '|' + item.name;
      const prev = lookup24[key] || emptyItem;
      const c = colors[idx];
      datasets.push({
        label: item.name + ' (25)',
        data: weeks.map(w => mode === 'sales' ? item.sales[w] : item.qty[w]),
        borderColor: c,
        backgroundColor: c + '20',
        tension: 0.3, pointRadius: 2, borderWidth: 2,
      });
      datasets.push({
        label: item.name + ' (24)',
        data: weeks.map(w => mode === 'sales' ? prev.sales[w] : prev.qty[w]),
        borderColor: c,
        backgroundColor: c + '10',
        borderDash: [5, 5],
        tension: 0.3, pointRadius: 2, borderWidth: 1.5,
      });
    });
  } else {
    const top5 = filtered.slice(0, 5);
    datasets = top5.map((item, idx) => ({
      label: item.name,
      data: weeks.map(w => mode === 'sales' ? item.sales[w] : item.qty[w]),
      borderColor: colors[idx],
      backgroundColor: colors[idx] + '20',
      tension: 0.3, pointRadius: 2,
    }));
  }

  if (chartInstance) chartInstance.destroy();
  const titleText = currentYear === 'compare'
    ? '상위 3개 품목 24/25 비교 (' + (mode==='sales'?'매출':'수량') + ')'
    : '상위 5개 품목 주차별 추이 (' + (mode==='sales'?'매출':'수량') + ')';

  chartInstance = new Chart(document.getElementById('chart'), {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: titleText },
        tooltip: { callbacks: { label: ctx => ctx.dataset.label + ': ' + ctx.parsed.y.toLocaleString() } }
      },
      scales: {
        y: { ticks: { callback: v => v.toLocaleString() } }
      }
    }
  });
}

function setView(v, btn) {
  currentView = v;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  if (v === 'table') {
    document.getElementById('chartArea').classList.remove('visible');
    document.getElementById('tableArea').style.display = '';
    document.getElementById('pagination').style.display = '';
  }
  render();
}

function exportCSV() {
  const mode = document.getElementById('viewMode').value;
  const wFrom = parseInt(document.getElementById('weekFrom').value);
  const wTo = parseInt(document.getElementById('weekTo').value);
  const weeks = [];
  for (let i = wFrom; i <= wTo; i++) weeks.push(i);
  const yearLabel = currentYear === 'compare' ? '비교' : currentYear;

  let csv = '\\uFEFF';
  let header = '코드,품목명';
  if (currentYear === 'compare') header += ',연도';
  weeks.forEach(w => {
    if (mode === 'both') { header += ',' + (w+1) + '주_수량,' + (w+1) + '주_매출'; }
    else { header += ',' + (w+1) + '주'; }
  });
  if (mode === 'both') header += ',수량합계,매출합계';
  else header += ',합계';
  csv += header + '\\n';

  if (currentYear === 'compare') {
    const lookup24 = buildLookup('2024');
    const emptyItem = { qty: new Array(52).fill(0), sales: new Array(52).fill(0) };
    filtered.forEach(item => {
      const key = item.code + '|' + item.name;
      const prev = lookup24[key] || emptyItem;
      [{ d: item, y: '2025' }, { d: prev, y: '2024' }].forEach(({ d, y }) => {
        let row = item.code + ',"' + item.name + '",' + y;
        let qs = 0, ss = 0;
        weeks.forEach(w => {
          if (mode === 'qty') { row += ',' + d.qty[w]; qs += d.qty[w]; }
          else if (mode === 'sales') { row += ',' + d.sales[w]; ss += d.sales[w]; }
          else { row += ',' + d.qty[w] + ',' + d.sales[w]; qs += d.qty[w]; ss += d.sales[w]; }
        });
        if (mode === 'both') row += ',' + qs + ',' + ss;
        else if (mode === 'qty') row += ',' + qs;
        else row += ',' + ss;
        csv += row + '\\n';
      });
    });
  } else {
    filtered.forEach(item => {
      let row = item.code + ',"' + item.name + '"';
      let qs = 0, ss = 0;
      weeks.forEach(w => {
        if (mode === 'qty') { row += ',' + item.qty[w]; qs += item.qty[w]; }
        else if (mode === 'sales') { row += ',' + item.sales[w]; ss += item.sales[w]; }
        else { row += ',' + item.qty[w] + ',' + item.sales[w]; qs += item.qty[w]; ss += item.sales[w]; }
      });
      if (mode === 'both') row += ',' + qs + ',' + ss;
      else if (mode === 'qty') row += ',' + qs;
      else row += ',' + ss;
      csv += row + '\\n';
    });
  }

  const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = yearLabel + '년_주차별_' + (mode==='qty'?'수량':mode==='sales'?'매출':'수량매출') + '.csv';
  a.click();
}

applyFilter();
</script>
</body>
</html>`;

fs.writeFileSync('index.html', html);
console.log('Done! index.html created');
