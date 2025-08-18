-- admin_users: 본인 행 조회 허용 정책 (활성화된 관리자만)
-- 클라이언트(익명 키, 세션 포함)에서도 현재 사용자에 한해 자신의 관리자 권한을 확인 가능하도록 허용

-- Row Level Security가 켜져 있지 않다면 켭니다
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- 이미 동일한 이름의 정책이 있으면 재생성하지 않습니다
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'admin_users' 
      AND policyname = 'Users can view own admin record'
  ) THEN
    CREATE POLICY "Users can view own admin record" ON admin_users
      FOR SELECT
      USING (
        admin_users.employee_id::text = auth.uid()::text
        AND admin_users.is_active = true
      );
  END IF;
END $$;


