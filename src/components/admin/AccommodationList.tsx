/**
 * 숙소 목록 컴포넌트
 */

'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, Edit, Trash2, Building, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { getAccommodations, deleteAccommodation } from '@/lib/actions/accommodation'
import type { Accommodation, AccommodationListParams } from '@/types/accommodation'
import { ACCOMMODATION_TYPES } from '@/types/accommodation'

interface AccommodationListProps {
  onEdit?: (accommodation: Accommodation) => void
  onAdd?: () => void
  onManagePeriods?: (accommodation: Accommodation) => void
  refreshTrigger?: number
}

export function AccommodationList({ onEdit, onAdd, onManagePeriods, refreshTrigger }: AccommodationListProps) {
  const [accommodations, setAccommodations] = useState<Accommodation[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [selectedType, setSelectedType] = useState<'ANANTI' | 'SONOBEL' | 'OTHER' | ''>('')
  const [showInactive, setShowInactive] = useState(false)

  const limit = 20

  // 데이터 로드
  const loadAccommodations = async () => {
    try {
      setLoading(true)
      
      const params: AccommodationListParams = {
        page,
        limit,
        search: search || undefined,
        type: selectedType || undefined,
        is_active: showInactive ? undefined : true
      }

      const result = await getAccommodations(params)
      setAccommodations(result.accommodations)
      setTotal(result.total)
    } catch (error) {
      console.error('숙소 목록 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  // 숙소 삭제
  const handleDelete = async (accommodation: Accommodation) => {
    if (!confirm(`${accommodation.name} 숙소를 비활성화하시겠습니까?`)) {
      return
    }

    try {
      await deleteAccommodation(accommodation.id)
      loadAccommodations() // 목록 새로고침
    } catch (error) {
      console.error('숙소 삭제 실패:', error)
      alert('삭제에 실패했습니다: ' + (error instanceof Error ? error.message : '알 수 없는 오류'))
    }
  }

  // 검색 핸들러
  const handleSearch = () => {
    setPage(1)
    loadAccommodations()
  }

  // 필터 초기화
  const resetFilters = () => {
    setSearch('')
    setSelectedType('')
    setShowInactive(false)
    setPage(1)
  }

  // 효과
  useEffect(() => {
    loadAccommodations()
  }, [page, showInactive])

  useEffect(() => {
    if (refreshTrigger) {
      loadAccommodations()
    }
  }, [refreshTrigger])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            숙소 관리 ({total}개)
          </h2>
        </div>
        {onAdd && (
          <Button onClick={onAdd} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            숙소 추가
          </Button>
        )}
      </div>

      {/* 필터 영역 */}
      <Card>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 검색 */}
            <div className="md:col-span-2">
              <div className="flex gap-2">
                <Input
                  placeholder="숙소명으로 검색..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} variant="outline">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* 타입 필터 */}
            <div>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as 'ANANTI' | 'SONOBEL' | 'OTHER' | '')}
              >
                <option value="">전체 타입</option>
                <option value="ANANTI">아난티</option>
                <option value="SONOBEL">소노벨</option>
                <option value="OTHER">기타</option>
              </select>
            </div>

            {/* 상태 필터 */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">비활성 포함</span>
              </label>
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                초기화
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* 목록 */}
      {loading ? (
        <Card>
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">로딩 중...</p>
          </div>
        </Card>
      ) : accommodations.length === 0 ? (
        <Card>
          <div className="p-8 text-center text-gray-500">
            <Building className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>등록된 숙소가 없습니다.</p>
          </div>
        </Card>
      ) : (
        <>
          {/* 카드 형태 목록 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accommodations.map((accommodation) => (
              <Card key={accommodation.id} className="p-6">
                <div className="space-y-4">
                  {/* 숙소 정보 */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {accommodation.name}
                      </h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        accommodation.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {accommodation.is_active ? '활성' : '비활성'}
                      </span>
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">타입:</span> {ACCOMMODATION_TYPES[accommodation.type]}
                      </p>
                      <p>
                        <span className="font-medium">제한 기간:</span> {accommodation.restriction_years}년
                      </p>
                      {accommodation.description && (
                        <p>
                          <span className="font-medium">설명:</span> {accommodation.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        등록일: {new Date(accommodation.created_at).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex gap-2">
                    {onManagePeriods && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onManagePeriods(accommodation)}
                        className="flex-1 flex items-center justify-center gap-1"
                      >
                        <Calendar className="h-3 w-3" />
                        날짜 슬롯
                      </Button>
                    )}
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(accommodation)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {accommodation.is_active && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(accommodation)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700">
                전체 {total}개 중 {((page - 1) * limit) + 1}-{Math.min(page * limit, total)}개 표시
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  이전
                </Button>
                <span className="px-3 py-2 text-sm text-gray-700">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  다음
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
