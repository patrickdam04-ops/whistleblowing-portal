import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  // TEMP: hardcoded for storage debug
  const url = 'https://tbppzqaduyfygudhdxwo.supabase.co'
  const key =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRicHB6cWFkdXlmeWd1ZGhkeHdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxMDM5ODcsImV4cCI6MjA4NDY3OTk4N30.qXF_-7niXJ3KW_dgO3HAvPqy1z1I3uBvVGXeQYHciaE'

  const cookieStore = cookies()

  return createServerClient(url, key, {
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
  })
}
