'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function login(
  prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return 'Email e password sono obbligatorie'
  }

  const supabase = createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  })

  if (error) {
    console.error('Errore durante il login:', error.message)
    
    // Messaggi di errore più user-friendly
    if (error.message.includes('Invalid login credentials')) {
      return 'Credenziali non valide. Verifica email e password.'
    }
    if (error.message.includes('Email not confirmed')) {
      return 'Email non confermata. Controlla la tua casella di posta.'
    }
    
    return `Errore durante il login: ${error.message}`
  }

  // Login riuscito: revalida e redirect
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
