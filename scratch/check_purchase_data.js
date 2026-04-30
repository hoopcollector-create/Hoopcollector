import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
const supabaseUrl = envFile.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const supabaseKey = envFile.match(/VITE_SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim(); // Use Service Role Key to bypass RLS
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    // Check recent purchases
    const { data: purchases, error: pErr } = await supabase
        .from('purchases')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);
        
    console.log("Recent Purchases:");
    if (pErr) console.error(pErr);
    else console.log(JSON.stringify(purchases, null, 2));

    // Check shop purchase requests
    const { data: shopReq, error: sErr } = await supabase
        .from('shop_purchase_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);
        
    console.log("\nShop Purchase Requests:");
    if (sErr) console.error(sErr);
    else console.log(JSON.stringify(shopReq, null, 2));

    // Check products table
    const { data: products, error: prErr } = await supabase
        .from('products')
        .select('*')
        .limit(3);
        
    console.log("\nProducts:");
    if (prErr) console.error(prErr);
    else console.log(JSON.stringify(products, null, 2));
}

checkData();
