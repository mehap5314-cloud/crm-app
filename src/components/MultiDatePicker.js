'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { X, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDay(year, month) {
  return new Date(year, month, 1).getDay()
}

const MONTHS = [
  'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
]

const DAYS = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س']

export default function MultiDatePicker({ values, onChange }) {
  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(new Date().getMonth())
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const dates = values ? values.split(',').map(s => s.trim()).filter(Boolean) : []
  const todayStr = new Date().toISOString().split('T')[0]

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDay(viewYear, viewMonth)

  const calendarDays = useMemo(() => {
    const cells = []
    for (let i = 0; i < firstDay; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) {
      const y = viewYear
      const m = String(viewMonth + 1).padStart(2, '0')
      const day = String(d).padStart(2, '0')
      cells.push(`${y}-${m}-${day}`)
    }
    return cells
  }, [viewYear, viewMonth, daysInMonth, firstDay])

  function toggleDate(dateStr) {
    const exists = dates.includes(dateStr)
    if (exists) {
      onChange(dates.filter(d => d !== dateStr).join(', '))
    } else {
      onChange([...dates, dateStr].join(', '))
    }
  }

  function removeDate(idx) {
    onChange(dates.filter((_, i) => i !== idx).join(', '))
  }

  return (
    <div ref={ref} className="relative">
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
        <div className="flex items-center gap-2 flex-wrap">
          {dates.length > 0 ? (
            dates.map((d, i) => (
              <span key={i} className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium"
                style={{ background: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)' }}>
                {d}
                <button type="button" onClick={(e) => { e.stopPropagation(); removeDate(i) }} className="hover:opacity-70">
                  <X size={10} />
                </button>
              </span>
            ))
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>2nd Call</span>
          )}
        </div>
        <CalendarDays size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
      </button>

      {open && (
        <div className="absolute top-full mt-1.5 right-0 z-50 rounded-xl border shadow-xl overflow-hidden animate-fade-in"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', width: '300px' }}>

          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <button
              type="button"
              onClick={() => {
                if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
                else setViewMonth(m => m - 1)
              }}
              className="p-1.5 rounded-lg transition-all"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
            >
              <ChevronRight size={16} />
            </button>
            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={() => {
                if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
                else setViewMonth(m => m + 1)
              }}
              className="p-1.5 rounded-lg transition-all"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
            >
              <ChevronLeft size={16} />
            </button>
          </div>

          <div className="p-3">
            <div className="grid grid-cols-7 gap-1 mb-1">
              {DAYS.map((d, i) => (
                <div key={i} className="text-center text-[10px] font-bold uppercase py-1" style={{ color: 'var(--text-muted)' }}>
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((dateStr, idx) => {
                if (!dateStr) return <div key={`e-${idx}`} />
                const isToday = dateStr === todayStr
                const isSelected = dates.includes(dateStr)
                let bg = 'transparent'
                let textColor = 'var(--text-primary)'
                if (isSelected) { bg = 'var(--accent)'; textColor = '#fff' }
                else if (isToday) { bg = 'rgba(245,158,11,0.12)'; textColor = 'var(--accent)' }

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => toggleDate(dateStr)}
                    className="text-center text-xs py-1.5 rounded-lg transition-all font-medium"
                    style={{ background: bg, color: textColor }}
                    onMouseEnter={e => {
                      if (!isSelected) e.currentTarget.style.background = 'var(--bg-card-hover)'
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) e.currentTarget.style.background = isToday ? 'rgba(245,158,11,0.12)' : 'transparent'
                    }}
                  >
                    {dateStr.split('-')[2]}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex items-center justify-between px-3 py-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              {dates.length ? dates.join(', ') : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
