'use client';

import { useState, useEffect, useRef } from 'react';
import { BellIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  priority: string;
  createdAt: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications?limit=20');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
        setUnreadCount(data.notifications.filter((n: Notification) => !n.isRead).length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationIds: string[]) => {
    try {
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds })
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            notificationIds.includes(n.id) ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true })
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'normal': return 'text-blue-500';
      case 'low': return 'text-gray-500';
      default: return 'text-blue-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'budget_alert': return '💰';
      case 'bill_reminder': return '💳';
      case 'goal_milestone': return '🎯';
      case 'anomaly': return '🚨';
      case 'summary': return '📊';
      default: return '🔔';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    currentY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;
    
    // Only allow dragging down to close
    if (diff > 0 && panelRef.current) {
      panelRef.current.style.transform = `translateY(${Math.min(diff, 300)}px)`;
    }
  };

  const handleTouchEnd = () => {
    const diff = currentY.current - startY.current;
    
    if (diff > 50) {
      setIsOpen(false);
    }
    
    if (panelRef.current) {
      panelRef.current.style.transform = '';
      panelRef.current.style.transition = 'transform 0.2s ease-out';
      setTimeout(() => {
        if (panelRef.current) {
          panelRef.current.style.transition = '';
        }
      }, 200);
    }
  };

  return (
    <>
      {/* Notification Button Container */}
      <div className="relative">
        {/* Extra padding container for badge space */}
        <div className="pt-1 pr-1">
          {/* Button with icon */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="relative block p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-lg transition-colors"
            aria-label="Notifications"
            aria-expanded={isOpen}
            aria-haspopup="true"
          >
            {unreadCount > 0 ? (
              <BellSolidIcon className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
            ) : (
              <BellIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            )}
          </button>
          
          {/* Badge positioned absolutely to the container */}
          {unreadCount > 0 && (
            <div className="absolute top-0 right-0 -mt-0.5 -mr-0.5">
              <span className="flex h-4 w-4 sm:h-5 sm:w-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 sm:h-5 sm:w-5 bg-red-500 items-center justify-center">
                  <span className="text-[10px] sm:text-xs text-white font-medium">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                </span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Notification Panel */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[100] bg-black/20 sm:bg-transparent"
            onClick={() => setIsOpen(false)}
          />
          <div 
            ref={panelRef}
            className="fixed sm:absolute left-0 right-0 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 top-20 sm:top-full sm:mt-3 w-full sm:w-96 md:w-[28rem] bg-white rounded-2xl shadow-2xl ring-1 ring-black/10 z-[101] overflow-hidden flex flex-col h-auto sm:h-auto max-h-[calc(100vh-5rem)] sm:max-h-[28rem]"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Mobile drag indicator */}
            <div className="sm:hidden flex justify-center pt-2 pb-1">
              <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
            </div>
            
            <div className="p-3 sm:p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Notifications</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Close notifications"
                  >
                    <XMarkIcon className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
              </div>
            </div>

            <div className={`overflow-y-auto bg-white ${notifications.length > 5 ? 'max-h-[320px]' : ''}`}>
              {loading ? (
                <div className="p-4 text-center text-gray-500 text-sm bg-white">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="p-8 sm:p-12 text-center text-gray-500 text-sm bg-white">
                  <BellIcon className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium text-gray-700">No notifications yet</p>
                  <p className="text-xs mt-1 text-gray-400">We'll notify you when something important happens</p>
                </div>
              ) : (
                notifications.map((notification, index) => (
                  <div
                    key={notification.id}
                    className={`p-3 sm:p-4 ${index < notifications.length - 1 ? 'border-b border-gray-100' : ''} hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-all duration-150 ${
                      !notification.isRead ? 'bg-blue-50 hover:bg-blue-100/50' : ''
                    }`}
                    onClick={() => {
                      if ('vibrate' in navigator && window.innerWidth < 640) {
                        navigator.vibrate(10);
                      }
                      if (!notification.isRead) {
                        markAsRead([notification.id]);
                      }
                    }}
                  >
                    <div className="flex items-start space-x-2.5 sm:space-x-3">
                      <div className="flex-shrink-0">
                        <span className="text-base sm:text-lg">
                          {getTypeIcon(notification.type)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs sm:text-sm font-medium ${getPriorityColor(notification.priority)} line-clamp-2`}>
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-indigo-600 rounded-full flex-shrink-0 mt-1"></div>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-[10px] sm:text-xs text-gray-400 mt-1">
                          {formatTimeAgo(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        </>
      )}
    </>
  );
}