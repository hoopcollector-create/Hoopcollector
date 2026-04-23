-- [cancel_class_request] 수동/자동 취소 및 티켓 환불을 통제하는 서버 함수(RPC)

CREATE OR REPLACE FUNCTION cancel_class_request(p_request_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_student_id UUID;
    v_status TEXT;
    v_class_type TEXT;
    v_ticket_cost INT;
BEGIN
    -- 1. 요청 정보 조회
    SELECT student_id, status, class_type
    INTO v_student_id, v_status, v_class_type
    FROM class_requests
    WHERE id = p_request_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Request not found';
    END IF;

    -- 2. 이미 취소됐거나 완료된 건은 무시
    IF v_status NOT IN ('requested', 'accepted') THEN
        RAISE EXCEPTION 'Cannot cancel request with status %', v_status;
    END IF;

    -- 3. 수업 타입별 차감된 티켓 개수 계산 (원복용)
    IF v_class_type = 'open' THEN 
        v_ticket_cost := 1;
    ELSIF v_class_type IN ('single', 'group') THEN 
        v_ticket_cost := 2;
    ELSIF v_class_type = 'package' THEN 
        v_ticket_cost := 20;
    ELSE 
        v_ticket_cost := 1;
    END IF;

    -- 4. 요청 상태를 '취소됨'으로 변경
    UPDATE class_requests 
    SET status = 'cancelled', cancelled_at = NOW()
    WHERE id = p_request_id;

    -- 5. 학생에게 티켓 전액 환불
    UPDATE profiles
    SET tickets = tickets + v_ticket_cost
    WHERE id = v_student_id;

END;
$$;
