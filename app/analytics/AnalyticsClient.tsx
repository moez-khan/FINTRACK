'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import Navbar from '@/components/Navbar';
import SpendingPieChartNew from '@/components/charts/SpendingPieChartNew';
import ExpensesLineChartNew from '@/components/charts/ExpensesLineChartNew';
import DonutChartNew from '@/components/charts/DonutChartNew';
import AreaChartNew from '@/components/charts/AreaChartNew';
import CalendarHeatmapNew from '@/components/charts/CalendarHeatmapNew';
import SpendingRadarChartNew from '@/components/charts/RadarChartNew';
import ExpenseScatterPlotNew from '@/components/charts/ScatterChartNew';
import CategoryBarChartNew, { IncomeExpenseComparisonNew, MonthlyTrendChartNew } from '@/components/charts/BarChartNew';
import ToastProvider from '@/components/ToastProvider';
import { formatCurrency, type Currency } from '@/lib/currency';
import { formatDate } from '@/lib/dateUtils';
import { getCategoryIcon, getCategoryColor } from '@/lib/categoryIcons';
import { filterExpensesByPeriod } from '@/lib/financeRulesWithPeriod';
import { getPeriodBounds, type PeriodType } from '@/lib/periodUtils';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, endOfYear, subMonths, subWeeks, subYears } from 'date-fns';

interface Expense {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface SavingGoal {
  id: string;
  name: string;
  target: number;
  saved: number;
  deadline: string;
  createdAt: string;
  updatedAt: string;
}

interface AnalyticsData {
  expenses: Expense[];
  savingGoals: SavingGoal[];
}

interface AnalyticsClientProps {
  user: {
    id: string;
    email: string;
    name?: string | null;
    selectedRule?: string | null;
    savingsPercentage?: number;
    currency?: string;
  };
  initialData: AnalyticsData;
}

type ChartType = 'line' | 'pie' | 'bar' | 'comparison' | 'trend' | 'donut' | 'area' | 'heatmap' | 'radar' | 'scatter';
type DataType = 'expenses' | 'income' | 'both';

export default function AnalyticsClient({ user, initialData }: AnalyticsClientProps) {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [expenses] = useState<Expense[]>(initialData.expenses);
  const [selectedChartType, setSelectedChartType] = useState<ChartType>('line');
  const [selectedDataType, setSelectedDataType] = useState<DataType>('both');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [customDateRange, setCustomDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  });
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowPeriodDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Period filtering options
  const periodOptions = [
    { value: 'all', label: 'All Time', icon: '♾️' },
    { value: 'this-week', label: 'This Week', icon: '📅' },
    { value: 'last-week', label: 'Last Week', icon: '↩️' },
    { value: 'this-month', label: 'This Month', icon: '📆' },
    { value: 'last-month', label: 'Last Month', icon: '⏮️' },
    { value: 'last-3-months', label: 'Last 3 Months', icon: '📊' },
    { value: 'last-6-months', label: 'Last 6 Months', icon: '📈' },
    { value: 'this-year', label: 'This Year', icon: '🗓️' },
    { value: 'last-year', label: 'Last Year', icon: '📅' },
    { value: 'custom', label: 'Custom Range', icon: '⚙️' }
  ];

