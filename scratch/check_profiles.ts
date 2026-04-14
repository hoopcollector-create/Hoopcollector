import { createClient } from '@supabase/supabase-client'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
)

async function checkSchema() {
  const { data, error } = await supabase.rpc('get_table_definition', { table_name: 'profiles' });
  console.log(JSON.stringify(data, null, 2));
}

checkSchema();
