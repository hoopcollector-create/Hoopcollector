-- 훕콜렉터 Economy 2.0: 토큰 보상 밸런스 조정 (긴급 패치)
-- 수업 한 번에 700P씩 지급되던 과도한 보상을 70P 수준으로 현실화

-- 1. QR 출석 보상 수정 (200P -> 20P)
CREATE OR REPLACE FUNCTION award_attendance_points()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.scanned_at IS NOT NULL AND OLD.scanned_at IS NULL) THEN
        -- 학생에게 20포인트(원) 지급 (현실적인 수치로 조정)
        UPDATE profiles 
        SET total_tokens = total_tokens + 20,
            activity_score = activity_score + 10
        WHERE id = (SELECT student_id FROM class_requests WHERE id = NEW.class_request_id);
        
        -- 알림 생성
        INSERT INTO notifications (user_id, type, title, content)
        VALUES (
            (SELECT student_id FROM class_requests WHERE id = NEW.class_request_id),
            'system',
            '출석 보상 포인트 지급',
            '수업 출석이 확인되어 20포인트가 적립되었습니다!'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. 수업 일지 작성 보상 수정 (500P -> 50P)
CREATE OR REPLACE FUNCTION award_journal_points()
RETURNS TRIGGER AS $$
BEGIN
    -- 일지 생성 시 학생에게 50포인트 보너스 지급
    UPDATE profiles 
    SET total_tokens = total_tokens + 50,
        activity_score = activity_score + 20
    WHERE id = NEW.student_id;
    
    -- 알림 생성
    INSERT INTO notifications (user_id, type, title, content)
    VALUES (
        NEW.student_id,
        'system',
        '수업 일지 완료 보너스',
        '코치가 수업 일지를 작성했습니다! 50포인트 보너스가 지급되었습니다.'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. 승급 공식 최종 강화 (XP 시스템과 연동)
-- Level = sqrt(XP / 250) + 1 공식을 다시 한번 확인 적용
CREATE OR REPLACE FUNCTION public.calculate_level(p_xp INTEGER)
RETURNS INTEGER AS $$
BEGIN
    RETURN FLOOR(SQRT(p_xp / 250.0)) + 1;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