  // Filter expenses based on selected period
  const getFilteredExpenses = () => {
    if (selectedPeriod === 'all') return expenses;
    
    let startDate: Date;
    let endDate: Date = new Date();
    
    switch (selectedPeriod) {
      case 'this-week':
        startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
        endDate = endOfWeek(new Date(), { weekStartsOn: 1 });
        break;
      case 'last-week':
        const lastWeek = subWeeks(new Date(), 1);
        startDate = startOfWeek(lastWeek, { weekStartsOn: 1 });
        endDate = endOfWeek(lastWeek, { weekStartsOn: 1 });
        break;
      case 'this-month':
        startDate = startOfMonth(new Date());
        endDate = endOfMonth(new Date());
        break;
      case 'last-month':
        const lastMonth = subMonths(new Date(), 1);
        startDate = startOfMonth(lastMonth);
        endDate = endOfMonth(lastMonth);
        break;
      case 'last-3-months':
        startDate = subMonths(new Date(), 3);
        break;
      case 'last-6-months':
        startDate = subMonths(new Date(), 6);
        break;
      case 'this-year':
        startDate = startOfYear(new Date());
        endDate = endOfYear(new Date());
        break;
      case 'last-year':
        const lastYear = subYears(new Date(), 1);
        startDate = startOfYear(lastYear);
        endDate = endOfYear(lastYear);
        break;
      case 'custom':
        if (customDateRange.start && customDateRange.end) {
          startDate = new Date(customDateRange.start);
          endDate = new Date(customDateRange.end);
        } else {
          return expenses;
        }
        break;
      default:
        return expenses;
    }
    
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= startDate && expenseDate <= endDate;
    });
  };

  const filteredByPeriod = getFilteredExpenses();

  // Calculate totals from filtered expenses
  const totalIncome = filteredByPeriod
    .filter(e => e.type === 'income')
    .reduce((sum, e) => sum + e.amount, 0);
    
  const totalExpenses = filteredByPeriod
    .filter(e => e.type === 'expense')
    .reduce((sum, e) => sum + e.amount, 0);

  const chartTypes = [
    { id: 'line', name: 'Line Chart', icon: '📈', description: 'Trend over time' },
    { id: 'pie', name: 'Pie Chart', icon: '🥧', description: 'Category breakdown' },
    { id: 'donut', name: 'Donut Chart', icon: '🍩', description: 'Category breakdown with center space' },
    { id: 'bar', name: 'Bar Chart', icon: '📊', description: 'Compare categories' },
    { id: 'area', name: 'Area Chart', icon: '🏔️', description: 'Filled trend visualization' },
    { id: 'comparison', name: 'Income vs Expenses', icon: '⚖️', description: 'Side-by-side comparison' },
    { id: 'trend', name: 'Monthly Trends', icon: '📉', description: 'Monthly analysis' },
    { id: 'heatmap', name: 'Calendar Heatmap', icon: '🗓️', description: 'Daily spending patterns' },
    { id: 'radar', name: 'Spending Radar', icon: '🎯', description: 'Multi-category comparison' },
    { id: 'scatter', name: 'Expense Scatter', icon: '⭐', description: 'Amount vs frequency plot' },
  ];

  const dataTypes = [
    { id: 'both', name: 'Income & Expenses', icon: '💰', color: 'from-blue-500 to-purple-600' },
    { id: 'income', name: 'Income Only', icon: '💵', color: 'from-green-500 to-emerald-600' },
    { id: 'expenses', name: 'Expenses Only', icon: '💳', color: 'from-red-500 to-pink-600' },
  ];

  const renderChart = () => {
    const filteredExpenses = selectedDataType === 'both' 
      ? filteredByPeriod 
      : selectedDataType === 'income'
        ? filteredByPeriod.filter(e => e.type === 'income')
        : filteredByPeriod.filter(e => e.type === 'expense');

    switch (selectedChartType) {
      case 'line':
        return <ExpensesLineChartNew expenses={filteredExpenses} period="month" currency={user.currency as Currency} />;
      
      case 'pie':
        return <SpendingPieChartNew expenses={filteredExpenses} currency={user.currency as Currency} />;
      
      case 'donut':
        return <DonutChartNew expenses={filteredExpenses} currency={user.currency as Currency} />;
      
      case 'bar':
        return <CategoryBarChartNew expenses={filteredExpenses} currency={user.currency as Currency} />;
      
      case 'area':
        return <AreaChartNew expenses={filteredExpenses} currency={user.currency as Currency} />;
      
      case 'comparison':
        return <IncomeExpenseComparisonNew expenses={filteredByPeriod} currency={user.currency as Currency} />;
      
      case 'trend':
        return <MonthlyTrendChartNew expenses={filteredByPeriod} currency={user.currency as Currency} />;
      
      case 'heatmap':
        return <CalendarHeatmapNew expenses={filteredExpenses} currency={user.currency as Currency} />;
      
      case 'radar':
        return <SpendingRadarChartNew expenses={filteredExpenses} currency={user.currency as Currency} />;
      
      case 'scatter':
        return <ExpenseScatterPlotNew expenses={filteredExpenses} currency={user.currency as Currency} />;
      
      default:
        return <ExpensesLineChartNew expenses={filteredExpenses} period="month" currency={user.currency as Currency} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <ToastProvider />
      
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-40 -right-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-40 left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Navigation */}
      <Navbar 
        user={user}
        onAddTransaction={() => router.push('/dashboard')}
        onAddGoal={() => router.push('/dashboard')}
        onOpenProfile={() => router.push('/dashboard')}
      />

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Analyze your financial data with interactive charts</p>
        </div>

        {/* Period Filter */}
        <div className="mb-8 relative z-50">
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl p-6 relative">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Filter by Period</h3>
                <p className="text-sm text-gray-600">
                  {selectedPeriod === 'all' 
                    ? 'Showing all time data' 
                    : selectedPeriod === 'custom' && customDateRange.start && customDateRange.end
                      ? `From ${new Date(customDateRange.start).toLocaleDateString()} to ${new Date(customDateRange.end).toLocaleDateString()}`
                      : `Showing ${periodOptions.find(p => p.value === selectedPeriod)?.label.toLowerCase()}`
                  }
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                {/* Period Dropdown */}
                <div className="relative z-[60]" ref={dropdownRef}>
                  <button
                    onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-shadow"
                  >
                    <span className="text-white drop-shadow-md">{periodOptions.find(p => p.value === selectedPeriod)?.icon}</span>
                    <span>{periodOptions.find(p => p.value === selectedPeriod)?.label}</span>
                    <svg
                      className={`w-4 h-4 transition-transform ${showPeriodDropdown ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {showPeriodDropdown && (
                    <div 
                      className="absolute top-full mt-2 left-0 right-0 min-w-[200px] bg-white rounded-lg shadow-xl z-[100] border border-gray-200" 
                    >
                      <div 
                        className="py-1 scrollbar-thin scrollbar-thumb-gray-400 hover:scrollbar-thumb-gray-500 scrollbar-track-gray-100"
                        style={{ maxHeight: '180px', overflowY: 'auto', overflowX: 'hidden' }}
                      >
                      {periodOptions.map((period) => (
                        <button
                          key={period.value}
                          onClick={() => {
                            setSelectedPeriod(period.value);
                            setShowPeriodDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 hover:bg-gray-100 flex items-center gap-2 transition-colors ${
                            selectedPeriod === period.value ? 'bg-blue-50 text-blue-600' : ''
                          }`}
                        >
                          <span>{period.icon}</span>
                          <span>{period.label}</span>
                        </button>
                      ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Custom Date Range */}
                {selectedPeriod === 'custom' && (
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={customDateRange.start}
                      onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <span className="text-gray-600">to</span>
                    <input
                      type="date"
                      value={customDateRange.end}
                      onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
                
                {/* Quick Period Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedPeriod('this-month')}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      selectedPeriod === 'this-month'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    This Month
                  </button>
                  <button
                    onClick={() => setSelectedPeriod('last-month')}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      selectedPeriod === 'last-month'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Last Month
                  </button>
                  <button
                    onClick={() => setSelectedPeriod('last-3-months')}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      selectedPeriod === 'last-3-months'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    3 Months
                  </button>
                  <button
                    onClick={() => setSelectedPeriod('all')}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      selectedPeriod === 'all'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All Time
                  </button>
                </div>
              </div>
            </div>
            
            {/* Period Summary */}
            {filteredByPeriod.length === 0 ? (
              <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                <p className="text-yellow-800">No data available for the selected period. Try selecting a different time range.</p>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-xs text-gray-500">Transactions</p>
                  <p className="text-lg font-semibold">{filteredByPeriod.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Period Income</p>
                  <p className="text-lg font-semibold text-green-600">{formatCurrency(totalIncome, user.currency as Currency, true)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Period Expenses</p>
                  <p className="text-lg font-semibold text-red-600">{formatCurrency(totalExpenses, user.currency as Currency, true)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Net Balance</p>
                  <p className={`text-lg font-semibold ${totalIncome - totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(totalIncome - totalExpenses, user.currency as Currency, true)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Income</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalIncome, user.currency as Currency)}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <span className="text-xl text-white">💰</span>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(totalExpenses, user.currency as Currency)}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-600 rounded-xl flex items-center justify-center">
                <span className="text-xl text-white">💳</span>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Net Balance</p>
                <p className={`text-2xl font-bold ${totalIncome - totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(totalIncome - totalExpenses, user.currency as Currency)}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <span className="text-xl text-white">📊</span>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Transactions</p>
                <p className="text-2xl font-bold text-purple-600">
                  {expenses.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <span className="text-xl text-white">📋</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Type Selection */}
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Chart Type</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {chartTypes.map((chart) => (
              <button
                key={chart.id}
                onClick={() => setSelectedChartType(chart.id as ChartType)}
                className={`p-3 rounded-xl border-2 transition-all ${
                  selectedChartType === chart.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="text-2xl mb-2">{chart.icon}</div>
                <h4 className="font-semibold text-gray-900 text-sm">{chart.name}</h4>
                <p className="text-xs text-gray-600 mt-1">{chart.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Data Type Selection */}
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Data Filter</h3>
          <div className="flex flex-wrap gap-3">
            {dataTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedDataType(type.id as DataType)}
                className={`px-6 py-3 rounded-xl transition-all ${
                  selectedDataType === type.id
                    ? `bg-gradient-to-r ${type.color} text-white shadow-lg`
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <span className="mr-2">{type.icon}</span>
                {type.name}
              </button>
            ))}
          </div>
        </div>

        {/* Chart Display */}
        <div className="mb-8">
          {renderChart()}
        </div>
      </main>
    </div>
  );
}