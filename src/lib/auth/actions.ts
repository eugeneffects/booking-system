/**
 * 인증 관련 서버 액션
 * Next.js Server Actions를 사용하여 인증 처리
 */

'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { getEmployeeByEmail, getEmployeeByNumber } from './server-utils'
import type { LoginFormData, SignUpFormData } from '@/types/auth'

/**
 * 로그인 액션
 * 이메일과 비밀번호로 로그인을 처리합니다.
 */
export async function signIn(formData: LoginFormData) {
  const cookieStore = await cookies()
  
  // Supabase 클라이언트 생성 (쿠키 설정 가능)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )

  // 로그인 시도
  const { data, error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  })

  if (error) {
    return { error: error.message }
  }

  if (!data.user) {
    return { error: '로그인에 실패했습니다.' }
  }

  console.log('✅ 로그인 성공:', data.user.email)
  return { success: true }
}

/**
 * 회원가입 액션
 * 임직원 정보와 함께 계정을 생성합니다.
 */
export async function signUp(formData: SignUpFormData) {
  const cookieStore = await cookies()
  
  // Supabase 클라이언트 생성 (쿠키 설정 가능)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )

  try {
    // Supabase Auth에 사용자 생성
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          name: formData.name,
          employee_number: formData.employeeNumber,
          department: formData.department,
          phone: formData.phone,
        }
      }
    })
    
    if (error) {
      console.error('회원가입 실패:', error)
      return { error: error.message }
    }
    
    if (!data.user) {
      return { error: '회원가입에 실패했습니다.' }
    }
    
    console.log('✅ 회원가입 성공:', data.user.email)
    return { success: true }
  } catch (error) {
    console.error('회원가입 처리 중 오류:', error)
    return { error: '회원가입 처리 중 오류가 발생했습니다.' }
  }
}

/**
 * 로그아웃 액션
 */
export async function signOut() {
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )

  await supabase.auth.signOut()
  redirect('/')
}

/**
 * 비밀번호 재설정 이메일 발송
 */
export async function sendPasswordResetEmail(email: string) {
  const supabase = createServiceRoleClient()
  
  // 임직원 확인
  const employee = await getEmployeeByEmail(email)
  if (!employee) {
    return { error: '등록되지 않은 이메일입니다.' }
  }
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
  })
  
  if (error) {
    return { error: '비밀번호 재설정 이메일 발송에 실패했습니다.' }
  }
  
  return { success: true }
}

/**
 * 비밀번호 변경
 */
export async function updatePassword(newPassword: string) {
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
  
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })
  
  if (error) {
    return { error: '비밀번호 변경에 실패했습니다.' }
  }
  
  return { success: true }
}

