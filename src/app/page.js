'use client'

import { signIn } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useLang } from '@/lib/i18n'
import LanguageToggle from '@/components/LanguageToggle'
import { HeadphonesIcon, User, Lock, AlertCircle, Eye, EyeOff, LogIn } from 'lucide-react'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLang()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { if (session) router.push('/dashboard') }, [session, router])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await signIn('credentials', { username, password, redirect: false })
      if (res?.error) {
        setError(t('login.error'))
        setLoading(false)
      } else if (res?.ok) {
        router.push('/dashboard')
        router.refresh()
      } else {
        setError(res?.error || t('login.error'))
        setLoading(false)
      }
    } catch {
      setError(t('login.connError'))
      setLoading(false)
    }
  }

  if (status === 'loading' || session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-grid" style={{ background: 'var(--bg-primary)' }}>
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-grid" style={{ background: 'var(--bg-primary)' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-48 -right-48 w-[500px] h-[500px] bg-gradient-to-b from-amber-500/8 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-48 -left-48 w-[500px] h-[500px] bg-gradient-to-t from-amber-500/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-br from-amber-500/3 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm mx-4">
        <div className="absolute -top-14 left-1/2 -translate-x-1/2">
          <LanguageToggle />
        </div>
        <div className="glass rounded-2xl p-9 animate-fade-in">
          <div className="text-center mb-9">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20 mb-5">
              <HeadphonesIcon size={28} className="text-amber-400" />
            </div>
            <h1 className="text-2xl font-heading font-bold mb-1.5 tracking-tight" style={{color: 'var(--text-primary)'}}>
              {t('login.title')}
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {t('login.subtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <User size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t('login.username')}
                autoComplete="username"
                required
                className="w-full border rounded-xl px-11 py-3.5 text-sm transition-all duration-200 focus:outline-none focus:border-amber-500/50"
                style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>

            <div className="relative">
              <Lock size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('login.password')}
                autoComplete="current-password"
                required
                className="w-full border rounded-xl px-11 py-3.5 text-sm transition-all duration-200 focus:outline-none focus:border-amber-500/50"
                style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 p-0.5 rounded cursor-pointer"
                style={{ color: 'var(--text-muted)' }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <AlertCircle size={15} className="text-red-400 shrink-0" />
                <span className="text-xs text-red-300">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#fff',
                opacity: loading ? 0.6 : 1,
                boxShadow: '0 4px 20px rgba(245,158,11,0.3)',
              }}
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-transparent rounded-full animate-spin" />
              ) : (
                <LogIn size={16} />
              )}
              {loading ? t('login.signingIn') : t('login.signin')}
            </button>
          </form>

          <p className="text-xs text-center mt-7" style={{ color: 'var(--text-muted)' }}>
            {t('login.note')}
          </p>
        </div>
      </div>
    </div>
  )
}
