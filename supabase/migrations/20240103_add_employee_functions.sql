-- 임직원 레코드 생성 함수 추가
-- 2024-01-03

-- RLS를 우회하여 임직원 정보를 생성하는 함수
CREATE OR REPLACE FUNCTION create_employee_record(
    p_id UUID,
    p_employee_number VARCHAR(50),
    p_name VARCHAR(100),
    p_department VARCHAR(100),
    p_company_email VARCHAR(255),
    p_phone VARCHAR(50)
) RETURNS UUID AS $$
BEGIN
    INSERT INTO employees (
        id,
        employee_number,
        name,
        department,
        company_email,
        phone,
        is_active
    ) VALUES (
        p_id,
        p_employee_number,
        p_name,
        p_department,
        p_company_email,
        p_phone,
        true
    );
    
    RETURN p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 사용자가 자신의 employees 레코드를 생성할 수 있는 정책 추가
CREATE POLICY "Users can create own employee record" ON employees
    FOR INSERT WITH CHECK (auth.uid()::text = id::text);
