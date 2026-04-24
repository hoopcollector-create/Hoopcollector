import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://xmfjvhhchhyeobrydasp.supabase.co', 'sb_publishable_hMPDwuiJrwXimYb56p_8Lg_cG1bcA9o');
async function test(){
    const { data, error } = await supabase.from('user_roles').select('*');
    if (error) {
        console.log('Select * failed:', error.message);
        // Try to check table info using RPC if available, or just try common names
        const names = ['role', 'role_name', 'name', 'role_id', 'type'];
        for (const n of names) {
            const { error: e } = await supabase.from('user_roles').select(n).limit(1);
            if (!e) {
                console.log('Found column name:', n);
                return;
            } else {
                console.log('Column', n, 'failed:', e.message);
            }
        }
    } else {
        console.log('Data:', data[0]);
    }
}
test();
