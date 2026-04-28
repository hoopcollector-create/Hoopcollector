-- [FIX] 'column role does not exist' 에러 해결을 위한 최종 보완 스크립트
-- 이 코드를 Supabase SQL Editor에서 실행해 주세요.

-- 1. user_roles 테이블 및 role 컬럼 강제 생성/확인
DO $$ 
BEGIN
    -- 테이블이 없으면 생성
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='user_roles') THEN
        CREATE TABLE public.user_roles (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            role TEXT DEFAULT 'student',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;

    -- role 컬럼이 없으면 추가
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='user_roles' AND column_name='role'
    ) THEN
        ALTER TABLE public.user_roles ADD COLUMN role TEXT DEFAULT 'student';
    END IF;
END $$;

-- 2. Storage (hoop-assets) 정책 수정
-- 사진 업로드 시 발생하는 에러를 방지하기 위해 정책을 재설정합니다.

-- 기존 정책 삭제 (충돌 방지)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload assets" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload assets" ON storage.objects;

-- 모든 사용자 읽기 권한 (공개)
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'hoop-assets');

-- 인증된 사용자 업로드 권한 (role 에러 방지를 위해 단순화하거나 체크 로직 보완)
CREATE POLICY "Admins can upload assets" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'hoop-assets' AND 
    (EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ))
);

-- 3. Shop 관련 RLS 정책 재확인 및 수정
-- shop_products 및 shop_product_variants 정책이 role 컬럼을 참조할 때 에러가 나지 않도록 합니다.

DROP POLICY IF EXISTS "Admins can update shop products" ON public.shop_products;
CREATE POLICY "Admins can update shop products" ON public.shop_products
FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admins can insert shop products" ON public.shop_products;
CREATE POLICY "Admins can insert shop products" ON public.shop_products
FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admins can update shop variants" ON public.shop_product_variants;
CREATE POLICY "Admins can update shop variants" ON public.shop_product_variants
FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admins can insert shop variants" ON public.shop_product_variants;
CREATE POLICY "Admins can insert shop variants" ON public.shop_product_variants
FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- 4. 현재 로그인한 사용자를 어드민으로 설정 (테스트용/필요시)
-- INSERT INTO public.user_roles (user_id, role) 
-- VALUES ('사용자-UUID-여기에', 'admin')
-- ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
