-- 수업 신청 시스템 통합을 위한 RPC 함수 고도화 (v2)
-- 7가지 필수 정보 및 코치 지정을 모두 처리합니다.

CREATE OR REPLACE FUNCTION request_class_v2(
    p_class_type TEXT,
    p_requested_start TIMESTAMP WITH TIME ZONE,
    p_duration_min INTEGER,
    p_address TEXT,
    p_note TEXT,
    p_ticket_cost INTEGER,
    p_region_id UUID,
    p_coach_id UUID DEFAULT NULL, -- 지목 수업인 경우 코치 ID, 일반 신청은 NULL
    p_lat DOUBLE PRECISION DEFAULT NULL,
    p_lng DOUBLE PRECISION DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    v_student_id UUID;
    v_balance INTEGER;
BEGIN
    -- 1. 사용자 인증 확인
    v_student_id := auth.uid();
    IF v_student_id IS NULL THEN
        RAISE EXCEPTION '로그인이 필요합니다.';
    END IF;

    -- 2. 티켓 잔액 확인
    SELECT balance INTO v_balance 
    FROM ticket_balances 
    WHERE user_id = v_student_id AND class_type = p_class_type;

    IF v_balance IS NULL OR v_balance < p_ticket_cost THEN
        RAISE EXCEPTION '티켓이 부족합니다.';
    END IF;

    -- 3. 티켓 차감
    UPDATE ticket_balances 
    SET balance = balance - p_ticket_cost,
        updated_at = NOW()
    WHERE user_id = v_student_id AND class_type = p_class_type;

    -- 4. 수업 신청 데이터 생성
    INSERT INTO class_requests (
        student_id,
        coach_id,
        class_type,
        requested_start,
        duration_min,
        address,
        lat,
        lng,
        note,
        status,
        ticket_deducted,
        region_id,
        created_at
    ) VALUES (
        v_student_id,
        p_coach_id, -- 지목 코치 (없으면 NULL)
        p_class_type,
        p_requested_start,
        p_duration_min,
        p_address,
        p_lat,
        p_lng,
        p_note,
        'requested',
        TRUE,
        p_region_id,
        NOW()
    );

    -- 5. 지목 수업인 경우 코치에게 알림 생성
    IF p_coach_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, type, title, content)
        VALUES (
            p_coach_id,
            'class',
            '새로운 지목 예약 신청',
            '학생으로부터 지정 예약 신청이 도착했습니다. 내역을 확인해 주세요.'
        );
    END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
