/**
 * 숙소 관리 페이지
 */

'use client'

import { useState } from 'react'
import { MainLayout } from '@/components/layouts/MainLayout'
import { AccommodationList } from '@/components/admin/AccommodationList'
import { AccommodationForm } from '@/components/admin/AccommodationForm'
import { ReservationPeriodList } from '@/components/admin/ReservationPeriodList'
import { ReservationPeriodForm } from '@/components/admin/ReservationPeriodForm'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Building, ArrowLeft } from 'lucide-react'
import type { Accommodation, ReservationPeriod } from '@/types/accommodation'

type ViewMode = 'list' | 'form' | 'periods' | 'period-form'

export default function AccommodationsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedAccommodation, setSelectedAccommodation] = useState<Accommodation | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<ReservationPeriod | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleEdit = (accommodation: Accommodation) => {
    setSelectedAccommodation(accommodation)
    setViewMode('form')
  }

  const handleAdd = () => {
    setSelectedAccommodation(null)
    setViewMode('form')
  }

  const handleManagePeriods = (accommodation: Accommodation) => {
    setSelectedAccommodation(accommodation)
    setViewMode('periods')
  }

  const handleFormSuccess = () => {
    setViewMode('list')
    setSelectedAccommodation(null)
    setRefreshTrigger(prev => prev + 1)
  }

  const handleCancel = () => {
    setViewMode('list')
    setSelectedAccommodation(null)
    setSelectedPeriod(null)
  }

  const goBackToList = () => {
    setViewMode('list')
    setSelectedAccommodation(null)
    setSelectedPeriod(null)
  }

  const handleEditPeriod = (period: ReservationPeriod) => {
    setSelectedPeriod(period)
    setViewMode('period-form')
  }

  const handleAddPeriod = () => {
    setSelectedPeriod(null)
    setViewMode('period-form')
  }

  const handlePeriodFormSuccess = () => {
    setViewMode('periods')
    setSelectedPeriod(null)
    setRefreshTrigger(prev => prev + 1)
  }

  const handlePeriodFormCancel = () => {
    setViewMode('periods')
    setSelectedPeriod(null)
  }

  return (
    <MainLayout user={null}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* 헤더 */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-2">
              {viewMode !== 'list' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goBackToList}
                  className="flex items-center gap-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  목록으로
                </Button>
              )}
              <h1 className="text-2xl font-bold text-gray-900">
                {viewMode === 'list' && '숙소 관리'}
                {viewMode === 'form' && (selectedAccommodation ? '숙소 정보 수정' : '새 숙소 등록')}
                {viewMode === 'periods' && `${selectedAccommodation?.name} 날짜 슬롯 관리`}
                {viewMode === 'period-form' && (selectedPeriod ? '날짜 슬롯 수정' : '새 날짜 슬롯 등록')}
              </h1>
            </div>
            <p className="text-gray-600">
              {viewMode === 'list' && '1단계: 회사 보유 숙소를 등록하고 관리합니다.'}
              {viewMode === 'form' && '숙소의 기본 정보를 입력합니다.'}
              {viewMode === 'periods' && '2단계: 해당 숙소의 이용 가능한 날짜 슬롯을 등록합니다.'}
              {viewMode === 'period-form' && '날짜 슬롯과 신청 기간을 설정합니다.'}
            </p>
          </div>

          {/* 탭 네비게이션 (목록 모드일 때만) */}
          {viewMode === 'list' && (
            <Card className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  <div className="py-4 px-1 border-b-2 border-blue-500 text-blue-600">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      숙소 목록
                    </div>
                  </div>
                </nav>
              </div>
            </Card>
          )}

          {/* 컨텐츠 */}
          <div>
            {viewMode === 'list' && (
              <AccommodationList 
                onEdit={handleEdit}
                onAdd={handleAdd}
                onManagePeriods={handleManagePeriods}
                refreshTrigger={refreshTrigger}
              />
            )}

            {viewMode === 'form' && (
              <AccommodationForm
                accommodation={selectedAccommodation}
                onSuccess={handleFormSuccess}
                onCancel={handleCancel}
              />
            )}

            {viewMode === 'periods' && selectedAccommodation && (
              <div className="space-y-6">
                {/* 숙소 정보 카드 */}
                <Card className="p-4 bg-blue-50 border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-blue-900">{selectedAccommodation.name}</h3>
                      <p className="text-sm text-blue-700">
                        제한 기간: {selectedAccommodation.restriction_years}년 | 
                        {selectedAccommodation.description && ` ${selectedAccommodation.description}`}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setViewMode('form')}
                      className="flex items-center gap-1"
                    >
                      <Building className="h-3 w-3" />
                      숙소 정보 수정
                    </Button>
                  </div>
                </Card>

                {/* 예약 기간 목록 */}
                <ReservationPeriodList
                  accommodation={selectedAccommodation}
                  onEdit={handleEditPeriod}
                  onAdd={handleAddPeriod}
                  refreshTrigger={refreshTrigger}
                />
              </div>
            )}

            {viewMode === 'period-form' && (
              <ReservationPeriodForm
                period={selectedPeriod}
                accommodation={selectedAccommodation}
                onSuccess={handlePeriodFormSuccess}
                onCancel={handlePeriodFormCancel}
              />
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
