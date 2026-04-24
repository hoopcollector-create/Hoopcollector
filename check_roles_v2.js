import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://xmfjvhhchhyeobrydasp.supabase.co', 'sb_publishable_hMPDwuiJrwXimYb56p_8Lg_cG1bcA9o');
async function test(){
    const { data, error } = await supabase.from('user_roles').select('*').limit(1);
    if (error) {
        console.error('Error:', error);
    } else if (data && data.length > 0) {
        console.log('Columns:', Object.keys(data[0]));
        console.log('Sample Data:', data[0]);
    } else {
        console.log('No data found in user_roles');
        // Try to get schema via an error
        const { error: err2 } = await supabase.from('user_roles').select('non_existent_column');
        console.log('Error hint:', err2?.message);
    }
}
test();
