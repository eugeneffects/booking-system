/**
 * 홈페이지 / 로그인 페이지
 * 로그인하지 않은 사용자에게는 로그인 화면을, 로그인한 사용자에게는 대시보드를 보여줍니다.
 */


'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { Mail, Lock, Building, Calendar, Users, Trophy } from 'lucide-react'
import { MainLayout } from '@/components/layouts/MainLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'

/**
 * 숙소 정보 데이터 (임시)
 * 실제로는 DB에서 가져옵니다.
 */
const accommodations = [
  {
    id: '1',
    name: '아난티 코브',
    type: 'ANANTI',
    description: '부산의 아름다운 해안가에 위치한 프리미엄 리조트',
    restrictionYears: 3,
    image: '/images/ananti.jpg',
  },
  {
    id: '2',
    name: '리솜 비발디파크',
    type: 'SONOVEL',
    description: '사계절 즐길 수 있는 홍천의 종합 리조트',
    restrictionYears: 1,
    image: '/images/sonovel.jpg',
  },
]

/**
 * 통계 데이터 (임시)
 * 실제로는 DB에서 가져옵니다.
 */
const stats = [
  { label: '이번 달 신청자', value: '127명', icon: Users },
  { label: '진행 중인 추첨', value: '3건', icon: Calendar },
  { label: '이번 달 당첨자', value: '24명', icon: Trophy },
  { label: '등록된 숙소', value: '5개', icon: Building },
]

export default function HomePage() {
  const router = useRouter()
  const { user, isLoading, isInitialized, isAuthenticated, signIn } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // 환경변수 확인
  const isSupabaseConfigured = !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )



  // 로그인된 사용자는 자동으로 신청 현황 페이지로 리다이렉트 (인증이 완료된 후에만)
  useEffect(() => {
    if (isInitialized && !isLoading && isAuthenticated && user) {
      router.push('/applications')
    }
  }, [isInitialized, isLoading, isAuthenticated, user, router])

  // 로그인된 사용자가 로그인 페이지에 접근한 경우 (인증이 완료된 후에만)
  if (isInitialized && !isLoading && isAuthenticated && user) {
    return (
      <MainLayout user={user}>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">페이지 이동 중...</p>
          </div>
        </div>
      </MainLayout>
    )
  }


  /**
   * 폼 유효성 검사
   */
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email) {
      newErrors.email = '이메일을 입력해주세요.'
    } else if (!formData.email.includes('@') || !formData.email.includes('.')) {
      newErrors.email = '올바른 이메일 형식을 입력해주세요.'
    }

    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요.'
    } else if (formData.password.length < 6) {
      newErrors.password = '비밀번호는 6자 이상이어야 합니다.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  /**
   * 로그인 처리
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    const result = await signIn(formData)
    
    // 로그인 실패 시에만 로딩 상태 해제 (성공 시는 리다이렉트됨)
    if (!result.success) {
      setIsSubmitting(false)
    }
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



  // AuthProvider에서 이미 로딩 상태를 처리하므로 여기서는 제거

  return (
    <MainLayout user={user ?? null}>
      <div className="mx-auto max-w-md space-y-8">
        {/* 로고 및 제목 */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <Building className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            숙소예약 추첨 시스템
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            회사 계정으로 로그인하세요
          </p>
        </div>

        {/* Supabase 미설정 경고 */}
        {!isSupabaseConfigured && (
          <Alert variant="warning" title="설정 필요" className="mb-6">
            <p className="text-sm">
              Supabase 환경변수가 설정되지 않았습니다. 
              <code className="mx-1 rounded bg-yellow-200 px-1 py-0.5 text-xs">.env.local</code> 
              파일을 확인해주세요.
            </p>
          </Alert>
        )}

        {/* 로그인 폼 */}
        <Card className="mt-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <Input
                label="회사 이메일"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="youremail@company.com"
                error={errors.email}
                leftAddon={<Mail className="h-4 w-4" />}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <Input
                label="비밀번호"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                error={errors.password}
                leftAddon={<Lock className="h-4 w-4" />}
                required
                autoComplete="current-password"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">로그인 상태 유지</span>
              </label>

              <Link
                href="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                비밀번호 찾기
              </Link>
            </div>

            <div className="space-y-3">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                className="w-full"
              >
                로그인
              </Button>
              

            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500"></span>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">아직 계정이 없으신가요?</span>{' '}
            <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
              회원가입
            </Link>
          </div>
        </Card>


      </div>
    </MainLayout>
  )
}