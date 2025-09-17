/**
 * 인증 관련 커스텀 훅
 * Supabase 공식 문서와 Next.js 베스트 프랙티스를 따라 구현
 */

'use client'

import { useEffect, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import type { User as SupabaseUser, Session } from '@supabase/supabase-js'
import type { User } from '@/types/auth'
import type { LoginFormData, SignUpFormData } from '@/types/auth'

/**
 * 인증 상태 관리를 위한 전역 상태
 * Context API 대신 singleton 패턴 사용 (nomadcoders 스타일)
 */
let globalAuthState: {
  user: User | null
  session: Session | null
  isLoading: boolean
  isInitialized: boolean
} = {
  user: null,
  session: null,
  isLoading: true,
  isInitialized: false,
}

// 상태 변경 리스너들
const listeners = new Set<() => void>()

// 상태 업데이트 함수
function updateAuthState(updates: Partial<typeof globalAuthState>) {
  globalAuthState = { ...globalAuthState, ...updates }
  listeners.forEach(listener => listener())
}

/**
 * Supabase 사용자를 앱 User 타입으로 변환
 */
async function transformUser(supabaseUser: SupabaseUser): Promise<User | null> {
  try {
    const supabase = createClient()
    
    // employees 테이블에서 사용자 정보 조회
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('id', supabaseUser.id)
      .single()
    
    if (employeeError || !employee) {
      console.error('❌ 임직원 정보 조회 실패:', employeeError)
      
      // employees 정보가 없더라도 admin_users에서 직접 권한 확인 (employee_id는 auth.uid()와 동일하게 관리)
      const { data: fallbackAdmins } = await supabase
        .from('admin_users')
        .select('role')
        .eq('employee_id', supabaseUser.id)
        .eq('is_active', true)

      const fallbackAdmin = fallbackAdmins && fallbackAdmins.length > 0 ? fallbackAdmins[0] : null
      
      // metadata 기반 사용자 객체 생성 + 관리자 권한 반영
      const metadata = supabaseUser.user_metadata || {}
      return {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        name: metadata.name || supabaseUser.email?.split('@')[0] || 'Unknown',
        employeeNumber: metadata.employee_number || '',
        department: metadata.department || '',
        phone: metadata.phone || '',
        isAdmin: !!fallbackAdmin,
        adminRole: fallbackAdmin?.role as 'super_admin' | 'admin' | undefined,
      }
    }
    
    // 관리자 권한 확인
    const { data: adminUsers, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('employee_id', employee.id)
      .eq('is_active', true)
    
    const adminUser = adminUsers && adminUsers.length > 0 ? adminUsers[0] : null
    
    
    return {
      id: employee.id,
      email: employee.company_email,
      name: employee.name,
      employeeNumber: employee.employee_number,
      department: employee.department,
      phone: employee.phone,
      isAdmin: !!adminUser,
      adminRole: adminUser?.role as 'super_admin' | 'admin' | undefined,
    }
  } catch (error) {
    console.error('💥 사용자 정보 변환 실패:', error)
    return null
  }
}

/**
 * 인증 상태 초기화 (한 번만 실행)
 */
let isAuthInitialized = false

async function initializeAuth() {
  if (isAuthInitialized) return
  isAuthInitialized = true
  
  
  try {
    const supabase = createClient()
    
    // 1. 현재 세션 확인
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('❌ 세션 확인 실패:', error)
      updateAuthState({ 
        user: null, 
        session: null, 
        isLoading: false, 
        isInitialized: true 
      })
      return
    }
    
    if (session?.user) {
      const user = await transformUser(session.user)
      updateAuthState({ 
        user, 
        session, 
        isLoading: false, 
        isInitialized: true 
      })
    } else {
      updateAuthState({ 
        user: null, 
        session: null, 
        isLoading: false, 
        isInitialized: true 
      })
    }
    
    // 2. 인증 상태 변경 리스너 설정
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        
        if (event === 'SIGNED_IN' && session?.user) {
          const user = await transformUser(session.user)
          updateAuthState({ user, session, isLoading: false })
        } else if (event === 'SIGNED_OUT') {
          // 로그아웃 시 전역 상태 완전 초기화
          globalAuthState = {
            user: null,
            session: null,
            isLoading: false,
            isInitialized: true,
          }
          updateAuthState({ user: null, session: null, isLoading: false })
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          const user = await transformUser(session.user)
          updateAuthState({ user, session, isLoading: false })
        } else if (event === 'USER_UPDATED' && session?.user) {
          const user = await transformUser(session.user)
          updateAuthState({ user, session, isLoading: false })
        }
      }
    )
    
    // Cleanup 함수는 필요하지 않음 (전역 리스너)
  } catch (error) {
    console.error('💥 인증 초기화 실패:', error)
    updateAuthState({ 
      user: null, 
      session: null, 
      isLoading: false, 
      isInitialized: true 
    })
  }
}

