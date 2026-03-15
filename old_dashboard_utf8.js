"use client";

import { useEffect, useState, useMemo, useRef } from 'react';
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
  LogOut,
  LoaderCircle
} from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addDays, subDays } from 'date-fns';
import { ja } from 'date-fns/locale';

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE ||
  (process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')}/api`
    : '/api')
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
  
  const [isCreatingTodo, setIsCreatingTodo] = useState(false);
  const [deletingTodoId, setDeletingTodoId] = useState(null);
  const [togglingTodoMap, setTogglingTodoMap] = useState({});
  const latestFetchRequestIdRef = useRef(0);
  const togglingTodoSetRef = useRef(new Set());

  // Task detail states
  const [viewingTask, setViewingTask] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Fetch data (with user ID from auth)
  const fetchData = async () => {
    const requestId = ++latestFetchRequestIdRef.current;
    try {
      const res = await fetch(`${API_BASE}/dashboard`, {
        headers: {
          'x-user-id': user?.id || '00000000-0000-0000-0000-000000000000',
        },
      });
      if (!res.ok) throw new Error('API request failed');
      const json = await res.json();
      if (requestId !== latestFetchRequestIdRef.current) return;
      setData(json);
      setError(null);
    } catch (err) {
      if (requestId !== latestFetchRequestIdRef.current) return;
      console.error(err);
      setError('API縺ｫ謗･邯壹〒縺阪∪縺帙ｓ縲ゅヰ繝・け繧ｨ繝ｳ繝峨′襍ｷ蜍輔＠縺ｦ縺・ｋ縺狗｢ｺ隱阪＠縺ｦ縺上□縺輔＞縲・);
    } finally {
      if (requestId !== latestFetchRequestIdRef.current) return;
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
    if (!newTodoTitle.trim() || isCreatingTodo) return;
    const tagsArray = newTodoTags.split(',').map(tag => tag.trim()).filter(Boolean);
    setIsCreatingTodo(true);
    try {
      const response = await fetch(`${API_BASE}/todos`, {
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

      if (!response.ok) {
        throw new Error('Todo creation failed');
      }

      await new Promise((resolve) => setTimeout(resolve, 1800));

      setNewTodoTitle('');
      setNewTodoDesc('');
      setNewTodoTags('');
      setNewTodoPriority('medium');
      setIsTaskModalOpen(false);
      fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsCreatingTodo(false);
    }
  };

  const handleToggleTodo = async (id, currentStatus) => {
    if (!id) return;
    if (togglingTodoSetRef.current.has(id)) return;

    const nextCompleted = !currentStatus;
    togglingTodoSetRef.current.add(id);
    setTogglingTodoMap((prev) => ({ ...prev, [id]: true }));

    // 讌ｽ隕ｳ譖ｴ譁ｰ: 蜈医↓UI蜿肴丐縺励※菴捺─騾溷ｺｦ繧剃ｸ翫￡繧・    setData((prev) => {
      if (!prev) return prev;
      const todos = Array.isArray(prev.todos) ? prev.todos : [];
      return {
        ...prev,
        todos: todos.map((todo) =>
          todo.id === id ? { ...todo, completed: nextCompleted } : todo
        ),
      };
    });

    setViewingTask((prev) => {
      if (!prev || prev.id !== id) return prev;
      return { ...prev, completed: nextCompleted };
    });

    try {
      const response = await fetch(`${API_BASE}/todos/${id}`, {
        method: 'PUT',
        headers: {
          'x-user-id': user?.id || '00000000-0000-0000-0000-000000000000',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: nextCompleted })
      });

      if (!response.ok) {
        throw new Error('Todo toggle failed');
      }

      // 繧ｵ繝ｼ繝舌・縺ｮ豁｣譛ｬ縺ｧ蜷梧悄
      fetchData();
    } catch (e) {
      console.error(e);

      // 螟ｱ謨玲凾縺ｯ繝ｭ繝ｼ繝ｫ繝舌ャ繧ｯ
      setData((prev) => {
        if (!prev) return prev;
        const todos = Array.isArray(prev.todos) ? prev.todos : [];
        return {
          ...prev,
          todos: todos.map((todo) =>
            todo.id === id ? { ...todo, completed: currentStatus } : todo
          ),
        };
      });

      setViewingTask((prev) => {
        if (!prev || prev.id !== id) return prev;
        return { ...prev, completed: currentStatus };
      });
    } finally {
      togglingTodoSetRef.current.delete(id);
      setTogglingTodoMap((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const handleDeleteTodo = async (id) => {
    if (!id || deletingTodoId === id) return;
    setDeletingTodoId(id);
    try {
      const response = await fetch(`${API_BASE}/todos/${id}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user?.id || '00000000-0000-0000-0000-000000000000',
        },
      });

      if (!response.ok) {
        throw new Error('Todo delete failed');
      }

      await new Promise((resolve) => setTimeout(resolve, 10000));

      fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingTodoId(null);
    }
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

  if (isLoading) return <div className="loading">隱ｭ縺ｿ霎ｼ縺ｿ荳ｭ...</div>;
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

    if (isSameDay(target, today)) return { label: '莉頑律', className: 'today' };
    if (isSameDay(target, addDays(today, 1))) return { label: '譏取律', className: 'tomorrow' };
    if (isSameDay(target, subDays(today, 1))) return { label: '譏ｨ譌･', className: 'overdue' };
    if (target < today) return { label: format(target, 'M/d'), className: 'overdue' };
    return { label: format(target, 'M/d'), className: 'upcoming' };
  };

  // mini-calendar 縺ｧ驕ｸ謚槭＠縺滓律莉倥・繧ｿ繧ｹ繧ｯ縺ｮ縺ｿ繧定｡ｨ遉ｺ縺励∵悴螳御ｺ・→蜆ｪ蜈亥ｺｦ繧剃ｸ贋ｽ阪↓荳ｦ縺ｹ繧・  const filteredTodos = data.todos
    .filter((todo) => todo.dueDate === selectedDate)
    .sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;

      const priorityRank = { high: 0, medium: 1, low: 2 };
      const aPriority = priorityRank[a.priority] ?? 3;
      const bPriority = priorityRank[b.priority] ?? 3;
      if (aPriority !== bPriority) return aPriority - bPriority;

      return (a.title || '').localeCompare(b.title || '', 'ja');
    });
  const selectedDateRemainingCount = filteredTodos.filter((todo) => !todo.completed).length;
  const remainingTodosCount = data.todos.filter(t => !t.completed).length;

  const missionProgress = data?.missionProgress || {};
  const goalTargets = Array.isArray(missionProgress.goals) && missionProgress.goals.length > 0
    ? missionProgress.goals
    : [3, 5];
  const primaryGoal = goalTargets[0] || 3;
  const secondaryGoal = goalTargets[1] || 5;

  const fallbackCompletedLifetime = data.todos.filter((todo) => todo.completed).length;
  const completedLifetime = Number.isFinite(missionProgress.completedLifetime)
    ? missionProgress.completedLifetime
    : fallbackCompletedLifetime;
  const createdLifetime = Number.isFinite(missionProgress.createdLifetime)
    ? missionProgress.createdLifetime
    : Math.max(data.todos.length, completedLifetime);

  const activeTarget = Number.isFinite(missionProgress.activeTarget)
    ? missionProgress.activeTarget
    : (completedLifetime < primaryGoal ? primaryGoal : secondaryGoal);
  const activeProgress = Number.isFinite(missionProgress.activeProgress)
    ? missionProgress.activeProgress
    : Math.min(100, Math.round((completedLifetime / Math.max(activeTarget, 1)) * 100));

  const primaryGoalAchieved = completedLifetime >= primaryGoal;
  const secondaryGoalAchieved = completedLifetime >= secondaryGoal;

  // Analysis Page Data
  const siteBreakdown = data?.siteBreakdown || [];
  const sortedBreakdown = [...siteBreakdown].sort((a, b) => b.timeSpent - a.timeSpent);
  const totalTimeInMinutes = siteBreakdown.reduce((acc, curr) => acc + curr.timeSpent, 0);
  const totalTimeSeconds = data?.totalTimeSeconds || (totalTimeInMinutes * 60);

  const formatTime = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}譎る俣 ${m}蛻・ : `${m}蛻・;
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
          <span>Focus Quest</span>
        </div>

        <button className="btn-new-task-sidebar mb-2" onClick={() => setIsTaskModalOpen(true)}>
          <Plus size={18} />
          <span>譁ｰ隕上ち繧ｹ繧ｯ菴懈・</span>
        </button>

        <div className="sidebar-label">繝ｯ繝ｼ繧ｯ繧ｹ繝壹・繧ｹ</div>
        <nav className="sidebar-nav">
          <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <HomeIcon size={18} />
            <span>繝溘ャ繧ｷ繝ｧ繝ｳ荳隕ｧ</span>
            {remainingTodosCount > 0 && <span className="nav-count-pill">{remainingTodosCount}</span>}
          </div>
          <div className={`nav-item ${activeTab === 'analysis' ? 'active' : ''}`} onClick={() => setActiveTab('analysis')}>
            <BarChart3 size={18} />
            <span>髮・ｸｭ繝ｭ繧ｰ蛻・梵</span>
          </div>
          <div className={`nav-item ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>
            <CalendarIcon size={18} />
            <span>繧ｫ繝ｬ繝ｳ繝繝ｼ險育判</span>
          </div>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="btn-logout">
            <LogOut size={18} />
            <span>繝ｭ繧ｰ繧｢繧ｦ繝・/span>
          </button>
        </div>
      </aside>

      <main className="main-layout">
        {/* Top Header */}
        <header className="top-header">
          <div className="header-left"></div>
          <div className="header-right">
            <div className="header-email">
              {user?.email}
            </div>
            <div className="header-avatar">
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
                  <div className="welcome-copy">
                    <h1>莉頑律縺ｮ繝輔か繝ｼ繧ｫ繧ｹ繧ｯ繧ｨ繧ｹ繝・/h1>
                    <p>譛ｪ螳御ｺ・Α繝・す繝ｧ繝ｳ縺ｯ {remainingTodosCount} 莉ｶ縲ゅ∪縺壹・ 1 莉ｶ繧ｯ繝ｪ繧｢縺励※蜍｢縺・ｒ菴懊ｍ縺・・/p>
                  </div>
                  <button onClick={() => setIsWelcomeBannerVisible(false)} className="welcome-close-btn">
                    髢峨§繧・笨・                  </button>
                </div>
              )}

              <div className="dashboard-grid">
                {/* Left Column */}
                <div className="dashboard-left">
                  <section className="glass-card mb-2">
                    <div className="card-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="task-card-icon">
                          <FileText size={18} />
                        </div>
                        <h2>{format(new Date(`${selectedDate}T00:00:00`), 'M譛・d譌･', { locale: ja })} 縺ｮ繝溘ャ繧ｷ繝ｧ繝ｳ</h2>
                      </div>
                      <div className="mission-head-right">
                        <span className="mission-count-pill">谿九ｊ {selectedDateRemainingCount} 莉ｶ</span>
                        <span className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                          {format(new Date(`${selectedDate}T00:00:00`), 'yyyy蟷ｴ M譛・d譌･ (E)', { locale: ja })}
                        </span>
                      </div>
                    </div>

                    <ul className="todo-list">
                      {filteredTodos.map(todo => (
                        <li key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
                          <div
                            className="checkbox-custom"
                            onClick={() => !togglingTodoMap[todo.id] && handleToggleTodo(todo.id, todo.completed)}
                            style={{ opacity: togglingTodoMap[todo.id] ? 0.7 : 1, pointerEvents: togglingTodoMap[todo.id] ? 'none' : 'auto' }}
                          >
                            {togglingTodoMap[todo.id] ? (
                              <LoaderCircle size={16} />
                            ) : (
                              todo.completed && <CheckCircle size={18} color="white" fill="white" />
                            )}
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
                            {deletingTodoId === todo.id ? (
                              <span className="status-inline">
                                <LoaderCircle size={16} /> 蜑企勁荳ｭ...
                              </span>
                            ) : (
                              <Trash2 size={18} className="text-muted cursor-pointer hover:text-red-500" onClick={() => handleDeleteTodo(todo.id)} />
                            )}
                            <MoreVertical size={18} className="text-muted cursor-pointer" />
                          </div>
                        </li>
                      ))}
                      {filteredTodos.length === 0 && (
                        <li className="mission-empty-state">
                          縺薙・譌･縺ｯ縺ｾ縺繝溘ャ繧ｷ繝ｧ繝ｳ縺後≠繧翫∪縺帙ｓ縲ょ承縺ｮ繧ｫ繝ｬ繝ｳ繝繝ｼ縺ｧ蛻･譌･繧帝∈縺ｶ縺九√％縺ｮ譌･縺ｫ譁ｰ隕上ち繧ｹ繧ｯ繧定ｿｽ蜉縺励∪縺励ｇ縺・・                        </li>
                      )}
                      <div className="mt-2 text-center">
                        <button className="add-task-inline" onClick={() => setIsTaskModalOpen(true)}>
                          <Plus size={16} /> 縺薙・譌･縺ｫ繧ｿ繧ｹ繧ｯ繧定ｿｽ蜉
                        </button>
                      </div>
                    </ul>
                  </section>
                </div>

                {/* Right Column */}
                <div className="dashboard-right">
                  <section className="glass-card mini-calendar-card mb-2">
                    <div className="mini-calendar-header">
                      <ChevronLeft size={20} className="cursor-pointer" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} />
                      <span className="mini-calendar-title">{format(currentMonth, 'yyyy蟷ｴ M譛・, { locale: ja })}</span>
                      <ChevronRight size={20} className="cursor-pointer" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} />
                    </div>
                    <div className="mini-calendar-body">
                      <div className="calendar-grid">
                        {['譌･', '譛・, '轣ｫ', '豌ｴ', '譛ｨ', '驥・, '蝨・].map(d => (
                          <div key={d} className="calendar-day-label">{d}</div>
                        ))}
                        {daysInMonth.map((day, idx) => {
                          const dateStr = format(day, 'yyyy-MM-dd');
                          const isActive = selectedDate === dateStr;
                          const dayTodos = todosOnDay(day);
                          const hasTodos = dayTodos.length > 0;

                          // 譛鬮伜━蜈亥ｺｦ繧貞愛螳・                          let maxPriority = 'low';
                          if (dayTodos.some(t => t.priority === 'high')) maxPriority = 'high';
                          else if (dayTodos.some(t => t.priority === 'medium')) maxPriority = 'medium';

                          return (
                            <div
                              key={idx}
                              className={`calendar-cell ${isActive ? 'active' : ''} ${isSameDay(day, new Date()) ? 'today' : ''} ${hasTodos ? 'has-tasks' : ''}`}
                              onClick={() => setSelectedDate(dateStr)}
                              style={{ color: !isSameMonth(day, currentMonth) ? 'var(--tf-text-faint)' : 'inherit' }}
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

                  <section className="score-summary-card">
                    <div className="score-summary-head">
                      <Target size={20} />
                      <h2>蝗ｺ螳夂岼讓吶メ繝｣繝ｬ繝ｳ繧ｸ</h2>
                    </div>
                    <div className="score-goal-chip-wrap">
                      <span className={`goal-chip ${primaryGoalAchieved ? 'done' : ''}`}>{primaryGoal}莉ｶ繧ｯ繝ｪ繧｢</span>
                      <span className={`goal-chip ${secondaryGoalAchieved ? 'done' : ''}`}>{secondaryGoal}莉ｶ繧ｯ繝ｪ繧｢</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${activeProgress}%` }}></div>
                    </div>
                    <p>
                      谺｡縺ｮ逶ｮ讓吶・ {activeTarget} 莉ｶ繧ｯ繝ｪ繧｢縲るｲ謐励・ {activeProgress}%縲・                      邏ｯ險医け繝ｪ繧｢ {completedLifetime} 莉ｶ / 邏ｯ險井ｽ懈・ {createdLifetime} 莉ｶ縺ｧ陦悟虚繧定ｩ穂ｾ｡縺励∪縺吶・                    </p>
                  </section>

                  <section className="glass-card">
                    <div className="card-header">
                      <h2>繧ｹ繧ｳ繧｢螻･豁ｴ</h2>
                    </div>
                    <div style={{ height: 150 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <Line type="monotone" dataKey="score" stroke="var(--tf-primary)" strokeWidth={3} dot={false} />
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
                <h1>髮・ｸｭ繝ｭ繧ｰ繧ｵ繝槭Μ繝ｼ</h1>
                <p className="text-muted">SNS縺ｮ菴ｿ縺・婿繧貞庄隕門喧縺励※縲∝級蠑ｷ譎る俣繧貞叙繧頑綾縺昴≧縲・/p>
              </div>

              <div className="analysis-summary-grid mb-2">
                <div className="summary-stat-card">
                  <span className="label">邱上せ繧ｯ繝ｪ繝ｼ繝ｳ譎る俣</span>
                  <div className="value-group">
                    <span className="value">{formatTime(totalTimeInMinutes)}</span>
                    <span className="trend positive"><TrendingUp size={14} /> 4%</span>
                  </div>
                </div>
                <div className="summary-stat-card">
                  <span className="label">貎懷惠繝ｭ繧ｹ (JPY)</span>
                  <div className="value-group">
                    <span className="value">ﾂ･{jpyValue.toLocaleString()}</span>
                    <span className="trend negative"><TrendingDown size={14} /> 12%</span>
                  </div>
                </div>
                <div className="summary-stat-card">
                  <span className="label">貎懷惠繝ｭ繧ｹ (BTC)</span>
                  <div className="value-group">
                    <span className="value">{btcValue.toFixed(6)} BTC</span>
                  </div>
                </div>
                <div className="summary-stat-card">
                  <span className="label">譛髟ｷ貊槫惠繧ｵ繧､繝・/span>
                  <div className="value-group">
                    <span className="value value-domain">{sortedBreakdown[0]?.domain || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="analysis-main-grid">
                <section className="glass-card chart-section">
                  <div className="card-header">
                    <h2>繝峨Γ繧､繝ｳ蛻･縺ｮ貊槫惠譎る俣</h2>
                  </div>
                  <div style={{ height: 350, marginTop: '1rem' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barChartData} layout="vertical" margin={{ left: 20, right: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(148, 163, 184, 0.32)" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                          formatter={(value) => [`${value} 蛻・, '貊槫惠譎る俣']}
                        />
                        <Bar dataKey="minutes" radius={[0, 4, 4, 0]} barSize={24}>
                          {barChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#0f766e' : '#9ecfc6'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                <section className="glass-card table-section">
                  <div className="card-header" style={{ marginBottom: '1.5rem' }}>
                    <h2>繝峨Γ繧､繝ｳ隧ｳ邏ｰ</h2>
                  </div>
                  <div className="domain-table-container">
                    <table className="domain-table">
                      <thead>
                        <tr>
                          <th>繝峨Γ繧､繝ｳ</th>
                          <th>貊槫惠譎る俣</th>
                          <th>蜑ｲ蜷・/th>
                          <th>謫堺ｽ・/th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedBreakdown.map((site) => (
                          <tr key={site.domain}>
                            <td>
                              <div className="domain-cell-main">
                                <div className="domain-icon-wrapper">
                                  <Globe size={14} />
                                </div>
                                <span className="domain-name">{site.domain}</span>
                              </div>
                            </td>
                            <td className="domain-time">{formatTime(site.timeSpent)}</td>
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
                <h2>譛磯俣繝溘ャ繧ｷ繝ｧ繝ｳ繧ｫ繝ｬ繝ｳ繝繝ｼ</h2>
                <div className="calendar-nav-control">
                  <ChevronLeft className="cursor-pointer" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} />
                  <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>{format(currentMonth, 'yyyy蟷ｴ M譛・, { locale: ja })}</span>
                  <ChevronRight className="cursor-pointer" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} />
                </div>
              </div>
              <div className="full-calendar-grid">
                {['譌･譖懈律', '譛域屆譌･', '轣ｫ譖懈律', '豌ｴ譖懈律', '譛ｨ譖懈律', '驥第屆譌･', '蝨滓屆譌･'].map(d => (
                  <div key={d} className="calendar-day-label full-calendar-day-label">{d}</div>
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
                            style={{ borderLeftColor: todo.priority === 'high' ? 'var(--tf-accent-red)' : todo.priority === 'medium' ? 'var(--tf-accent-amber)' : 'var(--tf-accent-lime)', cursor: 'pointer' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingTask(todo);
                              setIsDetailModalOpen(true);
                            }}
                          >
                            {todo.title}
                          </div>
                        ))}
                        {dayTodos.length > 3 && <div className="text-muted" style={{ fontSize: '0.6rem' }}>莉・{dayTodos.length - 3} 莉ｶ</div>}
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
        <div className="modal-overlay" onClick={() => !isCreatingTodo && setIsTaskModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>譁ｰ隕上ち繧ｹ繧ｯ菴懈・</h2>
              <X className="cursor-pointer text-muted" onClick={() => !isCreatingTodo && setIsTaskModalOpen(false)} />
            </div>
            <form onSubmit={handleAddTodo} className="modal-form">
              {isCreatingTodo && (
                <div className="saving-banner">
                  <LoaderCircle size={18} />
                  <span>繧ｿ繧ｹ繧ｯ繧剃ｿ晏ｭ倥＠縺ｦ縺・∪縺・..</span>
                </div>
              )}
              <div className="form-group">
                <label>繧ｿ繧ｹ繧ｯ蜷・/label>
                <input type="text" value={newTodoTitle} onChange={(e) => setNewTodoTitle(e.target.value)} placeholder="繧ｿ繧ｹ繧ｯ蜷阪ｒ蜈･蜉・.." required disabled={isCreatingTodo} />
              </div>
              <div className="form-group">
                <label>隧ｳ邏ｰ隱ｬ譏・/label>
                <textarea value={newTodoDesc} onChange={(e) => setNewTodoDesc(e.target.value)} placeholder="隧ｳ邏ｰ繧貞・蜉・.." rows="3" disabled={isCreatingTodo} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>譛滄剞譌･</label>
                  <input type="date" value={newTodoDate} onChange={(e) => setNewTodoDate(e.target.value)} disabled={isCreatingTodo} />
                </div>
                <div className="form-group">
                  <label>蜆ｪ蜈亥ｺｦ</label>
                  <select value={newTodoPriority} onChange={(e) => setNewTodoPriority(e.target.value)} disabled={isCreatingTodo}>
                    <option value="low">菴・/option>
                    <option value="medium">荳ｭ</option>
                    <option value="high">鬮・/option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>繧ｿ繧ｰ (繧ｫ繝ｳ繝槫玄蛻・ｊ)</label>
                <input type="text" value={newTodoTags} onChange={(e) => setNewTodoTags(e.target.value)} placeholder="莉穂ｺ・ UI, 繝舌げ" disabled={isCreatingTodo} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsTaskModalOpen(false)} disabled={isCreatingTodo}>繧ｭ繝｣繝ｳ繧ｻ繝ｫ</button>
                <button type="submit" className="btn-submit" disabled={isCreatingTodo}>
                  {isCreatingTodo ? '菫晏ｭ倅ｸｭ...' : '菴懈・'}
                </button>
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
              <div className="task-detail-title">
                <span className={`priority-badge-${viewingTask.priority}`}>
                  {viewingTask.priority === 'high' ? '鬮・ : viewingTask.priority === 'low' ? '菴・ : '荳ｭ'}
                </span>
                <h2 style={{ margin: 0 }}>繧ｿ繧ｹ繧ｯ隧ｳ邏ｰ</h2>
              </div>
              <X className="cursor-pointer text-muted" onClick={() => setIsDetailModalOpen(false)} />
            </div>

            <div className="task-detail-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--tf-text-muted)', fontWeight: 600 }}>繧ｿ繧ｹ繧ｯ蜷・/label>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.4rem' }}>{viewingTask.title}</div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--tf-text-muted)', fontWeight: 600 }}>譛滄剞</label>
                <div style={{ marginTop: '0.4rem' }}>
                  {viewingTask.dueDate ? (() => {
                    const rel = getRelativeDateLabel(viewingTask.dueDate);
                    return (
                      <span className={`date-badge ${rel.className}`} style={{ fontSize: '0.9rem', padding: '4px 12px' }}>
                        <Clock size={14} /> {viewingTask.dueDate} ({rel.label})
                      </span>
                    );
                  })() : <span className="text-muted">譛ｪ險ｭ螳・/span>}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--tf-text-muted)', fontWeight: 600 }}>隧ｳ邏ｰ</label>
                <div style={{ marginTop: '0.4rem', color: 'var(--tf-text-soft)', lineHeight: 1.6 }}>
                  {viewingTask.description || <span className="text-muted">・郁ｪｬ譏弱・縺ゅｊ縺ｾ縺帙ｓ・・/span>}
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: '1.5rem', borderTop: '1px solid var(--tf-border)', paddingTop: '1.5rem' }}>
                <button
                  className="btn-cancel"
                  style={{ marginRight: 'auto', color: 'var(--tf-accent-red)', borderColor: 'var(--tf-accent-red)' }}
                  disabled={deletingTodoId === viewingTask.id}
                  onClick={async () => {
                    await handleDeleteTodo(viewingTask.id);
                    setIsDetailModalOpen(false);
                  }}
                >
                  {deletingTodoId === viewingTask.id ? '蜑企勁荳ｭ...' : '蜑企勁縺吶ｋ'}
                </button>
                <button
                  className="btn-submit"
                  style={{ background: viewingTask.completed ? 'var(--tf-text-muted)' : 'var(--tf-primary)' }}
                  disabled={!!togglingTodoMap[viewingTask.id]}
                  onClick={() => {
                    handleToggleTodo(viewingTask.id, viewingTask.completed);
                    setIsDetailModalOpen(false);
                  }}
                >
                  {togglingTodoMap[viewingTask.id]
                    ? '譖ｴ譁ｰ荳ｭ...'
                    : (viewingTask.completed ? '譛ｪ螳御ｺ・↓謌ｻ縺・ : '螳御ｺ・↓縺吶ｋ')}
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
          color: var(--tf-text);
          margin-bottom: 0.25rem;
        }
        .analysis-summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
        }
        .summary-stat-card {
          background: rgba(255, 255, 255, 0.92);
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
          border: 1px solid var(--tf-border);
        }
        .summary-stat-card .label {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--tf-text-muted);
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
          color: var(--tf-text);
        }
        .summary-stat-card .value.value-domain {
          font-size: 1.1rem;
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
        .trend.positive { background: rgba(132, 204, 22, 0.2); color: #4d7c0f; }
        .trend.negative { background: rgba(249, 115, 22, 0.16); color: #c2410c; }

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
          color: var(--tf-text-muted);
          text-transform: uppercase;
          border-bottom: 1px solid var(--tf-border);
        }
        .domain-table td {
          padding: 1rem;
          border-bottom: 1px solid var(--tf-border);
          font-size: 0.9rem;
        }
        .domain-cell-main {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .domain-name {
          font-weight: 700;
        }
        .domain-time {
          font-weight: 600;
        }
        .domain-icon-wrapper {
          width: 32px;
          height: 32px;
          background: rgba(15, 118, 110, 0.12);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--tf-primary);
        }
        .percentage-container {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .percentage-bar {
          flex: 1;
          height: 6px;
          background: rgba(148, 163, 184, 0.25);
          border-radius: 3px;
          overflow: hidden;
        }
        .percentage-fill {
          height: 100%;
          background: var(--tf-primary);
          border-radius: 3px;
        }
        .percentage-text {
          font-size: 0.75rem;
          font-weight: 800;
          color: var(--tf-text-muted);
          min-width: 30px;
        }
        .btn-domain-action {
          background: rgba(15, 118, 110, 0.1);
          border: none;
          color: var(--tf-text-muted);
          padding: 6px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-domain-action:hover {
          background: rgba(15, 118, 110, 0.2);
          color: var(--tf-primary);
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
