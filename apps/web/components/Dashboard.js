"use client";

import { useEffect, useState, useMemo, useRef } from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area
} from 'recharts';
import {
  Calendar as CalendarIcon,
  CheckCircle,
  Clock,
  Zap,
  Plus,
  ChevronLeft,
  ChevronRight,
  Target,
  Home as HomeIcon,
  Trash2,
  X,
  MoreVertical,
  Globe,
  FileText,
  BarChart3,
  TrendingDown,
  TrendingUp,
  ExternalLink,

  LogOut,
  LoaderCircle
} from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addDays, subDays } from 'date-fns';
import { ja } from 'date-fns/locale';

function normalizeApiBase(rawBase) {
  const trimmed = String(rawBase || '').trim().replace(/\/$/, '');
  if (!trimmed) return '/api';
  if (trimmed.startsWith('/')) return trimmed;

  try {
    const url = new URL(trimmed);
    const host = String(url.hostname || '').toLowerCase();
    const isLocalHost = host === 'localhost' || host === '127.0.0.1' || host === '::1';
    if (isLocalHost && url.protocol === 'https:') {
      url.protocol = 'http:';
    }
    return url.toString().replace(/\/$/, '');
  } catch (_error) {
    return trimmed;
  }
}

const API_BASE = normalizeApiBase(
  process.env.NEXT_PUBLIC_API_BASE ||
  (process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')}/api`
    : '/api')
);
const FOCUS_MODE_USER_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

const DEFAULT_USER_ID = 'b186ec48-06dd-4844-b29d-ab987e2b5989';
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

function toDueTimestamp(dueDate) {
  if (!dueDate) return Number.POSITIVE_INFINITY;
  const ts = new Date(`${dueDate}T00:00:00`).getTime();
  return Number.isFinite(ts) ? ts : Number.POSITIVE_INFINITY;
}

function normalizeDomainInput(rawDomain) {
  const raw = String(rawDomain || '').trim().toLowerCase();
  if (!raw) return '';

  let candidate = raw;
  try {
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(candidate)) {
      candidate = new URL(candidate).hostname.toLowerCase();
    } else {
      const withProtocol = candidate.startsWith('//') ? `https:${candidate}` : `https://${candidate}`;
      candidate = new URL(withProtocol).hostname.toLowerCase();
    }
  } catch (_error) {
    candidate = candidate.split('/')[0].split('?')[0].split('#')[0].toLowerCase();
  }

  candidate = candidate.replace(/^www\./, '').replace(/\.$/, '');
  return candidate;
}

function isValidDomainCandidate(input) {
  const domain = normalizeDomainInput(input);
  if (!domain) return false;
  if (domain.length > 253) return false;
  if (!domain.includes('.')) return false;
  if (domain.includes('..')) return false;
  if (!/^[a-z0-9.-]+$/.test(domain)) return false;

  const labels = domain.split('.');
  return labels.every((label) => (
    label.length > 0
    && label.length <= 63
    && !label.startsWith('-')
    && !label.endsWith('-')
  ));
}

function doesDomainMatchRule(ruleDomain, candidateDomain) {
  const rule = normalizeDomainInput(ruleDomain);
  const candidate = normalizeDomainInput(candidateDomain);
  if (!rule || !candidate) return false;
  if (rule === candidate) return true;
  if (candidate.endsWith(`.${rule}`)) return true;
  if (rule.endsWith(`.${candidate}`)) return true;
  return rule.includes(candidate) || candidate.includes(rule);
}

function findMatchingBlacklistDomain(candidateDomain, blacklistDomains) {
  return blacklistDomains.find((ruleDomain) => doesDomainMatchRule(ruleDomain, candidateDomain)) || null;
}

function buildBlacklistSyncToken(blacklist) {
  const domains = (Array.isArray(blacklist) ? blacklist : [])
    .map((item) => normalizeDomainInput(typeof item === 'string' ? item : item?.domain))
    .filter(Boolean)
    .sort();
  return domains.join('|');
}

function getBlacklistItemDomain(item) {
  return normalizeDomainInput(typeof item === 'string' ? item : item?.domain);
}

function normalizeBlacklistItems(items) {
  const list = Array.isArray(items) ? items : [];
  return list
    .map((item) => {
      const domain = getBlacklistItemDomain(item);
      if (!domain) return null;
      if (typeof item === 'string') {
        return { domain, name: domain.split('.')[0] || domain };
      }
      return { ...item, domain };
    })
    .filter(Boolean);
}

const DEFAULT_BLACKLIST_DOMAINS = new Set([
  'youtube.com',
  'twitter.com',
  'x.com',
  'instagram.com',
  'tiktok.com',
]);

const DEMO_DATA = {
  todos: [
    { id: 'd1', title: '【重要】最終レポートの構成作成', completed: false, priority: 'high', dueDate: format(new Date(), 'yyyy-MM-dd'), description: '章立てと参考文献のリストアップ [estimate:120]' },
    { id: 'd2', title: '英単語ターゲット1900 1-200復習', completed: true, priority: 'medium', dueDate: format(new Date(), 'yyyy-MM-dd'), description: 'アプリで確認 [estimate:30]' },
    { id: 'd3', title: '数学IIB 演習問題 15-20', completed: false, priority: 'high', dueDate: format(new Date(), 'yyyy-MM-dd'), description: 'Focus Goldを使用 [estimate:90]' },
    { id: 'd4', title: 'TOEIC公式問題集 パート5', completed: false, priority: 'medium', dueDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'), description: '時間を測って解く [estimate:45]' },
    { id: 'd5', title: 'サークル勧誘チラシの修正', completed: true, priority: 'low', dueDate: format(subDays(new Date(), 1), 'yyyy-MM-dd'), description: 'QRコードの差し替え [estimate:60]' },
    { id: 'd6', title: 'バイトのシフト提出', completed: true, priority: 'high', dueDate: format(new Date(), 'yyyy-MM-dd'), description: 'LINEで店長に送信 [estimate:10]' }
  ],
  missionProgress: {
    goals: [3, 5],
    activeTarget: 5,
    activeProgress: 60,
    createdLifetime: 124,
    completedLifetime: 75,
    persistence: 'database',
    byGoal: [
      { target: 3, progress: 100, achieved: true },
      { target: 5, progress: 60, achieved: false }
    ]
  },
  blacklist: [
    { domain: 'youtube.com' },
    { domain: 'twitter.com' },
    { domain: 'instagram.com' },
    { domain: 'tiktok.com' }
  ],
  siteBreakdown: [
    { domain: 'youtube.com', timeSpent: 145, visits: 12 },
    { domain: 'twitter.com', timeSpent: 82, visits: 24 },
    { domain: 'instagram.com', timeSpent: 45, visits: 8 },
    { domain: 'tiktok.com', timeSpent: 30, visits: 5 }
  ],
  totalTimeSeconds: 18120, // 約5時間
  hourlyStats: Array.from({ length: 24 }).map((_, i) => {
    const hoursAgo = 23 - i;
    const date = new Date(Date.now() - hoursAgo * 3600 * 1000);
    date.setMinutes(0, 0, 0);

    // デモ用のイベント生成: 15分使用 (¥300ロス) で統一し、傾きを一定にする
    const hasSnsUsage = (i % 3 === 0); // 3時間おきに使用
    const baseLoss = hasSnsUsage ? 300 : 0;
    const events = [];
    if (hasSnsUsage) {
      const domains = ['youtube.com', 'twitter.com', 'instagram.com', 'tiktok.com'];
      const randomDomain = domains[i % domains.length];
      events.push({ type: 'loss', name: randomDomain, jpy: -baseLoss });
    }
    if (i === 15) events.push({ type: 'gain', name: '✓ 英単語ターゲット1900 1-200復習', jpy: 600 });
    if (i === 20) events.push({ type: 'gain', name: '✓ サークル勧誘チラシの修正', jpy: 1200 });

    return {
      timestamp: date.getTime(),
      label: `${date.getHours()}:00`,
      lossJpy: baseLoss,
      gainJpy: (i === 10 ? 200 : i === 15 ? 600 : i === 20 ? 1200 : 0),
      events
    };
  }).reduce((acc, curr, i) => {
    const prevLoss = i > 0 ? acc[i - 1].cumulativeLossJpy : 0;
    const prevNet = i > 0 ? acc[i - 1].netBalance : 0;

    curr.cumulativeLossJpy = prevLoss + curr.lossJpy;
    curr.netBalance = prevNet + curr.gainJpy - curr.lossJpy;

    acc.push(curr);
    return acc;
  }, []),
  assets: {
    jpy: 6840,
    btc: 0.00000045,
    btcPriceJpy: 15200000
  },
  hourlyWageJpy: 1200
};

const parseEstimate = (desc) => {
  const match = desc?.match(/\[estimate:(\d+)\]/);
  return match ? parseInt(match[1], 10) : 0;
};

function toSafeHourlyWageJpy(value, fallback = 1200) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return Math.max(1, Math.floor(Number(fallback) || 1200));
  }
  return Math.max(1, Math.floor(parsed));
}

