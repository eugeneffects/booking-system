/**
 * 메인 레이아웃 컴포넌트
 * 전체 앱의 기본 레이아웃을 제공합니다.
 */

'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Building, 
  Calendar, 
  Users, 
  BarChart3, 
  Settings,
  Menu,
  X,
  ChevronDown,
  Mail
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/Button'
import { LogoutButton } from '@/components/auth/LogoutButton'

interface MainLayoutProps {
  children: React.ReactNode
  user?: {
    id: string
    email: string
    name: string
    isAdmin: boolean
  } | null
}

/**
 * 네비게이션 메뉴 아이템 정의
 */
const navigation = {
  main: [
    { name: '신청 현황', href: '/applications', icon: Calendar },
  ],
  admin: [
    { name: '대시보드', href: '/admin/dashboard', icon: BarChart3 },
    { name: '숙소 관리', href: '/admin/accommodations', icon: Building },
    { name: '임직원 관리', href: '/admin/employees', icon: Users },
    { name: '추첨 관리', href: '/admin/lottery', icon: Calendar },
    { name: '이메일 템플릿', href: '/admin/email-templates', icon: Mail },
    { name: '설정', href: '/admin/settings', icon: Settings },
  ],
}

/**
 * MainLayout 컴포넌트
 * 
 * @example
 * ```tsx
 * <MainLayout user={currentUser}>
 *   <div>페이지 내용</div>
 * </MainLayout>
 * ```
 */
export function MainLayout({ children, user }: MainLayoutProps) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false)
  
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const effectiveUser = user

  

  // 클라이언트 사이드 마운트 확인
  

  // 외부 클릭 시 드롭다운 닫기
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }
    
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isUserMenuOpen])

  // 현재 페이지가 관리자 페이지인지 확인
  const isAdminPage = pathname.startsWith('/admin')

  // 표시할 네비게이션 메뉴 결정
  const navItems = isAdminPage && effectiveUser?.isAdmin ? navigation.admin : navigation.main

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* 로고 및 제목 */}
            <div className="flex items-center">
              <button
                type="button"
                className="lg:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
              <Link 
                href={effectiveUser ? "/applications" : "/"} 
                className="ml-2 lg:ml-0"
              >
                <h1 className="text-xl font-bold text-gray-900">
                  숙소예약 추첨 시스템
                </h1>
              </Link>
            </div>

            {/* 데스크톱 네비게이션 */}
            <nav className="hidden lg:block">
              <ul className="flex space-x-4">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                          {
                            'bg-blue-100 text-blue-700': isActive,
                            'text-gray-700 hover:bg-gray-100': !isActive,
                          }
                        )}
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        {item.name}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>

            {/* 사용자 메뉴 */}
            <div className="relative" ref={dropdownRef}>
              {effectiveUser ? (
                <div>
                  <button
                    type="button"
                    className="flex items-center rounded-full bg-gray-100 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  >
                    <span className="mr-2 hidden sm:block">{effectiveUser.name}</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>

                  {/* 드롭다운 메뉴 */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
                      <div className="border-b border-gray-200 px-4 py-2">
                        <p className="text-sm font-medium text-gray-900">{effectiveUser.name}</p>
                        <p className="text-xs text-gray-500">{effectiveUser.email}</p>
                      </div>
                      
                      {!isAdminPage && (
                        <Link
                          href="/applications"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          신청 현황
                        </Link>
                      )}
                      
                      {effectiveUser.isAdmin && !isAdminPage && (
                        <Link
                          href="/admin/dashboard"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          관리자 대시보드
                        </Link>
                      )}
                      
                      {isAdminPage && (
                        <Link
                          href="/applications"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          신청 현황
                        </Link>
                      )}
                      
                      {isAdminPage && (
                        <Link
                          href="/admin/dashboard"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          대시보드
                        </Link>
                      )}
                      
                      <LogoutButton />
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/">
                  <Button size="sm">로그인</Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* 모바일 메뉴 */}
        {isMobileMenuOpen && (
          <nav className="lg:hidden">
            <ul className="space-y-1 px-2 pb-3 pt-2">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center px-3 py-2 text-base font-medium rounded-md',
                        {
                          'bg-blue-100 text-blue-700': isActive,
                          'text-gray-700 hover:bg-gray-100': !isActive,
                        }
                      )}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        )}
      </header>

      {/* 메인 콘텐츠 */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* 푸터 */}
      <footer className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-500">
            © 2024 숙소예약 추첨 시스템. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
