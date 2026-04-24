-- [FIX] 'column role does not exist' 에러 해결을 위한 긴급 복구 스크립트
-- 이 코드를 Supabase SQL Editor에서 실행해 주세요.

-- 1. user_roles 테이블이 'role' 컬럼을 갖도록 확실히 보장
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='user_roles' AND column_name='role'
    ) THEN
        -- 만약 role_name 같은 다른 이름으로 있다면 변경, 없으면 생성
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_roles' AND column_name='role_name') THEN
            ALTER TABLE public.user_roles RENAME COLUMN role_name TO role;
        ELSE
            ALTER TABLE public.user_roles ADD COLUMN role TEXT DEFAULT 'student';
        END IF;
    END IF;
END $$;

-- 2. class_requests 테이블의 정책(Policy) 재설정
-- 기존에 'role' 컬럼 문제로 꼬여있던 정책을 삭제하고 다시 생성합니다.
DROP POLICY IF EXISTS "allow_all_class_requests_final" ON public.class_requests;
DROP POLICY IF EXISTS "allow_select_class_requests_v1" ON public.class_requests;
DROP POLICY IF EXISTS "allow_update_class_requests_v1" ON public.class_requests;

CREATE POLICY "allow_all_class_requests_v2" ON public.class_requests
FOR ALL USING (
    auth.uid() = student_id OR 
    auth.uid() = coach_id OR 
    coach_id IS NULL OR 
    (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'))
);

-- 3. notifications 테이블 정책 재설정
DROP POLICY IF EXISTS "allow_insert_notifications_nuclear" ON public.notifications;
CREATE POLICY "allow_insert_notifications_v2" ON public.notifications 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "allow_select_notifications_nuclear" ON public.notifications;
CREATE POLICY "allow_select_notifications_v2" ON public.notifications 
FOR SELECT USING (auth.uid() = user_id);
