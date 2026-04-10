import { createClient } from '@supabase/supabase-js'; try { createClient('', ''); console.log('success'); } catch (e) { console.error('ERROR:', e.message); }  
