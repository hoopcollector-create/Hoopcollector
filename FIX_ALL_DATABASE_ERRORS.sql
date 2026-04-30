
-- 1. 매치 대기열 테이블 생성 (404 에러 해결)
CREATE TABLE IF NOT EXISTS match_waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES match_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'waiting',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(match_id, user_id)
);

-- 2. 매치 메시지 테이블에 template_id 컬럼 추가 (400 에러 해결 가능성)
ALTER TABLE match_messages ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES match_rooms(id);

-- 3. 매치 참여자 테이블에 status 컬럼 추가 (400 에러 해결)
ALTER TABLE match_participants ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'joined';

-- 4. 매치 룸에 approval_required 컬럼 추가 (새 기능 지원)
ALTER TABLE match_rooms ADD COLUMN IF NOT EXISTS approval_required BOOLEAN DEFAULT false;

-- 5. RLS 정책 설정 (보안)
ALTER TABLE match_waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Waitlist is viewable by everyone" ON match_waitlist;
CREATE POLICY "Waitlist is viewable by everyone" ON match_waitlist FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can join waitlist" ON match_waitlist;
CREATE POLICY "Users can join waitlist" ON match_waitlist FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can leave waitlist" ON match_waitlist;
CREATE POLICY "Users can leave waitlist" ON match_waitlist FOR DELETE USING (auth.uid() = user_id);

-- 7. 구매 관련 테이블 필수 구조 보강 (구매, 현금영수증, 날짜 에러 해결)
-- purchases 테이블 (결제 내역)
-- 기존 제약 조건들이 충돌을 일으키므로 모두 삭제합니다. (이름 변형 포함)
ALTER TABLE purchases DROP CONSTRAINT IF EXISTS purchases_status_check;
ALTER TABLE purchases DROP CONSTRAINT IF EXISTS purchases_status_chk;

ALTER TABLE purchases ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS product_title TEXT;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS amount INTEGER DEFAULT 0;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS points_used INTEGER DEFAULT 0;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS method TEXT DEFAULT 'cash'; -- 'cash', 'point'
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS payer_name TEXT;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS cash_receipt_type TEXT;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS cash_receipt_value TEXT;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS cash_receipt_number TEXT;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS receipt_status TEXT DEFAULT 'pending';
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- shop_purchase_requests 테이블 (구매 요청)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'shop_purchase_requests') THEN
        ALTER TABLE shop_purchase_requests ADD COLUMN IF NOT EXISTS payer_name TEXT;
        ALTER TABLE shop_purchase_requests ADD COLUMN IF NOT EXISTS cash_receipt_type TEXT;
        ALTER TABLE shop_purchase_requests ADD COLUMN IF NOT EXISTS cash_receipt_value TEXT;
        ALTER TABLE shop_purchase_requests ADD COLUMN IF NOT EXISTS receipt_status TEXT DEFAULT 'pending';
        ALTER TABLE shop_purchase_requests ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
        ALTER TABLE shop_purchase_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
        ALTER TABLE shop_purchase_requests ADD COLUMN IF NOT EXISTS method TEXT DEFAULT 'cash';
    END IF;
END $$;

-- 8. 알림 테이블(notifications) 구조 보강 (알림 에러 해결)
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS message TEXT; -- 혹시 몰라 둘 다 대응

-- 9. 구매 승인 및 반려 로직 (RPC 함수)
-- 기존 함수가 있을 경우 삭제 (리턴 타입 충돌 방지)
DROP FUNCTION IF EXISTS approve_shop_purchase_request(UUID);
DROP FUNCTION IF EXISTS reject_shop_purchase_request(UUID);

-- 결제 승인: 상태 변경, 티켓 지급, 알림 발송
CREATE OR REPLACE FUNCTION approve_shop_purchase_request(p_request_id UUID)
RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
    v_product_title TEXT;
    v_qty INTEGER;
    v_status TEXT;
    v_points_used INTEGER;
    v_cash_amount INTEGER;
