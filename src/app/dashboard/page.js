'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import useKeyboardShortcuts from '@/hooks/useKeyboardShortcuts'
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
  const [activeFilter, setActiveFilter] = useState(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pageSize] = useState(50)
  const [searchQuery, setSearchQuery] = useState('')
  const [stats, setStats] = useState(null)

  const fetchPage = useCallback(async (p, search) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) {
        params.set('search', search)
      } else {
        params.set('page', p || page)
        params.set('pageSize', pageSize)
      }
      const res = await fetch(`/api/sheets?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setIssues(Array.isArray(data.issues) ? data.issues : [])
      setTotal(data.total || 0)
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize])

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/sheets/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/')
    if (status === 'authenticated') {
      fetchPage(1, '')
      fetchStats()
    }
  }, [status, router, fetchPage, fetchStats])

  const handlePageChange = (newPage) => {
    setPage(newPage)
    fetchPage(newPage, searchQuery)
  }

  const handleSearch = (query) => {
    setSearchQuery(query)
    setPage(1)
    fetchPage(1, query)
  }

  const handleForceRefresh = () => {
    setLoading(true)
    fetch('/api/sheets?refresh=1').then(r => r.json()).then(data => {
      setIssues(Array.isArray(data.issues) ? data.issues : [])
      setTotal(data.total || 0)
      setError('')
      setLoading(false)
    }).catch(e => { setError(e.message); setLoading(false) })
    fetchStats()
  }

  const STATS = stats ? [
    { icon: HeadphonesIcon, label: 'Total', value: stats.total, color: '#f59e0b', sub: `${stats.pending + stats.pending48h + stats.escalated} pending`, filter: null },
    { icon: AlertCircle, label: 'Pending', value: stats.pending, color: '#fb923c', filter: 'Pending' },
    { icon: Clock, label: 'Pending 48H', value: stats.pending48h, color: '#fbbf24', filter: 'Pending 48H' },
    { icon: AlertCircle, label: 'Escalated', value: stats.escalated, color: '#f87171', filter: 'Escalated' },
    { icon: CheckCircle, label: 'Closed', value: stats.closed, color: '#34d399', filter: 'Closed' },
    { icon: Clock, label: 'Today', value: stats.today, color: '#818cf8', filter: 'Today' },
  ] : []

  const filteredIssues = activeFilter
    ? (activeFilter === 'Today'
      ? issues.filter(i => (i['Start Call'] || '').startsWith(new Date().toISOString().split('T')[0]))
      : issues.filter(i => i['Status'] === activeFilter))
    : issues

  const searchInputRef = useCallback((el) => {
    if (el) setTimeout(() => el.focus(), 50)
  }, [])

  useKeyboardShortcuts({
    new: () => router.push('/dashboard/new'),
    search: () => {
      const input = document.querySelector('input[placeholder="Search all fields..."]')
      if (input) input.focus()
    },
    refresh: () => handleForceRefresh(),
  })

  async function handleDelete(id) {
    try {
      const res = await fetch(`/api/sheets/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      setIssues((prev) => prev.filter((i) => i.id !== id))
      setTotal(t => t - 1)
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
        <main className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20">
                  <HeadphonesIcon size={20} className="text-amber-400" />
                </div>
                <h1 className="text-2xl font-heading font-bold tracking-tight" style={{color: 'var(--text-primary)'}}>Customer Issues</h1>
              </div>
              <p className="text-sm mr-[52px]" style={{ color: 'var(--text-secondary)' }}>
                {activeFilter ? `Showing: ${activeFilter}` : 'All issues — click a stat card to filter'}
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
                onClick={handleForceRefresh}
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

          {!loading && stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-6 animate-fade-in">
              {STATS.map((stat, i) => (
                <button
                  key={i}
                  onClick={() => setActiveFilter(activeFilter === stat.filter ? null : stat.filter)}
                  className="relative overflow-hidden rounded-xl border p-4 text-right transition-all duration-200 hover:scale-[1.02] cursor-pointer"
                  style={{
                    background: activeFilter === stat.filter ? `${stat.color}12` : 'var(--bg-card)',
                    borderColor: activeFilter === stat.filter ? stat.color : 'var(--border-color)',
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg" style={{ background: `${stat.color}15` }}>
                      <stat.icon size={15} style={{ color: stat.color }} />
                    </div>
                    <span className="text-xl font-heading font-bold" style={{ color: 'var(--text-primary)' }}>{stat.value}</span>
                  </div>
                  <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{stat.label}</div>
                  {stat.sub && <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{stat.sub}</div>}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="animate-fade-in">
              <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <div className="p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="h-5 w-32 rounded" style={{ background: 'var(--bg-elevated)' }} />
                </div>
                <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4" style={{ animationDelay: `${i * 80}ms` }}>
                      <div className="h-4 w-4 rounded" style={{ background: 'var(--bg-elevated)' }} />
                      <div className="h-4 w-12 rounded" style={{ background: 'var(--bg-elevated)' }} />
                      <div className="h-4 w-28 rounded flex-1" style={{ background: 'var(--bg-elevated)' }} />
                      <div className="h-4 w-20 rounded" style={{ background: 'var(--bg-elevated)' }} />
                      <div className="h-6 w-16 rounded-lg" style={{ background: 'var(--bg-elevated)' }} />
                      <div className="h-6 w-20 rounded-lg" style={{ background: 'var(--bg-elevated)' }} />
                      <div className="h-4 w-16 rounded" style={{ background: 'var(--bg-elevated)' }} />
                      <div className="h-4 w-20 rounded" style={{ background: 'var(--bg-elevated)' }} />
                      <div className="h-6 w-16 rounded-lg" style={{ background: 'var(--bg-elevated)' }} />
                      <div className="h-6 w-20 rounded-lg" style={{ background: 'var(--bg-elevated)' }} />
                      <div className="h-6 w-16 rounded-lg" style={{ background: 'var(--bg-elevated)' }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-fade-in">
              <IssueTable
                issues={filteredIssues}
                onDelete={handleDelete}
                onBulkUpdate={() => { fetchPage(page, searchQuery); fetchStats() }}
                total={total}
                page={page}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onSearch={handleSearch}
                searchQuery={searchQuery}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
