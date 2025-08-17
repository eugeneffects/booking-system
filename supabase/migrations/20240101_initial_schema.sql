-- 숙소예약 추첨 시스템 초기 스키마
-- 이 마이그레이션은 모든 필요한 테이블, 인덱스, RLS 정책을 생성합니다.

-- UUID 확장 기능 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 임직원 테이블
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_number VARCHAR(50) UNIQUE NOT NULL, -- 사번
    name VARCHAR(100) NOT NULL, -- 이름
    department VARCHAR(100) NOT NULL, -- 소속
    company_email VARCHAR(255) UNIQUE NOT NULL, -- 회사 이메일
    phone VARCHAR(50) NOT NULL, -- 연락처
    is_active BOOLEAN DEFAULT true, -- 재직 여부
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 숙소 정보 테이블
CREATE TYPE accommodation_type AS ENUM ('ANANTI', 'SONOVEL', 'OTHER');

CREATE TABLE accommodations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL, -- 숙소명
    type accommodation_type NOT NULL, -- 숙소 유형
    restriction_years INTEGER NOT NULL, -- 제한 기간(년)
    description TEXT, -- 설명
    is_active BOOLEAN DEFAULT true, -- 활성화 여부
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 예약 기간 테이블
CREATE TABLE reservation_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    accommodation_id UUID NOT NULL REFERENCES accommodations(id) ON DELETE CASCADE,
    start_date DATE NOT NULL, -- 시작일
    end_date DATE NOT NULL, -- 종료일
    available_rooms INTEGER NOT NULL CHECK (available_rooms > 0), -- 가용 객실 수
    is_open BOOLEAN DEFAULT true, -- 신청 가능 여부
    application_deadline TIMESTAMP WITH TIME ZONE NOT NULL, -- 신청 마감 시간
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_date_range CHECK (end_date >= start_date),
    CONSTRAINT valid_deadline CHECK (application_deadline < start_date)
);

-- 신청 상태 타입
CREATE TYPE application_status AS ENUM ('pending', 'selected', 'not_selected');

-- 신청 정보 테이블
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    reservation_period_id UUID NOT NULL REFERENCES reservation_periods(id) ON DELETE CASCADE,
    status application_status DEFAULT 'pending', -- 신청 상태
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 신청 시간
    form_data JSONB, -- 구글폼 데이터
    UNIQUE(employee_id, reservation_period_id) -- 중복 신청 방지
);

-- 추첨 결과 테이블
CREATE TABLE lottery_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_period_id UUID NOT NULL REFERENCES reservation_periods(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    rank INTEGER NOT NULL CHECK (rank > 0), -- 추첨 순위
    is_winner BOOLEAN NOT NULL, -- 당첨 여부
    drawn_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 추첨 일시
    drawn_by UUID NOT NULL REFERENCES employees(id), -- 추첨 실행자
    UNIQUE(reservation_period_id, rank) -- 같은 기간에 순위 중복 방지
);

-- 당첨 이력 테이블
CREATE TABLE winners_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    accommodation_id UUID NOT NULL REFERENCES accommodations(id) ON DELETE CASCADE,
    check_in_date DATE NOT NULL, -- 체크인 날짜
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 관리자 역할 타입
CREATE TYPE admin_role AS ENUM ('super_admin', 'admin');

-- 관리자 테이블
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID UNIQUE NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    role admin_role NOT NULL, -- 관리자 역할
    is_active BOOLEAN DEFAULT true, -- 활성화 여부
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX idx_employees_email ON employees(company_email);
CREATE INDEX idx_employees_number ON employees(employee_number);
CREATE INDEX idx_applications_employee ON applications(employee_id);
CREATE INDEX idx_applications_period ON applications(reservation_period_id);
CREATE INDEX idx_lottery_results_period ON lottery_results(reservation_period_id);
CREATE INDEX idx_winners_history_employee ON winners_history(employee_id);
CREATE INDEX idx_winners_history_accommodation ON winners_history(accommodation_id);
CREATE INDEX idx_winners_history_date ON winners_history(check_in_date);

