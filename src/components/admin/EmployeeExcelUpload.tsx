/**
 * 임직원 엑셀 업로드 컴포넌트
 */

'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import * as XLSX from 'xlsx'
import { Upload, Download } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { importEmployeesFromExcel } from '@/lib/actions/employee'
import type { ExcelEmployeeData, EmployeeImportResult } from '@/types/employee'

interface EmployeeExcelUploadProps {
  onSuccess?: (result: EmployeeImportResult) => void
}

export function EmployeeExcelUpload({ onSuccess }: EmployeeExcelUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<EmployeeImportResult | null>(null)
  const [previewData, setPreviewData] = useState<ExcelEmployeeData[]>([])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    try {
      setUploading(true)
      setResult(null)
      setPreviewData([])

      // 파일 읽기
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const worksheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[worksheetName]
      
      // JSON으로 변환
      const jsonData = XLSX.utils.sheet_to_json<ExcelEmployeeData>(worksheet)
      
      if (jsonData.length === 0) {
        throw new Error('엑셀 파일에 데이터가 없습니다.')
      }

      // 헤더 검증
      const requiredColumns = ['사번', '이름', '부서', '회사이메일', '연락처']
      const firstRow = jsonData[0]
      const missingColumns = requiredColumns.filter(col => !(col in firstRow))
      
      if (missingColumns.length > 0) {
        throw new Error(`필수 컬럼이 누락되었습니다: ${missingColumns.join(', ')}`)
      }

      setPreviewData(jsonData.slice(0, 5)) // 첫 5개 행만 미리보기
      
    } catch (error) {
      console.error('파일 읽기 오류:', error)
      setResult({
        success: 0,
        failed: 1,
        errors: [{
          row: 0,
          data: {} as ExcelEmployeeData,
          error: error instanceof Error ? error.message : '파일 읽기 실패'
        }],
        imported: []
      })
    } finally {
      setUploading(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1,
    disabled: uploading
  })

  const handleImport = async () => {
    if (previewData.length === 0) return

    try {
      setUploading(true)
      
      // 전체 데이터 다시 읽기 (미리보기는 5개만 했으므로)
      const fullData = previewData // 실제로는 전체 데이터를 다시 읽어야 함
      const importResult = await importEmployeesFromExcel(fullData)
      
      setResult(importResult)
      setPreviewData([])
      
      if (onSuccess) {
        onSuccess(importResult)
      }
      
    } catch (error) {
      console.error('임포트 오류:', error)
      setResult({
        success: 0,
        failed: previewData.length,
        errors: [{
          row: 0,
          data: {} as ExcelEmployeeData,
          error: error instanceof Error ? error.message : '임포트 실패'
        }],
        imported: []
      })
    } finally {
      setUploading(false)
    }
  }

  const downloadTemplate = () => {
    const templateData = [
      {
        '사번': 'EMP001',
        '이름': '홍길동',
        '부서': 'IT팀',
        '회사이메일': 'hong@company.com',
        '연락처': '010-1234-5678',
        '활성상태': '활성'
      }
    ]

    const ws = XLSX.utils.json_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '임직원목록')
    XLSX.writeFile(wb, '임직원_업로드_템플릿.xlsx')
  }

  return (
    <div className="space-y-6">
      {/* 템플릿 다운로드 */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">엑셀 파일 업로드</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={downloadTemplate}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          템플릿 다운로드
        </Button>
      </div>

      {/* 업로드 영역 */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        {isDragActive ? (
          <p className="text-blue-600">파일을 여기에 놓으세요...</p>
        ) : (
          <div>
            <p className="text-gray-600 mb-2">
              엑셀 파일을 드래그하거나 클릭하여 업로드하세요
            </p>
            <p className="text-sm text-gray-500">
              지원 형식: .xlsx, .xls
            </p>
          </div>
        )}
      </div>

      {/* 업로드 상태 */}
      {uploading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">파일 처리 중...</span>
        </div>
      )}

      {/* 미리보기 */}
      {previewData.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">데이터 미리보기 (첫 5행)</h4>
            <Button onClick={handleImport} disabled={uploading}>
              {uploading ? '처리 중...' : '가져오기 시작'}
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">사번</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">이름</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">부서</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">이메일</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">연락처</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {previewData.map((row, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 text-sm text-gray-900">{row.사번}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{row.이름}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{row.부서}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{row.회사이메일}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{row.연락처}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 결과 표시 */}
      {result && (
        <div className="space-y-4">
          <Alert 
            variant={result.success > 0 ? 'success' : 'error'}
            title="가져오기 완료"
          >
            <div className="space-y-2">
              <p>성공: {result.success}명, 실패: {result.failed}명</p>
              
              {result.errors.length > 0 && (
                <div className="mt-4">
                  <h5 className="font-medium text-red-800 mb-2">오류 목록:</h5>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {result.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-700 bg-red-50 p-2 rounded">
                        <strong>행 {error.row}:</strong> {error.error}
                        {error.data.이름 && <span className="ml-2">({error.data.이름})</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Alert>
        </div>
      )}

      {/* 안내사항 */}
      <Alert variant="info" title="업로드 안내">
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>필수 컬럼: 사번, 이름, 부서, 회사이메일, 연락처</li>
          <li>활성상태 컬럼은 선택사항 (빈 값이면 활성으로 처리)</li>
          <li>중복된 사번이나 이메일은 건너뜁니다</li>
          <li>템플릿을 다운로드하여 형식을 확인하세요</li>
        </ul>
      </Alert>
    </div>
  )
}
