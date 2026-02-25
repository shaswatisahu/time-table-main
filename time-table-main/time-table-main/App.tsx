import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, 
  CalendarDays, 
  CheckCircle2, 
  TrendingUp, 
  Bell, 
  LogOut,
  Search,
  AlertTriangle,
  Moon,
  Sun,
  Activity,
  Loader2,
  Upload,
  Music2,
  Play
} from 'lucide-react';
import { StatCard } from './components/StatCard';
import { WeeklyCalendar } from './components/WeeklyCalendar';
import { ChartsSection } from './components/ChartsSection';
import { GeminiAdvisor } from './components/GeminiAdvisor';
import { TaskModal } from './components/TaskModal';
import { DurationModal } from './components/DurationModal';
import { Task, WeeklyStats, TrendData, ChartDataPoint, ViewMode } from './types';
import { login, me, register } from './services/authService';
import { fetchUserData, saveUserData } from './services/userDataService';

// Mock Data
const INITIAL_STATS: WeeklyStats = {
  hoursToday: 4.5,
  tasksPlanned: 12,
  tasksCompleted: 8,
  performance: 76,
};

const INITIAL_TASKS: Task[] = [
  { id: '1', title: 'Math Study', time: '9:00am - 11:00am', day: 'Mon', category: 'Math', status: 'completed', color: 'bg-blue-600', priority: 'High' },
  { id: '2', title: 'Gym Workout', time: '7:00am - 8:00am', day: 'Tue', category: 'Gym', status: 'completed', color: 'bg-green-500', priority: 'Medium' },
  { id: '3', title: 'DSA Practice', time: '6:00pm - 8:00pm', day: 'Wed', category: 'Coding', status: 'pending', color: 'bg-red-500', priority: 'High' },
  { id: '4', title: 'History Review', time: '2:00pm - 3:30pm', day: 'Thu', category: 'History', status: 'completed', color: 'bg-green-600', priority: 'Low' },
  { id: '5', title: 'Physics Class', time: '10:00am - 12:00pm', day: 'Fri', category: 'Physics', status: 'completed', color: 'bg-blue-500', priority: 'Medium' },
  { id: '6', title: 'Read Book', time: '4:00pm - 5:00pm', day: 'Sat', category: 'Reading', status: 'missed', color: 'bg-red-500', priority: 'Low' },
];

// --- STATIC CHART DATASETS ---
const WEEKLY_ACTIVITY: TrendData[] = [
  { label: 'Mon', value: 4.4 },
  { label: 'Tue', value: 3.5 },
  { label: 'Wed', value: 5.1 },
  { label: 'Thu', value: 4.6 },
  { label: 'Fri', value: 3.8 },
  { label: 'Sat', value: 3.1 },
  { label: 'Sun', value: 4.7 },
];

const WEEKLY_PERFORMANCE: TrendData[] = [
  { label: 'Mon', value: 70 },
  { label: 'Tue', value: 65 },
  { label: 'Wed', value: 85 },
  { label: 'Thu', value: 80 },
  { label: 'Fri', value: 75 },
  { label: 'Sat', value: 90 },
  { label: 'Sun', value: 95 },
];

const MONTHLY_ACTIVITY: TrendData[] = [
  { label: 'Week 1', value: 28 },
  { label: 'Week 2', value: 32 },
  { label: 'Week 3', value: 25 },
  { label: 'Week 4', value: 35 },
];

const MONTHLY_PERFORMANCE: TrendData[] = [
  { label: 'Week 1', value: 72 },
  { label: 'Week 2', value: 78 },
  { label: 'Week 3', value: 75 },
  { label: 'Week 4', value: 84 },
];

// Generate 24 hour Activity Data (12am - 11pm)
const generate24HourData = (): TrendData[] => {
  const data: TrendData[] = [];
  for (let i = 0; i < 24; i++) {
    const period = i < 12 ? 'AM' : 'PM';
    const hour = i === 0 ? 12 : (i > 12 ? i - 12 : i);
    
    // Add some random initial data for demo purposes
    let val = 0;
    if (i >= 9 && i <= 17) val = Math.floor(Math.random() * 40) + 10; // 9-5 work hours

    data.push({
      label: `${hour} ${period}`,
      value: val
    });
  }
  return data;
};

