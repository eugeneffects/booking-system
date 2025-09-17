/**
 * 클라이언트용 인증 유틸리티 함수
 * 브라우저에서만 실행되는 인증 관련 함수들
 */

import { createClient } from '@/lib/supabase/client'
import type { User } from '@/types/auth'

/**
 * 클라이언트에서 Supabase 사용자를 앱 User 타입으로 변환
 */
export async function transformSupabaseUserClient(userId: string): Promise<User | null> {
  try {
    const supabase = createClient()

    // 임직원 정보 조회
    
    // 더미 클라이언트인 경우 빠른 실패
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl || supabaseUrl === 'https://dummy.supabase.co') {
      console.warn('⚠️ 더미 Supabase 클라이언트 - 사용자 정보 조회 건너뜀')
      return null
    }
    
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('id', userId)
      .single()


    if (employeeError || !employee) {
      console.error('❌ 임직원 정보 조회 실패:', employeeError)
      return null
    }

    // 관리자 여부 확인
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('employee_id', userId)
      .eq('is_active', true)
      .single()


    // User 객체 생성
    const user: User = {
      id: employee.id,
      email: employee.company_email,
      name: employee.name,
      employeeNumber: employee.employee_number,
      department: employee.department,
      phone: employee.phone,
      isAdmin: !!adminUser,
      adminRole: adminUser?.role as 'super_admin' | 'admin' | undefined,
    }

    return user
  } catch (error) {
    console.error('💥 사용자 정보 변환 실패:', error)
    return null
  }
}

/**
 * 현재 클라이언트 세션 가져오기
 */
export async function getCurrentSession() {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session
  } catch (error) {
    console.error('세션 조회 실패:', error)
    return null
  }
}

/**
 * 세션 유효성 검사
 * 클라이언트에서 주기적으로 호출하여 세션이 유효한지 확인
 */
export async function validateSession(): Promise<boolean> {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return false
    }
    
    // 세션 만료 시간 확인
    const expiresAt = new Date(session.expires_at! * 1000)
    const now = new Date()
    
    return expiresAt > now
  } catch (error) {
    console.error('세션 검증 실패:', error)
    return false
  }
}

/**
 * 클라이언트에서 현재 로그인한 사용자 정보 가져오기
 */
export async function getCurrentUserClient(): Promise<User | null> {
  try {
    const supabase = createClient()
    
    const { data: { user: authUser } } = await supabase.auth.getUser()
    
    if (!authUser) {
      return null
    }

    return await transformSupabaseUserClient(authUser.id)
  } catch (error) {
    console.error('현재 사용자 조회 실패:', error)
    return null
  }
}
