import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xmfjvhhchhyeobrydasp.supabase.co';
const supabaseKey = 'sb_publishable_hMPDwuiJrwXimYb56p_8Lg_cG1bcA9o';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("Checking DB schema...");
    
    const { data: coachData, error: ce } = await supabase.from('coach_profiles').select('*').limit(1);
    console.log("coach_profiles keys:", coachData && coachData[0] ? Object.keys(coachData[0]) : "No data", ce ? ce.message : "");

    const { data: profilesData, error: pe } = await supabase.from('profiles').select('*').limit(1);
    console.log("profiles keys:", profilesData && profilesData[0] ? Object.keys(profilesData[0]) : "No data", pe ? pe.message : "");
    
    // Check if the old view exists
    const { data: viewData, error: ve } = await supabase.from('public_coach_profiles').select('*').limit(1);
    console.log("public_coach_profiles keys:", viewData && viewData[0] ? Object.keys(viewData[0]) : "No data", ve ? ve.message : "");
}

check().catch(console.error);
