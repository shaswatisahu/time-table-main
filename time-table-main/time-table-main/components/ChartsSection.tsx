import React from 'react';
import { 
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area, YAxis, CartesianGrid,
  PieChart, Pie, Legend
} from 'recharts';
import { TrendData, ChartDataPoint, ViewMode } from '../types';

interface ChartsSectionProps {
  viewMode: ViewMode;
  activityData: TrendData[];
  performanceData: TrendData[];
  subjectDistribution: ChartDataPoint[];
  onDataPointClick?: (data: TrendData) => void;
  isDarkMode?: boolean;
}

const COLORS = ['#3B82F6', '#F59E0B', '#10B981', '#8B5CF6', '#EF4444'];

export const ChartsSection: React.FC<ChartsSectionProps> = ({ 
  viewMode, 
  activityData, 
  performanceData, 
  subjectDistribution,
  onDataPointClick,
  isDarkMode = false
}) => {
  
  // Dynamic Titles based on View Mode
  const getActivityTitle = () => {
    switch (viewMode) {
      case 'Daily': return 'Hourly Focus Breakdown (Click bar to edit)';
      case 'Weekly': return 'Study Hours This Week';
      case 'Monthly': return 'Weekly Study Volume';
      default: return 'Activity';
    }
  };

  const getPerformanceTitle = () => {
    switch (viewMode) {
      case 'Daily': return 'Energy Levels Today';
      case 'Weekly': return 'Daily Performance Score';
      case 'Monthly': return 'Monthly Progress Trend';
      default: return 'Performance';
    }
  };

  // Theme Constants
  const axisColor = isDarkMode ? '#9CA3AF' : '#6B7280';
  const gridColor = isDarkMode ? '#374151' : '#E5E7EB';
  const tooltipBg = isDarkMode ? '#1F2937' : '#FFFFFF';
  const tooltipBorder = isDarkMode ? '#374151' : '#F3F4F6';
  const tooltipText = isDarkMode ? '#E5E7EB' : '#374151';

  // Custom tooltip to show units correctly
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 rounded-lg shadow-lg border text-xs" style={{ backgroundColor: tooltipBg, borderColor: tooltipBorder }}>
          <p className="font-bold mb-1" style={{ color: tooltipText }}>{label}</p>
          <p className="text-blue-600 dark:text-blue-400 font-semibold">
            {payload[0].value} {viewMode === 'Daily' ? 'mins' : 'hours'}
          </p>
          {viewMode === 'Daily' && (
            <p className="text-gray-400 dark:text-gray-500 mt-1 italic">Click to edit</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Activity Bar Chart */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
        <h3 className="text-gray-700 dark:text-gray-200 font-semibold mb-6 text-sm text-center">{getActivityTitle()}</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={activityData}
              onClick={(data) => {
                if (onDataPointClick && data && data.activePayload && data.activePayload.length > 0) {
                  onDataPointClick(data.activePayload[0].payload);
                }
              }}
            >
              <XAxis 
                dataKey="label" 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 9, fill: axisColor}} 
                dy={10}
                interval={viewMode === 'Daily' ? 2 : 0} // Show every 3rd label for 24h view to avoid crowding
              />
              <Tooltip content={<CustomTooltip />} cursor={{fill: isDarkMode ? '#374151' : '#F3F4F6'}} />
              <Bar 
                dataKey="value" 
                radius={[4, 4, 0, 0]}
                className={viewMode === 'Daily' ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
              >
                {activityData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.value > 0 ? '#3B82F6' : (isDarkMode ? '#374151' : '#E5E7EB')} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Area Chart */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
        <h3 className="text-gray-700 dark:text-gray-200 font-semibold mb-6 text-sm text-center">{getPerformanceTitle()}</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={performanceData}>
              <defs>
                <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor}/>
              <XAxis 
                dataKey="label" 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 9, fill: axisColor}} 
                dy={10}
                interval={viewMode === 'Daily' ? 2 : 0}
              />
              <YAxis hide={true} domain={[0, 'auto']} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: tooltipBg, 
                  borderColor: tooltipBorder,
                  color: tooltipText,
                  borderRadius: '8px', 
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                itemStyle={{ color: tooltipText }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#10B981" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorProgress)" 
                dot={viewMode === 'Daily' ? false : { stroke: '#10B981', strokeWidth: 2, r: 4, fill: isDarkMode ? '#1F2937' : '#fff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pie Chart (Subject Distribution) */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
        <h3 className="text-gray-700 dark:text-gray-200 font-semibold mb-2 text-sm text-center">Subject Distribution</h3>
        <div className="h-48 relative">
           <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={subjectDistribution}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {subjectDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                 contentStyle={{
                  backgroundColor: tooltipBg, 
                  borderColor: tooltipBorder,
                  color: tooltipText,
                  borderRadius: '8px', 
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                itemStyle={{ color: tooltipText }}
              />
              <Legend 
                layout="vertical" 
                verticalAlign="middle" 
                align="left"
                iconSize={10}
                wrapperStyle={{ fontSize: '12px', left: '0px', color: axisColor }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};