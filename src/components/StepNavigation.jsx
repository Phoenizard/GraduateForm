import { useState } from 'react'
import { useFormStore } from '../store/formStore'
import { validateStep } from '../lib/validation'
import { saveDraft } from '../lib/supabase'

export default function StepNavigation({ onSubmit }) {
  const currentStep = useFormStore((s) => s.currentStep)
  const [saving, setSaving] = useState(false)

  const isLast = currentStep === 6

  const handleNext = () => {
    const state = useFormStore.getState()
    const { valid, missing } = validateStep(currentStep, state.formData)
    if (!valid) {
      console.log('Validation failed, missing:', missing)
      window.dispatchEvent(new CustomEvent('validate-step'))
      return
    }
    if (isLast) {
      onSubmit?.()
    } else {
      const next = currentStep + 1
      state.setStep(next)
      localStorage.setItem('fybk_step', String(next))
      window.scrollTo(0, 0)
    }
  }

  const handlePrev = () => {
    const prev = currentStep - 1
    useFormStore.getState().setStep(prev)
    localStorage.setItem('fybk_step', String(prev))
    window.scrollTo(0, 0)
  }

  const handleSaveAndExit = async () => {
    setSaving(true)
    try {
      const state = useFormStore.getState()
      const result = await saveDraft(state.userId, state.submissionId, state.formData)
      if (!state.submissionId && result?.data?.id) {
        useFormStore.getState().setSubmissionId(result.data.id)
      }
      localStorage.removeItem('fybk_user_id')
      localStorage.removeItem('fybk_identifier')
      localStorage.removeItem('fybk_step')
      window.location.reload()
    } catch {
      useFormStore.getState().setSaveStatus('error')
      setSaving(false)
    }
  }

  return (
    <div className="mt-8 pt-4 border-t border-gray-200">
      <div className="flex justify-between items-center">
        {currentStep > 1 ? (
          <button
            type="button"
            onClick={handlePrev}
            className="px-6 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            上一步
          </button>
        ) : (
          <div />
        )}
        <div className="flex gap-3">
          {isLast && (
            <button
              type="button"
              onClick={handleSaveAndExit}
              disabled={saving}
              className="px-6 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {saving ? '保存中…' : '保存并退出'}
            </button>
          )}
          <button
            type="button"
            onClick={handleNext}
            className="px-6 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {isLast ? '提交问卷' : '下一步'}
          </button>
        </div>
      </div>
    </div>
  )
}
