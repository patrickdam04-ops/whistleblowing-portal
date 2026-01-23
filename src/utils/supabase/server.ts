import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  // TEMPORANEO: Credenziali hardcoded per debug
  const url = 'https://tbppzqaduyfygudhdxwo.supabase.co'
  const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRicHB6cWFkdXlmeWd1ZGhkeHdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxMDM5ODcsImV4cCI6MjA4NDY3OTk4N30.qXF_-7niXJ3KW_dgO3HAvPqy1z1I3uBvVGXeQYHciaE'

  console.log('--- DEBUG SUPABASE SERVER CLIENT ---')
  console.log('URL:', url)
  console.log('KEY PREVIEW:', key.substring(0, 10) + '...' + key.substring(key.length - 5))
  console.log('ENV NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET')
  console.log('ENV NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET')
  console.log('--------------------------')

  const cookieStore = cookies()

  // Usa i valori hardcoded direttamente dentro createServerClient
  return createServerClient(
    url,
    key,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
