import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const DEMO_EMAIL = 'demo@nexumstp.it'
const DEMO_PASSWORD = 'passwordNexum2026!'

async function main() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('Missing env vars. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
    process.exit(1)
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: existingUser, error: lookupError } =
    await supabase.auth.admin.getUserByEmail(DEMO_EMAIL)

  if (lookupError) {
    console.error('Errore durante il controllo utente:', lookupError)
    process.exit(1)
  }

  if (existingUser?.user) {
    console.log('Utente già presente')
    return
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
  })

  if (error) {
    console.error('Errore durante la creazione utente:', error)
    process.exit(1)
  }

  console.log('✅ Utente demo creato:', data.user?.email)
}

main().catch((error) => {
  console.error('Errore imprevisto:', error)
  process.exit(1)
})
