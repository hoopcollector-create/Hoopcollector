-- 훕콜렉터: 플랫폼 확장 (매칭, 알림, 그룹, QR, 정산) 통합 SQL
-- 1. 매칭 시스템 (Community Matches)
CREATE TABLE IF NOT EXISTS community_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    host_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT NOT NULL,
    match_time TIMESTAMP WITH TIME ZONE NOT NULL,
    max_players INTEGER DEFAULT 10,
    min_grade TEXT DEFAULT 'ROOKIE',
    max_grade TEXT DEFAULT 'ELITE',
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'full', 'completed', 'cancelled')),
    reward_points INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_match_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID REFERENCES community_matches(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(match_id, user_id)
);

-- 2. 그룹 시스템 (Groups)
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES profiles(id),
    name TEXT NOT NULL,
    description TEXT,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_members (
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS group_coach_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    price_offered INTEGER,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'contracted', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 알림 시스템 (Notifications)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'chat', 'class', 'match', 'system'
    title TEXT NOT NULL,
    content TEXT,
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 코치 정산 및 인증 (Coach Payouts)
CREATE TABLE IF NOT EXISTS coach_payout_info (
    coach_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    id_card_url TEXT,
    bank_book_url TEXT,
    bank_name TEXT,
    account_number TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    verified_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. QR 출석 시스템 (Attendance)
CREATE TABLE IF NOT EXISTS class_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_request_id UUID REFERENCES class_requests(id) ON DELETE CASCADE,
    qr_token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    scanned_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 프로필 확장 (Credits & Points)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS class_credits INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS activity_score INTEGER DEFAULT 0;

-- 7. RLS 보안 정책 설정
ALTER TABLE community_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_match_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_payout_info ENABLE ROW LEVEL SECURITY;

-- 공통 RLS (중복 생성 방지를 위해 DROP 후 CREATE)
DROP POLICY IF EXISTS "Public matches are viewable by everyone" ON community_matches;
CREATE POLICY "Public matches are viewable by everyone" ON community_matches FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Users can create matches" ON community_matches;
CREATE POLICY "Users can create matches" ON community_matches FOR INSERT WITH CHECK (auth.uid() = host_id);

DROP POLICY IF EXISTS "Hosts can update their matches" ON community_matches;
CREATE POLICY "Hosts can update their matches" ON community_matches FOR UPDATE USING (auth.uid() = host_id);

DROP POLICY IF EXISTS "Participants can view their status" ON community_match_participants;
CREATE POLICY "Participants can view their status" ON community_match_participants FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Users can join matches" ON community_match_participants;
CREATE POLICY "Users can join matches" ON community_match_participants FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can see their own notifications" ON notifications;
CREATE POLICY "Users can see their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their notifications" ON notifications;
CREATE POLICY "Users can update their notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Coaches can manage their payout info" ON coach_payout_info;
CREATE POLICY "Coaches can manage their payout info" ON coach_payout_info FOR ALL USING (auth.uid() = coach_id);

-- 8. 포인트 자동 지급 트리거 (예시: 출석 체크 완료 시)
CREATE OR REPLACE FUNCTION award_attendance_points()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.scanned_at IS NOT NULL AND OLD.scanned_at IS NULL) THEN
        -- 포인트 지급 로직 (class_requests의 학생에게 100포인트)
        UPDATE profiles 
        SET total_tokens = total_tokens + 100,
            activity_score = activity_score + 10
        WHERE id = (SELECT student_id FROM class_requests WHERE id = NEW.class_request_id);
        
        -- 알림 생성
        INSERT INTO notifications (user_id, type, title, content)
        VALUES (
            (SELECT student_id FROM class_requests WHERE id = NEW.class_request_id),
            'system',
            '출석 보상 포인트 지급',
            '수업 출석이 확인되어 100포인트가 적립되었습니다!'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_award_attendance_points
AFTER UPDATE ON class_attendance
FOR EACH ROW EXECUTE FUNCTION award_attendance_points();
