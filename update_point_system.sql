-- 훕콜렉터: 보상 체계 고도화 (1P = 1원 / 1% 적립 / 보너스 포인트) SQL

-- 1. QR 출석 보상 수정 (100P -> 200P)
CREATE OR REPLACE FUNCTION award_attendance_points()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.scanned_at IS NOT NULL AND OLD.scanned_at IS NULL) THEN
        -- 학생에게 200포인트(원) 지급
        UPDATE profiles 
        SET total_tokens = total_tokens + 200,
            activity_score = activity_score + 20
        WHERE id = (SELECT student_id FROM class_requests WHERE id = NEW.class_request_id);
        
        -- 알림 생성
        INSERT INTO notifications (user_id, type, title, content)
        VALUES (
            (SELECT student_id FROM class_requests WHERE id = NEW.class_request_id),
            'system',
            '출석 보상 포인트 지급',
            '수업 출석이 확인되어 200포인트가 적립되었습니다!'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. 수업 일지 작성 보상 (500P)
CREATE OR REPLACE FUNCTION award_journal_points()
RETURNS TRIGGER AS $$
BEGIN
    -- 일지 생성 시 학생에게 500포인트 보너스 지급
    UPDATE profiles 
    SET total_tokens = total_tokens + 500,
        activity_score = activity_score + 50
    WHERE id = NEW.student_id;
    
    -- 알림 생성
    INSERT INTO notifications (user_id, type, title, content)
    VALUES (
        NEW.student_id,
        'system',
        '수업 일지 완료 보너스',
        '코치가 수업 일지를 작성했습니다! 500포인트 보너스가 지급되었습니다.'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_award_journal_points ON public.class_journals;
CREATE TRIGGER tr_award_journal_points
AFTER INSERT ON public.class_journals
FOR EACH ROW EXECUTE FUNCTION award_journal_points();

-- 3. 쇼핑몰 결제 적립 (실제 입금액의 1%)
CREATE OR REPLACE FUNCTION award_shop_points()
RETURNS TRIGGER AS $$
DECLARE
    reward_amount INTEGER;
BEGIN
    -- 결제 상태가 'paid'로 변경될 때만 지급
    IF (NEW.status = 'paid' AND OLD.status != 'paid') THEN
        -- 실제 현금 입금액(cash_amount)의 1% 계산 (소수점 버림)
        reward_amount := FLOOR(NEW.cash_amount * 0.01);
        
        IF (reward_amount > 0) THEN
            UPDATE profiles 
            SET total_tokens = total_tokens + reward_amount
            WHERE id = NEW.user_id;
            
            -- 알림 생성
            INSERT INTO notifications (user_id, type, title, content)
            VALUES (
                NEW.user_id,
                'system',
                '쇼핑몰 구매 적립',
                '구매 확정으로 인해 결제 금액의 1%인 ' || reward_amount || '포인트가 적립되었습니다!'
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_award_shop_points ON public.shop_purchase_requests;
CREATE TRIGGER tr_award_shop_points
AFTER UPDATE ON public.shop_purchase_requests
FOR EACH ROW EXECUTE FUNCTION award_shop_points();
