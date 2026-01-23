import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log('--- DEBUG SUPABASE CLIENT (BROWSER) ---')
  console.log('URL:', supabaseUrl || 'NOT SET')
  console.log('KEY:', supabaseAnonKey ? supabaseAnonKey.substring(0, 10) + '...' + supabaseAnonKey.substring(supabaseAnonKey.length - 5) : 'NOT SET')
  console.log('--------------------------')

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check your .env.local file and ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'
    )
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
