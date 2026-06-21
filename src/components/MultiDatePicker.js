'use client'

import { useState } from 'react'
import { X, Plus } from 'lucide-react'

export default function MultiDatePicker({ values, onChange }) {
  const [input, setInput] = useState('')
  const dates = values ? values.split(',').map(s => s.trim()).filter(Boolean) : []

  function addDate() {
    if (!input) return
    const newDates = [...dates, input]
    onChange(newDates.join(', '))
    setInput('')
  }

  function removeDate(idx) {
    const newDates = dates.filter((_, i) => i !== idx)
    onChange(newDates.join(', '))
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="date"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 border rounded-xl px-3.5 py-2.5 text-sm transition-all duration-200"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
        />
        <button
          type="button"
          onClick={addDate}
          disabled={!input}
          className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200"
          style={{
            background: !input ? 'var(--bg-secondary)' : 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: !input ? 'var(--text-muted)' : '#fff',
            opacity: !input ? 0.5 : 1,
          }}
        >
          <Plus size={14} /> Add
        </button>
      </div>
      {dates.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {dates.map((d, i) => (
            <span
              key={i}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium"
              style={{ background: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)' }}
            >
              {d}
              <button type="button" onClick={() => removeDate(i)} className="hover:opacity-70">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
