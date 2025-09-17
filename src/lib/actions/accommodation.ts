/**
 * 숙소 관리 Server Actions
 */

'use server'

import { createServiceRoleClient } from '@/lib/supabase/server'
import type { 
  Accommodation, 
  CreateAccommodationData, 
  UpdateAccommodationData, 
  AccommodationListParams,
  AccommodationListResponse,
  ReservationPeriod,
  CreateReservationPeriodData,
  UpdateReservationPeriodData,
  ReservationPeriodListParams,
  ReservationPeriodListResponse
} from '@/types/accommodation'

/**
 * 숙소 목록 조회
 */
export async function getAccommodations(params: AccommodationListParams = {}): Promise<AccommodationListResponse> {
  try {
    const supabase = createServiceRoleClient()
    const { page = 1, limit = 20, search, type, is_active } = params

    let query = supabase
      .from('accommodations')
      .select('*', { count: 'exact' })

    // 검색 조건 추가
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    if (type) {
      query = query.eq('type', type)
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
      console.error('숙소 목록 조회 실패:', error)
      throw new Error(error.message)
    }

    const totalPages = Math.ceil((count || 0) / limit)

    // 임시 해결책: 응답에서 SONOVEL을 RISOM으로 매핑
    const accommodations = (data || []).map(acc => ({
      ...acc,
      type: acc.type === 'SONOVEL' ? 'RISOM' : acc.type
    }))

    return {
      accommodations,
      total: count || 0,
      page,
      limit,
      totalPages
    }
  } catch (error) {
    console.error('숙소 목록 조회 오류:', error)
    throw error
  }
}

/**
 * 숙소 단일 조회
 */
export async function getAccommodation(id: string): Promise<Accommodation | null> {
  try {
    const supabase = createServiceRoleClient()
    
    const { data, error } = await supabase
      .from('accommodations')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('숙소 조회 실패:', error)
      return null
    }

    // 임시 해결책: 응답에서 SONOVEL을 RISOM으로 매핑
    return {
      ...data,
      type: data.type === 'SONOVEL' ? 'RISOM' : data.type
    } as Accommodation
  } catch (error) {
    console.error('숙소 조회 오류:', error)
    return null
  }
}

/**
 * 숙소 생성
 */
export async function createAccommodation(data: CreateAccommodationData): Promise<Accommodation> {
  try {
    const supabase = createServiceRoleClient()

    // 중복 확인
    const { data: existing } = await supabase
      .from('accommodations')
      .select('id')
      .eq('name', data.name)
      .single()

    if (existing) {
      throw new Error('이미 존재하는 숙소명입니다.')
    }

    // 임시 해결책: RISOM을 SONOVEL로 매핑 (데이터베이스 마이그레이션 전까지)
    const dbData = {
      ...data,
      type: data.type === 'RISOM' ? 'SONOVEL' as any : data.type,
      is_active: data.is_active ?? true
    }

    const { data: newAccommodation, error } = await supabase
      .from('accommodations')
      .insert(dbData)
      .select()
      .single()

    if (error) {
      console.error('숙소 생성 실패:', error)
      throw new Error(error.message)
    }

    // 임시 해결책: 응답에서 SONOVEL을 RISOM으로 다시 매핑
    return {
      ...newAccommodation,
      type: newAccommodation.type === 'SONOVEL' ? 'RISOM' : newAccommodation.type
    } as Accommodation
  } catch (error) {
    console.error('숙소 생성 오류:', error)
    throw error
  }
}

/**
 * 숙소 정보 수정
 */
export async function updateAccommodation(id: string, data: UpdateAccommodationData): Promise<Accommodation> {
  try {
    const supabase = createServiceRoleClient()

    // 중복 확인 (자신 제외)
    if (data.name) {
      const { data: existing } = await supabase
        .from('accommodations')
        .select('id')
        .eq('name', data.name)
        .neq('id', id)
        .single()

      if (existing) {
        throw new Error('이미 존재하는 숙소명입니다.')
      }
    }

    // 임시 해결책: RISOM을 SONOVEL로 매핑 (데이터베이스 마이그레이션 전까지)
    const dbData = {
      ...data,
      type: data.type === 'RISOM' ? 'SONOVEL' as any : data.type,
      updated_at: new Date().toISOString()
    }

    const { data: updatedAccommodation, error } = await supabase
      .from('accommodations')
      .update(dbData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('숙소 수정 실패:', error)
      throw new Error(error.message)
    }

    // 임시 해결책: 응답에서 SONOVEL을 RISOM으로 다시 매핑
    return {
      ...updatedAccommodation,
      type: updatedAccommodation.type === 'SONOVEL' ? 'RISOM' : updatedAccommodation.type
    } as Accommodation
  } catch (error) {
    console.error('숙소 수정 오류:', error)
    throw error
  }
}

/**
 * 숙소 삭제 (비활성화)
 */
