'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import { MessageSquare, RefreshCw, Search, Plus, X, Save, Upload } from 'lucide-react'

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
  'Created By': '', 'Modified By': '',
}

const EMPLOYEE_NAMES = ['Manar', 'Karima', 'Sohila', 'Amany', 'seif', 'ayman', 'M.saaed', 'Younis', 'Mayada']

const READ_ONLY_FIELDS = ['Branch', 'Date', 'Customer/Phone', 'Employee', 'Order Lines/Product/Point of Sale Category', 'Order Lines/Product/Name', 'Order Lines/Model', 'Total', 'Created By', 'Modified By']

const SURVEY_FIELDS = [
  { key: 'وضع المكالمه', label: 'حالة المكالمة', type: 'select', options: ['تم الرد', 'لم يتم الرد', 'متابعه في وقت محدد', 'متابعه في وقت آخر', 'رفض التقييم', 'رد و قفل', 'اجنبي', 'الرقم خطاء', 'العميل باع الموبيل', '(السبب) رفض يكمل المكالمه', 'لم يتم توضيح المعلومات', 'تم ارسال المعلومات واتساب'] },
  { key: 'وضح نسبه الحمايه', label: 'نسبة الحماية', type: 'yesno' },
  { key: 'وضح مقاومه الخدوش', label: 'مقاومة الخدوش', type: 'yesno' },
  { key: 'الاحتفاظ بالاسكرين القديمه', label: 'الاحتفاظ بالاسكرين القديمة', type: 'yesno' },
  { key: 'رسوم التركيب متغيرة', label: 'رسوم التركيب متغيرة', type: 'yesno' },
  { key: 'فتره الضمان', label: 'فترة الضمان', type: 'yesno' },
  { key: 'استلم الضمان', label: 'استلام الضمان', type: 'yesno' },
  { key: 'وضح معلومه المياه والكحول', label: 'معلومات المياه والكحول', type: 'yesno' },
  { key: 'تقييم الموظف', label: 'تقييم الموظف', type: 'select', options: ['1', '2', '3', '4', '5'] },
  { key: 'مشاكل في الاسكرين', label: 'مشاكل في الاسكرين', type: 'select', options: ['فكت من الحواف', 'فيها هوا', 'تحتها تراب او اي شئ اخر', 'مقاس الاسكرين', 'قشرت', 'ماتريل سيئه (السبب)', 'الاسكرين فيها خطوط', '(السبب) مشكله في البرايفسي'] },
  { key: 'مشاكل مع الموظفين', label: 'مشاكل مع الموظفين', type: 'select', options: ['(السبب) اسلوب الموظف سي', 'مده التركيب', 'لم يوضح جميع المعلومات', 'وضح معلومه خاطئه (السبب)', 'الموظف يحتاج تدريب (السبب)', 'عدل الاسكرين (اسم الموظف)', 'دفع العميل رسوم تركيب في الضمان', 'لم يتم تفعيل كود الخصم'] },
  { key: 'اخري', label: 'أخرى', type: 'select', options: ['الاسكرين انكسرت', 'الموبايل انكسر', 'مشكله في التاتش', 'الاسكرين فيها خدوش', 'غير الاسكرين أكثر من مره في نفس الزياره', 'مشكله في السداد', 'مشاكل اخري تم توضيحها في الملاحظات.', 'لينس تم توضيح كل المعلومات', 'عارف كل المعلومات', 'العميل لديه شكوي', 'العميل عمل ريفائد'] },
  { key: 'ملاحظات', label: 'ملاحظات', type: 'textarea' },
]

