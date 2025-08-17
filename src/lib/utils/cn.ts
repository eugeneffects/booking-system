/**
 * 클래스명 결합 유틸리티
 * Tailwind CSS 클래스를 조건부로 결합할 때 사용합니다.
 */

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * 클래스명을 결합하고 중복을 제거합니다.
 * @param inputs - 결합할 클래스명들
 * @returns 병합된 클래스명 문자열
 * 
 * @example
 * cn('px-4 py-2', 'bg-blue-500', { 'opacity-50': disabled })
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
