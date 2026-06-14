'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import IssueForm from '@/components/IssueForm'
import { Edit3, AlertCircle } from 'lucide-react'

export default function EditIssue() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [issue, setIssue] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/')
    if (status !== 'authenticated') return
    fetch(`/api/sheets/${params.id}`).then(r => r.json()).then(d => { setIssue(d); setLoading(false) }).catch(() => setLoading(false))
  }, [status, params.id, router])

  if (status === 'loading' || status === 'unauthenticated') return null

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="min-h-screen" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.03) 0%, transparent 60%)' }}>
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center gap-4 mb-8 animate-fade-in">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20">
                <Edit3 size={22} className="text-amber-400" />
              </div>
              <div>
                <h1 className="text-xl font-heading font-bold tracking-tight" style={{color: 'var(--text-primary)'}}>Edit Issue</h1>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Update customer complaint details</p>
              </div>
            </div>

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
              <div className="glass rounded-2xl p-6 md:p-8 animate-slide-up">
                <IssueForm initialData={issue} />
              </div>
            )}
          </main>
      </div>
    </div>
  )
}
