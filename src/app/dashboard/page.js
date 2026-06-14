'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import IssueTable from '@/components/IssueTable'
import { RefreshCw, AlertCircle, HeadphonesIcon, Plus, Activity, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  async function fetchIssues() {
    try {
      setLoading(true)
      const res = await fetch('/api/sheets')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setIssues(Array.isArray(data) ? data : [])
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/')
    if (status === 'authenticated') fetchIssues()
  }, [status, router])

  async function handleDelete(id) {
    try {
      const res = await fetch(`/api/sheets/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      setIssues((prev) => prev.filter((i) => i.id !== id))
    } catch (err) {
      alert(err.message)
    }
  }

  if (status === 'loading' || status === 'unauthenticated') return null

  return (
    <div className="min-h-screen bg-grid" style={{ background: 'var(--bg-primary)' }}>
      <div className="min-h-screen" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.03) 0%, transparent 60%)' }}>
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20">
                    <HeadphonesIcon size={20} className="text-amber-400" />
                  </div>
                  <h1 className="text-2xl font-heading font-bold tracking-tight" style={{color: 'var(--text-primary)'}}>Customer Issues</h1>
                </div>
                <p className="text-sm mr-[52px]" style={{ color: 'var(--text-secondary)' }}>
                  Manage and track all customer complaints
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard/new"
                  className="btn-accent flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
                >
                  <Plus size={16} />
                  New Issue
                </Link>
                <button
                  onClick={fetchIssues}
                  className="glass flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-light)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-color)' }}
                >
                  <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                  Refresh
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-3 px-5 py-4 rounded-xl mb-6 animate-slide-up" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <AlertCircle size={18} className="text-red-400 shrink-0" />
                <span className="text-sm text-red-300">{error}</span>
              </div>
            )}

            {!loading && issues.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 mb-6 animate-fade-in">
                {[
                  { icon: HeadphonesIcon, label: 'Total', value: issues.length, color: '#f59e0b', sub: `${issues.filter(i => i['Status'] === 'Open' || i['Status'] === 'In Progress').length} active` },
                  { icon: AlertCircle, label: 'Open', value: issues.filter(i => i['Status'] === 'Open').length, color: '#fbbf24' },
                  { icon: Activity, label: 'In Progress', value: issues.filter(i => i['Status'] === 'In Progress').length, color: '#60a5fa' },
                  { icon: CheckCircle, label: 'Closed', value: issues.filter(i => i['Status'] === 'Closed').length, color: '#34d399' },
                  { icon: Clock, label: 'Today', value: issues.filter(i => (i['Start Call'] || '') === new Date().toISOString().split('T')[0]).length, color: '#818cf8' },
                ].map((stat, i) => (
                  <div key={i} className="relative overflow-hidden rounded-xl border p-4 transition-all duration-200 hover:scale-[1.02]" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg" style={{ background: `${stat.color}15` }}>
                        <stat.icon size={15} style={{ color: stat.color }} />
                      </div>
                      <span className="text-xl font-heading font-bold" style={{ color: 'var(--text-primary)' }}>{stat.value}</span>
                    </div>
                    <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{stat.label}</div>
                    {stat.sub && <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{stat.sub}</div>}
                  </div>
                ))}
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-24">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading issues...</span>
                </div>
              </div>
            ) : (
              <div className="animate-fade-in">
                <IssueTable issues={issues} onDelete={handleDelete} onBulkUpdate={fetchIssues} />
              </div>
            )}
          </main>
      </div>
    </div>
  )
}
