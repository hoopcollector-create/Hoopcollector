
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

async function checkFunctions() {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Checking RPC Functions...");

    // 1. Check approve_shop_purchase_request
    const { data: appFunc, error: appErr } = await supabase.rpc('approve_shop_purchase_request', { p_request_id: '00000000-0000-0000-0000-000000000000' });
    // This will likely fail with 'id not found' or similar, but we want to see if it's 'function not found'
    console.log("approve_shop_purchase_request check:", appErr ? appErr.message : "Exists (but ID 0 invalid)");

    // 2. Check create_cash_purchase
    const { data: cashFunc, error: cashErr } = await supabase.rpc('create_cash_purchase', { p_product_id: '00000000-0000-0000-0000-000000000000' });
    console.log("create_cash_purchase check:", cashErr ? cashErr.message : "Exists");
}

checkFunctions();
