/**
 * 관리자 설정 페이지
 */

'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { MainLayout } from '@/components/layouts/MainLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { sendTestEmail } from '@/lib/actions/email'
import { Mail, Settings, Send, CheckCircle, XCircle } from 'lucide-react'

// 이메일 설정 상태 컴포넌트를 동적으로 로드
const EmailStatusDisplay = dynamic(() => Promise.resolve(EmailStatusComponent), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      <span className="ml-2 text-gray-500">설정 정보를 불러오는 중...</span>
    </div>
  )
})

function EmailStatusComponent() {
  const [emailStatus, setEmailStatus] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadEmailStatus = async () => {
      try {
        const response = await fetch('/api/email/status')
        const status = await response.json()
        setEmailStatus(status)
      } catch (error) {
        console.error('이메일 상태 로드 실패:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadEmailStatus()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-500">설정 정보를 불러오는 중...</span>
      </div>
    )
  }

  if (!emailStatus) {
    return (
      <div className="text-center py-8 text-red-500">
        설정 정보를 불러올 수 없습니다.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-700 font-medium">SMTP 호스트:</span>
          <span className="font-mono text-gray-900">{emailStatus.smtpHost}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-700 font-medium">SMTP 포트:</span>
          <span className="font-mono text-gray-900">{emailStatus.smtpPort}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-700 font-medium">발신자 이름:</span>
          <span className="font-mono text-gray-900">{emailStatus.fromName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-700 font-medium">발신자 이메일:</span>
          <span className="font-mono text-gray-900">{emailStatus.fromAddress}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-700 font-medium">SMTP 사용자:</span>
          <span className={`font-mono font-semibold ${emailStatus.smtpUser === '설정됨' ? 'text-green-600' : 'text-red-600'}`}>
            {emailStatus.smtpUser}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-700 font-medium">SMTP 비밀번호:</span>
          <span className={`font-mono font-semibold ${emailStatus.smtpPassword === '설정됨' ? 'text-green-600' : 'text-red-600'}`}>
            {emailStatus.smtpPassword}
          </span>
        </div>
        <div className="flex justify-between pt-3 border-t border-gray-200">
          <span className="text-gray-700 font-medium">전체 설정 상태:</span>
          <span className={`font-bold text-base ${emailStatus.smtpConfigured ? 'text-green-600' : 'text-red-600'}`}>
            {emailStatus.smtpConfigured ? '✅ 설정 완료' : '❌ 설정 필요'}
          </span>
        </div>
      </div>

      {/* 디버깅 정보 (개발 환경에서만) */}
      {emailStatus.debug && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
            디버깅 정보 (클릭하여 펼치기)
          </summary>
          <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono">
            <div>환경: {emailStatus.debug.nodeEnv}</div>
            <div>환경변수 파일 로드: {emailStatus.debug.hasEnvFile ? '예' : '아니오'}</div>
            <div>감지된 환경변수: {emailStatus.debug.allEnvKeys.join(', ') || '없음'}</div>
          </div>
        </details>
      )}
    </div>
  )
}

export default function SettingsPage() {
  const [testEmail, setTestEmail] = useState('')
  const [isTestingSend, setIsTestingSend] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleTestEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!testEmail.trim()) {
      setTestResult({ success: false, message: '이메일 주소를 입력해주세요.' })
      return
    }

    try {
      setIsTestingSend(true)
      setTestResult(null)

      const result = await sendTestEmail(testEmail)
      
      if (result.success) {
        setTestResult({ 
          success: true, 
          message: `테스트 이메일이 성공적으로 전송되었습니다. (Message ID: ${result.messageId})` 
        })
      } else {
        setTestResult({ 
          success: false, 
          message: `이메일 전송 실패: ${result.error}` 
        })
      }
    } catch (error) {
      setTestResult({ 
        success: false, 
        message: `오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}` 
      })
    } finally {
      setIsTestingSend(false)
    }
  }

  return (
    <MainLayout user={null}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Settings className="h-6 w-6" />
              시스템 설정
            </h1>
            <p className="text-gray-600">시스템 설정을 관리하고 기능을 테스트할 수 있습니다.</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* 이메일 설정 테스트 */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  이메일 설정 테스트
                </h3>
                
                <p className="text-sm text-gray-600 mb-4">
                  이메일 서비스가 정상적으로 작동하는지 테스트할 수 있습니다.
                </p>

                <form onSubmit={handleTestEmail} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      테스트 이메일 주소
                    </label>
                    <Input
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="test@example.com"
                      disabled={isTestingSend}
                    />
                  </div>

                  <Button
                    type="submit"
                    isLoading={isTestingSend}
                    leftIcon={<Send className="h-4 w-4" />}
                    className="w-full"
                  >
                    테스트 이메일 전송
                  </Button>
                </form>

                {testResult && (
                  <div className="mt-4">
                    <Alert 
                      variant={testResult.success ? "success" : "error"}
                      title={testResult.success ? "전송 성공" : "전송 실패"}
                    >
                      {testResult.message}
                    </Alert>
                  </div>
                )}
              </div>
            </Card>

            {/* 이메일 설정 정보 */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  현재 이메일 설정
                </h3>
                
                <EmailStatusDisplay />

                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 설정 안내</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p>이메일 기능을 사용하려면 <code className="bg-blue-100 px-1 py-0.5 rounded">.env.local</code> 파일에 SMTP 설정이 필요합니다.</p>
                    <p>설정 후 <strong>서버를 재시작</strong>해주세요.</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* 환경변수 설정 가이드 */}
            <Card className="lg:col-span-2">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  이메일 환경변수 설정 가이드
                </h3>
                
                <p className="text-sm text-gray-600 mb-4">
                  <code className="bg-gray-100 px-1 py-0.5 rounded">.env.local</code> 파일에 다음 환경변수를 추가하세요:
                </p>

                <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
                  <pre className="text-sm">
{`# SMTP 설정 (Gmail 예시)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-digit-app-password

# 발신자 정보
EMAIL_FROM_NAME=숙소예약 추첨 시스템
EMAIL_FROM_ADDRESS=noreply@company.com`}
                  </pre>
                </div>

                <div className="mt-4 space-y-3 text-sm">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-amber-800 font-medium">
                      <strong>Gmail 설정 방법:</strong>
                    </p>
                    <ol className="mt-2 text-amber-700 space-y-1 list-decimal list-inside">
                      <li>Google 계정 → 보안 → 2단계 인증 활성화</li>
                      <li>앱 비밀번호 생성 (16자리 코드)</li>
                      <li>생성된 비밀번호를 SMTP_PASSWORD에 입력</li>
                      <li>SMTP_USER에는 실제 Gmail 주소 입력</li>
                    </ol>
                  </div>
                  
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 font-medium">
                      <strong>⚠️ 중요:</strong>
                    </p>
                    <ul className="mt-2 text-red-700 space-y-1 list-disc list-inside">
                      <li>환경변수 설정 후 <strong>반드시 서버 재시작</strong></li>
                      <li>공백이나 따옴표 없이 직접 값만 입력</li>
                      <li>Gmail 일반 비밀번호가 아닌 <strong>앱 비밀번호</strong> 사용</li>
                    </ul>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

