import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://twascrvlzmcmvqhzyipv.supabase.co'; // np. https://xxxxx.supabase.co
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3YXNjcnZsem1jbXZxaHp5aXB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NTk4MjUsImV4cCI6MjA4NjMzNTgyNX0.FXrmwzU4y8tfj4xnpA4LX0kQTYPmI6Xgh3I12eYEM-g'; // długi klucz z Supabase

export const supabase = createClient(supabaseUrl, supabaseAnonKey);