import { useState, useEffect } from 'react'
import { useFormStore } from '../../store/formStore'
import SchoolInput from './SchoolInput'

function createEmptyEntry(fields) {
  const entry = {}
  fields.forEach((f) => { entry[f.key] = '' })
  return entry
}

// Handle legacy string data → convert to array with one entry
function normalizeEntries(raw, fields, legacyKey = 'project') {
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string' && raw.trim()) {
    return [{ ...createEmptyEntry(fields), [legacyKey]: raw }]
  }
  return []
}

export default function MultiEntryField({ label, fieldKey, required, fields, legacyKey }) {
  const rawValue = useFormStore((s) => s.formData[fieldKey])
  const setField = useFormStore((s) => s.setField)
  const [touched, setTouched] = useState(false)

  const entries = normalizeEntries(rawValue, fields, legacyKey)

  useEffect(() => {
    const handler = () => setTouched(true)
    window.addEventListener('validate-step', handler)
    return () => window.removeEventListener('validate-step', handler)
  }, [])

  // Sync normalized data back if it was a legacy string
  useEffect(() => {
    if (typeof rawValue === 'string' && rawValue.trim()) {
      setField(fieldKey, normalizeEntries(rawValue, fields, legacyKey))
    }
  }, [])

  const updateEntry = (index, key, value) => {
    const updated = entries.map((e, i) => i === index ? { ...e, [key]: value } : e)
    setField(fieldKey, updated)
  }

  const addEntry = () => {
    setField(fieldKey, [...entries, createEmptyEntry(fields)])
  }

  const removeEntry = (index) => {
    const updated = entries.filter((_, i) => i !== index)
    setField(fieldKey, updated)
  }

  // Validation: required means at least 1 entry with all non-optional fields filled
  const hasValidEntry = entries.some((entry) =>
    fields.every((f) => f.optional || (entry[f.key] || '').trim())
  )
  const showError = required && touched && (entries.length === 0 || !hasValidEntry)

  return (
    <div className="mb-5">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {entries.length === 0 && (
        <p className="text-sm text-gray-400 mb-2">暂无记录，请点击下方按钮新增</p>
      )}

      <div className="space-y-3">
        {entries.map((entry, idx) => (
          <div key={idx} className="relative border border-gray-200 rounded-xl p-4 bg-gray-50">
            <button
              type="button"
              onClick={() => removeEntry(idx)}
              className="absolute top-2 right-2 text-gray-300 hover:text-red-400 text-lg leading-none transition-colors"
              title="删除"
            >
              &times;
            </button>
            <div className="grid grid-cols-2 gap-3">
              {fields.map((f) => (
                <div key={f.key} className={f.type === 'school' || f.fullWidth ? 'col-span-2' : ''}>
                  <label className="block text-xs text-gray-500 mb-1">
                    {f.label}
                    {f.optional && <span className="text-gray-300 ml-1">（选填）</span>}
                  </label>
                  {f.hint && <p className="text-xs text-gray-300 mb-1">{f.hint}</p>}
                  {f.type === 'school' ? (
                    <SchoolInput
                      value={entry[f.key]}
                      onChange={(val) => updateEntry(idx, f.key, val)}
                      placeholder={f.placeholder}
                    />
                  ) : f.type === 'select' ? (
                    <select
                      value={entry[f.key] || ''}
                      onChange={(e) => updateEntry(idx, f.key, e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 transition-colors bg-white"
                    >
                      <option value="">{f.placeholder || '请选择'}</option>
                      {(f.options || []).map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : f.type === 'textarea' ? (
                    <textarea
                      value={entry[f.key] || ''}
                      onChange={(e) => updateEntry(idx, f.key, e.target.value)}
                      placeholder={f.placeholder || ''}
                      rows={2}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 transition-colors resize-y"
                    />
                  ) : (
                    <input
                      type="text"
                      value={entry[f.key] || ''}
                      onChange={(e) => updateEntry(idx, f.key, e.target.value)}
                      placeholder={f.placeholder || ''}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 transition-colors"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addEntry}
        className="mt-3 px-4 py-2 text-sm border border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors w-full"
      >
        + 新增
      </button>

      {showError && <p className="text-red-500 text-xs mt-1">请至少添加一条记录，并填写必填字段</p>}
    </div>
  )
}
