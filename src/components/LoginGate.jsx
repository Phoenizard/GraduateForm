import { useState } from 'react'
import { loginOrRegister, loadDraft } from '../lib/supabase'
import { useFormStore } from '../store/formStore'

export default function LoginGate() {
  const [identifier, setIdentifier] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const setUser = useFormStore((s) => s.setUser)
  const setFormData = useFormStore((s) => s.setFormData)
  const setStep = useFormStore((s) => s.setStep)
  const setSubmitted = useFormStore((s) => s.setSubmitted)

  const validate = (val) => {
    const trimmed = val.trim()
    if (!trimmed) return false
    if (trimmed.includes('@')) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
    return /^\d{11}$/.test(trimmed)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmed = identifier.trim()
    if (!validate(trimmed)) {
      setError('请输入有效的11位手机号或邮箱地址')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { userId } = await loginOrRegister(trimmed)
      const draft = await loadDraft(userId)
      localStorage.setItem('fybk_user_id', userId)
      localStorage.setItem('fybk_identifier', trimmed)
      if (draft) {
        setUser(userId, draft.id)
        if (draft.status === 'submitted') {
          setFormData(draft.draft || {})
          setSubmitted(true)
        } else {
          setFormData(draft.draft || {})
          const savedStep = localStorage.getItem('fybk_step')
          if (savedStep) setStep(Number(savedStep))
        }
      } else {
        setUser(userId, null)
      }
    } catch (err) {
      console.error('LoginGate error:', err)
      setError('网络错误，请稍后重试：' + (err.message || err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">飞跃手册问卷 · 26Fall</h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          输入您的手机号或邮箱即可开始填写，下次凭同样的信息继续编辑
        </p>
        <input
          type="text"
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 mb-3"
          placeholder="手机号或邮箱"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          disabled={loading}
        />
        {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? '登录中…' : '开始填写'}
        </button>
      </form>
    </div>
  )
}
