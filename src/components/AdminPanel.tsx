import { useState } from 'react';
import { 
  Users, 
  Trash2, 
  UserX, 
  UserCheck, 
  AlertOctagon, 
  ShieldAlert, 
  Database,
  Check
} from 'lucide-react';
import { Profile, Report, Item } from '../types';

interface AdminPanelProps {
  profiles: Profile[];
  reports: Report[];
  items: Item[];
  onToggleUserBan: (userId: string, currentBanState: boolean) => void;
  onAdminDeletePost: (itemId: string) => void;
  onDismissReport: (reportId: string) => void;
}

export default function AdminPanel({
  profiles,
  reports,
  items,
  onToggleUserBan,
  onAdminDeletePost,
  onDismissReport
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'reports' | 'posts'>('users');

  const stats = {
    users: profiles.length,
    activeItems: items.filter(i => i.status !== 'resolved').length,
    resolved: items.filter(i => i.status === 'resolved').length,
    reportsCount: reports.length
  };

  return (
    <div className="space-y-6 text-left" id="admin-center-container">
      {/* Overview stats header row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="stats-grids">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
          <span className="text-[10px] text-slate-400 font-mono font-semibold uppercase block">Total Accounts</span>
          <div className="flex items-center gap-2 mt-1">
            <Users className="w-5 h-5 text-slate-400" />
            <strong className="text-xl font-bold font-mono text-slate-900">{stats.users}</strong>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
          <span className="text-[10px] text-slate-400 font-mono font-semibold uppercase block">Active Bulletins</span>
          <div className="flex items-center gap-2 mt-1">
            <Database className="w-5 h-5 text-indigo-500" />
            <strong className="text-xl font-bold font-mono text-slate-900">{stats.activeItems}</strong>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
          <span className="text-[10px] text-slate-400 font-mono font-semibold uppercase block">Resolved Handovers</span>
          <div className="flex items-center gap-2 mt-1">
            <Check className="w-5 h-5 text-emerald-500 border border-emerald-200 rounded-full" />
            <strong className="text-xl font-bold font-mono text-slate-900">{stats.resolved}</strong>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
          <span className="text-[10px] text-slate-400 font-mono font-semibold uppercase block">Suspicious Flags</span>
          <div className="flex items-center gap-2 mt-1">
            <AlertOctagon className="w-5 h-5 text-red-500 animate-pulse" />
            <strong className="text-xl font-bold font-mono text-red-600">{stats.reportsCount}</strong>
          </div>
        </div>
      </div>

      {/* Main workspace section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden min-h-[400px]" id="admin-workspace-card">
        {/* Navigation Admin Switcher */}
        <div className="border-b border-slate-200 bg-slate-50 p-2.5 flex items-center justify-between">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'users' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/50'
              }`}
            >
              Registered Students({profiles.length})
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'reports' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/50'
              }`}
            >
              Flags Queue({reports.length})
            </button>
            <button
              onClick={() => setActiveTab('posts')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'posts' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/50'
              }`}
            >
              All Bulletins({items.length})
            </button>
          </div>
          <span className="text-[10px] font-mono text-slate-400 select-none hidden sm:inline">
            SECURE CAMPUS MODERATION ROOM
          </span>
        </div>

        {/* Tab displays */}
        <div className="p-4" id="admin-tab-content">
          {/* USER MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-500">
                <thead className="bg-slate-50 text-slate-700 font-mono uppercase text-[10px] tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="p-3">Avatar/Name</th>
                    <th className="p-3">Email Address</th>
                    <th className="p-3">Created Date</th>
                    <th className="p-3">System Access</th>
                    <th className="p-3 text-right">Moderation action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {profiles.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="p-3 flex items-center gap-2.5">
                        <img src={p.avatarUrl} alt={p.fullName} className="w-7 h-7 rounded-full border border-slate-200" />
                        <div>
                          <strong className="text-slate-900 font-sans block font-semibold">{p.fullName}</strong>
                          <span className="text-[9px] font-mono block text-indigo-500">
                            {p.isAdmin ? "SYSTEM ADMINISTRATOR" : `ID: ${p.id}`}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 font-mono">{p.email}</td>
                      <td className="p-3">{new Date(p.createdAt || Date.now()).toLocaleDateString()}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full font-bold font-mono text-[9px] border ${
                          p.isBanned 
                            ? 'bg-red-50 text-red-700 border-red-100' 
                            : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        }`}>
                          {p.isBanned ? 'SUSPENDED/BANNED' : 'ACTIVE ACCESS'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {p.isAdmin ? (
                          <span className="text-[10px] text-slate-400 font-mono">Protected Admin</span>
                        ) : (
                          <button
                            onClick={() => onToggleUserBan(p.id, !!p.isBanned)}
                            className={`px-3 py-1 rounded-md font-bold text-[11px] transition-all ${
                              p.isBanned
                                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                                : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                            }`}
                          >
                            {p.isBanned ? 'Activate user' : 'Ban Account'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* SUSPICIOUS FLAG REPORTS QUEUE */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              {reports.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  Aura Clear: No active suspicious claim flags reported yet.
                </div>
              ) : (
                reports.map(rep => {
                  const targetItem = items.find(i => i.id === rep.itemId);
                  const reporter = profiles.find(p => p.id === rep.reporterId);

                  return (
                    <div 
                      key={rep.id} 
                      className="p-4 bg-red-50/40 rounded-xl border border-red-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-3"
                    >
                      <div className="space-y-1">
                        <strong className="text-xs text-red-900 font-bold block flex items-center gap-1">
                          <ShieldAlert className="w-4 h-4 text-red-500" />
                          Suspicious claim flagged under item: "{targetItem?.title || 'Unknown valuable'}"
                        </strong>
                        <p className="text-xs text-slate-700 italic">
                          Reason: "{rep.reason}"
                        </p>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Flagged by claimant reporter: <strong>{reporter?.fullName || 'Active Student'}</strong> • {new Date(rep.createdAt).toLocaleString()}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {targetItem && (
                          <button
                            onClick={() => onAdminDeletePost(targetItem.id)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Purge spam post
                          </button>
                        )}
                        <button
                          onClick={() => onDismissReport(rep.id)}
                          className="px-3 py-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold"
                        >
                          Dismiss Flag
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* BULLETINS MANAGE LIST */}
          {activeTab === 'posts' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-500">
                <thead className="bg-slate-50 text-slate-700 font-mono uppercase text-[10px] border-b border-slate-100">
                  <tr>
                    <th className="p-3">Bulletin Card</th>
                    <th className="p-3">Poster Account</th>
                    <th className="p-3 font-mono">Status Type</th>
                    <th className="p-3">Reported location</th>
                    <th className="p-3 text-right">Delete Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map(item => {
                    const poster = profiles.find(p => p.id === item.userId);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <img src={item.imageUrl} alt={item.title} className="w-9 h-9 rounded-md object-cover" />
                            <div>
                              <strong className="text-slate-900 block font-semibold">{item.title}</strong>
                              <span className="text-[10px] block text-slate-400">{item.category}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 font-serif">
                          {item.isAnonymous ? 'Anonymous Mode' : (poster?.fullName || 'Active Student')}
                        </td>
                        <td className="p-3 font-mono">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold text-white ${
                            item.type === 'lost' ? 'bg-red-400' : 'bg-emerald-400'
                          }`}>
                            {item.type}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-slate-700">{item.location}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => onAdminDeletePost(item.id)}
                            className="p-1 px-2.5 bg-red-50 hover:bg-red-150 text-red-600 rounded-md text-xs font-bold transition-all"
                            id={`admin-btn-del-${item.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
