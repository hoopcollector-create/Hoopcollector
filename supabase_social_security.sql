-- 소셜 시스템 보안 (RLS) 강화 스크립트

-- 1. RLS 활성화
ALTER TABLE public.match_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_comments ENABLE ROW LEVEL SECURITY;

-- 2. match_likes 정책
-- [조회] 누구나 가능
DROP POLICY IF EXISTS "Anyone can view likes" ON public.match_likes;
CREATE POLICY "Anyone can view likes" ON public.match_likes FOR SELECT USING (true);

-- [추가] 로그인한 사용자만 (본인 ID로만)
DROP POLICY IF EXISTS "Authenticated users can like" ON public.match_likes;
CREATE POLICY "Authenticated users can like" ON public.match_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- [삭제] 본인이 누른 좋아요만
DROP POLICY IF EXISTS "Users can remove their own likes" ON public.match_likes;
CREATE POLICY "Users can remove their own likes" ON public.match_likes FOR DELETE USING (auth.uid() = user_id);


-- 3. match_comments 정책
-- [조회] 누구나 가능
DROP POLICY IF EXISTS "Anyone can view comments" ON public.match_comments;
CREATE POLICY "Anyone can view comments" ON public.match_comments FOR SELECT USING (true);

-- [추가] 로그인한 사용자만 (본인 ID로만)
DROP POLICY IF EXISTS "Authenticated users can comment" ON public.match_comments;
CREATE POLICY "Authenticated users can comment" ON public.match_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- [수정] 본인 댓글만
DROP POLICY IF EXISTS "Users can update their own comments" ON public.match_comments;
CREATE POLICY "Users can update their own comments" ON public.match_comments FOR UPDATE USING (auth.uid() = user_id);

-- [삭제] 본인 댓글만
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.match_comments;
CREATE POLICY "Users can delete their own comments" ON public.match_comments FOR DELETE USING (auth.uid() = user_id);

-- 4. 관리자(Admin)는 모든 권한을 가짐 (필요 시)
-- (생략 가능하나, 관리 시스템 구축 시 유용함)
