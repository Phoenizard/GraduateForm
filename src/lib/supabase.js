import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export async function loginOrRegister(identifier) {
  const type = identifier.includes('@') ? 'email' : 'phone'

  const { data: existing, error: selectError } = await supabase
    .from('users')
    .select('id')
    .eq('identifier', identifier)
    .maybeSingle()

  if (selectError) throw selectError
  if (existing) return { userId: existing.id, isNew: false }

  const { data: created, error } = await supabase
    .from('users')
    .insert({ identifier, identifier_type: type })
    .select('id')
    .single()

  if (error) throw error
  return { userId: created.id, isNew: true }
}

export async function loadDraft(userId) {
  const { data } = await supabase
    .from('submissions')
    .select('id, draft, status')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data
}

export async function saveDraft(userId, submissionId, draft) {
  if (submissionId) {
    return supabase
      .from('submissions')
      .update({ draft, updated_at: new Date().toISOString() })
      .eq('id', submissionId)
  } else {
    return supabase
      .from('submissions')
      .insert({ user_id: userId, draft, status: 'draft' })
      .select('id')
      .single()
  }
}

export async function revertToDraft(submissionId) {
  return supabase
    .from('submissions')
    .update({ status: 'draft', submitted_at: null, updated_at: new Date().toISOString() })
    .eq('id', submissionId)
}

// ---- Admin 查询 ----

export async function fetchAllSubmissions() {
  const { data, error } = await supabase
    .from('submissions')
    .select('id, user_id, status, draft, submitted_at, updated_at')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function fetchUserCount() {
  const { count, error } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
  if (error) throw error
  return count || 0
}

export async function submitForm(submissionId, draft) {
  return supabase
    .from('submissions')
    .update({
      status: 'submitted',
      draft,
      submitted_at: new Date().toISOString(),
      q1_name: draft.q1,
      q2_contact_willing: draft.q2,
      q4_major: draft.q4,
      q5_degree: draft.q5,
      q6_direction: draft.q6,
      q7_region: draft.q7,
      q8_purpose: draft.q8,
      q9_destination_status: draft.q9_status,
      q9_destination: draft.q9_text,
      q11_admission: draft.q11,
      q21_apply_method: draft.q21,
    })
    .eq('id', submissionId)
}
