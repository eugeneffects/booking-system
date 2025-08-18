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
import Image from 'next/image'
import { useRef } from 'react'

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
  const [uploading, setUploading] = useState(false)
  const [images, setImages] = useState<string[]>(accommodation?.image_urls || [])
  const fileInputRef = useRef<HTMLInputElement | null>(null)

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
      setImages(accommodation.image_urls || [])
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
          is_active: formData.is_active,
          image_urls: images
        }
        result = await updateAccommodation(accommodation.id, updateData)
      } else {
        // 생성
        const createData: CreateAccommodationData = {
          name: formData.name,
          type: formData.type,
          restriction_years: formData.restriction_years,
          description: formData.description || undefined,
          is_active: formData.is_active,
          image_urls: images
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

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !accommodation) return
    try {
      setUploading(true)
      const file = files[0]
      const form = new FormData()
      form.append('file', file)
      form.append('accommodationId', accommodation.id)
      const res = await fetch('/api/admin/upload-accommodation-image', {
        method: 'POST',
        body: form,
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || '업로드 실패')
      }
      setImages(prev => Array.from(new Set([...(prev || []), data.url])))
      // 폼 데이터에도 반영
    } catch (err) {
      console.error('이미지 업로드 실패:', err)
      setError(err instanceof Error ? err.message : '이미지 업로드 실패')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
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
          {/* 이미지 업로드 섹션 (수정 모드에서 표시) */}
          {isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">대표 이미지</label>
              <div className="flex flex-wrap gap-3 mb-3">
                {images && images.length > 0 ? (
                  images.map((url) => (
                    <div key={url} className="relative w-28 h-20 rounded-md overflow-hidden border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="숙소 이미지" className="object-cover w-full h-full" />
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500">등록된 이미지가 없습니다.</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                <Button type="button" variant="outline" onClick={handleUploadClick} disabled={uploading}>
                  {uploading ? '업로드 중...' : '이미지 추가'}
                </Button>
              </div>
              <p className="mt-1 text-xs text-gray-500">첫 번째 이미지가 신청 화면 카드에 표시됩니다.</p>
            </div>
          )}

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
