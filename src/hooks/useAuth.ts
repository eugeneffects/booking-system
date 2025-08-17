/**
 * 인증 관련 커스텀 훅
 * 클라이언트 컴포넌트에서 인증 기능을 사용하기 위한 훅
 */

'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { transformSupabaseUserClient } from '@/lib/auth/client-utils'
import { useAuthStore } from '@/store/authStore'
import type { LoginFormData, SignUpFormData } from '@/types/auth'

/**
 * useAuth 훅
 * 인증 상태와 관련 함수들을 제공합니다.
 */
export function useAuth() {
  const router = useRouter()
  const { user, isLoading, isInitialized, setUser, setLoading, setInitialized, reset } = useAuthStore()
  

  /**
   * 로그인
   */
  const signIn = useCallback(async (formData: LoginFormData) => {
    console.log('🔐 로그인 시작:', formData.email)
    setLoading(true)
    
    try {
      const supabase = createClient()
      console.log('📡 로그인용 Supabase 클라이언트 생성')
      
      const { data: signInData, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })
      
      console.log('🔍 로그인 결과:', { 
        success: !error, 
        error: error?.message,
        hasUser: !!signInData?.user,
        userEmail: signInData?.user?.email 
      })
      
      if (error) {
        console.error('❌ 로그인 실패:', error.message)
        // 세션/스토어 정리로 오동작 차단
        try { await supabase.auth.signOut() } catch {}
        reset()
        toast.error(error.message || '로그인에 실패했습니다.')
        return { success: false, error: error.message }
      }

      // 로그인 성공 → employees 테이블 확인 및 생성
      const sessionUser = signInData.user
      if (sessionUser) {
        console.log('🔍 employees 테이블에서 사용자 확인 중...')
        
        // auth.users의 metadata에서 직접 사용자 정보 추출
        const metadata = sessionUser.user_metadata || {}
        console.log('🔍 auth.users metadata:', metadata)
        
        const userData = {
          id: sessionUser.id,
          email: sessionUser.email || '',
          name: metadata.name || sessionUser.email?.split('@')[0] || 'Unknown',
          employeeNumber: metadata.employee_number || '',
          department: metadata.department || '',
          phone: metadata.phone || '',
          isAdmin: false,
        }
        
        console.log('✅ auth.users metadata에서 사용자 정보 추출:', userData)
        
        setUser(userData)
        

      }

      toast.success('로그인되었습니다.')
      console.log('🚀 신청 현황 페이지로 이동')
      router.push('/applications')
      return { success: true }
    } catch (error) {
      const message = '로그인 중 오류가 발생했습니다.'
      console.error('💥 로그인 에러:', error)
      toast.error(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }, [setUser, setLoading, router, reset])
  
  /**
   * 회원가입
   */
  const signUp = useCallback(async (data: SignUpFormData) => {
    console.log('📝 회원가입 시작:', data.email)
    setLoading(true)
    
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
      
      console.log('🔍 회원가입 결과:', { 
        success: !error, 
        error: error?.message,
        hasUser: !!signUpData?.user,
        userEmail: signUpData?.user?.email 
      })
      
      if (error) {
        console.error('❌ 회원가입 실패:', error.message)
        toast.error(error.message || '회원가입에 실패했습니다.')
        return { success: false, error: error.message }
      }

      // 회원가입 성공 후 자동 로그인 처리
      if (signUpData.user) {
        console.log('🔐 회원가입 후 자동 로그인 처리')
        console.log('📊 회원가입 사용자 데이터:', {
          user: signUpData.user,
          metadata: signUpData.user.user_metadata
        })
        
        // 사용자 정보 설정
        const metadata = signUpData.user.user_metadata || {}
        console.log('🔍 추출된 metadata:', metadata)
        
        const userData = {
          id: signUpData.user.id,
          email: signUpData.user.email || '',
          name: metadata.name || '',
          employeeNumber: metadata.employee_number || '',
          department: metadata.department || '',
          phone: metadata.phone || '',
          isAdmin: false,
        }
        
        console.log('👤 회원가입 후 사용자 정보 설정:', userData)
        setUser(userData)
        
        // employees 테이블에 정보 생성 (Service Role 사용)
        console.log('🔨 임직원 정보 생성 시작...')
        
        // metadata에 필요한 정보가 있는지 확인
        if (!metadata.name || !metadata.employee_number || !metadata.department) {
          console.warn('⚠️ 회원가입 시 필수 정보가 누락됨:', {
            hasName: !!metadata.name,
            hasEmployeeNumber: !!metadata.employee_number,
            hasDepartment: !!metadata.department,
            hasPhone: !!metadata.phone
          })
        }
        
        try {
          console.log('🔄 auth.users → employees 동기화 시작...')
          
          const syncClient = await fetch('/api/sync-employee', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: signUpData.user.id })
          })
          
          const syncResult = await syncClient.json()
          
          if (syncClient.ok && syncResult.success) {
            console.log('✅ employees 테이블 동기화 성공:', syncResult.data)
          } else {
            console.error('❌ employees 테이블 동기화 실패:', syncResult.error)
            // 동기화 실패해도 회원가입은 성공으로 처리
          }
        } catch (syncError) {
          console.error('💥 employees 동기화 중 오류:', syncError)
          // 동기화 오류해도 회원가입은 성공으로 처리
        }
        
        toast.success('회원가입이 완료되었습니다!')
        console.log('🚀 신청 현황 페이지로 이동')
        router.push('/applications')
      } else {
        toast.success('회원가입이 완료되었습니다. 로그인해주세요.')
        router.push('/')
      }
      
      return { success: true }
    } catch (error) {
      const message = '회원가입 중 오류가 발생했습니다.'
      console.error('💥 회원가입 에러:', error)
      toast.error(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }, [setLoading, router, setUser])
  
  /**
   * 로그아웃
   */
  const signOut = useCallback(async () => {
    setLoading(true)
    
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      reset()
      toast.success('로그아웃되었습니다.')
    } catch (error) {
      toast.error('로그아웃 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }, [reset, setLoading])
  
  /**
   * 인증 상태 초기화 및 리스너 설정
   */
  useEffect(() => {
    let mounted = true
    let subscription: any
    let completedInit = false
    
    console.log('🔄 useAuth 초기화 시작')
    
    const initAuth = async () => {
      try {
        const supabase = createClient()
        
        // 인증 상태 변경 리스너 먼저 설정
        console.log('👂 onAuthStateChange 리스너 설정')
        const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('🔄 Auth state changed:', event, session?.user?.email)
            
            if (!mounted) return
            
            if (event === 'SIGNED_IN' && session?.user) {
              console.log('✅ 리스너에서 로그인 감지:', session.user.email)
              
              // employees 테이블에서 사용자 정보 조회
              try {
                const supabase = createClient()
                const { data: employee, error: employeeError } = await supabase
                  .from('employees')
                  .select('*')
                  .eq('id', session.user.id)
                  .single()
                
                console.log('🔍 리스너에서 employees 조회:', { found: !!employee, error: employeeError?.message })
                
                let userData
                if (employee) {
                  // employees 테이블에 정보가 있으면 그것을 사용
                  userData = {
                    id: employee.id,
                    email: employee.company_email,
                    name: employee.name,
                    employeeNumber: employee.employee_number,
                    department: employee.department,
                    phone: employee.phone,
                    isAdmin: false,
                  }
                  console.log('✅ 리스너에서 employees 테이블 정보 사용:', userData)
                } else {
                  // employees 테이블에 정보가 없으면 동기화 시도
                  console.log('🔄 리스너에서 employees 동기화 시도...')
                  
                  try {
                    const syncClient = await fetch('/api/sync-employee', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ userId: session.user.id })
                    })
                    
                    const syncResult = await syncClient.json()
                    
                    if (syncClient.ok && syncResult.success) {
                      console.log('✅ 리스너에서 employees 동기화 성공:', syncResult.data)
                      userData = {
                        id: syncResult.data.id,
                        email: syncResult.data.company_email,
                        name: syncResult.data.name,
                        employeeNumber: syncResult.data.employee_number,
                        department: syncResult.data.department,
                        phone: syncResult.data.phone,
                        isAdmin: false,
                      }
                    } else {
                      // 동기화 실패 시 metadata 사용
                      const metadata = session.user.user_metadata || {}
                      userData = {
                        id: session.user.id,
                        email: session.user.email || '',
                        name: metadata.name || session.user.email?.split('@')[0] || 'Unknown',
                        employeeNumber: metadata.employee_number || '',
                        department: metadata.department || '',
                        phone: metadata.phone || '',
                        isAdmin: false
                      }
                      console.log('⚠️ 리스너에서 동기화 실패로 metadata 사용:', userData)
                    }
                  } catch (syncError) {
                    // 동기화 오류 시 metadata 사용
                    const metadata = session.user.user_metadata || {}
                    userData = {
                      id: session.user.id,
                      email: session.user.email || '',
                      name: metadata.name || session.user.email?.split('@')[0] || 'Unknown',
                      employeeNumber: metadata.employee_number || '',
                      department: metadata.department || '',
                      phone: metadata.phone || '',
                      isAdmin: false
                    }
                    console.log('🚨 리스너에서 동기화 오류로 metadata 사용:', userData)
                  }
                }
                
                setUser(userData)
              } catch (error) {
                console.error('💥 리스너에서 사용자 정보 조회 실패:', error)
                // 에러 발생 시 기본 정보로 설정
                const metadata = session.user.user_metadata || {}
                const userData = {
                  id: session.user.id,
                  email: session.user.email || '',
                  name: metadata.name || session.user.email?.split('@')[0] || 'Unknown',
                  employeeNumber: metadata.employee_number || '',
                  department: metadata.department || '',
                  phone: metadata.phone || '',
                  isAdmin: false
                }
                console.log('🚨 리스너에서 에러 시 기본 정보 사용:', userData)
                setUser(userData)
              }
              
              setLoading(false)
              setInitialized(true)
              completedInit = true
            } else if (event === 'SIGNED_OUT') {
              console.log('👋 리스너에서 로그아웃 감지')
              setUser(null)
              setLoading(false)
              setInitialized(true)
              completedInit = true
            } else if (event === 'INITIAL_SESSION') {
              console.log('🏁 초기 세션 로드 완료')
              if (session?.user) {
                // employees 테이블에서 사용자 정보 조회
                try {
                  const supabase = createClient()
                  const { data: employee, error: employeeError } = await supabase
                    .from('employees')
                    .select('*')
                    .eq('id', session.user.id)
                    .single()
                  
                  console.log('🔍 초기 세션에서 employees 조회:', { found: !!employee, error: employeeError?.message })
                  
                  let userData
                  if (employee) {
                    // employees 테이블에 정보가 있으면 그것을 사용
                    userData = {
                      id: employee.id,
                      email: employee.company_email,
                      name: employee.name,
                      employeeNumber: employee.employee_number,
                      department: employee.department,
                      phone: employee.phone,
                      isAdmin: false,
                    }
                    console.log('✅ 초기 세션에서 employees 테이블 정보 사용:', userData)
                  } else {
                    // employees 테이블에 정보가 없으면 metadata 사용
                    const metadata = session.user.user_metadata || {}
                    userData = {
                      id: session.user.id,
                      email: session.user.email || '',
                      name: metadata.name || session.user.email?.split('@')[0] || 'Unknown',
                      employeeNumber: metadata.employee_number || '',
                      department: metadata.department || '',
                      phone: metadata.phone || '',
                      isAdmin: false
                    }
                    console.log('⚠️ 초기 세션에서 metadata 정보 사용:', userData)
                  }
                  
                  setUser(userData)
                } catch (error) {
                  console.error('💥 초기 세션에서 사용자 정보 조회 실패:', error)
                  // 에러 발생 시 기본 정보로 설정
                  const metadata = session.user.user_metadata || {}
                  const userData = {
                    id: session.user.id,
                    email: session.user.email || '',
                    name: metadata.name || session.user.email?.split('@')[0] || 'Unknown',
                    employeeNumber: metadata.employee_number || '',
                    department: metadata.department || '',
                    phone: metadata.phone || '',
                    isAdmin: false
                  }
                  console.log('🚨 초기 세션에서 에러 시 기본 정보 사용:', userData)
                  setUser(userData)
                }
              } else {
                setUser(null)
              }
              setLoading(false)
              setInitialized(true)
              completedInit = true
            }
          }
        )
        
        subscription = authSubscription
        console.log('📡 리스너 설정 완료')
        
        // onAuthStateChange 이벤트가 오지 않는 환경 대비 - 초기 세션 직접 확인
        try {
          const { data: { session }, error } = await supabase.auth.getSession()
          console.log('🔎 getSession 초기 확인:', { hasUser: !!session?.user, error: error?.message })
          if (!mounted || completedInit) return
          
          if (session?.user) {
            const metadata = session.user.user_metadata || {}
            const userData = {
              id: session.user.id,
              email: session.user.email || '',
              name: metadata.name || session.user.email?.split('@')[0] || 'Unknown',
              employeeNumber: metadata.employee_number || '',
              department: metadata.department || '',
              phone: metadata.phone || '',
              isAdmin: false
            }
            setUser(userData)
          } else {
            setUser(null)
          }
        } catch (e) {
          console.error('🧐 getSession 호출 실패:', e)
          if (mounted && !completedInit) setUser(null)
        } finally {
          if (mounted && !completedInit) {
            setLoading(false)
            setInitialized(true)
            completedInit = true
          }
        }
        
      } catch (error) {
        console.error('💥 인증 초기화 실패:', error)
        if (mounted) {
          setUser(null)
          setLoading(false)
          setInitialized(true)
        }
      }
    }
    
    initAuth()
    
    return () => {
      mounted = false
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [])
  
  return {
    user,
    isLoading,
    isInitialized,
    isAuthenticated: !!user,
    isAdmin: user?.isAdmin || false,
    signIn,
    signUp,
    signOut,
  }
}

