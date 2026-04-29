-- 1. 반복 일정 규칙 테이블 생성
CREATE TABLE IF NOT EXISTS public.coach_slot_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- 동일한 코치가 같은 요일/시간에 중복 규칙을 넣지 않도록 유니크 제약 (선택 사항이지만 권장)
    UNIQUE(coach_id, day_of_week, start_time, end_time)
);

-- 2. RLS 보안 설정
ALTER TABLE public.coach_slot_rules ENABLE ROW LEVEL SECURITY;

-- 3. 정책 추가 (본인의 것만 관리 가능)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coach_slot_rules' AND policyname = 'Coaches can manage their own rules') THEN
        CREATE POLICY "Coaches can manage their own rules" ON public.coach_slot_rules
            FOR ALL
            USING (auth.uid() = coach_id)
            WITH CHECK (auth.uid() = coach_id);
    END IF;
END $$;

-- 4. 캐시 갱신을 위해 스키마 노출 확인
COMMENT ON TABLE public.coach_slot_rules IS 'Stores recurring availability rules for coaches';
