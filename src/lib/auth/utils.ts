/**
 * 서버 컴포넌트용 인증 유틸리티 함수
 */

import { createServerComponentClient } from '@/lib/supabase/server'
import type { User } from '@/types/auth'

/**
 * Supabase 사용자를 앱 User 타입으로 변환
 * 임직원 정보와 관리자 정보를 조합하여 완전한 사용자 정보를 생성합니다.
 */
export async function transformSupabaseUser(userId: string): Promise<User | null> {
  try {
    const supabase = await createServerComponentClient()

    // 임직원 정보 조회
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('id', userId)
      .single()

    if (employeeError || !employee) {
      console.error('임직원 정보 조회 실패:', employeeError)
      return null
    }

    // 관리자 여부 확인
    const { data: adminUser } = await supabase
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
    console.error('사용자 정보 변환 실패:', error)
    return null
  }
}

/**
 * 현재 로그인한 사용자 정보 가져오기
 * 서버 컴포넌트용
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    // 환경변수가 없으면 null 반환
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn('Supabase 환경변수가 설정되지 않았습니다. null을 반환합니다.')
      return null
    }

    const supabase = await createServerComponentClient()
    
    const { data: { user: authUser } } = await supabase.auth.getUser()
    
    if (!authUser) {
      return null
    }

    return await transformSupabaseUser(authUser.id)
  } catch (error) {
    console.error('현재 사용자 조회 실패:', error)
    return null
  }
}

/**
 * 관리자 권한 확인
 * 특정 역할을 가진 관리자인지 확인합니다.
 */
export async function checkAdminRole(
  userId: string,
  requiredRole?: 'super_admin' | 'admin'
): Promise<boolean> {
  try {
    const supabase = await createServerComponentClient()
    
    let query = supabase
      .from('admin_users')
      .select('role')
      .eq('employee_id', userId)
      .eq('is_active', true)
    
    if (requiredRole) {
      query = query.eq('role', requiredRole)
    }
    
    const { data, error } = await query.single()
    
    return !error && !!data
  } catch (error) {
    console.error('관리자 권한 확인 실패:', error)
    return false
  }
}



