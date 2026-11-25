'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import { useLang } from '@/lib/i18n'
import { ArrowLeft, Edit, Trash2, AlertCircle, HeadphonesIcon, Image as ImageIcon, Clock, UserPlus, UserCog } from 'lucide-react'

function ImageDisplay({ issue }) {
  const { t } = useLang()
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
          <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>{t('detail.attachments')}</span>
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
  'Start Call': 'form.startCall', '2nd Call': 'form.secondCall', 'Closing Date': 'form.closingDate',
  'Branch': 'form.branch', 'Complaints Destination': 'form.destination',
  'Mobile Type': 'form.mobileType', 'Sold By': 'form.soldBy', 'Customer Name': 'form.customerName',
  'Contact Number': 'form.contact', 'Description': 'form.description',
  'Final Conclusion': 'form.finalConclusion', 'Status': 'form.status', 'Handled by': 'form.handledBy',
  'Issue code': 'form.issueCode', 'Exception': 'form.exception', 'Amount Refund': 'form.amountRefund',
  'Refund Reason': 'form.refundReason',
  'Ticket': 'form.ticket',
  'Follow up': 'form.followUp', 'Note': 'form.note',
}

function actionLabel(action, t) {
  switch (action) {
    case 'Created issue': return t('detail.actCreated')
    case 'Updated issue': return t('detail.actUpdated')
    case 'Imported': return t('detail.actImported')
    case 'Moved to trash': return t('detail.actTrash')
    case 'Restored': return t('detail.actRestored')
    default: return action
  }
}

export default function IssueDetail() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLang()
  const params = useParams()
  const [issue, setIssue] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activity, setActivity] = useState([])
  const [exceptionEnd, setExceptionEnd] = useState('')
  const [refundReason, setRefundReason] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/')
    if (status !== 'authenticated') return
    fetch(`/api/sheets/${params.id}`).then(r => r.json()).then(d => { setIssue(d); setLoading(false)
      const note = d['Note'] || ''
      const m = note.match(/__EX_END__:(\S+)/)
      if (m) setExceptionEnd(m[1])
      const r = note.match(/__REF_REASON__:(.+?)(?=\s*__|$)/)
      if (r) setRefundReason(r[1].trim())
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
            {t('common.backToList')}
          </button>

          {loading ? (
            <div className="flex justify-center py-24">
              <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('common.loading')}</span>
              </div>
            </div>
          ) : !issue ? (
            <div className="flex items-center gap-3 px-5 py-4 rounded-xl" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <AlertCircle size={18} className="text-amber-400 shrink-0" />
              <span className="text-sm text-amber-300">{t('detail.notFound')}</span>
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
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('detail.issue', { id: issue.id })} &middot; {issue['Issue code'] || t('detail.noCode')}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => router.push(`/dashboard/${issue.id}/edit`)}
                    className="glass flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                    style={{ color: 'var(--text-secondary)' }}>
                    <Edit size={15} /> {t('common.edit')}
                  </button>
                  {(session?.user?.isAdmin || session?.user?.isManager) && (
                    <button onClick={async () => { if (confirm(t('table.confirmDelete'))) { await fetch(`/api/sheets/${issue.id}`, { method: 'DELETE' }); router.push('/dashboard') } }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                      style={{ color: '#f87171', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                      <Trash2 size={15} /> {t('common.delete')}
                    </button>
                  )}
                </div>
              </div>

              {/* Audit summary — who created / who last updated */}
              {(issue.created_by || issue.updated_by) && (
                <div className="flex flex-wrap items-center gap-2.5 mb-6">
                  {issue.created_by && (
                    <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg" style={{background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b'}}>
                      <UserPlus size={12} />
                      {t('detail.createdBy')} <b>{issue.created_by}</b>
                      {issue.created_at && <span style={{color: 'var(--text-muted)'}}>&middot; {new Date(issue.created_at).toLocaleDateString('en-GB')}</span>}
                    </span>
                  )}
                  {issue.updated_by && (
                    <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg" style={{background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8'}}>
                      <UserCog size={12} />
                      {t('detail.updatedBy')} <b>{issue.updated_by}</b>
                      {issue.updated_at && <span style={{color: 'var(--text-muted)'}}>&middot; {new Date(issue.updated_at).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}</span>}
                    </span>
                  )}
                  {issue.source === 'import' && (
                    <span className="text-xs px-3 py-1.5 rounded-lg" style={{background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-muted)'}}>
                      {t('detail.imported')}
                    </span>
                  )}
                </div>
              )}

              <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
                <div className="grid grid-cols-1 md:grid-cols-2" style={{ background: 'var(--border-color)' }}>
                  {Object.entries(LABEL_MAP).map(([key, labelKey]) => (
                    <div key={key} className="p-5 text-center" style={{ background: 'var(--bg-card)' }}>
                      <div className="text-xs font-semibold tracking-wider mb-1.5 text-center" style={{ color: 'var(--text-muted)' }}>{t(labelKey)}</div>
                      <div className="text-sm text-center" style={{color: 'var(--text-primary)'}}>
                        {key === 'Exception' && exceptionEnd ? (
                          <span>{issue[key] || 'Yes'} <span className="text-xs mr-1" style={{color: 'var(--text-muted)'}}>({t('detail.until')} {exceptionEnd})</span></span>
                        ) : key === 'Amount Refund' && issue[key] && refundReason ? (
                          <span>{issue[key]} <span className="text-xs mr-1" style={{color: 'var(--text-muted)'}}>({refundReason})</span></span>
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
                      <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>{t('detail.activity')}</span>
                    </div>
                    <div className="space-y-0">
                      {activity.map((entry, i) => (
                        <div key={i} className="flex gap-4 py-3 border-t first:border-t-0" style={{ borderColor: 'var(--border-color)' }}>
                          <div className="shrink-0 flex flex-col items-center gap-1">
                            <div className="w-2 h-2 rounded-full" style={{ background: entry.Action === 'Updated issue' ? '#818cf8' : 'var(--accent)' }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{actionLabel(entry.Action, t)}</p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                              {entry.User} &middot; {entry.Timestamp ? new Date(entry.Timestamp).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' }) : ''}
                            </p>
                            {entry.Details && !entry.Changes?.length && <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{entry.Details}</p>}
                            {entry.Changes?.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {entry.Changes.map((c, ci) => {
                                  const fieldNames = t('detail.fields') || {}
                                  const fieldLabel = fieldNames[c.field] || c.field
                                  return (
                                  <span key={ci} className="text-[11px] px-2 py-1 rounded-lg" style={{background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)'}}>
                                    <span style={{color: 'var(--text-muted)'}}>{fieldLabel}:</span>
                                    {'  '}<span style={{color: '#f87171', textDecoration: 'line-through'}}>{String(c.from || '—').slice(0, 60)}</span>
                                    {' → '}
                                    <span style={{color: '#34d399'}}>{String(c.to || '—').slice(0, 60)}</span>
                                  </span>
                                  )
                                })}
                              </div>
                            )}
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
