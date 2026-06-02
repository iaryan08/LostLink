"use client";

import { ReactNode } from "react";
import { ShieldAlert, TrendingUp, X } from "lucide-react";
import { useAppContext } from "./providers";
import Navbar from "../components/Navbar";
import NewItemModal from "../components/NewItemModal";
import ClaimModal from "../components/ClaimModal";
import ReportModal from "../components/ReportModal";
import SafeZonesModal from "../components/SafeZonesModal";
import QRTagModal from "../components/QRTagModal";

interface ClientLayoutProps {
  children: ReactNode;
}

const SESSION_LOADING_TEXT = "Establishing session...";

export default function ClientLayout({ children }: ClientLayoutProps) {
  const {
    authToken,
    currentUser,
    loading,
    authInitialized,
    notifications,
    handleLogout,
    activeTab,
    setActiveTab,
    handleNotificationRead,
    handleNotificationsAllRead,
    handleClearAllNotifications,
    showNewItemModal,
    setShowNewItemModal,
    showSafeZonesModal,
    setShowSafeZonesModal,
    showQRTagModal,
    setShowQRTagModal,
    claimingItemId,
    setClaimingItemId,
    reportingClaimId,
    setReportingClaimId,
    reportingItemId,
    setReportingItemId,
    darkMode,
    setDarkMode,
    authMode,
    setAuthMode,
    authEmail,
    setAuthEmail,
    authPassword,
    setAuthPassword,
    authFullName,
    setAuthFullName,
    authGender,
    setAuthGender,
    authError,
    handleAuthSubmit,
    triggerQuickLogin,
    items,
    claims,
    safeZones,
    handleCreateItem,
    handleClaimSubmit,
    handleReportClaimSubmit,
  } = useAppContext();

  // Show full loading spinner until token has been read from localStorage
  if (!authInitialized) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <span className="text-xs font-mono text-slate-400 mt-3">{SESSION_LOADING_TEXT}</span>
      </div>
    );
  }

  // Render loading state while recovering user session
  if (loading && authToken && !currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <span className="text-xs font-mono text-slate-400 mt-3">{SESSION_LOADING_TEXT}</span>
      </div>
    );
  }

  // Render Authentication Entry Wall
  if (!authToken || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between" id="entry-wall-main">
        <div className="flex-1 flex flex-col md:flex-row items-center justify-center max-w-7xl mx-auto px-4 gap-12 py-16">
          
          {/* Brand/Product Philosophy Pitch */}
          <div className="max-w-md text-left space-y-5 hidden md:block" id="entry-pitch">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-white text-xl tracking-wider shadow-sm">
                L
              </div>
              <div>
                <span className="font-extrabold text-slate-900 font-sans tracking-tight block text-xl">
                  LostLink
                </span>
                <span className="text-xs font-mono text-indigo-600 font-semibold uppercase tracking-wider">
                  Campus Finder Network
                </span>
              </div>
            </div>

            <h1 className="text-3xl font-extrabold text-slate-950 font-sans tracking-tight leading-tight">
              Reclaim what is Yours. Return what is Found.
            </h1>
            
            <p className="text-xs text-slate-500 leading-relaxed font-sans">
              Designed as a premium, low-friction, high-integrity platform for campuses and students to track keys, mobile phones, portfolios, and books securely.
            </p>

            {/* Platform benefits list */}
            <div className="space-y-2.5 pt-2">
              {[
                { label: 'Shielded Handovers', desc: 'Secure 1-to-1 chat system avoids exposing your private phone numbers or personal emails.' },
                { label: 'Knowledge-Verification claims', desc: 'Owners answer specific verification questions (e.g. wallpapers, wallet contents) before physical handover.' },
                { label: 'Platform Moderation Integrity', desc: 'Report suspicious claim tools alert administrators instantly against spam.' },
                { label: 'Campus Safe Zone Maps', desc: 'Pre-vetted location tags highlight monitors, security desks and guards for safe transfer.' }
              ].map((benefit, idx) => (
                <div key={idx} className="flex gap-2 items-start text-xs text-slate-600">
                  <span className="p-0.5 mt-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
                    ✓
                  </span>
                  <div>
                    <strong className="text-slate-900 block font-semibold">{benefit.label}</strong>
                    <span className="text-slate-500 font-sans">{benefit.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Login/Signup forms Block */}
          <div className="w-full max-w-sm" id="auth-forms-card">
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100/60 block text-left">
              {/* Brand Header for Mobile only */}
              <div className="flex items-center gap-2 mb-6 md:hidden">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white text-sm tracking-wider shadow-sm">
                  L
                </div>
                <div>
                  <span className="font-extrabold text-slate-900 font-sans tracking-tight block text-sm">
                    LostLink
                  </span>
                  <span className="text-[9px] font-mono text-indigo-600 font-semibold uppercase tracking-wider block -mt-0.5">
                    Campus Finder Network
                  </span>
                </div>
              </div>

              <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase block mb-1">
                MEMBERS PORTAL
              </span>
              <h2 className="text-xl font-bold font-sans text-slate-950 tracking-tight mb-4">
                {authMode === 'login' ? 'Welcome Back Student' : 'Create Student Profile'}
              </h2>

              {authError && (
                <div className="p-3 mb-4 bg-red-50 text-red-700 border border-red-100 rounded-lg text-xs font-semibold">
                  {authError}
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-4" id="main-auth-form">
                {authMode === 'register' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider mb-1 font-mono">
                        Full Legal Name
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
                        placeholder="e.g. John Doe"
                        value={authFullName}
                        onChange={(e) => setAuthFullName(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider mb-1 font-mono">
                        Gender Selection
                      </label>
                      <select
                        className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
                        value={authGender}
                        onChange={(e) => setAuthGender(e.target.value)}
                        required
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider mb-1 font-mono">
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
                    placeholder="e.g. info@domain.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider mb-1 font-mono">
                    Password
                  </label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
                    placeholder="••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-all shadow-sm"
                >
                  {authMode === 'login' ? 'ACCESS PORTAL' : 'ESTABLISH PASSPORT'}
                </button>
              </form>

              {/* Mode Toggle Button */}
              <div className="mt-4 pt-4 border-t border-slate-50 text-center">
                <button
                  onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                  className="text-xs text-indigo-600 hover:underline font-semibold"
                  id="toggle-auth-mode"
                >
                  {authMode === 'login' ? 'New student? Setup account' : 'Already registered? Login'}
                </button>
              </div>

              {/* Exam & Viva Fast-Logins Bypass Options */}
              <div className="mt-5 pt-4 border-t border-slate-100">
                <span className="text-[9px] font-mono font-bold text-slate-400 block mb-2 uppercase text-center">
                  VIVA/EXAMINER CHROME BYPASS
                </span>
                <div className="grid grid-cols-3 gap-1.5" id="viva-login-shortcuts">
                  <button
                    onClick={() => triggerQuickLogin('john@example.com')}
                    className="p-1.5 text-[10px] bg-slate-50 hover:bg-slate-100 rounded-md border border-slate-200 font-bold text-slate-700 text-center truncate"
                    title="Login as John Doe"
                  >
                    John (User)
                  </button>
                  <button
                    onClick={() => triggerQuickLogin('jane@example.com')}
                    className="p-1.5 text-[10px] bg-slate-50 hover:bg-slate-100 rounded-md border border-slate-200 font-bold text-slate-700 text-center truncate"
                    title="Login as Jane Smith"
                  >
                    Jane (User)
                  </button>
                  <button
                    onClick={() => triggerQuickLogin('admin@example.com')}
                    className="p-1.5 text-[10px] bg-rose-50 hover:bg-rose-100 rounded-md border border-rose-200 font-bold text-rose-800 text-center truncate"
                    title="Login as System Moderator Admin"
                  >
                    Professor
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Outer legal footer */}
        <footer className="py-4 border-t border-slate-100 bg-white text-center text-[10px] text-slate-400 font-mono">
          LOSTLINK APPLET • DESIGNED FOR ACADEMIC DIPLOMA DISSERTATION EVALUATIONS • SECURED SANDBOX
        </footer>
      </div>
    );
  }

  // Render Core Application Workspace
  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col justify-between" id="applet-core-shell">
      
      {/* Primary Top Bar */}
      <Navbar
        currentUser={currentUser}
        notifications={notifications}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onMarkNotificationRead={handleNotificationRead}
        onMarkAllNotificationsRead={handleNotificationsAllRead}
        onClearAllNotifications={handleClearAllNotifications}
        onOpenSafeZones={() => setShowSafeZonesModal(true)}
        onOpenQRTag={() => setShowQRTagModal(true)}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full" id="main-content-canvas">
        {/* Loader Screen */}
        {loading && (
          <div className="p-12 text-center text-slate-400 text-sm font-semibold font-mono flex items-center justify-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-slate-800 border-t-transparent animate-spin"></div>
            <span>Synchronizing Database...</span>
          </div>
        )}

        {children}
      </main>

      {/* FLOATING DIALOG MODALS LIST */}
      {showNewItemModal && (
        <NewItemModal
          onClose={() => setShowNewItemModal(false)}
          onSubmit={handleCreateItem}
        />
      )}

      {showSafeZonesModal && (
        <SafeZonesModal
          onClose={() => setShowSafeZonesModal(false)}
          safeZones={safeZones}
        />
      )}

      {showQRTagModal && (
        <QRTagModal
          onClose={() => setShowQRTagModal(false)}
          userEmail={currentUser.email}
        />
      )}

      {claimingItemId && (
        <ClaimModal
          item={items.find(i => i.id === claimingItemId)!}
          onClose={() => setClaimingItemId(null)}
          onSubmit={handleClaimSubmit}
        />
      )}

      {reportingClaimId && reportingItemId && (
        <ReportModal
          claimId={reportingClaimId}
          itemId={reportingItemId}
          onClose={() => {
            setReportingClaimId(null);
            setReportingItemId(null);
          }}
          onSubmit={handleReportClaimSubmit}
        />
      )}

      {/* Integrated Page Footer with Safety Warnings and Navigation */}
      <footer className="py-6 border-t border-slate-100 bg-slate-50 text-[11px] text-slate-400 font-sans text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          {/* Warning and Links Row */}
          <div className="flex items-start gap-2">
            <ShieldAlert className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span>
              <strong className="font-semibold text-slate-600">Avoid False Claims:</strong> Submit specific questionnaires representing genuine proof. Suspected claims are reviewed by admins. <span className="text-slate-500 font-semibold">3 flagged claims in a month will result in permanent account suspension.</span>
            </span>
          </div>

          {/* Copyright/Branding */}
          <div className="text-[10px] text-slate-400 font-mono border-t border-slate-200/40 pt-3 flex justify-between items-center">
            <span>© 2026 LostLink. Campus Valuables Network.</span>
            <span>v2.1</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
