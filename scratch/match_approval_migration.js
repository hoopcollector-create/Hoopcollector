
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; // This won't work for migrations, need service role

console.log("Please run this SQL in your Supabase SQL Editor:");
console.log(`
ALTER TABLE match_rooms ADD COLUMN IF NOT EXISTS approval_required BOOLEAN DEFAULT false;
ALTER TABLE match_participants ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'joined';
`);
