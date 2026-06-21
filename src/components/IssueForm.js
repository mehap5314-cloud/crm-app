'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Save, ArrowLeft, AlertTriangle, Plus, X } from 'lucide-react'
import CustomSelect from './CustomSelect'
import CustomDatePicker from './CustomDatePicker'
import MultiDatePicker from './MultiDatePicker'
import useKeyboardShortcuts from '@/hooks/useKeyboardShortcuts'

const BRANCHES = [
  'City 1', 'City 2', 'City 3', 'City 4', 'Elmerghany',
  'Chilout', 'CFC', 'Mall Of Arabia', 'Almaza', 'Point 90',
  'Madinty', 'Tanta', 'Mansoura 1', 'Mansoura 2',
  'San Stefano', 'City Center Alex',
]

const COMPLAINTS_DEST = [
  'On Call', 'Social Media', 'Feed Back', 'Whats App',
  'Branch Employee', 'Camera Team', 'Follow Up',
]

const HANDLED_BY = [
  'Karema', 'Eslam', 'M.Ehab', 'Seif', 'A.Omar',
  'M.Saaed', 'Younis', 'Yasmen', 'Sohila', 'Amany',
  'Manar', 'M.Sherif', 'Amany Abdelhady',
]

const ISSUE_CODES = [
  'Matrial out of stock', 'Broken', 'Warranty On Broken', 'Sales',
  'Without Matrial', 'Issue For Screen', 'Issue For Skins',
  'Change prices', 'General Info', 'Payment Issue',
  'Upgrade & Downgrade', 'Bumber', 'Accessories & Lens',
  'Wrong Mobile Number', 'Change Mobile Number', 'No Account',
  'Without Serial', 'Change Serial Number', 'Bad Attitude',
  'Missing & Wrong Info- Branch', 'Wrong action- Branch',
  'Missing & Wrong Info-Agent', 'Technical Issue', 'Fraud',
  'No Code', 'Others',
]

const FIELDS = [
  { key: 'Start Call', label: 'Start Call', type: 'date' },
  { key: '2nd Call', label: '2nd Call', type: 'multiDate' },
  { key: 'Closing Date', label: 'Closing Date', type: 'date' },
  { key: 'Branch', label: 'Branch', type: 'select', options: BRANCHES },
  { key: 'Complaints Destination', label: 'Complaints Destination', type: 'select', options: COMPLAINTS_DEST },
  { key: 'Mobile Type', label: 'Mobile Type', type: 'text' },
  { key: 'Sold By', label: 'Sold By', type: 'text' },
  { key: 'Customer Name', label: 'Customer Name', type: 'text' },
  { key: 'Contact Number', label: 'Contact Number', type: 'text' },
  { key: 'Description', label: 'Description', type: 'textarea' },
  { key: 'Final Conclusion', label: 'Final Conclusion', type: 'finalConclusion' },
  { key: 'Status', label: 'Status', type: 'select', options: ['Pending', 'Pending 48H', 'Closed', 'Escalated'] },
  { key: 'Handled by', label: 'Handled By', type: 'select', options: HANDLED_BY },
  { key: 'Issue code', label: 'Issue Code', type: 'select', options: ISSUE_CODES },
  { key: 'Exception', label: 'Exception', type: 'checkbox' },
  { key: 'Exception End Date', label: 'Exception End Date', type: 'exceptionDate' },
  { key: 'Amount Refund', label: 'Amount Refund', type: 'text' },
  { key: 'Refund Reason', label: 'Refund Reason', type: 'refundReason' },
  { key: 'Ticket', label: 'Ticket', type: 'text' },

  { key: 'Follow up', label: 'Follow Up', type: 'multiDate' },
  { key: 'Note', label: 'Note', type: 'textarea' },
]

