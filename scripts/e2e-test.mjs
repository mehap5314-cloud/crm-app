/* eslint-disable no-console */
// End-to-end test of the CRM backend on http://localhost:3000
const BASE = process.env.BASE_URL || 'http://localhost:3000'

let cookies = {}

function setCookies(res) {
  res.headers.getSetCookie?.().forEach((c) => {
    const [pair] = c.split(';')
    const eq = pair.indexOf('=')
    cookies[pair.slice(0, eq)] = pair.slice(eq + 1)
  })
}

function cookieHeader() {
  return Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ')
}

async function getCsrf() {
  const res = await fetch(`${BASE}/api/auth/csrf`, { method: 'GET', redirect: 'manual' })
  setCookies(res)
  return res.json()
}

async function login(username, password) {
  const { csrfToken } = await getCsrf()
  const body = new URLSearchParams({ csrfToken, username, password, json: 'true' })
  const res = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Cookie: cookieHeader() },
    body,
    redirect: 'manual',
  })
  setCookies(res)
  return res.status
}

async function api(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Cookie: cookieHeader(), ...(opts.headers || {}) },
  })
  setCookies(res)
  let json = null
  try { json = await res.json() } catch {}
  return { status: res.status, data: json }
}

let passed = 0
let failed = 0
function check(name, cond, extra = '') {
  if (cond) { passed++; console.log(`  ✅ ${name}`) }
  else { failed++; console.log(`  ❌ ${name} ${extra}`) }
}

