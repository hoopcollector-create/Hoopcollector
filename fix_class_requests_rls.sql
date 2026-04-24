-- [class_requests] 테이블의 권한(RLS) 관련 문제를 해결하기 위한 SQL 스크립트입니다.
-- Supabase SQL Editor 창에 이 코드를 붙여넣고 "RUN" 버튼을 눌러주세요.

-- 1. 만약 RLS가 꺼져있다면 명시적으로 켭니다.
ALTER TABLE public.class_requests ENABLE ROW LEVEL SECURITY;

-- 2. 기존 정책들이 어떤 이름으로 되어있는지 알 수 없으므로, 
-- 가장 확실하게 코치/학생/관리자가 자신과 관련된 요소를 수정할 수 있는 새로운 정책을 덮어씌우듯 생성합니다.
-- (Supabase에서는 조건에 하나라도 부합하는 정책이 있으면 권한이 허용됩니다.)

-- SELECT: 모든 관련된 유저(학생 본인, 지정된 코치, 지정 안 된 코치(오픈 요청))가 조회 가능
CREATE POLICY "allow_select_class_requests_v1" ON public.class_requests
FOR SELECT USING (
    auth.uid() = student_id OR 
    auth.uid() = coach_id OR 
    coach_id IS NULL OR 
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- INSERT: 학생 본인이 자신의 요청을 생성 가능
CREATE POLICY "allow_insert_class_requests_v1" ON public.class_requests
FOR INSERT WITH CHECK (
    auth.uid() = student_id
);

-- UPDATE (에러의 핵심 원인): 코치가 "지정 안 된 수업(coach_id IS NULL)"을 수락하거나, 자신의 수업을 수정 가능
CREATE POLICY "allow_update_class_requests_v1" ON public.class_requests
FOR UPDATE USING (
    auth.uid() = student_id OR 
    auth.uid() = coach_id OR 
    coach_id IS NULL OR 
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
