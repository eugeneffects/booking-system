-- 안전한 auth.users → employees 동기화 트리거 수정
-- 회원가입 시 DB 에러 방지: 필수 메타데이터 누락/중복으로 인한 unique_violation을 무시하고 가입을 계속 진행

-- 기존 트리거 제거
DROP TRIGGER IF EXISTS sync_employee_on_auth_insert ON auth.users;

-- 함수 재정의: 가드/예외처리 추가
CREATE OR REPLACE FUNCTION sync_employee_from_auth()
RETURNS TRIGGER AS $$
DECLARE
  v_employee_number TEXT;
  v_name TEXT;
  v_department TEXT;
  v_phone TEXT;
BEGIN
  v_employee_number := COALESCE(NEW.raw_user_meta_data->>'employee_number', '');
  v_name := COALESCE(NEW.raw_user_meta_data->>'name', NEW.email);
  v_department := COALESCE(NEW.raw_user_meta_data->>'department', '');
  v_phone := COALESCE(NEW.raw_user_meta_data->>'phone', '');

  BEGIN
    -- employee_number가 비어있는 경우에는 동기화 생략 (추후 API로 동기화)
    IF trim(v_employee_number) = '' THEN
      RETURN NEW;
    END IF;

    INSERT INTO employees (
      id,
      employee_number,
      name,
      department,
      company_email,
      phone,
      is_active
    ) VALUES (
      NEW.id,
      v_employee_number,
      v_name,
      v_department,
      NEW.email,
      v_phone,
      true
    )
    ON CONFLICT (id) DO UPDATE SET
      employee_number = EXCLUDED.employee_number,
      name = EXCLUDED.name,
      department = EXCLUDED.department,
      company_email = EXCLUDED.company_email,
      phone = EXCLUDED.phone,
      updated_at = CURRENT_TIMESTAMP;

  EXCEPTION
    WHEN unique_violation THEN
      -- 예: employee_number 중복 등으로 실패해도 회원가입은 계속 진행
      -- 필요한 경우 RAISE NOTICE로 로깅 가능
      -- RAISE NOTICE 'sync_employee_from_auth: unique_violation for user %', NEW.id;
      NULL;
    WHEN others THEN
      -- 기타 오류도 회원가입을 막지 않도록 무시
      -- RAISE NOTICE 'sync_employee_from_auth: other error for user %', NEW.id;
      NULL;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 재생성
CREATE TRIGGER sync_employee_on_auth_insert
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_employee_from_auth();


