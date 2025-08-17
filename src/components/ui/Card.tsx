/**
 * 재사용 가능한 카드 컴포넌트
 * 콘텐츠를 그룹화하고 시각적으로 구분하는 데 사용합니다.
 */

import React from 'react'
import { cn } from '@/lib/utils/cn'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * 카드 내부 패딩
   * @default true
   */
  padding?: boolean
  
  /**
   * 호버 효과 활성화
   * @default false
   */
  hoverable?: boolean
  
  /**
   * 클릭 가능한 카드 (커서 포인터)
   * @default false
   */
  clickable?: boolean
}

/**
 * Card 컴포넌트
 * 
 * @example
 * ```tsx
 * <Card>
 *   <Card.Header>
 *     <Card.Title>제목</Card.Title>
 *     <Card.Description>설명</Card.Description>
 *   </Card.Header>
 *   <Card.Body>
 *     내용
 *   </Card.Body>
 *   <Card.Footer>
 *     푸터
 *   </Card.Footer>
 * </Card>
 * ```
 */
export function Card({
  className,
  padding = true,
  hoverable = false,
  clickable = false,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-gray-200 bg-white shadow-sm',
        {
          'p-6': padding,
          'transition-shadow hover:shadow-md': hoverable,
          'cursor-pointer': clickable,
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * Card.Header 컴포넌트
 * 카드의 헤더 영역
 */
Card.Header = function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-4', className)} {...props} />
}

/**
 * Card.Title 컴포넌트
 * 카드의 제목
 */
Card.Title = function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-lg font-semibold text-gray-900', className)} {...props} />
}

/**
 * Card.Description 컴포넌트
 * 카드의 설명
 */
Card.Description = function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('mt-1 text-sm text-gray-500', className)} {...props} />
}

/**
 * Card.Body 컴포넌트
 * 카드의 본문 영역
 */
Card.Body = function CardBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('', className)} {...props} />
}

/**
 * Card.Footer 컴포넌트
 * 카드의 푸터 영역
 */
Card.Footer = function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'mt-6 flex items-center justify-end space-x-2 border-t border-gray-200 pt-4',
        className
      )}
      {...props}
    />
  )
}
