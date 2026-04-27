-- match_messages 테이블에 template_id 컬럼 추가 (통합 채팅 지원)
ALTER TABLE match_messages ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES match_templates(id);

-- 인덱스 추가 (조회 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_match_messages_template_id ON match_messages(template_id);
