/**
 * 滞在時間トラッキングの業務ロジックを担当するサービス層。
 * - `{ site, time }` のバリデーション
 * - `started_at` / `ended_at` を計算してセッションとして保存
 */
const { httpError } = require('../utils/httpError');
const tabSessionsRepository = require('../repositories/tabSessionsRepository');
const alertRulesRepository = require('../repositories/alertRulesRepository');


// 今日の0時をISO形式で返す
function startOfTodayIso() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return start.toISOString();
}

// ルールのドメインと入力ドメインがマッチするか（完全一致、サブドメイン許容、部分一致など）
function isRuleForDomain(ruleDomain, inputDomain) {
    if (!ruleDomain || !inputDomain) return false;
    if (ruleDomain === inputDomain) return true;

    // 例: inputDomain="youtube" でも ruleDomain="youtube.com" を許容
    if (ruleDomain.startsWith(`${inputDomain}.`)) return true;
    if (ruleDomain.includes(inputDomain)) return true;

    return false;
}

// アラートルールと今日の滞在時間をもとに、アラートが必要かどうかを判断する
async function buildAlertStatus(userId, inputDomain) {
    const rules = await alertRulesRepository.listAlertRulesByUser(userId);
    const matchedRule = rules.find((rule) => isRuleForDomain(rule.target_domain, inputDomain));

    if (!matchedRule) {
        return {
            shouldAlert: false,
            targetDomain: inputDomain,
            thresholdSec: null,
            todayDurationSec: 0,
            exceededBySec: 0,
        };
    }

    const targetDomain = matchedRule.target_domain;
    const thresholdSec = Number(matchedRule.threshold_sec || 0);
    const todayDurationSec = await tabSessionsRepository.getTodayDurationByDomain(
        userId,
        targetDomain,
        startOfTodayIso()
    );
    const exceededBySec = Math.max(0, todayDurationSec - thresholdSec);

    return {
        shouldAlert: todayDurationSec >= thresholdSec,
        targetDomain,
        thresholdSec,
        todayDurationSec,
        exceededBySec,
    };
}



// `site` と `time` を受け取って新しいセッションを保存し、最新のアラート状態を返す
async function addTime(userId, site, time) {
    const domain = String(site || '').trim().toLowerCase();
    const durationSec = Number(time || 0);

    if (!domain) {
        throw httpError(400, 'site is required');
    }
    if (!Number.isFinite(durationSec) || durationSec <= 0) {
        throw httpError(400, 'time must be a positive number');
    }

    const endedAt = new Date();
    const startedAt = new Date(endedAt.getTime() - durationSec * 1000);

    await tabSessionsRepository.insertTabSession({
        user_id: userId,
        domain,
        duration_sec: Math.floor(durationSec),
        started_at: startedAt.toISOString(),
        ended_at: endedAt.toISOString(),
        is_waste: true,
    });

    const alert = await buildAlertStatus(userId, domain);

    return {
        success: true,
        alert,
    };
}

module.exports = {
    addTime,
};
