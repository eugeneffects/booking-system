/**
 * 재사용 가능한 입력 필드 컴포넌트
 * 다양한 타입의 입력을 지원합니다.
 */

import React, { useId } from 'react'
import { cn } from '@/lib/utils/cn'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /**
   * 라벨 텍스트
   */
  label?: string
  
  /**
   * 에러 메시지
   */
  error?: string
  
  /**
   * 도움말 텍스트
   */
  helperText?: string
  
  /**
   * 왼쪽 아이콘 또는 텍스트
   */
  leftAddon?: React.ReactNode
  
  /**
   * 오른쪽 아이콘 또는 텍스트
   */
  rightAddon?: React.ReactNode
  
  /**
   * 전체 너비 사용
   * @default true
   */
  fullWidth?: boolean
}

/**
 * Input 컴포넌트
 * 
 * @example
 * ```tsx
 * <Input
 *   label="이메일"
 *   type="email"
 *   placeholder="이메일을 입력하세요"
 *   error={errors.email}
 *   helperText="회사 이메일을 사용하세요"
 * />
 * ```
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      leftAddon,
      rightAddon,
      fullWidth = true,
      id,
      ...props
    },
    ref
  ) => {
    // 자동 ID 생성 (접근성을 위해) - useId 훅 사용으로 SSR 안전
    const autoId = useId()
    const inputId = id || autoId
    
    return (
      <div className={cn('', { 'w-full': fullWidth })}>
        {/* 라벨 */}
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            {label}
            {props.required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}
        
        {/* 입력 필드 컨테이너 */}
        <div className="relative">
          {/* 왼쪽 추가 요소 */}
          {leftAddon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-gray-500 sm:text-sm">{leftAddon}</span>
            </div>
          )}
          
          {/* 입력 필드 */}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'block rounded-md border shadow-sm transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-50',
              'text-black placeholder-gray-600',
              {
                // 기본 스타일
                'border-gray-300 focus:border-blue-500 focus:ring-blue-500': !error,
                // 에러 스타일
                'border-red-300 focus:border-red-500 focus:ring-red-500': error,
                // 패딩 조정
                'pl-10': leftAddon,
                'pr-10': rightAddon,
                'px-3': !leftAddon && !rightAddon,
                'py-2': true,
                // 너비
                'w-full': fullWidth,
              },
              className
            )}
            aria-invalid={!!error}
            aria-describedby={
              error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            {...props}
          />
          
          {/* 오른쪽 추가 요소 */}
          {rightAddon && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <span className="text-gray-500 sm:text-sm">{rightAddon}</span>
            </div>
          )}
        </div>
        
        {/* 에러 메시지 */}
        {error && (
          <p id={`${inputId}-error`} className="mt-1 text-sm text-red-600">
            {error}
          </p>
        )}
        
        {/* 도움말 텍스트 */}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="mt-1 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
