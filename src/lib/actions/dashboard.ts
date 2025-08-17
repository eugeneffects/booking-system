/**
 * 대시보드 관련 Server Actions
 */

'use server'

import { createServiceRoleClient } from '@/lib/supabase/server'

/**
 * 대시보드 통계 데이터 조회
 */
export async function getDashboardStats() {
  try {
    const supabase = createServiceRoleClient()
    
    // 이번 달 기준
    const currentMonth = new Date()
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)

    // 병렬로 데이터 조회
    const [
      { count: totalEmployees },
      { count: activeAccommodations },
      { count: totalApplicationsThisMonth },
      { count: totalWinnersThisMonth },
      { count: activePeriods },
      { count: pendingLotteries }
    ] = await Promise.all([
      // 전체 활성 임직원 수
      supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true),
      
      // 활성 숙소 수
      supabase
        .from('accommodations')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true),
      
      // 이번 달 신청자 수
      supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .gte('applied_at', startOfMonth.toISOString())
        .lte('applied_at', endOfMonth.toISOString()),
      
      // 이번 달 당첨자 수
      supabase
        .from('lottery_results')
        .select('*', { count: 'exact', head: true })
        .eq('is_winner', true)
        .gte('drawn_at', startOfMonth.toISOString())
        .lte('drawn_at', endOfMonth.toISOString()),
      
      // 활성 예약 기간 수
      supabase
        .from('reservation_periods')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('is_open', true),
      
      // 추첨 대기 중인 기간 수 (마감되었지만 추첨되지 않은)
      supabase
        .from('reservation_periods')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .lt('application_end', new Date().toISOString())
        .not('id', 'in', 
          supabase
            .from('lottery_results')
            .select('reservation_period_id')
        )
    ])

    return {
      totalEmployees: totalEmployees || 0,
      activeAccommodations: activeAccommodations || 0,
      totalApplicationsThisMonth: totalApplicationsThisMonth || 0,
      totalWinnersThisMonth: totalWinnersThisMonth || 0,
      activePeriods: activePeriods || 0,
      pendingLotteries: pendingLotteries || 0
    }
  } catch (error) {
    console.error('대시보드 통계 조회 오류:', error)
    return {
      totalEmployees: 0,
      activeAccommodations: 0,
      totalApplicationsThisMonth: 0,
      totalWinnersThisMonth: 0,
      activePeriods: 0,
      pendingLotteries: 0
    }
  }
}

/**
 * 최근 신청 목록 조회
 */
export async function getRecentApplications(limit: number = 10) {
  try {
    const supabase = createServiceRoleClient()
    
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        employees (name, employee_number, department),
        reservation_periods (
          *,
          accommodations (name, type)
        )
      `)
      .order('applied_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('최근 신청 목록 조회 실패:', error)
      return []
    }

    return (data || []).map(app => ({
      ...app,
      employee: app.employees,
      reservation_period: {
        ...app.reservation_periods,
        accommodations: app.reservation_periods?.accommodations
      }
    }))
  } catch (error) {
    console.error('최근 신청 목록 조회 오류:', error)
    return []
  }
}

/**
 * 추첨 대기 중인 예약 기간 목록 조회
 */
export async function getPendingLotteryPeriods() {
  try {
    const supabase = createServiceRoleClient()
    
    // 마감되었지만 추첨되지 않은 기간들 조회
    const { data: periodsData, error: periodsError } = await supabase
      .from('reservation_periods')
      .select(`
        *,
        accommodations (name, type)
      `)
      .eq('is_active', true)
      .lt('application_end', new Date().toISOString())
      .order('application_end', { ascending: false })

    if (periodsError) {
      console.error('예약 기간 조회 실패:', periodsError)
      return []
    }

    // 각 기간에 대해 추첨 완료 여부 확인
    const pendingPeriods = []
    
    for (const period of periodsData || []) {
      const { data: lotteryResults } = await supabase
        .from('lottery_results')
        .select('id')
        .eq('reservation_period_id', period.id)
        .limit(1)

      // 추첨 결과가 없으면 대기 중
      if (!lotteryResults || lotteryResults.length === 0) {
        // 신청자 수도 함께 조회
        const { count: applicationCount } = await supabase
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .eq('reservation_period_id', period.id)
          .eq('status', 'pending')

        pendingPeriods.push({
          ...period,
          accommodations: period.accommodations,
          applicationCount: applicationCount || 0
        })
      }
    }

    return pendingPeriods
  } catch (error) {
    console.error('추첨 대기 기간 조회 오류:', error)
    return []
  }
}

/**
 * 월별 신청 통계 조회 (최근 6개월)
 */
export async function getMonthlyApplicationStats() {
  try {
    const supabase = createServiceRoleClient()
    
    const stats = []
    const now = new Date()
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      
      const [
        { count: applications },
        { count: winners }
      ] = await Promise.all([
        supabase
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .gte('applied_at', startOfMonth.toISOString())
          .lte('applied_at', endOfMonth.toISOString()),
        
        supabase
          .from('lottery_results')
          .select('*', { count: 'exact', head: true })
          .eq('is_winner', true)
          .gte('drawn_at', startOfMonth.toISOString())
          .lte('drawn_at', endOfMonth.toISOString())
      ])
      
      stats.push({
        month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        applications: applications || 0,
        winners: winners || 0
      })
    }
    
    return stats
  } catch (error) {
    console.error('월별 통계 조회 오류:', error)
    return []
  }
}

/**
 * 숙소별 신청 통계 조회
 */
export async function getAccommodationStats() {
  try {
    const supabase = createServiceRoleClient()
    
    const { data: accommodations, error } = await supabase
      .from('accommodations')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) {
      console.error('숙소 목록 조회 실패:', error)
      return []
    }

    const stats = []
    
    for (const accommodation of accommodations || []) {
      // 해당 숙소의 모든 예약 기간 조회
      const { data: periods } = await supabase
        .from('reservation_periods')
        .select('id')
        .eq('accommodation_id', accommodation.id)

      if (!periods) continue

      const periodIds = periods.map(p => p.id)
      
      if (periodIds.length === 0) {
        stats.push({
          ...accommodation,
          totalApplications: 0,
          totalWinners: 0,
          averageCompetitionRate: 0
        })
        continue
      }

      // 신청자 수 및 당첨자 수 조회
      const [
        { count: totalApplications },
        { count: totalWinners }
      ] = await Promise.all([
        supabase
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .in('reservation_period_id', periodIds),
        
        supabase
          .from('lottery_results')
          .select('*', { count: 'exact', head: true })
          .eq('is_winner', true)
          .in('reservation_period_id', periodIds)
      ])

      // 평균 경쟁률 계산
      const averageCompetitionRate = totalWinners && totalWinners > 0 
        ? Math.round((totalApplications || 0) / totalWinners * 100) / 100 
        : 0

      stats.push({
        ...accommodation,
        totalApplications: totalApplications || 0,
        totalWinners: totalWinners || 0,
        averageCompetitionRate
      })
    }
    
    return stats
  } catch (error) {
    console.error('숙소별 통계 조회 오류:', error)
    return []
  }
}
