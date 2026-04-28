-- [ULTIMATE V2] 'column role does not exist' 에러 강제 복구 스크립트
-- 이 코드를 복사하여 Supabase -> SQL Editor에서 실행해 주세요.

-- 1. 기존 정책 및 테이블 상태 초기화 (에러 방지)
DROP POLICY IF EXISTS "Admins can upload assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update shop products" ON public.shop_products;
DROP POLICY IF EXISTS "Admins can insert shop products" ON public.shop_products;
DROP POLICY IF EXISTS "Admins can update shop variants" ON public.shop_product_variants;
DROP POLICY IF EXISTS "Admins can insert shop variants" ON public.shop_product_variants;

-- 2. user_roles 테이블 강제 생성/보완
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 3. role 컬럼 강제 추가 (이미 있으면 무시됨)
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS role_name TEXT DEFAULT 'student';

-- 4. Storage (hoop-assets) 정책 수정
CREATE POLICY "Admins can upload assets" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'hoop-assets' AND 
    (EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND (role = 'admin' OR role_name = 'admin')
    ))
);

-- 5. Shop 관련 RLS 정책 재설정
ALTER TABLE public.shop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_product_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view shop products" ON public.shop_products;
CREATE POLICY "Anyone can view shop products" ON public.shop_products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view shop variants" ON public.shop_product_variants;
CREATE POLICY "Anyone can view shop variants" ON public.shop_product_variants FOR SELECT USING (true);

-- 관리자 권한 체크 시 role과 role_name 둘 다 확인
CREATE POLICY "Admins can update shop products" ON public.shop_products
FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND (role = 'admin' OR role_name = 'admin'))
);

CREATE POLICY "Admins can insert shop products" ON public.shop_products
FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND (role = 'admin' OR role_name = 'admin'))
);

CREATE POLICY "Admins can update shop variants" ON public.shop_product_variants
FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND (role = 'admin' OR role_name = 'admin'))
);

CREATE POLICY "Admins can insert shop variants" ON public.shop_product_variants
FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND (role = 'admin' OR role_name = 'admin'))
);

-- 6. 본인 계정에 관리자 권한 부여 (필수)
-- 이 쿼리는 현재 SQL Editor를 실행하는 본인 계정을 즉시 관리자로 승격시킵니다.
INSERT INTO public.user_roles (user_id, role, role_name) 
SELECT id, 'admin', 'admin' FROM auth.users WHERE id = auth.uid()
ON CONFLICT (user_id) DO UPDATE SET role = 'admin', role_name = 'admin';
