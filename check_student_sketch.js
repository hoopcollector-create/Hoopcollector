import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://xmfjvhhchhyeobrydasp.supabase.co', 'sb_publishable_hMPDwuiJrwXimYb56p_8Lg_cG1bcA9o');
async function test(){
    const { data, error } = await supabase.from('class_journals').select('*').limit(1);
    if (data && data.length > 0) {
        console.log('Columns:', Object.keys(data[0]));
    } else {
        const { error: e2 } = await supabase.from('class_journals').select('student_visual_log_url');
        if (e2) console.log('student_visual_log_url MISSING:', e2.message);
        else console.log('student_visual_log_url EXISTS');
    }
}
test();
