/**
 * 추첨 시스템 Server Actions
 */

'use server'

import { createServiceRoleClient } from '@/lib/supabase/server'
import type { 
  LotteryResult, 
  CreateLotteryData,
  LotteryResultWithDetails,
  LotteryStats
} from '@/types/lottery'

/**
 * 추첨 실행
 */
export async function runLottery(data: CreateLotteryData): Promise<LotteryResult[]> {
  try {
    const supabase = createServiceRoleClient()
    const { reservation_period_id, drawn_by } = data

    // 예약 기간 정보 조회
    const { data: period, error: periodError } = await supabase
      .from('reservation_periods')
      .select(`
        *,
        accommodations (*)
      `)
      .eq('id', reservation_period_id)
      .single()

    if (periodError || !period) {
      throw new Error('예약 기간을 찾을 수 없습니다.')
    }

    // 신청자 목록 조회 (pending 상태만)
    const { data: applications, error: appsError } = await supabase
      .from('applications')
      .select(`
        *,
        employees (*)
      `)
      .eq('reservation_period_id', reservation_period_id)
      .eq('status', 'pending')

    if (appsError) {
      throw new Error('신청자 목록 조회 실패')
    }

    if (!applications || applications.length === 0) {
      throw new Error('추첨할 신청자가 없습니다.')
    }

    // 이미 추첨이 진행되었는지 확인
    const { data: existingResults } = await supabase
      .from('lottery_results')
      .select('id')
      .eq('reservation_period_id', reservation_period_id)

    if (existingResults && existingResults.length > 0) {
      throw new Error('이미 추첨이 완료된 기간입니다.')
    }

    // 당첨 이력이 있는 신청자 필터링
    const eligibleApplications = []
    const ineligibleApplications = []

    for (const app of applications) {
      // 당첨 이력 확인
      const hasRecentWin = await supabase.rpc('check_winner_history', {
        p_employee_id: app.employee_id,
        p_accommodation_id: period.accommodation_id
      })

      if (hasRecentWin) {
        ineligibleApplications.push(app)
      } else {
        eligibleApplications.push(app)
      }
    }

    // 추첨 로직 실행
    const shuffledApplications = [...eligibleApplications].sort(() => Math.random() - 0.5)
    const availableRooms = period.available_rooms
    const winners = shuffledApplications.slice(0, availableRooms)
    const losers = shuffledApplications.slice(availableRooms)

    // 추첨 결과 저장
    const lotteryResults: LotteryResult[] = []
    const now = new Date().toISOString()

    // 당첨자 저장
    for (let i = 0; i < winners.length; i++) {
      const app = winners[i]
      
      const { data: result, error } = await supabase
        .from('lottery_results')
        .insert({
          reservation_period_id,
          application_id: app.id,
          employee_id: app.employee_id,
          rank: i + 1,
          is_winner: true,
          drawn_at: now,
          drawn_by
        })
        .select()
        .single()

      if (error) {
        throw new Error(`당첨자 저장 실패: ${error.message}`)
      }

      lotteryResults.push(result)

      // 신청 상태 업데이트
      await supabase
        .from('applications')
        .update({ status: 'selected' })
        .eq('id', app.id)

      // 당첨 이력 저장
      await supabase
        .from('winners_history')
        .insert({
          employee_id: app.employee_id,
          accommodation_id: period.accommodation_id,
          check_in_date: period.start_date
        })
    }

    // 미당첨자 저장
    for (let i = 0; i < losers.length; i++) {
      const app = losers[i]
      
      const { data: result, error } = await supabase
        .from('lottery_results')
        .insert({
          reservation_period_id,
          application_id: app.id,
          employee_id: app.employee_id,
          rank: winners.length + i + 1,
          is_winner: false,
          drawn_at: now,
          drawn_by
        })
        .select()
        .single()

      if (error) {
        throw new Error(`미당첨자 저장 실패: ${error.message}`)
      }

      lotteryResults.push(result)

      // 신청 상태 업데이트
      await supabase
        .from('applications')
        .update({ status: 'not_selected' })
        .eq('id', app.id)
    }

    // 부적격자들도 미당첨으로 처리
    for (const app of ineligibleApplications) {
      await supabase
        .from('applications')
        .update({ status: 'not_selected' })
        .eq('id', app.id)
    }

    // 추첨 결과 이메일 전송 (비동기, 실패해도 추첨은 성공으로 처리)
    try {
      const { sendLotteryResultEmailsOnly } = await import('./email')
      await sendLotteryResultEmailsOnly(reservation_period_id)
      console.log('추첨 결과 이메일 전송 완료')
    } catch (emailError) {
      console.error('추첨 결과 이메일 전송 실패 (추첨은 정상 처리됨):', emailError)
    }

    return lotteryResults
  } catch (error) {
    console.error('추첨 실행 오류:', error)
    throw error
  }
}

/**
 * 추첨 결과 조회
 */
