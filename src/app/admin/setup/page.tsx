'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { toast } from 'react-hot-toast'
import { MainLayout } from '@/components/layouts/MainLayout'

export default function AdminSetupPage() {
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [adminStatus, setAdminStatus] = useState<any>(null)
  
  const checkAdminStatus = async () => {
    try {
      const response = await fetch('/api/auth/check-admin')
      const data = await response.json()
      setAdminStatus(data)
    } catch (error) {
      console.error('관리자 상태 확인 실패:', error)
    }
  }
  
  const createAdmin = async () => {
    if (!email) {
      toast.error('이메일을 입력해주세요.')
      return
    }
    
    setIsCreating(true)
    try {
      const response = await fetch('/api/admin/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast.success('관리자로 추가되었습니다.')
        setEmail('')
        checkAdminStatus()
      } else {
        toast.error(data.error || '관리자 추가 실패')
      }
    } catch (error) {
      console.error('관리자 추가 실패:', error)
      toast.error('관리자 추가 중 오류가 발생했습니다.')
    } finally {
      setIsCreating(false)
    }
  }
  
  return (
    <MainLayout user={user}>
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-8">관리자 설정</h1>
        
        <Card className="mb-8">
          <h2 className="text-xl font-semibold mb-4">현재 관리자 상태</h2>
          <Button onClick={checkAdminStatus} className="mb-4">
            상태 확인
          </Button>
          {adminStatus && (
            <div className="bg-gray-100 p-4 rounded">
              <p><strong>관리자 권한:</strong> {adminStatus.isAdmin ? '있음' : '없음'}</p>
              {adminStatus.adminRole && <p><strong>역할:</strong> {adminStatus.adminRole}</p>}
              {adminStatus.error && <p><strong>오류:</strong> {adminStatus.error}</p>}
            </div>
          )}
        </Card>
        
        <Card>
          <h2 className="text-xl font-semibold mb-4">관리자 추가</h2>
          <div className="flex gap-4">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="관리자로 추가할 이메일"
              className="flex-1"
            />
            <Button 
              onClick={createAdmin}
              isLoading={isCreating}
            >
              관리자로 추가
            </Button>
          </div>
        </Card>
      </div>
    </MainLayout>
  )
}
