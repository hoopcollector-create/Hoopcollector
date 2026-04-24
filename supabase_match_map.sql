-- community_matches 테이블에 위경도 좌표 컬럼 추가
ALTER TABLE community_matches 
ADD COLUMN IF NOT EXISTS lat DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS lng DECIMAL(11, 8);

-- RLS 정책 확인 (이미 있다면 생략되겠지만 안전하게 추가)
-- 이미 community_matches에 대한 정책이 있으므로 컬럼 추가만으로 충분합니다.
