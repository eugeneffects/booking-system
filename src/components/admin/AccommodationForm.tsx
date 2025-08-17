/**
 * 숙소 등록/수정 폼 컴포넌트
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { createAccommodation, updateAccommodation } from '@/lib/actions/accommodation'
import type { Accommodation, CreateAccommodationData, UpdateAccommodationData } from '@/types/accommodation'
import { ACCOMMODATION_TYPE_OPTIONS } from '@/types/accommodation'

interface AccommodationFormProps {
  accommodation?: Accommodation | null
  onSuccess?: (accommodation: Accommodation) => void
  onCancel?: () => void
}

export function AccommodationForm({ accommodation, onSuccess, onCancel }: AccommodationFormProps) {
  const [formData, setFormData] = useState<{
    name: string
    type: 'ANANTI' | 'SONOBEL' | 'OTHER'
    restriction_years: number
    description: string
    is_active: boolean
  }>({
    name: '',
    type: 'OTHER',
    restriction_years: 1,
    description: '',
    is_active: true
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEdit = !!accommodation

  // 수정 모드일 때 기존 데이터 로드
  useEffect(() => {
    if (accommodation) {
      setFormData({
        name: accommodation.name,
        type: accommodation.type,
        restriction_years: accommodation.restriction_years,
        description: accommodation.description || '',
        is_active: accommodation.is_active
      })
    }
  }, [accommodation])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      let result: Accommodation

      if (isEdit && accommodation) {
        // 수정
        const updateData: UpdateAccommodationData = {
          name: formData.name,
          type: formData.type,
          restriction_years: formData.restriction_years,
          description: formData.description || undefined,
          is_active: formData.is_active
        }
        result = await updateAccommodation(accommodation.id, updateData)
      } else {
        // 생성
        const createData: CreateAccommodationData = {
          name: formData.name,
          type: formData.type,
          restriction_years: formData.restriction_years,
          description: formData.description || undefined,
          is_active: formData.is_active
        }
        result = await createAccommodation(createData)
      }

      if (onSuccess) {
        onSuccess(result)
      }
    } catch (error) {
      console.error('숙소 저장 실패:', error)
      setError(error instanceof Error ? error.message : '저장에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof typeof formData, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Card>
      <div className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {isEdit ? '숙소 정보 수정' : '새 숙소 등록'}
          </h3>
          <p className="text-gray-600">
            {isEdit ? '숙소 정보를 수정합니다.' : '새로운 숙소를 등록합니다.'}
          </p>
        </div>

        {error && (
          <Alert variant="error" title="오류" className="mb-6">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 숙소명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              숙소명 *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="숙소명을 입력하세요"
              required
            />
          </div>

          {/* 숙소 타입 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              숙소 타입 *
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              required
            >
              {ACCOMMODATION_TYPE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              아난티: 3년 제한, 소노벨: 1년 제한이 일반적입니다.
            </p>
          </div>

          {/* 제한 기간 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              제한 기간 (년) *
            </label>
            <Input
              type="number"
              min="1"
              max="10"
              value={formData.restriction_years}
              onChange={(e) => handleInputChange('restriction_years', parseInt(e.target.value) || 1)}
              placeholder="제한 기간을 입력하세요"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              당첨 후 해당 기간 동안 재신청이 제한됩니다.
            </p>
          </div>

          {/* 설명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              설명
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="숙소에 대한 설명을 입력하세요 (선택사항)"
            />
          </div>

          {/* 활성 상태 */}
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => handleInputChange('is_active', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">활성화</span>
            </label>
            <p className="mt-1 text-xs text-gray-500">
              비활성화된 숙소는 신청에서 제외됩니다.
            </p>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 pt-6">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? '저장 중...' : (isEdit ? '수정' : '등록')}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
                취소
              </Button>
            )}
          </div>
        </form>
      </div>
    </Card>
  )
}
