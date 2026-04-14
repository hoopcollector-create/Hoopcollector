import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function checkSchema() {
  const { data, error } = await supabase
    .from('shop_products')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching shop_products:', error);
  } else if (data && data.length > 0) {
    console.log('Columns in shop_products:', Object.keys(data[0]));
  } else {
    // If no data, try to fetch some metadata or just insert a dummy and see keys
    console.log('No products found in shop_products to check columns.');
  }
}

checkSchema();