// Generate 24 hour Performance Data
const generate24HourPerformance = (): TrendData[] => {
  const data: TrendData[] = [];
  for (let i = 0; i < 24; i++) {
    const period = i < 12 ? 'AM' : 'PM';
    const hour = i === 0 ? 12 : (i > 12 ? i - 12 : i);
    data.push({
      label: `${hour} ${period}`,
      value: Math.floor(Math.random() * 30) + 60 // Random performance 60-90
    });
  }
  return data;
};

const SUBJECT_DATA: ChartDataPoint[] = [
  { name: 'Math', value: 35 },
  { name: 'Coding', value: 25 },
  { name: 'History', value: 20 },
  { name: 'Fitness', value: 20 },
];

const dayShort = (date: Date): string =>
  date.toLocaleDateString('en-US', { weekday: 'short' });

const parseTaskEndTime = (taskTime: string, now: Date): Date | null => {
  const rawEnd = taskTime.split('-')[1]?.trim() || taskTime.trim();
  const match = rawEnd.match(/(\d{1,2})\s*:\s*(\d{2})\s*(AM|PM|am|pm)/);
  if (!match) return null;

  let hour = Number(match[1]) % 12;
  const minute = Number(match[2]);
  if (match[3].toUpperCase() === 'PM') hour += 12;

  const end = new Date(now);
  end.setHours(hour, minute, 0, 0);
  return end;
};

interface NotificationItem {
  id: number;
  text: string;
  time: string;
  unread: boolean;
  type: 'warning' | 'error' | 'info';
}

type Tab = 'dashboard' | 'tasks' | 'timelog' | 'analytics';
type AuthMode = 'login' | 'register';

