-- 매치 생성 시 방장을 자동으로 참여자에 추가하는 트리거
CREATE OR REPLACE FUNCTION public.add_host_to_participants()
RETURNS TRIGGER AS $$
BEGIN
    -- 방장을 참여자 명단에 추가 (host 역할)
    INSERT INTO public.match_participants (match_id, user_id, role, status)
    VALUES (NEW.id, NEW.host_id, 'host', 'joined')
    ON CONFLICT (match_id, user_id) DO NOTHING;
    
    -- 해당 방의 현재 인원수를 1로 초기화
    UPDATE public.match_rooms 
    SET current_players = 1 
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 설정
DROP TRIGGER IF EXISTS trg_add_host_to_participants ON public.match_rooms;
CREATE TRIGGER trg_add_host_to_participants
AFTER INSERT ON public.match_rooms
FOR EACH ROW
EXECUTE FUNCTION public.add_host_to_participants();
