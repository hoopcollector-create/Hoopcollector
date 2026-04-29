-- 1. coach_slot_rules 테이블 (반복 규칙) 확실하게 생성
CREATE TABLE IF NOT EXISTS public.coach_slot_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(coach_id, day_of_week, start_time, end_time)
);

-- 2. coach_slots 테이블 (실제 스케줄) 구조 보강
-- 만약 status 컬럼 등이 없다면 추가합니다.
ALTER TABLE public.coach_slots ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open';
ALTER TABLE public.coach_slots ADD COLUMN IF NOT EXISTS is_booked BOOLEAN DEFAULT false;
ALTER TABLE public.coach_slots ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.coach_slots ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'slot';

-- 3. RLS 보안 정책 전면 재설정 (403 에러 해결)
-- 모든 보안 설정을 초기화하고 가장 확실한 권한을 부여합니다.
ALTER TABLE public.coach_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_slot_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coaches manage slots" ON public.coach_slots;
DROP POLICY IF EXISTS "Anyone view slots" ON public.coach_slots;
DROP POLICY IF EXISTS "Coaches manage rules" ON public.coach_slot_rules;

-- 코치는 자신의 슬롯과 규칙을 완벽하게 제어 가능
CREATE POLICY "Coaches manage slots" ON public.coach_slots
    FOR ALL USING (auth.uid() = coach_id) WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches manage rules" ON public.coach_slot_rules
    FOR ALL USING (auth.uid() = coach_id) WITH CHECK (auth.uid() = coach_id);

-- 누구나 슬롯 조회 가능 (학생 예약용)
CREATE POLICY "Anyone view slots" ON public.coach_slots
    FOR SELECT USING (true);

-- 4. 서비스 지역(service_regions) 테이블 확인 (간혹 여기서도 에러 발생)
CREATE TABLE IF NOT EXISTS public.service_regions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name TEXT UNIQUE NOT NULL,
    active BOOLEAN DEFAULT true
);

-- 5. 캐시 갱신
NOTIFY pgrst, 'reload schema';
