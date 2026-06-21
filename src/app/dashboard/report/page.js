'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import { Printer, Download, FileText, RefreshCw } from 'lucide-react'

const HANDLERS = ['Seif', 'Ayman', 'M.Saaed', 'Younis', 'Sohila', 'Amany', 'Manar', 'Karema']

export default function Report() {
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [refundNotes, setRefundNotes] = useState({})
  const [savingNote, setSavingNote] = useState(null)

  useEffect(() => {
    if (authStatus === 'unauthenticated') router.push('/')
    if (authStatus !== 'authenticated') return
    fetch('/api/sheets?all=true').then(r => r.json()).then(d => {
      const list = Array.isArray(d.issues) ? d.issues : []
      setIssues(list)
      setLoading(false)
      const notes = {}
      list.forEach(i => {
        const note = i['Note'] || ''
        const refReason = note.match(/__REF_REASON__:(.+?)(?=\s*__|$)/)
        const refNote = note.match(/__REF_NOTE__:(.+?)(?=\s*__|$)/)
        const val = refNote ? refNote[1].trim() : (refReason ? refReason[1].trim() : '')
        if (val) notes[i.id] = val
      })
      setRefundNotes(notes)
    }).catch(() => setLoading(false))
  }, [authStatus, router])

  const dayIssues = issues.filter(i => (i['Start Call'] || '').startsWith(date))
  const newCases = dayIssues.filter(i => i._sheet !== 'old')
  const oldCases = dayIssues.filter(i => i._sheet === 'old')

  const newClosed = newCases.filter(i => i['Status'] === 'Closed').length
  const newPending = newCases.filter(i => i['Status'] === 'Pending' || i['Status'] === 'Pending 48H').length
  const oldClosed = oldCases.filter(i => i['Status'] === 'Closed').length
  const oldPending = oldCases.filter(i => i['Status'] === 'Pending' || i['Status'] === 'Pending 48H').length

  const refundCases = dayIssues.filter(i => i['Amount Refund'] && i['Amount Refund'].trim() !== '')
  const brokenCases = dayIssues.filter(i => i['Issue code'] === 'Broken')

  const followUps = issues.filter(i => i['Follow up'] && i['Follow up'].trim() !== '' && (i['Start Call'] || '').startsWith(date))
  const followUpClosed = followUps.filter(i => i['Status'] === 'Closed').length
  const followUpPending = followUps.filter(i => i['Status'] === 'Pending' || i['Status'] === 'Pending 48H').length

  function handlerCases(list, handler) {
    return list.filter(i => i['Handled by'] === handler).length
  }

  function handlerFollowUp(handler, statuses) {
    return followUps.filter(i => i['Handled by'] === handler && statuses.includes(i['Status'])).length
  }

  async function saveRefundNote(id, value) {
    setSavingNote(id)
    try {
      const note = issues.find(i => i.id === id)?.['Note'] || ''
      const cleaned = note.replace(/__REF_NOTE__:(.+?)(?=\s*__|$)/g, '').trim()
      const newNote = value ? `${cleaned} __REF_NOTE__:${value}`.trim() : cleaned
      await fetch(`/api/sheets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Note: newNote }),
      })
      setRefundNotes(prev => ({ ...prev, [id]: value }))
    } catch {}
    setSavingNote(null)
  }

  if (authStatus === 'loading' || authStatus === 'unauthenticated') return null

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.03) 0%, transparent 60%)' }}>
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20">
                <FileText size={18} className="text-amber-400" />
              </div>
              <div>
                <h1 className="text-xl font-heading font-bold tracking-tight" style={{color: 'var(--text-primary)'}}>Daily Complaints Report</h1>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{date}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="px-3 py-2 rounded-xl text-sm"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
              <button onClick={() => window.print()}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff' }}>
                <Printer size={14} /> Print
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-24">
              <RefreshCw size={32} className="text-amber-500 animate-spin" />
            </div>
          ) : (
            <div className="space-y-5">

              {/* Section 1: Summary Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border p-4 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                  <div className="text-xs font-semibold tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Total New Cases</div>
                  <div className="text-3xl font-heading font-bold" style={{ color: '#fbbf24' }}>{newCases.length}</div>
                </div>
                <div className="rounded-xl border p-4 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                  <div className="text-xs font-semibold tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Total Old Cases</div>
                  <div className="text-3xl font-heading font-bold" style={{ color: '#818cf8' }}>{oldCases.length}</div>
                </div>
                <div className="rounded-xl border p-4 text-center" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.02))', borderColor: 'rgba(245,158,11,0.2)' }}>
                  <div className="text-xs font-semibold tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Total Cases</div>
                  <div className="text-3xl font-heading font-bold" style={{ color: '#f59e0b' }}>{dayIssues.length}</div>
                </div>
              </div>

              {/* Section 2: Status Breakdown */}
              <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)' }}>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold tracking-wider" style={{ color: 'var(--text-muted)' }}></th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold tracking-wider" style={{ color: '#34d399' }}>Closed</th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold tracking-wider" style={{ color: '#fb923c' }}>Pending</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderTop: '1px solid var(--border-color)' }}>
                      <td className="px-4 py-2.5 font-medium" style={{ color: 'var(--text-primary)' }}>New</td>
                      <td className="px-4 py-2.5 text-center"><span className="inline-block px-3 py-1 rounded-lg text-sm font-bold" style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399' }}>{newClosed}</span></td>
                      <td className="px-4 py-2.5 text-center"><span className="inline-block px-3 py-1 rounded-lg text-sm font-bold" style={{ background: 'rgba(249,115,22,0.12)', color: '#fb923c' }}>{newPending}</span></td>
                    </tr>
                    <tr style={{ borderTop: '1px solid var(--border-color)' }}>
                      <td className="px-4 py-2.5 font-medium" style={{ color: 'var(--text-primary)' }}>Old</td>
                      <td className="px-4 py-2.5 text-center"><span className="inline-block px-3 py-1 rounded-lg text-sm font-bold" style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399' }}>{oldClosed}</span></td>
                      <td className="px-4 py-2.5 text-center"><span className="inline-block px-3 py-1 rounded-lg text-sm font-bold" style={{ background: 'rgba(249,115,22,0.12)', color: '#fb923c' }}>{oldPending}</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Section 3: Refund Cases */}
              <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <div className="px-4 py-2.5 text-xs font-semibold tracking-wider" style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>Refund Cases</div>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)' }}>
                      <th className="px-4 py-2 text-right text-xs font-semibold tracking-wider" style={{ color: 'var(--text-muted)' }}>Reason</th>
                      <th className="px-4 py-2 text-center text-xs font-semibold tracking-wider" style={{ color: 'var(--text-muted)' }}>Amount</th>
                      <th className="px-4 py-2 text-center text-xs font-semibold tracking-wider" style={{ color: 'var(--text-muted)' }}>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {refundCases.length === 0 ? (
                      <tr><td colSpan={3} className="px-4 py-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>No refund cases</td></tr>
                    ) : refundCases.map((r, i) => {
                      const reasonMatch = (r['Note'] || '').match(/__REF_REASON__:(.+?)(?:__|$)/)
                      const reason = reasonMatch ? reasonMatch[1].trim() : r['Issue code'] || '-'
                      return (
                        <tr key={r.id || i} style={{ borderTop: '1px solid var(--border-color)' }}>
                          <td className="px-4 py-2 text-xs" style={{ color: 'var(--text-secondary)' }}>{reason}</td>
                          <td className="px-4 py-2 text-center font-mono font-bold" style={{ color: '#f87171' }}>{r['Amount Refund']}</td>
                          <td className="px-4 py-2 text-center">
                            <input
                              defaultValue={refundNotes[r.id] || ''}
                              onBlur={(e) => saveRefundNote(r.id, e.target.value)}
                              className="w-[250px] border rounded-lg px-2 py-1 text-xs transition-all"
                              style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                              placeholder="Write reason..."
                            />
                          </td>
                        </tr>
                      )
                    })}
                    <tr style={{ borderTop: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                      <td className="px-4 py-2 font-semibold" style={{ color: 'var(--text-primary)' }}>Total</td>
                      <td className="px-4 py-2 text-center font-mono font-bold" style={{ color: '#f87171' }}>{refundCases.reduce((s, r) => s + (parseFloat(r['Amount Refund']) || 0), 0)}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Section 4: Broken Cases */}
              <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <div className="px-4 py-2.5 text-xs font-semibold tracking-wider" style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>Broken Cases ({brokenCases.length})</div>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)' }}>
                      <th className="px-4 py-2 text-center text-xs font-semibold tracking-wider" style={{ color: 'var(--text-muted)' }}>Handled By</th>
                      <th className="px-4 py-2 text-center text-xs font-semibold tracking-wider" style={{ color: 'var(--text-muted)' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {brokenCases.length === 0 ? (
                      <tr><td colSpan={2} className="px-4 py-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>No broken cases</td></tr>
                    ) : brokenCases.map((r, i) => (
                      <tr key={i} style={{ borderTop: '1px solid var(--border-color)' }}>
                        <td className="px-4 py-2 text-center text-xs" style={{ color: 'var(--text-secondary)' }}>{r['Handled by'] || '-'}</td>
                        <td className="px-4 py-2 text-center">
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium" style={
                            r['Status'] === 'Closed' ? {background: 'rgba(16,185,129,0.12)', color: '#34d399'} :
                            r['Status'] === 'Pending' ? {background: 'rgba(249,115,22,0.12)', color: '#fb923c'} :
                            r['Status'] === 'Pending 48H' ? {background: 'rgba(245,158,11,0.12)', color: '#fbbf24'} :
                            r['Status'] === 'Escalated' ? {background: 'rgba(239,68,68,0.12)', color: '#f87171'} :
                            {}
                          }>{r['Status']}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Section 4: Handled By */}
              <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <div className="px-4 py-2.5 text-xs font-semibold tracking-wider" style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>HANDLED BY</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: 'var(--bg-secondary)' }}>
                        <th className="px-3 py-2 text-right text-xs font-semibold tracking-wider whitespace-nowrap" style={{ color: 'var(--text-muted)' }}></th>
                        {HANDLERS.map(h => (
                          <th key={h} className="px-3 py-2 text-center text-xs font-semibold tracking-wider whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderTop: '1px solid var(--border-color)' }}>
                        <td className="px-3 py-2 font-medium whitespace-nowrap" style={{ color: '#fbbf24' }}>New Cases</td>
                        {HANDLERS.map(h => {
                          const v = handlerCases(newCases, h)
                          return <td key={h} className="px-3 py-2 text-center font-mono font-bold" style={{ color: v > 5 ? '#fbbf24' : 'var(--text-secondary)' }}>{v || '-'}</td>
                        })}
                      </tr>
                      <tr style={{ borderTop: '1px solid var(--border-color)' }}>
                        <td className="px-3 py-2 font-medium whitespace-nowrap" style={{ color: '#818cf8' }}>Old Cases</td>
                        {HANDLERS.map(h => {
                          const v = handlerCases(oldCases, h)
                          return <td key={h} className="px-3 py-2 text-center font-mono" style={{ color: 'var(--text-secondary)' }}>{v || '-'}</td>
                        })}
                      </tr>
                      <tr style={{ borderTop: '1px solid var(--border-color)' }}>
                        <td className="px-3 py-2 font-medium whitespace-nowrap" style={{ color: '#f87171' }}>Broken Cases</td>
                        {HANDLERS.map(h => {
                          const v = brokenCases.filter(i => i['Handled by'] === h).length
                          return <td key={h} className="px-3 py-2 text-center font-mono" style={{ color: v > 0 ? '#f87171' : 'var(--text-secondary)' }}>{v || '-'}</td>
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 5: Follow Up Report */}
              <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <div className="px-4 py-2.5 text-xs font-semibold tracking-wider" style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>FOLLOW UP REPORT</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: 'var(--bg-secondary)' }}>
                        <th className="px-3 py-2 text-right text-xs font-semibold tracking-wider whitespace-nowrap" style={{ color: 'var(--text-muted)' }}></th>
                        {HANDLERS.map(h => (
                          <th key={h} className="px-3 py-2 text-center text-xs font-semibold tracking-wider whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderTop: '1px solid var(--border-color)' }}>
                        <td className="px-3 py-2 font-medium whitespace-nowrap" style={{ color: '#34d399' }}>Closed</td>
                        {HANDLERS.map(h => {
                          const v = handlerFollowUp(h, ['Closed'])
                          return <td key={h} className="px-3 py-2 text-center font-mono" style={{ color: v > 0 ? '#34d399' : 'var(--text-secondary)' }}>{v || '-'}</td>
                        })}
                      </tr>
                      <tr style={{ borderTop: '1px solid var(--border-color)' }}>
                        <td className="px-3 py-2 font-medium whitespace-nowrap" style={{ color: '#fb923c' }}>Still Pending</td>
                        {HANDLERS.map(h => {
                          const v = handlerFollowUp(h, ['Pending', 'Pending 48H'])
                          return <td key={h} className="px-3 py-2 text-center font-mono" style={{ color: v > 0 ? '#fb923c' : 'var(--text-secondary)' }}>{v || '-'}</td>
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-3 flex items-center gap-6 text-xs" style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)' }}>
                  <span><span className="font-semibold" style={{ color: '#34d399' }}>Closed</span>: <span className="font-mono text-white">{followUpClosed}</span></span>
                  <span><span className="font-semibold" style={{ color: '#fb923c' }}>Still Pending</span>: <span className="font-mono text-white">{followUpPending}</span></span>
                  <span><span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Total Follow Up</span>: <span className="font-mono text-white">{followUps.length}</span></span>
                </div>
              </div>

            </div>
          )}
        </main>
      </div>
    </div>
  )
}
