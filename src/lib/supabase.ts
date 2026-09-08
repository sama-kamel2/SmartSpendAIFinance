import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

export type Transaction = {
  id: string
  user_id: string
  type: 'income' | 'expense'
  amount: number
  category_id: string | null
  category_name: string
  payment_method: string
  notes: string | null
  transaction_date: string
  created_at: string
  updated_at: string
}

export type Category = {
  id: string
  user_id: string
  name: string
  type: 'income' | 'expense'
  icon: string
  color: string
  is_default: boolean
  created_at: string
}

export type Budget = {
  id: string
  user_id: string
  category_id: string | null
  category_name: string
  limit_amount: number
  period_month: string
  created_at: string
  updated_at: string
}

export type Profile = {
  id: string
  display_name: string | null
  avatar_url: string | null
  currency: string
  theme: string
  language: string
  profile_type: string | null
  setup_completed: boolean
  wizard_data: Record<string, number | string | null> | null
  notify_budget: boolean
  notify_summary: boolean
  notify_saving: boolean
  notify_bills: boolean
}
