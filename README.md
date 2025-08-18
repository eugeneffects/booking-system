# 숙소예약 추첨 시스템

숙소 예약을 위한 추첨 시스템입니다. 관리자가 숙소와 예약 기간을 설정하고, 직원들이 신청하면 추첨을 통해 당첨자를 선정하는 시스템입니다.

## 주요 기능

- 🏨 **숙소 관리**: 숙소 정보 등록, 수정, 삭제
- 👥 **임직원 관리**: 임직원 정보 관리 및 일괄 업로드
- 📅 **예약 기간 관리**: 숙박 기간 및 신청 기간 설정
- 🎲 **추첨 시스템**: 공정한 추첨을 통한 당첨자 선정
- 📧 **이메일 알림**: 당첨자/미당첨자에게 자동 이메일 발송
- 🎨 **이메일 템플릿**: 숙소별 커스텀 이메일 템플릿 지원
- 🖼️ **이미지 업로드**: 숙소 이미지 업로드 및 관리
- 🔐 **관리자 권한**: 관리자 권한 설정 및 관리

## 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Email**: Nodemailer
- **Deployment**: Render.com

## 환경 설정

### 필수 환경변수

```bash
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# 앱 설정
NEXT_PUBLIC_APP_URL=your-app-url
NEXT_PUBLIC_APP_NAME=숙소예약 추첨 시스템

# SMTP 이메일 설정
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# 발신자 정보
EMAIL_FROM_NAME=숙소예약 추첨 시스템
EMAIL_FROM_ADDRESS=noreply@company.com

# 관리자 정보
ADMIN_EMAIL=admin@company.com
ADMIN_NAME=관리자
```

## 로컬 개발

```bash
# 의존성 설치
npm install

# 환경변수 설정
cp env.example .env.local
# .env.local 파일을 편집하여 실제 값으로 설정

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 프로덕션 서버 실행
npm start
```

## 배포 (Render.com)

### 1. GitHub 저장소 연결

1. [Render.com](https://render.com)에 로그인
2. "New +" → "Web Service" 선택
3. GitHub 저장소 연결

### 2. 서비스 설정

- **Name**: `booking-system`
- **Environment**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

### 3. 환경변수 설정

Render.com 대시보드에서 다음 환경변수들을 설정:

```
NODE_ENV=production
NEXT_PUBLIC_APP_NAME=숙소예약 추첨 시스템
NEXT_PUBLIC_APP_URL=https://your-app-name.onrender.com
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM_NAME=숙소예약 추첨 시스템
EMAIL_FROM_ADDRESS=noreply@company.com
ADMIN_EMAIL=admin@company.com
ADMIN_NAME=관리자
```

### 4. 자동 배포

GitHub 저장소에 푸시하면 자동으로 배포됩니다.

## 데이터베이스 설정

### Supabase 설정

1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. SQL 에디터에서 마이그레이션 파일 실행:
   - `supabase/migrations/20240101_initial_schema.sql`
   - `supabase/migrations/20240102_update_schema.sql`
   - `supabase/migrations/20240103_add_employee_functions.sql`
   - `supabase/migrations/20240104_simplify_employee_auth.sql`
   - `supabase/migrations/20240105_fix_employee_trigger.sql`
   - `supabase/migrations/20250101_add_admin_users_select_policy.sql`
   - `supabase/migrations/20250106_add_accommodation_images.sql`

### 관리자 계정 생성

1. Supabase Auth에서 관리자 계정 생성
2. `admin_users` 테이블에 관리자 권한 추가:

```sql
INSERT INTO admin_users (employee_id, role, is_active)
VALUES ('관리자-사용자-ID', 'super_admin', true);
```

## 사용법

### 관리자

1. 로그인 후 관리자 대시보드 접근
2. 숙소 및 예약 기간 설정
3. 임직원 정보 업로드
4. 추첨 실행 및 결과 관리
5. 이메일 템플릿 커스터마이징

### 일반 사용자

1. 로그인 후 신청 현황 페이지 접근
2. 원하는 숙소 및 기간 선택
3. 신청 완료 후 추첨 결과 대기
4. 이메일로 결과 확인

## 라이선스

MIT License

## 지원

문제가 발생하면 GitHub Issues에 등록해주세요.