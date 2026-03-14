const blacklistService = require('../services/blacklistService');

function getUserId(req) {
    return req.header('x-user-id') || req.app.locals.defaultUserId;
}

async function getBlacklist(req, res) {
    const data = await blacklistService.getBlacklist(getUserId(req));
    res.json(data);
}

async function createBlacklist(req, res) {
    const result = await blacklistService.addBlacklist(getUserId(req), req.body?.domain);
    res.json(result);
}

async function deleteBlacklist(req, res) {
    const result = await blacklistService.removeBlacklist(getUserId(req), req.params.domain);
    res.json(result);
}

module.exports = {
    getBlacklist,
    createBlacklist,
    deleteBlacklist,
};
