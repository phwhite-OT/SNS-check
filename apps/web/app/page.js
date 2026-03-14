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
  const [newTodoDesc, setNewTodoDesc] = useState('');
  const [newTodoTags, setNewTodoTags] = useState('');
  const [newTodoPriority, setNewTodoPriority] = useState('medium');
  const [newTodoDate, setNewTodoDate] = useState(new Date().toISOString().split('T')[0]);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  
  const [newDomain, setNewDomain] = useState('');
  // Calendar states
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Navigation states
  const [activeTab, setActiveTab] = useState('dashboard');

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
    
    // Parse comma separated tags
    const tagsArray = newTodoTags.split(',').map(tag => tag.trim()).filter(Boolean);

    try {
      await fetch('http://localhost:3001/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: newTodoTitle, 
          date: newTodoDate,
          description: newTodoDesc,
          tags: tagsArray,
          priority: newTodoPriority
        })
      });
      // Reset form
      setNewTodoTitle('');
      setNewTodoDesc('');
      setNewTodoTags('');
      setNewTodoPriority('medium');
      setIsTaskModalOpen(false); // Close modal
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

  // Blacklist Actions
  const handleAddBlacklist = async (e) => {
    e.preventDefault();
    if (!newDomain.trim()) return;
    try {
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

  const handleDeleteBlacklist = async (e, domain) => {
    e.stopPropagation(); // Avoid triggering card click if we had one
    try {
      await fetch(`http://localhost:3001/api/blacklist/${domain}`, {
        method: 'DELETE'
      });
      fetchData();
    } catch (e) { console.error(e); }
  };

  if (isLoading) return <div className="loading">Loading workspace...</div>;
  if (error) return <div className="error-card">{error}</div>;
  if (!data) return null;

  // Calculate pending tasks
  // Calculate pending tasks for selected date
  const displayTodos = data.todos.filter(t => t.date === selectedDate);
  const pendingTasks = displayTodos.filter(t => !t.completed).length;

  // Format history for chart
  const chartData = data.history.map((item, index) => {
    const isLast = index === data.history.length - 1;
    return {
      time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      score: item.score,
      // For a clean look, maybe only show the dot on the last item
    };
  });

  // Calculate progress bar (simplified logic: max 2000, min 0 for display purposes)
  const maxScore = 2000;
  const progressPercent = Math.min(Math.max((data.score / maxScore) * 100, 0), 100);

  // Calendar Helpers
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  const firstDay = getFirstDayOfMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const hasTodos = (year, month, day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return data.todos.some(t => t.date === dateStr && !t.completed);
  };
  
  const getTodosForDate = (year, month, day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return data.todos.filter(t => t.date === dateStr);
  };

  const handleDayClick = (dateStr) => {
    setSelectedDate(dateStr);
    setActiveTab('dashboard');
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">✓</div>
          <span>TaskFlow</span>
        </div>

        <div className="sidebar-btn-wrapper">
          <button className="sidebar-btn" onClick={() => setIsTaskModalOpen(true)}>
            <span style={{ fontSize: '1.2rem' }}>+</span> 新規タスク
          </button>
        </div>

        <div className="sidebar-menu-group">
          <div className="sidebar-menu-title">ワークスペース</div>
          <a className="sidebar-menu-item active">
            <i>📅</i>
            <span>今日</span>
            <span className="sidebar-badge">{pendingTasks}</span>
          </a>
        </div>
      </aside>

      {/* Main Container */}
      <div className="main-wrapper">

        {/* Top Header */}
        <header className="header">
          <div className="search-bar">
            <i>🔍</i>
            <input type="text" placeholder="タスクを検索..." />
          </div>

          <nav className="header-nav">
            <a href="#" className={activeTab === 'dashboard' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActiveTab('dashboard'); }}>ダッシュボード</a>
            <a href="#" className={activeTab === 'calendar' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActiveTab('calendar'); }}>カレンダー</a>
          </nav>

          <div className="header-actions">
            <div className="avatar">A</div>
          </div>
        </header>

        {/* Scrollable Dashboard / Calendar Area */}
        <main className="dashboard-content">
          
          {activeTab === 'dashboard' && (
            <>
              {/* Welcome Banner */}
              <section className="welcome-banner">
            <div className="welcome-inner">
              <div className="welcome-icon">👋🏻</div>
              <div className="welcome-text">
                <h1>お帰りなさい、Alexさん！</h1>
                <p>本日は {pendingTasks} 件のタスクと {data.blacklist.length} 件の監視サイトがあります。</p>
              </div>
            </div>
            <button className="btn-dismiss">✕ 閉じる</button>
          </section>

          <div className="dashboard-grid">

            {/* Left Column (Tasks & Blacklist) */}
            <div className="left-col">

              {/* Tasks List Card */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title">
                    <i>📋</i> {new Date(selectedDate).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', year: 'numeric' })} のタスク
                  </div>
                </div>

                <div className="task-list">
                  {displayTodos.map((todo, idx) => (
                    <div key={todo.id} className={`task-item ${todo.completed ? 'completed' : ''}`}>
                      <div className="task-checkbox-wrapper">
                        <input
                          type="checkbox"
                          className="custom-checkbox"
                          checked={todo.completed}
                          onChange={() => handleToggleTodo(todo.id, todo.completed)}
                        />
                      </div>
                      <div className="task-content">
                        <div className="task-title">
                          {todo.title}
                          {todo.priority === 'high' && <span style={{marginLeft: '0.5rem', fontSize: '0.7rem', color: '#ef4444'}}>■ High</span>}
                        </div>
                        
                        {todo.description && (
                          <div style={{fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem'}}>
                            {todo.description}
                          </div>
                        )}

                        {todo.tags && todo.tags.length > 0 && (
                          <div className="task-meta">
                            {todo.tags.map((tag, i) => {
                              // Assign random-looking consistent colors based on index
                              const classNames = ['design', 'meeting', 'client', 'dev'];
                              const colorClass = classNames[i % classNames.length];
                              return <span key={tag} className={`task-tag ${colorClass}`}>{tag}</span>
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {displayTodos.length === 0 && <div style={{ color: '#94a3b8', textAlign: 'center', padding: '1rem' }}>この日のタスクはありません。</div>}
                </div>

                {/* The inline form has been removed in favor of the modal */}
              </div>

              {/* Quick Access (Used for Blacklist/Toxic Sites) */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title">
                    <i>🔗</i> クイックアクセス (ブラックリスト)
                  </div>
                </div>

                <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
                  これらのサイトを見ている間、生産性スコアが減少します。
                </div>

                <div className="quick-access-grid">
                  {/* Default/Dummy icons based on domain to match design */}
                  {data.blacklist.map((site, i) => {
                    const colors = ['blue', 'red', 'green', 'yellow', 'danger'];
                    const colorClass = colors[i % colors.length];
                    const icon = site.domain.includes('youtube') ? '▶️'
                      : site.domain.includes('x.com') || site.domain.includes('twitter') ? '🐦'
                        : site.domain.includes('insta') ? '📷' : '🌐';

                    return (
                      <div key={site.domain} className={`qa-card ${colorClass}`}>
                        <button className="qa-delete" onClick={(e) => handleDeleteBlacklist(e, site.domain)}>✕</button>
                        <div className="qa-icon">{icon}</div>
                        <div className="qa-label">{site.name}</div>
                      </div>
                    );
                  })}
                </div>

                <form className="add-domain-wrapper" onSubmit={handleAddBlacklist}>
                  <input
                    type="text"
                    placeholder="ブラックリストにドメインを追加 (例: netflix.com)"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                  />
                  <button type="submit">追加</button>
                </form>
              </div>

            </div>

            {/* Right Column (Calendar, Graph & Score) */}
            <div className="right-col">

              {/* Calendar component */}
              <div className="card calendar-card">
                <div className="calendar-header">
                  <button className="calendar-nav-btn" onClick={prevMonth}>{'<'}</button>
                  <div className="calendar-title">
                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </div>
                  <button className="calendar-nav-btn" onClick={nextMonth}>{'>'}</button>
                </div>
                
                <div className="calendar-grid">
                  <div className="calendar-day-header">SU</div>
                  <div className="calendar-day-header">MO</div>
                  <div className="calendar-day-header">TU</div>
                  <div className="calendar-day-header">WE</div>
                  <div className="calendar-day-header">TH</div>
                  <div className="calendar-day-header">FR</div>
                  <div className="calendar-day-header">SA</div>
                  
                  {blanks.map(b => <div key={`blank-${b}`} className="calendar-cell empty"></div>)}
                  
                  {days.map(day => {
                    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const isActive = selectedDate === dateStr;
                    return (
                      <div 
                        key={day} 
                        className={`calendar-cell ${isActive ? 'active' : ''}`}
                        onClick={() => setSelectedDate(dateStr)}
                      >
                        {day}
                        {hasTodos(currentMonth.getFullYear(), currentMonth.getMonth(), day) && (
                          <div className="task-dot"></div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Score Graph (Replacing Calendar Design) */}
              <div className="graph-card">
                <div className="graph-header">
                  <button className="graph-nav-btn">{'<'}</button>
                  <div className="graph-title">スコア履歴</div>
                  <button className="graph-nav-btn">{'>'}</button>
                </div>

                <div style={{ height: '240px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="time" stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.8)', fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.8)', fontSize: 10 }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#ffffff', color: '#1e293b', border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                        itemStyle={{ color: '#5244e1', fontWeight: 'bold' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#ffffff"
                        strokeWidth={4}
                        dot={false}
                        activeDot={{ r: 6, fill: '#ffffff', stroke: '#5244e1', strokeWidth: 2 }}
                        isAnimationActive={true}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="graph-legend">
                  <span>● 現在のスコア: {data.score}</span>
                  <span style={{ opacity: 0.6 }}>最高: {Math.max(...data.history.map(h => h.score))}</span>
                </div>
              </div>

              {/* Productivity Score Summary */}
              <div className="card score-card">
                <div className="score-title">
                  <i>📈</i> 生産性スコア
                </div>

                <div className="progress-bar-container">
                  <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
                </div>

                <p className="score-desc">
                  現在のスコアは <strong>{data.score}</strong> です。
                  さらに {pendingTasks} 件のタスクを完了してマイルストーンを達成し、ブラックリストのサイト閲覧を避けましょう！
                </p>
              </div>

            </div>
          </div>
          </>
          )}

          {/* Full-Page Detailed Calendar View */}
          {activeTab === 'calendar' && (
            <div className="detailed-calendar">
              <div className="detailed-calendar-header">
                <div className="detailed-calendar-title">
                  カレンダー
                </div>
                <div className="detailed-calendar-month-controls">
                  <button onClick={prevMonth}>{'<'}</button>
                  <div className="detailed-calendar-month-label">
                    {currentMonth.toLocaleDateString('ja-JP', { month: 'long', year: 'numeric' })}
                  </div>
                  <button onClick={nextMonth}>{'>'}</button>
                </div>
                <button 
                  className="icon-btn" 
                  style={{background: 'var(--tf-primary)', color: 'white'}}
                  onClick={() => setIsTaskModalOpen(true)}
                >
                  +
                </button>
              </div>

              <div className="detailed-calendar-grid">
                <div className="detailed-calendar-day-header">日</div>
                <div className="detailed-calendar-day-header">月</div>
                <div className="detailed-calendar-day-header">火</div>
                <div className="detailed-calendar-day-header">水</div>
                <div className="detailed-calendar-day-header">木</div>
                <div className="detailed-calendar-day-header">金</div>
                <div className="detailed-calendar-day-header">土</div>

                {blanks.map(b => <div key={`blank-${b}`} className="detailed-calendar-cell empty"></div>)}

                {days.map(day => {
                  const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isActive = selectedDate === dateStr;
                  const isToday = new Date().toISOString().split('T')[0] === dateStr;
                  const dayTodos = getTodosForDate(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                  
                  return (
                    <div 
                      key={day} 
                      className={`detailed-calendar-cell ${isActive ? 'active' : ''} ${isToday ? 'today' : ''}`}
                      onClick={() => handleDayClick(dateStr)}
                    >
                      <div className="detailed-calendar-date-wrapper">
                        <div className="detailed-calendar-date">{day}</div>
                      </div>
                      <div className="detailed-tasks-container">
                        {dayTodos.map(todo => (
                          <div 
                            key={todo.id} 
                            className={`calendar-task-badge ${todo.completed ? 'completed' : 'pending'}`}
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              handleToggleTodo(todo.id, todo.completed); 
                            }}
                          >
                            <span>{todo.completed ? '✓' : '•'}</span>
                            <span style={{flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                              {todo.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

        </main>
      </div>
      {/* Task Creation Modal */}
      {isTaskModalOpen && (
        <div className="modal-overlay" onClick={() => setIsTaskModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>新しいタスクを作成</h2>
              <button className="modal-close" onClick={() => setIsTaskModalOpen(false)}>✕</button>
            </div>
            
            <form className="modal-form" onSubmit={handleAddTodo}>
              <div className="form-group">
                <label>タスク名 *</label>
                <input 
                  type="text" 
                  placeholder="例: 四半期レビューのプレゼン資料作成"
                  value={newTodoTitle}
                  onChange={(e) => setNewTodoTitle(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="form-group">
                <label>詳細 (任意)</label>
                <textarea 
                  placeholder="タスクの詳細な内容、リンク、メモなどを入力..."
                  value={newTodoDesc}
                  onChange={(e) => setNewTodoDesc(e.target.value)}
                  rows="3"
                ></textarea>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>日付</label>
                  <input 
                    type="date" 
                    value={newTodoDate} 
                    onChange={(e) => setNewTodoDate(e.target.value)} 
                  />
                </div>
                
                <div className="form-group">
                  <label>優先度</label>
                  <select 
                    value={newTodoPriority} 
                    onChange={(e) => setNewTodoPriority(e.target.value)}
                  >
                    <option value="low">低 (Low)</option>
                    <option value="medium">中 (Medium)</option>
                    <option value="high">高 (High)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>タグ (カンマ区切りで複数入力)</label>
                <input 
                  type="text" 
                  placeholder="例: デザイン, 会議, クライアントA"
                  value={newTodoTags}
                  onChange={(e) => setNewTodoTags(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsTaskModalOpen(false)}>キャンセル</button>
                <button type="submit" className="btn-submit" disabled={!newTodoTitle.trim()}>作成</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
