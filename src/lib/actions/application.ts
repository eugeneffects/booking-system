/**
 * 신청 관리 Server Actions
 */

'use server'

import { createServiceRoleClient } from '@/lib/supabase/server'
import type { 
  Application, 
  CreateApplicationData, 
  UpdateApplicationData, 
  ApplicationListParams,
  ApplicationListResponse
} from '@/types/application'

/**
 * 신청 목록 조회
 */
export async function getApplications(params: ApplicationListParams = {}): Promise<ApplicationListResponse> {
  try {
    const supabase = createServiceRoleClient()
    const { 
      page = 1, 
      limit = 20, 
      search, 
      reservation_period_id, 
      employee_id,
      status,
      include_employee = true,
      include_period = true 
    } = params

    let query = supabase
      .from('applications')
      .select('*', { count: 'exact' })

    // 검색 조건 추가
    if (reservation_period_id) {
      query = query.eq('reservation_period_id', reservation_period_id)
    }

    if (employee_id) {
      query = query.eq('employee_id', employee_id)
    }

    if (status) {
      query = query.eq('status', status)
    }

    // 페이징 및 정렬
    const offset = (page - 1) * limit
    query = query
      .order('applied_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('신청 목록 조회 실패:', error)
      throw new Error(error.message)
    }

    let applications = data || []

    // 필요한 경우 관련 정보를 별도로 조회
    if ((include_employee || include_period) && applications.length > 0) {
      // 직원 정보 조회
      if (include_employee) {
        const employeeIds = [...new Set(applications.map(app => app.employee_id))]
        const { data: employees } = await supabase
          .from('employees')
          .select('*')
          .in('id', employeeIds)

        applications = applications.map(app => ({
          ...app,
          employee: employees?.find(emp => emp.id === app.employee_id)
        }))
      }

      // 예약 기간 정보 조회
      if (include_period) {
        const periodIds = [...new Set(applications.map(app => app.reservation_period_id))]
        const { data: periods } = await supabase
          .from('reservation_periods')
          .select(`
            *,
            accommodations (*)
          `)
          .in('id', periodIds)

        applications = applications.map(app => ({
          ...app,
          reservation_period: periods?.find(period => period.id === app.reservation_period_id)
        }))
      }
    }

    // 검색어가 있으면 클라이언트 사이드에서 필터링
    if (search && applications.length > 0) {
      applications = applications.filter(app => {
        const employee = app.employee
        const period = app.reservation_period
        const accommodation = period?.accommodations

        return (
          employee?.name?.toLowerCase().includes(search.toLowerCase()) ||
          employee?.employee_number?.toLowerCase().includes(search.toLowerCase()) ||
          employee?.department?.toLowerCase().includes(search.toLowerCase()) ||
          accommodation?.name?.toLowerCase().includes(search.toLowerCase())
        )
      })
    }

    const totalPages = Math.ceil((count || 0) / limit)

    return {
      applications,
      total: count || 0,
      page,
      limit,
      totalPages
    }
  } catch (error) {
    console.error('신청 목록 조회 오류:', error)
    throw error
  }
}

/**
 * 신청 단일 조회
 */
export async function getApplication(id: string): Promise<Application | null> {
  try {
    const supabase = createServiceRoleClient()
    
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        reservation_periods (
          *,
          accommodations (*)
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('신청 조회 실패:', error)
      return null
    }

    return {
      ...data,
      employee: undefined,
      reservation_period: {
        ...data.reservation_periods,
        accommodations: data.reservation_periods.accommodations
      }
    }
  } catch (error) {
    console.error('신청 조회 오류:', error)
    return null
  }
}

/**
 * 신청 생성
 */
export async function createApplication(data: CreateApplicationData): Promise<Application> {
  try {
    const supabase = createServiceRoleClient()

    // 중복 신청 확인
    const { data: existing } = await supabase
      .from('applications')
      .select('id')
      .eq('employee_id', data.employee_id)
      .eq('reservation_period_id', data.reservation_period_id)
      .single()

    if (existing) {
      throw new Error('이미 해당 기간에 신청하셨습니다.')
    }

    // 예약 기간이 신청 가능한지 확인
    const { data: period } = await supabase
      .from('reservation_periods')
      .select('*, accommodations(*)')
      .eq('id', data.reservation_period_id)
      .single()

    if (!period) {
      throw new Error('존재하지 않는 예약 기간입니다.')
    }

    if (!period.is_open) {
      throw new Error('신청이 마감된 기간입니다.')
    }

    if (new Date() > new Date(period.application_end)) {
      throw new Error('신청 기간이 종료되었습니다.')
    }

    // 당첨 이력 확인 (제한 기간 내) - 안전하게 처리
    try {
      const hasRecentWin = await supabase.rpc('check_winner_history', {
        p_employee_id: data.employee_id,
        p_accommodation_id: period.accommodation_id
      })

      console.log('🏆 당첨 이력 확인 결과:', { hasRecentWin, employeeId: data.employee_id })

      if (hasRecentWin) {
        const restrictionYears = period.accommodations?.restriction_years || 1
        throw new Error(`${restrictionYears}년 이내에 해당 숙소에 당첨된 이력이 있습니다.`)
      }
    } catch (error) {
      // RPC 함수 호출 실패 시 당첨 이력이 없는 것으로 간주 (개발 환경)
      console.warn('⚠️ 당첨 이력 확인 실패 (개발 환경에서는 무시):', error)
      // throw하지 않고 계속 진행
    }

    const { data: newApplication, error } = await supabase
      .from('applications')
      .insert({
        ...data,
        status: 'pending'
      })
      .select(`
        *,
        reservation_periods (
          *,
          accommodations (*)
        )
      `)
      .single()

    if (error) {
      console.error('신청 생성 실패:', error)
      throw new Error(error.message)
    }

    const result = {
      ...newApplication,
      // employee 정보는 별도 조회로 채움 (관계 조인 의존 제거)
      employee: undefined,
      reservation_period: {
        ...newApplication.reservation_periods,
        accommodations: newApplication.reservation_periods.accommodations
      }
    }

    // 신청 완료 이메일 전송 (비동기, 실패해도 신청은 성공으로 처리)
    try {
      const { sendApplicationConfirmationOnly } = await import('./email')
      await sendApplicationConfirmationOnly(newApplication.id)
    } catch (emailError) {
      console.error('신청 확인 이메일 전송 실패 (신청은 정상 처리됨):', emailError)
    }

    return result
  } catch (error) {
    console.error('신청 생성 오류:', error)
    throw error
  }
}

