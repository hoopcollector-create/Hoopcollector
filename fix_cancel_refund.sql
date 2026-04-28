-- [상호 합의 취소 시스템] 24시간 정책 + 코치 취소 시 학생 승인 절차 반영

-- 1. 취소 요청 RPC: 코치가 호출
CREATE OR REPLACE FUNCTION request_mutual_cancel(p_request_id UUID, p_reason TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_coach_id UUID;
    v_student_id UUID;
    v_status TEXT;
BEGIN
    SELECT coach_id, student_id, status INTO v_coach_id, v_student_id, v_status
    FROM public.class_requests WHERE id = p_request_id;

    -- 검증
    IF auth.uid() != v_coach_id THEN RAISE EXCEPTION '권한이 없습니다.'; END IF;
    IF v_status != 'accepted' THEN RAISE EXCEPTION '취소 요청이 가능한 상태가 아닙니다.'; END IF;

    -- 상태 변경 및 사유 기록
    UPDATE public.class_requests 
    SET status = 'cancel_requested', 
        cancel_requested_by = auth.uid(),
        cancel_reason = p_reason,
        updated_at = NOW()
    WHERE id = p_request_id;

    -- 학생에게 알림
    INSERT INTO public.notifications (user_id, type, title, message)
    VALUES (v_student_id, 'alert', '❓ 코치님의 수업 취소 요청', '코치님이 부득이한 사정(' || p_reason || ')으로 수업 취소를 요청했습니다. 승인 여부를 선택해 주세요.');
END;
$$;

-- 2. 취소 승인/거절 RPC: 학생이 호출
CREATE OR REPLACE FUNCTION confirm_mutual_cancel(p_request_id UUID, p_action TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_student_id UUID;
    v_status TEXT;
    v_ticket_cost INT := 1; -- 기본 1장 환불
BEGIN
    SELECT student_id, status INTO v_student_id, v_status
    FROM public.class_requests WHERE id = p_request_id;

    IF auth.uid() != v_student_id THEN RAISE EXCEPTION '권한이 없습니다.'; END IF;
    IF v_status != 'cancel_requested' THEN RAISE EXCEPTION '잘못된 요청입니다.'; END IF;

    IF p_action = 'approve' THEN
        -- 승인 시: 환불 및 취소 확정
        UPDATE public.profiles SET tickets = tickets + v_ticket_cost WHERE id = v_student_id;
        
        UPDATE public.class_requests 
        SET status = 'cancelled', cancelled_at = NOW(), updated_at = NOW()
        WHERE id = p_request_id;

        INSERT INTO public.notifications (user_id, type, title, message)
        VALUES (v_student_id, 'info', '✅ 취소 승인 및 환불 완료', '수업 취소가 확정되어 티켓 1장이 환불되었습니다.');
    ELSE
        -- 거절 시: 원래 상태(accepted)로 복구
        UPDATE public.class_requests 
        SET status = 'accepted', cancel_requested_by = NULL, cancel_reason = NULL, updated_at = NOW()
        WHERE id = p_request_id;

        INSERT INTO public.notifications (user_id, type, title, message)
        VALUES (v_student_id, 'info', '❌ 취소 요청 거절', '취소 요청을 거절하셨습니다. 코치님과 채팅으로 다시 조율해 주세요.');
    END IF;
END;
$$;

-- 3. 기존 학생 직접 취소 함수 (24시간 정책 유지)
CREATE OR REPLACE FUNCTION cancel_class_request(p_request_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_student_id UUID;
    v_status TEXT;
    v_requested_start TIMESTAMPTZ;
    v_ticket_cost INT := 1;
BEGIN
    SELECT student_id, status, requested_start INTO v_student_id, v_status, v_requested_start
    FROM public.class_requests WHERE id = p_request_id;

    IF auth.uid() != v_student_id THEN RAISE EXCEPTION '권한이 없습니다.'; END IF;
    IF v_status NOT IN ('requested', 'accepted') THEN RAISE EXCEPTION '취소 불가능한 상태입니다.'; END IF;

    IF v_requested_start - NOW() > INTERVAL '24 hours' THEN
        -- 24시간 전: 환불
        UPDATE public.profiles SET tickets = tickets + v_ticket_cost WHERE id = v_student_id;
        UPDATE public.class_requests SET status = 'cancelled', cancelled_at = NOW(), updated_at = NOW() WHERE id = p_request_id;
    ELSE
        -- 24시간 이내: 환불 없음
        UPDATE public.class_requests SET status = 'cancelled', cancelled_at = NOW(), updated_at = NOW() WHERE id = p_request_id;
    END IF;
END;
$$;
