"use client";

import { useEffect, useState, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
  Calendar as CalendarIcon,
  CheckCircle,
  Clock,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Target,
  Home as HomeIcon,
  Trash2,
  X,
  Bell,
  Settings,
  MoreVertical,
  Globe,
  Mail,
  FileText,
  Link as LinkIcon,
  BarChart3,
  TrendingDown,
  TrendingUp,
  ExternalLink,
  LogOut
} from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addDays, subDays } from 'date-fns';
import { ja } from 'date-fns/locale';

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE ||
  `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '')}/api`
).replace(/\/$/, '');

export default function Dashboard({ user, onLogout }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Layout states
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'calendar', 'analysis'
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Form states
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [newTodoDesc, setNewTodoDesc] = useState('');
  const [newTodoTags, setNewTodoTags] = useState('');
  const [newTodoPriority, setNewTodoPriority] = useState('medium');
  const [newTodoDate, setNewTodoDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isWelcomeBannerVisible, setIsWelcomeBannerVisible] = useState(true);
  
  // Task detail states
  const [viewingTask, setViewingTask] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Fetch data (with user ID from auth)
  const fetchData = async () => {
    try {
      const res = await fetch(`${API_BASE}/dashboard`, {
        headers: {
          'x-user-id': user?.id || '00000000-0000-0000-0000-000000000000',
        },
      });
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
  }, [user]);

  // Actions
  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;
    const tagsArray = newTodoTags.split(',').map(tag => tag.trim()).filter(Boolean);
    try {
      await fetch(`${API_BASE}/todos`, {
        method: 'POST',
        headers: {
          'x-user-id': user?.id || '00000000-0000-0000-0000-000000000000',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTodoTitle,
          dueDate: newTodoDate,
          description: newTodoDesc,
          tags: tagsArray,
          priority: newTodoPriority
        })
      });
      setNewTodoTitle('');
      setNewTodoDesc('');
      setNewTodoTags('');
      setNewTodoPriority('medium');
      setIsTaskModalOpen(false);
      fetchData();
    } catch (e) { console.error(e); }
  };

  const handleToggleTodo = async (id, currentStatus) => {
    try {
      await fetch(`${API_BASE}/todos/${id}`, {
        method: 'PUT',
        headers: {
          'x-user-id': user?.id || '00000000-0000-0000-0000-000000000000',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: !currentStatus })
      });
      fetchData();
    } catch (e) { console.error(e); }
  };

  const handleDeleteTodo = async (id) => {
    try {
      await fetch(`${API_BASE}/todos/${id}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user?.id || '00000000-0000-0000-0000-000000000000',
        },
      });
      fetchData();
    } catch (e) { console.error(e); }
  };

  const handleDeleteBlacklist = async (domain) => {
    try {
      await fetch(`${API_BASE}/blacklist/${domain}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user?.id || '00000000-0000-0000-0000-000000000000',
        },
      });
      fetchData();
    } catch (e) { console.error(e); }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      onLogout();
    } catch (e) {
      console.error(e);
      onLogout();
    }
  };

  // Calendar Helpers
  const daysInMonth = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const todosOnDay = (date) => {
    if (!data) return [];
    const dateStr = format(date, 'yyyy-MM-dd');
    return data.todos.filter(t => t.dueDate === dateStr);
  };

  if (isLoading) return <div className="loading">読み込み中...</div>;
  if (error) return <div className="error-card">{error}</div>;
  if (!data) return null;

  const chartData = data.history.map(item => ({
    time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    score: item.score
  }));

  const getRelativeDateLabel = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);

    if (isSameDay(target, today)) return { label: '今日', className: 'today' };
    if (isSameDay(target, addDays(today, 1))) return { label: '明日', className: 'tomorrow' };
    if (isSameDay(target, subDays(today, 1))) return { label: '昨日', className: 'overdue' };
    if (target < today) return { label: format(target, 'M/d'), className: 'overdue' };
    return { label: format(target, 'M/d'), className: 'upcoming' };
  };

  // 全てのタスクを表示。未完了を優先し、期限日でソート
  const filteredTodos = [...data.todos].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate) - new Date(b.dueDate);
  });
  const remainingTodosCount = data.todos.filter(t => !t.completed).length;
  const completedPercentage = data.todos.length > 0 ? Math.round((data.todos.filter(t => t.completed).length / data.todos.length) * 100) : 0;

  // Analysis Page Data
  const siteBreakdown = data?.siteBreakdown || [];
  const sortedBreakdown = [...siteBreakdown].sort((a, b) => b.timeSpent - a.timeSpent);
  const totalTimeInMinutes = siteBreakdown.reduce((acc, curr) => acc + curr.timeSpent, 0);
  const totalTimeSeconds = data?.totalTimeSeconds || (totalTimeInMinutes * 60);

  const formatTime = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}時間 ${m}分` : `${m}分`;
  };

  const barChartData = sortedBreakdown.slice(0, 7).map(site => ({
    name: site.domain,
    minutes: site.timeSpent
  }));

  const btcValue = typeof data?.assets?.btc === 'number' ? data.assets.btc : Number(data?.assets?.btc || 0);
  const jpyValue = data?.assets?.jpy || 0;

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Clock size={32} />
          <span>TaskFlow</span>
        </div>

        <button className="btn-new-task-sidebar mb-2" onClick={() => setIsTaskModalOpen(true)}>
          <Plus size={18} />
          <span>新規タスク作成</span>
        </button>

        <div className="text-muted" style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1rem', marginTop: '1.5rem' }}>ワークスペース</div>
        <nav className="sidebar-nav">
          <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <HomeIcon size={18} />
            <span>全てのタスク</span>
            {remainingTodosCount > 0 && <span style={{ marginLeft: 'auto', background: '#5244e1', color: 'white', fontSize: '0.7rem', padding: '1px 6px', borderRadius: '10px' }}>{remainingTodosCount}</span>}
          </div>
          <div className={`nav-item ${activeTab === 'analysis' ? 'active' : ''}`} onClick={() => setActiveTab('analysis')}>
            <BarChart3 size={18} />
            <span>URL分析</span>
          </div>
          <div className={`nav-item ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>
            <CalendarIcon size={18} />
            <span>カレンダー計画</span>
          </div>
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid var(--tf-border)' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              background: 'transparent',
              border: 'none',
              color: '#ef4444',
              cursor: 'pointer',
              fontWeight: 600,
              borderRadius: '8px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => e.target.style.background = '#fee2e2'}
            onMouseLeave={(e) => e.target.style.background = 'transparent'}
          >
            <LogOut size={18} />
            <span>ログアウト</span>
          </button>
        </div>
      </aside>

      <main className="main-layout">
        {/* Top Header */}
        <header className="top-header">
          <div className="header-left"></div>
          <div className="header-right" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>
              {user?.email}
            </div>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5244e1', fontWeight: 800, fontSize: '0.8rem' }}>
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        <div className="content-scroll">
          {activeTab === 'dashboard' && (
            <>
              {/* Welcome Banner */}
              {isWelcomeBannerVisible && (
                <div className="welcome-banner">
                  <div style={{ flex: 1 }}>
                    <h1>お帰りなさい！</h1>
                    <p>今日は {remainingTodosCount} 個のタスクが残っています。頑張りましょう！</p>
                  </div>
                  <button
                    onClick={() => setIsWelcomeBannerVisible(false)}
                    style={{ background: 'transparent', border: 'none', color: 'white', opacity: 0.8, cursor: 'pointer' }}
                  >
                    閉じる ✕
                  </button>
                </div>
              )}

              <div className="dashboard-grid">
                {/* Left Column */}
                <div className="dashboard-left">
                  <section className="glass-card mb-2">
                    <div className="card-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ background: '#5244e1', padding: '6px', borderRadius: '8px', color: 'white' }}>
                          <FileText size={18} />
                        </div>
                        <h2>全てのタスク</h2>
                      </div>
                      <span className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600 }}>{format(new Date(selectedDate), 'yyyy年 M月 d日', { locale: ja })}</span>
                    </div>

                    <ul className="todo-list">
                      {filteredTodos.map(todo => (
                        <li key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
                          <div className="checkbox-custom" onClick={() => handleToggleTodo(todo.id, todo.completed)}>
                            {todo.completed && <CheckCircle size={18} color="white" fill="white" />}
                          </div>
                          <div 
                            className="todo-content-wrapper" 
                            style={{ flex: 1, cursor: 'pointer' }}
                            onClick={() => {
                              setViewingTask(todo);
                              setIsDetailModalOpen(true);
                            }}
                          >
                            <span className="todo-text" style={{ fontWeight: 700, fontSize: '0.95rem' }}>{todo.title}</span>
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.25rem' }}>
                              {todo.tags?.map(tag => <span key={tag} className="tag" style={{ textTransform: 'uppercase' }}>{tag}</span>)}
                              {todo.dueDate && (() => {
                                const rel = getRelativeDateLabel(todo.dueDate);
                                return (
                                  <span className={`date-badge ${rel.className}`}>
                                    <Clock size={12} /> {rel.label}
                                  </span>
                                );
                              })()}
                            </div>
                            {todo.description && <div className="todo-description text-muted" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>{todo.description}</div>}
                          </div>
                          <div className="flex gap-2 items-center">
                            <Trash2 size={18} className="text-muted cursor-pointer hover:text-red-500" onClick={() => handleDeleteTodo(todo.id)} />
                            <MoreVertical size={18} className="text-muted cursor-pointer" />
                          </div>
                        </li>
                      ))}
                      {filteredTodos.length === 0 && <li className="text-muted text-center py-4">この日のタスクはありません。</li>}
                      <div className="mt-2 text-center">
                        <button className="text-muted cursor-pointer" onClick={() => setIsTaskModalOpen(true)} style={{ background: 'transparent', border: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', margin: '0 auto' }}>
                          <Plus size={16} /> タスクを追加
                        </button>
                      </div>
                    </ul>
                  </section>
                </div>

                {/* Right Column */}
                <div className="dashboard-right">
                  <section className="glass-card mb-2" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ background: '#5244e1', color: 'white', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <ChevronLeft size={20} className="cursor-pointer" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} />
                      <span style={{ fontWeight: 800 }}>{format(currentMonth, 'yyyy年 M月', { locale: ja })}</span>
                      <ChevronRight size={20} className="cursor-pointer" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} />
                    </div>
                    <div style={{ padding: '1.5rem' }}>
                      <div className="calendar-grid">
                        {['日', '月', '火', '水', '木', '金', '土'].map(d => (
                          <div key={d} className="calendar-day-label">{d}</div>
                        ))}
                        {daysInMonth.map((day, idx) => {
                          const dateStr = format(day, 'yyyy-MM-dd');
                          const isActive = selectedDate === dateStr;
                          const dayTodos = todosOnDay(day);
                          const hasTodos = dayTodos.length > 0;
                          
                          // 最高優先度を判定
                          let maxPriority = 'low';
                          if (dayTodos.some(t => t.priority === 'high')) maxPriority = 'high';
                          else if (dayTodos.some(t => t.priority === 'medium')) maxPriority = 'medium';

                          return (
                            <div
                              key={idx}
                              className={`calendar-cell ${isActive ? 'active' : ''} ${isSameDay(day, new Date()) ? 'today' : ''} ${hasTodos ? 'has-tasks' : ''}`}
                              onClick={() => setSelectedDate(dateStr)}
                              style={{ color: !isSameMonth(day, currentMonth) ? '#ccc' : 'inherit' }}
                            >
                              {format(day, 'd')}
                              {hasTodos && <div className={`task-indicator-dot priority-${maxPriority}`}></div>}
                              {hasTodos && dayTodos.length > 1 && <div className="task-count-badge-mini">{dayTodos.length}</div>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </section>

                  <section className="score-summary-card" style={{ background: '#e0e7ff', color: '#5244e1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                      <Target size={20} />
                      <h2 style={{ margin: 0, fontSize: '1rem', color: '#5244e1' }}>プロダクティビティスコア</h2>
                    </div>
                    <div className="progress-bar" style={{ background: 'rgba(82, 68, 225, 0.1)' }}>
                      <div className="progress-fill" style={{ width: `${completedPercentage}%`, background: '#5244e1' }}></div>
                    </div>
                    <p style={{ fontSize: '0.75rem', fontWeight: 600, margin: 0 }}>週目標の {completedPercentage}% を達成しました。次の目標まであと3つのタスクです！</p>
                  </section>

                  <section className="glass-card">
                    <div className="card-header">
                      <h2>スコア履歴</h2>
                    </div>
                    <div style={{ height: 150 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <Line type="monotone" dataKey="score" stroke="#5244e1" strokeWidth={3} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </section>
                </div>
              </div>
            </>
          )}

          {activeTab === 'analysis' && (
            <div className="analysis-view animate-fade-in">
              <div className="analysis-header mb-2">
                <h1>URL Usage Summary</h1>
                <p className="text-muted">Analyze your digital habits and optimize focus time.</p>
              </div>

              <div className="analysis-summary-grid mb-2">
                <div className="summary-stat-card">
                  <span className="label">Total Screen Time</span>
                  <div className="value-group">
                    <span className="value">{formatTime(totalTimeInMinutes)}</span>
                    <span className="trend positive"><TrendingUp size={14} /> 4%</span>
                  </div>
                </div>
                <div className="summary-stat-card">
                  <span className="label">JPY Loss (Potential)</span>
                  <div className="value-group">
                    <span className="value">¥{jpyValue.toLocaleString()}</span>
                    <span className="trend negative"><TrendingDown size={14} /> 12%</span>
                  </div>
                </div>
                <div className="summary-stat-card">
                  <span className="label">BTC Loss (Potential)</span>
                  <div className="value-group">
                    <span className="value">{btcValue.toFixed(6)} BTC</span>
                  </div>
                </div>
                <div className="summary-stat-card">
                  <span className="label">Most Visited</span>
                  <div className="value-group">
                    <span className="value" style={{ fontSize: '1.1rem' }}>{sortedBreakdown[0]?.domain || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="analysis-main-grid">
                <section className="glass-card chart-section">
                  <div className="card-header">
                    <h2>Time Spent per Domain</h2>
                  </div>
                  <div style={{ height: 350, marginTop: '1rem' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barChartData} layout="vertical" margin={{ left: 20, right: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                          formatter={(value) => [`${value} min`, 'Usage Time']}
                        />
                        <Bar dataKey="minutes" radius={[0, 4, 4, 0]} barSize={24}>
                          {barChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#5244e1' : '#a5b4fc'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                <section className="glass-card table-section">
                  <div className="card-header" style={{ marginBottom: '1.5rem' }}>
                    <h2>Top Domains Detail</h2>
                  </div>
                  <div className="domain-table-container">
                    <table className="domain-table">
                      <thead>
                        <tr>
                          <th>DOMAIN</th>
                          <th>TIME SPENT</th>
                          <th>PERCENTAGE</th>
                          <th>ACTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedBreakdown.map((site) => (
                          <tr key={site.domain}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div className="domain-icon-wrapper">
                                  <Globe size={14} />
                                </div>
                                <span style={{ fontWeight: 700 }}>{site.domain}</span>
                              </div>
                            </td>
                            <td style={{ fontWeight: 600 }}>{formatTime(site.timeSpent)}</td>
                            <td>
                              <div className="percentage-container">
                                <div className="percentage-bar">
                                  <div className="percentage-fill" style={{ width: `${Math.round((site.timeSpent / totalTimeInMinutes) * 100)}%` }}></div>
                                </div>
                                <span className="percentage-text">{Math.round((site.timeSpent / totalTimeInMinutes) * 100)}%</span>
                              </div>
                            </td>
                            <td>
                              <button className="btn-domain-action" onClick={() => window.open(`https://${site.domain}`, '_blank')}>
                                <ExternalLink size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="detailed-calendar">
              <div className="card-header">
                <h2>カレンダー</h2>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <ChevronLeft className="cursor-pointer" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} />
                  <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>{format(currentMonth, 'yyyy年 M月', { locale: ja })}</span>
                  <ChevronRight className="cursor-pointer" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} />
                </div>
              </div>
              <div className="full-calendar-grid">
                {['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'].map(d => (
                  <div key={d} className="calendar-day-label" style={{ padding: '1rem', borderBottom: '1px solid var(--tf-border)' }}>{d}</div>
                ))}
                {daysInMonth.map((day, idx) => {
                  const dayTodos = todosOnDay(day);
                  return (
                    <div key={idx} className={`full-calendar-cell ${!isSameMonth(day, currentMonth) ? 'bg-slate-50 opacity-40' : ''}`} onClick={() => { setSelectedDate(format(day, 'yyyy-MM-dd')); }}>
                      <div className="full-calendar-day-num">{format(day, 'd')}</div>
                      <div className="full-calendar-tasks">
                        {dayTodos.slice(0, 3).map(todo => (
                          <div 
                            key={todo.id} 
                            className={`calendar-task-badge ${todo.completed ? 'completed' : ''}`} 
                            style={{ borderLeftColor: todo.priority === 'high' ? '#ef4444' : todo.priority === 'medium' ? '#f59e0b' : '#10b981', cursor: 'pointer' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingTask(todo);
                              setIsDetailModalOpen(true);
                            }}
                          >
                            {todo.title}
                          </div>
                        ))}
                        {dayTodos.length > 3 && <div className="text-muted" style={{ fontSize: '0.6rem' }}>他 {dayTodos.length - 3} 件</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Task Creation Modal */}
      {isTaskModalOpen && (
        <div className="modal-overlay" onClick={() => setIsTaskModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>新規タスク作成</h2>
              <X className="cursor-pointer text-muted" onClick={() => setIsTaskModalOpen(false)} />
            </div>
            <form onSubmit={handleAddTodo} className="modal-form">
              <div className="form-group">
                <label>タスク名</label>
                <input type="text" value={newTodoTitle} onChange={(e) => setNewTodoTitle(e.target.value)} placeholder="タスク名を入力..." required />
              </div>
              <div className="form-group">
                <label>詳細説明</label>
                <textarea value={newTodoDesc} onChange={(e) => setNewTodoDesc(e.target.value)} placeholder="詳細を入力..." rows="3" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>期限日</label>
                  <input type="date" value={newTodoDate} onChange={(e) => setNewTodoDate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>優先度</label>
                  <select value={newTodoPriority} onChange={(e) => setNewTodoPriority(e.target.value)}>
                    <option value="low">低</option>
                    <option value="medium">中</option>
                    <option value="high">高</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>タグ (カンマ区切り)</label>
                <input type="text" value={newTodoTags} onChange={(e) => setNewTodoTags(e.target.value)} placeholder="仕事, UI, バグ" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsTaskModalOpen(false)}>キャンセル</button>
                <button type="submit" className="btn-submit">作成</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {isDetailModalOpen && viewingTask && (
        <div className="modal-overlay" onClick={() => setIsDetailModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className={`priority-badge-${viewingTask.priority}`}>
                  {viewingTask.priority === 'high' ? '高' : viewingTask.priority === 'low' ? '低' : '中'}
                </span>
                <h2 style={{ margin: 0 }}>タスク詳細</h2>
              </div>
              <X className="cursor-pointer text-muted" onClick={() => setIsDetailModalOpen(false)} />
            </div>
            
            <div className="task-detail-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--tf-text-muted)', fontWeight: 600 }}>タスク名</label>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.4rem' }}>{viewingTask.title}</div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--tf-text-muted)', fontWeight: 600 }}>期限</label>
                <div style={{ marginTop: '0.4rem' }}>
                  {viewingTask.dueDate ? (() => {
                    const rel = getRelativeDateLabel(viewingTask.dueDate);
                    return (
                      <span className={`date-badge ${rel.className}`} style={{ fontSize: '0.9rem', padding: '4px 12px' }}>
                        <Clock size={14} /> {viewingTask.dueDate} ({rel.label})
                      </span>
                    );
                  })() : <span className="text-muted">未設定</span>}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--tf-text-muted)', fontWeight: 600 }}>詳細</label>
                <div style={{ marginTop: '0.4rem', color: '#4b5563', lineHeight: 1.6 }}>
                  {viewingTask.description || <span className="text-muted">（説明はありません）</span>}
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: '1.5rem', borderTop: '1px solid var(--tf-border)', paddingTop: '1.5rem' }}>
                <button 
                  className="btn-cancel" 
                  style={{ marginRight: 'auto', color: 'var(--tf-accent-red)', borderColor: 'var(--tf-accent-red)' }}
                  onClick={() => {
                    handleDeleteTodo(viewingTask.id);
                    setIsDetailModalOpen(false);
                  }}
                >
                  削除する
                </button>
                <button 
                  className="btn-submit" 
                  style={{ background: viewingTask.completed ? 'var(--tf-text-muted)' : 'var(--tf-primary)' }}
                  onClick={() => {
                    handleToggleTodo(viewingTask.id, viewingTask.completed);
                    setIsDetailModalOpen(false);
                  }}
                >
                  {viewingTask.completed ? '未完了に戻す' : '完了にする'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .analysis-view {
          padding-bottom: 2rem;
        }
        .analysis-header h1 {
          font-size: 1.75rem;
          font-weight: 800;
          color: #1a1d35;
          margin-bottom: 0.25rem;
        }
        .analysis-summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
        }
        .summary-stat-card {
          background: white;
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
          border: 1px solid #f0f0f0;
        }
        .summary-stat-card .label {
          font-size: 0.8rem;
          font-weight: 700;
          color: #8a8e9e;
          text-transform: uppercase;
          margin-bottom: 0.75rem;
          display: block;
        }
        .summary-stat-card .value-group {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .summary-stat-card .value {
          font-size: 1.4rem;
          font-weight: 800;
          color: #1a1d35;
        }
        .trend {
          font-size: 0.75rem;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .trend.positive { background: #ecfdf5; color: #10b981; }
        .trend.negative { background: #fef2f2; color: #ef4444; }

        .analysis-main-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .domain-table {
          width: 100%;
          border-collapse: collapse;
        }
        .domain-table th {
          text-align: left;
          padding: 1rem;
          font-size: 0.75rem;
          font-weight: 800;
          color: #8a8e9e;
          text-transform: uppercase;
          border-bottom: 1px solid #f0f0f0;
        }
        .domain-table td {
          padding: 1rem;
          border-bottom: 1px solid #f0f0f0;
          font-size: 0.9rem;
        }
        .domain-icon-wrapper {
          width: 32px;
          height: 32px;
          background: #f3f5f9;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #5244e1;
        }
        .percentage-container {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .percentage-bar {
          flex: 1;
          height: 6px;
          background: #f3f5f9;
          border-radius: 3px;
          overflow: hidden;
        }
        .percentage-fill {
          height: 100%;
          background: #5244e1;
          border-radius: 3px;
        }
        .percentage-text {
          font-size: 0.75rem;
          font-weight: 800;
          color: #8a8e9e;
          min-width: 30px;
        }
        .btn-domain-action {
          background: #f3f5f9;
          border: none;
          color: #8a8e9e;
          padding: 6px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-domain-action:hover {
          background: #e0e7ff;
          color: #5244e1;
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
