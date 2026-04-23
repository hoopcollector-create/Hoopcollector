-- [notifications] 테이블의 권한(RLS) 문제 해결 스크립트

-- 1. RLS 활성화
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 2. 기존 잘못된/누락된 INSERT 권한 해결
-- 문제 원인: 코치가 "학생"에게 알림을 보내려고 INSERT를 시도하는데, 기존 정책은 "내 알림만 추가/수정 가능"하게 되어있거나 INSERT 권한 자체가 없었습니다.
DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;

-- 3. 인증된 사용자(코치, 학생) 누구나 알림을 생성할 수 있도록 허용 (수신자 user_id가 누구든 상관없이 시스템 로그성 알림 생성 허용)
CREATE POLICY "Users can insert notifications" ON public.notifications 
FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
);

-- 4. 본인의 알림 조회/업데이트 권한이 누락되었다면 보완
DROP POLICY IF EXISTS "Users can see their own notifications" ON public.notifications;
CREATE POLICY "Users can see their own notifications" ON public.notifications 
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their notifications" ON public.notifications;
CREATE POLICY "Users can update their notifications" ON public.notifications 
FOR UPDATE USING (auth.uid() = user_id);
