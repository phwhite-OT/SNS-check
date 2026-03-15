/**
 * AIによるタスク分析サービス。
 * - Groq (Llama 3) を優先し、失敗時は Gemini (Google) にフォールバックする
 */
const { env } = require('../config/env');

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`;

async function analyzeTask(title, description = '') {
    const prompt = `あなたはプロジェクト管理の専門家です。以下のタスクを分析し、**必ずJSON形式のみ**で返してください。
タスク: "${title}", 説明: "${description}"
JSON形式: {"subtasks": [{"title": "サブタスク名", "priority": "high", "estimatedHours": 2}], "complexity": "medium", "totalEstimatedHours": 5, "tips": "アドバイス"}
priority: high/medium/low, complexity: low/medium/high. subtasksは3〜6個。`;

    console.log(`[AI] Analyzing: ${title}`);

    // 1. Try Groq
    if (env.GROQ_API_KEY) {
        try {
            console.log('[AI] Trying Groq...');
            const response = await fetch(GROQ_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.GROQ_API_KEY}` },
                body: JSON.stringify({
                    model: GROQ_MODEL,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.3,
                    response_format: { type: 'json_object' },
                }),
            });

            if (response.ok) {
                const data = await response.json();
                const rawText = data.choices?.[0]?.message?.content || '';
                return JSON.parse(rawText.match(/\{[\s\S]*\}/)[0]);
            }
            console.error(`[AI] Groq failed with status: ${response.status}`);
        } catch (e) {
            console.error('[AI] Groq error:', e.message);
        }
    }

    // 2. Fallback to Gemini
    if (env.GEMINI_API_KEY) {
        console.log('[AI] Falling back to Gemini...');
        try {
            const response = await fetch(GEMINI_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt + "\n必ずJSON形式の文字列だけを返してください。" }] }]
                })
            });

            if (response.ok) {
                const data = await response.json();
                const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                const jsonMatch = rawText.match(/\{[\s\S]*\}/);
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error(`Gemini failed with status: ${response.status}`);
        } catch (e) {
            console.error('[AI] Gemini error:', e.message);
            throw new Error(`AI分析に失敗しました。APIキーを確認してください。(Error: ${e.message})`);
        }
    }

    throw new Error('AI APIキーが設定されていません。');
}

module.exports = { analyzeTask };
