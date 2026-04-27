-- 글로벌 수업 신청 및 매칭 시스템을 위한 최종 스키마 업데이트
ALTER TABLE match_rooms ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT 'KR';
ALTER TABLE class_requests ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT 'KR';
ALTER TABLE class_requests ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Seoul';

-- 수업 신청 RPC 함수 업데이트 (v3)
CREATE OR REPLACE FUNCTION request_class_v2(
    p_class_type TEXT,
    p_requested_start TIMESTAMP WITH TIME ZONE,
    p_duration_min INTEGER,
    p_address TEXT,
    p_note TEXT,
    p_ticket_cost INTEGER,
    p_region_id UUID,
    p_coach_id UUID DEFAULT NULL,
    p_lat DOUBLE PRECISION DEFAULT NULL,
    p_lng DOUBLE PRECISION DEFAULT NULL,
    p_country_code TEXT DEFAULT 'KR',
    p_timezone TEXT DEFAULT 'Asia/Seoul'
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

    -- 4. 수업 신청 데이터 생성 (국가 정보 포함)
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
        country_code,
        timezone,
        created_at
    ) VALUES (
        v_student_id,
        p_coach_id,
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
        p_country_code,
        p_timezone,
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
