import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://xmfjvhhchhyeobrydasp.supabase.co";
const supabaseKey = "sb_publishable_hMPDwuiJrwXimYb56p_8Lg_cG1bcA9o";
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from('class_requests')
    .select('*')
    .limit(1);

  if (error) console.log("ERROR:", error.message);
  else {
    console.log("COLUMNS:", Object.keys(data[0] || {}));
  }
}
check();
