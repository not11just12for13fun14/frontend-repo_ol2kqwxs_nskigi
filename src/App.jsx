import { useEffect, useMemo, useState } from 'react'

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function useAnalytics() {
  const identify = async (profile) => {
    try {
      await fetch(`${API_BASE}/analytics/user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
    } catch (e) {
      console.error('identify error', e)
    }
  }

  const track = async (event) => {
    try {
      await fetch(`${API_BASE}/analytics/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      })
    } catch (e) {
      console.error('track error', e)
    }
  }

  return { identify, track }
}

function StatCard({ title, value }) {
  return (
    <div className="bg-white/70 backdrop-blur rounded-xl p-4 shadow-sm border border-white/40">
      <div className="text-sm text-slate-500">{title}</div>
      <div className="text-2xl font-semibold text-slate-800 mt-1">{value}</div>
    </div>
  )
}

function Donut({ data }) {
  const total = Object.values(data || {}).reduce((a, b) => a + b, 0)
  const entries = Object.entries(data || {})
  return (
    <div className="space-y-2">
      {entries.length === 0 && <div className="text-slate-500 text-sm">No data yet</div>}
      {entries.map(([k, v]) => (
        <div key={k} className="flex items-center gap-2">
          <div className="w-24 text-sm text-slate-600">{k}</div>
          <div className="flex-1 h-2 bg-slate-200 rounded overflow-hidden">
            <div className="h-full bg-indigo-500" style={{ width: `${total ? (v / total) * 100 : 0}%` }} />
          </div>
          <div className="w-10 text-right text-sm text-slate-600">{v}</div>
        </div>
      ))}
    </div>
  )
}

function App() {
  const { identify, track } = useAnalytics()
  const [overview, setOverview] = useState(null)
  const [userId, setUserId] = useState(() => {
    const existing = localStorage.getItem('pgrkam_uid')
    if (existing) return existing
    const uid = `anon_${Math.random().toString(36).slice(2, 10)}`
    localStorage.setItem('pgrkam_uid', uid)
    return uid
  })

  useEffect(() => {
    // Identify with demo demographics
    identify({
      user_id: userId,
      gender: 'prefer_not_to_say',
      location: 'Demo City',
      education: 'Graduate',
      skills: ['javascript', 'react', 'python'],
      channel: 'Website',
    })
    track({ user_id: userId, event_type: 'page_view', page: 'dashboard', properties: { channel: 'Website' } })
  }, [userId])

  const loadOverview = async () => {
    const res = await fetch(`${API_BASE}/analytics/overview`)
    const data = await res.json()
    setOverview(data)
  }

  useEffect(() => {
    loadOverview()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-10">
      <div className="max-w-5xl mx-auto px-4 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">PGRKAM Analytics</h1>
          <p className="text-slate-600">Real-time view of user channels, demographics, and pages accessed.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="User ID" value={userId} />
          <StatCard title="Events" value={overview?.samples?.events ?? '-'} />
          <StatCard title="Users" value={overview?.samples?.users ?? '-'} />
          <button onClick={loadOverview} className="bg-indigo-600 text-white rounded-lg px-4 py-2 shadow hover:bg-indigo-700">Refresh</button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white/70 backdrop-blur rounded-xl p-6 shadow border border-white/40">
            <div className="font-semibold text-slate-800 mb-3">Acquisition Channels</div>
            <Donut data={overview?.channels} />
          </div>
          <div className="bg-white/70 backdrop-blur rounded-xl p-6 shadow border border-white/40">
            <div className="font-semibold text-slate-800 mb-3">Pages Viewed</div>
            <Donut data={overview?.pages} />
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur rounded-xl p-6 shadow border border-white/40">
          <div className="font-semibold text-slate-800 mb-3">Demographics</div>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm font-medium text-slate-700 mb-2">Gender</div>
              <Donut data={overview?.demographics?.gender || {}} />
            </div>
            <div>
              <div className="text-sm font-medium text-slate-700 mb-2">Education</div>
              <Donut data={overview?.demographics?.education || {}} />
            </div>
            <div>
              <div className="text-sm font-medium text-slate-700 mb-2">Location</div>
              <Donut data={overview?.demographics?.location || {}} />
            </div>
          </div>
          <div className="mt-6">
            <div className="text-sm font-medium text-slate-700 mb-2">Age</div>
            <Donut data={overview?.demographics?.age_buckets || {}} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
