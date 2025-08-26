'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { formatCurrency, getCurrencySymbol, Currency } from '@/lib/currency';

interface Budget {
  id: string;
  category: string;
  amount: number;
  period: string;
}

interface DeleteModalProps {
  isOpen: boolean;
  budgetName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const CATEGORIES = [
  'Food & Dining',
  'Shopping',
  'Entertainment',
  'Transportation',
  'Bills & Utilities',
  'Healthcare',
  'Travel',
  'Education',
  'Personal Care',
  'Gifts & Donations',
  'Other'
];

const CATEGORY_ICONS: { [key: string]: string } = {
  'Food & Dining': '🍽️',
  'Shopping': '🛍️',
  'Entertainment': '🎬',
  'Transportation': '🚗',
  'Bills & Utilities': '💡',
  'Healthcare': '🏥',
  'Travel': '✈️',
  'Education': '📚',
  'Personal Care': '💅',
  'Gifts & Donations': '🎁',
  'Other': '📦'
};

const CATEGORY_COLORS: { [key: string]: string } = {
  'Food & Dining': 'from-orange-400 to-red-500',
  'Shopping': 'from-purple-400 to-pink-500',
  'Entertainment': 'from-blue-400 to-indigo-500',
  'Transportation': 'from-green-400 to-teal-500',
  'Bills & Utilities': 'from-yellow-400 to-orange-500',
  'Healthcare': 'from-red-400 to-pink-500',
  'Travel': 'from-cyan-400 to-blue-500',
  'Education': 'from-indigo-400 to-purple-500',
  'Personal Care': 'from-pink-400 to-rose-500',
  'Gifts & Donations': 'from-teal-400 to-green-500',
  'Other': 'from-gray-400 to-gray-500'
};

// Delete Confirmation Modal Component
function DeleteModal({ isOpen, budgetName, onConfirm, onCancel }: DeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 text-center">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
          onClick={onCancel}
        />
        
        {/* Modal */}
        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          <div className="bg-white px-6 py-6">
            {/* Icon */}
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-red-100 to-orange-100">
              <ExclamationTriangleIcon className="h-7 w-7 text-red-600" />
            </div>
            
            {/* Content */}
            <div className="mt-4 text-center">
              <h3 className="text-lg font-semibold text-gray-900">Delete Budget</h3>
              <div className="mt-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete the budget for
                </p>
                <p className="mt-1 text-base font-medium text-gray-900">
                  "{budgetName}"?
                </p>
                <p className="mt-3 text-sm text-gray-500">
                  This action cannot be undone. All tracking data for this budget will be permanently removed.
                </p>
              </div>
            </div>
            
            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 rounded-xl bg-gradient-to-r from-red-500 to-pink-600 px-4 py-2.5 text-sm font-medium text-white hover:from-red-600 hover:to-pink-700 shadow-sm transition-all"
              >
                Delete Budget
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BudgetManager() {
  const { data: session } = useSession();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; budget: Budget | null }>({
    isOpen: false,
    budget: null
  });
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    period: 'monthly'
  });
  const [userCurrency, setUserCurrency] = useState<Currency>('USD');

  useEffect(() => {
    fetchBudgets();
  }, []);

  // Fetch user's currency preference
  useEffect(() => {
    fetchUserProfile();
  }, [session]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        // Set the user's currency preference
        if (data.user && data.user.currency) {
          setUserCurrency(data.user.currency as Currency);
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/budgets');
      if (response.ok) {
        const data = await response.json();
        setBudgets(data);
      }
    } catch (error) {
      console.error('Error fetching budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category || !formData.amount) return;

    try {
      setSaving(true);
      const url = editingBudget 
        ? `/api/budgets/${editingBudget.id}`
        : '/api/budgets';
      
      const response = await fetch(url, {
        method: editingBudget ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: formData.category,
          amount: parseFloat(formData.amount),
          period: formData.period
        })
      });

      if (response.ok) {
        await fetchBudgets();
        setShowForm(false);
        setEditingBudget(null);
        setFormData({ category: '', amount: '', period: 'monthly' });
      }
    } catch (error) {
      console.error('Error saving budget:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setFormData({
      category: budget.category,
      amount: budget.amount.toString(),
      period: budget.period
    });
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteModal.budget) return;

    try {
      const response = await fetch(`/api/budgets/${deleteModal.budget.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchBudgets();
        setDeleteModal({ isOpen: false, budget: null });
      }
    } catch (error) {
      console.error('Error deleting budget:', error);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingBudget(null);
    setFormData({ category: '', amount: '', period: 'monthly' });
  };

  if (loading) {
    return (
      <div className="bg-white/90 backdrop-blur-lg shadow-lg rounded-2xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white/90 backdrop-blur-lg shadow-lg rounded-2xl overflow-hidden">
        <div className="px-6 py-5 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <ChartBarIcon className="w-6 h-6 text-indigo-600" />
                Budget Management
              </h3>
              <p className="text-sm text-gray-600 mt-1">Set spending limits for different categories</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium rounded-xl hover:from-indigo-600 hover:to-purple-700 shadow-sm transition-all transform hover:scale-105"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Budget
            </button>
          </div>
        </div>

        {showForm && (
          <div className="px-6 py-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-gray-200">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Category Select */}
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <TagIcon className="inline w-4 h-4 mr-1 text-gray-500" />
                    Category
                  </label>
                  <div className="relative">
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-3 pl-10 rounded-xl border-2 border-gray-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all appearance-none cursor-pointer"
                      required
                    >
                      <option value="">Select category</option>
                      {CATEGORIES.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xl pointer-events-none">
                      {formData.category && CATEGORY_ICONS[formData.category] || '📋'}
                    </div>
                  </div>
                </div>
                
                {/* Amount Input */}
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <CurrencyDollarIcon className="inline w-4 h-4 mr-1 text-gray-500" />
                    Amount ({getCurrencySymbol(userCurrency)})
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                      {getCurrencySymbol(userCurrency)}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
                
                {/* Period Select */}
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <CalendarIcon className="inline w-4 h-4 mr-1 text-gray-500" />
                    Period
                  </label>
                  <select
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all appearance-none cursor-pointer"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-5 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-sm font-medium hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 transition-all shadow-sm"
                >
                  {saving ? 'Saving...' : editingBudget ? 'Update Budget' : 'Create Budget'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="p-6">
          {budgets.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                <ChartBarIcon className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg">No budgets set yet</p>
              <p className="text-gray-400 text-sm mt-2">Create your first budget to start tracking spending limits</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {budgets.map((budget) => {
                const icon = CATEGORY_ICONS[budget.category] || '📦';
                const gradient = CATEGORY_COLORS[budget.category] || 'from-gray-400 to-gray-500';
                
                return (
                  <div 
                    key={budget.id} 
                    className="group relative bg-gradient-to-br from-white to-gray-50 p-5 rounded-xl border-2 border-gray-100 hover:border-indigo-200 hover:shadow-lg transition-all"
                  >
                    {/* Category Icon and Name */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-2xl shadow-sm`}>
                          {icon}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 text-lg">{budget.category}</h4>
                          <p className="text-sm text-gray-500 capitalize">{budget.period} budget</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Amount Display */}
                    <div className="mt-4 flex items-end justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Budget limit</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCurrency(budget.amount, userCurrency)}
                        </p>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(budget)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit budget"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteModal({ isOpen: true, budget })}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete budget"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        budgetName={deleteModal.budget?.category || ''}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal({ isOpen: false, budget: null })}
      />
    </>
  );
}