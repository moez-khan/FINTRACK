'use client';

import { useState, Suspense, lazy, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  XMarkIcon,
  BellIcon,
  ChartBarIcon,
  CreditCardIcon,
  CogIcon
} from '@heroicons/react/24/outline';

// Lazy load components for better performance
const NotificationPreferences = lazy(() => import('@/components/notifications/NotificationPreferences'));
const BudgetManager = lazy(() => import('@/components/BudgetManager'));
const BillReminderManager = lazy(() => import('@/components/BillReminderManager'));

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    email: string;
    name?: string | null;
  };
  defaultTab?: string;
}

// Loading skeleton component
const TabSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <div className="h-12 bg-gray-200 rounded w-full"></div>
        </div>
      ))}
    </div>
  </div>
);

export default function SettingsModal({ isOpen, onClose, user, defaultTab = 'notifications' }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set(['notifications']));

  // Reset to default tab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      setLoadedTabs(prev => new Set(prev).add(defaultTab));
    }
  }, [isOpen, defaultTab]);

  const tabs = [
    { id: 'notifications', name: 'Notifications', icon: BellIcon, emoji: '🔔' },
    { id: 'budgets', name: 'Budgets', icon: ChartBarIcon, emoji: '💰' },
    { id: 'bills', name: 'Bill Reminders', icon: CreditCardIcon, emoji: '💳' },
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setLoadedTabs(prev => new Set(prev).add(tabId));
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog 
        as="div" 
        className="relative z-[100]" 
        onClose={onClose}
      >
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-2 sm:p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl mx-2 sm:mx-4 transform overflow-hidden rounded-xl sm:rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                {/* Modal Header with Gradient */}
                <div className="relative bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-3 sm:p-6">
                  {/* Animated background pattern */}
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl animate-pulse animation-delay-2000"></div>
                  </div>
                  
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 backdrop-blur-lg rounded-xl flex items-center justify-center">
                        <CogIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div>
                        <Dialog.Title as="h3" className="text-lg sm:text-2xl font-bold text-white">
                          Settings
                        </Dialog.Title>
                        <p className="text-white/80 text-xs sm:text-sm hidden sm:block">Manage your preferences and configurations</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onClose();
                      }}
                      className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                      aria-label="Close settings"
                    >
                      <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </button>
                  </div>
                </div>

                {/* Tab Navigation */}
                <div className="border-b border-gray-200 bg-gray-50/50">
                  <nav className="flex space-x-1 px-2 sm:px-6 pt-2 overflow-x-auto scrollbar-hide">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleTabChange(tab.id);
                        }}
                        className={`group relative px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-t-lg transition-all cursor-pointer whitespace-nowrap ${
                          activeTab === tab.id
                            ? 'bg-white text-indigo-600 shadow-sm border-t border-l border-r border-gray-200'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                        }`}
                      >
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <span className="text-base sm:text-lg">{tab.emoji}</span>
                          <span className="hidden sm:inline">{tab.name}</span>
                          <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
                        </div>
                        {activeTab === tab.id && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                        )}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="relative p-3 sm:p-6 max-h-[60vh] overflow-y-auto bg-gradient-to-br from-gray-50 to-white">
                  {/* Subtle background pattern */}
                  <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
                    <div className="absolute inset-0" style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }}></div>
                  </div>
                  
                  <div className="relative z-10">
                    {/* Notifications Tab */}
                    <div style={{ display: activeTab === 'notifications' ? 'block' : 'none' }}>
                      <Suspense fallback={<TabSkeleton />}>
                        <NotificationPreferences />
                      </Suspense>
                    </div>
                    
                    {/* Budgets Tab */}
                    {(activeTab === 'budgets' || loadedTabs.has('budgets')) && (
                      <div style={{ display: activeTab === 'budgets' ? 'block' : 'none' }}>
                        <Suspense fallback={<TabSkeleton />}>
                          <BudgetManager />
                        </Suspense>
                      </div>
                    )}
                    
                    {/* Bills Tab */}
                    {(activeTab === 'bills' || loadedTabs.has('bills')) && (
                      <div style={{ display: activeTab === 'bills' ? 'block' : 'none' }}>
                        <Suspense fallback={<TabSkeleton />}>
                          <BillReminderManager />
                        </Suspense>
                      </div>
                    )}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="bg-gray-50 px-3 sm:px-6 py-3 sm:py-4 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <p className="text-xs sm:text-sm text-gray-500 truncate">
                      Logged in as <span className="font-medium text-gray-700">{user.email}</span>
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onClose();
                      }}
                      className="px-3 py-2 sm:px-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400 w-full sm:w-auto"
                    >
                      Close Settings
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}