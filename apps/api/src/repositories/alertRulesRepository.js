const { supabase } = require('../config/supabase');

async function listAlertRulesByUser(userId) {
    const { data, error } = await supabase
        .from('alert_rules')
        .select('id, target_domain, threshold_sec, enabled, created_at')
        .eq('user_id', userId)
        .eq('enabled', true)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
}

async function insertAlertRule(userId, targetDomain, thresholdSec = 900) {
    const { data, error } = await supabase
        .from('alert_rules')
        .insert({
            user_id: userId,
            target_domain: targetDomain,
            threshold_sec: thresholdSec,
            enabled: true,
        })
        .select('id, target_domain, threshold_sec, enabled, created_at')
        .single();

    if (error) throw error;
    return data;
}

async function deleteAlertRuleByDomain(userId, targetDomain) {
    const { error } = await supabase
        .from('alert_rules')
        .delete()
        .eq('user_id', userId)
        .eq('target_domain', targetDomain);

    if (error) throw error;
}

module.exports = {
    listAlertRulesByUser,
    insertAlertRule,
    deleteAlertRuleByDomain,
};
