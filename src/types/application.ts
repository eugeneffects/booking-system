/**
 * 신청 관련 타입 정의
 */

import type { Employee } from './employee'
import type { ReservationPeriod } from './accommodation'

/**
 * 신청 상태
 */
export type ApplicationStatus = 'pending' | 'selected' | 'not_selected'

/**
 * 신청 기본 정보
 */
export interface Application {
  id: string
  employee_id: string
  reservation_period_id: string
  status: ApplicationStatus
  applied_at: string
  form_data?: Record<string, any> // 구글폼에서 수집된 추가 데이터
  created_at: string
  updated_at?: string
  
  // 관계 데이터 (조인된 경우)
  employee?: Employee
  reservation_period?: ReservationPeriod
}

/**
 * 신청 생성 데이터
 */
export interface CreateApplicationData {
  employee_id: string
  reservation_period_id: string
  form_data?: Record<string, any>
}

/**
 * 신청 수정 데이터
 */
export interface UpdateApplicationData {
  form_data?: Record<string, any>
  status?: ApplicationStatus
}

/**
 * 신청 목록 조회 파라미터
 */
export interface ApplicationListParams {
  page?: number
  limit?: number
  search?: string
  reservation_period_id?: string
  employee_id?: string
  status?: ApplicationStatus
  include_employee?: boolean
  include_period?: boolean
}

/**
 * 신청 목록 응답
 */
export interface ApplicationListResponse {
  applications: Application[]
  total: number
  page: number
  limit: number
  totalPages: number
}

/**
 * 신청 통계
 */
export interface ApplicationStats {
  total: number
  pending: number
  selected: number
  not_selected: number
}

/**
 * 구글폼 데이터 형식
 */
export interface GoogleFormData {
  // 기본 정보
  name: string
  employeeNumber: string
  department: string
  phoneNumber: string
  
  // 신청 정보
  accommodationName: string
  reservationPeriod: string
  checkInDate: string
  checkOutDate: string
  
  // 추가 정보
  companions?: number // 동반자 수
  specialRequests?: string // 특별 요청사항
  emergencyContact?: string // 비상연락처
  
  // 동의사항
  termsAgreed: boolean
  privacyAgreed: boolean
  
  // 기타
  additionalInfo?: Record<string, any>
}

/**
 * 신청 폼 데이터 검증 규칙
 */
export interface ApplicationFormValidation {
  employee_id: {
    required: true
    type: 'string'
  }
  reservation_period_id: {
    required: true
    type: 'string'
  }
  form_data: {
    required: false
    type: 'object'
    properties: {
      companions: {
        type: 'number'
        min: 0
        max: 10
      }
      specialRequests: {
        type: 'string'
        maxLength: 500
      }
      emergencyContact: {
        type: 'string'
        pattern: 'phone'
      }
      termsAgreed: {
        type: 'boolean'
        required: true
        value: true
      }
      privacyAgreed: {
        type: 'boolean'
        required: true
        value: true
      }
    }
  }
}

/**
 * 신청 가능 여부 체크 결과
 */
export interface ApplicationEligibility {
  eligible: boolean
  reasons: string[]
  warnings?: string[]
}

/**
 * 대량 신청 처리 결과
 */
export interface BulkApplicationResult {
  total: number
  success: number
  failed: number
  errors: Array<{
    row: number
    error: string
    data?: Partial<CreateApplicationData>
  }>
}
