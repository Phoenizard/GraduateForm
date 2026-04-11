import { useEffect, useRef } from 'react'
import { useFormStore } from '../store/formStore'
import { saveDraft } from '../lib/supabase'

export function useAutoSave() {
  const formVersion = useFormStore((s) => s._formVersion)
  const timer = useRef(null)
  const saving = useRef(false)

  useEffect(() => {
    const { userId } = useFormStore.getState()
    if (!userId || formVersion === 0) return

    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      if (saving.current) return
      saving.current = true
      useFormStore.getState().setSaveStatus('saving')
      try {
        const state = useFormStore.getState()
        const result = await saveDraft(state.userId, state.submissionId, state.formData)
        if (!state.submissionId && result?.data?.id) {
          useFormStore.getState().setSubmissionId(result.data.id)
        }
        useFormStore.getState().setSaveStatus('saved')
      } catch (err) {
        console.error('AutoSave error:', err)
        useFormStore.getState().setSaveStatus('error')
      } finally {
        saving.current = false
      }
    }, 1500)

    return () => clearTimeout(timer.current)
  }, [formVersion])
}
