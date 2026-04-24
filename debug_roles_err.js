import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://xmfjvhhchhyeobrydasp.supabase.co', 'sb_publishable_hMPDwuiJrwXimYb56p_8Lg_cG1bcA9o');
async function test(){
    console.log('Checking user_roles schema...');
    const { data: d, error: e } = await supabase.from('user_roles').select('*').limit(1);
    if (e) console.error('Error on select *:', e.message);
    else console.log('Data:', d);

    // Try to guess columns by requesting non-existent and looking at error
    const { error: e2 } = await supabase.from('user_roles').select('abcd_test');
    console.log('Error hint for non-existent:', e2?.message);
}
test();
