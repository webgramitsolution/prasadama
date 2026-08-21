import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function checkAdmins() {
  console.log('Checking for admins at URL:', SUPABASE_URL);
  
  const { data: roles, error: roleError } = await supabase
    .from('user_roles')
    .select('user_id, role')
    .eq('role', 'admin');
    
  if (roleError) {
    console.error('Error fetching admin roles:', roleError);
    return;
  }
  
  console.log('Admin roles found:', roles);
  
  if (roles && roles.length > 0) {
    const userIds = roles.map(r => r.user_id);
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, email')
      .in('user_id', userIds);
      
    if (profileError) {
      console.error('Error fetching admin profiles:', profileError);
    } else {
      console.log('Admin profiles:', profiles);
    }
  }
}

checkAdmins();
