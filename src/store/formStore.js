import { create } from 'zustand'

export const useFormStore = create((set, get) => ({
  userId: null,
  submissionId: null,
  formData: {},
  saveStatus: 'idle',
  currentStep: 1,
  submitted: false,
  _formVersion: 0,

  setUser: (userId, submissionId) => set({ userId, submissionId }),
  setFormData: (data) => set((s) => ({
    formData: { ...s.formData, ...data },
    _formVersion: s._formVersion + 1,
  })),
  setField: (key, value) => set((s) => ({
    formData: { ...s.formData, [key]: value },
    _formVersion: s._formVersion + 1,
  })),
  clearFields: (keys) => {
    const { formData, _formVersion } = get()
    const hasAny = keys.some((k) => k in formData)
    if (!hasAny) return
    const next = { ...formData }
    keys.forEach((k) => delete next[k])
    set({ formData: next, _formVersion: _formVersion + 1 })
  },
  setSaveStatus: (saveStatus) => set({ saveStatus }),
  setStep: (currentStep) => set({ currentStep }),
  setSubmissionId: (submissionId) => set({ submissionId }),
  setSubmitted: (submitted) => set({ submitted }),
}))
