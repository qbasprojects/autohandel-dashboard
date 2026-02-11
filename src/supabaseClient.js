import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://twascrvlzmcmvqhzyipv.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3YXNjcnZsem1jbXZxaHp5aXB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NTk4MjUsImV4cCI6MjA4NjMzNTgyNX0.FXrmwzU4y8tfj4xnpA4LX0kQTYPmI6Xgh3I12eYEM-g';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);