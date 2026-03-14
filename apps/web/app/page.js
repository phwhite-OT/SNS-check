"use client";

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export default function Home() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form states
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [newDomain, setNewDomain] = useState('');

  // Fetch data
  const fetchData = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/dashboard');
      if (!res.ok) throw new Error('API request failed');
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('APIに接続できません。バックエンドが起動しているか確認してください。');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, 5000);
    return () => clearInterval(intervalId);
  }, []);

  // ToDo Actions
  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;
    try {
      await fetch('http://localhost:3001/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTodoTitle })
      });
      setNewTodoTitle('');
      fetchData();
    } catch (e) { console.error(e); }
  };

  const handleToggleTodo = async (id, currentStatus) => {
    try {
      await fetch(`http://localhost:3001/api/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !currentStatus })
      });
      fetchData();
    } catch (e) { console.error(e); }
  };

  const handleDeleteTodo = async (id) => {
    try {
      await fetch(`http://localhost:3001/api/todos/${id}`, {
        method: 'DELETE'
      });
      fetchData();
    } catch (e) { console.error(e); }
  };

  // Blacklist Actions
  const handleAddBlacklist = async (e) => {
    e.preventDefault();
    if (!newDomain.trim()) return;
    try {
      // 簡易的にnameはドメインの最初の部分とする
      const name = newDomain.split('.')[0] || newDomain;
      await fetch('http://localhost:3001/api/blacklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: newDomain, name })
      });
      setNewDomain('');
      fetchData();
    } catch (e) { console.error(e); }
  };

  const handleDeleteBlacklist = async (domain) => {
    try {
      await fetch(`http://localhost:3001/api/blacklist/${domain}`, {
        method: 'DELETE'
      });
      fetchData();
    } catch (e) { console.error(e); }
  };

  if (isLoading) return <div className="loading">Loading dashboard...</div>;
  if (error) return <div className="error-card">{error}</div>;
  if (!data) return null;

  // Format history for chart
  const chartData = data.history.map(item => ({
    time: new Date(item.timestamp).toLocaleTimeString(),
    score: item.score
  }));

  return (
    <div className="dashboard-container">

      {/* 1. Score & Graph Section */}
      <section className="main-section glass-panel">
        <div className="score-header">
          <h2>あなたのHP (Current Score)</h2>
          <div className="huge-score">{data.score}</div>
        </div>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="time" stroke="#aaa" />
              <YAxis domain={['auto', 'auto']} stroke="#aaa" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                itemStyle={{ color: '#4ade80' }}
              />
              <Line
                type="stepAfter"
                dataKey="score"
                stroke="#4ade80"
                strokeWidth={3}
                dot={{ r: 4, fill: '#4ade80' }}
                activeDot={{ r: 8 }}
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="bottom-grid">
        {/* 2. ToDo List Section */}
        <section className="todo-section glass-panel">
          <h2>🏆 クエスト (ToDo List)</h2>
          <p className="hint">タスクを完了してHPを回復しよう！ (+50 HP)</p>

          <form className="add-form" onSubmit={handleAddTodo}>
            <input
              type="text"
              value={newTodoTitle}
              onChange={(e) => setNewTodoTitle(e.target.value)}
              placeholder="新しいタスクを入力..."
              className="input-field"
            />
            <button type="submit" className="btn-primary">追加</button>
          </form>

          <ul className="todo-list">
            {data.todos.map(todo => (
              <li key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => handleToggleTodo(todo.id, todo.completed)}
                  />
                  <span className="checkmark"></span>
                  <span className="todo-text">{todo.title}</span>
                </label>
                <button className="btn-delete" onClick={() => handleDeleteTodo(todo.id)}>✕</button>
              </li>
            ))}
            {data.todos.length === 0 && <li className="empty-msg">タスクがありません。</li>}
          </ul>
        </section>

        {/* 3. Blacklist Section */}
        <section className="blacklist-section glass-panel">
          <h2>☠️ 毒沼 (Blacklist)</h2>
          <p className="hint">これらのサイトを見るとHPが減ります...</p>

          <form className="add-form" onSubmit={handleAddBlacklist}>
            <input
              type="text"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder="例: netflix.com"
              className="input-field"
            />
            <button type="submit" className="btn-danger">追加</button>
          </form>

          <ul className="blacklist">
            {data.blacklist.map(b => (
              <li key={b.domain} className="blacklist-item">
                <span className="domain-name">{b.domain}</span>
                <button className="btn-delete" onClick={() => handleDeleteBlacklist(b.domain)}>削除</button>
              </li>
            ))}
            {data.blacklist.length === 0 && <li className="empty-msg">監視対象がありません。</li>}
          </ul>
        </section>
      </div>

      <style jsx>{`
        .dashboard-container {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }
        .bottom-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 2rem;
        }
        .glass-panel {
          background: rgba(30, 41, 59, 0.6);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 2rem;
          border-radius: 16px;
        }
        .main-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .score-header {
          text-align: center;
        }
        .huge-score {
          font-size: 5rem;
          font-weight: 900;
          color: #4ade80;
          text-shadow: 0 0 20px rgba(74, 222, 128, 0.4);
          margin-top: 10px;
        }
        .chart-container {
          margin-top: 1rem;
          background: rgba(0,0,0,0.2);
          border-radius: 12px;
          padding: 1rem 1rem 1rem 0;
        }
        h2 {
          color: #f8fafc;
          margin-bottom: 0.5rem;
          font-size: 1.5rem;
          margin-top: 0;
        }
        .hint {
          color: #94a3b8;
          font-size: 0.9rem;
          margin-bottom: 1.5rem;
        }
        .add-form {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }
        .input-field {
          flex: 1;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.2);
          background: rgba(0,0,0,0.3);
          color: white;
          font-size: 1rem;
        }
        .input-field:focus {
          outline: none;
          border-color: #3b82f6;
        }
        .btn-primary {
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 0 1.5rem;
          font-weight: bold;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-primary:hover { background: #2563eb; }
        .btn-danger {
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 0 1.5rem;
          font-weight: bold;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-danger:hover { background: #dc2626; }
        
        .todo-list, .blacklist {
          list-style: none;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin: 0;
        }
        .todo-item, .blacklist-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(0,0,0,0.2);
          padding: 1rem;
          border-radius: 8px;
          transition: all 0.2s;
        }
        .todo-item.completed {
          opacity: 0.5;
        }
        .todo-item.completed .todo-text {
          text-decoration: line-through;
          color: #94a3b8;
        }
        .checkbox-container {
          display: flex;
          align-items: center;
          gap: 1rem;
          cursor: pointer;
          flex: 1;
        }
        .todo-text {
          font-size: 1.1rem;
          color: #f1f5f9;
          transition: color 0.2s;
        }
        .domain-name {
          font-size: 1.1rem;
          color: #fca5a5;
        }
        .btn-delete {
          background: transparent;
          color: #ef4444;
          border: 1px solid #ef4444;
          border-radius: 6px;
          padding: 0.25rem 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-delete:hover {
          background: #ef4444;
          color: white;
        }
        .empty-msg {
          text-align: center;
          color: #64748b;
          padding: 2rem;
        }
        .loading {
          text-align: center;
          font-size: 1.5rem;
          color: #94a3b8;
          padding: 5rem;
        }
        .error-card {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          padding: 2rem;
          border-radius: 12px;
          border: 1px solid rgba(239, 68, 68, 0.2);
          text-align: center;
        }
      `}</style>
    </div>
  );
}
