-- [1] Enable RLS for the tables
ALTER TABLE shop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_product_variants ENABLE ROW LEVEL SECURITY;

-- [2] Create Update Policy for shop_products
-- This allows any logged-in user with the 'admin' role in user_roles to update products.
DROP POLICY IF EXISTS "Admins can update shop products" ON shop_products;
CREATE POLICY "Admins can update shop products" ON shop_products
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- [3] Create Insert Policy for shop_products
DROP POLICY IF EXISTS "Admins can insert shop products" ON shop_products;
CREATE POLICY "Admins can insert shop products" ON shop_products
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- [4] Create Update Policy for shop_product_variants
DROP POLICY IF EXISTS "Admins can update shop variants" ON shop_product_variants;
CREATE POLICY "Admins can update shop variants" ON shop_product_variants
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- [5] Create Insert Policy for shop_product_variants
DROP POLICY IF EXISTS "Admins can insert shop variants" ON shop_product_variants;
CREATE POLICY "Admins can insert shop variants" ON shop_product_variants
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- [6] Ensure Public can still View (Select)
DROP POLICY IF EXISTS "Anyone can view shop products" ON shop_products;
CREATE POLICY "Anyone can view shop products" ON shop_products
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view shop variants" ON shop_product_variants;
CREATE POLICY "Anyone can view shop variants" ON shop_product_variants
FOR SELECT USING (true);
