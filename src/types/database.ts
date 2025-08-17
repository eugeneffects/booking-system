/**
 * Supabase 데이터베이스 타입 정의
 * 이 파일은 Supabase CLI로 자동 생성할 수 있지만, 
 * 초기 개발을 위해 수동으로 정의합니다.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // 임직원 테이블
      employees: {
        Row: {
          id: string
          employee_number: string // 사번
          name: string // 이름
          department: string // 소속
          company_email: string // 회사 이메일
          phone: string // 연락처
          is_active: boolean // 재직 여부
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_number: string
          name: string
          department: string
          company_email: string
          phone: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_number?: string
          name?: string
          department?: string
          company_email?: string
          phone?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      // 숙소 정보 테이블
      accommodations: {
        Row: {
          id: string
          name: string // 숙소명
          type: 'ANANTI' | 'SONOVEL' | 'OTHER' // 숙소 유형
          restriction_years: number // 제한 기간(년)
          description: string | null // 설명
          is_active: boolean // 활성화 여부
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          type: 'ANANTI' | 'SONOVEL' | 'OTHER'
          restriction_years: number
          description?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: 'ANANTI' | 'SONOVEL' | 'OTHER'
          restriction_years?: number
          description?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      // 예약 기간 테이블
      reservation_periods: {
        Row: {
          id: string
          accommodation_id: string // 숙소 ID
          start_date: string // 시작일
          end_date: string // 종료일
          available_rooms: number // 가용 객실 수
          is_open: boolean // 신청 가능 여부
          application_deadline: string // 신청 마감 시간
          created_at: string
        }
        Insert: {
          id?: string
          accommodation_id: string
          start_date: string
          end_date: string
          available_rooms: number
          is_open?: boolean
          application_deadline: string
          created_at?: string
        }
        Update: {
          id?: string
          accommodation_id?: string
          start_date?: string
          end_date?: string
          available_rooms?: number
          is_open?: boolean
          application_deadline?: string
          created_at?: string
        }
      }
      // 신청 정보 테이블
      applications: {
        Row: {
          id: string
          employee_id: string // 임직원 ID
          reservation_period_id: string // 예약 기간 ID
          status: 'pending' | 'selected' | 'not_selected' // 신청 상태
          applied_at: string // 신청 시간
          form_data: Json | null // 구글폼 데이터
        }
        Insert: {
          id?: string
          employee_id: string
          reservation_period_id: string
          status?: 'pending' | 'selected' | 'not_selected'
          applied_at?: string
          form_data?: Json | null
        }
        Update: {
          id?: string
          employee_id?: string
          reservation_period_id?: string
          status?: 'pending' | 'selected' | 'not_selected'
          applied_at?: string
          form_data?: Json | null
        }
      }
      // 추첨 결과 테이블
      lottery_results: {
        Row: {
          id: string
          reservation_period_id: string // 예약 기간 ID
          application_id: string // 신청 ID
          employee_id: string // 임직원 ID
          rank: number // 추첨 순위
          is_winner: boolean // 당첨 여부
          drawn_at: string // 추첨 일시
          drawn_by: string // 추첨 실행자 ID
        }
        Insert: {
          id?: string
          reservation_period_id: string
          application_id: string
          employee_id: string
          rank: number
          is_winner: boolean
          drawn_at?: string
          drawn_by: string
        }
        Update: {
          id?: string
          reservation_period_id?: string
          application_id?: string
          employee_id?: string
          rank?: number
          is_winner?: boolean
          drawn_at?: string
          drawn_by?: string
        }
      }
      // 당첨 이력 테이블
      winners_history: {
        Row: {
          id: string
          employee_id: string // 임직원 ID
          accommodation_id: string // 숙소 ID
          check_in_date: string // 체크인 날짜
          created_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          accommodation_id: string
          check_in_date: string
          created_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          accommodation_id?: string
          check_in_date?: string
          created_at?: string
        }
      }
      // 관리자 테이블
      admin_users: {
        Row: {
          id: string
          employee_id: string // 임직원 ID
          role: 'super_admin' | 'admin' // 관리자 역할
          is_active: boolean // 활성화 여부
          created_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          role: 'super_admin' | 'admin'
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          role?: 'super_admin' | 'admin'
          is_active?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
