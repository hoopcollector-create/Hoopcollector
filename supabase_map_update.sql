-- 훕콜렉터 코치 지정 예약 및 지도 연동을 위한 데이터베이스 업데이트 스크립트 v2

-- 1. 코치 프로필에 이동수단(차량/대중교통) 및 지도 연동 필드 추가
ALTER TABLE coach_profiles 
ADD COLUMN IF NOT EXISTS transport_mode VARCHAR(20) DEFAULT 'transit';
COMMENT ON COLUMN coach_profiles.transport_mode IS '코치의 이동 수단. car(차량) 또는 transit(대중교통)';

-- 2. 기존 수업 요청(class_requests) 테이블 확장
ALTER TABLE class_requests ADD COLUMN IF NOT EXISTS lat NUMERIC(10, 7);
ALTER TABLE class_requests ADD COLUMN IF NOT EXISTS lng NUMERIC(10, 7);
ALTER TABLE class_requests ADD COLUMN IF NOT EXISTS reject_reason TEXT;
