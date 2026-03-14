/**
 * `profiles` テーブル専用のデータアクセス層(repository)。
 */
const { supabase } = require('../config/supabase');

async function getProfileById(userId) {
    const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
        throw error;
    }
    return data;
}

async function ensureProfile(userId) {
    const existing = await getProfileById(userId);
    if (!existing) {
        let email = null;

        try {
            const { data: authData, error: authError } = await supabase.auth.admin.getUserById(userId);
            if (authError) {
                console.error('Failed to load auth user for profile creation:', authError.message);
            } else {
                email = authData?.user?.email || null;
            }
        } catch (error) {
            console.error('Unexpected error while loading auth user:', error.message);
        }

        if (!email) {
            console.error(`Cannot auto-create profile for user ${userId}: email is missing.`);
            return false;
        }

        // もしプロフィールがなければ作成を試みる（FK違反を避けるため）
        let email = null;
        try {
            const { data: authData, error: authError } = await supabase.auth.admin.getUserById(userId);
            if (authError) throw authError;
            email = authData?.user?.email || null;
        } catch (error) {
            console.error('Failed to fetch auth user for profile bootstrap:', error.message);
        }

        if (!email) {
            console.error('Failed to create profile automatically: email is required but could not be resolved');
            return false;
        }

        const { data, error } = await supabase
            .from('profiles')
            .insert({
                id: userId,
                email,
                display_name: email.split('@')[0] || 'User', // 必須カラムへのデフォルト値
                display_name: 'User', // 必須カラムへのデフォルト値
                timezone: 'UTC'       // 必須カラムへのデフォルト値
            })
            .select('id')
            .single();

        if (error) {
            console.error('Failed to create profile automatically:', error.message);
            return false;
        }
        return true;
    }
    return true;
}

module.exports = {
    getProfileById,
    ensureProfile,
};
