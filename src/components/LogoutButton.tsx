'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Errore logout:', error)
    } finally {
      router.push('/gestione')
      router.refresh()
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleLogout}
      className="border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-slate-100 focus-visible:ring-slate-500"
    >
      <LogOut className="w-4 h-4 mr-2" />
      Logout
    </Button>
  )
}
