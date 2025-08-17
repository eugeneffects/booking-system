/**
 * 추첨 관리 페이지
 */

'use client'

import { MainLayout } from '@/components/layouts/MainLayout'
import { LotteryManagement } from '@/components/admin/LotteryManagement'

export default function LotteryPage() {
  // TODO: 실제 사용자 정보 가져오기
  const currentUserId = 'temp-user-id'

  return (
    <MainLayout user={null}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <LotteryManagement currentUserId={currentUserId} />
        </div>
      </div>
    </MainLayout>
  )
}