const DEMO_BASE_HOURLY_WAGE_JPY = toSafeHourlyWageJpy(DEMO_DATA.hourlyWageJpy, 1200);

function scaleDemoAmount(value, ratio) {
  const parsed = Number(value || 0);
  if (!Number.isFinite(parsed)) return 0;
  return Math.round(parsed * ratio);
}

function buildDemoData(hourlyWageJpy) {
  const safeHourlyWageJpy = toSafeHourlyWageJpy(hourlyWageJpy, DEMO_BASE_HOURLY_WAGE_JPY);
  const ratio = safeHourlyWageJpy / DEMO_BASE_HOURLY_WAGE_JPY;
  const totalTimeSeconds = Number(DEMO_DATA.totalTimeSeconds || 0);

  const scaledHourlyStats = (DEMO_DATA.hourlyStats || []).map((item) => ({
    ...item,
    lossJpy: scaleDemoAmount(item.lossJpy, ratio),
    gainJpy: scaleDemoAmount(item.gainJpy, ratio),
    cumulativeLossJpy: scaleDemoAmount(item.cumulativeLossJpy, ratio),
    netBalance: scaleDemoAmount(item.netBalance, ratio),
    events: Array.isArray(item.events)
      ? item.events.map((event) => ({
          ...event,
          jpy: scaleDemoAmount(event.jpy, ratio),
        }))
      : [],
  }));

  return {
    ...DEMO_DATA,
    hourlyWageJpy: safeHourlyWageJpy,
    hourlyStats: scaledHourlyStats,
    assets: {
      ...(DEMO_DATA.assets || {}),
      jpy: Math.floor((totalTimeSeconds / 3600) * safeHourlyWageJpy),
    },
  };
}

function resolveAllTasksFoldHeight(viewportHeight) {
  if (!Number.isFinite(viewportHeight) || viewportHeight <= 0) return 340;
  return Math.max(260, Math.min(420, Math.floor(viewportHeight * 0.42)));
}

