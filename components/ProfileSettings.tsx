'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrencyOptions, type Currency } from '@/lib/currency';

interface ProfileSettingsProps {
  user: {
    id: string;
    email: string;
    name: string | null;
    selectedRule: string | null;
    savingsPercentage: number;
    currency?: string;
  };
  onClose: () => void;
  onSuccess: (updatedUser?: any) => void;
}

export default function ProfileSettings({ user, onClose, onSuccess }: ProfileSettingsProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: user.name || '',
    selectedRule: user.selectedRule || '50-30-20',
    savingsPercentage: user.savingsPercentage || 20,
    currency: user.currency || 'USD',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.name === 'savingsPercentage' ? Number(e.target.value) : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update profile');
      }

      const result = await response.json();
      onSuccess(result.user);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl sm:text-2xl font-bold mb-4">Profile Settings</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Financial Rule
              </label>
              <select
                name="selectedRule"
                value={formData.selectedRule}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="50-30-20">50/30/20 Rule - Balanced budgeting</option>
                <option value="pay-yourself-first">Pay Yourself First - Prioritize savings</option>
                <option value="smart-goal">SMART Goals - Target-based savings</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                {formData.selectedRule === '50-30-20' && 'Allocate 50% needs, 30% wants, 20% savings'}
                {formData.selectedRule === 'pay-yourself-first' && 'Save a percentage of income first'}
                {formData.selectedRule === 'smart-goal' && 'Set specific, measurable financial goals'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                {getCurrencyOptions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} ({option.symbol})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Choose your preferred currency for displaying amounts
              </p>
            </div>

            {formData.selectedRule === 'pay-yourself-first' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Savings Percentage (%)
                </label>
                <input
                  type="number"
                  name="savingsPercentage"
                  min="1"
                  max="50"
                  value={formData.savingsPercentage}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  You'll save {formData.savingsPercentage}% of your income automatically
                </p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">
                About Financial Rules:
              </h3>
              <div className="space-y-2 text-xs text-blue-800">
                <div>
                  <strong>50/30/20 Rule:</strong> A balanced approach that divides your after-tax income into three categories: 50% for needs, 30% for wants, and 20% for savings and debt repayment.
                </div>
                <div>
                  <strong>Pay Yourself First:</strong> Prioritize saving by automatically setting aside a percentage of your income before allocating money to expenses.
                </div>
                <div>
                  <strong>SMART Goals:</strong> Set Specific, Measurable, Achievable, Relevant, and Time-bound financial goals with clear targets and deadlines.
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
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
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}