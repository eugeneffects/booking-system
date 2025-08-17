/**
 * 추첨 관련 타입 정의
 */

import type { Employee } from './employee'
import type { Application } from './application'

/**
 * 추첨 결과 기본 정보
 */
export interface LotteryResult {
  id: string
  reservation_period_id: string
  application_id: string
  employee_id: string
  rank: number
  is_winner: boolean
  drawn_at: string
  drawn_by: string
  created_at: string
}

/**
 * 상세 정보가 포함된 추첨 결과
 */
export interface LotteryResultWithDetails extends LotteryResult {
  employee: Employee
  application: Application
}

/**
 * 추첨 실행 데이터
 */
export interface CreateLotteryData {
  reservation_period_id: string
  drawn_by: string
}

/**
 * 추첨 통계
 */
export interface LotteryStats {
  totalApplications: number
  totalResults: number
  winners: number
  losers: number
  availableRooms: number
  competitionRate: number
}

/**
 * 추첨 가능 여부 체크 결과
 */
export interface LotteryEligibility {
  eligible: boolean
  reason?: string
  stats?: {
    totalApplications: number
    availableRooms: number
    applicationDeadline: string
  }
}

/**
 * 추첨 실행 결과
 */
export interface LotteryExecutionResult {
  success: boolean
  message: string
  results?: LotteryResult[]
  stats?: LotteryStats
}

/**
 * 추첨 알고리즘 설정
 */
export interface LotterySettings {
  algorithm: 'random' | 'weighted' | 'priority'
  seed?: number
  weights?: {
    seniority?: number
    department?: number
    previousWins?: number
  }
  priorities?: string[]
}

/**
 * 추첨 상태
 */
export type LotteryStatus = 'not_started' | 'in_progress' | 'completed' | 'reset'

/**
 * 추첨 로그
 */
export interface LotteryLog {
  id: string
  reservation_period_id: string
  action: 'created' | 'executed' | 'reset' | 'updated'
  performed_by: string
  details: Record<string, any>
  created_at: string
}

/**
 * 당첨자 알림 정보
 */
export interface WinnerNotification {
  employee_id: string
  employee_name: string
  employee_email: string
  accommodation_name: string
  check_in_date: string
  check_out_date: string
  rank: number
  sent_at?: string
  status: 'pending' | 'sent' | 'failed'
}

/**
 * 추첨 대시보드 데이터
 */
export interface LotteryDashboard {
  totalPeriods: number
  completedLotteries: number
  pendingLotteries: number
  totalWinners: number
  averageCompetitionRate: number
  recentResults: LotteryResultWithDetails[]
}

/**
 * 부적격자 정보
 */
export interface IneligibleApplicant {
  employee_id: string
  employee_name: string
  reason: string
  restriction_end_date?: string
}

/**
 * 추첨 미리보기 결과
 */
export interface LotteryPreview {
  eligibleCount: number
  ineligibleCount: number
  ineligibleApplicants: IneligibleApplicant[]
  estimatedWinners: number
  competitionRate: number
}
