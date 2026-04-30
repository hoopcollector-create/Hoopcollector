import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
const supabaseUrl = envFile.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const supabaseKey = envFile.match(/VITE_SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim(); // Use Service Role Key to bypass RLS
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    // Check recent ticket balances
    const { data: tickets, error: tErr } = await supabase
        .from('ticket_balances')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(5);
        
    console.log("Recent Ticket Balances:");
    if (tErr) console.error(tErr);
    else console.log(JSON.stringify(tickets, null, 2));

    // Check recent purchases to see what was actually saved
    const { data: purchases, error: pErr } = await supabase
        .from('purchases')
        .select('id, product_title, class_type, ticket_qty, status, amount, points_used')
        .order('created_at', { ascending: false })
        .limit(3);
        
    console.log("\nRecent Purchases:");
    if (pErr) console.error(pErr);
    else console.log(JSON.stringify(purchases, null, 2));
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