const App: React.FC = () => {
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // Auth State
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('auth_token') || '');
  const [currentUserName, setCurrentUserName] = useState('');
  const [currentUserImage, setCurrentUserImage] = useState<string | null>(null);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTone, setReminderTone] = useState<string | null>(null);
  const hydratedUserData = useRef(false);
  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const reminderToneInputRef = useRef<HTMLInputElement>(null);
  const triggeredReminderIds = useRef<Set<string>>(new Set());

  // Application State
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [stats, setStats] = useState<WeeklyStats>(INITIAL_STATS);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  
  // View State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('Weekly');
  const [searchQuery, setSearchQuery] = useState('');

  // Chart State for Daily View
  const [dailyActivity, setDailyActivity] = useState<TrendData[]>([]);
  const [dailyPerformance, setDailyPerformance] = useState<TrendData[]>([]);

  useEffect(() => {
    const initAuth = async () => {
      if (!authToken) {
        setIsAuthLoading(false);
        hydratedUserData.current = false;
        return;
      }

      try {
        const meResult = await me(authToken);
        setCurrentUserName(meResult.user.name);
        const dataResult = await fetchUserData(authToken);
        if (Array.isArray(dataResult.tasks) && dataResult.tasks.length > 0) {
          setTasks(dataResult.tasks);
        }
        if (dataResult.stats) {
          setStats(dataResult.stats);
        }
        setCurrentUserImage(dataResult.profileImage || null);
        setReminderEnabled(Boolean(dataResult.reminderEnabled));
        setReminderTone(dataResult.reminderTone || null);
        hydratedUserData.current = true;
      } catch {
        localStorage.removeItem('auth_token');
        setAuthToken('');
        setCurrentUserName('');
        setCurrentUserImage(null);
        setReminderEnabled(false);
        setReminderTone(null);
        hydratedUserData.current = false;
      } finally {
        setIsAuthLoading(false);
      }
    };

    initAuth();
  }, [authToken]);

  // Initialize daily data
  useEffect(() => {
    setDailyActivity(generate24HourData());
    setDailyPerformance(generate24HourPerformance());
  }, []);

  useEffect(() => {
    if (!authToken || !hydratedUserData.current || isAuthLoading) return;

    const timeoutId = setTimeout(() => {
      saveUserData(
        authToken,
        tasks,
        stats,
        currentUserImage,
        { reminderEnabled, reminderTone }
      ).catch(() => {
        // Silent fail keeps UI responsive; user can continue and retry on next change.
      });
    }, 600);

    return () => clearTimeout(timeoutId);
  }, [authToken, tasks, stats, currentUserImage, reminderEnabled, reminderTone, isAuthLoading]);

  useEffect(() => {
    if (!authToken || !reminderEnabled) return;

    const checkMissedTasks = () => {
      const now = new Date();
      const today = dayShort(now);

      setTasks(prev => {
        let changed = false;
        const next = prev.map(task => {
          if (task.status !== 'pending' || task.day !== today) return task;

          const taskEnd = parseTaskEndTime(task.time, now);
          if (!taskEnd || now <= taskEnd) return task;

          changed = true;
          if (!triggeredReminderIds.current.has(task.id)) {
            triggeredReminderIds.current.add(task.id);
            playReminderSound();

            if ('Notification' in window) {
              if (Notification.permission === 'granted') {
                new Notification('Task missed', { body: `${task.title} was marked as missed.` });
              } else if (Notification.permission === 'default') {
                Notification.requestPermission().catch(() => {});
              }
            }
          }

          return { ...task, status: 'missed' as const };
        });

        return changed ? next : prev;
      });
    };

    checkMissedTasks();
    const intervalId = window.setInterval(checkMissedTasks, 30000);
    return () => window.clearInterval(intervalId);
  }, [authToken, reminderEnabled, reminderTone]);

  // --- Notification Logic ---
  useEffect(() => {
    const newNotifications: NotificationItem[] = [];
    let idCounter = 1;

    // 1. Check for Missed Tasks
    const missedTasks = tasks.filter(t => t.status === 'missed');
    missedTasks.forEach(t => {
      newNotifications.push({
        id: idCounter++,
        text: `Missed task: ${t.title}`,
        time: "Check schedule",
        unread: true,
        type: 'error'
      });
    });

    // 2. Check for Upcoming Deadlines (if dueDate exists)
    const today = new Date();
    today.setHours(0,0,0,0);
    
    tasks.forEach(t => {
      if (t.dueDate) {
        const due = new Date(t.dueDate);
        due.setHours(0,0,0,0);
        
        const diffTime = due.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0 && t.status !== 'completed') {
           newNotifications.push({
            id: idCounter++,
            text: `Due today: ${t.title}`,
            time: "Today",
            unread: true,
            type: 'warning'
          });
        } else if (diffDays === 1 && t.status !== 'completed') {
           newNotifications.push({
            id: idCounter++,
            text: `Due tomorrow: ${t.title}`,
            time: "Tomorrow",
            unread: true,
            type: 'info'
          });
        } else if (diffDays < 0 && t.status !== 'completed') {
            newNotifications.push({
            id: idCounter++,
            text: `Overdue: ${t.title}`,
            time: `${Math.abs(diffDays)} days ago`,
            unread: true,
            type: 'error'
          });
        }
      }
    });

    setNotifications(newNotifications);
  }, [tasks]);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({...n, unread: false})));
  };
  
  const unreadCount = notifications.filter(n => n.unread).length;

  // UI State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isDurationModalOpen, setIsDurationModalOpen] = useState(false);
  const [selectedDurationHour, setSelectedDurationHour] = useState<{label: string, value: number} | null>(null);
  const [isReminderPanelOpen, setIsReminderPanelOpen] = useState(false);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthSubmitting(true);
    try {
      const response = authMode === 'login'
        ? await login(authEmail, authPassword)
        : await register(authName.trim(), authEmail, authPassword);

      localStorage.setItem('auth_token', response.token);
      setAuthToken(response.token);
      setCurrentUserName(response.user.name);

      if (Array.isArray(response.data?.tasks) && response.data.tasks.length > 0) {
        setTasks(response.data.tasks);
      } else {
        setTasks(INITIAL_TASKS);
      }

      if (response.data?.stats) {
        setStats(response.data.stats);
      } else {
        setStats(INITIAL_STATS);
      }
      setCurrentUserImage(response.data?.profileImage || null);
      setReminderEnabled(Boolean(response.data?.reminderEnabled));
      setReminderTone(response.data?.reminderTone || null);

      hydratedUserData.current = true;
      setAuthPassword('');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setAuthToken('');
    setCurrentUserName('');
    setCurrentUserImage(null);
    setReminderEnabled(false);
    setReminderTone(null);
    setTasks(INITIAL_TASKS);
    setStats(INITIAL_STATS);
    hydratedUserData.current = false;
    triggeredReminderIds.current = new Set();
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCurrentUserImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleReminderToneUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setReminderTone(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const playReminderSound = () => {
    if (reminderTone) {
      const audio = new Audio(reminderTone);
      audio.play().catch(() => {});
      return;
    }

    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.55);
    osc.start();
    osc.stop(ctx.currentTime + 0.55);
  };

  // Handlers
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    // Intelligent view mode switching based on tab
    if (tab === 'timelog') {
      setViewMode('Daily');
    } else if (tab === 'analytics') {
      setViewMode('Monthly');
    } else {
      setViewMode('Weekly');
    }
  };

  const handleAddTask = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    setStats(prev => ({...prev, tasksPlanned: prev.tasksPlanned - 1}));
  };

  const handleSaveTask = (task: Task) => {
    if (editingTask) {
      setTasks(prev => prev.map(t => t.id === task.id ? task : t));
    } else {
      setTasks(prev => [...prev, task]);
      setStats(prev => ({...prev, tasksPlanned: prev.tasksPlanned + 1}));
    }
    setIsTaskModalOpen(false);
  };

  const handleDataPointClick = (data: TrendData) => {
    if (viewMode === 'Daily') {
       setSelectedDurationHour({
         label: data.label,
         value: data.value
       });
       setIsDurationModalOpen(true);
    }
  };

  const handleDurationSave = (minutes: number) => {
     if (selectedDurationHour) {
       setDailyActivity(prev => prev.map(d => 
         d.label === selectedDurationHour.label ? {...d, value: minutes} : d
       ));
       setStats(prev => ({...prev, hoursToday: prev.hoursToday + (minutes/60)}));
     }
  };

  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'Weekly') newDate.setDate(newDate.getDate() - 7);
    else if (viewMode === 'Daily') newDate.setDate(newDate.getDate() - 1);
    else newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'Weekly') newDate.setDate(newDate.getDate() + 7);
    else if (viewMode === 'Daily') newDate.setDate(newDate.getDate() + 1);
    else newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  // --- Render Helpers ---

  const renderDashboardStats = () => (
     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in-up">
        <StatCard 
          title="Hours Focused" 
          value={stats.hoursToday.toFixed(1)} 
          subValue="today" 
          icon={Clock} 
          gradient="bg-gradient-to-br from-blue-500 to-blue-600"
          iconBg="bg-blue-400"
        />
        <StatCard 
          title="Tasks Completed" 
          value={`${stats.tasksCompleted}/${stats.tasksPlanned}`} 
          subValue="tasks" 
          icon={CheckCircle2} 
          gradient="bg-gradient-to-br from-green-500 to-emerald-600"
          iconBg="bg-green-400"
        />
        <StatCard 
          title="Performance" 
          value={`${stats.performance}%`} 
          subValue="score" 
          icon={TrendingUp} 
          gradient="bg-gradient-to-br from-purple-500 to-indigo-600"
          iconBg="bg-purple-400"
        />
        <StatCard 
          title="Streak" 
          value="5" 
          subValue="days" 
          icon={Activity} 
          gradient="bg-gradient-to-br from-orange-400 to-pink-500"
          iconBg="bg-orange-300"
        />
     </div>
  );

  if (isAuthLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="flex items-center gap-3 text-lg">
          <Loader2 className="animate-spin" />
          Loading account...
        </div>
      </div>
    );
  }

  if (!authToken) {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-4 text-white overflow-hidden">
        <video
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="/login-bg.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/55 backdrop-blur-[1px]" />

        <div className="relative z-10 w-full max-w-md p-6">
          <h1 className="text-2xl font-bold mb-1">{authMode === 'login' ? 'Welcome back' : 'Create account'}</h1>
          <p className="text-sm text-gray-300 mb-6">Login to load your saved tasks and stats.</p>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authMode === 'register' && (
              <input
                type="text"
                placeholder="Full name"
                value={authName}
                onChange={(e) => setAuthName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-white/30 bg-white/10 placeholder:text-gray-300"
                required
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-white/30 bg-white/10 placeholder:text-gray-300"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-white/30 bg-white/10 placeholder:text-gray-300"
              required
              minLength={6}
            />

            {authError && <p className="text-sm text-red-500">{authError}</p>}

            <button
              type="submit"
              disabled={isAuthSubmitting}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-60"
            >
              {isAuthSubmitting ? 'Please wait...' : authMode === 'login' ? 'Login' : 'Register'}
            </button>
          </form>

          <button
            onClick={() => {
              setAuthError('');
              setAuthMode(authMode === 'login' ? 'register' : 'login');
            }}
            className="mt-4 text-sm text-blue-300 hover:underline"
          >
            {authMode === 'login' ? "Don't have an account? Register" : 'Already have an account? Login'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
        
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-20 lg:w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all z-20">
          <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-gray-100 dark:border-gray-700">
            <div className="bg-blue-600 p-2 rounded-lg">
              <TrendingUp className="text-white" size={24} />
            </div>
            <span className="hidden lg:block ml-3 font-bold text-xl tracking-tight">StudyFlow</span>
          </div>
          
          <nav className="flex-1 py-6 space-y-2 px-3">
             {[
               { id: 'dashboard', icon: CalendarDays, label: 'Dashboard' },
               { id: 'tasks', icon: CheckCircle2, label: 'Tasks' },
               { id: 'timelog', icon: Clock, label: 'Time Log' },
               { id: 'analytics', icon: Activity, label: 'Analytics' },
             ].map((item) => (
               <button 
                key={item.id}
                onClick={() => handleTabChange(item.id as Tab)}
                className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 group ${
                  activeTab === item.id 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 translate-x-1' 
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
               >
                 <div className={`p-1 ${activeTab === item.id ? '' : 'group-hover:scale-110 transition-transform'}`}>
                    <item.icon size={22} className={activeTab === item.id ? 'text-white' : ''} />
                 </div>
                 <span className="hidden lg:block ml-3 font-medium tracking-wide">{item.label}</span>
                 {activeTab === item.id && (
                   <div className="hidden lg:block ml-auto w-1.5 h-1.5 rounded-full bg-white/80"></div>
                 )}
               </button>
             ))}
          </nav>
          
          <div className="p-4 border-t border-gray-100 dark:border-gray-700">
            <button onClick={toggleTheme} className="w-full flex items-center justify-center lg:justify-start p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors">
              {isDarkMode ? <Sun size={22} /> : <Moon size={22} />}
              <span className="hidden lg:block ml-3 font-medium">Toggle Theme</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          
          {/* Header */}
          <header className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 z-10 sticky top-0">
             <div className="flex items-center md:hidden">
               <div className="bg-blue-600 p-1.5 rounded-lg mr-2">
                 <TrendingUp className="text-white" size={18} />
               </div>
               <span className="font-bold text-lg">StudyFlow</span>
             </div>

             <div className="hidden md:flex items-center flex-1 max-w-xl ml-4">
               <div className="relative w-full">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                   <Search size={18} className="text-gray-400" />
                 </div>
                 <input 
                   type="text" 
                   placeholder="Search tasks..." 
                   className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg leading-5 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:bg-white dark:focus:bg-gray-700 focus:ring-1 focus:ring-blue-500 transition-colors sm:text-sm"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                 />
               </div>
             </div>

             <div className="flex items-center gap-3 sm:gap-4">
                <button 
                  onClick={toggleTheme} 
                  className="md:hidden p-2 text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-white transition-colors"
                >
                  {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                <button className="relative p-2 text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-white transition-colors">
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-800"></span>
                  )}
                </button>
                <button
                  onClick={() => setIsReminderPanelOpen(prev => !prev)}
                  className={`p-2 rounded-lg transition-colors ${
                    reminderEnabled
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                      : 'text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-white'
                  }`}
                  title="Reminder settings"
                >
                  <Music2 size={19} />
                </button>
                <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block"></div>
                <div className="flex items-center gap-3 pl-1">
                   <button
                     onClick={() => profileImageInputRef.current?.click()}
                     className="h-9 w-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold shadow-sm cursor-pointer overflow-hidden"
                     title="Upload profile photo"
                   >
                     {currentUserImage ? (
                       <img src={currentUserImage} alt="Profile" className="w-full h-full object-cover" />
                     ) : (
                       (currentUserName?.trim()?.[0] || 'U').toUpperCase()
                     )}
                   </button>
                   <input
                     ref={profileImageInputRef}
                     type="file"
                     accept="image/*"
                     onChange={handleProfileImageChange}
                     className="hidden"
                   />
                   <div className="hidden sm:block text-sm">
                     <p className="font-medium text-gray-700 dark:text-gray-200">{currentUserName || 'User'}</p>
                     <p className="text-xs text-gray-500 dark:text-gray-400">Signed in</p>
                   </div>
                   <button
                     onClick={handleLogout}
                     className="p-2 rounded-lg text-gray-500 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                     title="Logout"
                   >
                     <LogOut size={18} />
                   </button>
                </div>
             </div>
          </header>

          {isReminderPanelOpen && (
            <div className="absolute top-16 right-4 sm:right-6 z-30 w-80 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl p-4">
              <h4 className="font-semibold text-gray-800 dark:text-white mb-3">Missed Task Reminder</h4>

              <label className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-200 mb-3">
                <span>Enable auto reminder</span>
                <input
                  type="checkbox"
                  checked={reminderEnabled}
                  onChange={(e) => setReminderEnabled(e.target.checked)}
                />
              </label>

              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => reminderToneInputRef.current?.click()}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2"
                >
                  <Upload size={15} />
                  Upload Music
                </button>
                <button
                  onClick={playReminderSound}
                  className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm flex items-center gap-1"
                >
                  <Play size={14} />
                  Test
                </button>
              </div>

              <input
                ref={reminderToneInputRef}
                type="file"
                accept="audio/*"
                onChange={handleReminderToneUpload}
                className="hidden"
              />

              <p className="text-xs text-gray-500 dark:text-gray-400">
                When task time is over and status is still pending, it will be marked missed and play this sound.
              </p>
            </div>
          )}

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scroll-smooth">
             
            {/* View Switching Logic */}

            {activeTab === 'dashboard' && (
              <>
                 <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard Overview</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                 </div>
                 
                 {renderDashboardStats()}
                 
                 <div className="mb-8 animate-fade-in-up" style={{animationDelay: '100ms'}}>
                   <ChartsSection 
                     viewMode={viewMode}
                     activityData={viewMode === 'Daily' ? dailyActivity : (viewMode === 'Weekly' ? WEEKLY_ACTIVITY : MONTHLY_ACTIVITY)}
                     performanceData={viewMode === 'Daily' ? dailyPerformance : (viewMode === 'Weekly' ? WEEKLY_PERFORMANCE : MONTHLY_PERFORMANCE)}
                     subjectDistribution={SUBJECT_DATA}
                     onDataPointClick={handleDataPointClick}
                     isDarkMode={isDarkMode}
                   />
                 </div>

                 <div className="animate-fade-in-up" style={{animationDelay: '200ms'}}>
                   <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                     <CalendarDays size={20} className="text-blue-500" />
                     Schedule
                   </h2>
                   <WeeklyCalendar 
                     tasks={tasks.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()))}
                     startDate={currentDate}
                     view={viewMode}
                     onViewChange={setViewMode}
                     onPrev={handlePrev}
                     onNext={handleNext}
                     onAddTask={handleAddTask}
                     onTaskClick={handleEditTask}
                   />
                 </div>
              </>
            )}

            {activeTab === 'tasks' && (
              <>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Task Management</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-fade-in-up">
                    <StatCard 
                      title="Tasks Planned" 
                      value={`${stats.tasksPlanned}`} 
                      subValue="total"
                      icon={CalendarDays} 
                      gradient="bg-gradient-to-br from-blue-500 to-blue-600"
                      iconBg="bg-blue-400"
                    />
                    <StatCard 
                      title="Tasks Completed" 
                      value={`${stats.tasksCompleted}`} 
                      subValue="done"
                      icon={CheckCircle2} 
                      gradient="bg-gradient-to-br from-green-500 to-emerald-600"
                      iconBg="bg-green-400"
                    />
                    <StatCard 
                      title="Pending" 
                      value={`${tasks.filter(t => t.status === 'pending').length}`} 
                      subValue="remaining"
                      icon={AlertTriangle} 
                      gradient="bg-gradient-to-br from-orange-400 to-orange-500"
                      iconBg="bg-orange-300"
                    />
                 </div>

                 <div className="animate-fade-in-up" style={{animationDelay: '100ms'}}>
                   <WeeklyCalendar 
                      tasks={tasks.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()))}
                      startDate={currentDate}
                      view={viewMode}
                      onViewChange={setViewMode}
                      onPrev={handlePrev}
                      onNext={handleNext}
                      onAddTask={handleAddTask}
                      onTaskClick={handleEditTask}
                   />
                 </div>
              </>
            )}

            {activeTab === 'timelog' && (
              <>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Time Log & Activity</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 animate-fade-in-up">
                    <StatCard 
                      title="Hours Focused" 
                      value={stats.hoursToday.toFixed(1)} 
                      subValue="today" 
                      icon={Clock} 
                      gradient="bg-gradient-to-br from-indigo-500 to-purple-600"
                      iconBg="bg-indigo-400"
                    />
                    <StatCard 
                      title="Weekly Average" 
                      value="4.2 hrs" 
                      subValue="per day"
                      icon={Activity} 
                      gradient="bg-gradient-to-br from-blue-500 to-cyan-600"
                      iconBg="bg-blue-400"
                    />
                 </div>

                 <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 animate-fade-in-up" style={{animationDelay: '100ms'}}>
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-gray-800 dark:text-white">Daily Activity Breakdown</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Click on any bar to log or edit time for that specific hour.</p>
                    </div>
                    <ChartsSection 
                      viewMode={'Daily'} // Force Daily View
                      activityData={dailyActivity}
                      performanceData={dailyPerformance}
                      subjectDistribution={SUBJECT_DATA}
                      onDataPointClick={handleDataPointClick}
                      isDarkMode={isDarkMode}
                    />
                 </div>
              </>
            )}

            {activeTab === 'analytics' && (
               <>
                 <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Performance Analytics</h2>
                 </div>

                 {renderDashboardStats()}
                 
                 <div className="mt-8 animate-fade-in-up" style={{animationDelay: '100ms'}}>
                   <ChartsSection 
                     viewMode={viewMode === 'Daily' ? 'Weekly' : viewMode} // Default to Weekly/Monthly if switching from Dashboard
                     activityData={viewMode === 'Monthly' ? MONTHLY_ACTIVITY : WEEKLY_ACTIVITY}
                     performanceData={viewMode === 'Monthly' ? MONTHLY_PERFORMANCE : WEEKLY_PERFORMANCE}
                     subjectDistribution={SUBJECT_DATA}
                     onDataPointClick={handleDataPointClick}
                     isDarkMode={isDarkMode}
                   />
                 </div>
               </>
            )}

          </div>
        </main>

        {/* Modals & Overlays */}
        <TaskModal 
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
          taskToEdit={editingTask}
        />

        <DurationModal 
          isOpen={isDurationModalOpen}
          onClose={() => setIsDurationModalOpen(false)}
          onSave={handleDurationSave}
          hourLabel={selectedDurationHour?.label || ''}
          currentValue={selectedDurationHour?.value || 0}
        />

        <GeminiAdvisor stats={stats} tasks={tasks} />

      </div>
    </div>
  );
};

export default App;
