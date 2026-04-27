-- 커뮤니티 활동의 현금성 포인트 보상을 제거하고 XP로 전면 전환하는 보안 업데이트

-- 1. 댓글 보상 로직 수정 (포인트 제거, XP만 유지)
CREATE OR REPLACE FUNCTION public.handle_match_comment_v2()
RETURNS TRIGGER AS $$
BEGIN
    -- 댓글 수 카운트 업데이트
    UPDATE public.match_rooms SET comments_count = comments_count + 1 WHERE id = NEW.match_id;
    
    -- 포인트 지급 로직을 삭제하고 경험치(XP)만 지급
    PERFORM public.add_user_xp(NEW.user_id, 10);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 좋아요 보상 로직 수정 (포인트 제거, XP만 유지)
CREATE OR REPLACE FUNCTION public.handle_match_like_v2()
RETURNS TRIGGER AS $$
DECLARE
    v_host_id UUID;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        -- 매치룸 좋아요 카운트 증가
        UPDATE public.match_rooms SET likes_count = likes_count + 1 WHERE id = NEW.match_id;
        
        -- 방장 정보 조회
        SELECT host_id INTO v_host_id FROM public.match_rooms WHERE id = NEW.match_id;
        
        -- 자기 글 제외 보상 지급
        IF v_host_id != NEW.user_id THEN
            -- 방장(좋아요 받은 사람)에게 XP 지급 (포인트 로직 삭제)
            PERFORM public.add_user_xp(v_host_id, 20);
            -- 누른 사람에게 XP 지급
            PERFORM public.add_user_xp(NEW.user_id, 5);
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.match_rooms SET likes_count = likes_count - 1 WHERE id = OLD.match_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 매치 생성 보상 로직 수정 (포인트 제거, XP만 유지)
CREATE OR REPLACE FUNCTION public.add_host_to_participants()
RETURNS TRIGGER AS $$
BEGIN
    -- 방장을 참여자 명단에 추가
    INSERT INTO public.match_participants (match_id, user_id, role, status)
    VALUES (NEW.id, NEW.host_id, 'host', 'joined')
    ON CONFLICT (match_id, user_id) DO NOTHING;
    
    -- 현재 인원수 초기화
    UPDATE public.match_rooms SET current_players = 1 WHERE id = NEW.id;
    
    -- 매치 개설에 대한 XP만 지급 (포인트 로직 삭제)
    PERFORM public.add_user_xp(NEW.host_id, 100);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 수업 완료 및 저널 관련 보상 (포인트 제거 권장 시 실행)
-- 만약 수업 완료 시 포인트를 주던 로직이 있었다면 여기서 수정
-- (현재는 커뮤니티 활동 위주로 정리됨)
