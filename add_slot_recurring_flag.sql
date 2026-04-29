-- 1. coach_slots 테이블에 자동 생성 여부 필드 추가
ALTER TABLE public.coach_slots ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;

-- 2. 캐시 갱신
NOTIFY pgrst, 'reload schema';
