'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  HomeIcon,
  PlusCircleIcon,
  ChartBarIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  BanknotesIcon,
  TrophyIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import NotificationBell from './notifications/NotificationBell';
import SettingsModal from './SettingsModal';

interface NavbarProps {
  user: {
    email: string;
    name?: string | null;
  };
  onAddTransaction?: () => void;
  onAddGoal?: () => void;
  onOpenProfile?: () => void;
}

export default function Navbar({ user, onAddTransaction, onAddGoal, onOpenProfile }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Add Transaction', href: '#', icon: PlusCircleIcon, action: onAddTransaction },
    { name: 'Saving Goals', href: '#', icon: TrophyIcon, action: onAddGoal },
    { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
    { name: 'Settings', href: '#', icon: CogIcon, action: () => setSettingsOpen(true) },
  ];

  const handleNavClick = (item: any) => {
    if (item.action) {
      item.action();
      setMobileMenuOpen(false);
    } else if (item.href && item.href !== '#') {
      router.push(item.href);
      setMobileMenuOpen(false);
    }
  };

  return (
    <>
    <nav className="relative z-30 bg-white/95 backdrop-blur-lg shadow-sm border-b border-gray-100 overflow-visible">
      <div className="w-full px-3 sm:px-4 md:px-6 lg:max-w-7xl lg:mx-auto overflow-visible">
        <div className="flex justify-between items-center h-16 overflow-visible">
          {/* Logo and Desktop Navigation */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <BanknotesIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent whitespace-nowrap">
                FinTrack
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:ml-8 lg:flex lg:space-x-4">
              {navigation.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleNavClick(item)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                    pathname === item.href
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4 overflow-visible">
            {/* Notification Bell */}
            <div className="overflow-visible">
              <NotificationBell />
            </div>
            
            {/* Desktop User Info */}
            <div className="hidden lg:flex items-center space-x-4">
              <button
                onClick={onOpenProfile}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <UserCircleIcon className="w-5 h-5" />
                <span>{user.name || user.email}</span>
              </button>
              <button
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 transition-all shadow-sm"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-16 inset-x-0 bg-white/95 backdrop-blur-lg shadow-lg border-b border-gray-200 z-20">
          <div className="px-4 py-4 space-y-2">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavClick(item)}
                className={`w-full px-3 py-3 rounded-lg text-left font-medium transition-colors flex items-center space-x-3 ${
                  pathname === item.href
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50 active:bg-gray-100'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </button>
            ))}
            
            <div className="border-t pt-4 mt-4 space-y-2">
              <button
                onClick={() => {
                  onOpenProfile?.();
                  setMobileMenuOpen(false);
                }}
                className="w-full px-3 py-3 rounded-lg text-left font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-3"
              >
                <UserCircleIcon className="w-5 h-5" />
                <div>
                  <div className="text-sm">{user.name || 'Profile'}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </div>
              </button>
              <button
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                className="w-full px-3 py-3 rounded-lg text-left font-medium text-white bg-gradient-to-r from-red-500 to-pink-600 flex items-center space-x-3"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
    
    {/* Settings Modal */}
    <SettingsModal
      isOpen={settingsOpen}
      onClose={() => setSettingsOpen(false)}
      user={{ ...user, id: '' }}
    />
    </>
  );
}