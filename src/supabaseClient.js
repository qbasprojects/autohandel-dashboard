import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'TWÓJ_FALLBACK_URL';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'TWÓJ_FALLBACK_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);