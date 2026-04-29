-- 1. coach_slots 테이블 RLS 정책 초기화 및 재설정
ALTER TABLE public.coach_slots ENABLE ROW LEVEL SECURITY;

-- 기존에 꼬여있을 수 있는 정책 삭제
DROP POLICY IF EXISTS "Coaches can manage their own slots" ON public.coach_slots;
DROP POLICY IF EXISTS "Anyone can view slots" ON public.coach_slots;
DROP POLICY IF EXISTS "Coaches can insert their own slots" ON public.coach_slots;
DROP POLICY IF EXISTS "Coaches can update their own slots" ON public.coach_slots;
DROP POLICY IF EXISTS "Coaches can delete their own slots" ON public.coach_slots;

-- 2. 새로운 통합 정책 추가 (본인 스케줄은 본인만 관리 가능)
CREATE POLICY "Coaches can manage their own slots" ON public.coach_slots
    FOR ALL
    USING (auth.uid() = coach_id)
    WITH CHECK (auth.uid() = coach_id);

-- 3. 조회 권한 (학생들이 코치의 시간을 볼 수 있어야 하므로)
CREATE POLICY "Anyone can view slots" ON public.coach_slots
    FOR SELECT
    USING (true);

-- 4. 만약 유저가 코치인지 확인하는 로직이 꼬였다면 강제로 권한 부여 (필요 시)
-- 이 부분은 현재 로그인한 유저가 코치 역할을 가지고 있어야 작동합니다.
-- 혹시 코치 역할을 아직 부여받지 못했다면 아래 코드를 실행하세요 (uid 부분은 자동 처리됨)
-- INSERT INTO public.user_roles (user_id, role) 
-- VALUES (auth.uid(), 'coach')
-- ON CONFLICT DO NOTHING;
