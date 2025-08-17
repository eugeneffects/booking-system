/**
 * 인증 Provider 컴포넌트
 * 앱 전체에서 인증 상태를 관리합니다.
 */

'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isMounted, setIsMounted] = useState(false)
  
  // useAuth 훅을 호출하여 인증 상태 초기화
  const { isLoading, user, isAuthenticated } = useAuth()

  // 클라이언트 사이드 마운트 확인
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // 서버 사이드에서는 children만 렌더링
  if (!isMounted) {
    return <>{children}</>
  }

  console.log('🔒 AuthProvider 렌더링:', { 
    isLoading, 
    hasUser: !!user, 
    isAuthenticated,
    userName: user?.name 
  })

  return <>{children}</>
}