/**
 * 인증 필요 페이지용 훅
 * 로그인하지 않은 사용자를 메인 페이지(로그인 화면)로 리다이렉트합니다.
 */
export function useRequireAuth(redirectTo = '/') {
  const router = useRouter()
  const { user, isLoading, isInitialized } = useAuthStore()
  
  console.log('🔒 useRequireAuth:', { 
    hasUser: !!user, 
    userName: user?.name,
    isLoading, 
    isInitialized,
    redirectTo 
  })
  
  useEffect(() => {
    if (!isLoading && isInitialized && !user) {
      console.log('🚨 인증 필요 - 리다이렉트:', redirectTo)
      router.push(redirectTo)
    }
  }, [user, isLoading, isInitialized, router, redirectTo])
  
  return { user, isLoading }
}

/**
 * 관리자 권한 필요 페이지용 훅
 * 관리자가 아닌 사용자를 홈으로 리다이렉트합니다.
 */
export function useRequireAdmin() {
  const router = useRouter()
  const { user, isLoading, isInitialized } = useAuthStore()
  
  useEffect(() => {
    if (!isLoading && isInitialized) {
      if (!user) {
        router.push('/')
      } else if (!user.isAdmin) {
        toast.error('관리자 권한이 필요합니다.')
        router.push('/applications')
      }
    }
  }, [user, isLoading, isInitialized, router])
  
  return { user, isLoading, isAdmin: user?.isAdmin || false }
}

