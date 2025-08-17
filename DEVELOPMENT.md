# 개발 가이드

## 🏗️ 프로젝트 구조

```
booking/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── (auth)/         # 인증이 필요한 페이지 그룹
│   │   ├── (public)/       # 공개 페이지 그룹
│   │   ├── admin/          # 관리자 페이지
│   │   ├── api/            # API 라우트
│   │   └── layout.tsx      # 루트 레이아웃
│   ├── components/         # React 컴포넌트
│   │   ├── ui/            # 기본 UI 컴포넌트
│   │   ├── forms/         # 폼 컴포넌트
│   │   └── layouts/       # 레이아웃 컴포넌트
│   ├── lib/               # 유틸리티 함수
│   │   ├── supabase/      # Supabase 클라이언트
│   │   ├── google/        # Google API 연동
│   │   └── utils/         # 기타 유틸리티
│   ├── hooks/             # Custom React Hooks
│   ├── store/             # Zustand 상태 관리
│   └── types/             # TypeScript 타입 정의
├── public/                # 정적 파일
├── supabase/             # Supabase 설정
│   ├── migrations/       # DB 마이그레이션
│   └── functions/        # Edge Functions
└── tests/                # 테스트 파일
```

## 🔧 개발 환경 설정

### 1. VSCode 확장 프로그램 추천
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Prisma (Supabase 스키마 자동완성)
- Thunder Client (API 테스트)

### 2. Git 커밋 컨벤션
```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅, 세미콜론 누락 등
refactor: 코드 리팩토링
test: 테스트 코드 추가
chore: 빌드 작업, 패키지 매니저 수정 등
```

예시:
```bash
git commit -m "feat: 임직원 엑셀 업로드 기능 추가"
git commit -m "fix: 추첨 시 중복 당첨 버그 수정"
```

## 📝 코딩 컨벤션

### TypeScript
```typescript
// ✅ 좋은 예시
interface Employee {
  id: string
  employeeNumber: string // camelCase 사용
  name: string
  // 모든 속성에 타입 명시
}

// ❌ 나쁜 예시
interface employee {
  id: any // any 타입 지양
  employee_number // 타입 누락
}
```

### React 컴포넌트
```tsx
// ✅ 좋은 예시
export function EmployeeCard({ employee }: { employee: Employee }) {
  // 명확한 props 타입 정의
  return (
    <div className="p-4 rounded-lg shadow">
      {/* Tailwind CSS 클래스 사용 */}
    </div>
  )
}

// ❌ 나쁜 예시
export default function Card(props) {
  // props 타입 누락, default export 지양
}
```

### 상태 관리 (Zustand)
```typescript
// store/auth.ts
import { create } from 'zustand'

interface AuthState {
  user: User | null
  isLoading: boolean
  // Actions
  setUser: (user: User | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
}))
```

## 🔐 보안 가이드라인

### 1. 환경변수
- `.env.local`에 민감한 정보 저장
- 절대 하드코딩하지 않기
- Service Role Key는 서버 사이드에서만 사용

### 2. API 보안
```typescript
// ✅ 좋은 예시: 서버 컴포넌트에서 인증 확인
import { createServerComponentClient } from '@/lib/supabase/server'

export default async function AdminPage() {
  const supabase = await createServerComponentClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  // 관리자 권한 확인
  const { data: admin } = await supabase
    .from('admin_users')
    .select('*')
    .eq('employee_id', user.id)
    .single()
    
  if (!admin) {
    redirect('/unauthorized')
  }
  
  // ...
}
```

### 3. 데이터 암호화
```typescript
// lib/crypto.ts
import crypto from 'crypto'

const algorithm = 'aes-256-gcm'
const key = process.env.ENCRYPTION_KEY! // 32자 키

export function encrypt(text: string): string {
  // 암호화 로직
}

export function decrypt(encrypted: string): string {
  // 복호화 로직
}
```

## 🧪 테스트

### 단위 테스트
```typescript
// __tests__/lottery.test.ts
import { drawLottery } from '@/lib/lottery'

describe('추첨 로직', () => {
  test('당첨자 수가 가용 객실 수를 초과하지 않음', () => {
    const applications = [/* ... */]
    const availableRooms = 5
    const results = drawLottery(applications, availableRooms)
    
    expect(results.filter(r => r.isWinner).length).toBeLessThanOrEqual(availableRooms)
  })
})
```

### E2E 테스트
```typescript
// e2e/admin-flow.spec.ts
import { test, expect } from '@playwright/test'

test('관리자 로그인 및 숙소 추가', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[name="email"]', 'admin@company.com')
  await page.fill('[name="password"]', 'password')
  await page.click('button[type="submit"]')
  
  await expect(page).toHaveURL('/admin/dashboard')
  // ...
})
```

## 🚀 배포

### 1. 환경변수 설정 (Render.com)
```
NEXT_PUBLIC_SUPABASE_URL=production-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=production-key
SUPABASE_SERVICE_ROLE_KEY=production-service-key
# ... 기타 프로덕션 환경변수
```

### 2. 빌드 명령어
```bash
npm run build
```

### 3. 시작 명령어
```bash
npm start
```

## 📊 모니터링

### 로그 수집
```typescript
// lib/logger.ts
export function logActivity(action: string, metadata?: any) {
  if (process.env.NODE_ENV === 'production') {
    // 프로덕션 로그 서비스로 전송
  } else {
    console.log(`[${new Date().toISOString()}] ${action}`, metadata)
  }
}
```

### 에러 추적
```typescript
// app/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 에러 로깅 서비스로 전송
    console.error(error)
  }, [error])

  return (
    <div>
      <h2>오류가 발생했습니다!</h2>
      <button onClick={reset}>다시 시도</button>
    </div>
  )
}
```

## 🤝 협업 가이드

### 1. 코드 리뷰 체크리스트
- [ ] TypeScript 타입이 올바르게 정의되었는가?
- [ ] 보안 취약점은 없는가?
- [ ] 성능 최적화가 필요한 부분은 없는가?
- [ ] 에러 처리가 적절히 되어 있는가?
- [ ] 주석이 충분히 작성되었는가?

### 2. 문서화
- 새로운 기능 추가 시 README 업데이트
- API 변경 시 문서 업데이트
- 복잡한 로직은 주석으로 설명

### 3. 이슈 관리
- GitHub Issues 활용
- 버그는 재현 방법 포함
- 기능 요청은 상세 설명 포함