BEGIN
    -- 1. 요청 정보 조회 및 상태 확인
    SELECT user_id, product_title, quantity, status, points_used, cash_amount 
    INTO v_user_id, v_product_title, v_qty, v_status, v_points_used, v_cash_amount
    FROM shop_purchase_requests WHERE id = p_request_id;

    IF v_status != 'pending' THEN
        RAISE EXCEPTION '이미 처리된 요청입니다. (현재 상태: %)', v_status;
    END IF;

    -- 2. 티켓 상품인 경우 티켓 지급
    IF v_product_title LIKE '%A GRADE%' THEN
        INSERT INTO ticket_balances (user_id, class_type, balance) VALUES (v_user_id, 'A', v_qty)
        ON CONFLICT (user_id, class_type) DO UPDATE SET balance = ticket_balances.balance + v_qty;
    ELSIF v_product_title LIKE '%B GRADE%' THEN
        INSERT INTO ticket_balances (user_id, class_type, balance) VALUES (v_user_id, 'B', v_qty)
        ON CONFLICT (user_id, class_type) DO UPDATE SET balance = ticket_balances.balance + v_qty;
    ELSIF v_product_title LIKE '%C GRADE%' THEN
        INSERT INTO ticket_balances (user_id, class_type, balance) VALUES (v_user_id, 'C', v_qty)
        ON CONFLICT (user_id, class_type) DO UPDATE SET balance = ticket_balances.balance + v_qty;
    END IF;

    -- 3. 상태 업데이트
    UPDATE shop_purchase_requests SET status = 'paid', updated_at = NOW() WHERE id = p_request_id;

    -- 4. purchases 테이블에 기록
    INSERT INTO purchases (user_id, product_title, amount, status, created_at, method)
    VALUES (v_user_id, v_product_title, v_cash_amount, 'completed', NOW(), 'point');

    -- 5. 알림 발송 (content 컬럼 사용)
    INSERT INTO notifications (user_id, type, title, content)
    VALUES (v_user_id, 'shop', '결제 승인 완료', v_product_title || ' 상품의 결제가 확인되어 처리가 완료되었습니다.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 결제 반려: 포인트 환불, 상태 변경
CREATE OR REPLACE FUNCTION reject_shop_purchase_request(p_request_id UUID)
RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
    v_points_used INTEGER;
    v_status TEXT;
    v_product_title TEXT;
BEGIN
    SELECT user_id, points_used, status, product_title 
    INTO v_user_id, v_points_used, v_status, v_product_title
    FROM shop_purchase_requests WHERE id = p_request_id;

    IF v_status != 'pending' THEN
        RAISE EXCEPTION '이미 처리된 요청입니다.';
    END IF;

    -- 1. 포인트 환불
    IF v_points_used > 0 THEN
        UPDATE user_points_stats SET balance = balance + v_points_used WHERE user_id = v_user_id;
    END IF;

    -- 2. 상태 업데이트
    UPDATE shop_purchase_requests SET status = 'cancelled', updated_at = NOW() WHERE id = p_request_id;

    -- 3. 알림 발송
    INSERT INTO notifications (user_id, type, title, content)
    VALUES (v_user_id, 'shop', '주문 반려 안내', v_product_title || ' 주문이 반려되었습니다. 사용된 포인트는 환불되었습니다.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 현금 티켓 구매 승인: 티켓 지급 및 상태 변경
DROP FUNCTION IF EXISTS approve_cash_purchase(UUID);
CREATE OR REPLACE FUNCTION approve_cash_purchase(p_purchase_id UUID)
RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
    v_product_title TEXT;
    v_amount INTEGER;
    v_points_used INTEGER;
    v_ticket_qty INTEGER := 1;
    v_grade TEXT;
BEGIN
    -- 1. 정보 조회
    SELECT user_id, product_title, amount, points_used 
    INTO v_user_id, v_product_title, v_amount, v_points_used
    FROM purchases WHERE id = p_purchase_id;

    -- 2. 티켓 등급 파악
    IF v_product_title LIKE '%A GRADE%' THEN v_grade := 'A';
    ELSIF v_product_title LIKE '%B GRADE%' THEN v_grade := 'B';
    ELSIF v_product_title LIKE '%C GRADE%' THEN v_grade := 'C';
    ELSE v_grade := 'C';
    END IF;

    -- 3. 티켓 지급
    INSERT INTO ticket_balances (user_id, class_type, balance) 
    VALUES (v_user_id, v_grade, v_ticket_qty)
    ON CONFLICT (user_id, class_type) DO UPDATE SET balance = ticket_balances.balance + v_ticket_qty;

    -- 4. 상태 변경
    UPDATE purchases SET status = 'completed', updated_at = NOW() WHERE id = p_purchase_id;

    -- 5. 알림 발송
    INSERT INTO notifications (user_id, type, title, content)
    VALUES (v_user_id, 'payment', '티켓 충전 완료', '현금 입금이 확인되어 ' || v_grade || ' GRADE 티켓이 충전되었습니다.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 현금 티켓 구매 취소/반려
DROP FUNCTION IF EXISTS cancel_cash_purchase(UUID);
CREATE OR REPLACE FUNCTION cancel_cash_purchase(p_purchase_id UUID)
RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
    v_points_used INTEGER;
BEGIN
    SELECT user_id, points_used INTO v_user_id, v_points_used FROM purchases WHERE id = p_purchase_id;

    -- 1. 포인트 환불
    IF v_points_used > 0 THEN
        UPDATE user_points_stats SET balance = balance + v_points_used WHERE user_id = v_user_id;
    END IF;

    -- 2. 상태 변경
    UPDATE purchases SET status = 'cancelled', updated_at = NOW() WHERE id = p_purchase_id;

    -- 3. 알림 발송
    INSERT INTO notifications (user_id, type, title, content)
    VALUES (v_user_id, 'payment', '구매 요청 반려', '티켓 구매 요청이 반려되었습니다. 사용된 포인트는 환불되었습니다.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. 코치 슬롯(Schedule) 관련 중복 방지 제약 조건
-- ... (이하 동일)
