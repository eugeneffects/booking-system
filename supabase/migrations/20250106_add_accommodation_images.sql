-- 숙소 이미지 지원을 위한 스키마 및 스토리지 설정

-- accommodations 테이블에 이미지 URL 배열 컬럼 추가
ALTER TABLE accommodations
ADD COLUMN IF NOT EXISTS image_urls TEXT[];

-- 스토리지 버킷 생성 (공개 읽기)
INSERT INTO storage.buckets (id, name, public)
VALUES ('accommodations', 'accommodations', true)
ON CONFLICT (id) DO NOTHING;

-- 참고: 업로드/삭제 권한은 서버(API)에서 서비스 롤로 처리하고,
--       클라이언트는 공개 URL을 통해 이미지를 조회합니다.


