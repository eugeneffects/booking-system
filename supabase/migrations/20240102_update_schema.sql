-- 스키마 업데이트: 누락된 필드들 추가
-- 2024-01-02

-- reservation_periods 테이블에 누락된 필드들 추가
ALTER TABLE reservation_periods ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE reservation_periods ADD COLUMN IF NOT EXISTS application_start TIMESTAMP WITH TIME ZONE;
ALTER TABLE reservation_periods ADD COLUMN IF NOT EXISTS application_end TIMESTAMP WITH TIME ZONE;
ALTER TABLE reservation_periods ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE reservation_periods ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- application_deadline을 application_end로 변경하고 제약조건 업데이트
-- (기존 데이터가 있다면 마이그레이션 로직 추가 필요)
UPDATE reservation_periods SET application_end = application_deadline WHERE application_end IS NULL;
UPDATE reservation_periods SET application_start = CURRENT_TIMESTAMP WHERE application_start IS NULL;
UPDATE reservation_periods SET name = CONCAT(
  (SELECT name FROM accommodations WHERE id = reservation_periods.accommodation_id),
  ' - ',
  TO_CHAR(start_date, 'YYYY.MM.DD'),
  '~',
  TO_CHAR(end_date, 'MM.DD')
) WHERE name IS NULL;

-- 제약조건 업데이트
ALTER TABLE reservation_periods DROP CONSTRAINT IF EXISTS valid_deadline;
ALTER TABLE reservation_periods ADD CONSTRAINT valid_application_period 
  CHECK (application_start < application_end);
ALTER TABLE reservation_periods ADD CONSTRAINT valid_application_before_checkin 
  CHECK (application_end < start_date);

-- accommodations 테이블에 updated_at 추가
ALTER TABLE accommodations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- updated_at 자동 업데이트 트리거 추가
CREATE TRIGGER update_accommodations_updated_at 
  BEFORE UPDATE ON accommodations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservation_periods_updated_at 
  BEFORE UPDATE ON reservation_periods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_reservation_periods_accommodation ON reservation_periods(accommodation_id);
CREATE INDEX IF NOT EXISTS idx_reservation_periods_dates ON reservation_periods(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_reservation_periods_application ON reservation_periods(application_start, application_end);

-- admin_users 테이블에 누락된 id 컬럼 추가 
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT uuid_generate_v4();

-- 샘플 데이터 (개발 환경용)
-- 실제 운영 환경에서는 이 부분을 제거하세요

-- 샘플 관리자 사용자 (실제 운영에서는 수동으로 추가)
-- INSERT INTO employees (employee_number, name, department, company_email, phone) 
-- VALUES ('ADMIN001', '시스템관리자', '시스템팀', 'admin@company.com', '010-0000-0000')
-- ON CONFLICT (employee_number) DO NOTHING;

-- INSERT INTO admin_users (employee_id, role) 
-- SELECT id, 'super_admin' FROM employees WHERE employee_number = 'ADMIN001'
-- ON CONFLICT (employee_id) DO NOTHING;
