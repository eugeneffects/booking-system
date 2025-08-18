/**
 * Supabase 서버 클라이언트 설정
 * 서버 컴포넌트와 API 라우트에서 사용할 Supabase 클라이언트를 생성합니다.
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

/**
 * 서버 컴포넌트용 Supabase 클라이언트 생성
 * Next.js의 쿠키를 사용하여 세션을 관리합니다.
 */
export async function createServerComponentClient() {
  const cookieStore = await cookies()

  // 환경변수 확인
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase 환경변수가 설정되지 않았습니다. 더미 클라이언트를 반환합니다.')
    // 더미 클라이언트 반환
    return createServerClient<Database>(
      'https://dummy.supabase.co',
      'dummy-key',
      {
        cookies: {
          get() { return '' },
          set() {},
          remove() {},
        },
      }
    )
  }

  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // 서버 컴포넌트에서는 쿠키를 설정할 수 없으므로 무시
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // 서버 컴포넌트에서는 쿠키를 삭제할 수 없으므로 무시
          }
        },
      },
    }
  )
}

/**
 * API 라우트용 Supabase 클라이언트 생성
 * API 라우트에서 사용할 수 있는 클라이언트입니다.
 */
export async function createClient() {
  const cookieStore = await cookies()

  // 환경변수 확인
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase 환경변수가 설정되지 않았습니다.')
    throw new Error('Supabase 환경변수가 설정되지 않았습니다.')
  }

  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // API 라우트에서는 쿠키 설정이 제한될 수 있음
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // API 라우트에서는 쿠키 삭제가 제한될 수 있음
          }
        },
      },
    }
  )
}

/**
 * 서비스 역할 클라이언트 생성 (관리자 작업용)
 * 서비스 역할 키를 사용하여 RLS를 우회할 수 있습니다.
 * 주의: 클라이언트 사이드에서는 절대 사용하지 마세요!
 */
export function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  console.log('🔧 Service Role 클라이언트 생성:', {
    hasUrl: !!supabaseUrl,
    hasServiceKey: !!supabaseServiceRoleKey,
    urlPreview: supabaseUrl?.substring(0, 30) + '...',
    keyPreview: supabaseServiceRoleKey?.substring(0, 20) + '...'
  })

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('❌ Supabase 서비스 역할 환경변수가 설정되지 않았습니다.')
    throw new Error('SUPABASE_SERVICE_ROLE_KEY 환경변수가 설정되지 않았습니다.')
  }

  try {
    const client = createServerClient<Database>(
      supabaseUrl,
      supabaseServiceRoleKey,
      {
        cookies: {
          get() {
            return ''
          },
          set() {},
          remove() {},
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        db: {
          schema: 'public',
        },
      }
    )
    
    console.log('✅ Service Role 클라이언트 생성 성공')
    return client
  } catch (error) {
    console.error('💥 Service Role 클라이언트 생성 실패:', error)
    throw error
  }
}
