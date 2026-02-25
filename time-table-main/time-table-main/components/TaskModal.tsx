import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Clock, Calendar, Tag, AlignLeft, Check, ChevronDown, Activity, Palette, Flag } from 'lucide-react';
import { Task } from '../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  onDelete: (id: string) => void;
  taskToEdit?: Task | null;
}

const CATEGORIES = ['Math', 'Coding', 'History', 'Physics', 'Gym', 'Reading', 'Other'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const PRIORITIES = ['High', 'Medium', 'Low'];
const HOURS = ['01','02','03','04','05','06','07','08','09','10','11','12'];
const MINUTES = ['00','05','10','15','20','25','30','35','40','45','50','55'];
const PERIODS = ['AM', 'PM'];
const COLORS = [
  { label: 'Blue', value: 'bg-blue-600', ring: 'ring-blue-600', border: 'border-blue-600' },
  { label: 'Green', value: 'bg-green-600', ring: 'ring-green-600', border: 'border-green-600' },
  { label: 'Red', value: 'bg-red-500', ring: 'ring-red-500', border: 'border-red-500' },
  { label: 'Purple', value: 'bg-purple-500', ring: 'ring-purple-500', border: 'border-purple-500' },
  { label: 'Orange', value: 'bg-orange-500', ring: 'ring-orange-500', border: 'border-orange-500' },
  { label: 'Pink', value: 'bg-pink-500', ring: 'ring-pink-500', border: 'border-pink-500' },
  { label: 'Indigo', value: 'bg-indigo-600', ring: 'ring-indigo-600', border: 'border-indigo-600' },
  { label: 'Teal', value: 'bg-teal-600', ring: 'ring-teal-600', border: 'border-teal-600' },
];

export const TaskModal: React.FC<TaskModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  onDelete, 
  taskToEdit 
}) => {
  const [formData, setFormData] = useState<Partial<Task>>({
    title: '',
    time: '',
    day: 'Mon',
    category: 'Other',
    status: 'pending',
    priority: 'Medium',
    color: 'bg-blue-600',
    dueDate: ''
  });

  const [animateIn, setAnimateIn] = useState(false);
  const [startHour, setStartHour] = useState('09');
  const [startMinute, setStartMinute] = useState('00');
  const [startPeriod, setStartPeriod] = useState<'AM' | 'PM'>('AM');
  const [endHour, setEndHour] = useState('10');
  const [endMinute, setEndMinute] = useState('00');
  const [endPeriod, setEndPeriod] = useState<'AM' | 'PM'>('AM');

  const parseTimeRange = (value?: string) => {
    if (!value) {
      return {
        start: { hour: '09', minute: '00', period: 'AM' as 'AM' | 'PM' },
        end: { hour: '10', minute: '00', period: 'AM' as 'AM' | 'PM' },
      };
    }

    const cleaned = value.replace(/\s+/g, ' ').trim();
    const [rawStart = '', rawEnd = ''] = cleaned.split('-').map(part => part.trim());
    const parseSingle = (text: string, fallback: { hour: string; minute: string; period: 'AM' | 'PM' }) => {
      const match = text.match(/(\d{1,2})\s*:\s*(\d{2})\s*(AM|PM|am|pm)/);
      if (!match) return fallback;
      const hourNum = Math.min(12, Math.max(1, Number(match[1])));
      const minuteVal = match[2];
      return {
        hour: hourNum.toString().padStart(2, '0'),
        minute: MINUTES.includes(minuteVal) ? minuteVal : '00',
        period: match[3].toUpperCase() as 'AM' | 'PM',
      };
    };

    return {
      start: parseSingle(rawStart, { hour: '09', minute: '00', period: 'AM' }),
      end: parseSingle(rawEnd, { hour: '10', minute: '00', period: 'AM' }),
    };
  };

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setAnimateIn(true));
    } else {
      setAnimateIn(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (taskToEdit) {
      setFormData(taskToEdit);
      const parsed = parseTimeRange(taskToEdit.time);
      setStartHour(parsed.start.hour);
      setStartMinute(parsed.start.minute);
      setStartPeriod(parsed.start.period);
      setEndHour(parsed.end.hour);
      setEndMinute(parsed.end.minute);
      setEndPeriod(parsed.end.period);
    } else {
      setFormData({
        title: '',
        time: '09:00 AM - 10:00 AM',
        day: 'Mon',
        category: 'Other',
        status: 'pending',
        priority: 'Medium',
        color: 'bg-blue-600',
        dueDate: ''
      });
      setStartHour('09');
      setStartMinute('00');
      setStartPeriod('AM');
      setEndHour('10');
      setEndMinute('00');
      setEndPeriod('AM');
    }
  }, [taskToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedTime = `${startHour}:${startMinute} ${startPeriod} - ${endHour}:${endMinute} ${endPeriod}`;
    onSave({
      ...formData,
      time: selectedTime,
      id: taskToEdit?.id || Date.now().toString(),
    } as Task);
    onClose();
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${animateIn ? 'bg-gray-900/60 backdrop-blur-sm' : 'bg-transparent pointer-events-none'}`}>
      <div 
        className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden transition-all duration-300 transform ${animateIn ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}`}
      >
        {/* Header - Fixed */}
        <div className="flex-none flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
          <div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white tracking-tight">
              {taskToEdit ? 'Edit Task' : 'New Task'}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
              {taskToEdit ? 'Update your schedule details' : 'Add a new item to your schedule'}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-white dark:hover:bg-gray-700 hover:shadow-md rounded-full text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200 transition-all duration-200 bg-transparent"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Area */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            
            {/* Title Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide ml-1">Task Title</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <AlignLeft size={18} className="text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-700 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  placeholder="What do you need to do?"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              {/* Day Select */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide ml-1">Day</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Calendar size={18} className="text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <select
                    value={formData.day}
                    onChange={e => setFormData({...formData, day: e.target.value})}
                    className="w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-700 outline-none appearance-none transition-all cursor-pointer"
                  >
                    {DAYS.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <ChevronDown size={16} className="text-gray-400 dark:text-gray-500" />
                  </div>
                </div>
              </div>

              {/* Time Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide ml-1">Time</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Clock size={18} className="text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <div className="pl-10 pr-3 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl">
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <select
                        value={startHour}
                        onChange={e => setStartHour(e.target.value)}
                        className="w-full py-1.5 px-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                      >
                        {HOURS.map(h => <option key={`sh-${h}`} value={h}>{h}</option>)}
                      </select>
                      <select
                        value={startMinute}
                        onChange={e => setStartMinute(e.target.value)}
                        className="w-full py-1.5 px-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                      >
                        {MINUTES.map(m => <option key={`sm-${m}`} value={m}>{m}</option>)}
                      </select>
                      <select
                        value={startPeriod}
                        onChange={e => setStartPeriod(e.target.value as 'AM' | 'PM')}
                        className="w-full py-1.5 px-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                      >
                        {PERIODS.map(p => <option key={`sp-${p}`} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div className="text-center text-xs font-semibold text-gray-400 dark:text-gray-500 mb-2">to</div>
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        value={endHour}
                        onChange={e => setEndHour(e.target.value)}
                        className="w-full py-1.5 px-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                      >
                        {HOURS.map(h => <option key={`eh-${h}`} value={h}>{h}</option>)}
                      </select>
                      <select
                        value={endMinute}
                        onChange={e => setEndMinute(e.target.value)}
                        className="w-full py-1.5 px-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                      >
                        {MINUTES.map(m => <option key={`em-${m}`} value={m}>{m}</option>)}
                      </select>
                      <select
                        value={endPeriod}
                        onChange={e => setEndPeriod(e.target.value as 'AM' | 'PM')}
                        className="w-full py-1.5 px-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                      >
                        {PERIODS.map(p => <option key={`ep-${p}`} value={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              {/* Category Select */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide ml-1">Category</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Tag size={18} className="text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value as any})}
                    className="w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-700 outline-none appearance-none transition-all cursor-pointer"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <ChevronDown size={16} className="text-gray-400 dark:text-gray-500" />
                  </div>
                </div>
              </div>

              {/* Priority Select - Added */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide ml-1">Priority</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Flag size={18} className="text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <select
                    value={formData.priority || 'Medium'}
                    onChange={e => setFormData({...formData, priority: e.target.value as any})}
                    className="w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-700 outline-none appearance-none transition-all cursor-pointer"
                  >
                    {PRIORITIES.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <ChevronDown size={16} className="text-gray-400 dark:text-gray-500" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
               {/* Status Select */}
               <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide ml-1">Status</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Activity size={18} className="text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as any})}
                    className="w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-700 outline-none appearance-none transition-all cursor-pointer"
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="missed">Missed</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <ChevronDown size={16} className="text-gray-400 dark:text-gray-500" />
                  </div>
                </div>
              </div>

               {/* Due Date Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide ml-1">Due Date (Optional)</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Calendar size={18} className="text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type="date"
                    value={formData.dueDate || ''}
                    onChange={e => setFormData({...formData, dueDate: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-700 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-600 dark:text-gray-300"
                  />
                </div>
              </div>
            </div>

            {/* Color Picker - Highlighting this as requested */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide ml-1 flex items-center gap-2">
                <Palette size={14} /> Color Tag
              </label>
              <div className="flex flex-wrap gap-3 p-4 bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600 rounded-xl">
                {COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({...formData, color: color.value})}
                    className={`relative w-10 h-10 rounded-full ${color.value} transition-all duration-200 transform hover:scale-110 focus:outline-none flex items-center justify-center ${
                      formData.color === color.value 
                        ? `ring-4 ring-offset-2 dark:ring-offset-gray-800 ${color.ring} ring-opacity-50 scale-110 shadow-md` 
                        : 'hover:shadow-lg opacity-80 hover:opacity-100'
                    }`}
                    title={color.label}
                  >
                    {formData.color === color.value && (
                      <Check size={18} className="text-white drop-shadow-md" strokeWidth={3} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-6 mt-2 flex gap-4 border-t border-gray-100 dark:border-gray-700 pb-2">
              {taskToEdit && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this task?')) {
                      onDelete(taskToEdit.id);
                      onClose();
                    }
                  }}
                  className="px-4 sm:px-6 py-3 rounded-xl text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 font-semibold transition-colors flex items-center gap-2 group"
                >
                  <Trash2 size={18} className="group-hover:scale-110 transition-transform" />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              )}
              <button
                type="submit"
                className={`flex-1 py-3 px-6 rounded-xl font-bold text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 ${!taskToEdit ? 'w-full' : ''}`}
              >
                <Save size={18} /> 
                {taskToEdit ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
