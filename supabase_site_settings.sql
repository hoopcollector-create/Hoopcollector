-- 훕콜렉터 사이트 세팅(로고 텍스트, 설명 등) 기본 구성을 위한 테이블입니다.
-- 이 테이블이 없으면 사이트 진입시 404 에러가 발생합니다.

CREATE TABLE IF NOT EXISTS public.site_settings (
    id TEXT PRIMARY KEY DEFAULT 'main',
    title TEXT,
    description TEXT,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 보안 권한(RLS) 설정:
-- 누구나 데이터를 '읽을 수는(SELECT)' 있지만, 데이터의 '변경 및 추가(ALL)'는 관리자(인증된 유저)만 가능하도록 제한합니다.
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" 
ON public.site_settings FOR SELECT 
USING (true);

CREATE POLICY "Enable all access for authenticated users" 
ON public.site_settings FOR ALL 
USING (auth.role() = 'authenticated');

-- 초기 데이터 세팅 (메인 설정 레코드 1줄 추가)
INSERT INTO public.site_settings (id, title, description)
VALUES ('main', 'Hoopcollector', '프리미엄 농구 레슨 매칭 플랫폼')
ON CONFLICT (id) DO NOTHING;
