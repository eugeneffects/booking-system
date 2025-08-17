/**
 * Supabase 클라이언트 설정
 * 브라우저에서 사용할 Supabase 클라이언트를 생성합니다.
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

/**
 * 브라우저용 Supabase 클라이언트 생성
 * 환경변수에서 URL과 공개 키를 가져와서 클라이언트를 초기화합니다.
 */
export function createClient() {
  // 환경변수 확인
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log('🔧 Supabase 클라이언트 생성:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    url: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'undefined'
  })

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase 환경변수가 설정되지 않았습니다.')
    // 더미 클라이언트를 반환하되, auth 메서드들을 모킹
    const dummyClient = createBrowserClient<Database>(
      'https://dummy.supabase.co',
      'dummy-key',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      }
    )
    
    // auth 메서드들을 안전하게 모킹
    dummyClient.auth.getSession = async () => ({
      data: { session: null },
      error: null
    })
    
    dummyClient.auth.onAuthStateChange = () => ({
      data: { 
        subscription: { 
          id: 'dummy',
          callback: () => {},
          unsubscribe: () => {} 
        } 
      }
    })
    
    return dummyClient
  }

  console.log('✅ 실제 Supabase 클라이언트 생성')
  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        // 인증 관련 옵션
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  )
}
