
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

async function checkTables() {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Checking tables...");
    
    // Check match_waitlist
    const { error: waitlistErr } = await supabase.from('match_waitlist').select('count', { count: 'exact', head: true });
    console.log("match_waitlist:", waitlistErr ? waitlistErr.message : "OK");

    // Check match_rooms columns
    const { data: rooms, error: roomsErr } = await supabase.from('match_rooms').select('*').limit(1);
    if (roomsErr) console.log("match_rooms error:", roomsErr.message);
    else console.log("match_rooms columns:", Object.keys(rooms[0] || {}));

    // Check match_participants columns
    const { data: parts, error: partsErr } = await supabase.from('match_participants').select('*').limit(1);
    if (partsErr) console.log("match_participants error:", partsErr.message);
    else console.log("match_participants columns:", Object.keys(parts[0] || {}));
}

checkTables();
