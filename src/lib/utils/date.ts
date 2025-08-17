/**
 * 날짜 관련 유틸리티 함수들
 * date-fns를 사용하여 날짜를 처리합니다.
 */

import { format, parseISO, differenceInDays, addDays, subYears } from 'date-fns'
import { ko } from 'date-fns/locale'

/**
 * 날짜를 한국어 형식으로 포맷팅
 * @param date - Date 객체 또는 ISO 문자열
 * @param formatStr - 포맷 문자열 (기본값: 'yyyy년 MM월 dd일')
 * @returns 포맷팅된 날짜 문자열
 */
export function formatDate(date: Date | string, formatStr = 'yyyy년 MM월 dd일'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, formatStr, { locale: ko })
}

/**
 * 날짜와 시간을 한국어 형식으로 포맷팅
 * @param date - Date 객체 또는 ISO 문자열
 * @returns 포맷팅된 날짜시간 문자열
 */
export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, 'yyyy년 MM월 dd일 HH:mm', { locale: ko })
}

/**
 * 두 날짜 사이의 일수 차이 계산
 * @param startDate - 시작 날짜
 * @param endDate - 종료 날짜
 * @returns 일수 차이
 */
export function getDaysDifference(startDate: Date | string, endDate: Date | string): number {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate
  return differenceInDays(end, start)
}

/**
 * 특정 날짜로부터 일정 기간 후의 날짜 계산
 * @param date - 기준 날짜
 * @param days - 추가할 일수
 * @returns 계산된 날짜
 */
export function addDaysToDate(date: Date | string, days: number): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return addDays(dateObj, days)
}

/**
 * 당첨 제한 기간 확인을 위한 날짜 계산
 * @param years - 제한 연수
 * @returns 제한 시작 날짜
 */
export function getRestrictionStartDate(years: number): Date {
  return subYears(new Date(), years)
}

/**
 * 예약 기간 표시용 문자열 생성
 * @param startDate - 시작일
 * @param endDate - 종료일
 * @returns '2024년 3월 1일 ~ 3월 3일' 형식의 문자열
 */
export function formatReservationPeriod(startDate: Date | string, endDate: Date | string): string {
  const start = formatDate(startDate, 'yyyy년 MM월 dd일')
  const end = formatDate(endDate, 'MM월 dd일')
  return `${start} ~ ${end}`
}
