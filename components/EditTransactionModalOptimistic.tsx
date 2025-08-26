'use client';

import { useState, useEffect } from 'react';
import { formatDateForInput } from '@/lib/dateUtils';
import { getCurrencySymbol, type Currency } from '@/lib/currency';
import ConfirmationModal from './ConfirmationModal';

interface EditTransactionModalOptimisticProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (transaction: any) => void;
  onDelete: (id: string) => void;
  onUpdate: (transaction: any) => void;
  transaction: {
    id: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    date: string;
    notes?: string;
  } | null;
  currency?: Currency;
}

const EXPENSE_CATEGORIES = [
  'Groceries', 'Rent', 'Transport', 'Utilities', 'Insurance', 'Healthcare',
  'Shopping', 'Entertainment', 'Dining', 'Hobbies', 'Travel', 'Subscriptions',
  'Savings', 'Investment', 'Emergency Fund', 'Other'
];

const INCOME_CATEGORIES = [
  'Salary', 'Freelance', 'Business', 'Investment', 'Rental', 'Bonus', 'Gift', 'Other'
];

export default function EditTransactionModalOptimistic({ 
  isOpen, 
  onClose, 
  onSuccess, 
  onDelete,
  onUpdate,
  transaction, 
  currency = 'USD' 
}: EditTransactionModalOptimisticProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category: '',
    date: formatDateForInput(new Date()),
    notes: ''
  });

  useEffect(() => {
    if (transaction) {
      setFormData({
        amount: transaction.amount.toString(),
        type: transaction.type,
        category: transaction.category,
        date: formatDateForInput(transaction.date),
        notes: transaction.notes || ''
      });
    }
  }, [transaction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (parseFloat(formData.amount) <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    const selectedDate = new Date(formData.date);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    if (selectedDate > tomorrow) {
      setError('Date cannot be in the future');
      return;
    }

    const transactionData = {
      ...formData,
      amount: parseFloat(formData.amount),
      date: new Date(formData.date).toISOString()
    };

    if (transaction) {
      // Update existing transaction
      const optimisticTransaction = {
        ...transaction,
        ...transactionData,
        updatedAt: new Date().toISOString()
      };
      
      // Optimistically update the UI
      onUpdate(optimisticTransaction);
      onClose();
      
      // Make API call in background
      setLoading(true);
      try {
        const response = await fetch(`/api/expenses/${transaction.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transactionData)
        });

        if (!response.ok) {
          throw new Error('Failed to update transaction');
        }
      } catch (err) {
        // Rollback on error
        onUpdate({ 
          error: true, 
          action: 'update', 
          original: transaction,
          id: transaction.id 
        });
        console.error('Error updating transaction:', err);
      } finally {
        setLoading(false);
      }
    } else {
      // Create new transaction
      const tempId = `temp-${Date.now()}`;
      const optimisticTransaction = {
        id: tempId,
        ...transactionData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Optimistically add to UI
      onSuccess(optimisticTransaction);
      onClose();
      
      // Reset form
      setFormData({
        amount: '',
        type: 'expense',
        category: '',
        date: formatDateForInput(new Date()),
        notes: ''
      });
      
      // Make API call in background
      setLoading(true);
      try {
        const response = await fetch('/api/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transactionData)
        });

        if (!response.ok) {
          throw new Error('Failed to create transaction');
        }
        
        const data = await response.json();
        // Replace temp transaction with real one
        onUpdate({ tempId, realTransaction: data.expense });
      } catch (err) {
        // Remove optimistic transaction on error
        onUpdate({ 
          error: true, 
          action: 'create', 
          id: tempId 
        });
        console.error('Error creating transaction:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDelete = () => {
    if (!transaction) return;
    
    // Trigger delete in parent which handles the optimistic update and API call
    onDelete(transaction.id);
    onClose();
    setShowDeleteConfirm(false);
  };

  if (!isOpen) return null;

  const categories = formData.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const currencySymbol = getCurrencySymbol(currency);

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {transaction ? 'Edit Transaction' : 'Add Transaction'}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Transaction Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'income', category: '' })}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.type === 'income'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  💵 Income
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'expense', category: '' })}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.type === 'expense'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  💳 Expense
                </button>
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount ({currencySymbol})
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                max={formatDateForInput(new Date())}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Add any notes..."
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              {transaction && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={loading}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  Delete
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : (transaction ? 'Update' : 'Add')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onConfirm={handleDelete}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
    </>
  );
}