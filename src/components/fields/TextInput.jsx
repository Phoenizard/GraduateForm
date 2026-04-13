import { useState, useEffect } from 'react'
import { useFormStore } from '../../store/formStore'

export default function TextInput({ label, fieldKey, required, placeholder, multiline, rows = 4, hint }) {
  const value = useFormStore((s) => s.formData[fieldKey] || '')
  const setField = useFormStore((s) => s.setField)
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    const handler = () => setTouched(true)
    window.addEventListener('validate-step', handler)
    return () => window.removeEventListener('validate-step', handler)
  }, [])

  const showError = required && touched && !value.trim()
  const Tag = multiline ? 'textarea' : 'input'

  return (
    <div className="mb-5">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {hint && <p className="text-xs text-gray-400 mb-2">{hint}</p>}
      <Tag
        className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors
          ${showError ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
        value={value}
        placeholder={placeholder}
        rows={multiline ? rows : undefined}
        onChange={(e) => setField(fieldKey, e.target.value)}
        onBlur={() => setTouched(true)}
      />
      {showError && <p className="text-red-500 text-xs mt-1">此项为必填</p>}
    </div>
  )
}
