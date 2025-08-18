/**
 * 관리자 대시보드 페이지
 * 전체 시스템 현황과 주요 지표를 표시하며, 각 관리 기능으로 쉽게 이동할 수 있습니다.
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Building, 
  Users, 
  Calendar, 
  Trophy, 
  Clock,
  AlertCircle,
  ChevronRight
} from 'lucide-react'
import { MainLayout } from '@/components/layouts/MainLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useRequireAdmin } from '@/hooks/useAuth'
import { 
  getDashboardStats, 
  getRecentApplications, 
  getPendingLotteryPeriods 
} from '@/lib/actions/dashboard'
import { formatDate } from '@/lib/utils/date'
import { cn } from '@/lib/utils/cn'

export default function AdminDashboardPage() {
  const { user, isLoading } = useRequireAdmin()
  const [stats, setStats] = useState<any>(null)
  const [recentApplications, setRecentApplications] = useState<any[]>([])
  const [pendingLotteries, setPendingLotteries] = useState<any[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 대시보드 데이터 로드
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return

      try {
        setIsLoadingData(true)
        setError(null)

        const [statsData, applicationsData, lotteriesData] = await Promise.all([
          getDashboardStats(),
          getRecentApplications(10),
          getPendingLotteryPeriods(),
        ])

        setStats(statsData)
        setRecentApplications(applicationsData)
        setPendingLotteries(lotteriesData)
      } catch (err) {
        console.error('대시보드 데이터 로드 실패:', err)
        setError('데이터를 불러오는데 실패했습니다.')
      } finally {
        setIsLoadingData(false)
      }
    }

    loadDashboardData()
  }, [user])

  // 로딩 중이거나 인증 확인 중인 경우
  if (isLoading || isLoadingData) {
    return (
      <MainLayout user={user}>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">
              {isLoading ? '인증 확인 중...' : '데이터를 불러오는 중...'}
            </p>
          </div>
        </div>
      </MainLayout>
    )
  }

  // 에러가 있는 경우
  if (error) {
    return (
      <MainLayout user={user}>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  // 기본 통계 데이터 (데이터가 없을 때)
  const defaultStats = {
    totalEmployees: 0,
    activeAccommodations: 0,
    totalApplicationsThisMonth: 0,
    totalWinnersThisMonth: 0
  }

  const currentStats = stats || defaultStats
  
  // 통계 카드 데이터
  const statsCards = [
    {
      title: '전체 임직원',
      value: currentStats.totalEmployees.toLocaleString(),
      icon: Users,
      color: 'blue',
      href: '/admin/employees',
      description: '등록된 임직원 수'
    },
    {
      title: '등록 숙소',
      value: currentStats.activeAccommodations.toLocaleString(),
      icon: Building,
      color: 'green',
      href: '/admin/accommodations',
      description: '활성화된 숙소 수'
    },
    {
      title: '이번 달 신청',
      value: currentStats.totalApplicationsThisMonth.toLocaleString(),
      icon: Calendar,
      color: 'purple',
      href: '/admin/applications',
      description: '이번 달 신청 건수'
    },
    {
      title: '이번 달 당첨',
      value: currentStats.totalWinnersThisMonth.toLocaleString(),
      icon: Trophy,
      color: 'yellow',
      href: '/admin/lottery',
      description: '이번 달 당첨자 수'
    },
  ]


  
  return (
    <MainLayout user={user}>
      <div className="space-y-8">
        {/* 페이지 헤더 */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">관리자 대시보드</h1>
          <p className="mt-2 text-gray-600">
            숙소예약 추첨 시스템의 전체 현황을 확인하고 각 관리 기능에 접근하세요.
          </p>
        </div>
        
        {/* 통계 카드 */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">시스템 현황</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {statsCards.map((stat) => {
              const Icon = stat.icon
              return (
                <Link key={stat.title} href={stat.href}>
                  <Card hoverable clickable className="h-full">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">{stat.title}</p>
                        <p className="mt-1 text-3xl font-bold text-gray-900">
                          {stat.value}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">{stat.description}</p>
                      </div>
                      <div className={`rounded-lg bg-${stat.color}-100 p-3`}>
                        <Icon className={`h-8 w-8 text-${stat.color}-600`} />
                      </div>
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
          
        <div className="grid gap-8 lg:grid-cols-2">
          {/* 다가오는 추첨 일정 */}
          <Card>
            <Card.Header>
              <div className="flex items-center justify-between">
                <Card.Title>다가오는 추첨 일정</Card.Title>
                <Link href="/admin/lottery">
                  <Button variant="ghost" size="sm">
                    전체 보기 <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </Card.Header>
            <Card.Body>
              {pendingLotteries.length > 0 ? (
                <div className="space-y-4">
                  {pendingLotteries.map((period) => (
                    <div
                      key={period.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
                    >
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {period.accommodations.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {formatDate(period.start_date)} ~ {formatDate(period.end_date)}
                        </p>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <Clock className="mr-1 h-3 w-3" />
                          마감: {formatDate(period.application_end, 'MM월 dd일 HH:mm')}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          신청 {period.applicationCount || 0}건
                        </p>
                        <p className="text-sm font-medium text-blue-600">
                          {period.available_rooms}개 추첨
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <AlertCircle className="mb-2 h-8 w-8 text-gray-400" />
                  <p className="text-gray-600">예정된 추첨이 없습니다.</p>
                  <Link href="/admin/lottery" className="mt-2">
                    <Button size="sm">추첨 생성하기</Button>
                  </Link>
                </div>
              )}
            </Card.Body>
          </Card>
          
          {/* 최근 신청 내역 */}
          <Card>
            <Card.Header>
              <div className="flex items-center justify-between">
                <Card.Title>최근 신청 내역</Card.Title>
                <Link href="/admin/applications">
                  <Button variant="ghost" size="sm">
                    전체 보기 <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </Card.Header>
            <Card.Body>
              {recentApplications.length > 0 ? (
                <div className="space-y-4">
                  {recentApplications.map((application) => (
                    <div
                      key={application.id}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {application.employee?.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {application.employee?.department} • {application.reservation_period?.accommodations?.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          {formatDate(application.applied_at, 'MM/dd HH:mm')}
                        </p>
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2 py-1 text-xs font-medium',
                            {
                              'bg-yellow-100 text-yellow-800': application.status === 'pending',
                              'bg-green-100 text-green-800': application.status === 'selected',
                              'bg-gray-100 text-gray-800': application.status === 'not_selected',
                            }
                          )}
                        >
                          {application.status === 'pending' && '대기중'}
                          {application.status === 'selected' && '당첨'}
                          {application.status === 'not_selected' && '미당첨'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <AlertCircle className="mb-2 h-8 w-8 text-gray-400" />
                  <p className="text-gray-600">최근 신청 내역이 없습니다.</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </div>


      </div>
    </MainLayout>
  )
}

