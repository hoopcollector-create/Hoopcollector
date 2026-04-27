-- 1. 코치 자동 승인 설정 추가
ALTER TABLE public.coach_profiles ADD COLUMN IF NOT EXISTS auto_accept BOOLEAN DEFAULT FALSE;

-- 2. 매치 생성 및 참여 개수 제한 (Spam 방지)
CREATE OR REPLACE FUNCTION check_user_match_limits() 
RETURNS TRIGGER AS $$
DECLARE
    active_count INTEGER;
BEGIN
    -- 현재 활성화된(open) 매치 개수 확인
    SELECT COUNT(*) INTO active_count 
    FROM public.match_rooms 
    WHERE host_id = NEW.host_id AND status = 'open';

    IF active_count >= 5 THEN
        RAISE EXCEPTION '동시에 운영 가능한 매치는 최대 5개입니다. 기존 매치를 종료해 주세요.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_limit_match_creation ON public.match_rooms;
CREATE TRIGGER tr_limit_match_creation
BEFORE INSERT ON public.match_rooms
FOR EACH ROW EXECUTE FUNCTION check_user_match_limits();

-- 3. 수업 예약 함수 고도화 (자동 승인 로직 추가)
CREATE OR REPLACE FUNCTION request_class_v3(
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
    v_auto_accept BOOLEAN;
    v_status TEXT := 'requested';
BEGIN
    v_student_id := auth.uid();
    IF v_student_id IS NULL THEN RAISE EXCEPTION '로그인이 필요합니다.'; END IF;

    -- 티켓 확인 및 차감
    SELECT balance INTO v_balance FROM ticket_balances WHERE user_id = v_student_id AND class_type = p_class_type;
    IF v_balance IS NULL OR v_balance < p_ticket_cost THEN RAISE EXCEPTION '티켓이 부족합니다.'; END IF;
    UPDATE ticket_balances SET balance = balance - p_ticket_cost, updated_at = NOW() WHERE user_id = v_student_id AND class_type = p_class_type;

    -- 코치의 자동 승인 설정 확인
    IF p_coach_id IS NOT NULL THEN
        SELECT auto_accept INTO v_auto_accept FROM coach_profiles WHERE user_id = p_coach_id;
        IF v_auto_accept = TRUE THEN
            v_status := 'accepted'; -- 자동 승인!
        END IF;
    END IF;

    -- 수업 신청 생성
    INSERT INTO class_requests (
        student_id, coach_id, class_type, requested_start, duration_min, 
        address, lat, lng, note, status, ticket_deducted, region_id, 
        country_code, timezone, created_at
    ) VALUES (
        v_student_id, p_coach_id, p_class_type, p_requested_start, p_duration_min,
        p_address, p_lat, p_lng, p_note, v_status, TRUE, p_region_id,
        p_country_code, p_timezone, NOW()
    );

    -- 알림 발송
    IF p_coach_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, type, title, message)
        VALUES (
            p_coach_id,
            'class',
            CASE WHEN v_status = 'accepted' THEN '수업 예약 자동 승인' ELSE '새로운 수업 신청' END,
            CASE WHEN v_status = 'accepted' THEN '설정에 따라 수업이 즉시 예약되었습니다.' ELSE '학생으로부터 새로운 예약 신청이 도착했습니다.' END
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
