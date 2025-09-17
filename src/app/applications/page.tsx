/**
 * 신청 현황 페이지
 * 사용자가 자신의 신청 내역을 확인할 수 있는 페이지
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layouts/MainLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { getUserApplications } from '@/lib/actions/application'
import { getActiveReservationPeriods } from '@/lib/actions/accommodation'
import { useAuth, useRequireAuth } from '@/hooks/useAuth'
import type { Application } from '@/types/application'
import type { ReservationPeriod } from '@/types/accommodation'
import { formatDate } from '@/lib/utils/date'
import { Calendar, Building, Clock, Trophy, Users, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function ApplicationsPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useRequireAuth()
  const [applications, setApplications] = useState<Application[]>([])
  const [availablePeriods, setAvailablePeriods] = useState<ReservationPeriod[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  console.log('📋 Applications 페이지:', { 
    hasUser: !!user, 
    userName: user?.name,
    authLoading,
    isLoading 
  })

  const loadData = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      setError(null)

      // 사용자 신청 내역 조회
      const userApps = await getUserApplications(user.id)
      setApplications(userApps)

      // 신청 가능한 기간 조회
      const periods = await getActiveReservationPeriods()
      setAvailablePeriods(periods)
    } catch (err) {
      console.error('데이터 로드 실패:', err)
      setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user && !authLoading) {
      loadData()
    }
  }, [user, authLoading])

  // 신청 상태별 배지
  const getStatusBadge = (status: Application['status']) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      selected: 'bg-green-100 text-green-800',
      not_selected: 'bg-gray-100 text-gray-800'
    }
    
    const labels = {
      pending: '신청완료',
      selected: '당첨',
      not_selected: '미당첨'
    }

    const icons = {
      pending: Clock,
      selected: Trophy,
      not_selected: AlertCircle
    }

    const Icon = icons[status]

    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${styles[status]}`}>
        <Icon className="h-4 w-4" />
        {labels[status]}
      </span>
    )
  }

  // 신청 가능 여부 체크
  const canApplyToPeriod = (period: ReservationPeriod) => {
    const now = new Date()
    const deadline = new Date(period.application_end)
    const hasApplied = applications.some(app => app.reservation_period_id === period.id)
    
    return now < deadline && !hasApplied && period.is_open
  }

  // 인증 로딩 중이거나 데이터 로딩 중인 경우
  if (authLoading || isLoading) {
    return (
      <MainLayout user={user}>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">
                {authLoading ? '인증 확인 중...' : '데이터를 불러오는 중...'}
              </p>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  // 로그인하지 않은 경우 (useRequireAuth에 의해 자동 리다이렉트되지만, 안전장치)
  if (!user) {
    return (
      <MainLayout user={null}>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="text-center py-12">
              <p className="text-gray-600">로그인이 필요합니다.</p>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout user={user}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* 헤더 */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">신청 현황</h1>
                <p className="text-gray-600">숙소 예약 신청 내역을 확인하고 새로운 신청을 할 수 있습니다.</p>
              </div>
              {user && (
                <div className="text-right">
                  <p className="text-sm text-gray-500">안녕하세요!</p>
                  <p className="font-semibold text-gray-900">{user.name}님</p>
                  <p className="text-xs text-gray-500">{user.department}</p>
                </div>
              )}
            </div>
            
            {/* 신규 사용자 환영 메시지 */}
            {applications.length === 0 && availablePeriods.length > 0 && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">🎉 환영합니다!</h3>
                <p className="text-sm text-blue-800">
                  회원가입을 축하드립니다! 아래에서 원하는 날짜 슬롯을 선택하여 첫 번째 숙소 예약을 신청해보세요.
                </p>
              </div>
            )}
            
            {/* 프로세스 안내 */}
            <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="text-sm font-semibold text-green-900 mb-2">📋 신청 프로세스</h3>
              <div className="flex flex-wrap gap-4 text-sm text-green-800">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <span>날짜 슬롯 선택</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <span>신청서 작성</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <span>추첨 대기</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                  <span>결과 확인</span>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <Alert variant="error" title="오류" className="mb-6">
              {error}
            </Alert>
          )}

          {/* 신청 가능한 날짜 슬롯 */}
          {availablePeriods.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">신청 가능한 날짜 슬롯</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {availablePeriods.map((period) => {
                  const canApply = canApplyToPeriod(period)
                  const deadline = new Date(period.application_end)
                  const now = new Date()
                  const hoursLeft = Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60)))
                  const hasApplied = applications.some(app => app.reservation_period_id === period.id)
                  
                  return (
                    <Card key={period.id} className={`transition-all ${canApply ? 'border-blue-300 shadow-md' : 'opacity-75'}`}>
                      <div className="overflow-hidden">
                        {/* 숙소 이미지 */}
                        {period.accommodations?.image_urls && period.accommodations.image_urls.length > 0 && (
                          <div className="relative w-full h-48">
                            <img
                              src={period.accommodations.image_urls[0]}
                              alt={period.accommodations.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                            {/* 이미지 위에 상태 배지 */}
                            <div className="absolute top-4 right-4 flex flex-col gap-2">
                              {canApply && (
                                <span className="bg-green-100 text-green-800 text-xs font-medium px-3 py-1 rounded-full backdrop-blur-sm bg-opacity-90">
                                  신청가능
                                </span>
                              )}
                              {hasApplied && (
                                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full backdrop-blur-sm bg-opacity-90">
                                  신청완료
                                </span>
                              )}
                              {hoursLeft > 0 && hoursLeft <= 24 && (
                                <span className="bg-orange-100 text-orange-800 text-xs font-medium px-3 py-1 rounded-full backdrop-blur-sm bg-opacity-90">
                                  {hoursLeft}시간 남음
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {period.accommodations?.name}
                              </h3>
                              <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                                <div className="flex items-center gap-1">
                                  <Building className="h-4 w-4" />
                                  <span>{period.accommodations?.type}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="h-4 w-4" />
                                  <span>모집인원 {period.available_rooms}명</span>
                                </div>
                              </div>
                            </div>

                            {/* 이미지가 없는 경우 기존 위치에 배지 표시 */}
                            {(!period.accommodations?.image_urls || period.accommodations.image_urls.length === 0) && (
                              <div className="flex flex-col gap-2">
                                {canApply && (
                                  <span className="bg-green-100 text-green-800 text-xs font-medium px-3 py-1 rounded-full">
                                    신청가능
                                  </span>
                                )}
                                {hasApplied && (
                                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full">
                                    신청완료
                                  </span>
                                )}
                                {hoursLeft > 0 && hoursLeft <= 24 && (
                                  <span className="bg-orange-100 text-orange-800 text-xs font-medium px-3 py-1 rounded-full">
                                    {hoursLeft}시간 남음
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                        {/* 체크인/체크아웃 날짜 - 더 강조 */}
                        <div className="bg-blue-50 rounded-lg p-4 mb-4">
                          <div className="flex items-center gap-2 text-blue-900">
                            <Calendar className="h-5 w-5 text-blue-600" />
                            <span className="font-semibold text-base">
                              {formatDate(period.start_date)} ~ {formatDate(period.end_date)}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span>
                              신청마감: {formatDate(period.application_end, 'datetime')}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {canApply ? (
                            <Link href={`/applications/new?period=${period.id}`} className="flex-1">
                              <Button className="w-full">
                                신청하기
                              </Button>
                            </Link>
                          ) : (
                            <Button variant="outline" disabled className="flex-1">
                              {hasApplied 
                                ? '신청완료' 
                                : new Date() >= deadline 
                                ? '마감됨' 
                                : '신청불가'
                              }
                            </Button>
                          )}
                        </div>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {/* 내 신청 내역 */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">내 신청 내역</h2>
            
            {applications.length === 0 ? (
              <Card>
                <div className="p-12 text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">신청 내역이 없습니다</h3>
                  <p className="text-gray-600 mb-4">
                    아직 숙소 예약을 신청하지 않으셨습니다.
                  </p>
                  {availablePeriods.length > 0 && (
                    <p className="text-sm text-blue-600">
                      위의 신청 가능한 기간에서 예약을 신청해보세요.
                    </p>
                  )}
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {applications.map((application) => (
                  <Card key={application.id} hoverable>
                    <div className="overflow-hidden">
                      <div className="flex">
                        {/* 숙소 이미지 */}
                        {application.reservation_period?.accommodations?.image_urls &&
                         application.reservation_period.accommodations.image_urls.length > 0 && (
                          <div className="w-32 h-32 flex-shrink-0">
                            <img
                              src={application.reservation_period.accommodations.image_urls[0]}
                              alt={application.reservation_period.accommodations.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}

                        <div className="flex-1 p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-gray-900">
                                  {application.reservation_period?.accommodations?.name}
                                </h3>
                                {getStatusBadge(application.status)}
                              </div>

                              <div className="space-y-1 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                  <Building className="h-4 w-4" />
                                  <span>{application.reservation_period?.accommodations?.type}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  <span>
                                    {application.reservation_period?.start_date &&
                                     application.reservation_period?.end_date && (
                                      <>
                                        {formatDate(application.reservation_period.start_date)} ~ {formatDate(application.reservation_period.end_date)}
                                      </>
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  <span>신청일: {formatDate(application.applied_at, 'datetime')}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {application.status === 'selected' && (
                            <Alert variant="success" title="축하합니다!" className="mt-4">
                              <p>숙소 예약에 당첨되셨습니다. 자세한 안내는 이메일로 발송됩니다.</p>
                            </Alert>
                          )}

                          {application.status === 'pending' && (
                            <Alert variant="info" title="신청 완료" className="mt-4">
                              <p>신청이 완료되었습니다. 추첨 결과는 신청 마감 후 안내됩니다.</p>
                            </Alert>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}


