const XLSX = require('xlsx')
const big = ['Start Call,Branch,Customer Name,Contact Number,Description,Status,Handled by,Issue code,Ticket']
for (let i = 0; i < 5; i++) {
  big.push('2025/06/' + String((i % 28) + 1).padStart(2, '0') + ',City ' + (1 + (i % 4)) + ',Perf Test ' + i + ',0150000' + (1000000 + i) + ',row description ' + i + ',Pending,Mayada,Broken,P-' + (600000 + i))
}
const wb = XLSX.read(Buffer.from(big.join('\n')), { type: 'buffer', cellDates: true })
const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '', raw: false })
console.log('headers:', JSON.stringify(rows[0]))
console.log('row1:', JSON.stringify(rows[1]))
