/**
 * 임직원 등록/수정 폼 컴포넌트
 */

'use client'

import { useState } from 'react'
import { User, Building, Mail, Phone, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { createEmployee, updateEmployee } from '@/lib/actions/employee'
import type { Employee, CreateEmployeeData, UpdateEmployeeData } from '@/types/employee'

interface EmployeeFormProps {
  employee?: Employee | null
  onSuccess?: (employee: Employee) => void
  onCancel?: () => void
}

interface FormData {
  employee_number: string
  name: string
  department: string
  company_email: string
  phone: string
  is_active: boolean
}

export function EmployeeForm({ employee, onSuccess, onCancel }: EmployeeFormProps) {
  const isEdit = !!employee

  const [formData, setFormData] = useState<FormData>({
    employee_number: employee?.employee_number || '',
    name: employee?.name || '',
    department: employee?.department || '',
    company_email: employee?.company_email || '',
    phone: employee?.phone || '',
    is_active: employee?.is_active ?? true
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // 폼 데이터 변경 핸들러
  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // 해당 필드의 에러 메시지 제거
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  // 유효성 검사
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.employee_number.trim()) {
      errors.employee_number = '사번을 입력해주세요.'
    }

    if (!formData.name.trim()) {
      errors.name = '이름을 입력해주세요.'
    }

    if (!formData.department.trim()) {
      errors.department = '소속을 입력해주세요.'
    }

    if (!formData.company_email.trim()) {
      errors.company_email = '회사 이메일을 입력해주세요.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.company_email)) {
      errors.company_email = '올바른 이메일 형식을 입력해주세요.'
    }

    if (!formData.phone.trim()) {
      errors.phone = '연락처를 입력해주세요.'
    } else if (!/^[0-9-+().\s]+$/.test(formData.phone)) {
      errors.phone = '올바른 연락처 형식을 입력해주세요.'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      let result: Employee

      if (isEdit && employee) {
        const updateData: UpdateEmployeeData = {
          employee_number: formData.employee_number.trim(),
          name: formData.name.trim(),
          department: formData.department.trim(),
          company_email: formData.company_email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          is_active: formData.is_active
        }
        result = await updateEmployee(employee.id, updateData)
      } else {
        const createData: CreateEmployeeData = {
          employee_number: formData.employee_number.trim(),
          name: formData.name.trim(),
          department: formData.department.trim(),
          company_email: formData.company_email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          is_active: formData.is_active
        }
        result = await createEmployee(createData)
      }

      onSuccess?.(result)
    } catch (err) {
      console.error('임직원 저장 실패:', err)
      setError(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 폼 리셋
  const handleReset = () => {
    if (isEdit && employee) {
      setFormData({
        employee_number: employee.employee_number,
        name: employee.name,
        department: employee.department,
        company_email: employee.company_email,
        phone: employee.phone,
        is_active: employee.is_active
      })
    } else {
      setFormData({
        employee_number: '',
        name: '',
        department: '',
        company_email: '',
        phone: '',
        is_active: true
      })
    }
    setValidationErrors({})
    setError(null)
  }

  return (
    <Card>
      <div className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {isEdit ? '임직원 정보 수정' : '임직원 등록'}
          </h3>
          <p className="text-sm text-gray-600">
            {isEdit 
              ? '임직원 정보를 수정할 수 있습니다.' 
              : '새로운 임직원을 등록할 수 있습니다.'
            }
          </p>
        </div>

        {error && (
          <Alert variant="error" title="저장 실패" className="mb-6">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            {/* 사번 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline h-4 w-4 mr-1" />
                사번 *
              </label>
              <Input
                value={formData.employee_number}
                onChange={(e) => handleChange('employee_number', e.target.value)}
                placeholder="사번을 입력하세요"
                error={validationErrors.employee_number}
                disabled={isLoading}
              />
            </div>

            {/* 이름 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이름 *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="이름을 입력하세요"
                error={validationErrors.name}
                disabled={isLoading}
              />
            </div>

            {/* 소속 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building className="inline h-4 w-4 mr-1" />
                소속 *
              </label>
              <Input
                value={formData.department}
                onChange={(e) => handleChange('department', e.target.value)}
                placeholder="소속 부서를 입력하세요"
                error={validationErrors.department}
                disabled={isLoading}
              />
            </div>

            {/* 회사 이메일 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="inline h-4 w-4 mr-1" />
                회사 이메일 *
              </label>
              <Input
                type="email"
                value={formData.company_email}
                onChange={(e) => handleChange('company_email', e.target.value)}
                placeholder="이메일을 입력하세요"
                error={validationErrors.company_email}
                disabled={isLoading}
              />
            </div>

            {/* 연락처 */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="inline h-4 w-4 mr-1" />
                연락처 *
              </label>
              <Input
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="연락처를 입력하세요"
                error={validationErrors.phone}
                disabled={isLoading}
              />
            </div>

            {/* 재직 상태 */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                재직 상태
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={formData.is_active === true}
                    onChange={() => handleChange('is_active', true)}
                    className="mr-2"
                    disabled={isLoading}
                  />
                  재직
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={formData.is_active === false}
                    onChange={() => handleChange('is_active', false)}
                    className="mr-2"
                    disabled={isLoading}
                  />
                  퇴직
                </label>
              </div>
            </div>
          </div>

          {/* 버튼 영역 */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              <X className="mr-2 h-4 w-4" />
              취소
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              onClick={handleReset}
              disabled={isLoading}
            >
              초기화
            </Button>
            
            <Button
              type="submit"
              isLoading={isLoading}
              leftIcon={<Save className="h-4 w-4" />}
            >
              {isEdit ? '수정' : '등록'}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  )
}
