-- =========================================================================
-- [티켓 및 포인트 데이터베이스 조회 권한(RLS) 복구 스크립트]
-- * 유저가 대시보드에서 자신의 티켓 잔액을 정상적으로 볼 수 있도록 정책을 추가합니다.
-- =========================================================================

-- 1. 티켓 잔액(ticket_balances) 보안 정책 설정
ALTER TABLE ticket_balances ENABLE ROW LEVEL SECURITY;

-- 기존 정책이 있다면 충돌 방지를 위해 삭제
DROP POLICY IF EXISTS "Users can view their own ticket balances" ON ticket_balances;

-- 사용자가 '자신의 티켓만' 조회하거나 '관리자'가 모두 조회할 수 있도록 허용
CREATE POLICY "Users and Admins can view ticket balances" 
ON ticket_balances FOR SELECT 
USING (auth.uid() = user_id OR public.is_admin());

-- 2. 포인트 잔액(user_points_stats) 보안 정책 설정
ALTER TABLE user_points_stats ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view their own point stats" ON user_points_stats;
DROP POLICY IF EXISTS "Users and Admins can view point stats" ON user_points_stats;

-- 사용자가 '자신의 포인트만' 조회하거나 '관리자'가 모두 조회할 수 있도록 허용
CREATE POLICY "Users and Admins can view point stats" 
ON user_points_stats FOR SELECT 
USING (auth.uid() = user_id OR public.is_admin());

-- 3. (혹시 모를 상황 대비) 알림 내역 정책 확인
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users and Admins can view notifications" ON notifications;
CREATE POLICY "Users and Admins can view notifications" 
ON notifications FOR SELECT 
USING (auth.uid() = user_id OR public.is_admin());

