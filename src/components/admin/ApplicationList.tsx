/**
 * 신청자 목록 컴포넌트
 */

'use client'

import { useState, useEffect } from 'react'
import { Search, FileText, Calendar, Building, Trash2, Filter } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { getApplications, deleteApplications } from '@/lib/actions/application'
import { getReservationPeriods } from '@/lib/actions/accommodation'
import type { Application, ApplicationListParams, ApplicationStatus } from '@/types/application'
import type { ReservationPeriod } from '@/types/accommodation'
import { formatDate, formatDateTime } from '@/lib/utils/date'

interface ApplicationListProps {
  onDelete?: (application: Application) => void
  refreshTrigger?: number
}

export function ApplicationList({ onDelete, refreshTrigger }: ApplicationListProps) {
  const [applications, setApplications] = useState<Application[]>([])
  const [periods, setPeriods] = useState<ReservationPeriod[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedApplications, setSelectedApplications] = useState<string[]>([])
  const [isDeletingApplications, setIsDeletingApplications] = useState(false)

  const limit = 20

  // 데이터 로드
  const loadApplications = async () => {
    try {
      setLoading(true)

      const params: ApplicationListParams = {
        page,
        limit,
        search: search || undefined,
        reservation_period_id: selectedPeriod || undefined,
        status: (selectedStatus as ApplicationStatus) || undefined,
        include_employee: true,
        include_period: true
      }

      const result = await getApplications(params)
      setApplications(result.applications)
      setTotal(result.total)
    } catch (error) {
      console.error('신청 목록 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  // 예약 기간 목록 로드
  const loadPeriods = async () => {
    try {
      const result = await getReservationPeriods({
        include_accommodation: true,
        limit: 100
      })
      setPeriods(result.periods)
    } catch (error) {
      console.error('예약 기간 목록 로드 실패:', error)
    }
  }

  // 검색 핸들러
  const handleSearch = () => {
    setPage(1)
    loadApplications()
  }

  // 필터 초기화
  const resetFilters = () => {
    setSearch('')
    setSelectedPeriod('')
    setSelectedStatus('')
    setPage(1)
  }

  // 신청 선택/해제
  const handleApplicationSelect = (applicationId: string) => {
    setSelectedApplications(prev =>
      prev.includes(applicationId)
        ? prev.filter(id => id !== applicationId)
        : [...prev, applicationId]
    )
  }

  // 전체 선택/해제
  const handleSelectAll = () => {
    if (selectedApplications.length === applications.length) {
      setSelectedApplications([])
    } else {
      setSelectedApplications(applications.map(app => app.id))
    }
  }

  // 선택된 신청 삭제
  const handleDeleteSelected = async () => {
    if (selectedApplications.length === 0) {
      alert('삭제할 신청을 선택해주세요.')
      return
    }

    const confirmed = window.confirm(
      `선택된 ${selectedApplications.length}개의 신청을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`
    )

    if (!confirmed) return

    try {
      setIsDeletingApplications(true)

      await deleteApplications(selectedApplications)
      await loadApplications() // 목록 새로고침
      setSelectedApplications([]) // 선택 초기화

      alert('선택된 신청이 삭제되었습니다.')
    } catch (err) {
      console.error('신청 삭제 실패:', err)
      alert(err instanceof Error ? err.message : '신청 삭제 중 오류가 발생했습니다.')
    } finally {
      setIsDeletingApplications(false)
    }
  }

  // 신청 상태 라벨
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: '대기중', color: 'bg-blue-100 text-blue-800' }
      case 'selected':
        return { label: '당첨', color: 'bg-green-100 text-green-800' }
      case 'not_selected':
        return { label: '미당첨', color: 'bg-gray-100 text-gray-800' }
      default:
        return { label: '알 수 없음', color: 'bg-gray-100 text-gray-800' }
    }
  }

  // 효과
  useEffect(() => {
    loadApplications()
  }, [page, selectedPeriod, selectedStatus])

  useEffect(() => {
    loadPeriods()
  }, [])

  useEffect(() => {
    if (refreshTrigger) {
      loadApplications()
    }
  }, [refreshTrigger])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            신청자 목록 ({total}건)
          </h2>
        </div>

        {/* 선택 삭제 버튼 */}
        {selectedApplications.length > 0 && (
          <Button
            variant="outline"
            onClick={handleDeleteSelected}
            disabled={isDeletingApplications}
            isLoading={isDeletingApplications}
            className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            선택 삭제 ({selectedApplications.length})
          </Button>
        )}
      </div>

      {/* 필터 영역 */}
      <Card>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 검색 */}
            <div className="md:col-span-2">
              <div className="flex gap-2">
                <Input
                  placeholder="이름, 사번, 부서로 검색..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} variant="outline">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* 예약 기간 필터 */}
            <div>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
              >
                <option value="">전체 기간</option>
                {periods.map(period => (
                  <option key={period.id} value={period.id}>
                    {period.accommodations?.name} - {formatDate(period.start_date)} ~ {formatDate(period.end_date)}
                  </option>
                ))}
              </select>
            </div>

            {/* 상태 필터 */}
            <div>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="">전체 상태</option>
                <option value="pending">대기중</option>
                <option value="selected">당첨</option>
                <option value="not_selected">미당첨</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* 전체 선택 체크박스 */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={applications.length > 0 && selectedApplications.length === applications.length}
                onChange={handleSelectAll}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                전체 선택
              </span>
            </label>

            <Button variant="ghost" size="sm" onClick={resetFilters}>
              <Filter className="h-4 w-4 mr-1" />
              필터 초기화
            </Button>
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
      ) : applications.length === 0 ? (
        <Card>
          <div className="p-8 text-center text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>신청 내역이 없습니다.</p>
          </div>
        </Card>
      ) : (
        <>
          {/* 카드 형태 목록 */}
          <div className="space-y-4">
            {applications.map((application) => {
              const status = getStatusLabel(application.status)
              return (
                <Card key={application.id} className="p-6">
                  <div className="space-y-4">
                    {/* 헤더 */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedApplications.includes(application.id)}
                          onChange={() => handleApplicationSelect(application.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />

                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {application.employee?.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {application.employee?.employee_number} | {application.employee?.department}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                    </div>

                    {/* 신청 정보 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">숙소:</span>
                          <span>{application.reservation_period?.accommodations?.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">숙박 기간:</span>
                          <span>
                            {application.reservation_period ?
                              `${formatDate(application.reservation_period.start_date)} ~ ${formatDate(application.reservation_period.end_date)}`
                              : '-'}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <span className="font-medium">신청일:</span>
                          <span className="ml-2">{formatDateTime(application.applied_at)}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {application.id}
                        </div>
                      </div>
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
                전체 {total}건 중 {((page - 1) * limit) + 1}-{Math.min(page * limit, total)}건 표시
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