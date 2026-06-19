'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

const TAG_PALETTE = [
  { bg: 'rgba(99,102,241,0.12)', color: '#818cf8' },
  { bg: 'rgba(139,92,246,0.12)', color: '#a78bfa' },
  { bg: 'rgba(14,165,233,0.12)', color: '#38bdf8' },
  { bg: 'rgba(168,85,247,0.12)', color: '#c084fc' },
  { bg: 'rgba(59,130,246,0.12)', color: '#60a5fa' },
  { bg: 'rgba(6,182,212,0.12)', color: '#22d3ee' },
  { bg: 'rgba(34,197,94,0.12)', color: '#4ade80' },
  { bg: 'rgba(244,63,94,0.12)', color: '#fb7185' },
  { bg: 'rgba(236,72,153,0.12)', color: '#f472b6' },
  { bg: 'rgba(251,146,60,0.12)', color: '#fdba74' },
  { bg: 'rgba(248,113,113,0.12)', color: '#fca5a5' },
  { bg: 'rgba(52,211,153,0.12)', color: '#6ee7b7' },
]

const STATUS_STYLES = {
  'Closed': { bg: 'rgba(16,185,129,0.15)', color: '#34d399' },
  'Pending': { bg: 'rgba(249,115,22,0.15)', color: '#fb923c' },
  'Pending 48H': { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24' },
  'Escalated': { bg: 'rgba(239,68,68,0.15)', color: '#f87171' },
}

function getTagStyle(val) {
  if (STATUS_STYLES[val]) return STATUS_STYLES[val]
  if (!val) return TAG_PALETTE[0]
  let h = 0
  for (let i = 0; i < val.length; i++) h = ((h << 5) - h + val.charCodeAt(i)) | 0
  return TAG_PALETTE[Math.abs(h) % TAG_PALETTE.length]
}

export default function CustomSelect({ value, onChange, options, placeholder, className = '', style = {}, align = 'right' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className={`relative ${className}`} style={style}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 border rounded-xl px-3.5 py-2.5 text-sm transition-all duration-200"
        style={{
          background: 'var(--bg-secondary)',
          borderColor: open ? 'var(--accent)' : 'var(--border-color)',
          color: 'var(--text-primary)',
        }}
      >
        <div className="flex items-center gap-2" style={{ direction: 'ltr' }}>
          {value ? (
            <span className="inline-block px-2.5 py-0.5 rounded-lg text-xs font-medium" style={getTagStyle(value)}>
              {value}
            </span>
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>{placeholder}</span>
          )}
        </div>
        <ChevronDown size={14} style={{
          color: 'var(--text-muted)',
          transform: open ? 'rotate(180deg)' : '',
          transition: 'transform 0.2s ease',
        }} />
      </button>

      {open && (
        <div className="absolute top-full mt-1.5 right-0 left-0 z-50 rounded-xl border shadow-xl overflow-hidden animate-fade-in"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="max-h-56 overflow-y-auto py-1">
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false) }}
              className="w-full text-right px-3.5 py-2.5 text-sm transition-all"
              style={{
                color: 'var(--text-muted)',
                background: !value ? 'rgba(245,158,11,0.06)' : 'transparent',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card-hover)' }}
              onMouseLeave={e => { e.currentTarget.style.background = !value ? 'rgba(245,158,11,0.06)' : 'transparent' }}
            >
              {placeholder}
            </button>
            {options.map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => { onChange(opt); setOpen(false) }}
                className="w-full flex items-center text-right gap-2.5 px-3.5 py-2.5 text-sm transition-all"
                style={{
                  background: value === opt ? 'rgba(245,158,11,0.08)' : 'transparent',
                  color: 'var(--text-primary)',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card-hover)' }}
                onMouseLeave={e => { e.currentTarget.style.background = value === opt ? 'rgba(245,158,11,0.08)' : 'transparent' }}
              >
                <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0" style={{ background: getTagStyle(opt).color }} />
                <span className="inline-block px-2 py-0.5 rounded-lg text-xs font-medium" style={getTagStyle(opt)}>
                  {opt}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
