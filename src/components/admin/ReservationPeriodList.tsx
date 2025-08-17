/**
 * 날짜 슬롯 목록 컴포넌트
 */

'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, Edit, Trash2, Calendar, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { getReservationPeriods, deleteReservationPeriod } from '@/lib/actions/accommodation'
import type { ReservationPeriod, ReservationPeriodListParams, Accommodation } from '@/types/accommodation'

interface ReservationPeriodListProps {
  accommodation?: Accommodation | null // 특정 숙소의 기간만 조회할 때
  onEdit?: (period: ReservationPeriod) => void
  onAdd?: () => void
  refreshTrigger?: number
}

export function ReservationPeriodList({ accommodation, onEdit, onAdd, refreshTrigger }: ReservationPeriodListProps) {
  const [periods, setPeriods] = useState<ReservationPeriod[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)

  const limit = 20

  // 데이터 로드
  const loadPeriods = async () => {
    try {
      setLoading(true)
      
      const params: ReservationPeriodListParams = {
        page,
        limit,
        search: search || undefined,
        accommodation_id: accommodation?.id,
        is_active: showInactive ? undefined : true,
        include_accommodation: !accommodation // 특정 숙소가 지정되지 않은 경우에만 조인
      }

      const result = await getReservationPeriods(params)
      setPeriods(result.periods)
      setTotal(result.total)
    } catch (error) {
      console.error('날짜 슬롯 목록 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  // 날짜 슬롯 삭제
  const handleDelete = async (period: ReservationPeriod) => {
    if (!confirm(`${period.name} 날짜 슬롯을 비활성화하시겠습니까?`)) {
      return
    }

    try {
      await deleteReservationPeriod(period.id)
      loadPeriods() // 목록 새로고침
    } catch (error) {
      console.error('날짜 슬롯 삭제 실패:', error)
      alert('삭제에 실패했습니다: ' + (error instanceof Error ? error.message : '알 수 없는 오류'))
    }
  }

  // 검색 핸들러
  const handleSearch = () => {
    setPage(1)
    loadPeriods()
  }

  // 필터 초기화
  const resetFilters = () => {
    setSearch('')
    setShowInactive(false)
    setPage(1)
  }

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // 날짜 시간 포맷팅
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 신청 상태 확인
  const getApplicationStatus = (period: ReservationPeriod) => {
    const now = new Date()
    const appStart = new Date(period.application_start)
    const appEnd = new Date(period.application_end)
    const stayStart = new Date(period.start_date)

    if (now < appStart) {
      return { status: 'upcoming', label: '신청 예정', color: 'bg-blue-100 text-blue-800' }
    } else if (now >= appStart && now <= appEnd) {
      return { status: 'ongoing', label: '신청 중', color: 'bg-green-100 text-green-800' }
    } else if (now > appEnd && now < stayStart) {
      return { status: 'closed', label: '신청 마감', color: 'bg-yellow-100 text-yellow-800' }
    } else {
      return { status: 'completed', label: '완료', color: 'bg-gray-100 text-gray-800' }
    }
  }

  // 효과
  useEffect(() => {
    loadPeriods()
  }, [page, showInactive, accommodation?.id])

  useEffect(() => {
    if (refreshTrigger) {
      loadPeriods()
    }
  }, [refreshTrigger])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            {accommodation ? `${accommodation.name} 날짜 슬롯` : '날짜 슬롯 관리'} ({total}개)
          </h2>
        </div>
        {onAdd && (
          <Button onClick={onAdd} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            날짜 슬롯 추가
          </Button>
        )}
      </div>

      {/* 필터 영역 */}
      <Card>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 검색 */}
            <div className="md:col-span-2">
              <div className="flex gap-2">
                <Input
                  placeholder="기간명으로 검색..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} variant="outline">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* 상태 필터 */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">비활성 포함</span>
              </label>
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                초기화
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* 목록 */}
      {loading ? (
        <Card>
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">로딩 중...</p>
          </div>
        </Card>
      ) : periods.length === 0 ? (
        <Card>
          <div className="p-8 text-center text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>등록된 날짜 슬롯이 없습니다.</p>
          </div>
        </Card>
      ) : (
        <>
          {/* 카드 형태 목록 */}
          <div className="space-y-4">
            {periods.map((period) => {
              const appStatus = getApplicationStatus(period)
              return (
                <Card key={period.id} className="p-6">
                  <div className="space-y-4">
                    {/* 헤더 */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {period.name}
                        </h3>
                        {!accommodation && period.accommodations && (
                          <p className="text-sm text-gray-600">
                            {period.accommodations.name}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${appStatus.color}`}>
                          {appStatus.label}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          period.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {period.is_active ? '활성' : '비활성'}
                        </span>
                      </div>
                    </div>

                    {/* 기간 정보 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">숙박 기간:</span>
                          <span>{formatDate(period.start_date)} ~ {formatDate(period.end_date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">신청 기간:</span>
                          <span>{formatDateTime(period.application_start)} ~ {formatDateTime(period.application_end)}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <span className="font-medium">최대 당첨자:</span>
                          <span className="ml-2">{period.available_rooms}명</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          등록일: {formatDate(period.created_at)}
                        </div>
                      </div>
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex gap-2 pt-2">
                      {onEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(period)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          수정
                        </Button>
                      )}
                      {period.is_active && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(period)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          삭제
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700">
                전체 {total}개 중 {((page - 1) * limit) + 1}-{Math.min(page * limit, total)}개 표시
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  이전
                </Button>
                <span className="px-3 py-2 text-sm text-gray-700">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  다음
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