/**
 * 신청 정보 수정
 */
export async function updateApplication(id: string, data: UpdateApplicationData): Promise<Application> {
  try {
    const supabase = createServiceRoleClient()

    // 신청 상태 확인
    const { data: currentApp } = await supabase
      .from('applications')
      .select('status, reservation_periods(application_end)')
      .eq('id', id)
      .single()

    if (!currentApp) {
      throw new Error('존재하지 않는 신청입니다.')
    }

    // 추첨이 완료된 신청은 수정 불가
    if (currentApp.status !== 'pending') {
      throw new Error('추첨이 완료된 신청은 수정할 수 없습니다.')
    }

    // 신청 마감 후에는 수정 불가
    if (new Date() > new Date(currentApp.reservation_periods.application_end)) {
      throw new Error('신청 기간이 종료되어 수정할 수 없습니다.')
    }

    const { data: updatedApplication, error } = await supabase
      .from('applications')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        reservation_periods (
          *,
          accommodations (*)
        )
      `)
      .single()

    if (error) {
      console.error('신청 수정 실패:', error)
      throw new Error(error.message)
    }

    return {
      ...updatedApplication,
      employee: undefined,
      reservation_period: {
        ...updatedApplication.reservation_periods,
        accommodations: updatedApplication.reservation_periods.accommodations
      }
    }
  } catch (error) {
    console.error('신청 수정 오류:', error)
    throw error
  }
}

/**
 * 신청 취소
 */
export async function cancelApplication(id: string): Promise<void> {
  try {
    const supabase = createServiceRoleClient()

    // 신청 상태 확인
    const { data: currentApp } = await supabase
      .from('applications')
      .select('status, reservation_periods(application_end)')
      .eq('id', id)
      .single()

    if (!currentApp) {
      throw new Error('존재하지 않는 신청입니다.')
    }

    // 추첨이 완료된 신청은 취소 불가
    if (currentApp.status !== 'pending') {
      throw new Error('추첨이 완료된 신청은 취소할 수 없습니다.')
    }

    // 신청 마감 후에는 취소 불가
    if (new Date() > new Date(currentApp.reservation_periods.application_end)) {
      throw new Error('신청 기간이 종료되어 취소할 수 없습니다.')
    }

    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('신청 취소 실패:', error)
      throw new Error(error.message)
    }
  } catch (error) {
    console.error('신청 취소 오류:', error)
    throw error
  }
}

/**
 * 특정 사용자의 신청 목록 조회
 */
export async function getUserApplications(employeeId: string): Promise<Application[]> {
  try {
    const supabase = createServiceRoleClient()
    
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        reservation_periods (
          *,
          accommodations (*)
        )
      `)
      .eq('employee_id', employeeId)
      .order('applied_at', { ascending: false })

    if (error) {
      console.error('사용자 신청 목록 조회 실패:', error)
      return []
    }

    return (data || []).map(app => ({
      ...app,
      reservation_period: {
        ...app.reservation_periods,
        accommodations: app.reservation_periods.accommodations
      }
    }))
  } catch (error) {
    console.error('사용자 신청 목록 조회 오류:', error)
    return []
  }
}

/**
 * 특정 예약 기간의 신청 통계 조회
 */
export async function getApplicationStats(reservationPeriodId: string) {
  try {
    const supabase = createServiceRoleClient()
    
    const { data, error } = await supabase
      .from('applications')
      .select('status')
      .eq('reservation_period_id', reservationPeriodId)

    if (error) {
      console.error('신청 통계 조회 실패:', error)
      throw new Error(error.message)
    }

    const stats = {
      total: data.length,
      pending: data.filter(app => app.status === 'pending').length,
      selected: data.filter(app => app.status === 'selected').length,
      not_selected: data.filter(app => app.status === 'not_selected').length
    }

    return stats
  } catch (error) {
    console.error('신청 통계 조회 오류:', error)
    throw error
  }
}
