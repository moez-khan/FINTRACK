'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import SpendingPieChartNew from '@/components/charts/SpendingPieChartNew';
import ExpensesLineChartNew from '@/components/charts/ExpensesLineChartNew';
import CategoryBarChartNew, { IncomeExpenseComparisonNew, MonthlyTrendChartNew } from '@/components/charts/BarChartNew';
import ToastProvider from '@/components/ToastProvider';
import { formatCurrency, type Currency } from '@/lib/currency';
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

export default function AnalyticsClient({ user, initialData }: AnalyticsClientProps) {
  const router = useRouter();
  const [expenses] = useState<Expense[]>(initialData.expenses);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('this-month');
  const [customDateRange, setCustomDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  });

  // Period filtering options - focused on practical time periods
  const periodOptions = [
    { value: 'this-week', label: 'This Week' },
    { value: 'this-month', label: 'This Month' },
    { value: 'last-month', label: 'Last Month' },
    { value: 'last-3-months', label: '3 Months' },
    { value: 'last-6-months', label: '6 Months' },
    { value: 'this-year', label: 'This Year' },
  ];

  // Filter expenses based on selected period
  const getFilteredExpenses = () => {
    let startDate: Date;
    let endDate: Date = new Date();
    
    switch (selectedPeriod) {
      case 'this-week':
        startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
        endDate = endOfWeek(new Date(), { weekStartsOn: 1 });
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
      case 'custom':
        if (customDateRange.start && customDateRange.end) {
          startDate = new Date(customDateRange.start);
          endDate = new Date(customDateRange.end);
        } else {
          return expenses;
        }
        break;
      default:
        startDate = startOfMonth(new Date());
        endDate = endOfMonth(new Date());
    }
    
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= startDate && expenseDate <= endDate;
    });
  };

  const filteredByPeriod = getFilteredExpenses();

  // Calculate totals and key metrics
  const totalIncome = filteredByPeriod
    .filter(e => e.type === 'income')
    .reduce((sum, e) => sum + e.amount, 0);
    
  const totalExpenses = filteredByPeriod
    .filter(e => e.type === 'expense')
    .reduce((sum, e) => sum + e.amount, 0);

  const netBalance = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100) : 0;

  // Calculate average daily spending
  const daysInPeriod = Math.max(1, new Set(filteredByPeriod.map(e => e.date.split('T')[0])).size);
  const avgDailySpending = totalExpenses / daysInPeriod;

  // Get top spending category
  const categoryTotals = filteredByPeriod
    .filter(e => e.type === 'expense')
    .reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>);
  
  const topCategory = Object.entries(categoryTotals)
    .sort(([,a], [,b]) => b - a)[0];

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
      <main className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Page Header - Mobile Optimized */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Financial Analytics</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Track your money flow</p>
        </div>

        {/* Period Selector - Mobile Optimized */}
        <div className="mb-4 sm:mb-6">
          <div className="bg-white/90 backdrop-blur-lg rounded-xl shadow-xl border border-white/50 p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <label className="text-sm font-medium text-gray-700">Time Period:</label>
              <div className="flex flex-wrap gap-2">
                {periodOptions.map((period) => (
                  <button
                    key={period.value}
                    onClick={() => setSelectedPeriod(period.value)}
                    className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg font-medium transition-all ${
                      selectedPeriod === period.value
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics Cards - Mobile Optimized */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          {/* Income Card */}
          <div className="bg-white/90 backdrop-blur-lg rounded-xl shadow-xl border border-white/50 p-3 sm:p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-2xl">💰</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${totalIncome > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                Income
              </span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-gray-900">
              {formatCurrency(totalIncome, user.currency as Currency, true)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {filteredByPeriod.filter(e => e.type === 'income').length} transactions
            </p>
          </div>

          {/* Expenses Card */}
          <div className="bg-white/90 backdrop-blur-lg rounded-xl shadow-xl border border-white/50 p-3 sm:p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-2xl">💳</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                Spent
              </span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-gray-900">
              {formatCurrency(totalExpenses, user.currency as Currency, true)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Avg {formatCurrency(avgDailySpending, user.currency as Currency, true)}/day
            </p>
          </div>

          {/* Balance Card */}
          <div className="bg-white/90 backdrop-blur-lg rounded-xl shadow-xl border border-white/50 p-3 sm:p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-2xl">📊</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${netBalance >= 0 ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                Balance
              </span>
            </div>
            <p className={`text-lg sm:text-xl font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {netBalance < 0 && '-'}{formatCurrency(Math.abs(netBalance), user.currency as Currency, true)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {savingsRate.toFixed(0)}% saved
            </p>
          </div>

          {/* Top Category Card */}
          <div className="bg-white/90 backdrop-blur-lg rounded-xl shadow-xl border border-white/50 p-3 sm:p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-2xl">🎯</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                Top Spend
              </span>
            </div>
            {topCategory ? (
              <>
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {topCategory[0]}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatCurrency(topCategory[1], user.currency as Currency, true)}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-500">No expenses</p>
            )}
          </div>
        </div>

        {/* Charts Section - Mobile Optimized 2x2 Grid */}
        {filteredByPeriod.length === 0 ? (
          <div className="bg-yellow-50/90 backdrop-blur-lg border border-yellow-200 rounded-xl shadow-xl p-4 sm:p-6 text-center">
            <span className="text-3xl mb-2 block">📊</span>
            <p className="text-yellow-800 font-medium">No data for selected period</p>
            <p className="text-yellow-600 text-sm mt-1">Try selecting a different time range</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Income vs Expenses Comparison - Essential for understanding cash flow */}
            <div className="bg-white/90 backdrop-blur-lg rounded-xl shadow-xl border border-white/50 overflow-hidden">
              <IncomeExpenseComparisonNew 
                expenses={filteredByPeriod} 
                currency={user.currency as Currency} 
              />
            </div>

            {/* Spending by Category Pie Chart - Essential for budget allocation */}
            <div className="bg-white/90 backdrop-blur-lg rounded-xl shadow-xl border border-white/50 overflow-hidden">
              <SpendingPieChartNew 
                expenses={filteredByPeriod.filter(e => e.type === 'expense')} 
                currency={user.currency as Currency} 
              />
            </div>

            {/* Monthly Spending Trends - Essential for tracking habits */}
            <div className="bg-white/90 backdrop-blur-lg rounded-xl shadow-xl border border-white/50 overflow-hidden">
              <MonthlyTrendChartNew 
                expenses={filteredByPeriod} 
                currency={user.currency as Currency} 
              />
            </div>

            {/* Expense Timeline - Essential for spotting patterns */}
            <div className="bg-white/90 backdrop-blur-lg rounded-xl shadow-xl border border-white/50 overflow-hidden">
              <ExpensesLineChartNew 
                expenses={filteredByPeriod} 
                period="week" 
                currency={user.currency as Currency} 
              />
            </div>

            {/* Category Breakdown Bar Chart - For detailed category analysis */}
            <div className="bg-white/90 backdrop-blur-lg rounded-xl shadow-xl border border-white/50 overflow-hidden md:col-span-2">
              <CategoryBarChartNew 
                expenses={filteredByPeriod.filter(e => e.type === 'expense')} 
                currency={user.currency as Currency} 
              />
            </div>
          </div>
        )}

        {/* Financial Insights Section - Mobile Optimized */}
        {filteredByPeriod.length > 0 && (
          <div className="mt-6 bg-white/90 backdrop-blur-lg rounded-xl shadow-xl border border-white/50 p-4 sm:p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Quick Insights</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Spending Health */}
              <div className="flex items-start space-x-3">
                <span className="text-2xl">{savingsRate > 20 ? '✅' : savingsRate > 0 ? '⚠️' : '❌'}</span>
                <div>
                  <p className="font-medium text-sm text-gray-900">Spending Health</p>
                  <p className="text-xs text-gray-600">
                    {savingsRate > 20 
                      ? 'Great! You\'re saving over 20%' 
                      : savingsRate > 0 
                        ? `You're saving ${savingsRate.toFixed(0)}%, aim for 20%+`
                        : 'You\'re spending more than earning'}
                  </p>
                </div>
              </div>

              {/* Daily Average */}
              <div className="flex items-start space-x-3">
                <span className="text-2xl">📅</span>
                <div>
                  <p className="font-medium text-sm text-gray-900">Daily Average</p>
                  <p className="text-xs text-gray-600">
                    You spend {formatCurrency(avgDailySpending, user.currency as Currency, true)} per day
                  </p>
                </div>
              </div>

              {/* Top Category Alert */}
              {topCategory && (
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">💡</span>
                  <div>
                    <p className="font-medium text-sm text-gray-900">Biggest Expense</p>
                    <p className="text-xs text-gray-600">
                      {topCategory[0]} accounts for {((topCategory[1] / totalExpenses) * 100).toFixed(0)}% of spending
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}