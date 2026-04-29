-- 1. coach_slots 테이블의 제약 조건 확인 및 중복 방지 제약 조건 삭제
-- (만약 너무 엄격하게 걸려있어서 409 에러가 난다면 삭제 후 다시 설정하거나 완화합니다.)

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'no_overlapping_slots') THEN
        ALTER TABLE public.coach_slots DROP CONSTRAINT no_overlapping_slots;
    END IF;
END $$;

-- 2. coach_id가 누락되어 발생하는 오류 방지를 위해 NOT NULL 제약 추가
ALTER TABLE public.coach_slots ALTER COLUMN coach_id SET NOT NULL;

-- 3. 혹시 모를 고유 인덱스 충돌 확인 및 제거 (ID는 UUID이므로 충돌 가능성 낮으나 체크)
-- (만약 특정 컬럼 조합으로 UNIQUE 인덱스가 있다면 삭제)
-- DROP INDEX IF EXISTS unique_slot_idx;

-- 4. 캐시 갱신
NOTIFY pgrst, 'reload schema';
