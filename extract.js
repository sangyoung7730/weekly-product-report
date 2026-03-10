const XLSX = require('xlsx');
const fs = require('fs');

function extractYear(qtyFile, salesFile, dataStartRow) {
  const wb1 = XLSX.readFile(qtyFile);
  const ws1 = wb1.Sheets[wb1.SheetNames[0]];
  const qty = XLSX.utils.sheet_to_json(ws1, { header: 1 });

  const wb2 = XLSX.readFile(salesFile);
  const ws2 = wb2.Sheets[wb2.SheetNames[0]];
  const sales = XLSX.utils.sheet_to_json(ws2, { header: 1 });

  const items = [];
  for (let i = dataStartRow; i < qty.length; i++) {
    const row = qty[i];
    if (!row || !row[1]) continue;
    const code = row[0];
    const name = row[1];
    const weeks = [];
    for (let w = 2; w <= 53; w++) {
      weeks.push(row[w] || 0);
    }
    const total = row[54] || 0;

    let salesWeeks = new Array(52).fill(0);
    let salesTotal = 0;
    for (let j = dataStartRow; j < sales.length; j++) {
      if (sales[j] && sales[j][0] === code && sales[j][1] === name) {
        for (let w = 2; w <= 53; w++) {
          salesWeeks[w - 2] = sales[j][w] || 0;
        }
        salesTotal = sales[j][54] || 0;
        break;
      }
    }

    items.push({ code, name, qty: weeks, qtyTotal: total, sales: salesWeeks, salesTotal });
  }
  return items;
}

const data2024 = extractYear(
  '24년도 주차별 생활재 공급수량.xlsx',
  '24년도 주차별 생활재 매출.xlsx',
  4 // 24년은 Row 4부터 데이터
);

const data2025 = extractYear(
  '25년도 주차별 생활재 공급수량.xlsx',
  '25년도 주차별 생활재 매출.xlsx',
  3 // 25년은 Row 3부터 데이터
);

const allData = { '2024': data2024, '2025': data2025 };
fs.writeFileSync('data.json', JSON.stringify(allData));
console.log('2024 items:', data2024.length);
console.log('2025 items:', data2025.length);
