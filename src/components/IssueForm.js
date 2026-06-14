'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import ImageUpload from './ImageUpload'
import { Save, ArrowLeft, FilePlus, AlertTriangle } from 'lucide-react'

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
  { key: '2nd Call', label: '2nd Call', type: 'date' },
  { key: 'Closing Date', label: 'Closing Date', type: 'date' },
  { key: 'Branch', label: 'Branch', type: 'select', options: BRANCHES },
  { key: 'Complaints Destination', label: 'Complaints Destination', type: 'select', options: COMPLAINTS_DEST },
  { key: 'Mobile Type', label: 'Mobile Type', type: 'text' },
  { key: 'Sold By', label: 'Sold By', type: 'text' },
  { key: 'Customer Name', label: 'Customer Name', type: 'text' },
  { key: 'Contact Number', label: 'Contact Number', type: 'text' },
  { key: 'Description', label: 'Description', type: 'textarea' },
  { key: 'Final Conclusion', label: 'Final Conclusion', type: 'textarea' },
  { key: 'Status', label: 'Status', type: 'select', options: ['Open', 'In Progress', 'Pending', 'Closed', 'Cancelled'] },
  { key: 'Handled by', label: 'Handled By', type: 'select', options: HANDLED_BY },
  { key: 'Issue code', label: 'Issue Code', type: 'select', options: ISSUE_CODES },
  { key: 'Exception', label: 'Exception', type: 'text' },
  { key: 'Amount Refund', label: 'Amount Refund', type: 'text' },
  { key: 'Follow up', label: 'Follow Up', type: 'textarea' },
  { key: 'Note', label: 'Note', type: 'textarea' },
]

export default function IssueForm({ initialData }) {
  const router = useRouter()
  const [form, setForm] = useState(initialData || {})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [duplicates, setDuplicates] = useState([])
  const [imageUrls, setImageUrls] = useState(() => {
    if (!initialData) return []
    const note = initialData['Note'] || ''
    const imgMatch = note.match(/__IMAGES__:\s*(\[.*?\])/)
    return imgMatch ? JSON.parse(imgMatch[1]) : []
  })

  const isEdit = !!initialData

  const checkDuplicates = useCallback(async (name, phone) => {
    if (!name && !phone) { setDuplicates([]); return }
    setCheckingDuplicate(true)
    try {
      const res = await fetch('/api/sheets')
      if (res.ok) {
        const issues = await res.json()
        const openStatuses = ['Open', 'In Progress', 'Pending']
        const matches = issues.filter(i => {
          if (isEdit && i.id === initialData.id) return false
          if (!openStatuses.includes(i['Status'])) return false
          const nameMatch = name && i['Customer Name']?.toLowerCase().includes(name.toLowerCase())
          const phoneMatch = phone && i['Contact Number']?.includes(phone)
          return nameMatch || phoneMatch
        })
        setDuplicates(matches)
      }
    } catch {}
    setCheckingDuplicate(false)
  }, [isEdit, initialData?.id])

  useEffect(() => {
    const timer = setTimeout(() => {
      checkDuplicates(form['Customer Name'], form['Contact Number'])
    }, 500)
    return () => clearTimeout(timer)
  }, [form['Customer Name'], form['Contact Number'], checkDuplicates])

  function handleChange(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const today = new Date().toISOString().split('T')[0]
      const data = { ...form }

      let cleanNote = (data['Note'] || '').replace(/\n?__IMAGES__:\s*\[.*?\]/s, '').trim()
      if (imageUrls.length > 0) {
        cleanNote += `\n__IMAGES__: ${JSON.stringify(imageUrls)}`
      }
      data['Note'] = cleanNote

      if (!isEdit && !data['Start Call']) data['Start Call'] = today

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

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-xl mb-6 animate-slide-up" style={{background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)'}}>
          <span className="text-sm text-red-300">{error}</span>
        </div>
      )}

      {duplicates.length > 0 && (
        <div className="flex items-start gap-3 px-5 py-4 rounded-xl mb-6 animate-slide-up" style={{background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)'}}>
          <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-sm font-medium text-amber-300">Possible duplicate{duplicates.length > 1 ? 's' : ''} found</span>
            <div className="mt-1.5 space-y-1">
              {duplicates.map(d => (
                <div key={d.id} className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  #{d.id} &middot; {d['Customer Name']} &middot; {d['Contact Number']} &middot; <span className="text-amber-400">{d['Status']}</span> &middot; {d['Start Call']}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {FIELDS.map((field) => (
          <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-2 lg:col-span-3' : ''}>
            <label className="block text-xs font-semibold tracking-wider mb-1.5" style={{color: 'var(--text-muted)'}}>
              {field.label}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                value={form[field.key] || ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
                rows={3}
                className="w-full border rounded-xl px-3.5 py-2.5 text-sm transition-all duration-200"
                style={{background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)'}}
              />
            ) : field.type === 'select' ? (
              <select
                value={form[field.key] || ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
                className="w-full border rounded-xl px-3.5 py-2.5 text-sm transition-all duration-200"
                style={{background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)'}}
              >
                <option value="">Select {field.label}...</option>
                {field.options.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <input
                type={field.type}
                value={form[field.key] || ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
                className="w-full border rounded-xl px-3.5 py-2.5 text-sm transition-all duration-200"
                style={{background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)'}}
              />
            )}
          </div>
        ))}
      </div>

      <div className="pt-6 mt-6 border-t" style={{borderColor: 'var(--border-color)'}}>
        <label className="block text-xs font-semibold tracking-wider mb-2" style={{color: 'var(--text-muted)'}}>Attachments</label>
        <ImageUpload images={imageUrls} onImagesChange={setImageUrls} />
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
