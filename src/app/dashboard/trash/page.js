'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import { Trash2, RefreshCw, Undo2, AlertCircle, TrashIcon, ShieldAlert } from 'lucide-react'

export default function TrashPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  async function fetchTrash() {
    try {
      setLoading(true)
      const res = await fetch('/api/trash')
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setIssues(Array.isArray(data) ? data : [])
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/')
    if (status === 'authenticated') fetchTrash()
  }, [status, router])

  async function handleRestore(id) {
    if (!confirm('Restore this issue?')) return
    try {
      const res = await fetch(`/api/trash/${id}`, { method: 'POST' })
      if (res.ok) { setIssues(p => p.filter(i => i.id !== id)) }
    } catch {}
  }

  async function handlePermanentDelete(id) {
    if (!confirm('Delete permanently? This cannot be undone.')) return
    try {
      const res = await fetch(`/api/trash/${id}`, { method: 'DELETE' })
      if (res.ok) { setIssues(p => p.filter(i => i.id !== id)) }
    } catch {}
  }

  if (status === 'loading' || status === 'unauthenticated') return null

  const isAdmin = session?.user?.isAdmin
  const isManager = session?.user?.isManager
  if (!isAdmin && !isManager) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="flex items-center gap-3 px-6 py-4 rounded-xl" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <ShieldAlert size={20} className="text-amber-400" />
          <span className="text-sm text-amber-300">Admin access required</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/20">
              <TrashIcon size={20} className="text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-heading font-bold tracking-tight" style={{color: 'var(--text-primary)'}}>Trash</h1>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{issues.length} deleted issue{issues.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button onClick={fetchTrash} className="glass flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : issues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3" style={{ color: 'var(--text-muted)' }}>
            <Trash2 size={40} className="opacity-20" />
            <span className="text-sm">Trash is empty</span>
          </div>
        ) : (
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)' }}>
                    <th className="px-3 py-3.5 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Ticket</th>
                    <th className="px-3 py-3.5 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Customer</th>
                    <th className="px-3 py-3.5 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Phone</th>
                    <th className="px-3 py-3.5 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Status</th>
                    <th className="px-3 py-3.5 text-center text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {issues.map(issue => (
                    <tr key={issue.id} className="transition-all" style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border-color)' }}>
                      <td className="px-3 py-3.5 text-right font-mono text-xs font-bold" style={{ color: 'var(--accent)' }}>{issue['Ticket'] || '-'}</td>
                      <td className="px-3 py-3.5 text-right" style={{ color: 'var(--text-primary)' }}>{issue['Customer Name'] || '-'}</td>
                      <td className="px-3 py-3.5 text-right" style={{ color: 'var(--text-secondary)' }}>{issue['Contact Number'] || '-'}</td>
                      <td className="px-3 py-3.5 text-right">
                        <span className="inline-block px-2 py-1 rounded-lg text-xs font-medium" style={{ color: '#f87171', background: 'rgba(239,68,68,0.1)' }}>
                          {issue['Status'] || '-'}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleRestore(issue.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all" style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.2)' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.1)' }}>
                            <Undo2 size={12} /> Restore
                          </button>
                          <button onClick={() => handlePermanentDelete(issue.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)' }}>
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
