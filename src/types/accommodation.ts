/**
 * 숙소 관련 타입 정의
 */

export interface Accommodation {
  id: string
  name: string
  type: 'ANANTI' | 'SONOBEL' | 'OTHER'
  restriction_years: number
  description: string | null
  is_active: boolean
  image_urls?: string[]
  created_at: string
  updated_at: string
}

export interface CreateAccommodationData {
  name: string
  type: 'ANANTI' | 'SONOBEL' | 'OTHER'
  restriction_years: number
  description?: string
  is_active?: boolean
  image_urls?: string[]
}

export interface UpdateAccommodationData {
  name?: string
  type?: 'ANANTI' | 'SONOBEL' | 'OTHER'
  restriction_years?: number
  description?: string
  is_active?: boolean
  image_urls?: string[]
}

export interface ReservationPeriod {
  id: string
  accommodation_id: string
  name: string
  start_date: string
  end_date: string
  application_start: string
  application_end: string
  available_rooms: number
  is_active: boolean
  is_open: boolean
  created_at: string
  updated_at: string
  // 조인 데이터
  accommodations?: Accommodation
}

export interface CreateReservationPeriodData {
  accommodation_id: string
  name: string
  start_date: string
  end_date: string
  application_start: string
  application_end: string
  available_rooms: number
  is_active?: boolean
}

export interface UpdateReservationPeriodData {
  accommodation_id?: string
  name?: string
  start_date?: string
  end_date?: string
  application_start?: string
  application_end?: string
  available_rooms?: number
  is_active?: boolean
}

export interface AccommodationListParams {
  page?: number
  limit?: number
  search?: string
  type?: 'ANANTI' | 'SONOBEL' | 'OTHER' | ''
  is_active?: boolean
}

export interface AccommodationListResponse {
  accommodations: Accommodation[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ReservationPeriodListParams {
  page?: number
  limit?: number
  search?: string
  accommodation_id?: string
  is_active?: boolean
  include_accommodation?: boolean
}

export interface ReservationPeriodListResponse {
  periods: ReservationPeriod[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export const ACCOMMODATION_TYPES = {
  ANANTI: '아난티',
  SONOBEL: '소노벨',
  OTHER: '기타'
} as const

export const ACCOMMODATION_TYPE_OPTIONS = [
  { value: 'ANANTI', label: '아난티' },
  { value: 'SONOBEL', label: '소노벨' },
  { value: 'OTHER', label: '기타' }
] as const