export default function IssueForm({ initialData }) {
  const router = useRouter()
  const { data: session } = useSession()
  const [form, setForm] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [duplicates, setDuplicates] = useState([])
  const [exceptionEnd, setExceptionEnd] = useState('')
  const [refundReason, setRefundReason] = useState('')
  const [fupText, setFupText] = useState('')
  const [showFup, setShowFup] = useState(false)

  const isEdit = !!initialData
  const issuesCache = useRef(null)

  useEffect(() => {
    if (initialData) {
      setForm(initialData)
      const note = initialData['Note'] || ''
      const m = note.match(/__EX_END__:(\S+)/)
      if (m) setExceptionEnd(m[1])
      else setExceptionEnd('')
      const r = note.match(/__REF_REASON__:(.+?)(?:\s*__|$)/)
      if (r) setRefundReason(r[1].trim())
      else setRefundReason('')
    }
  }, [initialData])

  const checkDuplicates = useCallback(async (phone) => {
    if (!phone || phone.length < 3) { setDuplicates([]); return }
    try {
      if (!issuesCache.current) {
        const res = await fetch('/api/sheets?all=true')
        if (res.ok) issuesCache.current = (await res.json()).issues
      }
      const matches = (issuesCache.current || []).filter(i => {
        if (isEdit && i.id === initialData.id) return false
        return i['Contact Number']?.includes(phone)
      })
      setDuplicates(matches)
    } catch {}
  }, [isEdit, initialData?.id])

  useEffect(() => {
    const timer = setTimeout(() => {
      checkDuplicates(form['Contact Number'])
    }, 500)
    return () => clearTimeout(timer)
  }, [form['Contact Number'], checkDuplicates])

  function handleChange(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function addFupEntry() {
    if (!fupText.trim()) return
    const today = new Date()
    const dd = String(today.getDate()).padStart(2, '0')
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dateStr = `${dd}/${mm}`
    const user = session?.user?.name || 'Unknown'
    const existing = form['Final Conclusion'] || ''
    const entry = `${dateStr} ${fupText.trim()} (${user})`
    const newVal = existing ? `${existing}\n${entry}` : entry
    setForm(prev => ({ ...prev, 'Final Conclusion': newVal }))
    setFupText('')
    setShowFup(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const today = new Date().toISOString().split('T')[0]
      const data = { ...form }

      if (!isEdit && !data['Start Call']) data['Start Call'] = today

      if (exceptionEnd) {
        const note = data['Note'] || ''
        const cleaned = note.replace(/__EX_END__:\S+\s*/g, '').trim()
        data['Note'] = `__EX_END__:${exceptionEnd} ${cleaned}`.trim()
      } else {
        if (data['Note']) {
          data['Note'] = data['Note'].replace(/__EX_END__:\S+\s*/g, '').trim()
        }
      }

      if (refundReason) {
        const note = data['Note'] || ''
        const cleaned = note.replace(/__REF_REASON__:(.+?)(?=\s*__|$)/g, '').trim()
        data['Note'] = `${cleaned} __REF_REASON__:${refundReason}`.trim()
      } else {
        if (data['Note']) {
          data['Note'] = data['Note'].replace(/__REF_REASON__:(.+?)(?=\s*__|$)/g, '').trim()
        }
      }

      const url = isEdit ? `/api/sheets/${initialData.id}` : '/api/sheets'
      const method = isEdit ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Something went wrong')
      }
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useKeyboardShortcuts({
    save: () => { if (!loading) handleSubmit(new Event('submit')) },
  })

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-xl mb-6 animate-slide-up" style={{background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)'}}>
          <span className="text-sm text-red-300">{error}</span>
        </div>
      )}

      {duplicates.length > 0 && (
        <div className="rounded-xl mb-6 animate-slide-up overflow-hidden" style={{border: '1px solid rgba(245,158,11,0.25)'}}>
          <div className="flex items-center gap-2 px-5 py-3" style={{background: 'rgba(245,158,11,0.1)'}}>
            <AlertTriangle size={16} className="text-amber-400 shrink-0" />
            <span className="text-sm font-medium text-amber-300">{duplicates.length} previous issue{duplicates.length > 1 ? 's' : ''} for this number</span>
          </div>
          <div className="divide-y" style={{borderColor: 'rgba(245,158,11,0.1)'}}>
            {duplicates.map(d => (
              <div
                key={d.id}
                onClick={() => router.push(`/dashboard/${d.id}`)}
                className="flex items-center gap-4 px-5 py-2.5 text-xs cursor-pointer transition-all"
                style={{color: 'var(--text-secondary)', background: 'var(--bg-card)'}}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card-hover)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)' }}
              >
                <span className={d['Status'] === 'Closed' ? 'line-through opacity-60' : ''}>{d['Customer Name']}</span>
                <span className="font-mono">{d['Issue code']}</span>
                <span className={'px-1.5 py-0.5 rounded text-xs font-medium'} style={
                  d['Status'] === 'Closed' ? {background: 'rgba(16,185,129,0.12)', color: '#34d399'} :
                  d['Status'] === 'Pending' ? {background: 'rgba(249,115,22,0.12)', color: '#fb923c'} :
                  d['Status'] === 'Pending 48H' ? {background: 'rgba(245,158,11,0.12)', color: '#fbbf24'} :
                  d['Status'] === 'Escalated' ? {background: 'rgba(239,68,68,0.12)', color: '#f87171'} :
                  {}
                }>{d['Status']}</span>
                <span className="ml-auto text-xs opacity-50">{d['Start Call']}{d['_sheet'] === 'old' ? ' (old)' : ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {FIELDS.map((field) => (
          <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-2 lg:col-span-3' : ''}>
            <label className="block text-xs font-semibold tracking-wider mb-1.5" style={{color: 'var(--text-muted)'}}>
              {field.label}
            </label>
            {field.type === 'checkbox' ? (
              <label className="flex items-center gap-3 py-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(form[field.key] || '') === 'Yes'}
                  onChange={(e) => handleChange(field.key, e.target.checked ? 'Yes' : '')}
                  className="w-5 h-5 rounded border-2 accent-amber-500 cursor-pointer"
                  style={{borderColor: 'var(--border-color)'}}
                />
                <span className="text-sm" style={{color: 'var(--text-secondary)'}}>Yes / No</span>
              </label>
            ) : field.type === 'textarea' ? (
              <textarea
                value={form[field.key] || ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
                rows={3}
                className="w-full border rounded-xl px-3.5 py-2.5 text-sm transition-all duration-200"
                style={{background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)'}}
              />
            ) : field.type === 'date' ? (
              <CustomDatePicker
                value={form[field.key] || ''}
                onChange={(v) => handleChange(field.key, v)}
                placeholder={field.label}
              />
            ) : field.type === 'multiDate' ? (
              <MultiDatePicker
                values={form[field.key] || ''}
                onChange={(v) => handleChange(field.key, v)}
              />
            ) : field.type === 'exceptionDate' ? (
              <CustomDatePicker
                value={exceptionEnd}
                onChange={(v) => setExceptionEnd(v)}
                placeholder="Select end date..."
              />
            ) : field.type === 'refundReason' ? (
              form['Amount Refund']?.trim() ? (
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  rows={2}
                  placeholder="Write refund reason..."
                  className="w-full border rounded-xl px-3.5 py-2.5 text-sm transition-all duration-200"
                  style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              ) : null
            ) : field.type === 'finalConclusion' ? (
              <div className="space-y-2">
                <textarea
                  value={form[field.key] || ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  rows={4}
                  className="w-full border rounded-xl px-3.5 py-2.5 text-sm transition-all duration-200"
                  style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
                <div className="flex flex-wrap gap-1">
                  {(form[field.key] || '').split('\n').filter(Boolean).map((line, i) => {
                    const match = line.match(/^(.*)\(([^)]+)\)$/)
                    return (
                      <div key={i} className="text-sm px-3 py-1 rounded-lg" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
                        <span>{match ? match[1].trim() : line}</span>
                        {match && <span className="font-semibold mr-1" style={{ color: '#f59e0b' }}>({match[2]})</span>}
                      </div>
                    )
                  })}
                </div>
                {showFup ? (
                  <div className="flex items-center gap-1">
                    <input
                      value={fupText}
                      onChange={e => setFupText(e.target.value)}
                      className="flex-1 border rounded-lg px-3 py-1.5 text-sm"
                      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                      placeholder="Write follow-up..."
                      onKeyDown={e => {
                        if (e.key === 'Enter' && fupText.trim()) { addFupEntry(); e.preventDefault() }
                        if (e.key === 'Escape') { setShowFup(false); setFupText('') }
                      }}
                      autoFocus
                    />
                    <button type="button" onClick={addFupEntry} disabled={!fupText.trim()}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium"
                      style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>Save</button>
                    <button type="button" onClick={() => { setShowFup(false); setFupText('') }}
                      className="px-2 py-1.5 rounded-lg text-xs" style={{ color: 'var(--text-muted)' }}><X size={14} /></button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setShowFup(true)}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-all"
                    style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
                    <Plus size={14} /> Add entry
                  </button>
                )}
              </div>
            ) : field.type === 'select' ? (
              <CustomSelect
                value={form[field.key] || ''}
                onChange={(v) => handleChange(field.key, v)}
                options={field.options}
                placeholder={`Select ${field.label}...`}
              />
            ) : (
              <input
                type={field.type}
                value={form[field.key] || ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
                readOnly={field.key === 'Ticket'}
                className="w-full border rounded-xl px-3.5 py-2.5 text-sm transition-all duration-200"
                style={{
                  background: field.key === 'Ticket' ? 'rgba(245,158,11,0.05)' : 'var(--bg-secondary)',
                  borderColor: field.key === 'Ticket' ? 'rgba(245,158,11,0.15)' : 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-6 mt-6 border-t" style={{borderColor: 'var(--border-color)'}}>
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
          style={{color: 'var(--text-muted)'}}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
          style={{
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: '#fff',
            opacity: loading ? 0.6 : 1,
            boxShadow: loading ? 'none' : '0 4px 20px rgba(245,158,11,0.3)',
          }}
        >
          <Save size={16} />
          {loading ? 'Saving...' : isEdit ? 'Update Issue' : 'Create Issue'}
        </button>
      </div>
    </form>
  )
}