/**
 * useAuth 훅
 * 인증 상태와 관련 함수들을 제공합니다.
 */
export function useAuth() {
  const router = useRouter()
  const [, forceUpdate] = useState({})
  
  // 상태 변경 시 리렌더링
  useEffect(() => {
    const listener = () => forceUpdate({})
    listeners.add(listener)
    
    // 초기화
    initializeAuth()
    
    return () => {
      listeners.delete(listener)
    }
  }, [])
  
  /**
   * 로그인
   */
  const signIn = useCallback(async (formData: LoginFormData) => {
    updateAuthState({ isLoading: true })
    
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })
      
      if (error) {
        console.error('❌ 로그인 실패:', error.message)
        toast.error(error.message || '로그인에 실패했습니다.')
        return { success: false, error: error.message }
      }
      
      if (data.user) {
        const user = await transformUser(data.user)
        updateAuthState({ user, session: data.session, isLoading: false })
        
        // 로그인 성공 후 리다이렉트
        toast.success('로그인되었습니다.')
        if (user?.isAdmin) {
          router.push('/admin/dashboard')
        } else {
          router.push('/applications')
        }
        
        return { success: true }
      }
      
      return { success: false, error: '로그인에 실패했습니다.' }
    } catch (error) {
      const message = '로그인 중 오류가 발생했습니다.'
      console.error('💥 로그인 에러:', error)
      toast.error(message)
      return { success: false, error: message }
    } finally {
      updateAuthState({ isLoading: false })
    }
  }, [router])
  
  /**
   * 회원가입
   */
  const signUp = useCallback(async (data: SignUpFormData) => {
    updateAuthState({ isLoading: true })
    
    try {
      const supabase = createClient()
      
      const { data: signUpData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            employee_number: data.employeeNumber,
            department: data.department,
            phone: data.phone,
          },
        },
      })
      
      if (error) {
        console.error('❌ 회원가입 실패:', error.message)
        toast.error(error.message || '회원가입에 실패했습니다.')
        return { success: false, error: error.message }
      }
      
      if (signUpData.user) {
        
        // 회원가입 후 자동 로그인 처리
        const user = await transformUser(signUpData.user)
        updateAuthState({ user, session: signUpData.session, isLoading: false })
        
        // employees 테이블 동기화
        try {
          await fetch('/api/sync-employee', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: signUpData.user.id })
          })
        } catch (syncError) {
          console.error('⚠️ 임직원 정보 동기화 실패:', syncError)
        }
        
        toast.success('회원가입이 완료되었습니다!')
        router.push('/applications')
        return { success: true }
      }
      
      return { success: false, error: '회원가입에 실패했습니다.' }
    } catch (error) {
      const message = '회원가입 중 오류가 발생했습니다.'
      console.error('💥 회원가입 에러:', error)
      toast.error(message)
      return { success: false, error: message }
    } finally {
      updateAuthState({ isLoading: false })
    }
  }, [router])
  
  /**
   * 로그아웃
   */
  const signOut = useCallback(async () => {
    updateAuthState({ isLoading: true })
    
    try {
      const supabase = createClient()
      
      // Supabase 로그아웃 실행 (모든 세션 삭제)
      const { error } = await supabase.auth.signOut({
        scope: 'global' // 모든 디바이스에서 로그아웃
      })
      
      if (error) {
        console.error('❌ Supabase 로그아웃 실패:', error)
      }
      
      // 브라우저 스토리지 완전 정리
      try {
        localStorage.clear()
        sessionStorage.clear()
        
        // Supabase 관련 쿠키 삭제
        document.cookie.split(";").forEach(cookie => {
          const eqPos = cookie.indexOf("=")
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
          if (name.includes('supabase') || name.includes('sb-')) {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
          }
        })
      } catch (storageError) {
        console.warn('⚠️ 스토리지 정리 중 오류:', storageError)
      }
      
      // 전역 인증 상태 완전 초기화
      updateAuthState({ 
        user: null, 
        session: null, 
        isLoading: false 
      })
      
      toast.success('로그아웃되었습니다.')
      
      // Next.js 라우터를 사용한 리다이렉트
      router.push('/')
      
      // 추가 보안: 잠시 후 페이지 새로고침으로 완전 초기화
      setTimeout(() => {
        window.location.reload()
      }, 100)
      
    } catch (error) {
      console.error('❌ 로그아웃 실패:', error)
      toast.error('로그아웃 중 오류가 발생했습니다.')
      updateAuthState({ isLoading: false })
    }
  }, [router])
  
  return {
    user: globalAuthState.user,
    session: globalAuthState.session,
    isLoading: globalAuthState.isLoading,
    isInitialized: globalAuthState.isInitialized,
    isAuthenticated: !!globalAuthState.user,
    isAdmin: globalAuthState.user?.isAdmin || false,
    signIn,
    signUp,
    signOut,
  }
}

