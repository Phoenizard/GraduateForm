import { useState, useEffect } from 'react'
import { fetchAllSubmissions, fetchUserCount } from '../lib/supabase'
import AdminGate from '../components/AdminGate'
import SubmissionDetail, { FIELD_LABELS } from '../components/SubmissionDetail'

const MAJOR_MAP = {
  math_2p2: '数学与应用数学（2+2）',
  math_4p0: '数学与应用数学（4+0）',
  stats: '统计',
}

const STATUS_FILTERS = [
  { value: 'all', label: '全部' },
  { value: 'submitted', label: '已提交' },
  { value: 'draft', label: '草稿' },
]

function generateCSV(submissions) {
  const headers = FIELD_LABELS.map((f) => f.label)
  const allHeaders = ['状态', '提交时间', '更新时间', ...headers]

  const rows = submissions.map((s) => {
    const d = s.draft || {}
    const fields = FIELD_LABELS.map(({ key }) => {
      const val = d[key]
      if (val == null || val === '') return ''
      if (Array.isArray(val)) return val.join('、')
      return String(val)
    })
    return [
      s.status === 'submitted' ? '已提交' : '草稿',
      s.submitted_at ? new Date(s.submitted_at).toLocaleString('zh-CN') : '',
      s.updated_at ? new Date(s.updated_at).toLocaleString('zh-CN') : '',
      ...fields,
    ]
  })

  const escape = (cell) => {
    const str = String(cell).replace(/"/g, '""')
    return str.includes(',') || str.includes('\n') || str.includes('"') ? `"${str}"` : str
  }

  const csv = [allHeaders.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))].join('\n')
  return '\uFEFF' + csv // BOM for Excel Chinese support
}

function downloadCSV(submissions) {
  const csv = generateCSV(submissions)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `问卷数据_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  )
}

function AdminContent() {
  const [submissions, setSubmissions] = useState([])
  const [userCount, setUserCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const [subs, count] = await Promise.all([fetchAllSubmissions(), fetchUserCount()])
        setSubmissions(subs)
        setUserCount(count)
      } catch (e) {
        setError('数据加载失败：' + e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">加载中…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow p-6 max-w-md">
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  const submittedCount = submissions.filter((s) => s.status === 'submitted').length
  const draftCount = submissions.filter((s) => s.status === 'draft').length
  const filtered = filter === 'all' ? submissions : submissions.filter((s) => s.status === filter)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-gray-900 mb-6">飞跃手册问卷 · 数据看板</h1>

        {/* 统计卡片 */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatCard label="已提交" value={submittedCount} color="text-green-600" />
          <StatCard label="草稿中" value={draftCount} color="text-amber-500" />
          <StatCard label="总用户" value={userCount} color="text-blue-600" />
        </div>

        {/* 工具栏 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            {STATUS_FILTERS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  filter === value
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={() => downloadCSV(submissions.filter((s) => s.status === 'submitted'))}
            className="px-4 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            导出 CSV
          </button>
        </div>

        {/* 表格 */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">姓名</th>
                <th className="px-4 py-3 font-medium">专业</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium">更新时间</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">暂无数据</td>
                </tr>
              ) : (
                filtered.map((s, i) => (
                  <tr
                    key={s.id}
                    onClick={() => setSelected(s)}
                    className="border-b border-gray-50 hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                    <td className="px-4 py-3 text-gray-900">{s.draft?.q1 || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{MAJOR_MAP[s.draft?.q4] || s.draft?.q4 || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        s.status === 'submitted'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {s.status === 'submitted' ? '已提交' : '草稿'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {s.updated_at ? new Date(s.updated_at).toLocaleString('zh-CN') : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 详情弹窗 */}
      {selected && <SubmissionDetail submission={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

export default function AdminPage() {
  return (
    <AdminGate>
      <AdminContent />
    </AdminGate>
  )
}
