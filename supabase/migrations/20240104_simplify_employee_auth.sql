-- auth.users → employees 동기화 트리거 (FK 구조는 변경하지 않음)
-- 2024-01-04

-- 함수: auth.users의 raw_user_meta_data를 사용해 employees를 동기화
CREATE OR REPLACE FUNCTION sync_employee_from_auth()
RETURNS TRIGGER AS $$
BEGIN
    -- auth.users에서 metadata 가져오기 후 employees upsert
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
        COALESCE(NEW.raw_user_meta_data->>'employee_number', ''),
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'department', ''),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        true
    )
    ON CONFLICT (id) DO UPDATE SET
        employee_number = EXCLUDED.employee_number,
        name = EXCLUDED.name,
        department = EXCLUDED.department,
        company_email = EXCLUDED.company_email,
        phone = EXCLUDED.phone,
        updated_at = CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거: 새 auth.users 생성 시 자동 동기화
DROP TRIGGER IF EXISTS sync_employee_on_auth_insert ON auth.users;
CREATE TRIGGER sync_employee_on_auth_insert
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION sync_employee_from_auth();

-- 초기 동기화: 기존 auth.users → employees
INSERT INTO employees (
    id,
    employee_number,
    name,
    department,
    company_email,
    phone,
    is_active
)
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'employee_number', ''),
    COALESCE(au.raw_user_meta_data->>'name', au.email),
    COALESCE(au.raw_user_meta_data->>'department', ''),
    au.email,
    COALESCE(au.raw_user_meta_data->>'phone', ''),
    true
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM employees e WHERE e.id = au.id
)
ON CONFLICT (id) DO UPDATE SET
    employee_number = EXCLUDED.employee_number,
    name = EXCLUDED.name,
    department = EXCLUDED.department,
    company_email = EXCLUDED.company_email,
    phone = EXCLUDED.phone,
    updated_at = CURRENT_TIMESTAMP;

-- 참고: applications.employee_id → employees.id 외래키는 기존 스키마대로 유지합니다.
