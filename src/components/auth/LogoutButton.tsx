/**
 * 로그아웃 버튼 컴포넌트
 * 서버 액션을 사용하여 로그아웃을 처리합니다.
 */

'use client'

import { LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export function LogoutButton() {
  const { signOut } = useAuth()

  return (
    <button
      type="button"
      className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
      onClick={async () => {
        await signOut()
      }}
    >
      <LogOut className="mr-2 h-4 w-4" />
      로그아웃
    </button>
  )
}



