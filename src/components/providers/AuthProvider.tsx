/**
 * 인증 Provider 컴포넌트
 * 앱 전체에서 인증 상태를 초기화합니다.
 */

'use client'

import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  // useAuth 훅을 호출하여 인증 상태 초기화
  const { isInitialized } = useAuth()
  

  // 항상 children을 렌더링 (로딩 화면은 각 페이지에서 처리)
  return <>{children}</>
}