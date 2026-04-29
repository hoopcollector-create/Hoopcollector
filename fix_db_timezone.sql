-- coach_slots 테이블의 시간 컬럼 타입을 시간대 인식형(TIMESTAMPTZ)으로 변경
-- 기존 데이터가 있어도 안전하게 변경하도록 처리합니다.

ALTER TABLE public.coach_slots 
  ALTER COLUMN start_at TYPE TIMESTAMPTZ USING start_at::TIMESTAMPTZ,
  ALTER COLUMN end_at TYPE TIMESTAMPTZ USING end_at::TIMESTAMPTZ;

-- 기본값 설정 (선택 사항)
ALTER TABLE public.coach_slots 
  ALTER COLUMN start_at SET DEFAULT now(),
  ALTER COLUMN end_at SET DEFAULT now();

-- 스키마 갱신 알림
NOTIFY pgrst, 'reload schema';
