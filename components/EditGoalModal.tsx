'use client';

import { useState, useEffect } from 'react';
import { formatDateForInput, getDaysRemaining } from '@/lib/dateUtils';
import { getCurrencySymbol, type Currency } from '@/lib/currency';
import ConfirmationModal from './ConfirmationModal';

interface EditGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  goal: {
    id: string;
    name: string;
    target: number;
    saved: number;
    deadline: string;
  } | null;
  currency?: Currency;
}

export default function EditGoalModal({ isOpen, onClose, onSuccess, goal, currency = 'USD' }: EditGoalModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    target: '',
    saved: '0',
    deadline: ''
  });

  useEffect(() => {
    if (goal) {
      setFormData({
        name: goal.name,
        target: goal.target.toString(),
        saved: goal.saved.toString(),
        deadline: formatDateForInput(goal.deadline)
      });
    } else {
      // Reset for new goal
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 30); // Default to 30 days from now
      setFormData({
        name: '',
        target: '',
        saved: '0',
        deadline: formatDateForInput(tomorrow)
      });
    }
  }, [goal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (parseFloat(formData.target) <= 0) {
      setError('Target amount must be greater than 0');
      setLoading(false);
      return;
    }

    if (parseFloat(formData.saved) < 0) {
      setError('Saved amount cannot be negative');
      setLoading(false);
      return;
    }

    if (parseFloat(formData.saved) > parseFloat(formData.target)) {
      setError('Saved amount cannot exceed target');
      setLoading(false);
      return;
    }

    const deadlineDate = new Date(formData.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (!goal && deadlineDate <= today) {
      setError('Deadline must be in the future');
      setLoading(false);
      return;
    }

    try {
      const url = goal 
        ? `/api/saving-goals/${goal.id}`
        : '/api/saving-goals';
      
      const method = goal ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          target: parseFloat(formData.target),
          saved: parseFloat(formData.saved)
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save goal');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!goal) return;
    
    setLoading(true);
    setError('');
    setShowDeleteConfirm(false);

    try {
      const response = await fetch(`/api/saving-goals/${goal.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete goal');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const progress = formData.target ? (parseFloat(formData.saved) / parseFloat(formData.target)) * 100 : 0;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">
          {goal ? 'Edit Saving Goal' : 'Add Saving Goal'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Goal Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., Emergency Fund, Vacation, New Car"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">{getCurrencySymbol(currency)}</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.target}
                  onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount Already Saved
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">{getCurrencySymbol(currency)}</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.saved}
                  onChange={(e) => setFormData({ ...formData, saved: e.target.value })}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              {formData.target && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{progress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        progress >= 100 ? 'bg-green-500' : 
                        progress >= 50 ? 'bg-blue-500' : 
                        'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, progress)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deadline <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                min={formatDateForInput(new Date())}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
              {formData.deadline && (
                <p className="mt-1 text-xs text-gray-500">
                  {getDaysRemaining(formData.deadline)} days remaining
                </p>
              )}
            </div>

            {formData.target && formData.deadline && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <p className="text-sm font-medium text-purple-900 mb-1">Monthly Saving Required</p>
                <p className="text-lg font-bold text-purple-700">
                  {getCurrencySymbol(currency)}{(() => {
                    const remaining = Math.max(0, parseFloat(formData.target) - parseFloat(formData.saved));
                    const months = Math.max(1, Math.ceil((new Date(formData.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30)));
                    return (remaining / months).toFixed(2);
                  })()}
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-between mt-6">
            <div>
              {goal && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={loading}
                  className="px-4 py-2 text-red-600 hover:text-red-800 disabled:opacity-50"
                >
                  Delete
                </button>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : goal ? 'Update Goal' : 'Create Goal'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>

    {/* Delete Confirmation Modal */}
    <ConfirmationModal
      isOpen={showDeleteConfirm}
      onConfirm={handleDelete}
      onClose={() => setShowDeleteConfirm(false)}
      title="Delete Saving Goal"
      message="Are you sure you want to delete this saving goal? This action cannot be undone."
      confirmText="Delete"
      cancelText="Cancel"
      type="danger"
    />
  </>
  );
}