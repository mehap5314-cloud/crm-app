'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import { BarChart3, Phone, Star, Users, CheckCircle, XCircle, AlertTriangle, ArrowLeft, Clock, ThumbsUp, MessageSquare, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts'

const PIE_COLORS = ['#34d399', '#f87171', '#60a5fa', '#fbbf24', '#a78bfa', '#fb923c']

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:scale-[1.02]" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center justify-center w-11 h-11 rounded-xl" style={{ background: `${color}15` }}>
          <Icon size={20} style={{ color }} />
        </div>
        <span className="text-3xl font-heading font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>{value}</span>
      </div>
      <div className="text-sm font-medium mb-0.5" style={{ color: 'var(--text-secondary)' }}>{label}</div>
      {sub && <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  )
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload) return null
  return (
    <div className="rounded-xl border px-4 py-3 text-sm shadow-xl" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
      <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <span className="font-mono font-bold">{p.value}</span></p>
      ))}
    </div>
  )
}

export default function FeedbackAnalyticsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [feedback, setFeedback] = useState([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return }
    if (status === 'authenticated') fetchFeedback()
  }, [status])

  async function fetchFeedback() {
    try {
      const res = await fetch('/api/feedback')
      const d = await res.json()
      setFeedback(Array.isArray(d.feedback) ? d.feedback : [])
    } catch {}
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent" style={{ borderColor: '#f59e0b', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  const total = feedback.length
  const ratings = feedback.map(f => parseInt(f['تقييم الموظف']) || 0).filter(r => r > 0)
  const avgRating = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : '—'

  const answered = feedback.filter(f => f['وضع المكالمه'] === 'تم الرد').length
  const notAnswered = feedback.filter(f => f['وضع المكالمه'] === 'لم يتم الرد').length
  const followUp = feedback.filter(f => f['وضع المكالمه'] === 'متابعه في وقت محدد').length
  const responseRate = total ? ((answered / total) * 100).toFixed(1) : '—'

  const empMap = {}
  const ASSIGN_FIELDS = ['Start Call', '2nd Call', '3rd call', 'New sale']
  feedback.forEach(f => {
    const assigned = ASSIGN_FIELDS.filter(k => f[k]).map(k => f[k])
    const unique = [...new Set(assigned)]
    if (unique.length === 0) unique.push('Unassigned')
    unique.forEach(emp => {
      if (!empMap[emp]) empMap[emp] = { total: 0, ratings: [], count: 0 }
      empMap[emp].count++
      const r = parseInt(f['تقييم الموظف'])
      if (r > 0) empMap[emp].ratings.push(r)
    })
  })

  const empPerf = Object.entries(empMap)
    .map(([name, d]) => ({
      name,
      count: d.count,
      avg: d.ratings.length ? (d.ratings.reduce((a, b) => a + b, 0) / d.ratings.length).toFixed(1) : '—',
      val: d.count,
    }))
    .sort((a, b) => b.val - a.val)

  const statusDist = [
    { name: 'تم الرد', value: answered },
    { name: 'لم يتم الرد', value: notAnswered },
    { name: 'متابعه', value: followUp },
    { name: 'أخرى', value: total - answered - notAnswered - followUp },
  ].filter(d => d.value > 0)

  const issueMap = {}
  feedback.forEach(f => {
    const issues = [f['مشاكل في الاسكرين'], f['مشاكل مع الموظفين'], f['اخري']].filter(Boolean)
    issues.forEach(iss => {
      issueMap[iss] = (issueMap[iss] || 0) + 1
    })
  })
  const issueData = Object.entries(issueMap)
    .map(([label, value]) => ({ label: label.length > 22 ? label.slice(0, 22) + '…' : label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  const ratingDist = [1, 2, 3, 4, 5].map(r => ({
    rating: String(r),
    count: feedback.filter(f => parseInt(f['تقييم الموظف']) === r).length,
  }))

  const yesNoFields = [
    { key: 'وضح نسبه الحمايه', label: 'الحماية' },
    { key: 'وضح مقاومه الخدوش', label: 'مقاومة الخدوش' },
    { key: 'الاحتفاظ بالاسكرين القديمه', label: 'الاحتفاظ بالسكرين' },
    { key: 'رسوم التركيب متغيرة', label: 'الرسوم متغيرة' },
    { key: 'فتره الضمان', label: 'فترة الضمان' },
    { key: 'استلم الضمان', label: 'استلام الضمان' },
    { key: 'وضح معلومه المياه والكحول', label: 'المياه والكحول' },
  ]
  const awarenessData = yesNoFields.map(f => {
    const yes = feedback.filter(fb => fb[f.key] === 'Yes').length
    const no = feedback.filter(fb => fb[f.key] === 'No').length
    return { name: f.label, Yes: yes, No: no }
  })

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.push('/dashboard/feedback')} className="p-2 rounded-xl transition-all hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-heading font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Feedback Analytics</h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{total} records • Last updated: {new Date().toLocaleDateString('en-GB')}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard icon={Phone} label="Total Feedback" value={total} color="#f59e0b" />
          <StatCard icon={Star} label="Avg Rating" value={avgRating} sub={`from ${ratings.length} ratings`} color="#34d399" />
          <StatCard icon={CheckCircle} label="Response Rate" value={responseRate !== '—' ? `${responseRate}%` : responseRate} sub={`${answered} answered`} color="#60a5fa" />
          <StatCard icon={Users} label="Employees" value={Object.keys(empMap).length} sub="active this period" color="#a78bfa" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg" style={{ background: 'rgba(52,211,153,0.1)' }}>
                <BarChart3 size={17} style={{ color: '#34d399' }} />
              </div>
              <h3 className="text-sm font-heading font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Calls per Employee</h3>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={empPerf} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="val" name="Calls" radius={[6, 6, 0, 0]} maxBarSize={36}>
                  {empPerf.map((_, i) => (
                    <Cell key={i} fill={['#34d399','#60a5fa','#fbbf24','#a78bfa','#fb923c','#f87171'][i % 6]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg" style={{ background: 'rgba(96,165,250,0.1)' }}>
                <CheckCircle size={17} style={{ color: '#60a5fa' }} />
              </div>
              <h3 className="text-sm font-heading font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Status Distribution</h3>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusDist} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" paddingAngle={3}>
                  {statusDist.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              {statusDist.map((d, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  {d.name}: <span className="font-mono font-bold" style={{ color: 'var(--text-primary)' }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg" style={{ background: 'rgba(251,191,36,0.1)' }}>
                <Star size={17} style={{ color: '#fbbf24' }} />
              </div>
              <h3 className="text-sm font-heading font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Rating Distribution</h3>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ratingDist} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="rating" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {ratingDist.map((_, i) => (
                    <Cell key={i} fill={['#f87171','#fb923c','#fbbf24','#a3e635','#34d399'][i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg" style={{ background: 'rgba(248,113,113,0.1)' }}>
                <AlertTriangle size={17} style={{ color: '#f87171' }} />
              </div>
              <h3 className="text-sm font-heading font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Top Issues</h3>
            </div>
            <div className="space-y-2.5">
              {issueData.map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: 'var(--text-primary)' }} className="truncate max-w-[200px]">{item.label}</span>
                    <span style={{ color: 'var(--text-muted)' }} className="font-mono">{item.value}</span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
                    <div className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${(item.value / Math.max(...issueData.map(d => d.value))) * 100}%`, background: 'linear-gradient(90deg, #f87171, #fb923c)' }} />
                  </div>
                </div>
              ))}
              {issueData.length === 0 && (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No issues recorded</p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border p-5 mb-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg" style={{ background: 'rgba(167,139,250,0.1)' }}>
              <ThumbsUp size={17} style={{ color: '#a78bfa' }} />
            </div>
            <h3 className="text-sm font-heading font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Customer Awareness</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left text-xs font-semibold pb-3 pr-4" style={{ color: 'var(--text-muted)' }}>Topic</th>
                  <th className="text-center text-xs font-semibold pb-3 px-4" style={{ color: 'var(--text-muted)' }}>Yes</th>
                  <th className="text-center text-xs font-semibold pb-3 px-4" style={{ color: 'var(--text-muted)' }}>No</th>
                  <th className="text-center text-xs font-semibold pb-3 pl-4" style={{ color: 'var(--text-muted)' }}>Awareness Rate</th>
                </tr>
              </thead>
              <tbody>
                {awarenessData.map((d, i) => {
                  const total = d.Yes + d.No
                  const rate = total ? ((d.Yes / total) * 100).toFixed(0) : '—'
                  return (
                    <tr key={i} style={{ borderTop: '1px solid var(--border-color)' }}>
                      <td className="py-2.5 pr-4 text-xs" style={{ color: 'var(--text-primary)' }}>{d.name}</td>
                      <td className="py-2.5 px-4 text-xs text-center font-mono" style={{ color: '#34d399' }}>{d.Yes}</td>
                      <td className="py-2.5 px-4 text-xs text-center font-mono" style={{ color: '#f87171' }}>{d.No}</td>
                      <td className="py-2.5 pl-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
                            <div className="h-full rounded-full" style={{ width: rate !== '—' ? `${rate}%` : '0%', background: rate !== '—' && parseInt(rate) >= 70 ? '#34d399' : '#f87171' }} />
                          </div>
                          <span className="text-xs font-mono font-bold" style={{ color: rate !== '—' && parseInt(rate) >= 70 ? '#34d399' : '#f87171' }}>{rate}{rate !== '—' ? '%' : ''}</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
