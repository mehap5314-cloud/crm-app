/* Reproduce big-CSV import preview to debug dedupe */
const BASE = 'http://localhost:3000'
let cookies = {}
function setCookies(res) {
  res.headers.getSetCookie?.().forEach((c) => {
    const [pair] = c.split(';')
    const eq = pair.indexOf('=')
    cookies[pair.slice(0, eq)] = pair.slice(eq + 1)
  })
}
function cookieHeader() { return Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ') }

async function main() {
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`)
  setCookies(csrfRes)
  const { csrfToken } = await csrfRes.json()
  const loginRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Cookie: cookieHeader() },
    body: new URLSearchParams({ csrfToken, username: 'admin', password: 'admin123', json: 'true' }),
    redirect: 'manual',
  })
  setCookies(loginRes)

  const big = ['Start Call,Branch,Customer Name,Contact Number,Description,Status,Handled by,Issue code,Ticket']
  for (let i = 0; i < 60; i++) {
    big.push('2025/06/' + String((i % 28) + 1).padStart(2, '0') + ',City ' + (1 + (i % 4)) + ',Perf Test ' + i + ',0150000' + (1000000 + i) + ',row description ' + i + ',Pending,Mayada,Broken,P-' + (600000 + i))
  }
  const fd = new FormData()
  fd.append('file', new Blob([big.join('\n')], { type: 'text/csv' }), 'big.csv')
  fd.append('mode', 'preview')
  const res = await fetch(`${BASE}/api/import`, { method: 'POST', headers: { Cookie: cookieHeader() }, body: fd })
  const d = await res.json()
  console.log('totalRows:', d.totalRows, 'mapping:', JSON.stringify(d.mapping))
  console.log('sample[0]:', JSON.stringify(d.sample?.[0]))
  console.log('sample[1]:', JSON.stringify(d.sample?.[1]))
}
main().catch((e) => { console.error(e); process.exit(1) })
