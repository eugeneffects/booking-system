/**
 * 관리자 대시보드 페이지
 * 전체 시스템 현황과 주요 지표를 표시합니다.
 */

import Link from 'next/link'
import { 
  Building, 
  Users, 
  Calendar, 
  Trophy, 
  TrendingUp,
  Clock,
  AlertCircle,
  ChevronRight
} from 'lucide-react'
import { MainLayout } from '@/components/layouts/MainLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { getCurrentUser } from '@/lib/auth/utils'
import { createServerComponentClient } from '@/lib/supabase/server'
import { 
  getDashboardStats, 
  getRecentApplications, 
  getPendingLotteryPeriods 
} from '@/lib/actions/dashboard'
import { formatDate } from '@/lib/utils/date'
import { redirect } from 'next/navigation'
import { cn } from '@/lib/utils/cn'





export default async function AdminDashboardPage() {
  // 사용자 정보 및 권한 확인
  const user = await getCurrentUser()
  
  if (!user?.isAdmin) {
    redirect('/')
  }
  
  // 대시보드 데이터 가져오기
  const [stats, recentApplications, pendingLotteries] = await Promise.all([
    getDashboardStats(),
    getRecentApplications(10),
    getPendingLotteryPeriods(),
  ])
  
  // 통계 카드 데이터
  const statsCards = [
    {
      title: '전체 임직원',
      value: stats.totalEmployees.toLocaleString(),
      icon: Users,
      color: 'blue',
      href: '/admin/employees',
    },
    {
      title: '등록 숙소',
      value: stats.activeAccommodations.toLocaleString(),
      icon: Building,
      color: 'green',
      href: '/admin/accommodations',
    },
    {
      title: '이번 달 신청',
      value: stats.totalApplicationsThisMonth.toLocaleString(),
      icon: Calendar,
      color: 'purple',
      href: '/admin/applications',
    },
    {
      title: '이번 달 당첨',
      value: stats.totalWinnersThisMonth.toLocaleString(),
      icon: Trophy,
      color: 'yellow',
      href: '/admin/lottery',
    },
  ]
  
  return (
    <MainLayout user={user}>
      <div className="space-y-8">
        {/* 페이지 헤더 */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">관리자 대시보드</h1>
          <p className="mt-2 text-gray-600">
            숙소예약 추첨 시스템의 전체 현황을 확인하세요.
          </p>
        </div>
        
        {/* 통계 카드 */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat) => {
            const Icon = stat.icon
            return (
              <Link key={stat.title} href={stat.href}>
                <Card hoverable clickable>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{stat.title}</p>
                      <p className="mt-1 text-3xl font-bold text-gray-900">
                        {stat.value}
                      </p>
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
        
        {/* 빠른 작업 */}
        <Card>
          <Card.Header>
            <Card.Title>빠른 작업</Card.Title>
          </Card.Header>
          <Card.Body>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Link href="/admin/accommodations/new">
                <Button variant="outline" className="w-full">
                  <Building className="mr-2 h-4 w-4" />
                  숙소 추가
                </Button>
              </Link>
              <Link href="/admin/employees/import">
                <Button variant="outline" className="w-full">
                  <Users className="mr-2 h-4 w-4" />
                  임직원 업로드
                </Button>
              </Link>
              <Link href="/admin/lottery/new">
                <Button variant="outline" className="w-full">
                  <Calendar className="mr-2 h-4 w-4" />
                  추첨 일정 생성
                </Button>
              </Link>
              <Link href="/admin/reports">
                <Button variant="outline" className="w-full">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  보고서 생성
                </Button>
              </Link>
            </div>
          </Card.Body>
        </Card>
      </div>
    </MainLayout>
  )
}

