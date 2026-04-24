import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://xmfjvhhchhyeobrydasp.supabase.co";
const supabaseKey = "sb_publishable_hMPDwuiJrwXimYb56p_8Lg_cG1bcA9o";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPolicies() {
  const { data, error } = await supabase.rpc('get_policies_for_table', { t_name: 'community_matches' });
  if (error) {
    // If rpc doesn't exist, we'll try a common one or just assume we need to add it
    console.log("RPC_ERROR", error.message);
  } else {
    console.log("POLICIES:", data);
  }
}

checkPolicies();
