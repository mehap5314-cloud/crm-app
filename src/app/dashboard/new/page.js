'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import IssueForm from '@/components/IssueForm'
import { FilePlus } from 'lucide-react'

export default function NewIssue() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => { if (status === 'unauthenticated') router.push('/') }, [status, router])

  if (status === 'loading' || status === 'unauthenticated') return null

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="min-h-screen" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.03) 0%, transparent 60%)' }}>
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center gap-4 mb-8 animate-fade-in">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20">
                <FilePlus size={22} className="text-amber-400" />
              </div>
              <div>
                <h1 className="text-xl font-heading font-bold tracking-tight" style={{color: 'var(--text-primary)'}}>New Issue</h1>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Record a new customer complaint</p>
              </div>
            </div>
            <div className="glass rounded-2xl p-6 md:p-8 animate-slide-up">
              <IssueForm />
            </div>
          </main>
      </div>
    </div>
  )
}
