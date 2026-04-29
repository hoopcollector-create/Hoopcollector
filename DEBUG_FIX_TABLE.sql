-- 1. 기존 테이블 삭제 (깨끗하게 새로 시작)
DROP TABLE IF EXISTS public.coach_slot_rules CASCADE;

-- 2. 테이블 생성 (가장 단순하고 호환성 높은 구조)
CREATE TABLE public.coach_slot_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL,
    day_of_week INTEGER NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. 인덱스 및 제약 (성능 및 중복 방지)
CREATE INDEX idx_coach_rules_coach_id ON public.coach_slot_rules(coach_id);

-- 4. RLS 보안 설정 (전면 개방 후 테스트)
ALTER TABLE public.coach_slot_rules ENABLE ROW LEVEL SECURITY;

-- 모든 로그인 유저가 자신의 데이터를 넣고 뺄 수 있게 허용
CREATE POLICY "Allow all actions for owner" ON public.coach_slot_rules
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 5. 스키마 캐시 갱신
NOTIFY pgrst, 'reload schema';
