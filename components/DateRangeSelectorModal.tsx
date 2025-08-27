'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface DateRangeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (startDate: string, endDate: string, preset?: string) => void;
  minDate?: string;
  maxDate?: string;
}

export default function DateRangeSelectorModal({
  isOpen,
  onClose,
  onConfirm,
  minDate,
  maxDate
}: DateRangeSelectorModalProps) {
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState(today);
  const [selectedPreset, setSelectedPreset] = useState<string>('');

  const presets = [
    { label: 'Last 7 Days', value: '7days', days: 7 },
    { label: 'Last 30 Days', value: '30days', days: 30 },
    { label: 'Last 3 Months', value: '3months', days: 90 },
    { label: 'Last 6 Months', value: '6months', days: 180 },
    { label: 'This Year', value: 'thisyear', days: -1 },
    { label: 'All Time', value: 'all', days: -2 },
  ];

  const handlePresetClick = (preset: typeof presets[0]) => {
    const end = new Date();
    let start = new Date();
    
    if (preset.value === 'thisyear') {
      start = new Date(end.getFullYear(), 0, 1);
    } else if (preset.value === 'all') {
      setStartDate('');
      setEndDate('');
      setSelectedPreset(preset.value);
      return;
    } else {
      start = new Date(end.getTime() - preset.days * 24 * 60 * 60 * 1000);
    }
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
    setSelectedPreset(preset.value);
  };

  const handleConfirm = () => {
    if (selectedPreset === 'all' || (!startDate && !endDate)) {
      // All time - no date filtering
      onConfirm('', '', 'All Time');
    } else if (startDate && endDate) {
      // Custom date range
      onConfirm(startDate, endDate, selectedPreset || 'Custom Range');
    } else {
      // Invalid selection
      alert('Please select both start and end dates or choose a preset');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="relative inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Select Report Period</h3>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            {/* Preset buttons */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Quick Select
              </label>
              <div className="grid grid-cols-2 gap-2">
                {presets.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => handlePresetClick(preset)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      selectedPreset === preset.value
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom date range */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Range
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setSelectedPreset('');
                      }}
                      max={endDate || today}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setSelectedPreset('');
                      }}
                      min={startDate}
                      max={today}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Selected period display */}
              {(startDate || endDate || selectedPreset) && (
                <div className="bg-indigo-50 rounded-lg p-3">
                  <p className="text-sm text-indigo-700">
                    <span className="font-medium">Selected Period: </span>
                    {selectedPreset === 'all' ? 'All Time' : 
                     startDate && endDate ? `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}` :
                     'Please select both dates'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium shadow-lg"
            >
              Generate Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}