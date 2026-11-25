'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import { Users as UsersIcon, UserPlus, ShieldCheck, UserX, KeyRound, X, Loader2, ShieldAlert, CheckCircle } from 'lucide-react'
import { useLang } from '@/lib/i18n'

const ROLE_LABELS = {
  admin: { key: 'users.roleAdmin', color: '#f59e0b' },
  manager: { key: 'users.roleManager', color: '#818cf8' },
  agent: { key: 'users.roleAgent', color: '#34d399' },
}

function initials(name) {
  return (name || '?').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

export default function UsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLang()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  // add-user modal
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ username: '', name: '', password: '', role: 'agent', branch: '' })
  const [saving, setSaving] = useState(false)

  // password modal
  const [pwUser, setPwUser] = useState(null)
  const [newPass, setNewPass] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/users')
      if (!res.ok) throw new Error('Failed to load users')
      const data = await res.json()
      setUsers(data.users || [])
      setError('')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/')
    if (status === 'authenticated' && !session?.user?.isAdmin) router.push('/dashboard')
  }, [status, session, router])

  useEffect(() => { if (status === 'authenticated') load() }, [status, load])

  function flash(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 2600)
  }

  async function addUser(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setShowAdd(false)
      setForm({ username: '', name: '', password: '', role: 'agent', branch: '' })
      flash(t('users.t1'))
      load()
    } catch (e) {
      flash(`Error: ${e.message}`)
    } finally {
      setSaving(false)
    }
  }

  async function patchUser(id, body) {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const d = await res.json()
      flash(`Error: ${d.error || 'Failed'}`)
      return false
    }
    return true
  }

  async function toggleActive(u) {
    const ok = await patchUser(u.id, { active: u.active ? 0 : 1 })
    if (ok) { flash(u.active ? t('users.t2', { n: u.name }) : t('users.t3', { n: u.name })); load() }
  }

  async function changeRole(u, role) {
    const ok = await patchUser(u.id, { role })
    if (ok) { flash(t('users.t4', { n: u.name })); load() }
  }

  async function resetPassword() {
    if (!pwUser || newPass.length < 4) { flash(t('users.minPass')); return }
    const ok = await patchUser(pwUser.id, { password: newPass })
    if (ok) { flash(t('users.t5', { n: pwUser.name })); setPwUser(null); setNewPass('') }
  }

  if (status === 'loading' || status === 'unauthenticated' || !session?.user?.isAdmin) return null

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {toast && (
        <div className="fixed bottom-6 left-6 z-[80] flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium animate-slide-up"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', boxShadow: '0 10px 40px rgba(0,0,0,0.4)' }}>
          <CheckCircle size={15} className="text-emerald-400" />
          {toast}
        </div>
      )}

      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between gap-4 mb-8 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20">
              <UsersIcon size={22} className="text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-heading font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>{t('users.title')}</h1>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('users.subtitle')}</p>
            </div>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="btn-accent flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
          >
            <UserPlus size={16} />
            {t('users.add')}
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-3 px-5 py-4 rounded-xl mb-6" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <ShieldAlert size={17} className="text-red-400" />
            <span className="text-sm text-red-300">{error}</span>
          </div>
        )}

        <div className="glass rounded-2xl overflow-hidden animate-slide-up">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={24} className="animate-spin text-amber-400" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}>
                    <th className="text-right px-5 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{t('users.employee')}</th>
                    <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{t('users.username')}</th>
                    <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{t('users.role')}</th>
                    <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{t('users.status')}</th>
                    <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{t('users.created')}</th>
                    <th className="text-right px-5 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{t('users.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const r = ROLE_LABELS[u.role] || ROLE_LABELS.agent
                    return (
                      <tr key={u.id} className="border-b transition-colors" style={{ borderColor: 'var(--border-color)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-card-hover)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-9 h-9 rounded-xl text-xs font-bold shrink-0"
                              style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>
                              {initials(u.name)}
                            </div>
                            <div>
                              <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{u.name}</div>
                              {u.branch && <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{u.branch}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>{u.username}</td>
                        <td className="px-4 py-3">
                          <select
                            value={u.role}
                            onChange={(e) => changeRole(u, e.target.value)}
                            disabled={u.id === session.user.id}
                            className="text-xs px-2.5 py-1.5 rounded-lg border cursor-pointer disabled:opacity-60"
                            style={{ background: `${r.color}12`, color: r.color, borderColor: `${r.color}30` }}
                          >
                            <option value="agent">{t('users.roleAgent')}</option>
                            <option value="manager">{t('users.roleManager')}</option>
                            <option value="admin">{t('users.roleAdmin')}</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg font-medium" style={
                            u.active
                              ? { background: 'rgba(16,185,129,0.12)', color: '#34d399' }
                              : { background: 'rgba(239,68,68,0.12)', color: '#f87171' }
                          }>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: u.active ? '#34d399' : '#f87171' }} />
                            {u.active ? t('users.active') : t('users.disabled')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                          {u.created_at ? u.created_at.split('T')[0] : '—'}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => { setPwUser(u); setNewPass('') }}
                              title={t('users.changePass')}
                              className="p-2 rounded-lg cursor-pointer transition-colors"
                              style={{ color: 'var(--text-muted)', background: 'var(--bg-secondary)' }}
                            >
                              <KeyRound size={15} />
                            </button>
                            {u.id !== session.user.id && (
                              <button
                                onClick={() => toggleActive(u)}
                                title={u.active ? t('users.disabled') : t('users.active')}
                                className="p-2 rounded-lg cursor-pointer transition-colors"
                                style={{ color: u.active ? '#f87171' : '#34d399', background: 'var(--bg-secondary)' }}
                              >
                                {u.active ? <UserX size={15} /> : <ShieldCheck size={15} />}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Add user modal */}
      {showAdd && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setShowAdd(false)}>
          <div className="glass rounded-2xl p-7 w-full max-w-md animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-heading font-bold" style={{ color: 'var(--text-primary)' }}>{t('users.addTitle')}</h2>
              <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-lg cursor-pointer" style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>
            <form onSubmit={addUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>{t('users.fullName')}</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required className="w-full border rounded-xl px-3.5 py-2.5 text-sm"
                  style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>{t('users.username')}</label>
                <input
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value.replace(/\s/g, '') })}
                  required className="w-full border rounded-xl px-3.5 py-2.5 text-sm font-mono"
                  style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>{t('login.password')}</label>
                  <input
                    type="text"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required minLength={4} className="w-full border rounded-xl px-3.5 py-2.5 text-sm font-mono"
                    style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>{t('users.role')}</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full border rounded-xl px-3.5 py-2.5 text-sm cursor-pointer"
                    style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  >
                    <option value="agent">{t('users.roleAgent')}</option>
                    <option value="manager">{t('users.roleManager')}</option>
                    <option value="admin">{t('users.roleAdmin')}</option>
                  </select>
                </div>
              </div>
              <button
                type="submit" disabled={saving}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', opacity: saving ? 0.6 : 1 }}
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
                {saving ? t('users.creating') : t('users.create')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Reset password modal */}
      {pwUser && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setPwUser(null)}>
          <div className="glass rounded-2xl p-7 w-full max-w-sm animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-heading font-bold" style={{ color: 'var(--text-primary)' }}>{t('users.resetTitle')}</h2>
              <button onClick={() => setPwUser(null)} className="p-1.5 rounded-lg cursor-pointer" style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              {t('users.resetDesc')} <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{pwUser.name}</span>
            </p>
            <input
              type="text"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder={t('users.newPass')}
              className="w-full border rounded-xl px-3.5 py-2.5 text-sm font-mono mb-4"
              style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            />
            <button
              onClick={resetPassword}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff' }}
            >
              <KeyRound size={15} />
              {t('users.savePass')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
