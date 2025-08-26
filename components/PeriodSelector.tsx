'use client';

import React, { useState, useEffect } from 'react';
import { PERIOD_OPTIONS, formatPeriodLabel } from '@/lib/periodUtils';
import { formatCurrency, type Currency } from '@/lib/currency';

interface PeriodSelectorProps {
  user: {
    rulePeriod: string;
    customPeriodDays?: number | null;
    periodStartDate: string;
    autoResetEnabled: boolean;
    currency: Currency;
  };
  onUpdate: (settings: any) => Promise<void>;
}

export default function PeriodSelector({ user, onUpdate }: PeriodSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(user.rulePeriod);
  const [customDays, setCustomDays] = useState(user.customPeriodDays || 30);
  const [autoReset, setAutoReset] = useState(user.autoResetEnabled);
  const [loading, setLoading] = useState(false);
  const [periodInfo, setPeriodInfo] = useState<any>(null);

  useEffect(() => {
    fetchPeriodInfo();
  }, []);

  const fetchPeriodInfo = async () => {
    try {
      const response = await fetch('/api/rule-period');
      const data = await response.json();
      setPeriodInfo(data);
    } catch (error) {
      console.error('Error fetching period info:', error);
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await onUpdate({
        rulePeriod: selectedPeriod,
        customPeriodDays: selectedPeriod === 'custom' ? customDays : null,
        autoResetEnabled: autoReset
      });
      
      await fetchPeriodInfo();
      setIsOpen(false);
    } catch (error) {
      console.error('Error updating period settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleForceReset = async () => {
    if (!confirm('Are you sure you want to reset the current period? This will save the current period data and start a new one.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/rule-period', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        await fetchPeriodInfo();
        alert('Period has been reset successfully!');
      }
    } catch (error) {
      console.error('Error resetting period:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Period Status Bar */}
      <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-gray-600">Current Period:</span>
              <span className="font-semibold text-gray-900">
                {periodInfo?.currentPeriod?.label || 'Loading...'}
              </span>
            </div>
            
            {periodInfo?.currentPeriod && (
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, (new Date().getTime() - new Date(periodInfo.currentPeriod.start).getTime()) / 
                          (new Date(periodInfo.currentPeriod.end).getTime() - new Date(periodInfo.currentPeriod.start).getTime()) * 100)}%`
                      }}
                    />
                  </div>
                </div>
                <span className="text-sm text-gray-600">
                  {periodInfo.currentPeriod.daysRemaining} days remaining
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 ml-6">
            <button
              onClick={() => setIsOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-shadow"
            >
              Settings
            </button>
            
            {periodInfo?.currentPeriod?.isComplete && (
              <button
                onClick={handleForceReset}
                disabled={loading}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-shadow"
              >
                Start New Period
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold">Period Settings</h2>
              <p className="text-gray-600 mt-1">Configure how your financial rules reset</p>
            </div>

            <div className="p-6">
              {/* Period Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Reset Period
                </label>
                <div className="space-y-2">
                  {PERIOD_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedPeriod(option.value)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        selectedPeriod === option.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-gray-600">{option.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Days Input */}
              {selectedPeriod === 'custom' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Period (days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={customDays}
                    onChange={(e) => setCustomDays(parseInt(e.target.value) || 30)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              {/* Auto Reset Toggle */}
              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={autoReset}
                    onChange={(e) => setAutoReset(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    Automatically reset when period ends
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  When enabled, your financial tracking will automatically start a new period
                </p>
              </div>

              {/* Historical Periods */}
              {periodInfo?.historicalPeriods && periodInfo.historicalPeriods.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Recent Periods</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {periodInfo.historicalPeriods.slice(0, 5).map((period: any) => (
                      <div
                        key={period.id}
                        className="p-3 bg-gray-50 rounded-lg text-sm"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">
                            {formatPeriodLabel(
                              period.periodType,
                              new Date(period.startDate),
                              new Date(period.endDate)
                            )}
                          </span>
                          <span className={`font-semibold ${
                            period.savingsRate > 0 ? 'text-green-600' : 'text-gray-600'
                          }`}>
                            {period.savingsRate?.toFixed(1)}% saved
                          </span>
                        </div>
                        <div className="flex justify-between mt-1 text-xs text-gray-600">
                          <span>Income: {formatCurrency(period.totalIncome, user.currency)}</span>
                          <span>Expenses: {formatCurrency(period.totalExpenses, user.currency)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleUpdate}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Settings'}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>

              {/* Manual Reset Button */}
              <div className="mt-4 pt-4 border-t">
                <button
                  onClick={handleForceReset}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:shadow-lg transition-shadow"
                >
                  Reset Period Now
                </button>
                <p className="text-xs text-gray-500 mt-1 text-center">
                  This will close the current period and start a new one
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}