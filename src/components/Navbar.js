'use client'

import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ThemeToggle from './ThemeToggle'
import { LogOut, List, BarChart3, HeadphonesIcon, Menu, X } from 'lucide-react'

export default function Navbar({ onMenuClick }) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const links = [
    { href: '/dashboard', label: 'All Issues', icon: List },
  ]

  const isActive = (href) => pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

  return (
    <nav className="sticky top-0 z-50 border-b" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-glass)', backdropFilter: 'blur(20px)' }}>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <button onClick={onMenuClick} className="flex p-2 rounded-lg transition-all duration-200" style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}>
                <Menu size={20} />
              </button>
              <Link href="/dashboard" className="flex items-center gap-2.5 group">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20 group-hover:border-amber-500/40 transition-all duration-300">
                  <HeadphonesIcon size={18} className="text-amber-400" />
                </div>
                <span className="text-lg font-heading font-bold tracking-tight" style={{color: 'var(--text-primary)'}}>CRM</span>
              </Link>
            </div>
            <div className="hidden sm:flex items-center gap-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                  style={{
                    color: isActive(link.href) ? 'var(--accent)' : 'var(--text-secondary)',
                    background: isActive(link.href) ? 'var(--accent-glow)' : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive(link.href)) {
                      e.currentTarget.style.color = 'var(--text-primary)'
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive(link.href)) {
                      e.currentTarget.style.color = 'var(--text-secondary)'
                      e.currentTarget.style.background = 'transparent'
                    }
                  }}
                >
                  <link.icon size={16} />
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {session && (
              <>
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-medium flex items-center gap-2" style={{color: 'var(--text-primary)'}}>
                    {session.user.name}
                    {session.user.isAdmin && <span className="text-[10px] px-2 py-0.5 rounded-md font-bold tracking-wider uppercase" style={{background: 'rgba(245,158,11,0.15)', color: '#f59e0b'}}>Admin</span>}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{session.user.email}</span>
                </div>
                <div className="relative">
                  <img
                    src={session.user.image}
                    alt={session.user.name}
                    className="w-9 h-9 rounded-xl border-2 object-cover"
                    style={{ borderColor: 'var(--border-color)' }}
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2" style={{ background: '#10b981', borderColor: 'var(--bg-primary)' }} />
                </div>
                <button
                  onClick={() => signOut()}
                  className="btn-ghost flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium"
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
                >
                  <LogOut size={16} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
                <button
                  onClick={() => setMobileOpen(!mobileOpen)}
                  className="sm:hidden btn-ghost p-2 rounded-xl"
                >
                  {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              </>
            )}
          </div>
        </div>

        {mobileOpen && (
          <div className="sm:hidden pb-4 pt-2 space-y-1 border-t" style={{ borderColor: 'var(--border-color)' }}>
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                style={{
                  color: isActive(link.href) ? 'var(--accent)' : 'var(--text-secondary)',
                  background: isActive(link.href) ? 'var(--accent-glow)' : 'transparent',
                }}
              >
                <link.icon size={18} />
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}
