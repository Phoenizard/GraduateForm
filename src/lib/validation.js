export function getRequiredFields(step, formData) {
  switch (step) {
    case 1:
      return ['q1', 'q2']
    case 2:
      return ['q4', 'q5', 'q6', 'q7', 'q8']
    case 3: {
      const fields = ['q9_status', 'q11', 'q14']
      if (formData.q9_status === 'decided') fields.push('q9_text')
      // Q10 is a group — at least one sub-field must be filled
      fields.push('_q10_group')
      return fields
    }
    case 4:
      return ['q15']
    case 5: {
      const fields = ['q21']
      if (formData.q21 === 'full' || formData.q21 === 'half') fields.push('q22')
      if (formData.q21 === 'diy') fields.push('q24')
      return fields
    }
    case 6:
      return []
    default:
      return []
  }
}

function isFieldFilled(fieldKey, formData) {
  // Special group validation for Q10 (matrix)
  if (fieldKey === '_q10_group') {
    return ['q10_gpa_pct', 'q10_gpa_4', 'q10_language', 'q10_gre']
      .some((k) => formData[k]?.trim())
  }
  const val = formData[fieldKey]
  if (Array.isArray(val)) return val.length > 0
  if (typeof val === 'string') return val.trim().length > 0
  return val != null
}

export function validateStep(step, formData) {
  const required = getRequiredFields(step, formData)
  const missing = required.filter((key) => !isFieldFilled(key, formData))
  return { valid: missing.length === 0, missing }
}

export function validateAllSteps(formData) {
  for (let step = 1; step <= 6; step++) {
    const result = validateStep(step, formData)
    if (!result.valid) {
      return { valid: false, firstFailingStep: step, missing: result.missing }
    }
  }
  return { valid: true, firstFailingStep: null, missing: [] }
}
