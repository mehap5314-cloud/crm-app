'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import { MessageSquare, RefreshCw, Search, Plus, X, Save } from 'lucide-react'

const defaultForm = {
  'Start Call': '', '2nd Call': '', '3rd call': '', 'New sale': '',
  'Branch': '', 'Date': '', 'Customer': '', 'Customer/Phone': '',
  'Employee': '', 'Order Lines/Product/Point of Sale Category': '',
  'Order Lines/Product/Name': '', 'Order Lines/Model': '',
  'Total': '', 'وضع المكالمه': '', 'وضح نسبه الحمايه': '',
  'وضح مقاومه الخدوش': '', 'الاحتفاظ بالاسكرين القديمه': '',
  'رسوم التركيب متغيرة': '', 'فتره الضمان': '', 'استلم الضمان': '',
  'وضح معلومه المياه والكحول': '', 'تقييم الموظف': '',
  'مشاكل في الاسكرين': '', 'مشاكل مع الموظفين': '', 'اخري': '',
  'ملاحظات': '', 'وقت الرد علي المكالمه': '',
}

const SURVEY_FIELDS = [
  { key: 'وضع المكالمه', label: 'Call Status', type: 'select', options: ['تم الرد', 'لم يتم الرد', 'السبب رفض'] },
  { key: 'وضح نسبه الحمايه', label: 'Protection Rate', type: 'yesno' },
  { key: 'وضح مقاومه الخدوش', label: 'Scratch Resistance', type: 'yesno' },
  { key: 'الاحتفاظ بالاسكرين القديمه', label: 'Old Screen Retained', type: 'yesno' },
  { key: 'رسوم التركيب متغيرة', label: 'Installation Fee Varies', type: 'yesno' },
  { key: 'فتره الضمان', label: 'Warranty Period', type: 'yesno' },
  { key: 'استلم الضمان', label: 'Warranty Received', type: 'yesno' },
  { key: 'وضح معلومه المياه والكحول', label: 'Water & Alcohol Info', type: 'yesno' },
  { key: 'تقييم الموظف', label: 'Employee Rating', type: 'select', options: ['1', '2', '3', '4', '5'] },
  { key: 'مشاكل في الاسكرين', label: 'Screen Issues', type: 'text' },
  { key: 'مشاكل مع الموظفين', label: 'Staff Issues', type: 'text' },
  { key: 'اخري', label: 'Other', type: 'text' },
  { key: 'ملاحظات', label: 'Notes', type: 'textarea' },
]

