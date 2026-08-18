import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// `null` keeps the public page usable until environment variables are configured.
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export const isSupabaseConfigured = Boolean(supabase)

export type ApplicationStatus = 'new' | 'contacted' | 'in_progress' | 'completed' | 'cancelled'

export interface Application {
  id: string
  created_at: string
  name: string
  phone: string
  from_address: string
  to_address: string
  moving_date: string
  volume: string | null
  comment: string | null
  status: ApplicationStatus
}
