-- 일일 보상 제한이 적용된 고도화된 소셜 시스템

-- 1. 댓글 보수 트리거 (일일 5회 제한)
CREATE OR REPLACE FUNCTION public.handle_match_comment()
RETURNS TRIGGER AS $$
DECLARE
    v_daily_count INTEGER;
BEGIN
    -- 댓글 수 카운트 업데이트
    UPDATE public.match_rooms SET comments_count = comments_count + 1 WHERE id = NEW.match_id;
    
    -- 사용자의 오늘 댓글 작성 횟수 조회
    SELECT COUNT(*) INTO v_daily_count 
    FROM public.match_comments 
    WHERE user_id = NEW.user_id AND created_at >= CURRENT_DATE;
    
    -- 5회 이하일 때만 보상 지급
    IF v_daily_count <= 5 THEN
        UPDATE public.user_points_stats 
        SET balance = balance + 5 
        WHERE user_id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 좋아요 보상 트리거 (작성자 기준 일일 10회 제한)
CREATE OR REPLACE FUNCTION public.handle_match_like()
RETURNS TRIGGER AS $$
DECLARE
    v_host_id UUID;
    v_host_daily_likes INTEGER;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        -- 매치룸 좋아요 카운트 증가
        UPDATE public.match_rooms SET likes_count = likes_count + 1 WHERE id = NEW.match_id;
        
        -- 방장 정보 및 오늘 받은 좋아요 수 확인
        SELECT host_id INTO v_host_id FROM public.match_rooms WHERE id = NEW.match_id;
        
        -- 자기 글 제외
        IF v_host_id != NEW.user_id THEN
            -- 방장이 오늘 받은 좋아요 보상 횟수 (예시로 match_likes 전체에서 해당 호스트의 글에 달린 오늘자 좋아요 합산)
            SELECT COUNT(*) INTO v_host_daily_likes
            FROM public.match_likes ml
            JOIN public.match_rooms mr ON ml.match_id = mr.id
            WHERE mr.host_id = v_host_id AND ml.created_at >= CURRENT_DATE;

            -- 방장이 오늘 받은 좋아요 보상이 10회 미만일 때만 지급
            IF v_host_daily_likes <= 10 THEN
                UPDATE public.user_points_stats 
                SET balance = balance + 10 
                WHERE user_id = v_host_id;
            END IF;
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.match_rooms SET likes_count = likes_count - 1 WHERE id = OLD.match_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 재등록 (기존 트리거가 있다면 덮어씌워짐)
DROP TRIGGER IF EXISTS trg_match_like ON public.match_likes;
CREATE TRIGGER trg_match_like
AFTER INSERT OR DELETE ON public.match_likes
FOR EACH ROW EXECUTE FUNCTION public.handle_match_like();

DROP TRIGGER IF EXISTS trg_match_comment ON public.match_comments;
CREATE TRIGGER trg_match_comment
AFTER INSERT ON public.match_comments
FOR EACH ROW EXECUTE FUNCTION public.handle_match_comment();