export async function deleteAccommodation(id: string): Promise<void> {
  try {
    const supabase = createServiceRoleClient()

    // 관련된 활성 예약 기간 중 신청 기한이 지나지 않은 것들 확인
    const { data: activePeriods } = await supabase
      .from('reservation_periods')
      .select('id, application_end')
      .eq('accommodation_id', id)
      .eq('is_active', true)

    if (activePeriods && activePeriods.length > 0) {
      const now = new Date()
      const activeOngoingPeriods = activePeriods.filter(period =>
        new Date(period.application_end) > now
      )

      if (activeOngoingPeriods.length > 0) {
        // 진행 중인 예약 기간이 있는지 신청 확인
        const periodIds = activeOngoingPeriods.map(p => p.id)
        const { data: applications } = await supabase
          .from('applications')
          .select('id')
          .in('reservation_period_id', periodIds)

        if (applications && applications.length > 0) {
          throw new Error('신청 기한이 진행 중인 예약 기간에 신청이 있는 숙소는 삭제할 수 없습니다.')
        }
      }
    }

    // 실제로는 비활성화 처리
    const { error } = await supabase
      .from('accommodations')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      console.error('숙소 삭제 실패:', error)
      throw new Error(error.message)
    }
  } catch (error) {
    console.error('숙소 삭제 오류:', error)
    throw error
  }
}

/**
 * 숙소 완전 삭제 (물리적 삭제)
 */
export async function permanentDeleteAccommodation(id: string): Promise<void> {
  try {
    const supabase = createServiceRoleClient()

    // 관련된 예약 기간 중 신청 기한이 진행 중인 것들 확인
    const { data: periods } = await supabase
      .from('reservation_periods')
      .select('id, application_end')
      .eq('accommodation_id', id)

    if (periods && periods.length > 0) {
      const now = new Date()
      const ongoingPeriods = periods.filter(period =>
        new Date(period.application_end) > now
      )

      if (ongoingPeriods.length > 0) {
        // 진행 중인 예약 기간이 있는지 신청 확인
        const periodIds = ongoingPeriods.map(p => p.id)
        const { data: applications } = await supabase
          .from('applications')
          .select('id')
          .in('reservation_period_id', periodIds)

        if (applications && applications.length > 0) {
          throw new Error('신청 기한이 진행 중인 예약 기간에 신청이 있는 숙소는 완전 삭제할 수 없습니다.')
        }
      }

      // 만료된 예약 기간들은 먼저 삭제
      await supabase
        .from('reservation_periods')
        .delete()
        .eq('accommodation_id', id)
    }

    // 숙소 완전 삭제
    const { error } = await supabase
      .from('accommodations')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('숙소 완전 삭제 실패:', error)
      throw new Error(error.message)
    }
  } catch (error) {
    console.error('숙소 완전 삭제 오류:', error)
    throw error
  }
}

/**
 * 활성화된 숙소 목록 조회 (드롭다운용)
 */
export async function getActiveAccommodations(): Promise<Accommodation[]> {
  try {
    const supabase = createServiceRoleClient()
    
    const { data, error } = await supabase
      .from('accommodations')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) {
      console.error('활성 숙소 목록 조회 실패:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('활성 숙소 목록 조회 오류:', error)
    return []
  }
}

/**
 * 신청 가능한 예약 기간 목록 조회
 */
export async function getActiveReservationPeriods(): Promise<ReservationPeriod[]> {
  try {
    const supabase = createServiceRoleClient()
    
    const { data, error } = await supabase
      .from('reservation_periods')
      .select(`
        *,
        accommodations (*)
      `)
      .eq('is_active', true)
      .eq('is_open', true)
      .gte('application_end', new Date().toISOString())
      .order('application_end')

    if (error) {
      console.error('활성 예약 기간 조회 실패:', error)
      return []
    }

    return (data || []).map(period => ({
      ...period,
      accommodations: period.accommodations
    }))
  } catch (error) {
    console.error('활성 예약 기간 조회 오류:', error)
    return []
  }
}

// ================================
// 예약 기간 관리 functions
// ================================

/**
 * 예약 기간 목록 조회
 */
export async function getReservationPeriods(params: ReservationPeriodListParams = {}): Promise<ReservationPeriodListResponse> {
  try {
    const supabase = createServiceRoleClient()
    const { page = 1, limit = 20, search, accommodation_id, is_active, include_accommodation = true } = params

    let query = supabase
      .from('reservation_periods')
      .select('*', { count: 'exact' })

    // 검색 조건 추가
    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    if (accommodation_id) {
      query = query.eq('accommodation_id', accommodation_id)
    }

    if (typeof is_active === 'boolean') {
      query = query.eq('is_active', is_active)
    }

    // 페이징 및 정렬
    const offset = (page - 1) * limit
    query = query
      .order('application_start', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('예약 기간 목록 조회 실패:', error)
      throw new Error(error.message)
    }

    let periods = data || []

    // 필요한 경우 숙소 정보를 별도로 조회
    if (include_accommodation && periods.length > 0) {
      const accommodationIds = [...new Set(periods.map(p => p.accommodation_id))]
      const { data: accommodations } = await supabase
        .from('accommodations')
        .select('*')
        .in('id', accommodationIds)

      // 각 기간에 숙소 정보 추가
      periods = periods.map(period => ({
        ...period,
        accommodations: accommodations?.find(acc => acc.id === period.accommodation_id)
      }))
    }

    const totalPages = Math.ceil((count || 0) / limit)

    return {
      periods,
      total: count || 0,
      page,
      limit,
      totalPages
    }
  } catch (error) {
    console.error('예약 기간 목록 조회 오류:', error)
    throw error
  }
}

/**
 * 예약 기간 단일 조회
 */
export async function getReservationPeriod(id: string): Promise<ReservationPeriod | null> {
  try {
    const supabase = createServiceRoleClient()
    
    const { data, error } = await supabase
      .from('reservation_periods')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('예약 기간 조회 실패:', error)
      return null
    }

    // 숙소 정보 별도 조회
    const { data: accommodation } = await supabase
      .from('accommodations')
      .select('*')
      .eq('id', data.accommodation_id)
      .single()

    return {
      ...data,
      accommodations: accommodation
    }
  } catch (error) {
    console.error('예약 기간 조회 오류:', error)
    return null
  }
}