export async function getLotteryResults(reservationPeriodId: string): Promise<LotteryResultWithDetails[]> {
  try {
    const supabase = createServiceRoleClient()
    
    const { data, error } = await supabase
      .from('lottery_results')
      .select(`
        *,
        employees (*),
        applications (
          *,
          reservation_periods (
            *,
            accommodations (*)
          )
        )
      `)
      .eq('reservation_period_id', reservationPeriodId)
      .order('rank')

    if (error) {
      console.error('추첨 결과 조회 실패:', error)
      throw new Error(error.message)
    }

    return (data || []).map(result => ({
      ...result,
      employee: result.employees,
      application: {
        ...result.applications,
        reservation_period: result.applications?.reservation_periods
      }
    }))
  } catch (error) {
    console.error('추첨 결과 조회 오류:', error)
    throw error
  }
}

/**
 * 추첨 통계 조회
 */
export async function getLotteryStats(reservationPeriodId: string): Promise<LotteryStats> {
  try {
    const supabase = createServiceRoleClient()
    
    // 기본 통계
    const { data: results } = await supabase
      .from('lottery_results')
      .select('is_winner')
      .eq('reservation_period_id', reservationPeriodId)

    // 예약 기간 정보
    const { data: period } = await supabase
      .from('reservation_periods')
      .select('available_rooms')
      .eq('id', reservationPeriodId)
      .single()

    // 전체 신청자 수
    const { data: applications } = await supabase
      .from('applications')
      .select('id')
      .eq('reservation_period_id', reservationPeriodId)

    const totalApplications = applications?.length || 0
    const totalResults = results?.length || 0
    const winners = results?.filter(r => r.is_winner).length || 0
    const losers = totalResults - winners
    const availableRooms = period?.available_rooms || 0
    const competitionRate = totalApplications > 0 ? totalApplications / Math.max(availableRooms, 1) : 0

    return {
      totalApplications,
      totalResults,
      winners,
      losers,
      availableRooms,
      competitionRate: Math.round(competitionRate * 100) / 100
    }
  } catch (error) {
    console.error('추첨 통계 조회 오류:', error)
    throw error
  }
}

/**
 * 추첨 가능 여부 확인
 */
export async function checkLotteryEligibility(reservationPeriodId: string): Promise<{
  eligible: boolean
  reason?: string
  stats?: {
    totalApplications: number
    availableRooms: number
    applicationDeadline: string
  }
}> {
  try {
    const supabase = createServiceRoleClient()
    
    // 예약 기간 정보 조회
    const { data: period, error: periodError } = await supabase
      .from('reservation_periods')
      .select('*')
      .eq('id', reservationPeriodId)
      .single()

    if (periodError || !period) {
      return {
        eligible: false,
        reason: '예약 기간을 찾을 수 없습니다.'
      }
    }

    // 신청 마감일 확인
    if (new Date() < new Date(period.application_end)) {
      return {
        eligible: false,
        reason: '아직 신청 기간입니다.',
        stats: {
          totalApplications: 0,
          availableRooms: period.available_rooms,
          applicationDeadline: period.application_end
        }
      }
    }

    // 이미 추첨 완료 확인
    const { data: existingResults } = await supabase
      .from('lottery_results')
      .select('id')
      .eq('reservation_period_id', reservationPeriodId)

    if (existingResults && existingResults.length > 0) {
      return {
        eligible: false,
        reason: '이미 추첨이 완료되었습니다.'
      }
    }

    // 신청자 수 확인
    const { data: applications } = await supabase
      .from('applications')
      .select('id')
      .eq('reservation_period_id', reservationPeriodId)
      .eq('status', 'pending')

    const totalApplications = applications?.length || 0

    if (totalApplications === 0) {
      return {
        eligible: false,
        reason: '신청자가 없습니다.',
        stats: {
          totalApplications,
          availableRooms: period.available_rooms,
          applicationDeadline: period.application_end
        }
      }
    }

    return {
      eligible: true,
      stats: {
        totalApplications,
        availableRooms: period.available_rooms,
        applicationDeadline: period.application_end
      }
    }
  } catch (error) {
    console.error('추첨 가능 여부 확인 오류:', error)
    return {
      eligible: false,
      reason: '확인 중 오류가 발생했습니다.'
    }
  }
}

/**
 * 추첨 결과 재설정 (관리자 전용)
 */
export async function resetLottery(reservationPeriodId: string): Promise<void> {
  try {
    const supabase = createServiceRoleClient()
    
    // 추첨 결과 삭제
    const { error: resultsError } = await supabase
      .from('lottery_results')
      .delete()
      .eq('reservation_period_id', reservationPeriodId)

    if (resultsError) {
      throw new Error(`추첨 결과 삭제 실패: ${resultsError.message}`)
    }

    // 신청 상태를 pending으로 되돌리기
    const { error: appsError } = await supabase
      .from('applications')
      .update({ status: 'pending' })
      .eq('reservation_period_id', reservationPeriodId)

    if (appsError) {
      throw new Error(`신청 상태 복원 실패: ${appsError.message}`)
    }

    // 당첨 이력 삭제 (해당 기간의 체크인 날짜로)
    const { data: period } = await supabase
      .from('reservation_periods')
      .select('start_date, accommodation_id')
      .eq('id', reservationPeriodId)
      .single()

    if (period) {
      await supabase
        .from('winners_history')
        .delete()
        .eq('accommodation_id', period.accommodation_id)
        .eq('check_in_date', period.start_date)
    }
  } catch (error) {
    console.error('추첨 재설정 오류:', error)
    throw error
  }
}
