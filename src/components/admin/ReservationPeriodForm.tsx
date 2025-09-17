/**
 * 날짜 슬롯 등록/수정 폼 컴포넌트
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { createReservationPeriod, updateReservationPeriod, getActiveAccommodations } from '@/lib/actions/accommodation'
import type { 
  ReservationPeriod, 
  CreateReservationPeriodData, 
  UpdateReservationPeriodData,
  Accommodation 
} from '@/types/accommodation'

interface ReservationPeriodFormProps {
  period?: ReservationPeriod | null
  accommodation?: Accommodation | null // 특정 숙소가 선택된 경우
  onSuccess?: (period: ReservationPeriod) => void
  onCancel?: () => void
}

export function ReservationPeriodForm({ period, accommodation, onSuccess, onCancel }: ReservationPeriodFormProps) {
  const [formData, setFormData] = useState({
    accommodation_id: '',
    name: '',
    start_date: '',
    end_date: '',
    application_start: '',
    application_end: '',
    available_rooms: 1,
    is_active: true
  })
  const [accommodations, setAccommodations] = useState<Accommodation[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingAccommodations, setLoadingAccommodations] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isEdit = !!period

  // 날짜/시간을 datetime-local 형식으로 변환하는 함수
  const formatDateTimeForInput = (dateString: string): string => {
    if (!dateString) return ''
    
    try {
      const date = new Date(dateString)
      // 로컬 시간대로 변환하여 YYYY-MM-DDTHH:mm 형식으로 반환
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      
      return `${year}-${month}-${day}T${hours}:${minutes}`
    } catch (error) {
      console.error('날짜 변환 오류:', error)
      return ''
    }
  }

  // datetime-local 값을 ISO 문자열로 변환하는 함수
  const formatDateTimeForServer = (dateTimeString: string): string => {
    if (!dateTimeString) return ''
    
    try {
      const date = new Date(dateTimeString)
      return date.toISOString()
    } catch (error) {
      console.error('날짜 변환 오류:', error)
      return ''
    }
  }

  // 활성 숙소 목록 로드
  useEffect(() => {
    const loadAccommodations = async () => {
      try {
        setLoadingAccommodations(true)
        const data = await getActiveAccommodations()
        setAccommodations(data)
      } catch (error) {
        console.error('숙소 목록 로드 실패:', error)
      } finally {
        setLoadingAccommodations(false)
      }
    }

    loadAccommodations()
  }, [])

  // 수정 모드일 때 기존 데이터 로드
  useEffect(() => {
    if (period) {
      setFormData({
        accommodation_id: period.accommodation_id,
        name: period.name,
        start_date: period.start_date,
        end_date: period.end_date,
        application_start: formatDateTimeForInput(period.application_start),
        application_end: formatDateTimeForInput(period.application_end),
        available_rooms: period.available_rooms,
        is_active: period.is_active
      })
    } else if (accommodation) {
      // 특정 숙소가 선택된 경우
      setFormData(prev => ({
        ...prev,
        accommodation_id: accommodation.id
      }))
    }
  }, [period, accommodation])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      let result: ReservationPeriod

      if (isEdit && period) {
        // 수정
        const updateData: UpdateReservationPeriodData = {
          accommodation_id: formData.accommodation_id,
          name: formData.name,
          start_date: formData.start_date,
          end_date: formData.end_date,
          application_start: formatDateTimeForServer(formData.application_start),
          application_end: formatDateTimeForServer(formData.application_end),
          available_rooms: formData.available_rooms,
          is_active: formData.is_active
        }
        result = await updateReservationPeriod(period.id, updateData)
      } else {
        // 생성
        const createData: CreateReservationPeriodData = {
          accommodation_id: formData.accommodation_id,
          name: formData.name,
          start_date: formData.start_date,
          end_date: formData.end_date,
          application_start: formatDateTimeForServer(formData.application_start),
          application_end: formatDateTimeForServer(formData.application_end),
          available_rooms: formData.available_rooms,
          is_active: formData.is_active
        }
        result = await createReservationPeriod(createData)
      }

      if (onSuccess) {
        onSuccess(result)
      }
    } catch (error) {
      console.error('예약 기간 저장 실패:', error)
      setError(error instanceof Error ? error.message : '저장에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof typeof formData, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // 현재 날짜를 YYYY-MM-DD 형식으로 가져오기
  const today = new Date().toISOString().split('T')[0]
  
  // 현재 날짜시간을 YYYY-MM-DDTHH:mm 형식으로 가져오기
  const now = new Date()
  const nowString = formatDateTimeForInput(now.toISOString())

  if (loadingAccommodations) {
    return (
      <Card>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">숙소 정보를 불러오는 중...</p>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {isEdit ? '날짜 슬롯 수정' : '새 날짜 슬롯 등록'}
          </h3>
          <p className="text-gray-600 mb-2">
            {isEdit ? '날짜 슬롯 정보를 수정합니다.' : '숙소의 이용 가능한 날짜 슬롯을 등록합니다.'}
          </p>
          
          {/* 워크플로우 안내 */}
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm text-amber-800">
              <strong>💡 슬롯 등록 가이드:</strong> 
              체크인/체크아웃 날짜와 직원들이 신청할 수 있는 기간을 설정하세요.
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="error" title="오류" className="mb-6">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 숙소 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              숙소 *
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.accommodation_id}
              onChange={(e) => handleInputChange('accommodation_id', e.target.value)}
              required
              disabled={!!accommodation} // 특정 숙소가 선택된 경우 비활성화
            >
              <option value="">숙소를 선택하세요</option>
              {accommodations.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.type === 'ANANTI' ? '아난티' : acc.type === 'RISOM' ? '리솜' : '기타'})
                </option>
              ))}
            </select>
            {accommodation && (
              <p className="mt-1 text-xs text-gray-500">
                선택된 숙소: {accommodation.name}
              </p>
            )}
          </div>

          {/* 슬롯명 */}
          <div>
            <Input
              label="슬롯명 *"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="예: 2024년 여름휴가 (8월 15일~16일)"
              required
              helperText="직원들이 쉽게 구분할 수 있는 이름을 입력하세요"
            />
          </div>

          {/* 1단계: 숙박 날짜 설정 */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">1</span>
              숙박 날짜 설정
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  label="체크인 날짜 *"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleInputChange('start_date', e.target.value)}
                  min={today}
                  required
                />
              </div>
              <div>
                <Input
                  label="체크아웃 날짜 *"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleInputChange('end_date', e.target.value)}
                  min={formData.start_date || today}
                  required
                />
              </div>
            </div>
            <p className="text-xs text-blue-700 mt-2">
              직원들이 실제로 숙소를 이용할 날짜를 설정하세요.
            </p>
          </div>

          {/* 2단계: 신청 기간 설정 */}
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="text-sm font-semibold text-green-900 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center text-xs">2</span>
              신청 기간 설정
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  label="신청 시작일시 *"
                  type="datetime-local"
                  value={formData.application_start}
                  onChange={(e) => handleInputChange('application_start', e.target.value)}
                  min={nowString}
                  required
                />
              </div>
              <div>
                <Input
                  label="신청 마감일시 *"
                  type="datetime-local"
                  value={formData.application_end}
                  onChange={(e) => handleInputChange('application_end', e.target.value)}
                  min={formData.application_start || nowString}
                  required
                />
              </div>
            </div>
            <p className="text-xs text-green-700 mt-2">
              직원들이 이 슬롯에 신청할 수 있는 기간을 설정하세요. (체크인 날짜보다 빨라야 함)
            </p>
          </div>

          {/* 3단계: 모집 인원 설정 */}
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h4 className="text-sm font-semibold text-purple-900 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs">3</span>
              모집 인원 설정
            </h4>
            <div>
              <Input
                label="최대 선정 인원 *"
                type="number"
                min="1"
                max="100"
                value={formData.available_rooms}
                onChange={(e) => handleInputChange('available_rooms', parseInt(e.target.value) || 1)}
                required
                helperText="추첨을 통해 선정될 수 있는 최대 인원수를 설정하세요"
              />
            </div>
          </div>

          {/* 활성 상태 */}
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => handleInputChange('is_active', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">활성화</span>
            </label>
            <p className="mt-1 text-xs text-gray-500">
              비활성화된 예약 기간은 신청에서 제외됩니다.
            </p>
          </div>

          {/* 안내사항 */}
          <Alert variant="info" title="설정 안내">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>신청 종료일시는 숙박 시작일보다 빨라야 합니다</li>
              <li>시작일은 종료일보다 빨라야 합니다</li>
              <li>같은 숙소의 겹치는 기간은 등록할 수 없습니다</li>
              <li>등록 후에도 신청 전까지는 수정이 가능합니다</li>
            </ul>
          </Alert>

          {/* 버튼 */}
          <div className="flex gap-3 pt-6">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? '저장 중...' : (isEdit ? '수정' : '등록')}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
                취소
              </Button>
            )}
          </div>
        </form>
      </div>
    </Card>
  )
}