export default function FeedbackPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [feedback, setFeedback] = useState([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ ...defaultForm })
  const [saving, setSaving] = useState(false)
  const [assigning, setAssigning] = useState(null)
  const [dateFilter, setDateFilter] = useState('')
  const [employeeFilter, setEmployeeFilter] = useState('')
  const [unassignedOnly, setUnassignedOnly] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 50
  const [importing, setImporting] = useState(false)
  const [importMsg, setImportMsg] = useState('')
  const fileRef = useRef(null)
  const [selected, setSelected] = useState(new Set())
  const [batchForm, setBatchForm] = useState({ 'Start Call': '', '2nd Call': '', '3rd call': '', 'New sale': '' })
  const [batchApplying, setBatchApplying] = useState(false)
  const [fupDate, setFupDate] = useState('')
  const [fupTime, setFupTime] = useState('')
  const [fupEmployee, setFupEmployee] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/')
    if (status !== 'authenticated') return
    fetch('/api/feedback').then(r => r.json()).then(d => {
      setFeedback(Array.isArray(d.feedback) ? d.feedback : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [status, router])

  const filtered = feedback.filter(f => {
    if (dateFilter && f['Date'] !== dateFilter) return false
    if (employeeFilter && f['Start Call'] !== employeeFilter) return false
    if (unassignedOnly && f['Start Call']) return false
    if (statusFilter && f['وضع المكالمه'] !== statusFilter) return false
    if (search && !Object.values(f).some(v => String(v || '').toLowerCase().includes(search.toLowerCase()))) return false
    return true
  })
  const totalPages = Math.ceil(filtered.length / pageSize)
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  async function handleSubmit(e) {
    e.preventDefault()
    const rating = form['تقييم الموظف']
    if (rating && parseInt(rating) < 4 && !form['ملاحظات']?.trim()) {
      alert('برجاء كتابة السبب في ملاحظات')
      return
    }
    function to12h(t) {
      if (!t) return t
      const [h, m] = t.split(':').map(Number)
      const ap = h >= 12 ? 'PM' : 'AM'
      const h12 = h % 12 || 12
      return `${h12}:${String(m).padStart(2, '0')} ${ap}`
    }

    setSaving(true)
    const payload = { ...form }
    let notes = payload['ملاحظات'] || ''
    notes = notes.replace(/\n?DATE : .+/g, '').replace(/\n?TIME : .+/g, '').replace(/\n?EMP : .+/g, '').trim()
    if (form['وضع المكالمه'] === 'متابعه في وقت محدد' && fupDate) {
      notes += `\nDATE : ${fupDate}`
      if (fupTime) notes += `\nTIME : ${to12h(fupTime)}`
      if (fupEmployee) notes += `\nEMP : ${fupEmployee}`
    }
    payload['ملاحظات'] = notes
    try {
      const url = '/api/feedback'
      const method = editId ? 'PUT' : 'POST'
      const body = editId ? { id: editId, ...payload } : payload
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) {
        setShowForm(false)
        setEditId(null)
        setForm({ ...defaultForm })
        setFupDate('')
        setFupTime('')
        setFupEmployee('')
        const d = await fetch('/api/feedback').then(r => r.json())
        setFeedback(Array.isArray(d.feedback) ? d.feedback : [])
      }
    } catch {}
    setSaving(false)
  }

  function openEdit(item) {
    const notes = item['ملاحظات'] || ''
    setFupDate((notes.match(/DATE : (\S+)/) || [])[1] || '')
    setFupTime((notes.match(/TIME : (.+)/) || [])[1] || '')
    setFupEmployee((notes.match(/EMP : (\S+)/) || [])[1] || '')
    setForm({ ...defaultForm, ...item })
    setEditId(item.id)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditId(null)
    setForm({ ...defaultForm })
    setFupDate('')
    setFupTime('')
    setFupEmployee('')
  }

  async function assignIssue(id, employee) {
    setAssigning(id)
    try {
      const res = await fetch('/api/feedback', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, 'Start Call': employee })
      })
      if (res.ok) {
        const d = await fetch('/api/feedback').then(r => r.json())
        setFeedback(Array.isArray(d.feedback) ? d.feedback : [])
      }
    } catch {}
    setAssigning(null)
  }

  function toggleSelect(id) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selected.size === paged.length) { setSelected(new Set()); return }
    setSelected(new Set(paged.map(f => f.id)))
  }

  async function applyBatch() {
    const updates = {}
    for (const key of ['Start Call', '2nd Call', '3rd call', 'New sale']) {
      if (batchForm[key]) updates[key] = batchForm[key]
    }
    if (Object.keys(updates).length === 0) return
    setBatchApplying(true)
    try {
      await Promise.all([...selected].map(id =>
        fetch('/api/feedback', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, ...updates })
        })
      ))
      const d = await fetch('/api/feedback').then(r => r.json())
      setFeedback(Array.isArray(d.feedback) ? d.feedback : [])
      setSelected(new Set())
      setBatchForm({ 'Start Call': '', '2nd Call': '', '3rd call': '', 'New sale': '' })
    } catch {}
    setBatchApplying(false)
  }

  async function handleImport(file) {
    setImporting(true)
    setImportMsg('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/feedback/import', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok) {
        setImportMsg(`Imported ${data.count} records`)
        const d = await fetch('/api/feedback').then(r => r.json())
        setFeedback(Array.isArray(d.feedback) ? d.feedback : [])
      } else {
        setImportMsg(`Error: ${data.error}`)
      }
    } catch (err) {
      setImportMsg(`Error: ${err.message}`)
    }
    setImporting(false)
    if (fileRef.current) fileRef.current.value = ''
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
                <input type="date" value={dateFilter || ''} onChange={e => { setDateFilter(e.target.value); setPage(1) }}
                  className="px-3 py-2 rounded-xl text-sm border"
                  style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                {dateFilter && (
                  <button onClick={() => { setDateFilter(''); setPage(1) }}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 flex items-center justify-center rounded-full text-xs border"
                    style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
                    <X size={10} />
                  </button>
                )}
              </div>
              <select value={employeeFilter} onChange={e => { setEmployeeFilter(e.target.value); setUnassignedOnly(false); setPage(1) }}
                className="px-3 py-2 rounded-xl text-sm border"
                style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                <option value="">All Employees</option>
                {EMPLOYEE_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <label className="flex items-center gap-1.5 text-xs cursor-pointer px-2 py-1 rounded-lg" style={{ color: 'var(--text-muted)' }}>
                <input type="checkbox" checked={unassignedOnly} onChange={e => { setUnassignedOnly(e.target.checked); setEmployeeFilter(''); setPage(1) }}
                  className="rounded" style={{ accentColor: '#f59e0b' }} />
                Unassigned
              </label>
              <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
                className="px-3 py-2 rounded-xl text-sm border"
                style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                <option value="">All Status</option>
                {SURVEY_FIELDS.find(f => f.key === 'وضع المكالمه')?.options?.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              <div className="relative">
                <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  className="w-48 pl-9 pr-3 py-2 rounded-xl text-sm border"
                  style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  placeholder="Search..." />
              </div>
              <button onClick={() => fileRef.current?.click()} disabled={importing}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
                <Upload size={16} /> {importing ? 'Importing...' : 'Import'}
              </button>
              <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImport(f) }} />
              {importMsg && (
                <span className="text-xs" style={{ color: importMsg.startsWith('Error') ? '#f87171' : '#34d399' }}>{importMsg}</span>
              )}
              <button onClick={() => { setForm({ ...defaultForm }); setEditId(null); setShowForm(true); setFupDate(''); setFupTime(''); setFupEmployee('') }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff' }}>
                <Plus size={16} /> New
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Customers', value: feedback.length, color: '#f59e0b', filter: '' },
              { label: 'تم الرد', value: feedback.filter(f => f['وضع المكالمه'] === 'تم الرد').length, color: '#34d399', filter: 'تم الرد' },
              { label: 'لم يتم الرد', value: feedback.filter(f => f['وضع المكالمه'] === 'لم يتم الرد').length, color: '#f87171', filter: 'لم يتم الرد' },
              { label: 'متابعه في وقت محدد', value: feedback.filter(f => f['وضع المكالمه'] === 'متابعه في وقت محدد').length, color: '#60a5fa', filter: 'متابعه في وقت محدد' },
            ].map((card, i) => (
              <div key={i} onClick={() => { setStatusFilter(card.filter); setPage(1) }}
                className="rounded-xl border p-4 transition-all hover:scale-[1.02] cursor-pointer"
                style={{ background: statusFilter === card.filter ? 'rgba(245,158,11,0.1)' : 'var(--bg-card)', borderColor: statusFilter === card.filter ? 'rgba(245,158,11,0.3)' : 'var(--border-color)' }}>
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{card.label}</p>
                <p className="text-2xl font-bold" style={{ color: card.color }}>{card.value}</p>
              </div>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-24"><RefreshCw size={32} className="text-amber-500 animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24 text-sm" style={{ color: 'var(--text-muted)' }}>No feedback records found</div>
          ) : (
            <>
            {selected.size > 0 && (
              <div className="mb-4 p-4 rounded-xl border flex items-center gap-3 flex-wrap" style={{ background: 'rgba(245,158,11,0.05)', borderColor: 'rgba(245,158,11,0.2)' }}>
                <span className="text-sm font-medium" style={{ color: '#f59e0b' }}>{selected.size} selected</span>
                {['Start Call','2nd Call','3rd call','New sale'].map(key => (
                  <select key={key} value={batchForm[key]} onChange={e => setBatchForm(p => ({ ...p, [key]: e.target.value }))}
                    className="px-2 py-1.5 rounded-lg text-xs border"
                    style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                    <option value="">{key}</option>
                    {EMPLOYEE_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                ))}
                <button onClick={applyBatch} disabled={batchApplying}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', opacity: batchApplying ? 0.6 : 1 }}>
                  {batchApplying ? 'Applying...' : 'Apply'}
                </button>
                <button onClick={() => { setSelected(new Set()); setBatchForm({ 'Start Call': '', '2nd Call': '', '3rd call': '', 'New sale': '' }) }}
                  className="px-3 py-1.5 rounded-lg text-xs" style={{ color: 'var(--text-muted)' }}>
                  Cancel
                </button>
            </div>
            )}
            <div className="rounded-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <style>{`.fb-table { width: 100%; } .fb-table td, .fb-table th { padding-top: 16px !important; padding-bottom: 16px !important; padding-left: 8px !important; padding-right: 8px !important; word-wrap: break-word; white-space: normal !important; }`}</style>
              <div className="overflow-x-auto" dir="ltr">
                <table className="w-full text-sm fb-table">
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)' }}>
                      <th className="px-3 w-10">
                        <input type="checkbox" checked={selected.size > 0 && selected.size === paged.length}
                          onChange={toggleSelectAll}
                          className="rounded" style={{ accentColor: '#f59e0b' }} />
                      </th>
                      <th className="px-3 text-left text-xs font-semibold tracking-wider whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>Assign</th>
                      <th className="px-3 text-left text-xs font-semibold tracking-wider whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>Date</th>
                      <th className="px-3 text-left text-xs font-semibold tracking-wider whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>Customer</th>
                      <th className="px-3 text-left text-xs font-semibold tracking-wider whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>Phone</th>
                      <th className="px-3 text-left text-xs font-semibold tracking-wider whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>Employee</th>
                      <th className="px-3 text-left text-xs font-semibold tracking-wider whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>Branch</th>
                      <th className="px-3 text-center text-xs font-semibold tracking-wider whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>Product</th>
                      <th className="px-3 text-center text-xs font-semibold tracking-wider whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>Model</th>
                      <th className="px-3 text-center text-xs font-semibold tracking-wider whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>Total</th>
                      <th className="px-3 text-center text-xs font-semibold tracking-wider whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>Status</th>
                      <th className="px-3 text-center text-xs font-semibold tracking-wider whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>Rating</th>
                      <th className="px-3 text-center text-xs font-semibold tracking-wider whitespace-nowrap" style={{ color: 'var(--text-muted)', width: 80 }}>Call</th>
                      <th className="px-3 text-left text-xs font-semibold tracking-wider whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((f, i) => (
                      <tr key={f.id || i} style={{ borderTop: '1px solid var(--border-color)' }}
                        onClick={() => openEdit(f)}
                        className="cursor-pointer hover:opacity-80 transition-opacity">
                        <td className="px-3" onClick={e => e.stopPropagation()}>
                          <input type="checkbox" checked={selected.has(f.id)}
                            onChange={() => toggleSelect(f.id)}
                            className="rounded" style={{ accentColor: '#f59e0b' }} />
                        </td>
                        <td className="px-3 text-xs whitespace-nowrap" onClick={e => e.stopPropagation()}>
                          {f['Start Call'] ? (
                            <span style={{ color: 'var(--text-secondary)' }}>{f['Start Call']}</span>
                          ) : (
                            <div style={{ position: 'relative' }}>
                              <select value="" onChange={e => { if (e.target.value) { assignIssue(f.id, e.target.value); e.target.value = ''; } }}
                                disabled={assigning === f.id}
                                className="w-[100px] border rounded px-2 py-1 text-xs"
                                style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                                <option value="">Assign</option>
                                {EMPLOYEE_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
                              </select>
                              {assigning === f.id && <span className="text-xs ml-1" style={{ color: '#f59e0b' }}>...</span>}
                            </div>
                          )}
                        </td>
                        <td className="px-3 text-xs whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>{f['Date'] || '-'}</td>
                        <td className="px-3 text-xs whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>{f['Customer'] || '-'}</td>
                        <td className="px-3 text-xs whitespace-nowrap font-mono" style={{ color: 'var(--text-secondary)' }}>{f['Customer/Phone'] || '-'}</td>
                        <td className="px-3 text-xs whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>{f['Employee'] || '-'}</td>
                        <td className="px-3 text-xs whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>{f['Branch'] || '-'}</td>
                        <td className="px-3 text-xs max-w-[200px] truncate" style={{ color: 'var(--text-secondary)' }}>{f['Order Lines/Product/Name'] || '-'}</td>
                        <td className="px-3 text-xs text-center whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>{f['Order Lines/Model'] || '-'}</td>
                        <td className="px-3 text-xs text-center font-mono whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>{f['Total'] || '-'}</td>
                        <td className="px-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium" style={
                            f['وضع المكالمه'] === 'تم الرد' ? { background: 'rgba(16,185,129,0.12)', color: '#34d399' } :
                            { background: 'rgba(239,68,68,0.12)', color: '#f87171' }
                          }>{f['وضع المكالمه'] || '-'}</span>
                        </td>
                        <td className="px-3 text-xs text-center font-mono" style={{ color: 'var(--text-secondary)' }}>{f['تقييم الموظف'] || '-'}</td>
                        <td className="px-3 text-xs text-center font-mono" style={{ width: 80, color: ['Start Call','2nd Call','3rd call','New sale'].filter(k => f[k]).length === 0 ? '#f87171' : '#f59e0b', fontWeight: 600 }}>
                          {['Start Call','2nd Call','3rd call','New sale'].filter(k => f[k]).length || 0}
                        </td>
                        <td className="px-3 text-xs max-w-[220px]" style={{ color: 'var(--text-muted)', whiteSpace: 'pre-line', lineHeight: 1.5 }}>
                          {(f['ملاحظات'] || '').split('\n').map((line, j) => {
                            if (line.startsWith('DATE :')) return <span key={j} style={{ color: '#60a5fa', fontWeight: 600 }}>{line}<br /></span>
                            if (line.startsWith('TIME :')) return <span key={j} style={{ color: '#60a5fa', fontWeight: 600 }}>{line}<br /></span>
                            if (line.startsWith('EMP :')) return <span key={j} style={{ color: '#60a5fa', fontWeight: 600 }}>{line}<br /></span>
                            return <span key={j}>{line}<br /></span>
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 px-4 py-3 border-t" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}>
                  <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
                    style={page <= 1 ? { color: 'var(--text-muted)', opacity: 0.4 } : { color: '#f59e0b', background: 'rgba(245,158,11,0.1)' }}>
                    Prev
                  </button>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{page} / {totalPages}</span>
                  <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
                    style={page >= totalPages ? { color: 'var(--text-muted)', opacity: 0.4 } : { color: '#f59e0b', background: 'rgba(245,158,11,0.1)' }}>
                    Next
                  </button>
                </div>
              )}
            </div>
            </>
          )}

          {showForm && (
            <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10" style={{ background: 'rgba(0,0,0,0.6)' }}>
              <div className="w-full max-w-6xl rounded-2xl border overflow-y-auto max-h-[90vh]" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 z-10" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                  <h2 className="text-lg font-heading font-bold" style={{ color: 'var(--text-primary)' }}>{editId ? 'Edit Feedback' : 'New Feedback'}</h2>
                  <button onClick={closeForm} className="p-1.5 rounded-lg transition-all" style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  <div>
                    <h3 className="text-xs font-semibold tracking-wider mb-3" style={{ color: '#f59e0b' }}>CUSTOMER INFO</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {['Start Call','2nd Call','3rd call','New sale','Branch','Date','Customer','Customer/Phone','Employee','Order Lines/Product/Point of Sale Category','Order Lines/Product/Name','Order Lines/Model','Total','Created By','Modified By'].map((key) => (
                        <div key={key} className={key === 'Order Lines/Product/Point of Sale Category' || key === 'Order Lines/Product/Name' ? 'md:col-span-2' : ''}>
                          <label className="block text-xs font-medium mb-1" style={{ color: READ_ONLY_FIELDS.includes(key) ? 'var(--text-muted)' : 'var(--text-muted)' }}>{key}{READ_ONLY_FIELDS.includes(key) && <span className="ml-1 opacity-50">(view)</span>}</label>
                          {['Start Call','2nd Call','3rd call','New sale'].includes(key) ? (
                            <select value={form[key] || ''} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                              className="w-full border rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                              <option value="">--</option>
                              {EMPLOYEE_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                          ) : (
                          <input value={form[key] || ''} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                            readOnly={READ_ONLY_FIELDS.includes(key)}
                            className="w-full border rounded-lg px-3 py-2 text-sm"
                            style={{ background: READ_ONLY_FIELDS.includes(key) ? 'transparent' : 'var(--bg-secondary)', borderColor: READ_ONLY_FIELDS.includes(key) ? 'transparent' : 'var(--border-color)', color: 'var(--text-primary)', cursor: READ_ONLY_FIELDS.includes(key) ? 'default' : 'text' }} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {form['وضع المكالمه'] === 'متابعه في وقت محدد' && (
                    <div className="rounded-xl border p-4" style={{ borderColor: 'rgba(96,165,250,0.2)', background: 'rgba(96,165,250,0.05)' }}>
                      <h3 className="text-xs font-semibold tracking-wider mb-3" style={{ color: '#60a5fa' }}>متابعة في وقت محدد</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>التاريخ</label>
                          <input type="date" value={fupDate} onChange={e => setFupDate(e.target.value)}
                            className="w-full border rounded-lg px-3 py-2 text-sm"
                            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>الوقت</label>
                          <input type="time" value={fupTime} onChange={e => setFupTime(e.target.value)}
                            className="w-full border rounded-lg px-3 py-2 text-sm"
                            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>الموظف</label>
                          <select value={fupEmployee} onChange={e => setFupEmployee(e.target.value)}
                            className="w-full border rounded-lg px-3 py-2 text-sm"
                            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                            <option value="">--</option>
                            {EMPLOYEE_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-xs font-semibold tracking-wider mb-3" style={{ color: '#f59e0b' }}>بيانات الاستبيان</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {SURVEY_FIELDS.map((field) => (
                        <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-4' : ''}>
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
                    <button type="button" onClick={closeForm}
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
