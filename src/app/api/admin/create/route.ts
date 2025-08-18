import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: '이메일이 필요합니다.' }, { status: 400 })
    }
    
    // 서비스 역할 클라이언트 사용 (RLS 우회)
    const supabase = createServiceRoleClient()
    
    // employees 테이블에서 해당 이메일의 사용자 찾기
    const { data: targetEmployee, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('company_email', email)
      .single()
    
    if (employeeError || !targetEmployee) {
      return NextResponse.json({ 
        error: '해당 이메일의 임직원을 찾을 수 없습니다.',
        details: employeeError?.message 
      }, { status: 404 })
    }
    
    // 이미 관리자인지 확인
    const { data: existingAdmin } = await supabase
      .from('admin_users')
      .select('*')
      .eq('employee_id', targetEmployee.id)
      .single()
    
    if (existingAdmin) {
      return NextResponse.json({ 
        message: '이미 관리자입니다.',
        admin: { role: existingAdmin.role }
      })
    }
    
    // 관리자로 추가
    const { data: newAdmin, error: adminError } = await supabase
      .from('admin_users')
      .insert({
        employee_id: targetEmployee.id,
        role: 'admin',
        is_active: true
      })
      .select()
      .single()
    
    if (adminError) {
      return NextResponse.json({ 
        error: '관리자 추가 실패',
        details: adminError.message 
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: '관리자로 추가되었습니다.',
      admin: { role: newAdmin.role },
      employee: { 
        name: targetEmployee.name,
        email: targetEmployee.company_email 
      }
    })
  } catch (error) {
    console.error('관리자 생성 API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
