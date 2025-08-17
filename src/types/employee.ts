/**
 * 임직원 관련 타입 정의
 */

export interface Employee {
  id: string
  employee_number: string
  name: string
  department: string
  company_email: string
  phone: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateEmployeeData {
  employee_number: string
  name: string
  department: string
  company_email: string
  phone: string
  is_active?: boolean
}

export interface UpdateEmployeeData {
  employee_number?: string
  name?: string
  department?: string
  company_email?: string
  phone?: string
  is_active?: boolean
}

export interface ExcelEmployeeData {
  사번: string
  이름: string
  부서: string
  회사이메일: string
  연락처: string
  활성상태?: string
}

export interface EmployeeImportResult {
  success: number
  failed: number
  errors: Array<{
    row: number
    data: ExcelEmployeeData
    error: string
  }>
  imported: Employee[]
}

export interface EmployeeListParams {
  page?: number
  limit?: number
  search?: string
  department?: string
  is_active?: boolean
}

export interface EmployeeListResponse {
  employees: Employee[]
  total: number
  page: number
  limit: number
  totalPages: number
}