/**
 * 예약 기간 생성
 */
export async function createReservationPeriod(data: CreateReservationPeriodData): Promise<ReservationPeriod> {
  try {
    const supabase = createServiceRoleClient()

    // 날짜 검증
    const startDate = new Date(data.start_date)
    const endDate = new Date(data.end_date)
    const appStart = new Date(data.application_start)
    const appEnd = new Date(data.application_end)

    if (startDate >= endDate) {
      throw new Error('시작일은 종료일보다 빨라야 합니다.')
    }

    if (appStart >= appEnd) {
      throw new Error('신청 시작일은 신청 종료일보다 빨라야 합니다.')
    }

    if (appEnd >= startDate) {
      throw new Error('신청 종료일은 숙박 시작일보다 빨라야 합니다.')
    }

    // 중복 기간 확인 제거 - 겹침 허용

    const { data: newPeriod, error } = await supabase
      .from('reservation_periods')
      .insert({
        ...data,
        is_active: data.is_active ?? true,
        application_deadline: data.application_end
      })
      .select('*')
      .single()

    if (error) {
      console.error('예약 기간 생성 실패:', error)
      throw new Error(error.message)
    }

    // 숙소 정보 별도 조회
    const { data: accommodation } = await supabase
      .from('accommodations')
      .select('*')
      .eq('id', newPeriod.accommodation_id)
      .single()

    return {
      ...newPeriod,
      accommodations: accommodation
    }
  } catch (error) {
    console.error('예약 기간 생성 오류:', error)
    throw error
  }
}

/**
 * 예약 기간 수정
 */
export async function updateReservationPeriod(id: string, data: UpdateReservationPeriodData): Promise<ReservationPeriod> {
  try {
    const supabase = createServiceRoleClient()

    // 날짜 검증
    if (data.start_date && data.end_date) {
      const startDate = new Date(data.start_date)
      const endDate = new Date(data.end_date)
      if (startDate >= endDate) {
        throw new Error('시작일은 종료일보다 빨라야 합니다.')
      }
    }

    if (data.application_start && data.application_end) {
      const appStart = new Date(data.application_start)
      const appEnd = new Date(data.application_end)
      if (appStart >= appEnd) {
        throw new Error('신청 시작일은 신청 종료일보다 빨라야 합니다.')
      }
    }

    const { data: updatedPeriod, error } = await supabase
      .from('reservation_periods')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      console.error('예약 기간 수정 실패:', error)
      throw new Error(error.message)
    }

    // 숙소 정보 별도 조회
    const { data: accommodation } = await supabase
      .from('accommodations')
      .select('*')
      .eq('id', updatedPeriod.accommodation_id)
      .single()

    return {
      ...updatedPeriod,
      accommodations: accommodation
    }
  } catch (error) {
    console.error('예약 기간 수정 오류:', error)
    throw error
  }
}

/**
 * 예약 기간 삭제 (비활성화)
 */
export async function deleteReservationPeriod(id: string): Promise<void> {
  try {
    const supabase = createServiceRoleClient()

    // 예약 기간 정보 조회
    const { data: period } = await supabase
      .from('reservation_periods')
      .select('application_end')
      .eq('id', id)
      .single()

    if (period) {
      const now = new Date()
      const applicationEnd = new Date(period.application_end)

      // 신청 기한이 아직 지나지 않은 경우에만 신청 확인
      if (applicationEnd > now) {
        const { data: applications } = await supabase
          .from('applications')
          .select('id')
          .eq('reservation_period_id', id)

        if (applications && applications.length > 0) {
          throw new Error('신청 기한이 진행 중인 예약 기간에 신청이 있어 삭제할 수 없습니다.')
        }
      }
    }

    // 실제로는 비활성화 처리
    const { error } = await supabase
      .from('reservation_periods')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      console.error('예약 기간 삭제 실패:', error)
      throw new Error(error.message)
    }
  } catch (error) {
    console.error('예약 기간 삭제 오류:', error)
    throw error
  }
}
