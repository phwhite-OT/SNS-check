const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- データ保存エリア ---
// MVP構成: メモリ上に保存
let todos = [
  { id: '1', title: 'ダッシュボードの改修', completed: false },
  { id: '2', title: 'Chrome拡張機能のテスト', completed: false }
];

let blacklist = [
  { domain: 'youtube.com', name: 'youtube' },
  { domain: 'twitter.com', name: 'x' },
  { domain: 'x.com', name: 'x' },
  { domain: 'instagram.com', name: 'instagram' },
  { domain: 'tiktok.com', name: 'tiktok' }
];

let timeData = {};
blacklist.forEach(b => {
  timeData[b.name] = 0;
});

// 初期スコアと履歴
let score = 1000;
let history = [
  { timestamp: Date.now(), score: 1000 }
];

// テスト用ステータス
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok' });
});

// --- ToDo API ---
app.get('/api/todos', (req, res) => {
  res.json(todos);
});

app.post('/api/todos', (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  const newTodo = {
    id: Date.now().toString(),
    title,
    completed: false
  };
  todos.push(newTodo);
  res.json(newTodo);
});

app.put('/api/todos/:id', (req, res) => {
  const { id } = req.params;
  const { completed, title } = req.body;

  const todo = todos.find(t => t.id === id);
  if (!todo) return res.status(404).json({ error: 'Todo not found' });

  // タスクが新しく完了された場合、スコアを増やす (例: +50)
  if (completed !== undefined && completed === true && todo.completed === false) {
    score += 50;
    history.push({ timestamp: Date.now(), score });
  }

  if (completed !== undefined) todo.completed = completed;
  if (title !== undefined) todo.title = title;

  res.json(todo);
});

app.delete('/api/todos/:id', (req, res) => {
  const { id } = req.params;
  todos = todos.filter(t => t.id !== id);
  res.json({ success: true });
});

// --- Blacklist API ---
app.get('/api/blacklist', (req, res) => {
  res.json(blacklist);
});

app.post('/api/blacklist', (req, res) => {
  const { domain, name } = req.body;
  if (!domain || !name) return res.status(400).json({ error: 'Domain and name are required' });

  // 重複チェック
  if (!blacklist.find(b => b.domain === domain)) {
    blacklist.push({ domain, name });
    if (timeData[name] === undefined) {
      timeData[name] = 0;
    }
  }
  res.json({ success: true, blacklist });
});

app.delete('/api/blacklist/:domain', (req, res) => {
  const { domain } = req.params;
  blacklist = blacklist.filter(b => b.domain !== domain);
  res.json({ success: true, blacklist });
});

// --- Time & Score API ---
// Chrome拡張機能からの時間データ受け取り
app.post('/api/time', (req, res) => {
  const { site, time } = req.body;

  if (timeData.hasOwnProperty(site)) {
    timeData[site] += typeof time === 'number' ? time : 0;
  } else {
    timeData[site] = typeof time === 'number' ? time : 0;
  }

  // 時間を浪費した場合、その秒数に応じてスコアを減らす (例: 1秒 = -1スコア 等、調整可能)
  // 今回は1秒 = 1スコア減点とする
  if (time > 0) {
    score -= time;
    history.push({ timestamp: Date.now(), score });
  }

  res.json({ success: true, score, timeData });
});

// ダッシュボード初期データ一括取得
app.get('/api/dashboard', (req, res) => {
  const totalSeconds = Object.values(timeData).reduce((a, b) => a + b, 0);

  res.json({
    score,
    history,
    todos,
    blacklist,
    timeData,
    totalTimeSeconds: totalSeconds,
  });
});

app.listen(PORT, () => {
  console.log(`API Server running on http://localhost:${PORT}`);
});