-- 트리거: employees 테이블 updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) 정책 활성화
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE accommodations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE lottery_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE winners_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 인증된 사용자는 자신의 정보만 조회 가능
CREATE POLICY "Users can view own employee data" ON employees
    FOR SELECT USING (auth.uid()::text = id::text);

-- RLS 정책: 관리자는 모든 임직원 정보 조회/수정 가능
CREATE POLICY "Admins can manage all employees" ON employees
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.employee_id::text = auth.uid()::text
            AND admin_users.is_active = true
        )
    );

-- RLS 정책: 모든 인증된 사용자는 숙소 정보 조회 가능
CREATE POLICY "Anyone can view active accommodations" ON accommodations
    FOR SELECT USING (is_active = true);

-- RLS 정책: 관리자만 숙소 정보 수정 가능
CREATE POLICY "Admins can manage accommodations" ON accommodations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.employee_id::text = auth.uid()::text
            AND admin_users.is_active = true
        )
    );

-- RLS 정책: 열린 예약 기간은 모두 조회 가능
CREATE POLICY "Anyone can view open reservation periods" ON reservation_periods
    FOR SELECT USING (is_open = true);

-- RLS 정책: 관리자만 예약 기간 관리 가능
CREATE POLICY "Admins can manage reservation periods" ON reservation_periods
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.employee_id::text = auth.uid()::text
            AND admin_users.is_active = true
        )
    );

-- RLS 정책: 사용자는 자신의 신청만 조회 가능
CREATE POLICY "Users can view own applications" ON applications
    FOR SELECT USING (employee_id::text = auth.uid()::text);

-- RLS 정책: 사용자는 자신의 신청만 생성 가능
CREATE POLICY "Users can create own applications" ON applications
    FOR INSERT WITH CHECK (employee_id::text = auth.uid()::text);

-- RLS 정책: 관리자는 모든 신청 조회 가능
CREATE POLICY "Admins can view all applications" ON applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.employee_id::text = auth.uid()::text
            AND admin_users.is_active = true
        )
    );

-- RLS 정책: 추첨 결과는 모두 조회 가능
CREATE POLICY "Anyone can view lottery results" ON lottery_results
    FOR SELECT USING (true);

-- RLS 정책: 관리자만 추첨 결과 생성 가능
CREATE POLICY "Admins can create lottery results" ON lottery_results
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.employee_id::text = auth.uid()::text
            AND admin_users.is_active = true
        )
    );

-- RLS 정책: 당첨 이력은 관리자만 조회 가능
CREATE POLICY "Admins can view winners history" ON winners_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.employee_id::text = auth.uid()::text
            AND admin_users.is_active = true
        )
    );

-- 커스텀 함수: 당첨 이력 확인
CREATE OR REPLACE FUNCTION check_winner_history(
    p_employee_id UUID,
    p_accommodation_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_accommodation_type accommodation_type;
    v_restriction_years INTEGER;
    v_has_history BOOLEAN;
BEGIN
    -- 숙소 정보 조회
    SELECT type, restriction_years INTO v_accommodation_type, v_restriction_years
    FROM accommodations
    WHERE id = p_accommodation_id;

    -- 제한 기간 내 당첨 이력 확인
    SELECT EXISTS (
        SELECT 1
        FROM winners_history
        WHERE employee_id = p_employee_id
        AND accommodation_id = p_accommodation_id
        AND check_in_date >= CURRENT_DATE - (v_restriction_years || ' years')::INTERVAL
    ) INTO v_has_history;

    RETURN v_has_history;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 초기 관리자 계정 생성을 위한 주석
-- INSERT INTO employees (employee_number, name, department, company_email, phone) 
-- VALUES ('ADMIN001', '시스템 관리자', 'IT팀', 'admin@company.com', '010-0000-0000');
-- INSERT INTO admin_users (employee_id, role) 
-- SELECT id, 'super_admin' FROM employees WHERE employee_number = 'ADMIN001';
