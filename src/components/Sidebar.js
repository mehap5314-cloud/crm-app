'use client'

import { useSession } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import { useLang } from '@/lib/i18n'
import { List, BarChart3, FileText, Trash2, Calendar, X, Phone, Plus, Upload, Users } from 'lucide-react'

const LINKS = [
  { href: '/dashboard', key: 'side.allIssues', icon: List },
  { href: '/dashboard/new', key: 'side.newIssue', icon: Plus },
  { href: '/dashboard/feedback', key: 'side.feedback', icon: Phone },
  { href: '/dashboard/feedback/analytics', key: 'side.fbAnalytics', icon: BarChart3 },
]

const STAFF_LINKS = [
  { href: '/dashboard/import', key: 'side.import', icon: Upload },
]

const ADMIN_LINKS = [
  { href: '/dashboard/users', key: 'side.employees', icon: Users },
  { href: '/dashboard/analytics', key: 'side.analytics', icon: BarChart3 },
  { href: '/dashboard/report', key: 'side.dailyReport', icon: FileText },
  { href: '/dashboard/trash', key: 'side.trash', icon: Trash2 },
  { href: '/dashboard/monthly-report', key: 'side.monthlyReport', icon: Calendar },
]

export default function Sidebar({ open, onClose }) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const { t, isRTL } = useLang()
  const isAdmin = session?.user?.isAdmin || false
  const isManager = session?.user?.isManager || false

  let allLinks = [...LINKS]
  if (isAdmin || isManager) allLinks = [...allLinks, ...STAFF_LINKS]
  if (isAdmin) allLinks = [...allLinks, ...ADMIN_LINKS]

  const isActive = (href) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <>
      {open && <div className="fixed inset-0 z-40" style={{background: 'rgba(0,0,0,0.5)'}} onClick={onClose} />}
      <aside className={`fixed top-0 h-full w-64 z-50 transform transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : ''} ${isRTL ? 'right-0 border-l' : 'left-0 border-r'} ${!open && isRTL ? 'translate-x-full' : ''} ${!open && !isRTL ? '-translate-x-full' : ''}`}
        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <span className="text-sm font-bold tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>{t('side.menu')}</span>
          <button onClick={onClose} className="p-1 rounded-lg hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>
        <div className="p-3 space-y-1">
          {allLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => { router.push(link.href); onClose?.() }}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isRTL ? 'text-right' : 'text-left'}`}
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
                {t(link.key)}
                {link.href === '/dashboard/users' && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold tracking-wider uppercase" style={{background: 'rgba(245,158,11,0.15)', color: '#f59e0b'}}>{t('users.roleAdmin')}</span>
                )}
              </span>
            </button>
          ))}
        </div>
      </aside>
    </>
  )
}
