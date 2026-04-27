-- 훕콜렉터 레벨링 시스템 (XP) 데이터베이스 구축

-- 1. 유저 포인트/경험치 테이블 확장
ALTER TABLE public.user_points_stats ADD COLUMN IF NOT EXISTS xp_total INTEGER DEFAULT 0;
ALTER TABLE public.user_points_stats ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;

-- 2. 경험치를 기반으로 레벨을 계산하는 함수 (루트 함수를 이용한 레벨링 곡선)
-- 레벨 1: 0 XP
-- 레벨 2: 100 XP
-- 레벨 3: 400 XP
-- 레벨 4: 900 XP ... (Level = sqrt(XP/100) + 1)
CREATE OR REPLACE FUNCTION public.calculate_level(p_xp INTEGER)
RETURNS INTEGER AS $$
BEGIN
    RETURN FLOOR(SQRT(p_xp / 100.0)) + 1;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. XP 추가 및 레벨 자동 업데이트 함수
CREATE OR REPLACE FUNCTION public.add_user_xp(p_user_id UUID, p_amount INTEGER)
RETURNS VOID AS $$
DECLARE
    v_current_xp INTEGER;
    v_new_xp INTEGER;
    v_new_level INTEGER;
BEGIN
    -- 현재 XP 조회
    SELECT xp_total INTO v_current_xp FROM public.user_points_stats WHERE user_id = p_user_id;
    
    v_new_xp := v_current_xp + p_amount;
    v_new_level := public.calculate_level(v_new_xp);
    
    UPDATE public.user_points_stats 
    SET xp_total = v_new_xp,
        level = v_new_level,
        tier = CASE 
            WHEN v_new_level >= 91 THEN 'LEGEND'
            WHEN v_new_level >= 61 THEN 'MVP'
            WHEN v_new_level >= 31 THEN 'ALL-STAR'
            WHEN v_new_level >= 11 THEN 'PRO'
            ELSE 'ROOKIE'
        END
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 소셜 활동 트리거에 XP 연동
-- 댓글 작성 시 XP 지급
CREATE OR REPLACE FUNCTION public.handle_match_comment_v2()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.match_rooms SET comments_count = comments_count + 1 WHERE id = NEW.match_id;
    
    -- 댓글 작성자에게 10 XP 지급 (보상 횟수 제한 로직 포함 가능)
    PERFORM public.add_user_xp(NEW.user_id, 10);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 좋아요 시 XP 지급
CREATE OR REPLACE FUNCTION public.handle_match_like_v2()
RETURNS TRIGGER AS $$
DECLARE
    v_host_id UUID;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.match_rooms SET likes_count = likes_count + 1 WHERE id = NEW.match_id;
        
        -- 방장 정보 조회
        SELECT host_id INTO v_host_id FROM public.match_rooms WHERE id = NEW.match_id;
        
        -- 좋아요를 받은 사람(방장)에게 20 XP 지급
        IF v_host_id != NEW.user_id THEN
            PERFORM public.add_user_xp(v_host_id, 20);
            -- 좋아요를 누른 사람에게도 감사의 5 XP 지급
            PERFORM public.add_user_xp(NEW.user_id, 5);
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.match_rooms SET likes_count = likes_count - 1 WHERE id = OLD.match_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 기존 트리거 교체
DROP TRIGGER IF EXISTS trg_match_comment ON public.match_comments;
CREATE TRIGGER trg_match_comment
AFTER INSERT ON public.match_comments
FOR EACH ROW EXECUTE FUNCTION public.handle_match_comment_v2();

DROP TRIGGER IF EXISTS trg_match_like ON public.match_likes;
CREATE TRIGGER trg_match_like
AFTER INSERT OR DELETE ON public.match_likes
FOR EACH ROW EXECUTE FUNCTION public.handle_match_like_v2();
