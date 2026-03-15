const { supabase } = require('./src/config/supabase');
const { env } = require('./src/config/env');

async function checkDatabase() {
    const userId = '00000000-0000-0000-0000-000000000000';
    console.log('Checking database for userId:', userId);

    // 1. プロフィールの存在を確認
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    
    if (profileError) {
        console.log('Profile NOT found (or error):', profileError.message);
    } else {
        console.log('Profile found:', profile);
    }

    // 2. セッションの存在を確認
    const { data, error } = await supabase
        .from('tab_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error fetching data:', error);
        return;
    }

    if (data.length === 0) {
        console.log('No records found for this user.');
    } else {
        console.log(`Found ${data.length} records:`);
        data.forEach(row => {
            console.log(`- [${row.created_at}] Domain: ${row.domain}, Visits: ${row.duration_sec === 0 ? 'History' : 'Active'}`);
        });
    }
}

checkDatabase();
