import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
    const { data: templates } = await supabase.from('match_templates').select('*').limit(1);
    console.log('match_templates cols:', Object.keys(templates?.[0] || {}));
    
    const { data: rooms } = await supabase.from('match_rooms').select('*').limit(1);
    console.log('match_rooms cols:', Object.keys(rooms?.[0] || {}));
}

check();
