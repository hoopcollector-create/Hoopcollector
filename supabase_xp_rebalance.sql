-- Hoopcollector Economy & Leveling 2.0 밸런스 패치
-- 목표: 수업 약 15회 내외에서 주요 승급이 일어나도록 난이도 조정

-- 1. 승급 공식 강화 (난이도 2.5배 상향)
-- 기존 100 기준에서 250으로 변경하여 레벨업에 필요한 XP 요구량을 늘림
CREATE OR REPLACE FUNCTION public.calculate_level(p_xp INTEGER)
RETURNS INTEGER AS $$
BEGIN
    -- Level 1: 0 XP
    -- Level 2: 250 XP (수업 약 4회)
    -- Level 3: 1000 XP (수업 약 15회)
    -- Level 4: 2250 XP ...
    RETURN FLOOR(SQRT(p_xp / 250.0)) + 1;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. 수업 완료 시 보상 지급 트리거 함수 생성
-- 수업 일지(class_journals)가 생성될 때 학생에게 XP 지급
CREATE OR REPLACE FUNCTION public.handle_class_reward()
RETURNS TRIGGER AS $$
BEGIN
    -- 수업 완료 시 보상을 70 XP로 고정 (기존 과도한 보상 방지)
    -- 약 15번 수업 시 레벨 3(1000 XP) 도달 목표
    PERFORM public.add_user_xp(NEW.student_id, 70);
    
    -- 활동 로그 기록
    INSERT INTO public.activity_logs (user_id, type, description, xp_amount)
    VALUES (NEW.student_id, 'class_complete', '수업 완료 보상 획득', 70);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 트리거 등록
DROP TRIGGER IF EXISTS trg_class_reward ON public.class_journals;
CREATE TRIGGER trg_class_reward
AFTER INSERT ON public.class_journals
FOR EACH ROW EXECUTE FUNCTION public.handle_class_reward();

-- 4. 소셜 활동 보상 미세 조정 (비중 축소)
-- 커뮤니티 활동보다 수업 참여의 가치를 높게 유지
CREATE OR REPLACE FUNCTION public.handle_match_comment_v2()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.match_rooms SET comments_count = comments_count + 1 WHERE id = NEW.match_id;
    -- 댓글 10 XP -> 5 XP로 하향
    PERFORM public.add_user_xp(NEW.user_id, 5);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_match_like_v2()
RETURNS TRIGGER AS $$
DECLARE
    v_host_id UUID;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.match_rooms SET likes_count = likes_count + 1 WHERE id = NEW.match_id;
        SELECT host_id INTO v_host_id FROM public.match_rooms WHERE id = NEW.match_id;
        
        IF v_host_id != NEW.user_id THEN
            -- 좋아요 보상 20 XP -> 10 XP로 하향
            PERFORM public.add_user_xp(v_host_id, 10);
            -- 누른 사람 보너스 제거 (스팸 방지)
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.match_rooms SET likes_count = likes_count - 1 WHERE id = OLD.match_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 매치 개설 보상 조정
CREATE OR REPLACE FUNCTION public.add_host_to_participants()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.match_participants (match_id, user_id, role, status)
    VALUES (NEW.id, NEW.host_id, 'host', 'joined')
    ON CONFLICT (match_id, user_id) DO NOTHING;
    
    UPDATE public.match_rooms SET current_players = 1 WHERE id = NEW.id;
    
    -- 매치 개설 보상 100 XP -> 50 XP로 하향
    PERFORM public.add_user_xp(NEW.host_id, 50);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
