import { useState, useEffect, useRef } from 'react'
import { useFormStore } from '../../store/formStore'

const EMPTY = []

export default function MultiChoice({ label, fieldKey, options, required, otherKey }) {
  const rawValue = useFormStore((s) => s.formData[fieldKey])
  const value = rawValue || EMPTY
  const otherText = useFormStore((s) => s.formData[otherKey] || '')
  const setField = useFormStore((s) => s.setField)
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    const handler = () => setTouched(true)
    window.addEventListener('validate-step', handler)
    return () => window.removeEventListener('validate-step', handler)
  }, [])

  const showError = required && touched && value.length === 0

  const toggle = (optValue) => {
    setTouched(true)
    const next = value.includes(optValue)
      ? value.filter((v) => v !== optValue)
      : [...value, optValue]
    setField(fieldKey, next)
    if (otherKey && optValue === 'other' && !next.includes('other')) {
      setField(otherKey, '')
    }
  }

  return (
    <div className="mb-5">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="space-y-2">
        {options.map((opt) => (
          <div key={opt.value}>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
              <input
                type="checkbox"
                checked={value.includes(opt.value)}
                onChange={() => toggle(opt.value)}
                className="accent-blue-600"
              />
              {opt.label}
            </label>
            {opt.value === 'other' && value.includes('other') && otherKey && (
              <input
                type="text"
                className="mt-1 ml-6 w-[calc(100%-1.5rem)] rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500"
                placeholder="请输入..."
                value={otherText}
                onChange={(e) => setField(otherKey, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>
      {showError && <p className="text-red-500 text-xs mt-1">此项为必填</p>}
    </div>
  )
}
