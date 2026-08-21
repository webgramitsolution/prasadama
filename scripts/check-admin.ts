import { supabase } from '../src/integrations/supabase/client';

async function checkAdmins() {
  const { data, error } = await supabase
    .from('user_roles')
    .select('*, profiles(email)')
    .eq('role', 'admin');
    
  console.log('Admin check result:', JSON.stringify({ data, error }, null, 2));
}

checkAdmins();
