/**
 * 集中モード状態管理コントローラー
 * - userId ごとにインメモリ保存
 * - 25分集中 / 5分休憩 を自動循環
 */

const FOCUS_MINUTES = 25;
const BREAK_MINUTES = 5;

// userId -> { enabled: boolean, phase: 'idle'|'focus'|'break', endsAt: number|null }
const store = new Map();

function defaultState() {
    return {
        enabled: false,
        phase: 'idle',
        endsAt: null,
    };
}

function normalize(state) {
    if (!state.enabled || !state.endsAt || state.phase === 'idle') return state;

    while (state.enabled && state.endsAt && state.endsAt <= Date.now()) {
        if (state.phase === 'focus') {
            state.phase = 'break';
            state.endsAt += BREAK_MINUTES * 60 * 1000;
        } else {
            state.phase = 'focus';
            state.endsAt += FOCUS_MINUTES * 60 * 1000;
        }
    }

    return state;
}

function getState(userId) {
    const current = store.get(userId) || defaultState();
    const normalized = normalize(current);
    store.set(userId, normalized);
    return normalized;
}

function toResponse(state) {
    const remainingSeconds = state.endsAt
        ? Math.max(0, Math.floor((state.endsAt - Date.now()) / 1000))
        : 0;

    return {
        enabled: state.enabled,
        phase: state.phase,
        endsAt: state.endsAt,
        remainingSeconds,
    };
}

function getFocusMode(req, res) {
    const userId = req.headers['x-user-id'] || 'anonymous';
    const state = getState(userId);
    res.json(toResponse(state));
}

function setFocusMode(req, res) {
    const userId = req.headers['x-user-id'] || 'anonymous';
    const enabled = !!req.body?.enabled;
    const state = getState(userId);

    if (enabled) {
        state.enabled = true;
        state.phase = 'focus';
        state.endsAt = Date.now() + FOCUS_MINUTES * 60 * 1000;
    } else {
        state.enabled = false;
        state.phase = 'idle';
        state.endsAt = null;
    }

    store.set(userId, state);
    res.json(toResponse(state));
}

module.exports = { getFocusMode, setFocusMode };
