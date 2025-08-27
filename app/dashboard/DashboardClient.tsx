'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import Navbar from '@/components/Navbar';
import EditTransactionModalOptimistic from '@/components/EditTransactionModalOptimistic';
import EditGoalModal from '@/components/EditGoalModal';
import ProfileSettings from '@/components/ProfileSettings';
import PeriodSelector from '@/components/PeriodSelector';
import PeriodAnalytics from '@/components/PeriodAnalytics';
import BillReminderManager from '@/components/BillReminderManager';
import SpendingPieChartNew from '@/components/charts/SpendingPieChartNew';
import ExpensesLineChartNew from '@/components/charts/ExpensesLineChartNew';
import ProgressBar, { CircularProgress } from '@/components/charts/ProgressBar';
import toast from 'react-hot-toast';
import ToastProvider from '@/components/ToastProvider';
import { 
  calculate50_30_20, 
  calculatePayYourselfFirst, 
  calculateSmartGoal
} from '@/lib/financeRules';
import {
  calculate50_30_20ForPeriod,
  calculatePayYourselfFirstForPeriod,
  filterExpensesByPeriod,
  calculatePeriodIncome
} from '@/lib/financeRulesWithPeriod';
import { formatDate } from '@/lib/dateUtils';
import { getCategoryIcon, getCategoryColor } from '@/lib/categoryIcons';
import { formatCurrency, type Currency } from '@/lib/currency';

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

interface DashboardData {
  expenses: Expense[];
  savingGoals: SavingGoal[];
}

interface DashboardClientProps {
  user: {
    id: string;
    email: string;
    name?: string | null;
    selectedRule?: string | null;
    savingsPercentage?: number;
    currency?: string;
    rulePeriod?: string;
    customPeriodDays?: number | null;
    periodStartDate?: string;
    autoResetEnabled?: boolean;
  };
  initialData: DashboardData;
}

