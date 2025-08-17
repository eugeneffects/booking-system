/**
 * 인증 상태 관리 스토어
 * Zustand를 사용하여 전역 인증 상태를 관리합니다.
 */

import { create } from 'zustand'
import type { User } from '@/types/auth'

interface AuthStore {
  // 상태
  user: User | null
  isLoading: boolean
  isInitialized: boolean
  
  // 액션
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setInitialized: (initialized: boolean) => void
  reset: () => void
}

/**
 * 인증 스토어
 * 세션 기반으로만 동작하며 localStorage를 사용하지 않습니다.
 */
export const useAuthStore = create<AuthStore>((set) => ({
  // 초기 상태
  user: null,
  isLoading: true, // 처음에는 로딩 상태로 시작
  isInitialized: false,
  
  // 사용자 정보 설정
  setUser: (user) => {
    console.log('🏪 Store setUser 호출:', user?.name || 'null')
    set({ user })
  },
  
  // 로딩 상태 설정
  setLoading: (loading) => set({ isLoading: loading }),
  
  // 초기화 상태 설정
  setInitialized: (initialized) => set({ isInitialized: initialized }),
  
  // 상태 초기화
  reset: () => set({
    user: null,
    isLoading: false,
    isInitialized: true, // 로그아웃 후에도 초기화는 완료된 상태로 유지
  }),
}))


