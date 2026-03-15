const { supabase } = require('./src/config/supabase');

async function ensureProfile() {
    const userId = '00000000-0000-0000-0000-000000000000';
    console.log('Ensuring profile exists for:', userId);

    const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

    if (fetchError && fetchError.code === 'PGRST116') { // Not found
        console.log('Profile not found, creating...');
        const { error: insertError } = await supabase
            .from('profiles')
            .insert({
                id: userId,
                email: 'dev@example.com',
                display_name: 'Developer'
            });

        if (insertError) {
            console.error('Failed to create profile:', insertError.message);
        } else {
            console.log('Profile created successfully!');
        }
    } else if (fetchError) {
        console.error('Error fetching profile:', fetchError.message);
    } else {
        console.log('Profile already exists.');
    }
}

ensureProfile();
