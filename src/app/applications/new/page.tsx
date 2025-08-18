/**
 * 숙소 신청 페이지
 */

'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layouts/MainLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { createApplication } from '@/lib/actions/application'
import { getReservationPeriod } from '@/lib/actions/accommodation'
import { getActiveReservationPeriods } from '@/lib/actions/accommodation'
import { useRequireAuth } from '@/hooks/useAuth'
import type { ReservationPeriod } from '@/types/accommodation'
import type { CreateApplicationData, GoogleFormData } from '@/types/application'
import { formatDate } from '@/lib/utils/date'
import { 
  Building, 
  Calendar, 
  Users, 
  Phone, 
  Mail, 
  FileText, 
  Check,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'

function ApplicationFormContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const periodId = searchParams.get('period')
  const { user, isLoading: authLoading } = useRequireAuth()

  const [selectedPeriod, setSelectedPeriod] = useState<ReservationPeriod | null>(null)
  const [availablePeriods, setAvailablePeriods] = useState<ReservationPeriod[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    name: user?.name || '',
    employeeNumber: user?.employeeNumber || '',
    department: user?.department || '',
    phoneNumber: user?.phone || '',
    companions: 0,
    specialRequests: '',
    emergencyContact: '',
    termsAgreed: false,
    privacyAgreed: false
  })

  // 사용자 정보가 로드되면 폼 데이터 업데이트
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name,
        employeeNumber: user.employeeNumber,
        department: user.department,
        phoneNumber: user.phone,
      }))
    }
  }, [user])

  // 데이터 로드
  const loadData = async () => {
    if (!user) return
    
    try {
      setIsLoading(true)
      setError(null)

      // 신청 가능한 기간 목록 조회
      const periods = await getActiveReservationPeriods()
      setAvailablePeriods(periods)

      // URL에서 지정된 기간이 있으면 선택
      if (periodId) {
        const period = await getReservationPeriod(periodId)
        if (period) {
          setSelectedPeriod(period)
          updateFormWithPeriod(period)
        }
      }
    } catch (err) {
      console.error('데이터 로드 실패:', err)
      setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 선택된 기간으로 폼 데이터 업데이트 (불필요한 부분 제거)
  const updateFormWithPeriod = (period: ReservationPeriod) => {
    // 실제로는 선택된 기간 정보는 selectedPeriod에서 관리하므로 별도 업데이트 불필요
  }

  // 기간 선택 변경
  const handlePeriodChange = (periodId: string) => {
    const period = availablePeriods.find(p => p.id === periodId)
    if (period) {
      setSelectedPeriod(period)
      updateFormWithPeriod(period)
    }
  }

  // 폼 데이터 변경
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // 폼 검증
  const validateForm = (): boolean => {
    if (!selectedPeriod) {
      setError('예약 기간을 선택해주세요.')
      return false
    }

    if (!formData.emergencyContact.trim()) {
      setError('비상연락처를 입력해주세요.')
      return false
    }

    if (!formData.termsAgreed) {
      setError('이용약관에 동의해주세요.')
      return false
    }

    if (!formData.privacyAgreed) {
      setError('개인정보 처리방침에 동의해주세요.')
      return false
    }

    return true
  }

  // 신청 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      setIsSubmitting(true)
      setError(null)

      const applicationData: CreateApplicationData = {
        employee_id: user!.id,
        reservation_period_id: selectedPeriod!.id,
        form_data: {
          ...formData,
          // 선택된 예약 기간 정보도 함께 저장
          selectedAccommodation: selectedPeriod!.accommodations?.name,
          selectedPeriod: `${formatDate(selectedPeriod!.start_date)} ~ ${formatDate(selectedPeriod!.end_date)}`,
          applicationDate: new Date().toISOString()
        }
      }

      await createApplication(applicationData)
      setSuccess(true)

      // 3초 후 신청 현황 페이지로 이동
      setTimeout(() => {
        router.push('/applications')
      }, 3000)

    } catch (err) {
      console.error('신청 제출 실패:', err)
      setError(err instanceof Error ? err.message : '신청 제출 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    if (user && !authLoading) {
      loadData()
    }
  }, [user, authLoading, periodId])

  if (success) {
    return (
      <MainLayout user={user}>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-2xl mx-auto px-4 py-8">
            <Card>
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">신청이 완료되었습니다!</h2>
                <p className="text-gray-600 mb-6">
                  숙소 예약 신청이 성공적으로 제출되었습니다.<br />
                  추첨 결과는 신청 마감 후 이메일로 안내됩니다.
                </p>
                <div className="space-y-3">
                  <Link href="/applications">
                    <Button className="w-full">신청 현황 확인하기</Button>
                  </Link>
                  <Link href="/">
                    <Button variant="outline" className="w-full">홈으로 돌아가기</Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </MainLayout>
    )
  }

  // 인증 로딩 중이거나 데이터 로딩 중인 경우
  if (authLoading || isLoading) {
    return (
      <MainLayout user={user}>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-2xl mx-auto px-4 py-8">
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
          <div className="max-w-2xl mx-auto px-4 py-8">
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
        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* 헤더 */}
          <div className="mb-6">
            <Link href="/applications" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 mb-4">
              <ArrowLeft className="h-4 w-4" />
              신청 현황으로 돌아가기
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">숙소 예약 신청</h1>
            <p className="text-gray-600">원하는 날짜 슬롯을 선택하고 신청 정보를 입력해주세요.</p>
          </div>

          {error && (
            <Alert variant="error" title="오류" className="mb-6">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 날짜 슬롯 선택 */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  날짜 슬롯 선택
                </h3>
                
                {availablePeriods.length === 0 ? (
                  <Alert variant="warning" title="신청 가능한 슬롯이 없습니다">
                    현재 신청 가능한 날짜 슬롯이 없습니다.
                  </Alert>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {availablePeriods.map((period) => {
                      const isSelected = selectedPeriod?.id === period.id
                      const deadline = new Date(period.application_end)
                      const now = new Date()
                      const hoursLeft = Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60)))
                      
                      return (
                        <label
                          key={period.id}
                          className={`block p-6 border-2 rounded-xl cursor-pointer transition-all transform hover:scale-[1.02] ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50 shadow-lg'
                              : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                          }`}
                        >
                          <input
                            type="radio"
                            name="period"
                            value={period.id}
                            checked={isSelected}
                            onChange={(e) => handlePeriodChange(e.target.value)}
                            className="sr-only"
                          />
                          
                          {/* 선택 표시 */}
                          <div className="flex items-start justify-between mb-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              isSelected 
                                ? 'border-blue-500 bg-blue-500' 
                                : 'border-gray-300'
                            }`}>
                              {isSelected && (
                                <Check className="h-3 w-3 text-white" />
                              )}
                            </div>
                            {hoursLeft > 0 && hoursLeft <= 24 && (
                              <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
                                {hoursLeft}시간 남음
                              </span>
                            )}
                          </div>
                          
                          {/* 숙소 정보 */}
                          <div className="mb-4">
                            {period.accommodations?.image_urls && period.accommodations.image_urls.length > 0 && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={period.accommodations.image_urls[0]} alt="숙소 이미지" className="w-full h-40 object-cover rounded-md mb-3" />
                            )}
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">
                              {period.accommodations?.name}
                            </h4>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                              <Building className="h-4 w-4" />
                              <span>{period.accommodations?.type}</span>
                            </div>
                          </div>
                          
                          {/* 일정 정보 */}
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-blue-600" />
                              <span className="font-medium text-gray-900">
                                {formatDate(period.start_date)} ~ {formatDate(period.end_date)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Users className="h-4 w-4" />
                              <span>모집인원 {period.available_rooms}명</span>
                            </div>
                          </div>
                          
                          {/* 신청 마감 정보 */}
                          <div className="pt-3 border-t border-gray-200">
                            <div className="text-xs text-gray-500">
                              신청마감: {formatDate(period.application_end, 'MM월 dd일 HH:mm')}
                            </div>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>
            </Card>

            {/* 선택된 예약 기간 확인 */}
            {selectedPeriod && (
              <Card>
                <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Check className="h-5 w-5 text-blue-600" />
                    선택된 예약 정보
                  </h3>
                  
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium text-gray-600">숙소명</label>
                        <div className="text-base font-semibold text-gray-900">
                          {selectedPeriod.accommodations?.name}
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600">숙소 유형</label>
                        <div className="text-base text-gray-900">
                          {selectedPeriod.accommodations?.type}
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600">체크인 ~ 체크아웃</label>
                        <div className="text-base font-semibold text-blue-600">
                          {formatDate(selectedPeriod.start_date)} ~ {formatDate(selectedPeriod.end_date)}
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600">모집인원</label>
                        <div className="text-base text-gray-900">
                          {selectedPeriod.available_rooms}명
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* 신청자 정보 */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  신청자 정보
                </h3>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      이름
                    </label>
                    <Input
                      value={formData.name}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      사번
                    </label>
                    <Input
                      value={formData.employeeNumber}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      소속
                    </label>
                    <Input
                      value={formData.department}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      연락처
                    </label>
                    <Input
                      value={formData.phoneNumber}
                      onChange={(e) => handleChange('phoneNumber', e.target.value)}
                      placeholder="연락처를 입력하세요"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* 추가 정보 */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  추가 정보
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      동반자 수
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="10"
                      value={formData.companions}
                      onChange={(e) => handleChange('companions', parseInt(e.target.value) || 0)}
                      placeholder="동반자 수를 입력하세요"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      비상연락처 *
                    </label>
                    <Input
                      value={formData.emergencyContact}
                      onChange={(e) => handleChange('emergencyContact', e.target.value)}
                      placeholder="비상시 연락 가능한 연락처를 입력하세요"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      특별 요청사항
                    </label>
                    <textarea
                      value={formData.specialRequests}
                      onChange={(e) => handleChange('specialRequests', e.target.value)}
                      placeholder="특별한 요청사항이 있으시면 입력해주세요"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={4}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* 동의사항 */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                  동의사항
                </h3>
                
                <div className="space-y-4">
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={formData.termsAgreed}
                      onChange={(e) => handleChange('termsAgreed', e.target.checked)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        이용약관 동의 (필수)
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        숙소 이용에 관한 약관에 동의합니다.
                      </div>
                    </div>
                  </label>
                  
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={formData.privacyAgreed}
                      onChange={(e) => handleChange('privacyAgreed', e.target.checked)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        개인정보 처리방침 동의 (필수)
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        개인정보 수집 및 이용에 동의합니다.
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </Card>

            {/* 제출 버튼 */}
            <div className="flex gap-3">
              <Link href="/applications" className="flex-1">
                <Button variant="outline" className="w-full">
                  취소
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={!selectedPeriod || isSubmitting}
                isLoading={isSubmitting}
                className="flex-1"
              >
                신청하기
              </Button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  )
}

export default function ApplicationNewPage() {
  return (
    <Suspense fallback={
      <MainLayout user={null}>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-2xl mx-auto px-4 py-8">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">페이지를 불러오는 중...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    }>
      <ApplicationFormContent />
    </Suspense>
  )
}
