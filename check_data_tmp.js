const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'apps/api/.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkDataDistribution() {
    console.log('--- Checking todos distribution ---');
    const { data: todos, error: todosError } = await supabase.from('todos').select('user_id').limit(100);
    if (todosError) console.error('Todos Error:', todosError);
    else {
        const counts = todos.reduce((acc, t) => { acc[t.user_id] = (acc[t.user_id] || 0) + 1; return acc; }, {});
        console.log('Todos by User ID:', counts);
    }

    console.log('\n--- Checking tab_sessions distribution ---');
    const { data: sessions, error: sessionsError } = await supabase.from('tab_sessions').select('user_id').limit(100);
    if (sessionsError) console.error('Sessions Error:', sessionsError);
    else {
        const counts = sessions.reduce((acc, s) => { acc[s.user_id] = (acc[s.user_id] || 0) + 1; return acc; }, {});
        console.log('Sessions by User ID:', counts);
    }
    
    console.log('\n--- Current Default ID Check ---');
    const defaultId = 'b186ec48-06dd-4844-b29d-ab987e2b5989';
    const { count: todoCount } = await supabase.from('todos').select('*', { count: 'exact', head: true }).eq('user_id', defaultId);
    const { count: sessionCount } = await supabase.from('tab_sessions').select('*', { count: 'exact', head: true }).eq('user_id', defaultId);
    console.log(`Default ID (${defaultId}) has ${todoCount} todos and ${sessionCount} sessions.`);
}

checkDataDistribution();
