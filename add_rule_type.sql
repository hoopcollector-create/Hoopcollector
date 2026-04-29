-- coach_slot_rules 테이블에 규칙 타입(type) 컬럼 추가
ALTER TABLE public.coach_slot_rules ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'slot';

-- 기존 데이터는 모두 'slot'(수업 가능)으로 설정
UPDATE public.coach_slot_rules SET type = 'slot' WHERE type IS NULL;

-- 캐시 갱신
NOTIFY pgrst, 'reload schema';
