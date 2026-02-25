import React, { useState, useEffect } from 'react';
import { X, Save, Clock } from 'lucide-react';

interface DurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (minutes: number) => void;
  hourLabel: string;
  currentValue: number;
}

export const DurationModal: React.FC<DurationModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  hourLabel,
  currentValue 
}) => {
  const [minutes, setMinutes] = useState(currentValue);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMinutes(currentValue);
      requestAnimationFrame(() => setAnimateIn(true));
    } else {
      setAnimateIn(false);
    }
  }, [isOpen, currentValue]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(minutes);
    onClose();
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${animateIn ? 'bg-gray-900/60 backdrop-blur-sm' : 'bg-transparent pointer-events-none'}`}>
      <div 
        className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transition-all duration-300 transform ${animateIn ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}`}
      >
        <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white tracking-tight">Log Focus Time</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">For {hourLabel}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide ml-1">
              Minutes Focused (0-60)
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Clock size={18} className="text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                type="number"
                min="0"
                max="60"
                required
                value={minutes}
                onChange={e => setMinutes(Math.min(60, Math.max(0, parseInt(e.target.value) || 0)))}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white text-lg font-bold rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-700 outline-none transition-all"
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 px-1">
              <span>0 min</span>
              <span>30 min</span>
              <span>60 min</span>
            </div>
            {/* Simple range slider for UX */}
            <input 
              type="range" 
              min="0" 
              max="60" 
              value={minutes} 
              onChange={e => setMinutes(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 px-6 rounded-xl font-bold text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center gap-2"
          >
            <Save size={18} /> 
            Save Log
          </button>
        </form>
      </div>
    </div>
  );
};