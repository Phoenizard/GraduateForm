import { useState, useEffect } from 'react'
import { useFormStore } from '../../store/formStore'

export default function MatrixText({ label, rows, required }) {
  const formData = useFormStore((s) => s.formData)
  const setField = useFormStore((s) => s.setField)
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    const handler = () => setTouched(true)
    window.addEventListener('validate-step', handler)
    return () => window.removeEventListener('validate-step', handler)
  }, [])

  const allEmpty = rows.every((r) => !formData[r.key]?.trim())
  const showError = required && touched && allEmpty

  return (
    <div className="mb-5">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center gap-3">
            <span className="text-sm text-gray-600 w-16 shrink-0">{row.label}</span>
            <input
              type="text"
              className={`flex-1 rounded-lg border px-3 py-1.5 text-sm outline-none transition-colors
                ${showError ? 'border-red-400' : 'border-gray-300 focus:border-blue-500'}`}
              placeholder={row.placeholder}
              value={formData[row.key] || ''}
              onChange={(e) => setField(row.key, e.target.value)}
              onBlur={() => setTouched(true)}
            />
          </div>
        ))}
      </div>
      {showError && <p className="text-red-500 text-xs mt-1">此项为必填（可填"无"）</p>}
    </div>
  )
}
