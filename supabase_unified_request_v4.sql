-- 훕콜렉터: 레벨 인증 신청을 지원하는 수업 신청 RPC v4

CREATE OR REPLACE FUNCTION public.request_class_v4(
    p_class_type text,
    p_requested_start timestamp with time zone,
    p_duration_min integer,
    p_address text,
    p_note text,
    p_ticket_cost integer,
    p_region_id uuid,
    p_coach_id uuid DEFAULT NULL,
    p_lat double precision DEFAULT NULL,
    p_lng double precision DEFAULT NULL,
    p_country_code text DEFAULT 'KR',
    p_timezone text DEFAULT 'Asia/Seoul',
    p_is_certification boolean DEFAULT FALSE -- 신규 파라미터
)
RETURNS uuid AS $$
DECLARE
    v_student_id uuid;
    v_request_id uuid;
BEGIN
    -- 1. 현재 사용자(학생) ID 가져오기
    v_student_id := auth.uid();
    IF v_student_id IS NULL THEN
        RAISE EXCEPTION '로그인이 필요합니다.';
    END IF;

    -- 2. 티켓 잔액 확인
    IF NOT EXISTS (
        SELECT 1 FROM public.ticket_balances 
        WHERE user_id = v_student_id AND class_type = p_class_type AND balance >= p_ticket_cost
    ) THEN
        RAISE EXCEPTION '해당 클래스의 티켓이 부족합니다.';
    END IF;

    -- 3. 티켓 차감
    UPDATE public.ticket_balances 
    SET balance = balance - p_ticket_cost, updated_at = now()
    WHERE user_id = v_student_id AND class_type = p_class_type;

    -- 4. 수업 신청 생성
    INSERT INTO public.class_requests (
        student_id,
        coach_id,
        class_type,
        requested_start,
        duration_min,
        address,
        note,
        region_id,
        lat,
        lng,
        country_code,
        timezone,
        is_certification -- 신규 컬럼 반영
    )
    VALUES (
        v_student_id,
        p_coach_id,
        p_class_type,
        p_requested_start,
        p_duration_min,
        p_address,
        p_note,
        p_region_id,
        p_lat,
        p_lng,
        p_country_code,
        p_timezone,
        p_is_certification
    )
    RETURNING id INTO v_request_id;

    -- 5. 포인트/활동지수 차감은 결제 시스템 연동 시 처리 (현재는 티켓 기반)

    RETURN v_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
