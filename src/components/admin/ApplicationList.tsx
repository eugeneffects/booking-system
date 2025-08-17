/**
 * 신청 목록 컴포넌트
 */

'use client'

import { useState, useEffect } from 'react'
import { Search, Eye, Calendar, Building, User, Filter, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { getApplications, getApplicationStats } from '@/lib/actions/application'
import type { Application, ApplicationListParams, ApplicationStats } from '@/types/application'
import { formatDate } from '@/lib/utils/date'

interface ApplicationListProps {
  reservationPeriodId?: string
  onView?: (application: Application) => void
  refreshTrigger?: number
}

type StatusFilter = 'all' | 'pending' | 'selected' | 'not_selected'

export function ApplicationList({ reservationPeriodId, onView, refreshTrigger }: ApplicationListProps) {
  const [applications, setApplications] = useState<Application[]>([])
  const [stats, setStats] = useState<ApplicationStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // 검색 및 필터 상태
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const loadApplications = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const params: ApplicationListParams = {
        page: currentPage,
        limit: 20,
        search: search.trim() || undefined,
        reservation_period_id: reservationPeriodId,
        status: statusFilter === 'all' ? undefined : statusFilter,
        include_employee: true,
        include_period: true
      }

      const result = await getApplications(params)
      setApplications(result.applications)
      setTotalPages(result.totalPages)

      // 통계 정보도 함께 로드
      if (reservationPeriodId) {
        const statsResult = await getApplicationStats(reservationPeriodId)
        setStats(statsResult)
      }
    } catch (err) {
      console.error('신청 목록 로드 실패:', err)
      setError(err instanceof Error ? err.message : '신청 목록을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 검색 및 필터 변경 시 첫 페이지로 리셋
  const handleSearchChange = (value: string) => {
    setSearch(value)
    setCurrentPage(1)
  }

  const handleStatusFilterChange = (status: StatusFilter) => {
    setStatusFilter(status)
    setCurrentPage(1)
  }

  const handleRefresh = () => {
    loadApplications()
  }

  // 상태별 배지 스타일
  const getStatusBadge = (status: Application['status']) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      selected: 'bg-green-100 text-green-800',
      not_selected: 'bg-gray-100 text-gray-800'
    }
    
    const labels = {
      pending: '대기중',
      selected: '당첨',
      not_selected: '미당첨'
    }

    return (
      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  useEffect(() => {
    loadApplications()
  }, [currentPage, search, statusFilter, reservationPeriodId, refreshTrigger])

  if (error) {
    return (
      <Card>
        <div className="p-6 text-center text-red-600">
          <p className="mb-4">{error}</p>
          <Button onClick={handleRefresh} variant="outline">
            다시 시도
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <div className="p-4">
              <div className="text-sm text-gray-600">전체 신청</div>
              <div className="text-2xl font-bold text-blue-600">{stats.total}건</div>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <div className="text-sm text-gray-600">대기중</div>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}건</div>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <div className="text-sm text-gray-600">당첨</div>
              <div className="text-2xl font-bold text-green-600">{stats.selected}건</div>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <div className="text-sm text-gray-600">미당첨</div>
              <div className="text-2xl font-bold text-gray-600">{stats.not_selected}건</div>
            </div>
          </Card>
        </div>
      )}

      <Card>
        {/* 헤더 */}
        <div className="border-b p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">신청 목록</h3>
              <p className="text-sm text-gray-600">숙소 예약 신청 현황을 관리할 수 있습니다.</p>
            </div>
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              disabled={isLoading}
            >
              새로고침
            </Button>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="border-b p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="이름, 사번, 소속으로 검색..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {(['all', 'pending', 'selected', 'not_selected'] as StatusFilter[]).map((status) => {
                const isActive = statusFilter === status
                const labels = {
                  all: '전체',
                  pending: '대기중',
                  selected: '당첨',
                  not_selected: '미당첨'
                }

                return (
                  <Button
                    key={status}
                    variant={isActive ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => handleStatusFilterChange(status)}
                  >
                    {labels[status]}
                  </Button>
                )
              })}
            </div>
          </div>
        </div>

        {/* 목록 */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <RefreshCw className="mx-auto h-8 w-8 animate-spin text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">신청 목록을 불러오는 중...</p>
              </div>
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-12">
              <User className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">신청 내역이 없습니다</h3>
              <p className="mt-2 text-sm text-gray-600">
                {search || statusFilter !== 'all' 
                  ? '검색 조건을 변경해보세요.' 
                  : '아직 신청된 내역이 없습니다.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((application) => (
                <div
                  key={application.id}
                  className="rounded-lg border p-4 hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-gray-900">
                          {application.employee?.name}
                        </h4>
                        {getStatusBadge(application.status)}
                      </div>
                      
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>{application.employee?.employee_number}</span>
                          <span>·</span>
                          <span>{application.employee?.department}</span>
                        </div>
                        
                        {application.reservation_period && (
                          <div className="flex items-center gap-1">
                            <Building className="h-4 w-4" />
                            <span>{application.reservation_period.accommodations?.name}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(application.applied_at, 'datetime')}</span>
                        </div>
                      </div>
                      
                      {application.reservation_period && (
                        <div className="mt-2 text-sm text-gray-600">
                          <span>체크인: {formatDate(application.reservation_period.start_date)}</span>
                          <span className="mx-2">~</span>
                          <span>체크아웃: {formatDate(application.reservation_period.end_date)}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onView?.(application)}
                        leftIcon={<Eye className="h-4 w-4" />}
                      >
                        상세
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                이전
              </Button>
              
              <span className="text-sm text-gray-600">
                {currentPage} / {totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                다음
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
