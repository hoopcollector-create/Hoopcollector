import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://xmfjvhhchhyeobrydasp.supabase.co";
const supabaseKey = "sb_publishable_hMPDwuiJrwXimYb56p_8Lg_cG1bcA9o";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  const { data, error } = await supabase
    .from('community_matches')
    .select('lat, lng')
    .limit(1);

  if (error) {
    if (error.code === '42703') {
      console.log("RESULT: COLUMNS_MISSING");
    } else {
      console.log("RESULT: ERROR", error.message);
    }
  } else {
    console.log("RESULT: COLUMNS_EXIST");
  }
}

checkSchema();
