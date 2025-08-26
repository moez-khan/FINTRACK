'use client';

import { getCurrencySymbol, type Currency } from '@/lib/currency';

interface ProgressBarProps {
  label: string;
  current: number;
  target: number;
  color?: 'blue' | 'green' | 'purple' | 'red' | 'amber';
  showPercentage?: boolean;
  showValues?: boolean;
  icon?: string;
  description?: string;
  currency?: Currency;
}

export default function ProgressBar({
  label,
  current,
  target,
  color = 'blue',
  showPercentage = true,
  showValues = true,
  icon,
  description,
  currency = 'USD'
}: ProgressBarProps) {
  const percentage = target > 0 ? Math.min(100, (current / target) * 100) : 0;
  const isOverBudget = current > target;
  
  // Determine bar color based on status
  const getBarColor = () => {
    if (isOverBudget) return 'bg-red-500';
    
    const colorMap = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500',
      red: 'bg-red-500',
      amber: 'bg-amber-500'
    };
    
    // Auto color based on percentage
    if (color === 'green' && percentage < 50) return 'bg-amber-500';
    if (color === 'green' && percentage < 80) return 'bg-yellow-500';
    
    return colorMap[color];
  };
  
  const getTextColor = () => {
    if (isOverBudget) return 'text-red-600';
    
    const colorMap = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      purple: 'text-purple-600',
      red: 'text-red-600',
      amber: 'text-amber-600'
    };
    
    return colorMap[color];
  };
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {icon && <span className="text-xl">{icon}</span>}
          <span className="font-medium text-gray-700">{label}</span>
        </div>
        {showPercentage && (
          <span className={`text-sm font-semibold ${getTextColor()}`}>
            {percentage.toFixed(0)}%
          </span>
        )}
      </div>
      
      <div className="relative">
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${getBarColor()}`}
            style={{ width: `${percentage}%` }}
          >
            <div className="h-full bg-white/20 animate-pulse"></div>
          </div>
        </div>
        
        {/* Marker lines at 25%, 50%, 75% */}
        <div className="absolute inset-0 flex">
          <div className="w-1/4 border-r border-gray-300 opacity-30"></div>
          <div className="w-1/4 border-r border-gray-300 opacity-30"></div>
          <div className="w-1/4 border-r border-gray-300 opacity-30"></div>
          <div className="w-1/4"></div>
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        {showValues && (
          <span className="text-xs text-gray-600">
            {getCurrencySymbol(currency)}{current.toFixed(0)} / {getCurrencySymbol(currency)}{target.toFixed(0)}
          </span>
        )}
        {description && (
          <span className="text-xs text-gray-500">{description}</span>
        )}
      </div>
      
      {isOverBudget && (
        <div className="flex items-center gap-1 text-xs text-red-600">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>Over budget by {getCurrencySymbol(currency)}{(current - target).toFixed(2)}</span>
        </div>
      )}
    </div>
  );
}

// Enhanced circular progress for goals
export function CircularProgress({
  percentage,
  size = 120,
  strokeWidth = 8,
  label,
  value,
  color = 'blue'
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  value?: string;
  color?: 'blue' | 'green' | 'purple' | 'amber';
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  const colorMap = {
    blue: '#3B82F6',
    green: '#10B981',
    purple: '#8B5CF6',
    amber: '#F59E0B'
  };
  
  const getColor = () => {
    if (percentage >= 100) return '#10B981';
    if (percentage >= 75) return colorMap[color];
    if (percentage >= 50) return '#F59E0B';
    return '#EF4444';
  };
  
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-gray-900">
          {percentage.toFixed(0)}%
        </span>
        {label && (
          <span className="text-xs text-gray-600 mt-1">{label}</span>
        )}
        {value && (
          <span className="text-xs font-semibold text-gray-700">{value}</span>
        )}
      </div>
    </div>
  );
}