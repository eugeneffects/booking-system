# Supabase 프로젝트 설정 가이드

이 문서는 숙소예약 추첨 시스템을 위한 Supabase 프로젝트 설정 방법을 설명합니다.

## 1. Supabase 프로젝트 생성

1. [Supabase Dashboard](https://app.supabase.com)에 접속하여 로그인합니다.
2. "New Project" 버튼을 클릭합니다.
3. 다음 정보를 입력합니다:
   - **Project name**: `booking-lottery`
   - **Database Password**: 안전한 비밀번호 생성
   - **Region**: `Northeast Asia (Seoul)` 선택 (한국에서 가장 빠름)
   - **Pricing Plan**: Free tier로 시작

## 2. 환경변수 설정

프로젝트가 생성되면 Settings > API 메뉴에서 다음 정보를 복사합니다:

```bash
# .env.local 파일에 추가
NEXT_PUBLIC_SUPABASE_URL=https://[프로젝트ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon public key]
SUPABASE_SERVICE_ROLE_KEY=[service role key]
```

⚠️ **주의**: Service Role Key는 절대 클라이언트 사이드에 노출되면 안 됩니다!

## 3. 데이터베이스 마이그레이션 실행

### 방법 1: Supabase Dashboard 사용
1. SQL Editor 메뉴로 이동
2. `supabase/migrations/20240101_initial_schema.sql` 파일 내용을 복사
3. SQL Editor에 붙여넣고 실행

### 방법 2: Supabase CLI 사용
```bash
# Supabase CLI 설치
npm install -g supabase

# 프로젝트 초기화
supabase init

# 프로젝트 링크
supabase link --project-ref [프로젝트ID]

# 마이그레이션 실행
supabase db push
```

## 4. Authentication 설정

1. Authentication > Providers 메뉴로 이동
2. Email 인증 활성화:
   - Email 인증 켜기
   - Confirm email 필수 설정
   - Email 템플릿 커스터마이징 (선택사항)

## 5. Storage 버킷 생성

1. Storage 메뉴로 이동
2. "New bucket" 클릭
3. 다음 버킷 생성:
   - `employee-imports`: 임직원 엑셀 파일 업로드용
   - `email-templates`: 이메일 템플릿 저장용

## 6. Edge Functions 설정 (선택사항)

추첨 로직이나 이메일 발송을 Edge Functions로 구현할 경우:

```bash
# Edge Functions 생성
supabase functions new lottery-draw
supabase functions new send-email

# 로컬에서 테스트
supabase functions serve lottery-draw

# 배포
supabase functions deploy lottery-draw
```

## 7. 보안 설정

### Row Level Security (RLS) 확인
- 모든 테이블에 RLS가 활성화되어 있는지 확인
- 정책이 올바르게 적용되었는지 테스트

### API 설정
- Settings > API > "Enable Row Level Security" 확인
- CORS 설정 확인 (필요시 도메인 추가)

## 8. 모니터링 설정

1. Settings > Logs 메뉴에서 로그 확인 가능
2. Database > Query Performance에서 쿼리 성능 모니터링

## 9. 백업 설정

1. Settings > Backups 메뉴 확인
2. Free tier는 7일 백업 제공
3. 중요 데이터는 별도로 백업 권장

## 문제 해결

### 연결 오류
- 프로젝트 URL과 키가 정확한지 확인
- 네트워크 방화벽 설정 확인

### 권한 오류
- RLS 정책이 올바른지 확인
- Service Role Key 사용 시 서버 사이드에서만 사용하는지 확인

### 성능 문제
- 인덱스가 올바르게 생성되었는지 확인
- 쿼리 최적화 필요 여부 확인

## 다음 단계

Supabase 설정이 완료되면:
1. Next.js 앱에서 연결 테스트
2. 초기 관리자 계정 생성
3. 기본 CRUD 작업 테스트