/**
 * 인증 필요 페이지용 훅
 * 로그인하지 않은 사용자를 로그인 페이지로 리다이렉트합니다.
 */
export function useRequireAuth() {
  const router = useRouter()
  const { user, isLoading, isInitialized } = useAuth()
  
  useEffect(() => {
    if (!isLoading && isInitialized && !user) {
      router.push('/')
    }
  }, [user, isLoading, isInitialized, router])
  
  return { user, isLoading }
}

/**
 * 관리자 권한 필요 페이지용 훅
 * 서버에서 관리자 권한을 확인하여 보호합니다.
 */
export function useRequireAdmin() {
  const router = useRouter()
  const { user, isLoading, isInitialized } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(false)
  
  // 서버에서 관리자 권한 확인
  useEffect(() => {
    if (!isLoading && isInitialized && user) {
      setIsCheckingAdmin(true)
      
      fetch('/api/auth/check-admin')
        .then(res => {
          if (!res.ok) {
            throw new Error('관리자 권한 확인 실패')
          }
          return res.json()
        })
        .then(data => {
          setIsAdmin(data.isAdmin)
          if (!data.isAdmin) {
            toast.error('관리자 권한이 필요합니다.')
            router.push('/applications')
          }
        })
        .catch(error => {
          console.error('관리자 권한 확인 실패:', error)
          // 로그아웃 상태일 수 있으므로 홈페이지로 리다이렉트
          if (error.message === '관리자 권한 확인 실패') {
            router.push('/')
          } else {
            toast.error('권한 확인 중 오류가 발생했습니다.')
            router.push('/applications')
          }
        })
        .finally(() => {
          setIsCheckingAdmin(false)
        })
    }
  }, [user, isLoading, isInitialized, router])
  
  useEffect(() => {
    if (!isLoading && isInitialized && !user) {
      router.push('/')
    }
  }, [user, isLoading, isInitialized, router])
  
  return { user, isLoading: isLoading || isCheckingAdmin, isAdmin }
}