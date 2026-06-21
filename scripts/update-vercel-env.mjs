import { readFileSync } from 'fs'

// Read OIDC token from .env.vercel
const vercelEnv = readFileSync('.env.vercel', 'utf8')
const oidcMatch = vercelEnv.match(/VERCEL_OIDC_TOKEN="([^"]+)/)
const oidcToken = oidcMatch ? oidcMatch[1] : null

const projectId = 'prj_0pReOCHzPGlirtuc0pCLkNo7pI11'
const teamId = 'team_Ukh8Sw6kquyi0uLMIgkNu68'

async function callApi(path, opts = {}) {
  const url = `https://api.vercel.com${path}${path.includes('?') ? '&' : '?'}teamId=${teamId}`
  const res = await fetch(url, {
    ...opts,
    headers: {
      ...(oidcToken ? { Authorization: `Bearer ${oidcToken}` } : {}),
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  })
  const text = await res.text()
  let data
  try { data = JSON.parse(text) } catch { data = text }
  return { status: res.status, data }
}

// Try to get existing env vars
const result = await callApi(`/v10/projects/${projectId}/env`)
console.log('Status:', result.status)
console.log('Response:', JSON.stringify(result.data, null, 2).slice(0, 2000))

if (result.status === 200) {
  // Find ALLOWED_EMAILS
  const envs = result.data.envs || []
  const target = envs.find(e => e.key === 'ALLOWED_EMAILS')
  if (target) {
    console.log('\nFound ALLOWED_EMAILS:', JSON.stringify(target, null, 2))
  }
}
