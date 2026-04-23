-- [class_requests] 테이블의 권한 충돌을 초기화하고 완벽하게 새로운 단일 규칙으로 덮어씌우는 "Nuclear" 스크립트입니다.

-- 1. 테이블 기본 권한 부여 (혹시 모를 권한 누락 방지)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_requests TO anon;

-- 2. RLS 활성화
ALTER TABLE public.class_requests ENABLE ROW LEVEL SECURITY;

-- 3. 기존에 얽혀있던 모든 복잡한 규칙들을 깨끗하게 삭제합니다.
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'class_requests'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.class_requests', pol.policyname);
    END LOOP;
END
$$;

-- 4. INSERT, SELECT, UPDATE, DELETE를 모두 포괄하는 가장 직관적이고 강력한 단일 정책 하나만 생성
CREATE POLICY "allow_all_class_requests_final" ON public.class_requests
FOR ALL USING (
    -- 자신이 학생인 경우
    auth.uid() = student_id OR 
    -- 자신이 지정된 코치인 경우
    auth.uid() = coach_id OR 
    -- 아직 지정된 코치가 없는 오픈 요청인 경우 (누구나 수락 가능)
    coach_id IS NULL OR 
    -- 관리자인 경우
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
