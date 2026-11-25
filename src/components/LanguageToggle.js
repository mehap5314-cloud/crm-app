'use client'

import { useLang } from '@/lib/i18n'
import { Languages } from 'lucide-react'

export default function LanguageToggle() {
  const { lang, toggle } = useLang()

  return (
    <button
      onClick={toggle}
      className="glass flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
      style={{ color: 'var(--text-secondary)' }}
      title={lang === 'ar' ? 'Switch to English' : 'التبديل للعربية'}
      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--accent)' }}
      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-color)' }}
    >
      <Languages size={15} />
      {lang === 'ar' ? 'EN' : 'عربي'}
    </button>
  )
}
