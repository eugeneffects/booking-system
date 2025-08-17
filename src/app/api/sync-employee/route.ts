/**
 * auth.users의 metadata를 employees 테이블로 자동 동기화 API
 * 회원가입 시 또는 로그인 시 호출하여 employees 테이블에 데이터를 생성/업데이트합니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    console.log('🔄 auth.users → employees 동기화 요청:', { userId })

    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    const supabase = createServiceRoleClient()
    
    // 1. auth.users에서 사용자 정보 조회
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId)
    
    if (authError || !authUser.user) {
      console.error('❌ auth.users 조회 실패:', authError)
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    console.log('👤 auth.users 정보:', {
      id: authUser.user.id,
      email: authUser.user.email,
      metadata: authUser.user.user_metadata
    })

    // 2. metadata에서 정보 추출
    const metadata = authUser.user.user_metadata || {}
    
    // 3. employees 테이블에 데이터 삽입/업데이트
    const employeeData = {
      id: authUser.user.id,
      employee_number: metadata.employee_number || '',
      name: metadata.name || authUser.user.email?.split('@')[0] || 'Unknown',
      department: metadata.department || '',
      company_email: authUser.user.email || '',
      phone: metadata.phone || '',
      is_active: true,
    }

    console.log('📝 employees 테이블에 삽입할 데이터:', employeeData)

    const { data, error } = await supabase
      .from('employees')
      .upsert(employeeData, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select()
      .single()

    if (error) {
      console.error('❌ employees 테이블 동기화 실패:', error)
      return NextResponse.json(
        { 
          error: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        },
        { status: 400 }
      )
    }

    console.log('✅ employees 테이블 동기화 성공:', data)
    return NextResponse.json({ 
      success: true, 
      data, 
      message: 'auth.users → employees 동기화 완료'
    })

  } catch (error) {
    console.error('💥 employees 동기화 오류:', error)
    return NextResponse.json(
      { 
        error: 'employees 동기화 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
