/**
 * 추첨 관리 페이지
 */

'use client'

import { MainLayout } from '@/components/layouts/MainLayout'
import { LotteryManagement } from '@/components/admin/LotteryManagement'
import { useRequireAdmin } from '@/hooks/useAuth'

export default function LotteryPage() {
  const { user, isLoading } = useRequireAdmin()

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
          <LotteryManagement currentUserId={user?.id || ''} />
        </div>
      </div>
    </MainLayout>
  )
}
