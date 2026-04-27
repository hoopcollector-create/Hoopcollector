-- 글로벌 확장을 위한 타임존 컬럼 추가
ALTER TABLE match_rooms ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Seoul';
ALTER TABLE match_templates ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Seoul';

-- 기존 match_messages에도 타임존 정보가 필요할 수 있으므로 추가 (선택사항)
-- ALTER TABLE match_messages ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Seoul';
