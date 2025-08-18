/**
 * 임직원 관리 페이지
 */

'use client'

import { useState } from 'react'
import { MainLayout } from '@/components/layouts/MainLayout'
import { EmployeeList } from '@/components/admin/EmployeeList'
import { EmployeeExcelUpload } from '@/components/admin/EmployeeExcelUpload'
import { EmployeeForm } from '@/components/admin/EmployeeForm'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Upload, Users, Plus, Home } from 'lucide-react'
import Link from 'next/link'
import { useRequireAdmin } from '@/hooks/useAuth'
import type { Employee, EmployeeImportResult } from '@/types/employee'

type ViewMode = 'list' | 'upload' | 'form'

export default function EmployeesPage() {
  const { user, isLoading } = useRequireAdmin()
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleImportSuccess = (_result: EmployeeImportResult) => {
    // 임포트 완료 후 목록으로 돌아가기
    setViewMode('list')
    setRefreshTrigger(prev => prev + 1) // 목록 새로고침 트리거
  }

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee)
    setViewMode('form')
  }

  const handleAdd = () => {
    setSelectedEmployee(null)
    setViewMode('form')
  }

  const handleFormSuccess = (employee: Employee) => {
    console.log('임직원 저장 완료:', employee)
    setViewMode('list')
    setSelectedEmployee(null)
    setRefreshTrigger(prev => prev + 1)
  }

  const handleFormCancel = () => {
    setViewMode('list')
    setSelectedEmployee(null)
  }

  // 로딩 중이거나 인증 확인 중인 경우
  if (isLoading) {
    return (
      <MainLayout user={null}>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">인증 확인 중...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout user={user}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* 헤더 */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">임직원 관리</h1>
                <p className="text-gray-600">임직원 정보를 등록하고 관리합니다.</p>
              </div>
              
              {/* 대시보드로 돌아가기 버튼 */}
              <Link href="/admin/dashboard">
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <Home className="h-4 w-4" />
                  대시보드
                </Button>
              </Link>
            </div>
          </div>

          {/* 탭 네비게이션 */}
          <Card className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                <button
                  onClick={() => setViewMode('list')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    viewMode === 'list'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    임직원 목록
                  </div>
                </button>
                <button
                  onClick={() => setViewMode('upload')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    viewMode === 'upload'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    엑셀 업로드
                  </div>
                </button>
                <button
                  onClick={() => setViewMode('form')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    viewMode === 'form'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    개별 등록
                  </div>
                </button>
              </nav>
            </div>
          </Card>

          {/* 컨텐츠 */}
          <div>
            {viewMode === 'list' && (
              <EmployeeList 
                onEdit={handleEdit}
                onAdd={handleAdd}
                refreshTrigger={refreshTrigger}
              />
            )}

            {viewMode === 'upload' && (
              <Card>
                <div className="p-6">
                  <EmployeeExcelUpload onSuccess={handleImportSuccess} />
                </div>
              </Card>
            )}

            {viewMode === 'form' && (
              <EmployeeForm
                employee={selectedEmployee}
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
              />
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
