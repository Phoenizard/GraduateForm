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
    <div className="min-h-screen bg-gray-50">
      {/* 问卷封面 */}
      <div className="px-6 py-10 max-w-2xl mx-auto">
        <h1 className="text-xl font-bold text-center text-gray-900 mb-6">
          飞跃手册-数学+统计26fall申请情况数据收集
        </h1>
        <div className="text-sm text-gray-700 space-y-3 leading-relaxed">
          <p>尊敬的同学们：</p>
          <p>在求学的道路上，前辈们的经验和智慧无疑是宝贵的财富。为了更好地指导和帮助未来的申请者，飞跃手册26fall项目组再次重启。通过汇总和分析学长学姐们的申请经历，我们希望能够为后来的学弟学妹们提供更加准确、详尽和有针对性的参考信息。</p>
          <p>我们的目标是通过系统化的数据收集和分析，为未来的申请者提供宝贵的参考，帮助他们在研究生&博士申请过程中少走弯路，顺利实现自己的学术目标。我们相信，只有在充分了解和借鉴前人经验的基础上，才能更好地规划和实施自己的申请策略。</p>
          <p>在此，我们诚挚地邀请各位同学分享您们的申研经历与心得体会。这不仅是对我们项目的大力支持，更是对学弟学妹们未来发展的重要帮助。您的每一份分享，都是无价的财富。</p>
          <p>感谢同学们的支持与合作！</p>
        </div>
        <div className="mt-5 bg-white rounded-lg p-4">
          <h2 className="text-sm font-semibold text-gray-800 mb-2">项目组声明</h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            本项目组向您保证，所有数据都仅用于《诺丁汉大学数学系 飞跃手册—2026》的制作，不会外传。我们也会尽自己可能，最大程度保护你们的隐私。
          </p>
        </div>
        <div className="mt-4 text-xs text-gray-400">
          <p>项目组联系方式</p>
          <p>文: charlotte_yyw04 smyyy6@nottingham.edu.cn</p>
          <p>开发: phoenizard smyxj7@nottingham.edu.cn 19512390314</p>
        </div>
      </div>

      {/* 登录表单 */}
      <div className="px-6 pb-10 max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-lg font-bold text-center text-gray-900 mb-2">开始填写</h2>
          <p className="text-sm text-gray-500 text-center mb-6">
            输入您的手机号或邮箱即可开始，下次凭同样的信息继续编辑
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
            {loading ? '登录中…' : '登录'}
          </button>
        </form>
      </div>
    </div>
  )
}
