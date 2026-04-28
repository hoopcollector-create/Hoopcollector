-- [ULTIMATE FIX] 'column role does not exist' 에러 해결을 위한 스크립트
-- 이 코드를 복사하여 Supabase -> SQL Editor에서 실행해 주세요.

-- 1. user_roles 테이블이 있는지 확인하고 없으면 생성
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
        CREATE TABLE public.user_roles (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            role TEXT DEFAULT 'student',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id)
        );
        RAISE NOTICE 'user_roles table created.';
    ELSE
        RAISE NOTICE 'user_roles table already exists.';
    END IF;
END $$;

-- 2. role 컬럼이 있는지 확인하고 없으면 추가
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'user_roles' AND column_name = 'role'
    ) THEN
        ALTER TABLE public.user_roles ADD COLUMN role TEXT DEFAULT 'student';
        RAISE NOTICE 'role column added to user_roles.';
    ELSE
        RAISE NOTICE 'role column already exists in user_roles.';
    END IF;
END $$;

-- 3. Storage (hoop-assets) 정책 수정
-- 사진 업로드 시 권한 체크 로직을 'role' 컬럼 존재 여부에 상관없이 안전하게 작동하도록 수정합니다.

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload assets" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload assets" ON storage.objects;

-- 모든 사용자 읽기 권한
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'hoop-assets');

-- 관리자 업로드 권한 (user_roles 테이블의 role 컬럼을 안전하게 체크)
CREATE POLICY "Admins can upload assets" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'hoop-assets' AND 
    (EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ))
);

-- 4. Shop 관련 RLS 정책 재설정
ALTER TABLE public.shop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_product_variants ENABLE ROW LEVEL SECURITY;

-- 상품 읽기는 누구나 가능
DROP POLICY IF EXISTS "Anyone can view shop products" ON public.shop_products;
CREATE POLICY "Anyone can view shop products" ON public.shop_products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view shop variants" ON public.shop_product_variants;
CREATE POLICY "Anyone can view shop variants" ON public.shop_product_variants FOR SELECT USING (true);

-- 관리자 전용 수정/생성 권한
DROP POLICY IF EXISTS "Admins can update shop products" ON public.shop_products;
CREATE POLICY "Admins can update shop products" ON public.shop_products
FOR UPDATE USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins can insert shop products" ON public.shop_products;
CREATE POLICY "Admins can insert shop products" ON public.shop_products
FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins can update shop variants" ON public.shop_product_variants;
CREATE POLICY "Admins can update shop variants" ON public.shop_product_variants
FOR UPDATE USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins can insert shop variants" ON public.shop_product_variants;
CREATE POLICY "Admins can insert shop variants" ON public.shop_product_variants
FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- 5. (중요) 현재 접속한 본인을 관리자로 설정 (에러 방지 및 테스트용)
-- 아래 쿼리의 'auth.uid()'는 현재 SQL 에디터를 실행하는 계정이 아니라, 
-- 실제 웹사이트에서 로그인한 본인의 UUID를 넣어야 할 수도 있습니다.
-- 만약 본인이 관리자인데 권한 에러가 난다면, 본인의 UUID를 직접 입력하세요.
-- INSERT INTO public.user_roles (user_id, role) 
-- VALUES ('본인의-UUID-여기에', 'admin')
-- ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
