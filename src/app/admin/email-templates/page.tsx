/**
 * 이메일 템플릿 관리 페이지
 */

'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layouts/MainLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { useRequireAdmin } from '@/hooks/useAuth'
import { getActiveAccommodations } from '@/lib/actions/accommodation'
import { 
  getAccommodationTemplate, 
  setAccommodationTemplate, 
  getDefaultWinnerTemplate, 
  getDefaultLoserTemplate,
  type AccommodationTemplate 
} from '@/lib/email/templates'
import { 
  Mail, 
  Edit, 
  Save, 
  X, 
  Building,
  FileText,
  Trophy,
  RotateCcw
} from 'lucide-react'
import type { Accommodation } from '@/types/accommodation'

export default function EmailTemplatesPage() {
  const { user, isLoading } = useRequireAdmin()
  const [accommodations, setAccommodations] = useState<Accommodation[]>([])
  const [selectedAccommodation, setSelectedAccommodation] = useState<Accommodation | null>(null)
  const [currentTemplate, setCurrentTemplate] = useState<AccommodationTemplate | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      if (!user) return

      try {
        setIsLoadingData(true)
        setError(null)

        const accommodationsData = await getActiveAccommodations()
        setAccommodations(accommodationsData)
      } catch (err) {
        console.error('데이터 로드 실패:', err)
        setError('데이터를 불러오는데 실패했습니다.')
      } finally {
        setIsLoadingData(false)
      }
    }

    loadData()
  }, [user])

  // 숙소 선택 시 템플릿 로드
  const handleAccommodationSelect = (accommodation: Accommodation) => {
    setSelectedAccommodation(accommodation)
    
    // 기존 템플릿이 있는지 확인
    const existingTemplate = getAccommodationTemplate(accommodation.id)
    
    if (existingTemplate) {
      setCurrentTemplate(existingTemplate)
    } else {
      // 기본 템플릿으로 초기화
      setCurrentTemplate({
        id: accommodation.id,
        accommodationName: accommodation.name,
        winnerSubject: '[숙소예약] 🎉 축하합니다! 당첨되셨습니다',
        winnerTemplate: getDefaultWinnerTemplate(),
        loserSubject: '[숙소예약] 추첨 결과 안내',
        loserTemplate: getDefaultLoserTemplate(),
        isActive: true
      })
    }
    
    setIsEditing(false)
  }

  // 템플릿 저장
  const handleSaveTemplate = () => {
    if (!currentTemplate) return

    try {
      setAccommodationTemplate(currentTemplate)
      setIsEditing(false)
      alert('템플릿이 저장되었습니다.')
    } catch (err) {
      console.error('템플릿 저장 실패:', err)
      alert('템플릿 저장에 실패했습니다.')
    }
  }

  // 템플릿 초기화
  const handleResetTemplate = () => {
    if (!selectedAccommodation) return

    setCurrentTemplate({
      id: selectedAccommodation.id,
      accommodationName: selectedAccommodation.name,
      winnerSubject: '[숙소예약] 🎉 축하합니다! 당첨되셨습니다',
      winnerTemplate: getDefaultWinnerTemplate(),
      loserSubject: '[숙소예약] 추첨 결과 안내',
      loserTemplate: getDefaultLoserTemplate(),
      isActive: true
    })
  }

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
            <Alert variant="error" title="오류">
              {error}
            </Alert>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout user={user}>
      <div className="space-y-8">
        {/* 페이지 헤더 */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">이메일 템플릿 관리</h1>
          <p className="mt-2 text-gray-600">
            숙소별 추첨 결과 이메일 템플릿을 관리하세요.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* 숙소 목록 */}
          <div className="lg:col-span-1">
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">숙소 목록</h2>
                
                <div className="space-y-2">
                  {accommodations.map((accommodation) => (
                    <button
                      key={accommodation.id}
                      onClick={() => handleAccommodationSelect(accommodation)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedAccommodation?.id === accommodation.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{accommodation.name}</span>
                      </div>
                    </button>
                  ))}
                  
                  {accommodations.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Building className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p>등록된 숙소가 없습니다.</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* 템플릿 편집 */}
          <div className="lg:col-span-2">
            {!selectedAccommodation ? (
              <Card>
                <div className="p-6 text-center">
                  <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">템플릿 편집</h3>
                  <p className="text-gray-600">편집할 숙소를 선택해주세요.</p>
                </div>
              </Card>
            ) : (
              <Card>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {selectedAccommodation.name} 템플릿
                      </h2>
                      <p className="text-sm text-gray-600">
                        당첨자 및 미당첨자에게 전송될 이메일 템플릿을 설정하세요.
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      {!isEditing ? (
                        <Button
                          onClick={() => setIsEditing(true)}
                          leftIcon={<Edit className="h-4 w-4" />}
                        >
                          편집
                        </Button>
                      ) : (
                        <>
                          <Button
                            onClick={handleSaveTemplate}
                            leftIcon={<Save className="h-4 w-4" />}
                          >
                            저장
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setIsEditing(false)}
                            leftIcon={<X className="h-4 w-4" />}
                          >
                            취소
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {currentTemplate && (
                    <div className="space-y-6">
                      {/* 당첨자 이메일 템플릿 */}
                      <div>
                        <h3 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Trophy className="h-4 w-4" />
                          당첨자 이메일
                        </h3>
                        
                        {isEditing ? (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                제목
                              </label>
                              <input
                                type="text"
                                value={currentTemplate.winnerSubject}
                                onChange={(e) => setCurrentTemplate({
                                  ...currentTemplate,
                                  winnerSubject: e.target.value
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                템플릿 내용
                              </label>
                              <textarea
                                value={currentTemplate.winnerTemplate}
                                onChange={(e) => setCurrentTemplate({
                                  ...currentTemplate,
                                  winnerTemplate: e.target.value
                                })}
                                rows={15}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                placeholder="HTML 템플릿을 입력하세요..."
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="mb-2">
                              <strong>제목:</strong> {currentTemplate.winnerSubject}
                            </div>
                            <div className="text-sm text-gray-600">
                              <strong>템플릿:</strong> HTML 템플릿 (미리보기 생략)
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 미당첨자 이메일 템플릿 */}
                      <div>
                        <h3 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          미당첨자 이메일
                        </h3>
                        
                        {isEditing ? (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                제목
                              </label>
                              <input
                                type="text"
                                value={currentTemplate.loserSubject}
                                onChange={(e) => setCurrentTemplate({
                                  ...currentTemplate,
                                  loserSubject: e.target.value
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                템플릿 내용
                              </label>
                              <textarea
                                value={currentTemplate.loserTemplate}
                                onChange={(e) => setCurrentTemplate({
                                  ...currentTemplate,
                                  loserTemplate: e.target.value
                                })}
                                rows={15}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                placeholder="HTML 템플릿을 입력하세요..."
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="mb-2">
                              <strong>제목:</strong> {currentTemplate.loserSubject}
                            </div>
                            <div className="text-sm text-gray-600">
                              <strong>템플릿:</strong> HTML 템플릿 (미리보기 생략)
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 템플릿 변수 안내 */}
                      <Alert variant="info" title="템플릿 변수">
                        <div className="text-sm space-y-1">
                          <p><strong>사용 가능한 변수:</strong></p>
                          <ul className="list-disc list-inside space-y-1 ml-4">
                            <li><code>{'{{employeeName}}'}</code> - 직원 이름</li>
                            <li><code>{'{{accommodationName}}'}</code> - 숙소 이름</li>
                            <li><code>{'{{checkInDate}}'}</code> - 체크인 날짜</li>
                            <li><code>{'{{checkOutDate}}'}</code> - 체크아웃 날짜</li>
                            <li><code>{'{{rank}}'}</code> - 당첨 순위 (당첨자만)</li>
                            <li><code>{'{{totalApplicants}}'}</code> - 총 신청자 수 (미당첨자만)</li>
                            <li><code>{'{{winners}}'}</code> - 당첨자 수 (미당첨자만)</li>
                            <li><code>{'{{competitionRate}}'}</code> - 경쟁률 (미당첨자만)</li>
                          </ul>
                        </div>
                      </Alert>

                      {/* 초기화 버튼 */}
                      {isEditing && (
                        <div className="flex justify-end">
                          <Button
                            variant="outline"
                            onClick={handleResetTemplate}
                            leftIcon={<RotateCcw className="h-4 w-4" />}
                          >
                            기본값으로 초기화
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