async function main() {
  console.log('=== CRM End-to-End Test ===')

  // 1. login wrong password
  const bad = await login('admin', 'wrongpass')
  check('login rejects wrong password (401)', bad === 401, `got ${bad}`)

  // 2. login admin
  const ok = await login('admin', 'admin123')
  check('admin login', ok === 200 || ok === 302, `got ${ok}`)

  const session = await api('/api/auth/session')
  check('session has role admin', session.data?.user?.role === 'admin', JSON.stringify(session.data))

  // 3. create issue
  const created = await api('/api/sheets', {
    method: 'POST',
    body: JSON.stringify({
      'Customer Name': 'Test Customer',
      'Contact Number': '01000000000',
      Branch: 'City 1',
      'Complaints Destination': 'On Call',
      'Mobile Type': '15 pro max',
      'Sold By': 'Hassan A.Mohamed',
      Description: 'بحس علي اني مشكوتددي في استخدلخدم الاكلكترون',
      Status: 'Pending',
      'Issue code': 'Technical Issue',
      'Refund Reason': 'عيب صناعة',
      'Start Call': '2026-10-30',
    }),
  })
  created.data?.id && console.log(`  ℹ️ created id=${created.data.id} ticket=${created.data.ticket}`)
  check('create issue', created.status === 200 && created.data?.success, JSON.stringify(created.data))

  // 4. list issues
  const list = await api('/api/sheets?page=1&pageSize=10')
  const items = list.data?.issues || []
  const found = items.find((i) => i.id === created.data?.id)
  check('list contains created issue', !!found)
  check('created_by recorded', found?.['created_by'] === 'Administrator' || found?.created_by === 'Administrator', `created_by=${found?.created_by}`)
  check('ticket auto-generated', !!found?.Ticket, `Ticket=${found?.Ticket}`)

  // 5. duplicate lookup by phone
  const dup = await api('/api/sheets?searchBy=01000000000')
  check('searchBy finds duplicate', (dup.data?.issues || []).length === 1)

  // 6. update issue -> updated_by + history
  const upd = await api(`/api/sheets/${created.data.id}`, {
    method: 'PUT',
    body: JSON.stringify({ Status: 'Closed', 'Issue code': 'Broken' }),
  })
  check('update issue', upd.data?.success === true && upd.data?.changes === 2, JSON.stringify(upd.data))

  const detail = await api(`/api/sheets/${created.data.id}`)
  check('updated_by recorded', detail.data?.updated_by === 'Administrator', `updated_by=${detail.data?.updated_by}`)
  check('status updated', detail.data?.Status === 'Closed')
  check('refund reason saved', detail.data?.['Refund Reason'] === 'عيب صناعة', `got '${detail.data?.['Refund Reason']}'`)

  const hist = await api(`/api/activity?issueId=${created.data.id}`)
  const events = hist.data || []
  check('history has Created+Updated', events.length >= 2 && events.some((e) => e.Action === 'Created issue') && events.some((e) => e.Action === 'Updated issue'), `n=${events.length}`)
  const updEntry = events.find((e) => e.Action === 'Updated issue')
  check('history records field changes', Array.isArray(updEntry?.Changes) && updEntry.Changes.length === 2, JSON.stringify(updEntry?.Changes?.[0]))

  // 7. stats
  const stats = await api('/api/sheets/stats')
  check('stats endpoint', typeof stats.data?.total === 'number' && stats.data.closed >= 1, JSON.stringify(stats.data))

  // 8. second employee flow (users API)
  const usersList = await api('/api/users')
  check('users list (admin)', usersList.status === 200 && usersList.data?.users?.length >= 1, JSON.stringify(usersList.data))

  const createdUser = await api('/api/users', {
    method: 'POST',
    body: JSON.stringify({ username: 'karema', name: 'Karema Test', password: 'pass1234', role: 'agent', branch: 'Almaza' }),
  })
  check('create user', createdUser.data?.success, JSON.stringify(createdUser.data))

  // login as new user
  Object.keys(cookies).forEach((k) => delete cookies[k])
  const kLogin = await login('karema', 'pass1234')
  check('new user login', kLogin === 200 || kLogin === 302, `got ${kLogin}`)
  const kSession = await api('/api/auth/session')
  check('new user role agent', kSession.data?.user?.role === 'agent', JSON.stringify(kSession.data))

  // agent can create but not delete
  const kCreate = await api('/api/sheets', {
    method: 'POST',
    body: JSON.stringify({ 'Customer Name': 'By Karema', 'Contact Number': '01111111111', Branch: 'Almaza', Status: 'Pending' }),
  })
  check('agent can create issue', kCreate.data?.success, JSON.stringify(kCreate.data))

  const kDelete = await api(`/api/sheets/${kCreate.data.id}`, { method: 'DELETE' })
  check('agent cannot delete (403)', kDelete.status === 403, `got ${kDelete.status}`)

  // agent cannot access users API
  check('agent cannot list users', (await api('/api/users')).status === 403)

  // karema updates an issue -> updated_by becomes Karema Test
  const kUpd = await api(`/api/sheets/${created.data.id}`, {
    method: 'PUT',
    body: JSON.stringify({ 'Final Conclusion': 'يتم حل广义 مشكلة و شكره' }),
  })
  check('agent can update issue', kUpd.data?.success, JSON.stringify(kUpd.data))
  const detail2 = await api(`/api/sheets/${created.data.id}`)
  check('updated_by = Karema Test', detail2.data?.updated_by === 'Karema Test', `got '${detail2.data?.updated_by}'`)

  // back to admin
  Object.keys(cookies).forEach((k) => delete cookies[k])
  await login('admin', 'admin123')

  // 9. trash flow (admin)
  const del = await api(`/api/sheets/${kCreate.data.id}`, { method: 'DELETE' })
  check('admin soft delete', del.data?.success, JSON.stringify(del.data))
  const trashList = await api('/api/trash')
  check('trash lists deleted', (trashList.data?.issues || []).some((i) => i.id === kCreate.data.id))
  const restored = await api(`/api/trash/${kCreate.data.id}`, { method: 'POST' })
  check('restore', restored.data?.success, JSON.stringify(restored.data))

  // 10. columns in old sheet format test: uploads CSV through import API (preview + commit)
  const csv = [
    'Start Call,2nd Call,Closing Date,Branch,Complaints Destination,Mobile Type,Sold By,Customer Name,Contact Nounber,Description,Final Conclusion,Status,Handled by,Issue code,Expotion,Amount Refund,Follow up,Note,Ticket',
    '30/10,,30/10,CFC,Social Media,S26 u,Hassan A.Mohamed,Naglaa ezzat,1090057470,لوسيت معطت تيتم والكحول المنتسرف في لو كتيليكترون,,Closed,Mayada,General Info,,,,"تعليق الأانيكا و كسير",CS-1001',
    '30/10,,,,Almaza,15 pro max,Eslam A. Salama,mohamed hesham,1007357500,يحس علي الأركوق,Pending,A.Omar,Broken,,,,',
  ].join('\n')

  // preview
  const fd1 = new FormData()
  fd1.append('file', new Blob([csv], { type: 'text/csv' }), 'old-complaints.csv')
  fd1.append('mode', 'preview')
  const previewRes = await fetch(`${BASE}/api/import`, {
    method: 'POST',
    headers: { Cookie: cookieHeader() },
    body: fd1,
  })
  const preview = await previewRes.json()
  check('import preview', previewRes.status === 200 && preview.totalRows === 2, JSON.stringify(preview).slice(0, 300))
  check('import maps header typo Contact Nounber', preview.mapping?.[Object.keys(preview.mapping).find((k) => preview.headerRow?.[k]?.match(/Nounber/i))] === 'Contact Number', JSON.stringify(preview.mapping))
  check('import maps Expotion -> Exception', Object.values(preview.mapping).includes('Exception'))
  check('import sample date normalized', preview.sample?.[0]?.['Start Call'] === '2026-10-30', JSON.stringify(preview.sample?.[0]?.['Start Call']))

  // commit
  const fd2 = new FormData()
  fd2.append('file', new Blob([csv], { type: 'text/csv' }), 'old-complaints.csv')
  fd2.append('mode', 'commit')
  fd2.append('skipDuplicates', 'true')
  const commitRes = await fetch(`${BASE}/api/import`, {
    method: 'POST',
    headers: { Cookie: cookieHeader() },
    body: fd2,
  })
  const commitData = await commitRes.json()
  check('import commit', commitData.success && commitData.inserted === 2 && commitData.skipped === 0, JSON.stringify(commitData))

  // re-commit same file -> all skipped (dup tickets)
  const fd3 = new FormData()
  fd3.append('file', new Blob([csv], { type: 'text/csv' }), 'old-complaints.csv')
  fd3.append('mode', 'commit')
  fd3.append('skipDuplicates', 'true')
  const dupRes = await fetch(`${BASE}/api/import`, {
    method: 'POST',
    headers: { Cookie: cookieHeader() },
    body: fd3,
  })
  const dupData = await dupRes.json()
  check('re-import skips duplicates', dupData.inserted === 0, JSON.stringify(dupData))

  // list should contain imported rows with source=import
  const importedList = await api('/api/sheets?search=Naglaa')
  const importedRow = (importedList.data?.issues || [])[0]
  check('imported row searchable', importedRow?.['Customer Name'] === 'Naglaa ezzat')
  check('imported row Status column aligned', importedRow?.Status === 'Closed', `Status='${importedRow?.Status}'`)
  check('imported row Handled by aligned', importedRow?.['Handled by'] === 'Mayada', `Handled='${importedRow?.['Handled by']}'`)
  check('imported row source=import', importedRow?.source === 'import', `source=${importedRow?.source}`)
  check('imported row keeps ticket from sheet', importedRow?.Ticket === 'CS-1001', `Ticket='${importedRow?.Ticket}'`)
  check('imported row has created_by', importedRow?.created_by === 'Administrator')

  // followups + performance endpoints don't crash
  check('followups ok', (await api('/api/sheets/followups')).status === 200)
  check('performance ok', (await api('/api/sheets/performance')).status === 200)

  // bulk generate 5000 rows via CSV to test performance
  const big = ['Start Call,Branch,Customer Name,Contact Number,Description,Status,Handled by,Issue code,Ticket']
  for (let i = 0; i < 5000; i++) {
    big.push(`2025/06/${String((i % 28) + 1).padStart(2, '0')},City ${1 + (i % 4)},Perf Test ${i},0150000${1000000 + i},row description ${i},Pending,Mayada,Broken,P-${600000 + i}`)
  }
  const t0 = Date.now()
  const fd4 = new FormData()
  fd4.append('file', new Blob([big.join('\n')], { type: 'text/csv' }), 'big.csv')
  fd4.append('mode', 'preview')
  await fetch(`${BASE}/api/import`, { method: 'POST', headers: { Cookie: cookieHeader() }, body: fd4 })
  const t4 = new FormData()
  t4.append('file', new Blob([big.join('\n')], { type: 'text/csv' }), 'big.csv')
  t4.append('mode', 'commit')
  t4.append('skipDuplicates', 'true')
  const bigRes = await fetch(`${BASE}/api/import`, { method: 'POST', headers: { Cookie: cookieHeader() }, body: t4 })
  const bigData = await bigRes.json()
  const dt = Date.now() - t0
  check('import 5000 rows ok', bigData.inserted === 5000, JSON.stringify(bigData))
  check(`import 5000 rows fast (${dt}ms)`, dt < 30000, `${dt}ms`)

  const t1 = Date.now()
  const perfList = await api('/api/sheets?page=1&pageSize=50')
  const listMs = Date.now() - t1
  check(`list query fast (${listMs}ms), total=${perfList.data?.total}`, listMs < 2000 && perfList.data?.total > 5000, `${listMs}ms total=${perfList.data?.total}`)

  const t2 = Date.now()
  await api('/api/sheets/stats')
  check('stats fast', Date.now() - t2 < 1000)

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`)
  process.exit(failed ? 1 : 0)
}

main().catch((e) => {
  console.error('Test crashed:', e)
  process.exit(1)
})
