'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertTriangle, Loader2, X, Database, RefreshCw } from 'lucide-react'
import { useLang } from '@/lib/i18n'

export default function ImportPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLang()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [skipDuplicates, setSkipDuplicates] = useState(true)
  const [preview, setPreview] = useState(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [committing, setCommitting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [syncStatus, setSyncStatus] = useState(null)
  const [fullSyncing, setFullSyncing] = useState(false)
  const [fullSyncMsg, setFullSyncMsg] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/')
    if (status === 'authenticated' && !session?.user?.isAdmin && !session?.user?.isManager) router.push('/dashboard')
    if (status === 'authenticated' && session?.user?.isAdmin) {
      fetch('/api/sheets-sync').then(r => r.json()).then(setSyncStatus).catch(() => {})
    }
  }, [status, session, router])

  async function fullResync() {
    if (!confirm(t('import.fullSyncNote'))) return
    setFullSyncing(true)
    setFullSyncMsg('')
    try {
      const res = await fetch('/api/sheets-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      setFullSyncMsg(data.success ? `${t('import.success')} ${data.appended}` : `Error: ${data.error}`)
      if (res.ok) fetch('/api/sheets-sync').then(r => r.json()).then(setSyncStatus).catch(() => {})
    } catch (e) {
      setFullSyncMsg(`Error: ${e.message}`)
    } finally {
      setFullSyncing(false)
    }
  }

  if (status === 'loading' || status === 'unauthenticated') return null
  if (!session?.user?.isAdmin && !session?.user?.isManager) return null

  async function loadPreview(f) {
    setError('')
    setResult(null)
    setPreview(null)
    setLoadingPreview(true)
    try {
      const fd = new FormData()
      fd.append('file', f)
      fd.append('mode', 'preview')
      const res = await fetch('/api/import', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to parse file')
      setPreview(data)
    } catch (e) {
      setError(e.message)
      setFile(null)
    } finally {
      setLoadingPreview(false)
    }
  }

  function onPickFile(f) {
    setFile(f)
    setPreview(null)
    setResult(null)
    setError('')
    if (f) loadPreview(f)
  }

  async function commit() {
    if (!file || !preview) return
    const ok = confirm(t('import.btn', { n: preview.totalRows.toLocaleString('en') }) + ' — "' + file.name + '"?')
    if (!ok) return
    setCommitting(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('mode', 'commit')
      fd.append('skipDuplicates', skipDuplicates ? 'true' : 'false')
      const res = await fetch('/api/import', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Import failed')
      setResult(data)
      setFile(null)
      setPreview(null)
      if (inputRef.current) inputRef.current.value = ''
    } catch (e) {
      setError(e.message)
    } finally {
      setCommitting(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8 animate-fade-in">
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20">
            <Database size={22} className="text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-heading font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>{t('import.title')}</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('import.subtitle')}</p>
          </div>
        </div>

        {/* Google Sheet sync status (admin) */}
        {session?.user?.isAdmin && syncStatus && (
          <div className="glass rounded-2xl p-5 mb-6 animate-slide-up">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <RefreshCw size={16} style={{ color: syncStatus.ready ? '#34d399' : '#fbbf24' }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{t('import.syncTitle')}</span>
                <span className="text-xs px-2.5 py-1 rounded-lg font-medium" style={syncStatus.ready
                  ? { background: 'rgba(16,185,129,0.12)', color: '#34d399' }
                  : { background: 'rgba(251,191,36,0.12)', color: '#fbbf24' }}>
                  {syncStatus.ready ? t('import.syncReady') : t('import.syncNotConfigured')}
                </span>
              </div>
              {syncStatus.tab && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('import.syncStatus')}: {syncStatus.tab} · {t('import.syncRows')}: {(syncStatus.mirroredRows || 0).toLocaleString('en')}</span>}
              {syncStatus.lastError && <span className="text-xs text-red-300" title={syncStatus.lastErrorAt}>{t('sync.error')}: {syncStatus.lastError.slice(0, 80)}</span>}
              <button
                onClick={fullResync} disabled={fullSyncing}
                className="glass flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold ms-auto"
                style={{ color: 'var(--text-secondary)', opacity: fullSyncing ? 0.6 : 1 }}
              >
                {fullSyncing ? <Loader2 size={13} className="animate-spin" /> : <Database size={13} />}
                {fullSyncing ? t('import.fullSyncing') : t('import.fullSync')}
              </button>
            </div>
            {fullSyncMsg && <div className="text-xs mt-2" style={{ color: 'var(--accent)' }}>{fullSyncMsg}</div>}
            <div className="text-[11px] mt-2" style={{ color: 'var(--text-muted)' }}>{t('import.fullSyncNote')}</div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 px-5 py-4 rounded-xl mb-6 animate-slide-up" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <AlertTriangle size={18} className="text-red-400 shrink-0" />
            <span className="text-sm text-red-300">{error}</span>
          </div>
        )}

        {result && (
          <div className="flex items-center gap-4 px-5 py-4 rounded-xl mb-6 animate-slide-up" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}>
            <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
            <div className="text-sm">
              <div className="font-semibold text-emerald-300">{t('import.success')}</div>
              <div className="mt-1" style={{ color: 'var(--text-secondary)' }}>
                {t('import.inserted')}: <b>{(result.inserted || 0).toLocaleString('en')}</b>
                {' · '}{t('import.skipped')}: <b>{(result.skipped || 0).toLocaleString('en')}</b>
                {' · '}{t('import.fileRows2')}: <b>{(result.total || 0).toLocaleString('en')}</b>
              </div>
            </div>
            <a href="/dashboard" className="btn-accent ms-auto flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold">{t('import.goDash')}</a>
          </div>
        )}

        {/* Drop zone */}
        <div
          className={`glass rounded-2xl p-10 mb-6 cursor-pointer transition-all duration-200 animate-slide-up ${dragOver ? 'scale-[1.01]' : ''}`}
          style={{
            border: `2px dashed ${dragOver ? 'rgba(245,158,11,0.5)' : 'var(--border-color)'}`,
            background: dragOver ? 'rgba(245,158,11,0.05)' : undefined,
          }}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault(); setDragOver(false)
            const f = e.dataTransfer.files?.[0]
            if (f) onPickFile(f)
          }}
        >
          <input
            ref={inputRef} type="file" className="hidden" accept=".xlsx,.xls,.csv"
            onChange={(e) => onPickFile(e.target.files?.[0])}
          />
          <div className="flex flex-col items-center text-center gap-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20">
              {loadingPreview
                ? <Loader2 size={26} className="animate-spin text-amber-400" />
                : <UploadCloud size={26} className="text-amber-400" />}
            </div>
            <div>
              <div className="font-heading font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                {file ? file.name : t('import.drop')}
              </div>
              <div className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                {t('import.or')}
              </div>
              {file && <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>{(file.size / 1024).toFixed(0)} KB</div>}
            </div>
          </div>
        </div>

        {/* Preview */}
        {preview && (
          <div className="glass rounded-2xl p-6 md:p-8 mb-6 animate-slide-up">
            <div className="flex items-center gap-3 mb-5">
              <FileSpreadsheet size={18} className="text-emerald-400" />
              <h2 className="font-heading font-bold" style={{ color: 'var(--text-primary)' }}>{t('import.ready')}</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {[
                { label: t('import.validRows'), value: preview.totalRows, color: '#34d399' },
                { label: t('import.fileRows'), value: preview.totalFileRows, color: '#818cf8' },
                { label: t('import.mapped'), value: Object.keys(preview.mapping).length, color: '#34d399' },
                { label: t('import.unknown'), value: (preview.unknownHeaders || []).length, color: (preview.unknownHeaders || []).length ? '#fbbf24' : '#6b7280' },
              ].map((s, i) => (
                <div key={i} className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                  <div className="text-xl font-heading font-bold" style={{ color: s.color }}>{s.value.toLocaleString('en')}</div>
                  <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {(preview.unknownHeaders || []).length > 0 && (
              <div className="text-xs mb-4 px-4 py-3 rounded-xl" style={{ background: 'rgba(251,191,36,0.08)', color: '#fbbf24' }}>
                {t('import.unknownCols', { cols: preview.unknownHeaders.join(', ') })}
              </div>
            )}

            <div className="overflow-x-auto mb-6 rounded-xl border" style={{ borderColor: 'var(--border-color)' }}>
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)' }}>
                    {(preview.headerRow || []).map((h, i) => (
                      <th key={i} className="text-right px-3 py-2 whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                        {preview.mapping[i] ? (
                          <span style={{ color: '#34d399' }}>{preview.mapping[i]}</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', opacity: 0.6 }}>{String(h || '—')}</span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.sample.map((row, i) => (
                    <tr key={i} className="border-t" style={{ borderColor: 'var(--border-color)' }}>
                      {(preview.headerRow || []).map((_, ci) => (
                        <td key={ci} className="px-3 py-2 max-w-[180px] truncate" style={{ color: 'var(--text-secondary)' }}>
                          {row[preview.mapping[ci]] || ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <label className="flex items-center gap-3 mb-6 cursor-pointer w-fit">
              <input
                type="checkbox"
                checked={skipDuplicates}
                onChange={(e) => setSkipDuplicates(e.target.checked)}
                className="w-5 h-5 rounded cursor-pointer accent-amber-500"
              />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {t('import.skipDups')}
              </span>
            </label>

            <div className="flex items-center gap-3">
              <button
                onClick={commit} disabled={committing}
                className="btn-accent flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold"
                style={{ opacity: committing ? 0.6 : 1 }}
              >
                {committing ? <Loader2 size={15} className="animate-spin" /> : <Database size={15} />}
                {committing ? t('import.importing') : t('import.btn', { n: preview.totalRows.toLocaleString('en') })}
              </button>
              <button
                onClick={() => { setPreview(null); onPickFile(null); if (inputRef.current) inputRef.current.value = '' }}
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={14} /> {t('common.cancel')}
              </button>
            </div>
          </div>
        )}

        {/* Help */}
        <div className="glass rounded-2xl p-6 animate-slide-up">
          <h3 className="font-heading font-bold mb-3 text-sm" style={{ color: 'var(--text-primary)' }}>{t('import.helpTitle')}</h3>
          <ol className="text-sm space-y-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            <li>{t('import.h1')}</li>
            <li>{t('import.h2')}</li>
            <li>{t('import.h3')}</li>
            <li>{t('import.h4')}</li>
          </ol>
        </div>
      </main>
    </div>
  )
}
