import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://wnuzxosjjhucxnlaptbf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndudXp4b3Nqamh1Y3hubGFwdGJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyODY5MjgsImV4cCI6MjA4OTg2MjkyOH0.o-3ORuewx9hpgmwiJZMNNBt0LehSmutxVRsPEw-3u58';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});