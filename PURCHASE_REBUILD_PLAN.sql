-- =========================================================================
-- [무결성 결제/티켓 아키텍처 재건축 스크립트]
-- * 경고: 실행 시 기존 결제/요청 내역이 초기화됩니다. (유저/티켓 잔액은 유지됨)
-- =========================================================================

-- 1. 결제 데이터 초기화 (오작동 데이터 클렌징)
TRUNCATE TABLE purchases CASCADE;
TRUNCATE TABLE shop_purchase_requests CASCADE;

-- 2. 테이블 구조 개선 (상품 고유 ID 연결 고리 추가)
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL;
ALTER TABLE shop_purchase_requests ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES shop_products(id) ON DELETE SET NULL;

-- 3. 구매 요청 생성 함수 완벽 재정의 (product_id로 데이터 자동 완성)
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
BEGIN
    -- 1. 상품 정보 조회 (보안/오류 방지)
    SELECT price, name INTO v_price, v_product_title
    FROM products WHERE id = p_product_id;

    IF v_price IS NULL THEN
        RAISE EXCEPTION '상품 정보를 찾을 수 없습니다. (ID: %)', p_product_id;
    END IF;
    
    -- 2. purchases 테이블에 기록 (product_id 및 product_title 모두 저장)
    INSERT INTO purchases (
        user_id, product_id, product_title, amount, points_used, method, status, 
        payer_name, cash_receipt_type, cash_receipt_value, note, created_at, updated_at
    ) VALUES (
        auth.uid(), p_product_id, v_product_title, v_price - p_points_use, p_points_use, 'cash', 'pending',
        p_payer_name, p_cash_receipt_type, p_cash_receipt_value, p_note, NOW(), NOW()
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
    SELECT user_id, product_id, amount, points_used 
    INTO v_user_id, v_product_id, v_amount, v_points_used
    FROM purchases WHERE id = p_purchase_id;

    -- 2. 실제 상품 정보 조회 (문자열 파싱 없이 product_id 기반으로 정확도 100%)
    SELECT class_type, ticket_qty INTO v_grade, v_ticket_qty
    FROM products 
    WHERE id = v_product_id;

    -- (안전망: 만약 product_id가 유실되었다면 기본값 지급)
    IF v_grade IS NULL THEN
        v_grade := 'C';
        v_ticket_qty := 1;
    END IF;

    -- 3. 포인트 1% 적립 로직 (순수 결제 금액의 1%)
    v_reward_points := floor(v_amount * 0.01);
    
    IF v_reward_points > 0 THEN
        UPDATE user_points_stats 
        SET balance = balance + v_reward_points,
            earned_total = earned_total + v_reward_points
        WHERE user_id = v_user_id;
    END IF;

    -- 4. 티켓 지급
    INSERT INTO ticket_balances (user_id, class_type, balance) 
    VALUES (v_user_id, v_grade, v_ticket_qty)
    ON CONFLICT (user_id, class_type) DO UPDATE SET balance = ticket_balances.balance + v_ticket_qty;

    -- 5. 상태 변경
    UPDATE purchases SET status = 'completed', updated_at = NOW() WHERE id = p_purchase_id;

    -- 6. Notification (알림 발송 - 포인트 적립 안내 포함)
    INSERT INTO notifications (user_id, type, title, content)
    VALUES (v_user_id, 'payment', v_grade || ' GRADE TICKET ISSUED', 
            v_grade || ' GRADE 티켓 ' || v_ticket_qty || '회가 지급되었습니다. (보너스 ' || v_reward_points || 'P 적립 완료) 지금 COACH MATCHING을 시작해보세요!');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

