/**
 * 추첨 관리 컴포넌트
 */

'use client'

import { useState, useEffect } from 'react'
import { 
  Shuffle, 
  Calendar,
  Building,
  Eye,
  RotateCcw,
  Mail,
  Home
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { 
  runLottery, 
  getLotteryResults, 
  getLotteryStats, 
  checkLotteryEligibility,
  resetLottery 
} from '@/lib/actions/lottery'
import { sendLotteryResultEmailsOnly } from '@/lib/actions/email'
import { getReservationPeriods } from '@/lib/actions/accommodation'
import type { 
  LotteryResultWithDetails, 
  LotteryStats, 
  LotteryEligibility 
} from '@/types/lottery'
import type { ReservationPeriod } from '@/types/accommodation'
import { formatDate } from '@/lib/utils/date'

interface LotteryManagementProps {
  currentUserId: string
}

export function LotteryManagement({ currentUserId }: LotteryManagementProps) {
  const [periods, setPeriods] = useState<ReservationPeriod[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<ReservationPeriod | null>(null)
  const [results, setResults] = useState<LotteryResultWithDetails[]>([])
  const [stats, setStats] = useState<LotteryStats | null>(null)
  const [eligibility, setEligibility] = useState<LotteryEligibility | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSendingEmails, setIsSendingEmails] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailResult, setEmailResult] = useState<
    | { success: boolean; summary?: { winnersNotified?: number; losersNotified?: number; errors?: number } }
    | null
  >(null)

  // 예약 기간 목록 로드
  const loadPeriods = async () => {
    try {
      const result = await getReservationPeriods({
        include_accommodation: true,
        limit: 100
      })
      setPeriods(result.periods)
    } catch (err) {
      console.error('예약 기간 로드 실패:', err)
    }
  }

  // 선택된 기간의 정보 로드
  const loadPeriodData = async (period: ReservationPeriod) => {
    try {
      setIsLoading(true)
      setError(null)

      // 추첨 가능 여부 확인
      const eligibilityResult = await checkLotteryEligibility(period.id)
      setEligibility(eligibilityResult)

      // 추첨 결과 조회
      const resultsData = await getLotteryResults(period.id)
      setResults(resultsData)

      // 통계 조회
      if (resultsData.length > 0) {
        const statsData = await getLotteryStats(period.id)
        setStats(statsData)
      } else {
        setStats(null)
      }
    } catch (err) {
      console.error('기간 데이터 로드 실패:', err)
      setError(err instanceof Error ? err.message : '데이터 로드 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 추첨 실행
  const handleRunLottery = async () => {
    if (!selectedPeriod) return

    try {
      setIsLoading(true)
      setError(null)

      await runLottery({
        reservation_period_id: selectedPeriod.id,
        drawn_by: currentUserId
      })

      // 결과 다시 로드
      await loadPeriodData(selectedPeriod)
    } catch (err) {
      console.error('추첨 실행 실패:', err)
      setError(err instanceof Error ? err.message : '추첨 실행 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 추첨 재설정
  const handleResetLottery = async () => {
    if (!selectedPeriod) return

    const confirmed = window.confirm(
      '추첨 결과를 재설정하시겠습니까?\n이 작업은 되돌릴 수 없습니다.'
    )

    if (!confirmed) return

    try {
      setIsLoading(true)
      setError(null)

      await resetLottery(selectedPeriod.id)
      
      // 결과 다시 로드
      await loadPeriodData(selectedPeriod)
    } catch (err) {
      console.error('추첨 재설정 실패:', err)
      setError(err instanceof Error ? err.message : '추첨 재설정 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 이메일 전송
  const handleSendEmails = async () => {
    if (!selectedPeriod) return

    try {
      setIsSendingEmails(true)
      setError(null)
      setEmailResult(null)

      const result = await sendLotteryResultEmailsOnly(selectedPeriod.id)
      setEmailResult(result)
    } catch (err) {
      console.error('이메일 전송 실패:', err)
      setError(err instanceof Error ? err.message : '이메일 전송 중 오류가 발생했습니다.')
    } finally {
      setIsSendingEmails(false)
    }
  }

  // 기간 선택
  const handlePeriodSelect = (period: ReservationPeriod) => {
    setSelectedPeriod(period)
    loadPeriodData(period)
  }

  useEffect(() => {
    loadPeriods()
  }, [])

  // 기간별 상태 표시
  const getPeriodStatus = (period: ReservationPeriod) => {
    const now = new Date()
    const deadline = new Date(period.application_end)
    
    if (now < deadline) {
      return { label: '신청중', color: 'bg-blue-100 text-blue-800' }
    } else {
      return { label: '마감', color: 'bg-gray-100 text-gray-800' }
    }
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">추첨 관리</h2>
          <p className="text-gray-600">숙소 예약 추첨을 실행하고 결과를 관리할 수 있습니다.</p>
        </div>
        
        {/* 대시보드로 돌아가기 버튼 */}
        <Link href="/admin/dashboard">
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Home className="h-4 w-4" />
            대시보드
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 예약 기간 목록 */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">예약 기간 목록</h3>
            
            <div className="space-y-3">
              {periods.map((period) => {
                const status = getPeriodStatus(period)
                const isSelected = selectedPeriod?.id === period.id
                
                return (
                  <div
                    key={period.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => handlePeriodSelect(period)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Building className="h-4 w-4 text-gray-500" />
                          <span className="font-medium text-gray-900">
                            {period.accommodations?.name}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                            {status.label}
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {formatDate(period.start_date)} ~ {formatDate(period.end_date)}
                            </span>
                          </div>
                          <div>
                            신청마감: {formatDate(period.application_end, 'datetime')}
                          </div>
                          <div>
                            가용객실: {period.available_rooms}개
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
              
              {periods.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>등록된 예약 기간이 없습니다.</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* 추첨 관리 */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">추첨 관리</h3>
            
            {!selectedPeriod ? (
              <div className="text-center py-8 text-gray-500">
                <Shuffle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>예약 기간을 선택해주세요.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {error && (
                  <Alert variant="error" title="오류">
                    {error}
                  </Alert>
                )}

                {/* 선택된 기간 정보 */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">
                    {selectedPeriod.accommodations?.name}
                  </h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>
                      체크인: {formatDate(selectedPeriod.start_date)} ~ {formatDate(selectedPeriod.end_date)}
                    </div>
                    <div>
                      신청마감: {formatDate(selectedPeriod.application_end, 'datetime')}
                    </div>
                    <div>
                      가용객실: {selectedPeriod.available_rooms}개
                    </div>
                  </div>
                </div>

                {/* 추첨 상태 */}
                {eligibility && (
                  <div>
                    {eligibility.eligible ? (
                      <Alert variant="info" title="추첨 가능">
                        <div className="space-y-2">
                          <p>추첨을 실행할 수 있습니다.</p>
                          {eligibility.stats && (
                            <div className="text-sm">
                              <div>• 총 신청자: {eligibility.stats.totalApplications}명</div>
                              <div>• 가용객실: {eligibility.stats.availableRooms}개</div>
                              <div>• 경쟁률: {(eligibility.stats.totalApplications / eligibility.stats.availableRooms).toFixed(1)}:1</div>
                            </div>
                          )}
                        </div>
                      </Alert>
                    ) : (
                      <Alert variant="warning" title="추첨 불가">
                        <p>{eligibility.reason}</p>
                        {eligibility.stats && (
                          <div className="text-sm mt-2">
                            <div>• 총 신청자: {eligibility.stats.totalApplications}명</div>
                            <div>• 가용객실: {eligibility.stats.availableRooms}개</div>
                          </div>
                        )}
                      </Alert>
                    )}
                  </div>
                )}

                {/* 추첨 통계 */}
                {stats && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="p-3 bg-green-50 rounded-lg text-center">
                      <div className="text-lg font-bold text-green-600">{stats.winners}명</div>
                      <div className="text-sm text-green-700">당첨자</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg text-center">
                      <div className="text-lg font-bold text-gray-600">{stats.losers}명</div>
                      <div className="text-sm text-gray-700">미당첨자</div>
                    </div>
                  </div>
                )}

                {/* 추첨 버튼 */}
                <div className="flex gap-3">
                  {results.length === 0 ? (
                    <Button
                      onClick={handleRunLottery}
                      disabled={!eligibility?.eligible || isLoading}
                      isLoading={isLoading}
                      leftIcon={<Shuffle className="h-4 w-4" />}
                      className="flex-1"
                    >
                      추첨 실행
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => {
                          // 결과가 이미 로드되어 있으므로 스크롤만 이동
                          const resultsSection = document.getElementById('lottery-results')
                          if (resultsSection) {
                            resultsSection.scrollIntoView({ behavior: 'smooth' })
                          }
                        }}
                        leftIcon={<Eye className="h-4 w-4" />}
                      >
                        결과 보기
                      </Button>
                      <Button
                        onClick={handleSendEmails}
                        disabled={isSendingEmails}
                        isLoading={isSendingEmails}
                        leftIcon={<Mail className="h-4 w-4" />}
                      >
                        이메일 전송
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleResetLottery}
                        disabled={isLoading}
                        isLoading={isLoading}
                        leftIcon={<RotateCcw className="h-4 w-4" />}
                      >
                        재설정
                      </Button>
                    </>
                  )}
                </div>

                {/* 이메일 전송 결과 */}
                {emailResult && (
                  <div className="mt-4">
                    <Alert 
                      variant={emailResult.success ? "success" : "error"}
                      title={emailResult.success ? "이메일 전송 완료" : "이메일 전송 실패"}
                    >
                      {emailResult.success ? (
                        <div className="space-y-2">
                          <p>추첨 결과 이메일이 성공적으로 전송되었습니다.</p>
                          <div className="text-sm">
                            <div>• 당첨자: {emailResult.summary?.winnersNotified}명</div>
                            <div>• 미당첨자: {emailResult.summary?.losersNotified}명</div>
                            {(emailResult.summary?.errors ?? 0) > 0 && (
                              <div className="text-orange-600">• 전송 실패: {emailResult.summary?.errors}명</div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p>이메일 전송 중 오류가 발생했습니다.</p>
                      )}
                    </Alert>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* 추첨 결과 목록 */}
      {results.length > 0 && (
        <Card id="lottery-results">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">추첨 결과</h3>
            
            <div className="space-y-2">
              {results.map((result) => (
                <div
                  key={result.id}
                  className={`p-4 rounded-lg border ${
                    result.is_winner 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        result.is_winner 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-400 text-white'
                      }`}>
                        {result.rank}
                      </div>
                      
                      <div>
                        <div className="font-medium text-gray-900">
                          {result.employee.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {result.employee.employee_number} · {result.employee.department}
                        </div>
                      </div>
                    </div>
                    
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      result.is_winner 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {result.is_winner ? '당첨' : '미당첨'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
