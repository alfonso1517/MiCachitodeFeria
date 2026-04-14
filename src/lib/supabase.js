import { createClient } from '@supabase/supabase-js'

// Las credenciales vienen del archivo .env (nunca hardcodeadas aquí)
const url  = import.meta.env.VITE_SUPABASE_URL
const key  = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(url, key)
