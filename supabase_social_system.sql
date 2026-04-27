-- 매치 좋아요 테이블
CREATE TABLE IF NOT EXISTS public.match_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    match_id UUID REFERENCES public.match_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(match_id, user_id)
);

-- 매치 댓글 테이블
CREATE TABLE IF NOT EXISTS public.match_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    match_id UUID REFERENCES public.match_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 좋아요 수 및 댓글 수 카운트를 위한 컬럼 추가 (성능 최적화)
ALTER TABLE public.match_rooms ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
ALTER TABLE public.match_rooms ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;

-- 좋아요 시 포인트 지급 및 카운트 업데이트 트리거
CREATE OR REPLACE FUNCTION public.handle_match_like()
RETURNS TRIGGER AS $$
DECLARE
    v_host_id UUID;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        -- 카운트 증가
        UPDATE public.match_rooms SET likes_count = likes_count + 1 WHERE id = NEW.match_id;
        
        -- 방장에게 포인트 지급 (좋아요 1개당 10포인트)
        SELECT host_id INTO v_host_id FROM public.match_rooms WHERE id = NEW.match_id;
        IF v_host_id != NEW.user_id THEN -- 자기 글에 자기가 좋아요 누른 건 제외
            UPDATE public.user_points_stats 
            SET balance = balance + 10 
            WHERE user_id = v_host_id;
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        -- 카운트 감소
        UPDATE public.match_rooms SET likes_count = likes_count - 1 WHERE id = OLD.match_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_match_like
AFTER INSERT OR DELETE ON public.match_likes
FOR EACH ROW EXECUTE FUNCTION public.handle_match_like();

-- 댓글 작성 시 포인트 지급 트리거
CREATE OR REPLACE FUNCTION public.handle_match_comment()
RETURNS TRIGGER AS $$
BEGIN
    -- 카운트 증가
    UPDATE public.match_rooms SET comments_count = comments_count + 1 WHERE id = NEW.match_id;
    
    -- 댓글 작성자에게 포인트 지급 (일일 최대 5회 제한 등은 별도 로직 권장)
    -- 여기서는 단순하게 작성 시 5포인트 지급
    UPDATE public.user_points_stats 
    SET balance = balance + 5 
    WHERE user_id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_match_comment
AFTER INSERT ON public.match_comments
FOR EACH ROW EXECUTE FUNCTION public.handle_match_comment();
