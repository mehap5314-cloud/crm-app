'use client'

import { useSession } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import { List, BarChart3, FileText, Trash2, Calendar, X } from 'lucide-react'

const LINKS = [
  { href: '/dashboard', label: 'All Issues', icon: List },
]

const ADMIN_LINKS = [
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/report', label: 'Daily Report', icon: FileText },
  { href: '/dashboard/trash', label: 'Trash', icon: Trash2 },
  { href: '/dashboard/monthly-report', label: 'Monthly Report', icon: Calendar },
]

export default function Sidebar({ open, onClose }) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const isAdmin = session?.user?.isAdmin || false
  const isManager = session?.user?.isManager || false

  const allLinks = (isAdmin || isManager) ? [...LINKS, ...ADMIN_LINKS] : LINKS

  const isActive = (href) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <>
      {open && <div className="fixed inset-0 z-40" style={{background: 'rgba(0,0,0,0.5)'}} onClick={onClose} />}
      <aside className={`fixed top-0 right-0 h-full w-64 z-50 border-l transform transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <span className="text-sm font-bold tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>Menu</span>
          <button onClick={onClose} className="p-1 rounded-lg hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>
        <div className="p-3 space-y-1">
          {allLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => { router.push(link.href); onClose?.() }}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-right"
              style={{
                color: isActive(link.href) ? 'var(--accent)' : 'var(--text-secondary)',
                background: isActive(link.href) ? 'var(--accent-glow)' : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (!isActive(link.href)) {
                  e.currentTarget.style.color = 'var(--text-primary)'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive(link.href)) {
                  e.currentTarget.style.color = 'var(--text-secondary)'
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              <link.icon size={17} />
              <span className="flex items-center gap-2">
                {link.label}
                {link.href === '/dashboard/analytics' && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold tracking-wider uppercase" style={{background: 'rgba(245,158,11,0.15)', color: '#f59e0b'}}>Admin</span>
                )}
              </span>
            </button>
          ))}
        </div>
      </aside>
    </>
  )
}
