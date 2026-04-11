import { useState } from 'react'

const ADMIN_PASSWORDS = (import.meta.env.VITE_ADMIN_PASSWORD || '')
  .split(',')
  .map((p) => p.trim())
  .filter(Boolean)
const SESSION_KEY = 'fybk_admin_auth'

export default function AdminGate({ children }) {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(SESSION_KEY) === '1')
  const [input, setInput] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (ADMIN_PASSWORDS.includes(input)) {
      sessionStorage.setItem(SESSION_KEY, '1')
      setAuthed(true)
    } else {
      setError('密码错误')
    }
  }

  if (authed) return children

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-8 w-full max-w-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-4">管理后台</h2>
        <input
          type="password"
          value={input}
          onChange={(e) => { setInput(e.target.value); setError('') }}
          placeholder="请输入管理密码"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        <button
          type="submit"
          className="mt-4 w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          进入
        </button>
      </form>
    </div>
  )
}
