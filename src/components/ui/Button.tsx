/**
 * 재사용 가능한 버튼 컴포넌트
 * 다양한 스타일과 크기를 지원합니다.
 */

import React from 'react'
import { cn } from '@/lib/utils/cn'
import { Loader2 } from 'lucide-react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * 버튼 스타일 변형
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  
  /**
   * 버튼 크기
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg'
  
  /**
   * 로딩 상태
   * 로딩 중일 때는 버튼이 비활성화되고 로딩 아이콘이 표시됩니다.
   */
  isLoading?: boolean
  
  /**
   * 왼쪽 아이콘
   */
  leftIcon?: React.ReactNode
  
  /**
   * 오른쪽 아이콘
   */
  rightIcon?: React.ReactNode
}

const variants = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
  secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
  outline: 'border border-gray-300 bg-transparent hover:bg-gray-50 focus:ring-gray-500',
  ghost: 'bg-transparent hover:bg-gray-100 focus:ring-gray-500',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
}

/**
 * Button 컴포넌트
 * 
 * @example
 * ```tsx
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   클릭하세요
 * </Button>
 * 
 * <Button isLoading leftIcon={<Save />}>
 *   저장 중...
 * </Button>
 * ```
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          // 기본 스타일
          'inline-flex items-center justify-center rounded-md font-medium transition-all',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          // 변형 스타일
          variants[variant],
          // 크기 스타일
          sizes[size],
          // 커스텀 클래스
          className
        )}
        disabled={isLoading || disabled}
        {...props}
      >
        {/* 로딩 아이콘 또는 왼쪽 아이콘 */}
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : leftIcon ? (
          <span className="mr-2">{leftIcon}</span>
        ) : null}
        
        {/* 버튼 텍스트 */}
        {children}
        
        {/* 오른쪽 아이콘 */}
        {rightIcon && !isLoading && <span className="ml-2">{rightIcon}</span>}
      </button>
    )
  }
)

Button.displayName = 'Button'
