import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // 현재 사용자 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ isAdmin: false, error: '인증되지 않은 사용자' }, { status: 401 })
    }
    
    // employees 테이블에서 사용자 정보 확인
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id')
      .eq('id', user.id)
      .single()
    
    if (employeeError || !employee) {
      return NextResponse.json({ isAdmin: false, error: '임직원 정보 없음' }, { status: 404 })
    }
    
    // admin_users 테이블에서 관리자 권한 확인
    const { data: adminUsers } = await supabase
      .from('admin_users')
      .select('role')
      .eq('employee_id', employee.id)
      .eq('is_active', true)
    
    const isAdmin = adminUsers && adminUsers.length > 0
    const adminRole = isAdmin ? adminUsers[0].role : null
    
    return NextResponse.json({
      isAdmin,
      adminRole,
      userId: user.id
    })
  } catch (error) {
    console.error('관리자 권한 확인 오류:', error)
    return NextResponse.json({ isAdmin: false, error: '서버 오류' }, { status: 500 })
  }
}
