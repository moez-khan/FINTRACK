'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  PlusIcon, 
  CheckIcon, 
  XMarkIcon,
  PencilIcon,
  TrashIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  BellAlertIcon
} from '@heroicons/react/24/outline';
import { formatCurrency, getCurrencySymbol, Currency } from '@/lib/currency';

interface BillReminder {
  id: string;
  name: string;
  amount?: number;
  dueDate: string;
  frequency: string;
  reminderDays: number[];
  isPaid: boolean;
}

interface DeleteModalProps {
  isOpen: boolean;
  billName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

// Delete Confirmation Modal Component
function DeleteModal({ isOpen, billName, onConfirm, onCancel }: DeleteModalProps) {
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
              <h3 className="text-lg font-semibold text-gray-900">Delete Bill Reminder</h3>
              <div className="mt-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete the reminder for
                </p>
                <p className="mt-1 text-base font-medium text-gray-900">
                  "{billName}"?
                </p>
                <p className="mt-3 text-sm text-gray-500">
                  This action cannot be undone. All reminder settings for this bill will be permanently removed.
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
                Delete Reminder
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const BILL_ICONS: { [key: string]: string } = {
  'Rent': '🏠',
  'Electricity': '💡',
  'Water': '💧',
  'Gas': '🔥',
  'Internet': '🌐',
  'Phone': '📱',
  'Insurance': '🛡️',
  'Subscription': '📺',
  'Loan': '💳',
  'Other': '📄'
};

const FREQUENCY_COLORS: { [key: string]: string } = {
  'one-time': 'from-gray-400 to-gray-500',
  'weekly': 'from-blue-400 to-indigo-500',
  'monthly': 'from-green-400 to-teal-500',
  'yearly': 'from-purple-400 to-pink-500'
};

export default function BillReminderManager() {
  const { data: session } = useSession();
  const [bills, setBills] = useState<BillReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingBill, setEditingBill] = useState<BillReminder | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; bill: BillReminder | null }>({
    isOpen: false,
    bill: null
  });
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    dueDate: '',
    frequency: 'monthly',
    reminderDays: [7, 3, 1]
  });
  const [userCurrency, setUserCurrency] = useState<Currency>('USD');

  useEffect(() => {
    fetchBills();
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
        if (data.user && data.user.currency) {
          setUserCurrency(data.user.currency as Currency);
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchBills = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/bill-reminders');
      if (response.ok) {
        const data = await response.json();
        setBills(data);
      }
    } catch (error) {
      console.error('Error fetching bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.dueDate || !formData.frequency) return;

    try {
      setSaving(true);
      const url = editingBill 
        ? `/api/bill-reminders/${editingBill.id}`
        : '/api/bill-reminders';
      
      const response = await fetch(url, {
        method: editingBill ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          amount: formData.amount ? parseFloat(formData.amount) : null,
          dueDate: formData.dueDate,
          frequency: formData.frequency,
          reminderDays: formData.reminderDays
        })
      });

      if (response.ok) {
        await fetchBills();
        setShowForm(false);
        setEditingBill(null);
        setFormData({
          name: '',
          amount: '',
          dueDate: '',
          frequency: 'monthly',
          reminderDays: [7, 3, 1]
        });
      }
    } catch (error) {
      console.error('Error saving bill:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (bill: BillReminder) => {
    setEditingBill(bill);
    setFormData({
      name: bill.name,
      amount: bill.amount?.toString() || '',
      dueDate: bill.dueDate,
      frequency: bill.frequency,
      reminderDays: bill.reminderDays || [7, 3, 1]
    });
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteModal.bill) return;

    try {
      const response = await fetch(`/api/bill-reminders/${deleteModal.bill.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchBills();
        setDeleteModal({ isOpen: false, bill: null });
      }
    } catch (error) {
      console.error('Error deleting bill:', error);
    }
  };

  const markAsPaid = async (billId: string) => {
    try {
      setBills(prev => prev.map(bill => 
        bill.id === billId ? { ...bill, isPaid: true } : bill
      ));
      
      const response = await fetch(`/api/bill-reminders/${billId}/paid`, {
        method: 'PUT',
      });

      if (!response.ok) {
        // Revert on error
        setBills(prev => prev.map(bill => 
          bill.id === billId ? { ...bill, isPaid: false } : bill
        ));
      }
    } catch (error) {
      console.error('Error marking bill as paid:', error);
      setBills(prev => prev.map(bill => 
        bill.id === billId ? { ...bill, isPaid: false } : bill
      ));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getDaysUntilDue = (dateString: string) => {
    const dueDate = new Date(dateString);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getBillIcon = (billName: string) => {
    const lowerName = billName.toLowerCase();
    for (const [key, icon] of Object.entries(BILL_ICONS)) {
      if (lowerName.includes(key.toLowerCase())) {
        return icon;
      }
    }
    return BILL_ICONS['Other'];
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
        <div className="px-6 py-5 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <BellAlertIcon className="w-6 h-6 text-blue-600" />
                Bill Reminders
              </h3>
              <p className="text-sm text-gray-600 mt-1">Never miss a payment with automatic reminders</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-600 text-white text-sm font-medium rounded-xl hover:from-blue-600 hover:to-cyan-700 shadow-sm transition-all transform hover:scale-105"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Bill
            </button>
          </div>
        </div>

        {showForm && (
          <div className="px-6 py-6 bg-gradient-to-br from-sky-50 to-blue-50 border-b border-gray-200">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Bill Name */}
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <DocumentTextIcon className="inline w-4 h-4 mr-1 text-gray-500" />
                    Bill Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 pl-10 rounded-xl border-2 border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      placeholder="e.g., Rent, Electricity"
                      required
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xl pointer-events-none">
                      {formData.name ? getBillIcon(formData.name) : '📄'}
                    </div>
                  </div>
                </div>
                
                {/* Amount */}
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <CurrencyDollarIcon className="inline w-4 h-4 mr-1 text-gray-500" />
                    Amount ({getCurrencySymbol(userCurrency)}) - Optional
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
                      className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                
                {/* Due Date */}
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <CalendarDaysIcon className="inline w-4 h-4 mr-1 text-gray-500" />
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all cursor-pointer"
                    required
                  />
                </div>
                
                {/* Frequency */}
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <ClockIcon className="inline w-4 h-4 mr-1 text-gray-500" />
                    Frequency
                  </label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all appearance-none cursor-pointer"
                  >
                    <option value="one-time">One-time</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>
              
              {/* Reminder Days */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <BellAlertIcon className="inline w-4 h-4 mr-1 text-gray-500" />
                  Reminder Days Before Due Date
                </label>
                <div className="flex flex-wrap gap-3">
                  {[1, 3, 7, 14, 30].map(day => (
                    <label key={day} className="inline-flex items-center cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={formData.reminderDays.includes(day)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              reminderDays: [...formData.reminderDays, day].sort((a, b) => b - a)
                            });
                          } else {
                            setFormData({
                              ...formData,
                              reminderDays: formData.reminderDays.filter(d => d !== day)
                            });
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className="relative w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl cursor-pointer peer-checked:border-blue-500 peer-checked:bg-gradient-to-r peer-checked:from-blue-50 peer-checked:to-cyan-50 hover:border-gray-300 transition-all">
                        <div className="flex items-center space-x-2">
                          <div className="w-5 h-5 border-2 border-gray-300 rounded peer-checked:border-blue-500 peer-checked:bg-blue-500 transition-all flex items-center justify-center">
                            <CheckIcon className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100" />
                          </div>
                          <span className="text-sm font-medium text-gray-700 peer-checked:text-blue-700">
                            {day} {day === 1 ? 'day' : 'days'} before
                          </span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingBill(null);
                    setFormData({
                      name: '',
                      amount: '',
                      dueDate: '',
                      frequency: 'monthly',
                      reminderDays: [7, 3, 1]
                    });
                  }}
                  className="px-5 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl text-sm font-medium hover:from-blue-600 hover:to-cyan-700 disabled:opacity-50 transition-all shadow-sm"
                >
                  {saving ? 'Saving...' : editingBill ? 'Update Reminder' : 'Create Reminder'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="p-6">
          {bills.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                <BellAlertIcon className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg">No bill reminders set yet</p>
              <p className="text-gray-400 text-sm mt-2">Add your first bill to never miss a payment</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bills.map((bill) => {
                const daysUntilDue = getDaysUntilDue(bill.dueDate);
                const isOverdue = daysUntilDue < 0;
                const isDueSoon = daysUntilDue <= 3 && daysUntilDue >= 0;
                const icon = getBillIcon(bill.name);
                const frequencyGradient = FREQUENCY_COLORS[bill.frequency] || FREQUENCY_COLORS['monthly'];
                
                return (
                  <div 
                    key={bill.id} 
                    className={`group relative p-5 rounded-xl border-2 transition-all ${
                      bill.isPaid 
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
                        : isOverdue 
                          ? 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200' 
                          : isDueSoon 
                            ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200' 
                            : 'bg-gradient-to-br from-white to-gray-50 border-gray-100 hover:border-blue-200 hover:shadow-lg'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Bill Icon */}
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${frequencyGradient} flex items-center justify-center text-2xl shadow-sm`}>
                          {icon}
                        </div>
                        
                        <div className="flex-1">
                          {/* Bill Name and Status */}
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={`font-semibold text-lg ${bill.isPaid ? 'text-green-900' : 'text-gray-900'}`}>
                              {bill.name}
                            </h4>
                            {bill.isPaid && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckIcon className="h-3 w-3 mr-1" />
                                Paid
                              </span>
                            )}
                            {isOverdue && !bill.isPaid && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Overdue
                              </span>
                            )}
                            {isDueSoon && !bill.isPaid && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Due Soon
                              </span>
                            )}
                          </div>
                          
                          {/* Bill Details */}
                          <div className="text-sm text-gray-600 flex items-center gap-3">
                            <span>Due: {formatDate(bill.dueDate)}</span>
                            {bill.amount && (
                              <span className="font-medium text-gray-900">
                                {formatCurrency(bill.amount, userCurrency)}
                              </span>
                            )}
                            <span className="capitalize px-2 py-0.5 bg-gray-100 rounded-md text-xs">
                              {bill.frequency}
                            </span>
                            {!bill.isPaid && (
                              <span className={`font-medium ${isOverdue ? 'text-red-600' : isDueSoon ? 'text-yellow-600' : 'text-gray-500'}`}>
                                {isOverdue 
                                  ? `${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) > 1 ? 's' : ''} overdue`
                                  : `${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''} remaining`
                                }
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        {!bill.isPaid && (
                          <button
                            onClick={() => markAsPaid(bill.id)}
                            className="px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg text-sm font-medium hover:from-green-600 hover:to-emerald-700 transition-all shadow-sm"
                          >
                            <CheckIcon className="h-4 w-4 inline mr-1" />
                            Mark Paid
                          </button>
                        )}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(bill)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit reminder"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteModal({ isOpen: true, bill })}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete reminder"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
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
        billName={deleteModal.bill?.name || ''}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal({ isOpen: false, bill: null })}
      />
    </>
  );
}