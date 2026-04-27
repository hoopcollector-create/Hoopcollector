-- 1. 코치 노쇼 처리를 위한 상태 업데이트 및 자동 환불/패널티 함수
CREATE OR REPLACE FUNCTION handle_coach_no_show(p_request_id UUID)
RETURNS VOID AS $$
DECLARE
    v_student_id UUID;
    v_coach_id UUID;
    v_class_type TEXT;
    v_ticket_deducted BOOLEAN;
BEGIN
    -- 수업 정보 조회
    SELECT student_id, coach_id, class_type, ticket_deducted 
    INTO v_student_id, v_coach_id, v_class_type, v_ticket_deducted
    FROM public.class_requests 
    WHERE id = p_request_id;

    -- 이미 처리된 요청인지 확인
    IF v_student_id IS NULL THEN
        RAISE EXCEPTION '해당 수업 요청을 찾을 수 없습니다.';
    END IF;

    -- 상태를 'coach_no_show'로 변경
    UPDATE public.class_requests 
    SET status = 'coach_no_show',
        updated_at = NOW()
    WHERE id = p_request_id;

    -- 2. 학생에게 티켓 환불
    IF v_ticket_deducted = TRUE THEN
        UPDATE public.ticket_balances 
        SET balance = balance + 1,
            updated_at = NOW()
        WHERE user_id = v_student_id AND class_type = v_class_type;
        
        -- 환불 완료 표시
        UPDATE public.class_requests SET ticket_deducted = FALSE WHERE id = p_request_id;
    END IF;

    -- 3. 코치에게 강력 패널티 (XP 차감 및 알림)
    IF v_coach_id IS NOT NULL THEN
        -- 코치 XP 차감 (강력 패널티 200점)
        UPDATE public.profiles 
        SET activity_score = GREATEST(0, activity_score - 200)
        WHERE id = v_coach_id;

        -- 활동 로그 기록
        INSERT INTO public.activity_logs (user_id, type, description, xp_amount)
        VALUES (v_coach_id, 'penalty', '수업 무단 불참(코치 노쇼) 패널티', -200);

        -- 코치에게 경고 알림
        INSERT INTO public.notifications (user_id, type, title, message)
        VALUES (
            v_coach_id,
            'alert',
            '⚠️ 수업 노쇼 경고 및 패널티',
            '예정된 수업에 불참하여 패널티가 적용되었습니다. 티켓은 학생에게 환불되었으며, 반복 시 활동이 제한될 수 있습니다.'
        );
    END IF;

    -- 4. 학생에게 안내 알림
    INSERT INTO public.notifications (user_id, type, title, message)
    VALUES (
        v_student_id,
        'info',
        '✅ 티켓 환불 완료',
        '코치 노쇼 신고가 접수되어 사용하신 티켓 1장이 즉시 환불되었습니다.'
    );

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
