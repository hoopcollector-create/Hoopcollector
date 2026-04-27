-- 훕콜렉터 핵심 테이블 전면 RLS(Row Level Security) 적용 및 보안 강화

-- 1. 프로필 (profiles)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. 유저 포인트 및 등급 (user_points_stats)
-- 매우 중요: 포인트는 유저가 API로 직접 수정할 수 없어야 함 (트리거나 서버 권한으로만 수정)
ALTER TABLE public.user_points_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view points stats" ON public.user_points_stats;
CREATE POLICY "Anyone can view points stats" ON public.user_points_stats FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users cannot update points directly" ON public.user_points_stats;
-- 의도적으로 UPDATE/INSERT 정책을 생성하지 않아, 일반 유저의 API 수정 원천 차단 (DB 트리거는 RLS 무시하므로 정상 작동)

-- 3. 매치 룸 (match_rooms)
ALTER TABLE public.match_rooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Match rooms are viewable by everyone" ON public.match_rooms;
CREATE POLICY "Match rooms are viewable by everyone" ON public.match_rooms FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can create match rooms" ON public.match_rooms;
CREATE POLICY "Authenticated users can create match rooms" ON public.match_rooms FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Host can update their match room" ON public.match_rooms;
CREATE POLICY "Host can update their match room" ON public.match_rooms FOR UPDATE USING (auth.uid() = host_id);
DROP POLICY IF EXISTS "Host can delete their match room" ON public.match_rooms;
CREATE POLICY "Host can delete their match room" ON public.match_rooms FOR DELETE USING (auth.uid() = host_id);

-- 4. 매치 참여자 (match_participants)
ALTER TABLE public.match_participants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Participants are viewable by everyone" ON public.match_participants;
CREATE POLICY "Participants are viewable by everyone" ON public.match_participants FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can join matches" ON public.match_participants;
CREATE POLICY "Users can join matches" ON public.match_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can leave or host can remove" ON public.match_participants;
-- 본인이거나 방장인 경우에만 삭제(퇴장/강퇴) 가능
CREATE POLICY "Users can leave or host can remove" ON public.match_participants FOR DELETE 
USING (auth.uid() = user_id OR auth.uid() IN (SELECT host_id FROM public.match_rooms WHERE id = match_id));

-- 5. 정기 매치 템플릿 (match_templates)
ALTER TABLE public.match_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Templates are viewable by everyone" ON public.match_templates;
CREATE POLICY "Templates are viewable by everyone" ON public.match_templates FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can create templates" ON public.match_templates;
CREATE POLICY "Users can create templates" ON public.match_templates FOR INSERT WITH CHECK (auth.uid() = host_id);
DROP POLICY IF EXISTS "Host can update templates" ON public.match_templates;
CREATE POLICY "Host can update templates" ON public.match_templates FOR UPDATE USING (auth.uid() = host_id);