export default function DashboardClient({ user: initialUser, initialData }: DashboardClientProps) {
  const router = useRouter();
  const [user, setUser] = useState(initialUser);
  const [expenses, setExpenses] = useState<Expense[]>(initialData.expenses);
  const [savingGoals, setSavingGoals] = useState<SavingGoal[]>(initialData.savingGoals);
  const [, setLoading] = useState(false);
  const [chartPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [deletedTransactions, setDeletedTransactions] = useState<Map<string, Expense>>(new Map());
  
  // Modal states
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Expense | null>(null);
  const [editingGoal, setEditingGoal] = useState<SavingGoal | null>(null);
  
  // Collapsible sections
  const [showAddTransaction, setShowAddTransaction] = useState(false);

  // Calculate financial metrics
  const totalIncome = expenses
    .filter(e => e.type === 'income')
    .reduce((sum, e) => sum + e.amount, 0);
    
  const totalExpenses = expenses
    .filter(e => e.type === 'expense')
    .reduce((sum, e) => sum + e.amount, 0);
    
  const balance = totalIncome - totalExpenses;
  const monthlyIncome = totalIncome; // Use total income from the period

  // Get recent transactions (last 5 for compact view)
  const recentTransactions = [...expenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Refresh data with live updates
  const refreshData = async () => {
    setLoading(true);
    try {
      const [expensesRes, goalsRes, profileRes] = await Promise.all([
        fetch('/api/expenses'),
        fetch('/api/saving-goals'),
        fetch('/api/user/profile')
      ]);

      if (expensesRes.ok && goalsRes.ok && profileRes.ok) {
        const expensesData = await expensesRes.json();
        const goalsData = await goalsRes.json();
        const profileData = await profileRes.json();
        
        setExpenses(expensesData.expenses);
        setSavingGoals(goalsData.savingGoals);
        setUser(prev => ({ ...prev, ...profileData.user }));
        toast.success('Data refreshed successfully');
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  // Handle transaction edit
  const handleEditTransaction = (transaction: Expense) => {
    setEditingTransaction(transaction);
    setShowTransactionModal(true);
  };

  // Handle goal edit
  const handleEditGoal = (goal: SavingGoal) => {
    setEditingGoal(goal);
    setShowGoalModal(true);
  };

  // Handle optimistic transaction creation
  const handleTransactionCreate = (newTransaction: Expense) => {
    setExpenses(prev => [newTransaction, ...prev]);
    toast.success('Transaction added');
  };

  // Handle optimistic transaction update  
  const handleTransactionUpdate = (updatedTransaction: any) => {
    if (updatedTransaction.tempId && updatedTransaction.realTransaction) {
      // Replace temp transaction with real one from server
      setExpenses(prev => prev.map(exp => 
        exp.id === updatedTransaction.tempId ? updatedTransaction.realTransaction : exp
      ));
    } else if (updatedTransaction.error) {
      // Handle error case - rollback
      if (updatedTransaction.action === 'create') {
        // Remove failed new transaction
        setExpenses(prev => prev.filter(exp => exp.id !== updatedTransaction.id));
        toast.error('Failed to add transaction');
      } else if (updatedTransaction.action === 'update' && updatedTransaction.original) {
        // Restore original on update failure
        setExpenses(prev => prev.map(exp => 
          exp.id === updatedTransaction.original.id ? updatedTransaction.original : exp
        ));
        toast.error('Failed to update transaction');
      }
    } else {
      // Normal update
      setExpenses(prev => prev.map(exp => 
        exp.id === updatedTransaction.id ? updatedTransaction : exp
      ));
    }
  };

  // Handle optimistic transaction delete
  const handleTransactionDelete = (id: string) => {
    const transaction = expenses.find(exp => exp.id === id);
    if (transaction) {
      setDeletedTransactions(prev => new Map(prev).set(id, transaction));
      setExpenses(prev => prev.filter(exp => exp.id !== id));
      toast.success('Transaction deleted');
      
      // Make the delete API call
      fetch(`/api/expenses/${id}`, { method: 'DELETE' })
        .catch(err => {
          // Restore on error
          console.error('Delete failed:', err);
          setExpenses(prev => [...prev, transaction].sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          ));
          setDeletedTransactions(prev => {
            const newMap = new Map(prev);
            newMap.delete(id);
            return newMap;
          });
          toast.error('Failed to delete transaction');
        });
    }
  };

  // Handle successful goal save with live updates
  const handleGoalSuccess = () => {
    refreshData();
    setShowGoalModal(false);
    setEditingGoal(null);
    toast.success(editingGoal ? 'Goal updated' : 'Goal created');
  };

  // Render the appropriate financial rule widget with enhanced progress bars
  const renderFinancialRuleWidget = () => {
    const selectedRule = user.selectedRule || '50-30-20';
    const usePeriod = user.rulePeriod && user.periodStartDate;

    if (selectedRule === '50-30-20') {
      const ruleData = usePeriod 
        ? calculate50_30_20ForPeriod(
            expenses as any, 
            user.rulePeriod as any, 
            new Date(user.periodStartDate!),
            user.customPeriodDays || undefined
          )
        : calculate50_30_20(monthlyIncome, expenses as any);
      
      const periodIncome = usePeriod ? ruleData.totalBudget : monthlyIncome;
      
      return (
        <div className="bg-white/90 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 sm:p-6">
            <h3 className="text-xl font-bold text-white">50/30/20 Budget Rule</h3>
            <p className="text-white/80 text-sm mt-1">
              {usePeriod && 'period' in ruleData ? (ruleData as any).period.label + ' Income' : 'Monthly Income'}: {formatCurrency(periodIncome, user.currency as Currency)}
            </p>
          </div>
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            <ProgressBar
              label="Needs (50%)"
              current={ruleData.spending.needs}
              target={ruleData.allocations.needs}
              color="blue"
              icon="🏠"
              description="Essentials like rent, groceries, utilities"
              currency={user.currency as Currency}
            />
            
            <ProgressBar
              label="Wants (30%)"
              current={ruleData.spending.wants}
              target={ruleData.allocations.wants}
              color="purple"
              icon="🎮"
              description="Entertainment, dining, hobbies"
              currency={user.currency as Currency}
            />
            
            <ProgressBar
              label="Savings (20%)"
              current={ruleData.spending.savings}
              target={ruleData.allocations.savings}
              color="green"
              icon="💰"
              description="Emergency fund, investments"
              currency={user.currency as Currency}
            />
            
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Budget Utilization</span>
                <span className="text-lg font-bold text-gray-900">
                  {((ruleData.totalSpent / ruleData.totalBudget) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    } else if (selectedRule === 'pay-yourself-first') {
      const ruleData = usePeriod
        ? calculatePayYourselfFirstForPeriod(
            expenses as any,
            user.savingsPercentage || 20,
            user.rulePeriod as any,
            new Date(user.periodStartDate!),
            user.customPeriodDays || undefined
          )
        : calculatePayYourselfFirst(
            monthlyIncome, 
            user.savingsPercentage || 20, 
            expenses as any
          );
      
      const periodIncome = usePeriod && 'periodIncome' in ruleData ? ruleData.periodIncome : monthlyIncome;
      
      return (
        <div className="bg-white/90 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-teal-600 p-6">
            <h3 className="text-xl font-bold text-white">Pay Yourself First</h3>
            <p className="text-white/80 text-sm mt-1">
              Saving {ruleData.savingsPercentage}% of {formatCurrency(monthlyIncome, user.currency as Currency)} monthly income
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <ProgressBar
                  label="Monthly Savings Target"
                  current={ruleData.actualSavings}
                  target={ruleData.savingsTarget}
                  color="green"
                  icon="🎯"
                  currency={user.currency as Currency}
                />
              </div>
              <div>
                <ProgressBar
                  label="Budget for Expenses"
                  current={ruleData.totalExpenses}
                  target={ruleData.availableForExpenses}
                  color={ruleData.expensesOverBudget ? 'red' : 'blue'}
                  icon="💳"
                  currency={user.currency as Currency}
                />
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-2 gap-4 text-center">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Remaining Budget</p>
                <p className={`text-2xl font-bold ${ruleData.remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(Math.abs(ruleData.remainingBudget), user.currency as Currency)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Status</p>
                <p className={`text-lg font-semibold ${ruleData.isOnTrack ? 'text-green-600' : 'text-amber-600'}`}>
                  {ruleData.isOnTrack ? '✓ On Track' : '⚠ Behind'}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    } else if (selectedRule === 'smart-goal') {
      const primaryGoal = savingGoals.length > 0 
        ? savingGoals.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())[0]
        : null;

      if (!primaryGoal) {
        return (
          <div className="bg-white/90 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6">
              <h3 className="text-xl font-bold text-white">SMART Goals</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-600 mb-4">No saving goals set yet</p>
              <button
                onClick={() => {
                  setEditingGoal(null);
                  setShowGoalModal(true);
                }}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700"
              >
                Create Your First Goal
              </button>
            </div>
          </div>
        );
      }

      const goalData = calculateSmartGoal(primaryGoal as any, primaryGoal.saved, monthlyIncome);
      
      return (
        <div className="bg-white/90 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6">
            <h3 className="text-xl font-bold text-white">SMART Goal: {goalData.goalName}</h3>
            <p className="text-white/80 text-sm mt-1">
              Target: {formatCurrency(goalData.target, user.currency as Currency)} by {formatDate(goalData.deadline)}
            </p>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-center mb-6">
              <CircularProgress
                percentage={goalData.progressPercentage}
                size={150}
                strokeWidth={12}
                label="Progress"
                value={formatCurrency(goalData.saved, user.currency as Currency)}
                color="purple"
              />
            </div>
            
            <div className="space-y-4">
              <ProgressBar
                label="Goal Progress"
                current={goalData.saved}
                target={goalData.target}
                color="purple"
                showPercentage={false}
              />
              
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm font-medium text-purple-900 mb-2">Forecast</p>
                <p className="text-sm text-purple-700">{goalData.forecastMessage}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600">Monthly Target</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(goalData.requiredMonthlySaving, user.currency as Currency)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600">Days Remaining</p>
                  <p className="text-lg font-bold text-gray-900">{goalData.daysUntilDeadline}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 overflow-x-hidden">
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
        onAddTransaction={() => {
          setEditingTransaction(null);
          setShowTransactionModal(true);
        }}
        onAddGoal={() => {
          setEditingGoal(null);
          setShowGoalModal(true);
        }}
        onOpenProfile={() => setShowProfileSettings(true)}
      />

      {/* Main Content - Responsive Layout */}
      <main className="relative z-10 w-full px-3 sm:px-4 md:px-6 lg:max-w-7xl lg:mx-auto py-4 sm:py-6 lg:py-8">
        {/* Summary Cards - Top */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <SummaryCard title="Total Income" amount={totalIncome} color="green" icon="💰" currency={user.currency as Currency} />
          <SummaryCard title="Total Expenses" amount={totalExpenses} color="red" icon="💳" currency={user.currency as Currency} />
          <SummaryCard title="Net Balance" amount={balance} color="blue" icon="📊" currency={user.currency as Currency} />
          <SummaryCard title="This Month" amount={monthlyIncome} color="purple" icon="📅" currency={user.currency as Currency} />
        </div>

        {/* Charts Section - Middle */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Expenses Line Chart */}
          <ExpensesLineChartNew expenses={expenses} period={chartPeriod} currency={user.currency as Currency} />
          
          {/* Spending Pie Chart */}
          <SpendingPieChartNew expenses={expenses} currency={user.currency as Currency} />
        </div>

        {/* Period Management */}
        <PeriodSelector 
          user={{
            rulePeriod: user.rulePeriod || 'monthly',
            customPeriodDays: user.customPeriodDays,
            periodStartDate: user.periodStartDate || new Date().toISOString(),
            autoResetEnabled: user.autoResetEnabled !== false,
            currency: user.currency as Currency || 'USD'
          }}
          onUpdate={async (settings) => {
            try {
              const response = await fetch('/api/rule-period', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
              });
              
              if (response.ok) {
                toast.success('Period settings updated successfully');
                router.refresh();
              } else {
                throw new Error('Failed to update settings');
              }
            } catch (error) {
              console.error('Error updating period settings:', error);
              toast.error('Failed to update period settings');
            }
          }}
        />

        {/* Financial Rule Widget */}
        <div className="mb-6 sm:mb-8">
          {renderFinancialRuleWidget()}
        </div>

        {/* Period Analytics */}
        <div className="mb-6 sm:mb-8">
          <PeriodAnalytics currency={user.currency as Currency || 'USD'} />
        </div>

        {/* Bill Reminders Section */}
        <div className="mb-6 sm:mb-8">
          <BillReminderManager />
        </div>

        {/* Collapsible Forms Section */}
        <div className="space-y-4 mb-6 sm:mb-8">
          {/* Add Transaction Form */}
          <div className="bg-white/90 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-xl overflow-hidden">
            <button
              onClick={() => setShowAddTransaction(!showAddTransaction)}
              className="w-full px-6 py-4 bg-gradient-to-r from-indigo-500 to-blue-600 text-white flex justify-between items-center hover:from-indigo-600 hover:to-blue-700 transition-colors"
            >
              <span className="font-semibold">➕ Add Transaction</span>
              <svg 
                className={`w-5 h-5 transform transition-transform ${showAddTransaction ? 'rotate-180' : ''}`} 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            {showAddTransaction && (
              <div className="p-6">
                <button
                  onClick={() => {
                    setEditingTransaction(null);
                    setShowTransactionModal(true);
                  }}
                  className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700"
                >
                  Open Transaction Form
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tables Section - Bottom */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Recent Transactions */}
          <div className="bg-white/90 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-blue-600 p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-white">Recent Transactions</h3>
            </div>
            <div className="p-3 sm:p-4">
              {recentTransactions.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No transactions yet</p>
              ) : (
                <div className="space-y-2">
                  {recentTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      onClick={() => handleEditTransaction(transaction)}
                      className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors">
                    >
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className={`p-2 rounded-lg ${getCategoryColor(transaction.category)}`}>
                          {(() => {
                            const Icon = getCategoryIcon(transaction.category, transaction.type as 'income' | 'expense');
                            return <Icon className="w-5 h-5" />;
                          })()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{transaction.category}</p>
                          <p className="text-xs text-gray-500">{formatDate(transaction.date)}</p>
                        </div>
                      </div>
                      <span className={`font-semibold text-sm sm:text-base flex-shrink-0 ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount, user.currency as Currency)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Saving Goals */}
          <div className="bg-white/90 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-4 sm:p-6 flex justify-between items-center">
              <h3 className="text-lg sm:text-xl font-bold text-white">Saving Goals</h3>
              <button
                onClick={() => {
                  setEditingGoal(null);
                  setShowGoalModal(true);
                }}
                className="group relative flex items-center justify-center w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
                title="Add New Goal"
              >
                <svg 
                  className="w-5 h-5 text-white group-hover:rotate-90 transition-transform duration-200" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <div className="absolute -inset-1 bg-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              </button>
            </div>
            <div className="p-3 sm:p-4 space-y-3">
              {savingGoals.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No saving goals yet</p>
              ) : (
                savingGoals.slice(0, 3).map((goal) => {
                  const progress = (goal.saved / goal.target) * 100;
                  return (
                    <div 
                      key={goal.id} 
                      onClick={() => handleEditGoal(goal)}
                      className="bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{goal.name}</h4>
                        <span className="text-sm font-semibold text-gray-600">
                          {progress.toFixed(0)}%
                        </span>
                      </div>
                      <ProgressBar
                        label=""
                        current={goal.saved}
                        target={goal.target}
                        color={progress >= 100 ? 'green' : progress >= 50 ? 'blue' : 'amber'}
                        showPercentage={false}
                        showValues={false}
                      />
                      <div className="flex justify-between mt-2 text-xs text-gray-600">
                        <span>{formatCurrency(goal.saved, user.currency as Currency)} / {formatCurrency(goal.target, user.currency as Currency)}</span>
                        <span>Due: {formatDate(goal.deadline)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <EditTransactionModalOptimistic
        isOpen={showTransactionModal}
        onClose={() => {
          setShowTransactionModal(false);
          setEditingTransaction(null);
        }}
        onSuccess={handleTransactionCreate}
        onUpdate={handleTransactionUpdate}
        onDelete={handleTransactionDelete}
        transaction={editingTransaction}
        currency={user.currency as Currency}
      />
      <EditGoalModal
        isOpen={showGoalModal}
        onClose={() => {
          setShowGoalModal(false);
          setEditingGoal(null);
        }}
        onSuccess={handleGoalSuccess}
        goal={editingGoal}
        currency={user.currency as Currency}
      />
      {showProfileSettings && (
        <ProfileSettings
          user={{
            id: user.id,
            email: user.email,
            name: user.name ?? null,
            selectedRule: user.selectedRule ?? null,
            savingsPercentage: user.savingsPercentage || 20,
            currency: user.currency
          }}
          onClose={() => setShowProfileSettings(false)}
          onSuccess={async (updatedUser) => {
            setShowProfileSettings(false);
            // Update the user state with new currency
            setUser(prev => ({ ...prev, ...updatedUser }));
            toast.success('Profile updated successfully');
          }}
        />
      )}
    </div>
  );
}

// Summary Card Component
function SummaryCard({ title, amount, color, icon, currency = 'USD' }: {
  title: string;
  amount: number;
  color: string;
  icon: string;
  currency?: Currency;
}) {
  const colorClasses = {
    green: 'from-green-500 to-emerald-600',
    red: 'from-red-500 to-pink-600',
    blue: 'from-blue-500 to-indigo-600',
    purple: 'from-purple-500 to-pink-600'
  }[color] || 'from-gray-500 to-gray-600';

  const textColor = {
    green: 'text-green-600',
    red: 'text-red-600',
    blue: 'text-blue-600',
    purple: 'text-purple-600'
  }[color] || 'text-gray-600';

  return (
    <div className="bg-white/90 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-xl p-3 sm:p-4 lg:p-6 relative overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r ${colorClasses} rounded-xl flex items-center justify-center shadow-lg`}>
          <span className="text-lg sm:text-xl text-white">{icon}</span>
        </div>
        <div className={`w-8 h-8 bg-gradient-to-r ${colorClasses} rounded-lg flex items-center justify-center shadow-md`}>
          <svg 
            className="w-4 h-4 text-white" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            {amount >= 0 ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
            )}
          </svg>
        </div>
      </div>
      
      {/* Subtle background decoration */}
      <div className={`absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-r ${colorClasses} opacity-5 rounded-full`}></div>
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <p className={`text-xl sm:text-2xl font-bold ${textColor}`}>
        {formatCurrency(Math.abs(amount), currency)}
      </p>
    </div>
  );
}