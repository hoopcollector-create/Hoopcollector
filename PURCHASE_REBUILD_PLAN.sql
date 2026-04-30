-- =========================================================================
-- [무결성 결제/티켓 아키텍처 재건축 스크립트 V2]
-- * 경고: 실행 시 기존 결제/요청 내역이 초기화됩니다. (유저/티켓 잔액은 유지됨)
-- =========================================================================

-- 1. 결제 데이터 초기화 (오작동 데이터 클렌징)
TRUNCATE TABLE purchases CASCADE;
TRUNCATE TABLE shop_purchase_requests CASCADE;

-- 2. 테이블 구조 완벽 보강 (누락된 컬럼 추가 및 연결 고리 확보)
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS ticket_qty INTEGER DEFAULT 1;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS class_type TEXT DEFAULT 'C';

-- (혹시 기존에 꼬여있는 NOT NULL 제약조건이 있다면 안전하게 해제)
ALTER TABLE purchases ALTER COLUMN ticket_qty DROP NOT NULL;

ALTER TABLE shop_purchase_requests ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES shop_products(id) ON DELETE SET NULL;

-- 3. 구매 요청 생성 함수 완벽 재정의 (모든 상품 정보 100% 동기화)
CREATE OR REPLACE FUNCTION create_cash_purchase(
    p_product_id UUID,
    p_payer_name TEXT,
    p_cash_receipt_type TEXT,
    p_cash_receipt_value TEXT,
    p_points_use INTEGER,
    p_note TEXT
) RETURNS UUID AS $$
DECLARE
    v_purchase_id UUID;
    v_price INTEGER;
    v_product_title TEXT;
    v_ticket_qty INTEGER;
    v_class_type TEXT;
BEGIN
    -- 1. 상품 정보 완벽 조회 (이름, 가격, 등급, 개수 모두 가져옴)
    SELECT price, name, ticket_qty, class_type 
    INTO v_price, v_product_title, v_ticket_qty, v_class_type
    FROM products WHERE id = p_product_id;

    IF v_price IS NULL THEN
        RAISE EXCEPTION '상품 정보를 찾을 수 없습니다. (ID: %)', p_product_id;
    END IF;
    
    -- 2. purchases 테이블에 누락 없이 모두 기록 (ticket_qty 에러 방지)
    INSERT INTO purchases (
        user_id, product_id, product_title, amount, points_used, method, status, 
        payer_name, cash_receipt_type, cash_receipt_value, note, 
        ticket_qty, class_type, created_at, updated_at
    ) VALUES (
        auth.uid(), p_product_id, v_product_title, v_price - p_points_use, p_points_use, 'cash', 'pending',
        p_payer_name, p_cash_receipt_type, p_cash_receipt_value, p_note, 
        v_ticket_qty, v_class_type, NOW(), NOW()
    ) RETURNING id INTO v_purchase_id;

    -- 3. 포인트 차감 (사용했다면 즉시 차감)
    IF p_points_use > 0 THEN
        UPDATE user_points_stats SET balance = balance - p_points_use WHERE user_id = auth.uid();
    END IF;

    RETURN v_purchase_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. 구매 승인 함수 완벽 재정의 (product_id 기반 티켓 100% 지급)
CREATE OR REPLACE FUNCTION approve_cash_purchase(p_purchase_id UUID)
RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
    v_product_id UUID;
    v_amount INTEGER;
    v_points_used INTEGER;
    v_ticket_qty INTEGER;
    v_grade TEXT;
    v_reward_points INTEGER := 0;
BEGIN
    -- 1. 정보 조회
    SELECT user_id, product_id, amount, points_used, ticket_qty, class_type
    INTO v_user_id, v_product_id, v_amount, v_points_used, v_ticket_qty, v_grade
    FROM purchases WHERE id = p_purchase_id;

    -- (안전망: 만약 구매 기록에 개수가 빠져있다면 products 테이블에서 재조회)
    IF v_ticket_qty IS NULL OR v_grade IS NULL THEN
        SELECT class_type, ticket_qty INTO v_grade, v_ticket_qty
        FROM products 
        WHERE id = v_product_id;
    END IF;

    -- (최종 안전망)
    IF v_grade IS NULL THEN v_grade := 'C'; END IF;
    IF v_ticket_qty IS NULL THEN v_ticket_qty := 1; END IF;

    -- 2. 포인트 1% 적립 로직 (순수 결제 금액의 1%)
    v_reward_points := floor(v_amount * 0.01);
    
    IF v_reward_points > 0 THEN
        UPDATE user_points_stats 
        SET balance = balance + v_reward_points,
            earned_total = earned_total + v_reward_points
        WHERE user_id = v_user_id;

        -- 포인트 적립 내역 장부 기록
        INSERT INTO student_point_ledger (user_id, delta, reason, ref_table, ref_id)
        VALUES (v_user_id, v_reward_points, 'purchase_reward', 'purchases', p_purchase_id);
    END IF;

    -- 3. 티켓 지급 (NULL 방지 처리 완벽 적용)
    INSERT INTO ticket_balances (user_id, class_type, balance) 
    VALUES (v_user_id, v_grade, v_ticket_qty)
    ON CONFLICT (user_id, class_type) DO UPDATE SET balance = COALESCE(ticket_balances.balance, 0) + v_ticket_qty;

    -- 티켓 충전 내역 장부 기록
    INSERT INTO ticket_ledger (user_id, class_type, delta, reason, ref_table, ref_id)
    VALUES (v_user_id, v_grade, v_ticket_qty, 'ticket_purchase', 'purchases', p_purchase_id);

    -- 4. 상태 변경
    UPDATE purchases SET status = 'completed', updated_at = NOW() WHERE id = p_purchase_id;


    -- 5. Notification (알림 발송 - 포인트 적립 안내 포함)
    INSERT INTO notifications (user_id, type, title, content)
    VALUES (v_user_id, 'payment', v_grade || ' GRADE TICKET ISSUED', 
            v_grade || ' GRADE 티켓 ' || v_ticket_qty || '회가 지급되었습니다. (보너스 ' || v_reward_points || 'P 적립 완료) 지금 COACH MATCHING을 시작해보세요!');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