export default function FeedbackPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [feedback, setFeedback] = useState([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...defaultForm })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/')
    if (status !== 'authenticated') return
    fetch('/api/feedback').then(r => r.json()).then(d => {
      setFeedback(Array.isArray(d.feedback) ? d.feedback : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [status, router])

  const filtered = search ? feedback.filter(f =>
    Object.values(f).some(v => String(v || '').toLowerCase().includes(search.toLowerCase()))
  ) : feedback

  const statusColors = {
    'تم الرد': { bg: 'rgba(16,185,129,0.12)', color: '#34d399' },
    'لم يتم الرد': { bg: 'rgba(249,115,22,0.12)', color: '#fb923c' },
    'رفض': { bg: 'rgba(239,68,68,0.12)', color: '#f87171' },
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setShowForm(false)
        setForm({ ...defaultForm })
        const d = await fetch('/api/feedback').then(r => r.json())
        setFeedback(Array.isArray(d.feedback) ? d.feedback : [])
      }
    } catch {}
    setSaving(false)
  }

  if (status === 'loading' || status === 'unauthenticated') return null

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.03) 0%, transparent 60%)' }}>
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20">
                <MessageSquare size={18} className="text-amber-400" />
              </div>
              <div>
                <h1 className="text-xl font-heading font-bold tracking-tight" style={{color: 'var(--text-primary)'}}>Feedback</h1>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{feedback.length} records</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  className="w-64 pl-9 pr-3 py-2 rounded-xl text-sm border"
                  style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  placeholder="Search..." />
              </div>
              <button onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff' }}>
                <Plus size={16} /> New
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-24"><RefreshCw size={32} className="text-amber-500 animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24 text-sm" style={{ color: 'var(--text-muted)' }}>No feedback records found</div>
          ) : (
            <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <div className="overflow-x-auto" dir="ltr">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)' }}>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold tracking-wider whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>Date</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold tracking-wider whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>Customer</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold tracking-wider whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>Phone</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold tracking-wider whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>Employee</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold tracking-wider whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>Branch</th>
                      <th className="px-3 py-2.5 text-center text-xs font-semibold tracking-wider whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>Product</th>
                      <th className="px-3 py-2.5 text-center text-xs font-semibold tracking-wider whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>Model</th>
                      <th className="px-3 py-2.5 text-center text-xs font-semibold tracking-wider whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>Total</th>
                      <th className="px-3 py-2.5 text-center text-xs font-semibold tracking-wider whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>Status</th>
                      <th className="px-3 py-2.5 text-center text-xs font-semibold tracking-wider whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>Rating</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold tracking-wider whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((f, i) => (
                      <tr key={f.id || i} style={{ borderTop: '1px solid var(--border-color)' }}>
                        <td className="px-3 py-2.5 text-xs whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>{f['Date'] || '-'}</td>
                        <td className="px-3 py-2.5 text-xs whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>{f['Customer'] || '-'}</td>
                        <td className="px-3 py-2.5 text-xs whitespace-nowrap font-mono" style={{ color: 'var(--text-secondary)' }}>{f['Customer/Phone'] || '-'}</td>
                        <td className="px-3 py-2.5 text-xs whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>{f['Employee'] || '-'}</td>
                        <td className="px-3 py-2.5 text-xs whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>{f['Branch'] || '-'}</td>
                        <td className="px-3 py-2.5 text-xs max-w-[200px] truncate" style={{ color: 'var(--text-secondary)' }}>{f['Order Lines/Product/Name'] || '-'}</td>
                        <td className="px-3 py-2.5 text-xs text-center whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>{f['Order Lines/Model'] || '-'}</td>
                        <td className="px-3 py-2.5 text-xs text-center font-mono whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>{f['Total'] || '-'}</td>
                        <td className="px-3 py-2.5 text-center">
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium" style={
                            f['وضع المكالمه']?.includes('تم الرد') ? statusColors['تم الرد'] :
                            f['وضع المكالمه']?.includes('لم يتم') ? statusColors['لم يتم الرد'] :
                            f['وضع المكالمه']?.includes('رفض') || f['وضع المكالمه']?.includes('السبب') ? statusColors['رفض'] :
                            {}
                          }>{f['وضع المكالمه'] || '-'}</span>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-center font-mono" style={{ color: 'var(--text-secondary)' }}>{f['تقييم الموظف'] || '-'}</td>
                        <td className="px-3 py-2.5 text-xs max-w-[200px] truncate" style={{ color: 'var(--text-muted)' }}>{f['ملاحظات'] || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {showForm && (
            <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10" style={{ background: 'rgba(0,0,0,0.6)' }}>
              <div className="w-full max-w-3xl rounded-2xl border overflow-y-auto max-h-[90vh]" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 z-10" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                  <h2 className="text-lg font-heading font-bold" style={{ color: 'var(--text-primary)' }}>New Feedback</h2>
                  <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg transition-all" style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  <div>
                    <h3 className="text-xs font-semibold tracking-wider mb-3" style={{ color: '#f59e0b' }}>CUSTOMER INFO</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {['Start Call','2nd Call','3rd call','New sale','Branch','Date','Customer','Customer/Phone','Employee','Order Lines/Product/Point of Sale Category','Order Lines/Product/Name','Order Lines/Model','Total'].map((key) => (
                        <div key={key} className={key === 'Order Lines/Product/Point of Sale Category' || key === 'Order Lines/Product/Name' ? 'md:col-span-2' : ''}>
                          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{key}</label>
                          <input value={form[key] || ''} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                            className="w-full border rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold tracking-wider mb-3" style={{ color: '#f59e0b' }}>SURVEY</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {SURVEY_FIELDS.map((field) => (
                        <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-3' : ''}>
                          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{field.label}</label>
                          {field.type === 'select' ? (
                            <select value={form[field.key]} onChange={e => setForm(p => ({ ...p, [field.key]: e.target.value }))}
                              className="w-full border rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                              <option value="">--</option>
                              {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          ) : field.type === 'yesno' ? (
                            <div className="flex gap-2">
                              {['Yes','No'].map(v => (
                                <button key={v} type="button" onClick={() => setForm(p => ({ ...p, [field.key]: form[field.key] === v ? '' : v }))}
                                  className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                                  style={form[field.key] === v ? { background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' } : { background: 'var(--bg-secondary)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
                                  {v === 'Yes' ? 'Yes' : 'No'}
                                </button>
                              ))}
                            </div>
                          ) : field.type === 'textarea' ? (
                            <textarea value={form[field.key]} onChange={e => setForm(p => ({ ...p, [field.key]: e.target.value }))}
                              rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                          ) : (
                            <input value={form[field.key]} onChange={e => setForm(p => ({ ...p, [field.key]: e.target.value }))}
                              className="w-full border rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                    <button type="button" onClick={() => setShowForm(false)}
                      className="px-4 py-2 rounded-xl text-sm" style={{ color: 'var(--text-muted)' }}>Cancel</button>
                    <button type="submit" disabled={saving}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all"
                      style={{
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        color: '#fff',
                        opacity: saving ? 0.6 : 1,
                        boxShadow: saving ? 'none' : '0 4px 20px rgba(245,158,11,0.3)',
                      }}>
                      <Save size={16} /> {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
