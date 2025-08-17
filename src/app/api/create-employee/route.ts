/**
 * 임직원 정보 생성 API
 * Service Role을 사용하여 RLS를 우회하고 employees 테이블에 데이터를 삽입합니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, employee_number, name, department, company_email, phone } = body

    console.log('🔨 API: 임직원 정보 생성 요청:', { 
      id, 
      name, 
      email: company_email,
      employee_number,
      department,
      phone
    })

    // 환경 변수 확인
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    console.log('🔍 환경 변수 확인:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!serviceRoleKey,
      urlLength: supabaseUrl?.length || 0,
      keyLength: serviceRoleKey?.length || 0
    })

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('❌ 필수 환경 변수가 설정되지 않음')
      return NextResponse.json(
        { error: 'Supabase 환경 변수가 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const supabase = createServiceRoleClient()
    
    // 먼저 기존 레코드 확인
    console.log('🔍 기존 임직원 레코드 확인 중...')
    const { data: existingEmployee, error: checkError } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116은 "not found" 에러
      console.error('❌ 기존 레코드 확인 실패:', checkError)
    } else if (existingEmployee) {
      console.log('✅ 기존 임직원 레코드 발견:', existingEmployee)
      return NextResponse.json({ success: true, data: existingEmployee })
    }
    
    // Service Role로 employees 테이블에 직접 삽입
    console.log('📝 employees 테이블에 데이터 삽입 시도...')
    const { data, error } = await supabase
      .from('employees')
      .insert({
        id,
        employee_number,
        name,
        department,
        company_email,
        phone,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error('❌ API: 임직원 정보 생성 실패:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
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

    console.log('✅ API: 임직원 정보 생성 성공:', data)
    return NextResponse.json({ success: true, data })

  } catch (error) {
    console.error('💥 API: 임직원 정보 생성 오류:', error)
    return NextResponse.json(
      { 
        error: '임직원 정보 생성 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
