-- [notifications] 테이블의 모든 권한 충돌을 제거하는 Nuclear 스크립트

-- 1. 기본 권한 모두 열어주기 (가장 필수)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO service_role;

-- 2. RLS 명시적 활성화
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 3. 기존의 모든 꼬여있는 Policy 싹 지우기 (충돌 방지)
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'notifications'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.notifications', pol.policyname);
    END LOOP;
END
$$;

-- 4. INSERT (생성): 로그인한 모든 유저가 권한 제약 없이 시스템 알림 생성 가능하도록 완벽 개방
CREATE POLICY "allow_insert_notifications_nuclear" ON public.notifications 
FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
);

-- 5. SELECT (조회) 및 UPDATE (읽음 처리): 내 알림만 읽고 쓸 수 있음
CREATE POLICY "allow_select_notifications_nuclear" ON public.notifications 
FOR SELECT USING (
    auth.uid() = user_id
);

CREATE POLICY "allow_update_notifications_nuclear" ON public.notifications 
FOR UPDATE USING (
    auth.uid() = user_id
);
