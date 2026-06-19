'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import { ArrowLeft, Edit, Trash2, AlertCircle, HeadphonesIcon, Image as ImageIcon, Clock } from 'lucide-react'

function ImageDisplay({ issue }) {
  const note = issue['Note'] || ''
  const imgMatch = note.match(/__IMAGES__:\s*(\[.*?\])/)
  if (!imgMatch) return null
  const urls = JSON.parse(imgMatch[1])
  if (urls.length === 0) return null

  return (
    <div className="mt-6 rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
      <div className="p-5" style={{ background: 'var(--bg-card)' }}>
        <div className="flex items-center gap-2 mb-3">
          <ImageIcon size={16} style={{ color: 'var(--accent)' }} />
          <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>Attachments</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {urls.map((url, i) => (
            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="group">
              <img src={url} alt="" className="w-32 h-32 object-cover rounded-xl border transition-all duration-200 group-hover:scale-[1.03]"
                style={{ borderColor: 'var(--border-color)' }} />
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

const LABEL_MAP = {
  'Start Call': 'Start Call', '2nd Call': '2nd Call', 'Closing Date': 'Closing Date',
  'Branch': 'Branch', 'Complaints Destination': 'Complaints Destination',
  'Mobile Type': 'Mobile Type', 'Sold By': 'Sold By', 'Customer Name': 'Customer Name',
  'Contact Number': 'Contact Number', 'Description': 'Description',
  'Final Conclusion': 'Final Conclusion', 'Status': 'Status', 'Handled by': 'Handled By',
  'Issue code': 'Issue Code', 'Exception': 'Exception', 'Amount Refund': 'Amount Refund',
  'Ticket': 'Ticket',
  'Follow up': 'Follow Up', 'Note': 'Note',
}

export default function IssueDetail() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [issue, setIssue] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activity, setActivity] = useState([])
  const [exceptionEnd, setExceptionEnd] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/')
    if (status !== 'authenticated') return
    fetch(`/api/sheets/${params.id}`).then(r => r.json()).then(d => { setIssue(d); setLoading(false)
      const note = d['Note'] || ''
      const m = note.match(/__EX_END__:(\S+)/)
      if (m) setExceptionEnd(m[1])
    }).catch(() => setLoading(false))
    fetch(`/api/activity?issueId=${params.id}`).then(r => r.json()).then(d => setActivity(Array.isArray(d) ? d : [])).catch(() => {})
  }, [status, params.id, router])

  if (status === 'loading' || status === 'unauthenticated') return null

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="min-h-screen" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.03) 0%, transparent 60%)' }}>
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button onClick={() => router.push('/dashboard')}
            className="btn-ghost flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium mb-6">
            <ArrowLeft size={16} />
            Back to all issues
          </button>

          {loading ? (
            <div className="flex justify-center py-24">
              <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</span>
              </div>
            </div>
          ) : !issue ? (
            <div className="flex items-center gap-3 px-5 py-4 rounded-xl" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <AlertCircle size={18} className="text-amber-400 shrink-0" />
              <span className="text-sm text-amber-300">Issue not found</span>
            </div>
          ) : (
            <div className="animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20">
                    <HeadphonesIcon size={24} className="text-amber-400" />
                  </div>
                  <div>
                    <h1 className="text-xl font-heading font-bold tracking-tight" style={{color: 'var(--text-primary)'}}>{issue['Customer Name'] || 'Unknown'}</h1>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Issue #{issue.id} &middot; {issue['Issue code'] || 'No code'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => router.push(`/dashboard/${issue.id}/edit`)}
                    className="glass flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                    style={{ color: 'var(--text-secondary)' }}>
                    <Edit size={15} /> Edit
                  </button>
                  {session?.user?.isAdmin && (
                    <button onClick={async () => { if (confirm('Delete this issue?')) { await fetch(`/api/sheets/${issue.id}`, { method: 'DELETE' }); router.push('/dashboard') } }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                      style={{ color: '#f87171', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                      <Trash2 size={15} /> Delete
                    </button>
                  )}
                </div>
              </div>

              <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
                <div className="grid grid-cols-1 md:grid-cols-2" style={{ background: 'var(--border-color)' }}>
                  {Object.entries(LABEL_MAP).map(([key, label]) => (
                    <div key={key} className="p-5" style={{ background: 'var(--bg-card)' }}>
                      <div className="text-xs font-semibold tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>{label}</div>
                      <div className="text-sm" style={{color: 'var(--text-primary)'}}>
                        {key === 'Exception' && exceptionEnd ? (
                          <span>{issue[key] || 'Yes'} <span className="text-xs mr-1" style={{color: 'var(--text-muted)'}}>(until {exceptionEnd})</span></span>
                        ) : (
                          issue[key] || <span style={{ color: 'var(--text-muted)' }}>-</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <ImageDisplay issue={issue} />

              {activity.length > 0 && (
                <div className="mt-8 rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="p-5" style={{ background: 'var(--bg-card)' }}>
                    <div className="flex items-center gap-2 mb-5">
                      <Clock size={16} style={{ color: 'var(--accent)' }} />
                      <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>Activity Log</span>
                    </div>
                    <div className="space-y-0">
                      {activity.map((entry, i) => (
                        <div key={i} className="flex gap-4 py-3 border-t first:border-t-0" style={{ borderColor: 'var(--border-color)' }}>
                          <div className="shrink-0 flex flex-col items-center gap-1">
                            <div className="w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{entry.Action}</p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                              {entry.User} &middot; {entry.Timestamp ? new Date(entry.Timestamp).toLocaleString('en-GB', { timeZone: 'Asia/Riyadh' }) : ''}
                            </p>
                            {entry.Details && <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{entry.Details}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
