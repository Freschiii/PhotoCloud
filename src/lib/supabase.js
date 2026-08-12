import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bjnqgcudvejnlkfoqttu.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqbnFnY3VkdmVqbmxrZm9xdHR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1NDE5NDQsImV4cCI6MjEwMjExNzk0NH0.9vST6D5i8K4NfQvckB17-0LqGy5aEEL2mscxp9gUdO4'

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('seu-projeto')
)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

