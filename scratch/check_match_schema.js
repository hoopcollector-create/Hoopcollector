import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or Key");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  const { data, error } = await supabase
    .from('community_matches')
    .select('lat, lng')
    .limit(1);

  if (error) {
    if (error.code === '42703') {
      console.log("COLUMNS_MISSING");
    } else {
      console.log("ERROR", error.message);
    }
  } else {
    console.log("COLUMNS_EXIST");
  }
}

checkSchema();
