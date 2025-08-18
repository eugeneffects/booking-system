/** @type {import('next').NextConfig} */
import withPWA from 'next-pwa'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const nextConfig = {
  // React Strict Mode 활성화 (개발 중 버그 찾기 용이)
  reactStrictMode: true,
  
  // 이미지 도메인 설정 (Supabase Storage 등)
  images: {
    domains: [
      'localhost',
      // Supabase 프로젝트 URL 추가 필요
      process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host : undefined,
    ].filter(Boolean),
  },
  
  // 환경변수 타입 체크
  env: {
    NEXT_PUBLIC_APP_NAME: '숙소예약 추첨 시스템',
  },
  
  // Webpack 설정 (필요시)
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.join(__dirname, 'src'),
    }
    return config
  },
}

// PWA 설정
const pwaConfig = {
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  // 오프라인 시 캐시할 페이지
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'https-calls',
        networkTimeoutSeconds: 15,
        expiration: {
          maxEntries: 150,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30일
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
  ],
}

export default withPWA(pwaConfig)(nextConfig)
