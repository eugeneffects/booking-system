/**
 * 서버용 인증 유틸리티 함수
 * 서버 컴포넌트와 서버 액션에서만 사용되는 함수들
 */

import { createServiceRoleClient } from '@/lib/supabase/server'
import type { Employee } from '@/types/auth'

/**
 * 이메일로 임직원 정보 조회
 * 회원가입 시 이미 등록된 임직원인지 확인하는 용도
 */
export async function getEmployeeByEmail(email: string): Promise<Employee | null> {
  try {
    // Service Role 클라이언트 사용 (RLS 우회)
    const supabase = createServiceRoleClient()
    
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('company_email', email)
      .single()
    
    if (error || !data) {
      return null
    }
    
    return data
  } catch (error) {
    console.error('임직원 정보 조회 실패:', error)
    return null
  }
}

/**
 * 사번으로 임직원 정보 조회
 */
export async function getEmployeeByNumber(employeeNumber: string): Promise<Employee | null> {
  try {
    const supabase = createServiceRoleClient()
    
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('employee_number', employeeNumber)
      .single()
    
    if (error || !data) {
      return null
    }
    
    return data
  } catch (error) {
    console.error('사번으로 임직원 조회 실패:', error)
    return null
  }
}


