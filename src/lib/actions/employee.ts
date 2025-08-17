/**
 * 임직원 관리 Server Actions
 */

'use server'

import { createServiceRoleClient } from '@/lib/supabase/server'
import type { 
  Employee, 
  CreateEmployeeData, 
  UpdateEmployeeData, 
  EmployeeListParams,
  EmployeeListResponse,
  EmployeeImportResult,
  ExcelEmployeeData
} from '@/types/employee'

/**
 * 임직원 목록 조회
 */
export async function getEmployees(params: EmployeeListParams = {}): Promise<EmployeeListResponse> {
  try {
    const supabase = createServiceRoleClient()
    const { page = 1, limit = 20, search, department, is_active } = params

    let query = supabase
      .from('employees')
      .select('*', { count: 'exact' })

    // 검색 조건 추가
    if (search) {
      query = query.or(`name.ilike.%${search}%,employee_number.ilike.%${search}%,company_email.ilike.%${search}%`)
    }

    if (department) {
      query = query.eq('department', department)
    }

    if (typeof is_active === 'boolean') {
      query = query.eq('is_active', is_active)
    }

    // 페이징 및 정렬
    const offset = (page - 1) * limit
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('임직원 목록 조회 실패:', error)
      throw new Error(error.message)
    }

    const totalPages = Math.ceil((count || 0) / limit)

    return {
      employees: data || [],
      total: count || 0,
      page,
      limit,
      totalPages
    }
  } catch (error) {
    console.error('임직원 목록 조회 오류:', error)
    throw error
  }
}

/**
 * 임직원 단일 조회
 */
export async function getEmployee(id: string): Promise<Employee | null> {
  try {
    const supabase = createServiceRoleClient()
    
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('임직원 조회 실패:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('임직원 조회 오류:', error)
    return null
  }
}

/**
 * 임직원 생성
 */
export async function createEmployee(data: CreateEmployeeData): Promise<Employee> {
  try {
    const supabase = createServiceRoleClient()

    // 중복 확인
    const { data: existing } = await supabase
      .from('employees')
      .select('id')
      .or(`employee_number.eq.${data.employee_number},company_email.eq.${data.company_email}`)
      .single()

    if (existing) {
      throw new Error('이미 존재하는 사번 또는 이메일입니다.')
    }

    const { data: newEmployee, error } = await supabase
      .from('employees')
      .insert({
        ...data,
        is_active: data.is_active ?? true
      })
      .select()
      .single()

    if (error) {
      console.error('임직원 생성 실패:', error)
      throw new Error(error.message)
    }

    return newEmployee
  } catch (error) {
    console.error('임직원 생성 오류:', error)
    throw error
  }
}

/**
 * 임직원 정보 수정
 */
export async function updateEmployee(id: string, data: UpdateEmployeeData): Promise<Employee> {
  try {
    const supabase = createServiceRoleClient()

    // 중복 확인 (자신 제외)
    if (data.employee_number || data.company_email) {
      const conditions = []
      if (data.employee_number) conditions.push(`employee_number.eq.${data.employee_number}`)
      if (data.company_email) conditions.push(`company_email.eq.${data.company_email}`)
      
      const { data: existing } = await supabase
        .from('employees')
        .select('id')
        .or(conditions.join(','))
        .neq('id', id)
        .single()

      if (existing) {
        throw new Error('이미 존재하는 사번 또는 이메일입니다.')
      }
    }

    const { data: updatedEmployee, error } = await supabase
      .from('employees')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('임직원 수정 실패:', error)
      throw new Error(error.message)
    }

    return updatedEmployee
  } catch (error) {
    console.error('임직원 수정 오류:', error)
    throw error
  }
}

/**
 * 임직원 삭제 (비활성화)
 */
export async function deleteEmployee(id: string): Promise<void> {
  try {
    const supabase = createServiceRoleClient()

    // 실제로는 비활성화 처리
    const { error } = await supabase
      .from('employees')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      console.error('임직원 삭제 실패:', error)
      throw new Error(error.message)
    }
  } catch (error) {
    console.error('임직원 삭제 오류:', error)
    throw error
  }
}

/**
 * 부서 목록 조회
 */
export async function getDepartments(): Promise<string[]> {
  try {
    const supabase = createServiceRoleClient()
    
    const { data, error } = await supabase
      .from('employees')
      .select('department')
      .eq('is_active', true)

    if (error) {
      console.error('부서 목록 조회 실패:', error)
      return []
    }

    // 중복 제거 및 정렬
    const departments = [...new Set(data.map(item => item.department))].sort()
    return departments
  } catch (error) {
    console.error('부서 목록 조회 오류:', error)
    return []
  }
}

/**
 * 엑셀 데이터로 임직원 일괄 등록
 */
export async function importEmployeesFromExcel(excelData: ExcelEmployeeData[]): Promise<EmployeeImportResult> {
  const result: EmployeeImportResult = {
    success: 0,
    failed: 0,
    errors: [],
    imported: []
  }

  try {
    const supabase = createServiceRoleClient()

    for (let i = 0; i < excelData.length; i++) {
      const row = excelData[i]
      const rowNumber = i + 2 // Excel row number (header row = 1)

      try {
        // 데이터 검증
        if (!row.사번 || !row.이름 || !row.부서 || !row.회사이메일 || !row.연락처) {
          throw new Error('필수 정보가 누락되었습니다.')
        }

        // 이메일 형식 검증
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(row.회사이메일)) {
          throw new Error('올바르지 않은 이메일 형식입니다.')
        }

        // 중복 확인
        const { data: existing } = await supabase
          .from('employees')
          .select('id')
          .or(`employee_number.eq.${row.사번},company_email.eq.${row.회사이메일}`)
          .single()

        if (existing) {
          throw new Error('이미 존재하는 사번 또는 이메일입니다.')
        }

        // 데이터 변환
        const employeeData: CreateEmployeeData = {
          employee_number: row.사번.toString(),
          name: row.이름,
          department: row.부서,
          company_email: row.회사이메일,
          phone: row.연락처.toString(),
          is_active: row.활성상태 !== '비활성' && row.활성상태 !== 'false'
        }

        // 임직원 생성
        const newEmployee = await createEmployee(employeeData)
        result.imported.push(newEmployee)
        result.success++

      } catch (error) {
        result.failed++
        result.errors.push({
          row: rowNumber,
          data: row,
          error: error instanceof Error ? error.message : '알 수 없는 오류'
        })
      }
    }

    return result
  } catch (error) {
    console.error('엑셀 임포트 오류:', error)
    throw error
  }
}
