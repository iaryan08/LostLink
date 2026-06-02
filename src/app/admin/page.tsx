"use client";

import { ShieldAlert } from "lucide-react";
import { useAppContext } from "../providers";
import AdminPanel from "../../components/AdminPanel";

export default function AdminPage() {
  const {
    currentUser,
    profiles,
    reports,
    items,
    handleToggleUserBan,
    handleDeleteItem,
    handleDismissReport,
  } = useAppContext();

  if (!currentUser) return null;

  if (!currentUser.isAdmin) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-slate-100 max-w-md mx-auto my-12 block space-y-4">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-950">Access Denied</h2>
        <p className="text-xs text-slate-500">
          This administration center is locked to Professor/Moderator privilege levels only.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 block text-left" id="admin-dashboard-tab-view">
      <div>
        <h2 className="text-xl font-bold font-sans text-slate-950 tracking-tight text-rose-600 flex items-center gap-1.5">
          <ShieldAlert className="w-5 h-5 text-rose-500 animate-pulse" />
          Moderator Administration Office
        </h2>
        <p className="text-xs text-slate-500">
          Inspect suspicious users, manage claim flags reports queue, and audit active bulletins list safely.
        </p>
      </div>

      <AdminPanel
        profiles={profiles}
        reports={reports}
        items={items}
        onToggleUserBan={handleToggleUserBan}
        onAdminDeletePost={handleDeleteItem}
        onDismissReport={handleDismissReport}
      />
    </div>
  );
}
