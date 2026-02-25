import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  subValue?: string;
  icon: LucideIcon;
  gradient: string;
  iconBg: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, subValue, icon: Icon, gradient, iconBg }) => {
  return (
    <div className={`relative overflow-hidden rounded-xl p-6 text-white shadow-lg ${gradient}`}>
      {/* Background decoration */}
      <div className="absolute -right-6 -bottom-6 h-32 w-32 rounded-full bg-white opacity-10 blur-2xl"></div>
      
      <div className="flex items-start justify-between">
        <div className="z-10">
          <div className="flex items-center gap-2 mb-2 opacity-90">
            <div className={`p-1.5 rounded-full ${iconBg} bg-opacity-30`}>
              <Icon size={18} className="text-white" />
            </div>
            <span className="text-sm font-medium">{title}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold">{value}</h3>
            {subValue && <span className="text-sm opacity-80 font-medium">{subValue}</span>}
          </div>
        </div>
        
        {/* Right side graphic placeholder or just spacing */}
        <div className="z-10 opacity-20">
             {/* Could put a larger icon here if desired */}
        </div>
      </div>
    </div>
  );
};
