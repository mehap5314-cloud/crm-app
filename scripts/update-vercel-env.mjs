import { readFileSync } from 'fs'
import { env } from 'process'

const token = env.VERCEL_TOKEN
if (!token) {
  console.log('No VERCEL_TOKEN env var found. Trying other methods...')
  
  // Check .env.vercel for OIDC token
  try {
    const vercelEnv = readFileSync('.env.vercel', 'utf8')
    const oidcMatch = vercelEnv.match(/VERCEL_OIDC_TOKEN="([^"]+)/)
    if (oidcMatch) {
      console.log('OIDC token found, but this is for deployments only, not API calls.')
    }
  } catch {}
  
  console.log('\nPlease add moataz.ramadan@hammer-protection.com to ALLOWED_EMAILS in Vercel dashboard:')
  console.log('1. Go to https://vercel.com/mehap5314-1236s-projects/crm-app/settings/environment-variables')
  console.log('2. Find ALLOWED_EMAILS and add ,moataz.ramadan@hammer-protection.com to the end')
  console.log('3. Click Save')
  console.log('4. Redeploy or wait for auto-deploy')
  process.exit(0)
}

const projectId = 'prj_0pReOCHzPGlirtuc0pCLkNo7pI11'
const teamId = 'team_Ukh8Sw6kquyi0uLMIgkNu68'

// Get current env vars
const res = await fetch(`https://api.vercel.com/v1/projects/${projectId}/env?teamId=${teamId}`, {
  headers: { Authorization: `Bearer ${token}` }
})
const data = await res.json()
console.log('Current env vars:', JSON.stringify(data, null, 2))
