/**
 * 인증 관련 타입 정의
 */

import type { Database } from './database'

// 데이터베이스 타입 별칭
type Tables = Database['public']['Tables']

// 사용자 정보 타입
export type User = {
  id: string
  email: string
  name: string
  employeeNumber: string
  department: string
  phone: string
  isAdmin: boolean
  adminRole?: 'super_admin' | 'admin'
}

// 임직원 정보 타입
export type Employee = Tables['employees']['Row']

// 관리자 정보 타입
export type AdminUser = Tables['admin_users']['Row']

// 로그인 폼 데이터
export interface LoginFormData {
  email: string
  password: string
}

// 회원가입 폼 데이터
export interface SignUpFormData {
  email: string
  password: string
  name: string
  employeeNumber: string
  department: string
  phone: string
}

// 인증 상태
export interface AuthState {
  user: User | null
  isLoading: boolean
  error: string | null
}

// 인증 컨텍스트 타입
export interface AuthContextType extends AuthState {
  signIn: (data: LoginFormData) => Promise<void>
  signUp: (data: SignUpFormData) => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}



