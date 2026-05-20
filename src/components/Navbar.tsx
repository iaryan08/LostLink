import { useState } from 'react';
import { 
  Bell, 
  LogOut, 
  ShieldAlert, 
  MapPin, 
  Check, 
  MessageSquare, 
  CheckCircle2, 
  User as UserIcon,
  List,
  PlusCircle,
  QrCode,
  Sun,
  Moon,
  X
} from 'lucide-react';
import { Profile, AppNotification } from '../types';

interface NavbarProps {
  currentUser: Profile | null;
  notifications: AppNotification[];
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  onClearAllNotifications: () => void;
  onOpenSafeZones: () => void;
  onOpenQRTag: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function Navbar({
  currentUser,
  notifications,
  onLogout,
  activeTab,
  setActiveTab,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onClearAllNotifications,
  onOpenSafeZones,
  onOpenQRTag,
  darkMode,
  onToggleDarkMode,
}: NavbarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const unreadNotifications = notifications.filter(n => !n.isRead);

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="w-4 h-4 text-emerald-500" />;
      case 'claim':
        return <ShieldAlert className="w-4 h-4 text-amber-500" />;
      case 'claim_update':
        return <CheckCircle2 className="w-4 h-4 text-sky-500" />;
      case 'item_match':
        return <MapPin className="w-4 h-4 text-rose-500" />;
      default:
        return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 navbar-container" id="lostlink-navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <div 
              className="flex items-center gap-2 cursor-pointer" 
              onClick={() => setActiveTab('feed')}
              id="lostlink-logo"
            >
              <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center font-bold text-white text-base">
                <svg className="w-5 h-5 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path>
                </svg>
              </div>
              <div>
                <span className="font-bold text-slate-800 font-sans tracking-tight block text-lg leading-none">
                  LostLink
                </span>
                <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 hidden sm:block">
                  CAMPUS NETWORK
                </span>
              </div>
            </div>
 
            {/* Navigation Tabs */}
            {currentUser && (
              <div className="hidden md:flex h-16 space-x-6 items-center" id="nav-tabs">
                <button
                  onClick={() => setActiveTab('feed')}
                  className={`h-16 px-1 flex items-center border-b-2 text-sm font-medium transition-all ${
                    activeTab === 'feed'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-600 hover:text-indigo-600'
                  }`}
                  id="tab-search-feed"
                >
                  Explore Items
                </button>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`h-16 px-1 flex items-center border-b-2 text-sm font-medium transition-all ${
                    activeTab === 'dashboard'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-600 hover:text-indigo-600'
                  }`}
                  id="tab-my-dashboard"
                >
                  My Dashboard
                </button>
                <button
                  onClick={() => setActiveTab('messages')}
                  className={`h-16 px-1 flex items-center border-b-2 text-sm font-medium transition-all ${
                    activeTab === 'messages'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-600 hover:text-indigo-600'
                  }`}
                  id="tab-inbox"
                >
                  Messages
                  {unreadNotifications.length > 0 && (
                    <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 text-[9px] font-bold bg-amber-500 text-white rounded-full">
                      {unreadNotifications.length}
                    </span>
                  )}
                </button>
                {currentUser.isAdmin && (
                  <button
                    onClick={() => setActiveTab('admin')}
                    className={`h-16 px-1 flex items-center border-b-2 text-sm font-medium transition-all ${
                      activeTab === 'admin'
                        ? 'border-rose-500 text-rose-600'
                        : 'border-transparent text-slate-600 hover:text-rose-600'
                    }`}
                    id="tab-admin"
                  >
                    Admin Center
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Action Tools/Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-4">
            {currentUser ? (
              <>
                {/* Safe Zones Utilities */}
                <button 
                  onClick={onOpenSafeZones}
                  className="hidden md:flex p-1 px-1.5 sm:px-3 text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-full items-center gap-1 transition-colors border border-slate-200"
                  title="Campus Safe Zones for physical item exchange"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Safe Zones</span>
                </button>

                {/* QR Generation Option */}
                <button
                  onClick={onOpenQRTag}
                  className="hidden md:flex p-1 px-1.5 sm:px-3 text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-full items-center gap-1 transition-colors border border-slate-200"
                  title="Generate dynamic recovery QR tag"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">QR Tag</span>
                </button>

                {/* Theme Toggle Button */}
                <button
                  onClick={onToggleDarkMode}
                  className="hidden md:flex p-2 text-slate-600 hover:text-slate-900 rounded-full transition-colors items-center justify-center border border-transparent hover:border-slate-200"
                  title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                  id="theme-toggle-button"
                >
                  {darkMode ? (
                    <Sun className="w-4.5 h-4.5 text-amber-500 animate-pulse" />
                  ) : (
                    <Moon className="w-4.5 h-4.5 text-indigo-500" />
                  )}
                </button>

                {/* Notifications Engine */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors relative"
                    id="notif-bell-button"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadNotifications.length > 0 && (
                      <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                        {unreadNotifications.length}
                      </span>
                    )}
                  </button>

                  {/* Notifications Popover */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                        <span className="font-semibold text-sm text-slate-900">Notifications</span>
                        {unreadNotifications.length > 0 && (
                          <button
                            onClick={() => {
                              onMarkAllNotificationsRead();
                            }}
                            className="text-xs text-indigo-600 hover:underline flex items-center gap-1 font-medium"
                          >
                            <Check className="w-3.5 h-3.5" /> Mark all read
                          </button>
                        )}
                        <button
                          onClick={() => {
                            onClearAllNotifications();
                            setShowNotifications(false);
                          }}
                          className="text-xs text-rose-600 hover:underline flex items-center gap-1 font-medium ml-3"
                        >
                          <X className="w-3.5 h-3.5" /> Clear All
                        </button>
                      </div>
                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 text-sm">
                            No notifications yet.
                          </div>
                        ) : (
                          [...notifications].reverse().map(notif => (
                            <div 
                              key={notif.id} 
                              className={`p-3 text-xs transition-colors hover:bg-slate-50 cursor-pointer ${
                                !notif.isRead ? 'bg-slate-50/50 font-medium' : ''
                              }`}
                              onClick={() => {
                                onMarkNotificationRead(notif.id);
                                if (notif.itemId) {
                                  setActiveTab('feed');
                                }
                                setShowNotifications(false);
                              }}
                            >
                              <div className="flex gap-2.5 items-start">
                                <div className="p-1.5 bg-white rounded-md border border-slate-100 shrink-0">
                                  {getNotifIcon(notif.type)}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="font-semibold text-slate-950 block">{notif.title}</span>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <p className="text-slate-400 mt-1 leading-relaxed">{notif.content}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Authenticated Avatar/Details with Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className="flex items-center gap-1.5 sm:gap-2.5 border-l border-slate-100 pl-1.5 sm:pl-4 focus:outline-hidden"
                    id="profile-dropdown-trigger"
                  >
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.fullName}
                      className="w-8 h-8 rounded-full border border-slate-200 hover:opacity-85 transition-opacity"
                    />
                    <div className="hidden lg:block text-left">
                      <span className="text-xs font-semibold text-slate-900 block leading-tight">
                        {currentUser.fullName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        {currentUser.isAdmin ? 'ADMIN ACCOUNT' : 'STUDENT/USER'}
                      </span>
                    </div>
                  </button>

                  {showProfileDropdown && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-left">
                      <div className="p-3 bg-slate-50 border-b border-slate-100">
                        <strong className="text-xs font-semibold text-slate-900 block leading-tight">{currentUser.fullName}</strong>
                        <span className="text-[9px] text-slate-400 font-mono block mt-0.5">{currentUser.email}</span>
                        <span className="text-[8px] bg-indigo-50 border border-indigo-100 text-indigo-700 font-mono px-1 rounded-sm uppercase mt-1 inline-block font-bold">
                          {currentUser.isAdmin ? 'ADMINISTRATOR' : 'STUDENT'}
                        </span>
                      </div>
                      
                      <div className="p-1.5 space-y-0.5">
                        {/* Mobile-only tools inside dropdown */}
                        <button
                          onClick={() => {
                            onOpenSafeZones();
                            setShowProfileDropdown(false);
                          }}
                          className="md:hidden w-full px-2.5 py-1.5 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-2 transition-colors"
                        >
                          <MapPin className="w-3.5 h-3.5 text-slate-400" /> Safe Exchange Zones
                        </button>

                        <button
                          onClick={() => {
                            onOpenQRTag();
                            setShowProfileDropdown(false);
                          }}
                          className="md:hidden w-full px-2.5 py-1.5 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-2 transition-colors"
                        >
                          <QrCode className="w-3.5 h-3.5 text-slate-400" /> Generate QR Tag
                        </button>

                        <button
                          onClick={() => {
                            onToggleDarkMode();
                            setShowProfileDropdown(false);
                          }}
                          className="md:hidden w-full px-2.5 py-1.5 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-2 transition-colors"
                        >
                          {darkMode ? (
                            <span className="flex items-center gap-2">
                              <Sun className="w-3.5 h-3.5 text-amber-500" /> Switch to Light Mode
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <Moon className="w-3.5 h-3.5 text-indigo-500" /> Switch to Dark Mode
                            </span>
                          )}
                        </button>

                        <div className="md:hidden border-t border-slate-50 my-1"></div>

                        <button
                          onClick={() => {
                            onLogout();
                            setShowProfileDropdown(false);
                          }}
                          className="w-full px-2.5 py-1.5 hover:bg-rose-50 text-red-650 hover:text-red-700 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5" /> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-xs font-mono text-slate-500">
                Authentication Required
              </div>
            )}
          </div>
        </div>

        {/* Mobile Bottom Navigation Bar */}
        {currentUser && (
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 flex justify-around py-2 px-2 border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] dark:shadow-none pb-[env(safe-area-inset-bottom)]">
            <button
              onClick={() => setActiveTab('feed')}
              className={`flex flex-col items-center p-1 px-3 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'feed' ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/50 dark:bg-indigo-900/30' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <List className="w-4 h-4 mb-0.5" />
              <span>Explore</span>
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col items-center p-1 px-3 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'dashboard' ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/50 dark:bg-indigo-900/30' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <PlusCircle className="w-4 h-4 mb-0.5" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`flex flex-col items-center p-1 px-3 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'messages' ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/50 dark:bg-indigo-900/30' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <MessageSquare className="w-4 h-4 mb-0.5" />
              <span>Chats</span>
            </button>
            {currentUser.isAdmin && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex flex-col items-center p-1 px-3 text-xs font-medium rounded-lg transition-colors ${
                  activeTab === 'admin' ? 'text-rose-600 dark:text-rose-400 font-bold bg-rose-50/50 dark:bg-rose-900/30' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <ShieldAlert className="w-4 h-4 mb-0.5" />
                <span>Admin</span>
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
