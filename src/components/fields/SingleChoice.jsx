import { useState, useEffect } from 'react'
import { useFormStore } from '../../store/formStore'

export default function SingleChoice({ label, fieldKey, options, required }) {
  const value = useFormStore((s) => s.formData[fieldKey] || '')
  const setField = useFormStore((s) => s.setField)
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    const handler = () => setTouched(true)
    window.addEventListener('validate-step', handler)
    return () => window.removeEventListener('validate-step', handler)
  }, [])

  const showError = required && touched && !value

  return (
    <div className="mb-5">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="space-y-2">
        {options.map((opt) => (
          <label
            key={opt.value}
            className="flex items-center gap-2 cursor-pointer text-sm text-gray-700"
          >
            <input
              type="radio"
              name={fieldKey}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => {
                setField(fieldKey, opt.value)
                setTouched(true)
              }}
              className="accent-blue-600"
            />
            {opt.label}
          </label>
        ))}
      </div>
      {showError && <p className="text-red-500 text-xs mt-1">此项为必填</p>}
    </div>
  )
}