export default function Dashboard({ user, onLogout }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoHourlyWageJpy, setDemoHourlyWageJpy] = useState(DEMO_BASE_HOURLY_WAGE_JPY);

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
  const [newTodoEstimate, setNewTodoEstimate] = useState(''); // 分単位
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isWelcomeBannerVisible, setIsWelcomeBannerVisible] = useState(true);
  const [blacklistBusy, setBlacklistBusy] = useState(false);
  const [blacklistError, setBlacklistError] = useState('');

  // Focus mode states
  const [focusModeEnabled, setFocusModeEnabled] = useState(false);
  const [focusModePhase, setFocusModePhase] = useState('idle');
  const [focusModeEndsAt, setFocusModeEndsAt] = useState(null);
  const [focusModeLoading, setFocusModeLoading] = useState(false);
  const [now, setNow] = useState(Date.now());

  const [isCreatingTodo, setIsCreatingTodo] = useState(false);
  const [deletingTodoId, setDeletingTodoId] = useState(null);
  const [togglingTodoMap, setTogglingTodoMap] = useState({});
  const latestFetchRequestIdRef = useRef(0);
  const togglingTodoSetRef = useRef(new Set());

  // AI analysis states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState(null); // { subtasks, complexity, totalEstimatedHours, tips }
  const [aiError, setAiError] = useState(null);
  const [selectedSubtasks, setSelectedSubtasks] = useState(new Set());
  const [expandedSubtasks, setExpandedSubtasks] = useState(new Set()); // 親タスクIDのセット
  const [analyzingTodoId, setAnalyzingTodoId] = useState(null); // 現在分析中の既存タスクID

  // Task detail states
  const [viewingTask, setViewingTask] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // All tasks fold states
  const [isAllTasksFolded, setIsAllTasksFolded] = useState(true);
  const [shouldFoldAllTasks, setShouldFoldAllTasks] = useState(false);
  const [allTasksFoldHeight, setAllTasksFoldHeight] = useState(340);
  const allTasksListRef = useRef(null);
  const allTasksHadOverflowRef = useRef(false);

  // Blacklist states
  const [blacklistInput, setBlacklistInput] = useState('');
  const [blacklistActionDomain, setBlacklistActionDomain] = useState(null);

  // Hourly wage states
  const [hourlyWageInput, setHourlyWageInput] = useState('');
  const [hourlyWageError, setHourlyWageError] = useState('');
  const [isSavingHourlyWage, setIsSavingHourlyWage] = useState(false);
  const [isHourlyWageEditing, setIsHourlyWageEditing] = useState(false);

  // Fetch data (with user ID from auth)
  const fetchData = async () => {
    if (isDemoMode) {
      setData(buildDemoData(demoHourlyWageJpy));
      setIsLoading(false);
      return;
    }
    const requestId = ++latestFetchRequestIdRef.current;
    try {
      const res = await fetch(`${API_BASE}/dashboard`, {
        headers: {
          'x-user-id': user?.id || DEFAULT_USER_ID,
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
      setError('APIに接続できません。バックエンドが起動しているか確認してください。');
    } finally {
      if (requestId !== latestFetchRequestIdRef.current) return;
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchFocusMode();
    const intervalId = setInterval(() => {
      fetchData();
      fetchFocusMode();
    }, 5000);
    return () => clearInterval(intervalId);
  }, [user, isDemoMode, demoHourlyWageJpy]);

  useEffect(() => {
    const ticker = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(ticker);
  }, []);

  useEffect(() => {
    const parsed = Number(data?.hourlyWageJpy);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    if (isHourlyWageEditing) return;
    setHourlyWageInput(String(Math.floor(parsed)));
  }, [data?.hourlyWageJpy, isHourlyWageEditing]);

  // Actions
  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!newTodoTitle.trim() || isCreatingTodo) return;
    const tagsArray = newTodoTags.split(',').map(tag => tag.trim()).filter(Boolean);
    setIsCreatingTodo(true);
    try {
      const finalDesc = newTodoEstimate ? `${newTodoDesc} [estimate:${newTodoEstimate}]` : newTodoDesc;
      const response = await fetch(`${API_BASE}/todos`, {
        method: 'POST',
        headers: {
          'x-user-id': user?.id || DEFAULT_USER_ID,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTodoTitle,
          dueDate: newTodoDate,
          description: finalDesc,
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
      setNewTodoEstimate('');
      setIsTaskModalOpen(false);
      fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsCreatingTodo(false);
    }
  };

  // AIタスク分析ハンドラー
  const handleAnalyzeTask = async (taskOrEvent = null) => {
    // taskOrEvent が Event インスタンスなら null 扱いにする（引数なしの onClick で呼ばれた場合）
    const existingTask = (taskOrEvent && taskOrEvent.nativeEvent) ? null : taskOrEvent;

    const title = existingTask ? existingTask.title : newTodoTitle;
    const desc = existingTask ? existingTask.description : newTodoDesc;

    if (!title || !title.trim() || isAnalyzing) return;

    setIsAnalyzing(true);
    setAiResult(null);
    setAiError(null);
    setAnalyzingTodoId(existingTask ? existingTask.id : null);
    if (existingTask && existingTask.dueDate) {
      setNewTodoDate(existingTask.dueDate);
    }

    try {
      const res = await fetch(`${API_BASE}/ai/analyze-task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description: desc }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(res.status === 429 ? 'AIのリクエスト制限に達しました。1〜2分後に再試行してください。' : (errData.error || 'AI分析に失敗しました'));
      }
      const result = await res.json();
      setAiResult(result);
      if (result.totalEstimatedHours) {
        setNewTodoEstimate(Math.round(result.totalEstimatedHours * 60));
      }
      setSelectedSubtasks(new Set(result.subtasks.map((_, i) => i)));

      // もし詳細モーダルから実行したなら、分析結果を表示するために
      // UIの状態を調整する必要があるかもしれない（現状は新規タスクモーダルと同じUIパターンを利用）
    } catch (e) {
      console.error('AI Error:', e);
      setAiError(e.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // AIが提案したサブタスクをTodoとして一括保存
  const handleSaveSubtasks = async () => {
    if (!aiResult || selectedSubtasks.size === 0 || isCreatingTodo) return;
    const toSave = aiResult.subtasks.filter((_, i) => selectedSubtasks.has(i));
    setIsCreatingTodo(true);
    try {
      let parentId = analyzingTodoId;

      // 既存タスクの分析でない場合は、まず親となるメインタスクを作成
      if (!parentId) {
        const parentDesc = newTodoEstimate
          ? `${newTodoDesc || '[AI分析から生成された親タスク]'} [estimate:${newTodoEstimate}]`
          : (newTodoDesc || '[AI分析から生成された親タスク]');
        const parentResponse = await fetch(`${API_BASE}/todos`, {
          method: 'POST',
          headers: {
            'x-user-id': user?.id || DEFAULT_USER_ID,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: newTodoTitle,
            description: parentDesc,
            priority: newTodoPriority,
            dueDate: newTodoDate,
          }),
        });

        if (!parentResponse.ok) throw new Error('親タスクの作成に失敗しました');
        const parentTask = await parentResponse.json();
        parentId = parentTask.id;
      }

      // 2. 選択されたサブタスクを親子紐付け情報を付けて保存
      for (const subtask of toSave) {
        const response = await fetch(`${API_BASE}/todos`, {

          method: 'POST',
          headers: { 'x-user-id': user?.id || DEFAULT_USER_ID, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: subtask.title,
            // [parent:ID] プレフィックスを付けることで親子関係を表現。 [estimate:X] で報酬計算に対応
            description: `[parent:${parentId}] [estimate:${Math.round(subtask.estimatedHours * 60)}] [AI生成] 予想: ${subtask.estimatedHours}h / 優先度: ${subtask.priority}`,
            priority: subtask.priority,
            dueDate: newTodoDate,
          }),
        });
        if (!response.ok) {
          const text = await response.text();
          console.error(`Failed to add subtask "${subtask.title}":`, response.status, text);
        }
      }
      setAiResult(null);
      setAnalyzingTodoId(null);
      setIsTaskModalOpen(false);
      setIsDetailModalOpen(false); // 詳細モーダルからだった場合も閉じる
      setNewTodoTitle('');
      setNewTodoDesc('');
      setNewTodoEstimate('');
      fetchData();
    } catch (e) {
      console.error('Error in handleSaveSubtasks:', e);
      setAiError(e.message);
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

    // 楽観更新: 先にUI反映して体感速度を上げる
    setData((prev) => {
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
          'x-user-id': user?.id || DEFAULT_USER_ID,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: nextCompleted })
      });

      if (!response.ok) {
        throw new Error('Todo toggle failed');
      }

      // サーバーの正本で同期
      fetchData();
    } catch (e) {
      console.error(e);

      // 失敗時はロールバック
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
          'x-user-id': user?.id || DEFAULT_USER_ID,
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

  const handleAddBlacklist = async (inputOrEvent) => {
    const isSubmitEvent = Boolean(inputOrEvent && typeof inputOrEvent.preventDefault === 'function');
    if (isSubmitEvent) {
      inputOrEvent.preventDefault();
    }

    const rawDomain = isSubmitEvent ? blacklistInput : inputOrEvent;
    const normalized = normalizeDomainInput(rawDomain);

    if (!isValidDomainCandidate(normalized)) {
      setBlacklistError('有効なドメインを入力してください（例: youtube.com）。');
      return;
    }

    const alreadyExists = (data?.blacklist || []).some((item) => getBlacklistItemDomain(item) === normalized);
    if (alreadyExists) {
      setBlacklistError('そのドメインはすでにブラックリストに登録されています。');
      return;
    }

    if (blacklistBusy) return;

    if (isDemoMode) {
      setData((prev) => {
        if (!prev) return prev;
        const current = Array.isArray(prev.blacklist) ? prev.blacklist : [];
        return {
          ...prev,
          blacklist: [...current, { domain: normalized, name: normalized.split('.')[0] || normalized }],
        };
      });
      setBlacklistInput('');
      setBlacklistError('');
      return;
    }

    setBlacklistBusy(true);
    setBlacklistActionDomain(normalized);
    setBlacklistError('');

    try {
      const response = await fetch(`${API_BASE}/blacklist`, {
        method: 'POST',
        headers: {
          'x-user-id': user?.id || DEFAULT_USER_ID,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain: normalized }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error || 'ドメイン追加に失敗しました。');
      }

      const result = await response.json().catch(() => ({}));
      if (Array.isArray(result?.blacklist)) {
        setData((prev) => (prev ? { ...prev, blacklist: normalizeBlacklistItems(result.blacklist) } : prev));
      } else {
        setData((prev) => {
          if (!prev) return prev;
          const current = Array.isArray(prev.blacklist) ? prev.blacklist : [];
          const exists = current.some((item) => getBlacklistItemDomain(item) === normalized);
          if (exists) return prev;
          return {
            ...prev,
            blacklist: [...current, { domain: normalized, name: normalized.split('.')[0] || normalized }],
          };
        });
      }

      setBlacklistInput('');
    } catch (e) {
      console.error(e);
      setBlacklistError(e.message || 'ドメイン追加に失敗しました。');
    } finally {
      setBlacklistActionDomain(null);
      setBlacklistBusy(false);
    }
  };

  const handleDeleteBlacklist = async (domain) => {
    const normalized = normalizeDomainInput(domain);
    if (!isValidDomainCandidate(normalized)) {
      return;
    }

    if (blacklistBusy) return;

    if (isDemoMode) {
      setBlacklistError('');
      setData((prev) => {
        if (!prev) return prev;
        const current = Array.isArray(prev.blacklist) ? prev.blacklist : [];
        return {
          ...prev,
          blacklist: current.filter((item) => getBlacklistItemDomain(item) !== normalized),
        };
      });
      return;
    }

    setBlacklistBusy(true);
    setBlacklistActionDomain(normalized);
    setBlacklistError('');

    try {
      const response = await fetch(`${API_BASE}/blacklist/${encodeURIComponent(normalized)}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user?.id || DEFAULT_USER_ID,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error || 'ドメイン削除に失敗しました。');
      }

      const result = await response.json().catch(() => ({}));
      if (Array.isArray(result?.blacklist)) {
        setData((prev) => (prev ? { ...prev, blacklist: normalizeBlacklistItems(result.blacklist) } : prev));
      } else {
        setData((prev) => {
          if (!prev) return prev;
          const current = Array.isArray(prev.blacklist) ? prev.blacklist : [];
          return {
            ...prev,
            blacklist: current.filter((item) => getBlacklistItemDomain(item) !== normalized),
          };
        });
      }
    } catch (e) {
      console.error(e);
      setBlacklistError(e.message || 'ドメイン削除に失敗しました。');
    } finally {
      setBlacklistActionDomain(null);
      setBlacklistBusy(false);
    }
  };

  const handleSaveHourlyWage = async (event) => {
    event.preventDefault();
    if (isSavingHourlyWage) return;

    const parsed = Number(hourlyWageInput);
    const normalized = Math.floor(parsed);

    if (!Number.isFinite(parsed) || normalized < 1 || normalized > 1000000) {
      setHourlyWageError('時給は 1〜1,000,000 の整数で入力してください。');
      return;
    }

    setHourlyWageError('');
    setIsSavingHourlyWage(true);

    try {
      if (isDemoMode) {
        setDemoHourlyWageJpy(normalized);
        setData(buildDemoData(normalized));
        setHourlyWageInput(String(normalized));
        return;
      }

      const response = await fetch(`${API_BASE}/settings/hourly-wage`, {
        method: 'PUT',
        headers: {
          'x-user-id': user?.id || DEFAULT_USER_ID,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hourlyWageJpy: normalized }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error || '時給の更新に失敗しました。');
      }

      const payload = await response.json().catch(() => ({}));
      const saved = Number(payload?.hourlyWageJpy || normalized);

      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          hourlyWageJpy: Math.floor(saved),
        };
      });

      await fetchData();
    } catch (e) {
      console.error(e);
      setHourlyWageError(e.message || '時給の更新に失敗しました。');
    } finally {
      setIsSavingHourlyWage(false);
      setIsHourlyWageEditing(false);
    }
  };

  const fetchFocusMode = async () => {
    try {
      const res = await fetch(`${API_BASE}/focus-mode`, {
        headers: {
          'x-user-id': user?.id || DEFAULT_USER_ID,
        },
      });
      if (!res.ok) return;
      const json = await res.json();
      setFocusModeEnabled(!!json.enabled);
      setFocusModePhase(json.phase || 'idle');
      setFocusModeEndsAt(json.endsAt || null);
    } catch (e) {
      // API停止時は無視
    }
  };

  const handleToggleFocusMode = async () => {
    if (focusModeLoading) return;
    setFocusModeLoading(true);
    try {
      const res = await fetch(`${API_BASE}/focus-mode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || DEFAULT_USER_ID,
        },
        body: JSON.stringify({ enabled: !focusModeEnabled }),
      });
      if (!res.ok) return;
      const json = await res.json();
      setFocusModeEnabled(!!json.enabled);
      setFocusModePhase(json.phase || 'idle');
      setFocusModeEndsAt(json.endsAt || null);
    } catch (e) {
      console.error(e);
    } finally {
      setFocusModeLoading(false);
    }
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

  const goToDashboardByDate = (dateStr) => {
    setSelectedDate(dateStr);
    setActiveTab('dashboard');
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

  // mini-calendar で選択した日付のタスクのみを表示し、未完了と優先度を上位に並べる
  const filteredTodos = (data?.todos || [])
    .filter((todo) => todo.dueDate === selectedDate);

  // 親子関係を解析してグループ化
  const groupedTasks = useMemo(() => {
    const parents = [];
    const childrenMap = {};

    filteredTodos.forEach(todo => {
      const match = todo.description?.match(/\[parent:([^\]]+)\]/);
      if (match) {
        const parentId = match[1];
        if (!childrenMap[parentId]) childrenMap[parentId] = [];
        childrenMap[parentId].push(todo);
      } else {
        parents.push(todo);
      }
    });

    // 親タスクをソート
    parents.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return (PRIORITY_ORDER[a.priority] ?? 3) - (PRIORITY_ORDER[b.priority] ?? 3);
    });

    return { parents, childrenMap };
  }, [filteredTodos]);

  const allTodosSorted = useMemo(() => {
    return [...(data?.todos || [])].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;

      const dueA = toDueTimestamp(a.dueDate);
      const dueB = toDueTimestamp(b.dueDate);
      if (dueA !== dueB) return dueA - dueB;

      const priorityA = PRIORITY_ORDER[a.priority] ?? 3;
      const priorityB = PRIORITY_ORDER[b.priority] ?? 3;
      if (priorityA !== priorityB) return priorityA - priorityB;

      return (a.title || '').localeCompare((b.title || ''), 'ja');
    });
  }, [data?.todos]);

  useEffect(() => {
    if (activeTab !== 'dashboard') return;

    const updateFoldState = () => {
      const listElement = allTasksListRef.current;
      const nextFoldHeight = resolveAllTasksFoldHeight(window.innerHeight);
      setAllTasksFoldHeight(nextFoldHeight);

      if (!listElement) {
        setShouldFoldAllTasks(false);
        setIsAllTasksFolded(false);
        allTasksHadOverflowRef.current = false;
        return;
      }

      const needsFold = listElement.scrollHeight > nextFoldHeight;
      setShouldFoldAllTasks(needsFold);

      if (!needsFold) {
        setIsAllTasksFolded(false);
      } else if (!allTasksHadOverflowRef.current) {
        setIsAllTasksFolded(true);
      }

      allTasksHadOverflowRef.current = needsFold;
    };

    const rafId = window.requestAnimationFrame(updateFoldState);
    window.addEventListener('resize', updateFoldState);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', updateFoldState);
    };
  }, [allTodosSorted, activeTab]);

  // Analysis Page Data
  const siteBreakdown = data?.siteBreakdown || [];
  const effectiveHourlyWageJpy = useMemo(() => {
    const parsed = Number(data?.hourlyWageJpy);
    if (!Number.isFinite(parsed) || parsed <= 0) return 1200;
    return Math.floor(parsed);
  }, [data?.hourlyWageJpy]);

  const blacklistDomains = useMemo(() => {
    return Array.from(new Set(
      (data?.blacklist || [])
        .map((item) => getBlacklistItemDomain(item))
        .filter(Boolean)
    ));
  }, [data?.blacklist]);

  const blacklistSyncToken = useMemo(() => {
    return buildBlacklistSyncToken(data?.blacklist);
  }, [data?.blacklist]);

  const analysisDomainRows = useMemo(() => {
    const usageMap = new Map();

    siteBreakdown.forEach((site) => {
      const rawDomain = String(site?.domain || '').trim().toLowerCase();
      if (!rawDomain) return;

      const key = normalizeDomainInput(rawDomain) || rawDomain;
      const prev = usageMap.get(key) || { domain: key, timeSpent: 0, visits: 0 };
      prev.timeSpent += Number(site?.timeSpent || 0);
      prev.visits += Number(site?.visits || 0);
      usageMap.set(key, prev);
    });

    const rows = blacklistDomains.map((blacklistedDomain) => {
      let timeSpent = 0;
      let visits = 0;

      usageMap.forEach((usage) => {
        if (!doesDomainMatchRule(blacklistedDomain, usage.domain)) return;
        timeSpent += usage.timeSpent;
        visits += usage.visits;
      });

      return {
        domain: blacklistedDomain,
        timeSpent,
        visits,
        isBlacklisted: true,
        matchedRuleDomain: blacklistedDomain,
      };
    });

    rows.sort((a, b) => {
      if (b.timeSpent !== a.timeSpent) return b.timeSpent - a.timeSpent;
      return (a.domain || '').localeCompare((b.domain || ''), 'en');
    });

    return rows;
  }, [siteBreakdown, blacklistDomains]);

  const topSiteDomain = useMemo(() => {
    const withTime = analysisDomainRows.find((row) => row.timeSpent > 0);
    return withTime?.domain || analysisDomainRows[0]?.domain || null;
  }, [analysisDomainRows]);

  const totalTimeInMinutes = siteBreakdown.reduce((acc, curr) => acc + curr.timeSpent, 0);
  const totalTimeSeconds = data?.totalTimeSeconds || (totalTimeInMinutes * 60);

  const totalRecoveredJpy = useMemo(() => {
    return (data?.todos || [])
      .filter(t => t.completed)
      .reduce((sum, t) => sum + (parseEstimate(t.description) / 60) * effectiveHourlyWageJpy, 0);
  }, [data?.todos, effectiveHourlyWageJpy]);

  const assetLossData = useMemo(() => {
    const stats = (data?.hourlyStats || []);
    return stats.map((item) => {
      // バックエンドが netBalance を持っている場合はそれを利用、なければフロントで計算
      const loss = (item.cumulativeLossJpy || 0);
      return {
        ...item,
        netBalance: item.netBalance !== undefined ? item.netBalance : (totalRecoveredJpy - loss)
      };
    });
  }, [data?.hourlyStats, totalRecoveredJpy]);

  const off = useMemo(() => {
    if (!assetLossData.length) return 0;
    const dataMax = Math.max(...assetLossData.map((i) => i.netBalance || 0), 0);
    const dataMin = Math.min(...assetLossData.map((i) => i.netBalance || 0), 0);

    if (dataMax <= 0) return 0;
    if (dataMin >= 0) return 1;

    return dataMax / (dataMax - dataMin);
  }, [assetLossData]);

  const btcValue = typeof data?.assets?.btc === 'number' ? data.assets.btc : Number(data?.assets?.btc || 0);
  const jpyValue = data?.assets?.jpy || 0;

  if (isLoading) return <div className="loading">読み込み中...</div>;
  if (error) return <div className="error-card">{error}</div>;
  if (!data) return null;

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

  const selectedDateRemainingCount = (data?.todos || []).filter((todo) => todo.dueDate === selectedDate && !todo.completed).length;
  const remainingTodosCount = (data?.todos || []).filter(t => !t.completed).length;

  const missionProgress = data?.missionProgress || {};
  const goalTargets = Array.isArray(missionProgress.goals) && missionProgress.goals.length > 0
    ? missionProgress.goals
    : [3, 5];
  const primaryGoal = goalTargets[0] || 3;
  const secondaryGoal = goalTargets[1] || 5;

  const fallbackCompletedLifetime = (data?.todos || []).filter((todo) => todo.completed).length;
  const completedLifetime = Number.isFinite(missionProgress.completedLifetime)
    ? missionProgress.completedLifetime
    : fallbackCompletedLifetime;
  const createdLifetime = Number.isFinite(missionProgress.createdLifetime)
    ? missionProgress.createdLifetime
    : Math.max((data?.todos || []).length, completedLifetime);

  const activeTarget = Number.isFinite(missionProgress.activeTarget)
    ? missionProgress.activeTarget
    : (completedLifetime < primaryGoal ? primaryGoal : secondaryGoal);
  const activeProgress = Number.isFinite(missionProgress.activeProgress)
    ? missionProgress.activeProgress
    : Math.min(100, Math.round((completedLifetime / Math.max(activeTarget, 1)) * 100));

  const primaryGoalAchieved = completedLifetime >= primaryGoal;
  const secondaryGoalAchieved = completedLifetime >= secondaryGoal;

  const formatTime = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}時間 ${m}分` : `${m}分`;
  };

  const remainSec = focusModeEndsAt ? Math.max(0, Math.floor((focusModeEndsAt - now) / 1000)) : 0;
  const remainText = `${Math.floor(remainSec / 60)}:${String(remainSec % 60).padStart(2, '0')}`;

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo" onClick={() => setIsDemoMode(!isDemoMode)} style={{ cursor: 'pointer' }}>
          <Clock size={32} />
          <span>Focus Quest {isDemoMode && <small style={{ fontSize: '0.6rem', opacity: 0.5 }}>(Demo)</small>}</span>
        </div>

        <button className="btn-new-task-sidebar mb-2" onClick={() => {
          setNewTodoDate(selectedDate);
          setIsTaskModalOpen(true);
        }}>
          <Plus size={18} />
          <span>新規タスク作成</span>
        </button>

        <div className="sidebar-label">ワークスペース</div>
        <nav className="sidebar-nav">
          <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <HomeIcon size={18} />
            <span>ミッション一覧</span>
            {remainingTodosCount > 0 && <span className="nav-count-pill">{remainingTodosCount}</span>}
          </div>
          <div className={`nav-item ${activeTab === 'analysis' ? 'active' : ''}`} onClick={() => setActiveTab('analysis')}>
            <BarChart3 size={18} />
            <span>集中ログ分析</span>
          </div>
          <div className={`nav-item ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>
            <CalendarIcon size={18} />
            <span>カレンダー計画</span>
          </div>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="btn-logout">
            <LogOut size={18} />
            <span>ログアウト</span>
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
                    <h1>今日のフォーカスクエスト</h1>
                    <p>未完了ミッションは {remainingTodosCount} 件。まずは 1 件クリアして勢いを作ろう。</p>
                  </div>
                  <button onClick={() => setIsWelcomeBannerVisible(false)} className="welcome-close-btn">
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
                        <div className="task-card-icon">
                          <FileText size={18} />
                        </div>
                        <h2>{format(new Date(`${selectedDate}T00:00:00`), 'M月 d日', { locale: ja })} のミッション</h2>
                      </div>
                      <div className="mission-head-right">
                        <span className="mission-count-pill">残り {selectedDateRemainingCount} 件</span>
                        <span className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                          {format(new Date(`${selectedDate}T00:00:00`), 'yyyy年 M月 d日 (E)', { locale: ja })}
                        </span>
                      </div>
                    </div>

                    <ul className="todo-list">
                      {groupedTasks.parents.map((todo) => {
                        const children = groupedTasks.childrenMap[todo.id] || [];
                        const isExpanded = expandedSubtasks.has(todo.id);
                        const hasChildren = children.length > 0;

                        return (
                          <div key={todo.id}>
                            <li className={`todo-item ${todo.completed ? 'completed' : ''}`}>
                              <div
                                className="checkbox-custom"
                                onClick={() => handleToggleTodo(todo.id, todo.completed)}
                              >
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
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span className="todo-text" style={{ fontWeight: 700, fontSize: '0.95rem' }}>{todo.title}</span>
                                  {hasChildren && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setExpandedSubtasks(prev => {
                                          const next = new Set(prev);
                                          next.has(todo.id) ? next.delete(todo.id) : next.add(todo.id);
                                          return next;
                                        });
                                      }}
                                      style={{ background: 'rgba(124, 58, 237, 0.1)', border: 'none', borderRadius: '4px', padding: '2px 8px', fontSize: '0.7rem', color: '#7c3aed', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                    >
                                      {isExpanded ? '▲ 閉じる' : `▼ サブタスク(${children.length})`}
                                    </button>
                                  )}
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.25rem' }}>
                                  {todo.tags?.map(tag => <span key={tag} className="tag" style={{ textTransform: 'uppercase' }}>{tag}</span>)}
                                  <span className={`priority-tag ${todo.priority}`} style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: '#f1f5f9', fontWeight: 700 }}>{todo.priority.toUpperCase()}</span>
                                  {todo.dueDate && (() => {
                                    const rel = getRelativeDateLabel(todo.dueDate);
                                    return (
                                      <span className={`date-badge ${rel?.className}`}>
                                        <Clock size={12} /> {rel?.label}
                                      </span>
                                    );
                                  })()}
                                </div>
                                {todo.description && (
                                  <div className="todo-description text-muted" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                                    {todo.description.replace(/\[parent:[^\]]+\]\s*/, '')}
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2 items-center">
                                {!todo.completed && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleAnalyzeTask(todo); setIsTaskModalOpen(true); }}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', color: '#7c3aed' }}
                                    title="AIでタスク分析"
                                  >
                                    ✨
                                  </button>
                                )}
                                <Trash2 size={18} className="text-muted cursor-pointer hover:text-red-500" onClick={() => handleDeleteTodo(todo.id)} />
                                <MoreVertical size={18} className="text-muted cursor-pointer" />
                              </div>
                            </li>

                            {/* サブタスクの表示 */}
                            {hasChildren && isExpanded && (
                              <div style={{ marginLeft: '2.5rem', borderLeft: '2px dashed #e2e8f0', paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem', marginBottom: '1rem' }}>
                                {children.map(child => (
                                  <li key={child.id} className={`todo-item subtask ${child.completed ? 'completed' : ''}`} style={{ padding: '0.75rem', fontSize: '0.9rem', background: 'rgba(255,255,255,0.5)', borderRadius: '8px', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div className="checkbox-custom" onClick={() => handleToggleTodo(child.id, child.completed)}>
                                      {child.completed && <CheckCircle size={16} color="white" fill="white" />}
                                    </div>
                                    <div className="todo-content-wrapper" style={{ flex: 1 }} onClick={() => { setViewingTask(child); setIsDetailModalOpen(true); }}>
                                      <span className="todo-text" style={{ fontSize: '0.9rem', fontWeight: 600 }}>{child.title}</span>
                                      {child.description && <p className="text-muted" style={{ fontSize: '0.75rem' }}>{child.description.replace(/\[parent:[^\]]+\]\s*/, '')}</p>}
                                    </div>
                                    <div className="flex gap-2 items-center">
                                      <Trash2 size={16} className="text-muted cursor-pointer hover:text-red-500" onClick={() => handleDeleteTodo(child.id)} />
                                    </div>
                                  </li>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {groupedTasks.parents.length === 0 && (
                        <li className="mission-empty-state">
                          この日はまだミッションがありません。右のカレンダーで別日を選ぶか、この日に新規タスクを追加しましょう。
                        </li>
                      )}
                      <div className="mt-2 text-center">
                        <button className="add-task-inline" onClick={() => {
                          setNewTodoDate(selectedDate);
                          setIsTaskModalOpen(true);
                        }} style={{ background: 'none', border: '1px dashed #cbd5e1', padding: '8px 16px', borderRadius: '8px', color: '#64748b', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <Plus size={16} /> この日にタスクを追加
                        </button>
                      </div>
                    </ul>
                  </section>

                  <section className="glass-card all-missions-card">
                    <div className="card-header" style={{ marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="task-card-icon">
                          <FileText size={18} />
                        </div>
                        <h2>すべてのミッション</h2>
                      </div>
                      <span className="all-mission-count-pill">全 {allTodosSorted.length} 件</span>
                    </div>

                    {allTodosSorted.length === 0 ? (
                      <div className="mission-empty-state">まだタスクがありません。最初のタスクを作成しましょう。</div>
                    ) : (
                      <>
                        <div
                          className={`all-missions-list-shell ${shouldFoldAllTasks && isAllTasksFolded ? 'is-folded' : ''}`}
                          style={shouldFoldAllTasks && isAllTasksFolded ? { maxHeight: `${allTasksFoldHeight}px` } : undefined}
                        >
                          <ul className="todo-list all-missions-list" ref={allTasksListRef}>
                            {allTodosSorted.map((todo) => {
                              const priority = PRIORITY_ORDER[todo.priority] !== undefined ? todo.priority : 'medium';
                              const dueTimestamp = toDueTimestamp(todo.dueDate);
                              const dueLabel = Number.isFinite(dueTimestamp)
                                ? format(new Date(dueTimestamp), 'yyyy/MM/dd', { locale: ja })
                                : null;
                              const rel = dueLabel ? getRelativeDateLabel(todo.dueDate) : null;

                              return (
                                <li key={todo.id} className={`todo-item all-mission-item ${todo.completed ? 'completed' : ''}`}>
                                  <div
                                    className="checkbox-custom"
                                    onClick={() => handleToggleTodo(todo.id, todo.completed)}
                                  >
                                    {todo.completed && <CheckCircle size={18} color="white" fill="white" />}
                                  </div>

                                  <div
                                    className="todo-content-wrapper all-mission-main"
                                    style={{ flex: 1, cursor: 'pointer' }}
                                    onClick={() => {
                                      setViewingTask(todo);
                                      setIsDetailModalOpen(true);
                                    }}
                                  >
                                    <div className="all-mission-top">
                                      <span className="todo-text all-mission-title">{todo.title}</span>
                                      <span className={`priority-tag ${priority}`} style={{ fontSize: '0.63rem', padding: '2px 6px', borderRadius: '4px', background: '#f1f5f9', fontWeight: 700 }}>
                                        {priority.toUpperCase()}
                                      </span>
                                    </div>

                                    <div className="all-mission-meta">
                                      {dueLabel ? (
                                        <span className={`date-badge ${rel?.className || 'upcoming'}`}>
                                          <Clock size={12} /> {dueLabel} ({rel?.label || '予定日'})
                                        </span>
                                      ) : (
                                        <span className="all-mission-no-date">期限未設定</span>
                                      )}
                                    </div>

                                    {todo.description && (
                                      <p className="all-mission-desc">
                                        {todo.description.replace(/\[parent:[^\]]+\]\s*/, '')}
                                      </p>
                                    )}
                                  </div>

                                  <Trash2
                                    size={18}
                                    className="text-muted cursor-pointer hover:text-red-500"
                                    onClick={() => handleDeleteTodo(todo.id)}
                                  />
                                </li>
                              );
                            })}
                          </ul>
                        </div>

                        {shouldFoldAllTasks && (
                          <button
                            type="button"
                            className="all-missions-fold-btn"
                            onClick={() => setIsAllTasksFolded((prev) => !prev)}
                          >
                            {isAllTasksFolded ? 'すべてのタスクを表示する' : '一覧を折りたたむ'}
                          </button>
                        )}
                      </>
                    )}
                  </section>
                </div>

                {/* Right Column */}
                <div className="dashboard-right">
                  <section className="glass-card mini-calendar-card mb-2">
                    <div className="mini-calendar-header">
                      <ChevronLeft size={20} className="cursor-pointer" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} />
                      <span className="mini-calendar-title">{format(currentMonth, 'yyyy年 M月', { locale: ja })}</span>
                      <ChevronRight size={20} className="cursor-pointer" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} />
                    </div>
                    <div className="mini-calendar-body">
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
                      <h2>固定目標チャレンジ</h2>
                    </div>
                    <div className="score-goal-chip-wrap">
                      <span className={`goal-chip ${primaryGoalAchieved ? 'done' : ''}`}>{primaryGoal}件クリア</span>
                      <span className={`goal-chip ${secondaryGoalAchieved ? 'done' : ''}`}>{secondaryGoal}件クリア</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${activeProgress}%` }}></div>
                    </div>
                    <p>
                      次の目標は {activeTarget} 件クリア。進捗は {activeProgress}%。
                      累計クリア {completedLifetime} 件 / 累計作成 {createdLifetime} 件で行動を評価します。
                    </p>
                  </section>

                  <section className="glass-card" style={{ marginTop: '0.75rem', marginBottom: '0.75rem' }}>
                    <div className="card-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Zap size={18} color="var(--tf-secondary)" />
                        <h2>集中モード</h2>
                      </div>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: '999px',
                        background: focusModeEnabled ? '#dcfce7' : '#f1f5f9',
                        color: focusModeEnabled ? '#16a34a' : '#64748b',
                      }}>
                        {focusModeEnabled ? '● ON' : '○ OFF'}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--tf-text-muted)', margin: '0.4rem 0 0.8rem' }}>
                      {focusModeEnabled
                        ? (focusModePhase === 'break' ? '🟢 休憩中' : '🔴 集中中（ブラックリストをロック中）')
                        : 'ONにするとブラックリストのサイトをロックします'}
                    </p>
                    {focusModeEnabled && (
                      <p style={{ fontSize: '0.9rem', fontWeight: 700, margin: '0 0 1rem', color: 'var(--tf-text)' }}>
                        {focusModePhase === 'break' ? '休憩終了まで' : '集中終了まで'}: {remainText}
                      </p>
                    )}
                    <button
                      onClick={handleToggleFocusMode}
                      disabled={focusModeLoading}
                      style={{
                        width: '100%',
                        padding: '0.6rem',
                        borderRadius: '10px',
                        border: 'none',
                        cursor: focusModeLoading ? 'not-allowed' : 'pointer',
                        background: focusModeEnabled
                          ? 'linear-gradient(135deg, #dc2626, #b91c1c)'
                          : 'linear-gradient(135deg, var(--tf-primary), var(--tf-primary-light))',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        opacity: focusModeLoading ? 0.65 : 1,
                      }}
                    >
                      {focusModeLoading
                        ? '処理中...'
                        : focusModeEnabled
                          ? '集中モードをOFFにする'
                          : '集中モードをONにする'}
                    </button>
                  </section>

                </div>
              </div>
            </>
          )}

          {activeTab === 'analysis' && (
            <div className="analysis-view animate-fade-in">
              <div className="analysis-header mb-2">
                <h1>集中ログ分析</h1>
                <p className="text-muted">SNSの使い方を可視化して、本来のミッション（勉強）時間を取り戻そう。</p>
              </div>

              <div className="analysis-summary-grid mb-2">
                <div className="summary-stat-card">
                  <span className="label">総スクリーン時間</span>
                  <div className="value-group">
                    <span className="value">{formatTime(totalTimeInMinutes)}</span>
                    <span className="trend positive"><TrendingUp size={14} /> 4%</span>
                  </div>
                </div>
                <div className="summary-stat-card">
                  <span className="label">潜在ロス (JPY)</span>
                  <div className="value-group">
                    <span className="value">¥{jpyValue.toLocaleString()}</span>
                    <span className="trend negative"><TrendingDown size={14} /> 損失</span>
                  </div>
                </div>
                <div className="summary-stat-card">
                  <span className="label">最長滞在サイト</span>
                  <div className="value-group">
                    <span className="value value-domain">{topSiteDomain || 'N/A'}</span>
                  </div>
                </div>
                <div className="summary-stat-card">
                  <span className="label">あなたの時給 (JPY/h)</span>
                  <form className="hourly-wage-form" onSubmit={handleSaveHourlyWage}>
                    <div className="value-group">
                      <span className="value">¥{effectiveHourlyWageJpy.toLocaleString()}</span>
                    </div>
                    <div className="hourly-wage-input-row">
                      <input
                        type="number"
                        min="1"
                        max="1000000"
                        step="1"
                        className="hourly-wage-input"
                        value={hourlyWageInput}
                        onFocus={() => setIsHourlyWageEditing(true)}
                        onBlur={() => setIsHourlyWageEditing(false)}
                        onChange={(e) => {
                          setHourlyWageInput(e.target.value);
                          if (hourlyWageError) setHourlyWageError('');
                        }}
                        placeholder="例: 1200"
                        disabled={isSavingHourlyWage}
                      />
                      <button type="submit" className="btn-hourly-wage-save" disabled={isSavingHourlyWage}>
                        {isSavingHourlyWage ? '保存中...' : '保存'}
                      </button>
                    </div>
                    {hourlyWageError && <span className="hourly-wage-error">{hourlyWageError}</span>}
                  </form>
                </div>
              </div>

              <div className="analysis-main-grid">
                <section className="glass-card chart-section">
                  <div className="card-header">
                    <h2>当日の収支推移 (Net Balance)</h2>
                  </div>
                  <div style={{ height: 350, marginTop: '1rem' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={assetLossData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                        <defs>
                          <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                            <stop offset={off} stopColor="var(--tf-accent-lime)" stopOpacity={1} />
                            <stop offset={off} stopColor="var(--tf-accent-red)" stopOpacity={1} />
                          </linearGradient>
                          <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                            <stop offset={off} stopColor="var(--tf-accent-lime)" stopOpacity={0.4} />
                            <stop offset={off} stopColor="var(--tf-accent-red)" stopOpacity={0.4} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="label" tick={{ fontSize: 10, fontWeight: 700 }} />
                        <YAxis tick={{ fontSize: 11 }} label={{ value: 'Net JPY', angle: -90, position: 'insideLeft', offset: 15 }} />
                        <Tooltip
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '12px' }}
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const item = payload[0]?.payload;
                              if (!item) return null;
                              return (
                                <div style={{ background: 'white', padding: '12px', borderRadius: '12px', border: '1px solid #f0f0f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                                  <div style={{ fontWeight: 800, marginBottom: '8px', borderBottom: '1px solid #f0f0f0', paddingBottom: '4px' }}>{label} の状況</div>
                                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: (item.netBalance || 0) >= 0 ? 'var(--tf-accent-lime)' : '#ef4444', marginBottom: '8px' }}>
                                    収支: ¥{item.netBalance?.toLocaleString()}
                                  </div>
                                  {item.events && item.events.length > 0 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                      {item.events.map((ev, idx) => (
                                        <div key={idx} style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                                          <span style={{ color: '#64748b' }}>{ev.name}</span>
                                          <span style={{ fontWeight: 700, color: ev.type === 'gain' ? 'var(--tf-accent-lime)' : '#ef4444' }}>
                                            {ev.jpy > 0 ? '+' : ''}{Math.floor(ev.jpy || 0).toLocaleString()}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area type="monotone" dataKey="netBalance" stroke="url(#splitColor)" strokeWidth={4} fillOpacity={1} fill="url(#colorBalance)" animationDuration={1500} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                <section className="glass-card table-section">
                  <div className="card-header" style={{ marginBottom: '1rem' }}>
                    <h2>ドメイン詳細</h2>
                  </div>

                  <div className="domain-manager-toolbar">
                    <form className="domain-manage-form" onSubmit={handleAddBlacklist}>
                      <input
                        type="text"
                        className="domain-manage-input"
                        value={blacklistInput}
                        onChange={(e) => {
                          setBlacklistInput(e.target.value);
                          if (blacklistError) setBlacklistError('');
                        }}
                        placeholder="追加したいドメインを入力 (例: youtube.com)"
                        disabled={blacklistBusy}
                      />
                      <button
                        type="submit"
                        className="btn-domain-add"
                        disabled={blacklistBusy}
                      >
                        {blacklistBusy && !blacklistActionDomain ? '処理中...' : 'ブラックリストに追加'}
                      </button>
                    </form>

                    {blacklistError && (
                      <div className="blacklist-error-text">
                        {blacklistError}
                      </div>
                    )}

                    <div className="blacklist-chip-list">
                      {blacklistDomains.length === 0 ? (
                        <span className="text-muted" style={{ fontSize: '0.78rem' }}>
                          ブラックリストは空です。
                        </span>
                      ) : (
                        blacklistDomains.map((domain) => {
                          const isDeleting = blacklistBusy && blacklistActionDomain === domain;
                          return (
                            <span key={domain} className="blacklist-chip">
                              <span>{domain}</span>
                              <button
                                type="button"
                                className="blacklist-chip-remove"
                                disabled={blacklistBusy}
                                onClick={() => handleDeleteBlacklist(domain)}
                                aria-label={`${domain} をブラックリストから削除`}
                              >
                                {isDeleting ? '...' : '×'}
                              </button>
                            </span>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="domain-table-container">
                    <table className="domain-table">
                      <thead>
                        <tr>
                          <th>ドメイン</th>
                          <th>滞在時間</th>
                          <th>割合</th>
                          <th>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analysisDomainRows.map((site) => {
                          const normalizedDomain = normalizeDomainInput(site.domain);
                          const percentage = totalTimeInMinutes > 0
                            ? Math.round((site.timeSpent / totalTimeInMinutes) * 100)
                            : 0;
                          const isProcessingThisDomain = blacklistBusy && blacklistActionDomain === normalizedDomain;
                          const canOpen = isValidDomainCandidate(normalizedDomain);
                          const canAddFromRow = isValidDomainCandidate(normalizedDomain);
                          const canToggle = site.isBlacklisted || canAddFromRow;

                          return (
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
                                    <div className="percentage-fill" style={{ width: `${percentage}%` }}></div>
                                  </div>
                                  <span className="percentage-text">{percentage}%</span>
                                </div>
                              </td>
                              <td>
                                <div className="domain-actions">
                                  <button
                                    className="btn-domain-action"
                                    disabled={!canOpen}
                                    onClick={() => canOpen && window.open(`https://${normalizedDomain}`, '_blank')}
                                    title="サイトを開く"
                                  >
                                    <ExternalLink size={14} />
                                  </button>

                                  <button
                                    className={`btn-domain-action ${site.isBlacklisted ? 'danger' : 'primary'}`}
                                    onClick={() => {
                                      if (site.isBlacklisted) {
                                        handleDeleteBlacklist(site.matchedRuleDomain || site.domain);
                                        return;
                                      }
                                      handleAddBlacklist(site.domain);
                                    }}
                                    disabled={blacklistBusy || !canToggle}
                                    title={site.isBlacklisted ? 'ブラックリストから削除' : 'ブラックリストに追加'}
                                  >
                                    {isProcessingThisDomain ? (
                                      <LoaderCircle size={14} className="icon-spin" />
                                    ) : site.isBlacklisted ? (
                                      <Trash2 size={14} />
                                    ) : (
                                      <Plus size={14} />
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
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
                <h2>月間ミッションカレンダー</h2>
                <div className="calendar-nav-control">
                  <ChevronLeft className="cursor-pointer" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} />
                  <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>{format(currentMonth, 'yyyy年 M月', { locale: ja })}</span>
                  <ChevronRight className="cursor-pointer" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} />
                </div>
              </div>
              <p className="detailed-calendar-tip">日付セルをクリックすると、その日のミッション一覧へ移動します。</p>
              <div className="full-calendar-grid">
                {['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'].map(d => (
                  <div key={d} className="calendar-day-label full-calendar-day-label">{d}</div>
                ))}
                {daysInMonth.map((day, idx) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const dayTodos = todosOnDay(day);
                  const isSelected = selectedDate === dateStr;
                  return (
                    <div
                      key={idx}
                      className={`full-calendar-cell ${isSelected ? 'is-selected' : ''} ${!isSameMonth(day, currentMonth) ? 'bg-slate-50 opacity-40' : ''}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => goToDashboardByDate(dateStr)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          goToDashboardByDate(dateStr);
                        }
                      }}
                    >
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
        <div className="modal-overlay" onClick={() => !isCreatingTodo && setIsTaskModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>新規タスク作成</h2>
              <X className="cursor-pointer text-muted" onClick={() => !isCreatingTodo && setIsTaskModalOpen(false)} />
            </div>
            <form onSubmit={handleAddTodo} className="modal-form">
              {isCreatingTodo && (
                <div className="saving-banner">
                  <LoaderCircle size={18} />
                  <span>タスクを保存しています...</span>
                </div>
              )}
              <div className="form-group">
                <label>タスク名</label>
                <input type="text" value={newTodoTitle} onChange={(e) => setNewTodoTitle(e.target.value)} placeholder="タスク名を入力..." required disabled={isCreatingTodo} />
              </div>
              <div className="form-group">
                <label>詳細説明</label>
                <textarea value={newTodoDesc} onChange={(e) => setNewTodoDesc(e.target.value)} placeholder="詳細を入力..." rows="3" disabled={isCreatingTodo} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>期限日</label>
                  <input type="date" value={newTodoDate} onChange={(e) => setNewTodoDate(e.target.value)} disabled={isCreatingTodo} />
                </div>
                <div className="form-group">
                  <label>優先度</label>
                  <select value={newTodoPriority} onChange={(e) => setNewTodoPriority(e.target.value)} disabled={isCreatingTodo}>
                    <option value="low">低</option>
                    <option value="medium">中</option>
                    <option value="high">高</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>所要時間見積もり (分)</label>
                  <input
                    type="number"
                    value={newTodoEstimate}
                    onChange={(e) => setNewTodoEstimate(e.target.value)}
                    placeholder="例: 60 (1時間)"
                    disabled={isCreatingTodo}
                    min="0"
                  />
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                    ¥{Math.floor((Number(newTodoEstimate || 0) / 60) * effectiveHourlyWageJpy).toLocaleString()} 相当の価値
                  </div>
                </div>
                <div className="form-group" style={{ flex: 2 }}>
                  <label>タグ (カンマ区切り)</label>
                  <input type="text" value={newTodoTags} onChange={(e) => setNewTodoTags(e.target.value)} placeholder="仕事, UI, バグ" disabled={isCreatingTodo} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsTaskModalOpen(false)} disabled={isCreatingTodo}>キャンセル</button>
                <button
                  type="button"
                  onClick={handleAnalyzeTask}
                  disabled={isAnalyzing || !newTodoTitle.trim() || isCreatingTodo}
                  style={{
                    background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0 1rem',
                    cursor: 'pointer',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    opacity: isAnalyzing || !newTodoTitle.trim() ? 0.6 : 1,
                  }}
                >
                  {isAnalyzing ? '✨ 分析中...' : '✨ AIで分析'}
                </button>
                <button type="submit" className="btn-submit" disabled={isCreatingTodo}>
                  {isCreatingTodo ? '保存中...' : '作成'}
                </button>
              </div>

              {/* AIエラー表示 */}
              {aiError && (
                <div style={{ marginTop: '0.75rem', padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', fontSize: '0.85rem', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  ⚠️ {aiError}
                </div>
              )}

              {/* AI分析結果の表示 */}
              {aiResult && (
                <div style={{ marginTop: '1rem', background: 'rgba(109,40,217,0.07)', border: '1px solid rgba(109,40,217,0.25)', borderRadius: '12px', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#7c3aed' }}>✨ AIが提案するサブタスク</span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      複雑度: {aiResult.complexity} / 合計 {aiResult.totalEstimatedHours}h
                    </span>
                  </div>
                  {aiResult.tips && (
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.75rem', fontStyle: 'italic' }}>
                      💡 {aiResult.tips}
                    </div>
                  )}
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {aiResult.subtasks.map((st, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', background: 'white', borderRadius: '8px', border: '1px solid rgba(109,40,217,0.15)', cursor: 'pointer' }}
                        onClick={() => setSelectedSubtasks(prev => {
                          const next = new Set(prev);
                          next.has(i) ? next.delete(i) : next.add(i);
                          return next;
                        })}
                      >
                        <span style={{ width: '18px', height: '18px', borderRadius: '4px', border: '2px solid #7c3aed', background: selectedSubtasks.has(i) ? '#7c3aed' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {selectedSubtasks.has(i) && <span style={{ color: 'white', fontSize: '12px' }}>✓</span>}
                        </span>
                        <span style={{ flex: 1, fontWeight: 600, fontSize: '0.88rem' }}>{st.title}</span>
                        <span style={{ fontSize: '0.75rem', color: st.priority === 'high' ? '#ef4444' : st.priority === 'medium' ? '#f59e0b' : '#94a3b8', fontWeight: 700 }}>
                          {st.priority === 'high' ? '高' : st.priority === 'medium' ? '中' : '低'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{st.estimatedHours}h</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={handleSaveSubtasks}
                    disabled={selectedSubtasks.size === 0 || isCreatingTodo}
                    style={{ marginTop: '0.75rem', width: '100%', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', padding: '0.6rem', fontWeight: 700, cursor: 'pointer', opacity: selectedSubtasks.size === 0 ? 0.5 : 1 }}
                  >
                    {isCreatingTodo ? '保存中...' : `選択した ${selectedSubtasks.size} 件をTodoに追加`}
                  </button>
                </div>
              )}
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
                <div style={{ marginTop: '0.4rem', color: 'var(--tf-text-soft)', lineHeight: 1.6 }}>
                  {viewingTask.description || <span className="text-muted">（説明はありません）</span>}
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
                  {deletingTodoId === viewingTask.id ? '削除中...' : '削除する'}
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
                    ? '更新中...'
                    : (viewingTask.completed ? '未完了に戻す' : '完了にする')}
                </button>
                {!viewingTask.completed && (
                  <button
                    className="btn-submit"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', opacity: isAnalyzing ? 0.7 : 1 }}
                    disabled={isAnalyzing}
                    onClick={() => {
                      handleAnalyzeTask(viewingTask);
                      setIsTaskModalOpen(true);
                    }}
                  >
                    {isAnalyzing ? '✨ 分析中...' : '✨ AIで分析'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .all-missions-card {
          overflow: hidden;
        }
        .all-mission-count-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          min-height: 22px;
          padding: 0 0.65rem;
          font-size: 0.68rem;
          font-weight: 800;
          color: #0f766e;
          background: rgba(15, 118, 110, 0.12);
          border: 1px solid rgba(15, 118, 110, 0.2);
        }
        .all-missions-list-shell {
          position: relative;
          transition: max-height 0.28s ease;
        }
        .all-missions-list-shell.is-folded {
          overflow: hidden;
        }
        .all-missions-list-shell.is-folded::after {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 88px;
          pointer-events: none;
          background: linear-gradient(to bottom, rgba(244, 249, 248, 0), rgba(244, 249, 248, 0.96));
        }
        .all-missions-list {
          gap: 0.6rem;
        }
        .all-mission-item {
          padding: 0.82rem;
        }
        .all-mission-main {
          min-width: 0;
        }
        .all-mission-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 0.5rem;
        }
        .all-mission-title {
          font-size: 0.9rem;
          line-height: 1.35;
          overflow-wrap: anywhere;
        }
        .all-mission-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.3rem;
          flex-wrap: wrap;
        }
        .all-mission-no-date {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 0.12rem 0.55rem;
          font-size: 0.67rem;
          font-weight: 800;
          border: 1px solid rgba(148, 163, 184, 0.28);
          background: rgba(148, 163, 184, 0.12);
          color: var(--tf-text-muted);
        }
        .all-mission-desc {
          margin: 0.3rem 0 0;
          font-size: 0.78rem;
          color: var(--tf-text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .all-missions-fold-btn {
          width: 100%;
          margin-top: 0.82rem;
          border-radius: 10px;
          border: 1px solid rgba(15, 118, 110, 0.24);
          background: rgba(15, 118, 110, 0.08);
          color: #0f766e;
          font-size: 0.82rem;
          font-weight: 800;
          padding: 0.62rem 0.8rem;
          cursor: pointer;
          transition: background 0.2s ease, transform 0.2s ease;
        }
        .all-missions-fold-btn:hover {
          background: rgba(15, 118, 110, 0.16);
          transform: translateY(-1px);
        }
        @media (max-width: 768px) {
          .all-missions-list-shell.is-folded::after {
            height: 70px;
          }
        }
        .analysis-view,
        .detailed-calendar {
          padding: 0 1.6rem 2rem;
        }
        .analysis-header {
          margin-top: 1.25rem;
          margin-bottom: 1.5rem;
        }
        .analysis-header h1 {
          font-size: 1.6rem;
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
        .hourly-wage-form {
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
        }
        .hourly-wage-input-row {
          display: flex;
          align-items: center;
          gap: 0.55rem;
        }
        .hourly-wage-input {
          flex: 1;
          min-width: 0;
          border: 1px solid var(--tf-border);
          border-radius: 10px;
          padding: 0.46rem 0.6rem;
          font-size: 0.83rem;
          color: var(--tf-text);
          background: #ffffff;
        }
        .btn-hourly-wage-save {
          border: none;
          border-radius: 9px;
          padding: 0.46rem 0.72rem;
          min-width: 66px;
          background: linear-gradient(135deg, var(--tf-primary), var(--tf-primary-light));
          color: #ffffff;
          font-size: 0.74rem;
          font-weight: 800;
          cursor: pointer;
        }
        .btn-hourly-wage-save:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .hourly-wage-error {
          color: #b91c1c;
          font-size: 0.72rem;
          font-weight: 600;
          line-height: 1.35;
        }

        .analysis-main-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .domain-manager-toolbar {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          margin-bottom: 1rem;
        }
        .domain-manage-form {
          display: flex;
          gap: 0.55rem;
          flex-wrap: wrap;
        }
        .domain-manage-input {
          flex: 1;
          min-width: 220px;
          border: 1px solid var(--tf-border);
          border-radius: 10px;
          padding: 0.58rem 0.75rem;
          font-size: 0.85rem;
          color: var(--tf-text);
          background: #ffffff;
        }
        .btn-domain-add {
          border: none;
          border-radius: 10px;
          padding: 0.58rem 0.9rem;
          background: linear-gradient(135deg, var(--tf-primary), var(--tf-primary-light));
          color: white;
          font-weight: 700;
          font-size: 0.78rem;
          cursor: pointer;
        }
        .btn-domain-add:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .blacklist-error-text {
          font-size: 0.78rem;
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          padding: 0.4rem 0.6rem;
          background: rgba(239, 68, 68, 0.08);
          color: #b91c1c;
        }
        .blacklist-chip-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.45rem;
        }
        .blacklist-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.2rem 0.45rem 0.2rem 0.55rem;
          border-radius: 999px;
          border: 1px solid rgba(15, 118, 110, 0.25);
          background: rgba(15, 118, 110, 0.08);
          color: #0f766e;
          font-size: 0.72rem;
          font-weight: 700;
        }
        .blacklist-chip-remove {
          border: none;
          background: transparent;
          color: #0f766e;
          font-size: 0.8rem;
          line-height: 1;
          cursor: pointer;
          padding: 0;
        }
        .blacklist-chip-remove:disabled {
          opacity: 0.55;
          cursor: not-allowed;
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
        .domain-actions {
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }
        .btn-domain-action.primary {
          background: rgba(15, 118, 110, 0.12);
          color: #0f766e;
        }
        .btn-domain-action.danger {
          background: rgba(239, 68, 68, 0.14);
          color: #b91c1c;
        }
        .btn-domain-action:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
        .btn-domain-action:hover {
          background: rgba(15, 118, 110, 0.2);
          color: var(--tf-primary);
        }
        .icon-spin {
          animation: tfSpin 1s linear infinite;
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out;
        }
        @keyframes tfSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div
        id="extension-sync-data"
        data-user-id={user?.id}
        data-api-url={API_BASE.startsWith('http') ? API_BASE : (typeof window !== 'undefined' ? window.location.origin + API_BASE : '')}
        data-sync-token={blacklistSyncToken}
        style={{ display: 'none' }}
      ></div>
    </div>
  );
}
