/**
 * 신청자 관리 페이지
 */

'use client'

import { useState } from 'react'
import { MainLayout } from '@/components/layouts/MainLayout'
import { ApplicationList } from '@/components/admin/ApplicationList'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FileText, Home } from 'lucide-react'
import Link from 'next/link'
import { useRequireAdmin } from '@/hooks/useAuth'
import type { Application } from '@/types/application'

export default function ApplicationsPage() {
  const { user, isLoading } = useRequireAdmin()
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleDelete = (application: Application) => {
    setRefreshTrigger(prev => prev + 1)
  }

  // 로딩 중이거나 인증 확인 중인 경우
  if (isLoading) {
    return (
      <MainLayout user={null}>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">인증 확인 중...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout user={user}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* 헤더 */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">신청자 관리</h1>
                <p className="text-gray-600">숙소 예약 신청자 목록을 확인하고 관리합니다.</p>
              </div>

              {/* 대시보드로 돌아가기 버튼 */}
              <Link href="/admin/dashboard">
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <Home className="h-4 w-4" />
                  대시보드
                </Button>
              </Link>
            </div>
          </div>

          {/* 탭 네비게이션 */}
          <Card className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                <button
                  className="py-4 px-1 border-b-2 border-blue-500 text-blue-600 font-medium text-sm"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    전체 신청 목록
                  </div>
                </button>
              </nav>
            </div>
          </Card>

          {/* 컨텐츠 */}
          <div>
            <ApplicationList
              onDelete={handleDelete}
              refreshTrigger={refreshTrigger}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  )
}