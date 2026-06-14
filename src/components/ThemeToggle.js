'use client'

import { useState, useEffect } from 'react'
import { Moon, Sun } from 'lucide-react'

export default function ThemeToggle() {
  const [dark, setDark] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('crm-theme')
    const isDark = saved ? saved === 'dark' : true
    setDark(isDark)
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
  }, [])

  function toggle() {
    const newDark = !dark
    setDark(newDark)
    localStorage.setItem('crm-theme', newDark ? 'dark' : 'light')
    document.documentElement.setAttribute('data-theme', newDark ? 'dark' : 'light')
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer"
      style={{
        color: dark ? 'var(--text-muted)' : '#64748b',
        background: dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}
      title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {dark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-slate-600" />}
      <span className="hidden sm:inline text-xs">{dark ? 'Light' : 'Dark'}</span>
    </button>
  )
}
