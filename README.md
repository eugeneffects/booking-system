# 숙소예약 추첨 시스템

회사 임직원을 위한 숙소 예약 신청 및 추첨 시스템입니다.

## 🚀 주요 기능

- 📊 **관리자 기능**
  - 임직원 정보 엑셀 업로드
  - 숙소 정보 관리
  - 예약 기간 설정 및 구글폼 생성
  - 추첨 실행 및 당첨자 관리

- 👥 **직원 기능**
  - 구글폼을 통한 숙소 신청
  - 신청 현황 조회
  - 당첨 결과 이메일 수신

## 🛠️ 기술 스택

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **외부 API**: Google Forms, Google Sheets, Gmail
- **배포**: Render.com
- **기타**: PWA 지원, 반응형 디자인

## 📋 환경 설정

1. `.env.local` 파일을 생성하고 다음 환경변수를 설정하세요:

```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Google API 설정
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Gmail API
GMAIL_REFRESH_TOKEN=your-gmail-refresh-token

# 앱 설정
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=숙소예약 추첨 시스템
```

## 🔧 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 프로덕션 실행
npm start
```

## 📁 프로젝트 구조

```
booking/
├── src/
│   ├── app/              # Next.js App Router
│   ├── components/       # React 컴포넌트
│   ├── lib/             # 유틸리티 함수 및 설정
│   ├── hooks/           # Custom React Hooks
│   ├── store/           # Zustand 상태 관리
│   └── types/           # TypeScript 타입 정의
├── public/              # 정적 파일
├── supabase/           # Supabase 마이그레이션 및 설정
└── tests/              # 테스트 파일
```

## 🔐 보안 고려사항

- 모든 개인정보는 암호화하여 저장
- Row Level Security (RLS)를 통한 데이터 접근 제어
- JWT 토큰 기반 인증
- 감사 로그 기록

## 📱 PWA 지원

이 애플리케이션은 Progressive Web App으로 설치하여 사용할 수 있습니다.
- 오프라인 지원 (읽기 전용)
- 푸시 알림
- 홈 화면에 추가

## 👨‍💻 개발자 가이드

자세한 개발 가이드는 [DEVELOPMENT.md](./DEVELOPMENT.md)를 참조하세요.