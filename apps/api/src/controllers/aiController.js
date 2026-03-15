/**
 * AI機能のコントローラー。
 * - タスク分析リクエストを受け取り、Gemini APIを呼んで結果を返す
 */
const { analyzeTask } = require('../services/aiService');
const { httpError } = require('../utils/httpError');

async function postAnalyzeTask(req, res) {
    const { title, description } = req.body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
        throw httpError(400, 'タスクのタイトルが必要です');
    }

    console.log(`[AI] Analyzing task: "${title}"`);
    const result = await analyzeTask(title.trim(), (description || '').trim());
    res.json(result);
}

module.exports = { postAnalyzeTask };
