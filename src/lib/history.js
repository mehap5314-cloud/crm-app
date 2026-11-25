import { getDb } from '@/lib/db'

export function getIssueHistory(issueId) {
  const rows = getDb().prepare(
    'SELECT * FROM issue_history WHERE issue_id = ? ORDER BY id ASC'
  ).all(Number(issueId))
  return rows.map((r) => {
    let changes = []
    try { changes = r.changes ? JSON.parse(r.changes) : [] } catch { changes = [] }
    return {
      id: r.id,
      issue_id: r.issue_id,
      Timestamp: r.created_at,
      User: r.user_name || 'System',
      Action: r.action,
      Details: r.details || '',
      Changes: changes,
    }
  })
}

export function logHistory({ issueId, issueTicket = '', user, action, changes = [], details = '' }) {
  try {
    getDb().prepare(
      `INSERT INTO issue_history (issue_id, issue_ticket, user_id, user_name, action, changes, details, created_at)
       VALUES (?,?,?,?,?,?,?,?)`
    ).run(
      Number(issueId),
      issueTicket,
      user?.id ?? null,
      user?.name || user?.username || 'System',
      action,
      JSON.stringify(changes || []),
      details || '',
      new Date().toISOString()
    )
  } catch (err) {
    console.error('logHistory failed:', err.message)
  }
}
