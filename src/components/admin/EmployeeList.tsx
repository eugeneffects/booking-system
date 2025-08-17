/**
 * 임직원 목록 컴포넌트
 */

'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, Edit, Trash2, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { getEmployees, deleteEmployee, getDepartments } from '@/lib/actions/employee'
import type { Employee, EmployeeListParams } from '@/types/employee'

interface EmployeeListProps {
  onEdit?: (employee: Employee) => void
  onAdd?: () => void
  refreshTrigger?: number
}

export function EmployeeList({ onEdit, onAdd, refreshTrigger }: EmployeeListProps) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [departments, setDepartments] = useState<string[]>([])
  const [showInactive, setShowInactive] = useState(false)

  const limit = 20

  // 데이터 로드
  const loadEmployees = async () => {
    try {
      setLoading(true)
      
      const params: EmployeeListParams = {
        page,
        limit,
        search: search || undefined,
        department: selectedDepartment || undefined,
        is_active: showInactive ? undefined : true
      }

      const result = await getEmployees(params)
      setEmployees(result.employees)
      setTotal(result.total)
    } catch (error) {
      console.error('임직원 목록 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  // 부서 목록 로드
  const loadDepartments = async () => {
    try {
      const depts = await getDepartments()
      setDepartments(depts)
    } catch (error) {
      console.error('부서 목록 로드 실패:', error)
    }
  }

  // 임직원 삭제
  const handleDelete = async (employee: Employee) => {
    if (!confirm(`${employee.name} 임직원을 비활성화하시겠습니까?`)) {
      return
    }

    try {
      await deleteEmployee(employee.id)
      loadEmployees() // 목록 새로고침
    } catch (error) {
      console.error('임직원 삭제 실패:', error)
      alert('삭제에 실패했습니다.')
    }
  }

  // 검색 핸들러
  const handleSearch = () => {
    setPage(1)
    loadEmployees()
  }

  // 필터 초기화
  const resetFilters = () => {
    setSearch('')
    setSelectedDepartment('')
    setShowInactive(false)
    setPage(1)
  }

  // 효과
  useEffect(() => {
    loadEmployees()
  }, [page, showInactive])

  useEffect(() => {
    loadDepartments()
  }, [])

  useEffect(() => {
    if (refreshTrigger) {
      loadEmployees()
    }
  }, [refreshTrigger])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            임직원 관리 ({total}명)
          </h2>
        </div>
        {onAdd && (
          <Button onClick={onAdd} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            임직원 추가
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
                  placeholder="이름, 사번, 이메일로 검색..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} variant="outline">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* 부서 필터 */}
            <div>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
              >
                <option value="">전체 부서</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
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
      ) : employees.length === 0 ? (
        <Card>
          <div className="p-8 text-center text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>등록된 임직원이 없습니다.</p>
          </div>
        </Card>
      ) : (
        <>
          {/* 테이블 */}
          <Card>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      임직원 정보
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      부서
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      연락처
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      등록일
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {employees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {employee.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {employee.employee_number} | {employee.company_email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.department}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          employee.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {employee.is_active ? '활성' : '비활성'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(employee.created_at).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <div className="flex items-center justify-center gap-2">
                          {onEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(employee)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {employee.is_active && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(employee)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700">
                전체 {total}명 중 {((page - 1) * limit) + 1}-{Math.min(page * limit, total)}명 표시
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
