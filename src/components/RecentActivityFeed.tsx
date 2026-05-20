import { Search, Compass, MapPin, Calendar, Clock, Sparkles } from 'lucide-react';
import { Item, Profile } from '../types';

interface RecentActivityFeedProps {
  items: Item[];
  profiles: Profile[];
  onSelectItem: (itemId: string) => void;
}

export default function RecentActivityFeed({ items, profiles, onSelectItem }: RecentActivityFeedProps) {
  // Get 5 to 10 most recent lost & found item posts
  const recentItems = [...items]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  const getAuthorName = (item: Item) => {
    if (item.isAnonymous) return 'Anonymous';
    const profile = profiles.find(p => p.id === item.userId);
    return profile ? profile.fullName : 'Student Finder';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-8 relative overflow-hidden text-left" id="recent-activity-feed-v2">
      {/* Visual background geometric grids to implement the theme */}
      <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-50/20 rounded-bl-full pointer-events-none" />
      <div className="absolute left-1/3 top-[-50px] w-24 h-24 bg-emerald-50/10 rounded-full border border-emerald-50 pointer-events-none" />

      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 animate-pulse">
              <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
              LIVE FEED UPDATING
            </span>
            <span className="text-slate-400 text-xs font-mono">Real-Time Core Logs</span>
          </div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight mt-1 flex items-center gap-2">
            <Compass className="w-5 h-5 text-indigo-600 shrink-0" />
            Recent Valuables Activity Feed
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Instantly view the latest lost and found report broadcasts across college facilities.
          </p>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-center font-mono text-[10px] text-slate-400 font-medium">
          <Clock className="w-3.5 h-3.5 text-slate-300" />
          <span>Last sync: Just now</span>
        </div>
      </div>

      {recentItems.length === 0 ? (
        <div className="py-12 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-sm">
          No items have been registered on the server log database yet.
        </div>
      ) : (
        /* Responsive Horizontal Sliding Grid container */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="recent-item-grid-scoller">
          {recentItems.map((item, index) => {
            const isLost = item.type === 'lost';
            const authorName = getAuthorName(item);
            
            return (
              <div 
                key={item.id}
                onClick={() => onSelectItem(item.id)}
                className="group cursor-pointer bg-slate-50 hover:bg-white rounded-xl border border-slate-200/80 hover:border-indigo-400 p-4 transition-all duration-300 hover:shadow-md flex flex-col justify-between h-[165px] relative overflow-hidden"
                id={`recent-act-item-${item.id}`}
              >
                {/* Visual stagger animation order */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                      isLost 
                        ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                        : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    }`}>
                      {item.type}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      #{item.id.slice(-5).toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors" title={item.title}>
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed" title={item.description}>
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 mt-2">
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span className="flex items-center gap-1 truncate max-w-[55%]">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{item.location}</span>
                    </span>
                    <span className="text-slate-400 truncate max-w-[42%] text-right">
                      by {authorName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-300" />
                      <span>{new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                    </span>
                    <span className="text-indigo-600 font-bold group-hover:underline">View details →</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
