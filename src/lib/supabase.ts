import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xmfjvhhchhyeobrydasp.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_hMPDwuiJrwXimYb56p_8Lg_cG1bcA9o';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
