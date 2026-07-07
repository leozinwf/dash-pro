"use client"

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export default function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button 
      onClick={handleLogout} 
      className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-red-600 transition"
      title="Sair da conta"
    >
      <LogOut size={18} />
      <span className="hidden sm:inline">Sair</span>
    </button>
  )
}