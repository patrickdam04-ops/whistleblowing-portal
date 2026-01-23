import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // TEMP: hardcoded for storage debug
  const supabaseUrl = 'https://tbppzqaduyfygudhdxwo.supabase.co'
  const supabaseAnonKey =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRicHB6cWFkdXlmeWd1ZGhkeHdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxMDM5ODcsImV4cCI6MjA4NDY3OTk4N30.qXF_-7niXJ3KW_dgO3HAvPqy1z1I3uBvVGXeQYHciaE'

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
