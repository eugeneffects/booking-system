/**
 * 회원가입 페이지
 * 신규 임직원 계정 생성을 처리합니다.
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, User, Building, Phone, Hash } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { MainLayout } from '@/components/layouts/MainLayout'

export default function SignUpPage() {
  const router = useRouter()
  const { signUp, isAuthenticated, isLoading: authLoading, user } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    employeeNumber: '',
    department: '',
    phone: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // 이미 로그인한 경우 신청 현황으로 리다이렉트
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.push('/applications')
    }
  }, [isAuthenticated, authLoading, router])

  /**
   * 폼 유효성 검사
   */
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // 이메일 검증
    if (!formData.email) {
      newErrors.email = '이메일을 입력해주세요.'
    } else if (!formData.email.includes('@') || !formData.email.includes('.')) {
      newErrors.email = '올바른 이메일 형식을 입력해주세요.'
    }

    // 비밀번호 검증
    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요.'
    } else if (formData.password.length < 8) {
      newErrors.password = '비밀번호는 8자 이상이어야 합니다.'
    } else if (!/[A-Za-z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
      newErrors.password = '비밀번호는 영문과 숫자를 포함해야 합니다.'
    }

    // 비밀번호 확인
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호를 다시 입력해주세요.'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.'
    }

    // 이름 검증
    if (!formData.name) {
      newErrors.name = '이름을 입력해주세요.'
    } else if (formData.name.length < 2) {
      newErrors.name = '이름은 2자 이상이어야 합니다.'
    }

    // 사번 검증
    if (!formData.employeeNumber) {
      newErrors.employeeNumber = '사번을 입력해주세요.'
    }

    // 부서 검증
    if (!formData.department) {
      newErrors.department = '부서를 입력해주세요.'
    }

    // 연락처 검증
    if (!formData.phone) {
      newErrors.phone = '연락처를 입력해주세요.'
    } else if (!/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/.test(formData.phone.replace(/-/g, ''))) {
      newErrors.phone = '올바른 휴대폰 번호를 입력해주세요.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  /**
   * 회원가입 처리
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    // 회원가입 데이터 준비 (confirmPassword 제외)
    const { confirmPassword: _, ...signUpData } = formData
    
    // useAuth의 signUp 함수 사용
    await signUp(signUpData)
  }

  /**
   * 입력 필드 변경 처리
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // 입력 시 해당 필드의 에러 메시지 제거
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  return (
    <MainLayout user={user ?? null}>
      <div className="mx-auto w-full max-w-md space-y-8">
        {/* 로고 및 제목 */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <Building className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            회원가입
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            임직원 정보를 입력하여 계정을 생성하세요
          </p>
        </div>

        {/* 회원가입 폼 */}
        <Card className="mt-8">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* 이메일 */}
            <Input
              label="회사 이메일"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="yourname@company.com"
              error={errors.email}
              leftAddon={<Mail className="h-4 w-4" />}
              required
              autoComplete="email"
            />

            {/* 비밀번호 */}
            <Input
              label="비밀번호"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="8자 이상, 영문+숫자"
              error={errors.password}
              leftAddon={<Lock className="h-4 w-4" />}
              required
              autoComplete="new-password"
            />

            {/* 비밀번호 확인 */}
            <Input
              label="비밀번호 확인"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="비밀번호를 다시 입력하세요"
              error={errors.confirmPassword}
              leftAddon={<Lock className="h-4 w-4" />}
              required
              autoComplete="new-password"
            />

            <div className="h-4" /> {/* 구분선 */}

            {/* 이름 */}
            <Input
              label="이름"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="홍길동"
              error={errors.name}
              leftAddon={<User className="h-4 w-4" />}
              required
            />

            {/* 사번 */}
            <Input
              label="사번"
              type="text"
              name="employeeNumber"
              value={formData.employeeNumber}
              onChange={handleChange}
              placeholder="A12345"
              error={errors.employeeNumber}
              leftAddon={<Hash className="h-4 w-4" />}
              required
            />

            {/* 부서 */}
            <Input
              label="부서"
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              placeholder="개발팀"
              error={errors.department}
              leftAddon={<Building className="h-4 w-4" />}
              required
            />

            {/* 연락처 */}
            <Input
              label="연락처"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="010-1234-5678"
              error={errors.phone}
              leftAddon={<Phone className="h-4 w-4" />}
              required
              autoComplete="tel"
            />

            <div className="pt-4 space-y-3">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={authLoading}
                className="w-full"
              >
                회원가입
              </Button>

            </div>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">이미 계정이 있으신가요?</span>{' '}
            <Link href="/" className="font-medium text-blue-600 hover:text-blue-500">
              로그인
            </Link>
          </div>
        </Card>

        {/* 도움말 */}
        <div className="text-center text-sm text-gray-600">
          <p>
            회원가입에 문제가 있으신가요?{' '}
            <Link href="/help" className="font-medium text-blue-600 hover:text-blue-500">
              도움말 센터
            </Link>
          </p>
        </div>
      </div>
    </MainLayout>
  )
}

