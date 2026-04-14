-- 훕콜렉터: 수업 일지 및 비주얼 로그 시스템 구축 SQL

-- 1. 수업 일지 테이블 생성
CREATE TABLE IF NOT EXISTS public.class_journals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.class_requests(id) ON DELETE CASCADE,
    coach_id UUID NOT NULL REFERENCES public.profiles(id),
    student_id UUID NOT NULL REFERENCES public.profiles(id),
    
    -- 코치 영역
    coach_feedback TEXT,
    coach_homework TEXT,
    visual_log_url TEXT, -- 그림 데이터(이미지) 주소
    
    -- 학생 영역
    student_evaluation TEXT,
    student_score INT CHECK (student_score BETWEEN 1 AND 5),
    
    -- 상태 및 시간
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    UNIQUE(request_id) -- 한 수업당 하나의 일지만 존재
);

-- 2. RLS 보안 정책 설정
ALTER TABLE public.class_journals ENABLE ROW LEVEL SECURITY;

-- 코치는 본인이 담당한 수업의 일지를 작성/수정/조회할 수 있음
CREATE POLICY "Coaches can manage their own journals" ON public.class_journals
    FOR ALL
    USING (auth.uid() = coach_id)
    WITH CHECK (auth.uid() = coach_id);

-- 학생은 본인의 수업 일지만 조회/수정할 수 있음
CREATE POLICY "Students can view/update their own journals" ON public.class_journals
    FOR ALL
    USING (auth.uid() = student_id)
    WITH CHECK (auth.uid() = student_id);

-- 3. 저장소(Storage) 설정 안내
-- Supabase 대시보드 Storage 탭에서 'class_visual_logs' 버킷을 생성해 주세요. (Public 체크 권장)

-- 4. 업데이트 트리거 (updated_at 자동 갱신)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_class_journals_updated_at
    BEFORE UPDATE ON public.class_journals
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

COMMENT ON TABLE public.class_journals IS '코치와 학생 간의 상호 피드백 및 그림 수업 일지를 저장하는 테이블입니다.';
