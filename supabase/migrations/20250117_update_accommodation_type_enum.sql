-- accommodation_type enum에 RISOM 값 추가하고 SONOVEL을 RISOM으로 변경
-- 주의: 이 마이그레이션은 두 단계로 나누어 실행해야 합니다.
-- PostgreSQL에서는 새로운 enum 값이 커밋된 후에만 사용할 수 있습니다.

-- 단계 1: enum에 RISOM 값 추가 (먼저 실행)
ALTER TYPE accommodation_type ADD VALUE 'RISOM';

-- 단계 2: 기존 SONOVEL 값을 RISOM으로 업데이트 (단계 1 완료 후 별도로 실행)
-- UPDATE accommodations SET type = 'RISOM' WHERE type = 'SONOVEL';