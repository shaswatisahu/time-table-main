import React, { useState } from 'react';
import { Task, ViewMode } from '../types';
import { ChevronLeft, ChevronRight, Plus, Filter } from 'lucide-react';

interface WeeklyCalendarProps {
  tasks: Task[];
  startDate: Date;
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onPrev: () => void;
  onNext: () => void;
  onAddTask: () => void;
  onTaskClick: (task: Task) => void;
}

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({ 
  tasks, 
  startDate,
  view,
  onViewChange,
  onPrev,
  onNext,
  onAddTask,
  onTaskClick
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'missed'>('all');
  
  // --- Date Helpers ---

  const getStartDateOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const getCalendarDays = () => {
    const days = [];
    
    if (view === 'Daily') {
      days.push({
        name: WEEK_DAYS[startDate.getDay() === 0 ? 6 : startDate.getDay() - 1],
        date: startDate.getDate(),
        fullDate: new Date(startDate),
        isCurrentMonth: true
      });
      return days;
    }

    if (view === 'Weekly') {
      const startOfWeek = getStartDateOfWeek(startDate);
      for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        days.push({
          name: WEEK_DAYS[i],
          date: d.getDate(),
          fullDate: d,
          isCurrentMonth: true
        });
      }
      return days;
    }

    if (view === 'Monthly') {
      const year = startDate.getFullYear();
      const month = startDate.getMonth();
      const firstDayOfMonth = new Date(year, month, 1);
      const lastDayOfMonth = new Date(year, month + 1, 0);
      
      // Start from the Monday before the 1st (if 1st isn't Mon)
      const startDay = firstDayOfMonth.getDay(); // 0 is Sun, 1 is Mon
      const daysToBacktrack = startDay === 0 ? 6 : startDay - 1;
      
      const currentIterator = new Date(firstDayOfMonth);
      currentIterator.setDate(firstDayOfMonth.getDate() - daysToBacktrack);

      // We typically want 5 or 6 rows (35 or 42 days) to fill a calendar grid
      for (let i = 0; i < 35; i++) {
         days.push({
           name: WEEK_DAYS[i % 7], // Cycles through Mon-Sun
           date: currentIterator.getDate(),
           fullDate: new Date(currentIterator),
           isCurrentMonth: currentIterator.getMonth() === month
         });
         currentIterator.setDate(currentIterator.getDate() + 1);
      }
      return days;
    }

    return [];
  };

  const calendarDays = getCalendarDays();
  const startDay = calendarDays[0].fullDate;
  const endDay = calendarDays[calendarDays.length - 1].fullDate;
  
  const formatDateRange = () => {
    const options: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' };
    if (view === 'Monthly') {
      return startDate.toLocaleDateString('en-US', options);
    }
    if (view === 'Daily') {
      return startDate.toLocaleDateString('en-US', { ...options, day: 'numeric', weekday: 'long' });
    }
    // Weekly
    const start = calendarDays[0].fullDate;
    const end = calendarDays[6].fullDate;
    const sStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const eStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${sStr} - ${eStr}, ${end.getFullYear()}`;
  };

  const getTasksForDay = (date: Date) => {
    return tasks.filter(t => {
      // Logic for repetitive weekly tasks (mock data)
      // In a real app, check exact dates. Here we check Day name matching for Weekly view simplicity
      // For Daily/Monthly we should ideally check full dates, but for this mock we'll stick to day names
      // to ensure data shows up.
      
      const dayName = WEEK_DAYS[date.getDay() === 0 ? 6 : date.getDay() - 1];
      const matchesDay = t.day === dayName;
      
      // Filter by status
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      
      return matchesDay && matchesStatus;
    });
  };

  // Helper for priority color badge
  const getPriorityBadgeStyle = (priority?: string) => {
    switch(priority) {
      case 'High': return 'bg-red-500/90 text-white';
      case 'Medium': return 'bg-yellow-400/90 text-yellow-900';
      case 'Low': return 'bg-blue-400/90 text-white';
      default: return 'bg-gray-400/50 text-white';
    }
  };

  const gridCols = view === 'Monthly' ? 'grid-cols-7' : (view === 'Weekly' ? 'grid-cols-1 sm:grid-cols-3 lg:grid-cols-7' : 'grid-cols-1');
  const minHeight = view === 'Monthly' ? 'min-h-[120px]' : 'min-h-[250px]';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-6 transition-colors">
      {/* Controls Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-col xl:flex-row items-center justify-between gap-4">
        
        {/* Left Side: View Switcher & Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
          {/* View Switcher */}
          <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
            {(['Monthly', 'Weekly', 'Daily'] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => onViewChange(v)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                  view === v 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-gray-600'
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          {/* Filter Dropdown */}
          <div className="relative group w-full sm:w-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter size={16} className={`${statusFilter !== 'all' ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
            </div>
            <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className={`w-full sm:w-auto pl-9 pr-8 py-2 border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors appearance-none cursor-pointer min-w-[140px] ${
                  statusFilter !== 'all' 
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300' 
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
            >
                <option value="all">Show All</option>
                <option value="completed">Completed Only</option>
                <option value="pending">Pending Only</option>
                <option value="missed">Missed Only</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                 <svg className={`w-4 h-4 ${statusFilter !== 'all' ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>

        {/* Right Side: Navigation & Add Task */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto justify-between xl:justify-end">
          {/* Date Navigation */}
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-gray-50 dark:bg-gray-700/50 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
              <button onClick={onPrev} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-500 dark:text-gray-400 transition-colors">
                <ChevronLeft size={18} />
              </button>
              <button onClick={onNext} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-500 dark:text-gray-400 transition-colors">
                <ChevronRight size={18} />
              </button>
            </div>
            <span className="text-gray-700 dark:text-gray-200 font-semibold text-sm md:text-base min-w-[160px] text-center">
              {formatDateRange()}
            </span>
          </div>

          {/* Add Task Button */}
          <button 
            onClick={onAddTask}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm hover:shadow whitespace-nowrap"
          >
            <Plus size={16} />
            Add Task
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className={`grid ${gridCols} divide-y sm:divide-y-0 sm:divide-x divide-gray-200 dark:divide-gray-700 bg-gray-50/30 dark:bg-gray-900/20`}>
        {calendarDays.map((day, index) => {
          const isToday = new Date().getDate() === day.date && new Date().getMonth() === day.fullDate.getMonth();
          const dayTasks = getTasksForDay(day.fullDate);
          
          return (
            <div key={`${day.name}-${index}`} className={`${minHeight} flex flex-col ${isToday ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''} ${!day.isCurrentMonth && view === 'Monthly' ? 'opacity-40 bg-gray-50 dark:bg-gray-900/40' : ''}`}>
              {/* Day Header */}
              <div className={`text-center py-2 sm:py-3 border-b border-gray-100 dark:border-gray-700 ${isToday ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-gray-800'}`}>
                {(view === 'Weekly' || view === 'Daily' || index < 7) && (
                   <div className={`text-xs font-bold uppercase mb-1 ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                     {day.name}
                   </div>
                )}
                <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                  isToday ? 'bg-blue-600 text-white' : 'text-gray-900 dark:text-gray-100'
                }`}>
                  {day.date}
                </div>
              </div>
              
              {/* Tasks Container */}
              <div className="flex-1 p-2 space-y-2 bg-transparent overflow-y-auto max-h-[300px]">
                {dayTasks.map((task) => (
                  <div 
                    key={task.id} 
                    onClick={() => onTaskClick(task)}
                    className={`group p-2 rounded-lg border-l-4 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden ${
                      task.status === 'missed' 
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-500' 
                        : task.color
                    } ${view === 'Monthly' ? 'py-1 px-1.5' : 'p-3'}`}
                  >
                     {/* Hover effect overlay */}
                    <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-5 transition-opacity"></div>
                    
                    {/* Priority Badge - Only show on Weekly/Daily or if ample space */}
                    {task.status !== 'missed' && task.priority && view !== 'Monthly' && (
                       <div className={`absolute top-2 right-2 text-[8px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${getPriorityBadgeStyle(task.priority)} shadow-sm`}>
                         {task.priority}
                       </div>
                    )}

                    <div className={`text-xs font-bold truncate ${view === 'Monthly' ? 'pr-0' : 'pr-12'} ${task.status === 'missed' ? 'text-red-700 dark:text-red-400' : 'text-white'}`}>
                       {task.status === 'missed' ? 'Missed' : task.title}
                    </div>
                    
                    {view !== 'Monthly' && (
                        <div className="flex justify-between items-end mt-1">
                        <div className={`text-[10px] truncate ${task.status === 'missed' ? 'text-red-600 dark:text-red-300' : 'text-white/90'}`}>
                            {task.time}
                        </div>
                        
                        {task.status !== 'missed' && (
                            <div className="text-[9px] px-1.5 py-0.5 rounded-md bg-white/25 text-white backdrop-blur-sm font-medium">
                            {task.category}
                            </div>
                        )}
                        </div>
                    )}
                  </div>
                ))}
                 
                 {/* Empty State for Day - Only show on Weekly/Daily */}
                 {dayTasks.length === 0 && view !== 'Monthly' && (
                   <div 
                     className="h-full flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer p-4 group min-h-[60px]"
                     onClick={onAddTask}
                   >
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 group-hover:text-blue-500 transition-colors">
                        <Plus size={16} />
                      </div>
                   </div>
                 )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};