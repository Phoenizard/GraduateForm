import { useEffect, useState } from 'react'
import { useFormStore } from '../store/formStore'

export default function AutoSaveIndicator() {
  const saveStatus = useFormStore((s) => s.saveStatus)
  const [savedTime, setSavedTime] = useState('')

  useEffect(() => {
    if (saveStatus === 'saved') {
      setSavedTime(new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }))
    }
  }, [saveStatus])

  if (saveStatus === 'idle') return null

  return (
    <div className="text-xs text-right mb-2">
      {saveStatus === 'saving' && <span className="text-gray-400">保存中…</span>}
      {saveStatus === 'saved' && <span className="text-green-600">&#10003; 已保存 {savedTime}</span>}
      {saveStatus === 'error' && <span className="text-red-500">! 保存失败，请检查网络</span>}
    </div>
  )
}
