import React from 'react';
import { 
  MapPin, 
  Calendar, 
  Tag, 
  TrendingUp, 
  User as UserIcon, 
  AlertTriangle, 
  MessageSquare, 
  Trash2, 
  ShieldCheck, 
  ExternalLink,
  Gift
} from 'lucide-react';
import { Item, Profile, Claim } from '../types';

interface ItemCardProps {
  key?: any;
  item: Item;
  currentUser: Profile | null;
  authors: Profile[];
  claims: Claim[];
  onOpenReply: (receiverId: string, itemId: string) => void;
  onOpenClaim: (itemId: string) => void;
  onDelete: (id: string) => void;
  onResolve: (id: string) => void;
  onOpenMatches: (itemId: string) => void;
  onOpenReport: (claimId: string, itemId: string) => void;
}

export default function ItemCard({
  item,
  currentUser,
  authors,
  claims,
  onOpenReply,
  onOpenClaim,
  onDelete,
  onResolve,
  onOpenMatches,
  onOpenReport
}: ItemCardProps) {
  const isOwner = currentUser?.id === item.userId;
  const authorProfile = authors.find(p => p.id === item.userId);
  
  // Find pending claims of other users related to this item (only if current user is owner)
  const itemClaims = claims.filter(c => c.itemId === item.id);
  const pendingClaims = itemClaims.filter(c => c.status === 'pending');

  const getCategoryColor = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'mobile': return 'bg-sky-50 text-sky-700 border-sky-100';
      case 'wallet': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'id card': return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'keys': return 'bg-teal-50 text-teal-700 border-teal-100';
      case 'bag': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'electronics': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'jewellery': return 'bg-rose-50 text-rose-700 border-rose-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const statusLabel = {
    lost: { text: "Missing / Lost", style: "bg-red-50 text-red-700 border-red-100" },
    found: { text: "Safe & Found", style: "bg-emerald-50 text-emerald-700 border-emerald-100" },
    claimed: { text: "Handover Claimed", style: "bg-amber-50 text-amber-700 border-amber-100" },
    resolved: { text: "Resolved / Archived", style: "bg-slate-100 text-slate-500 border-slate-200" }
  }[item.status];

  const formattedDate = new Date(item.dateEvent).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Calculate anonymous display label
  const posterName = item.isAnonymous 
    ? (isOwner ? `${authorProfile?.fullName} (Anonymous Card)` : 'Anonymous Finder')
    : (authorProfile?.fullName || 'Active Student');

  const posterAvatar = item.isAnonymous && !isOwner
    ? `https://api.dicebear.com/7.x/avataaars/svg?seed=AnonymousFinder`
    : (authorProfile?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.userId}`);

  return (
    <div 
      className={`bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between transition-all hover:shadow-md hover:border-slate-200 ${
        item.status === 'resolved' ? 'opacity-85 grayscale-[15%]' : ''
      }`}
      id={`item-card-${item.id}`}
    >
      {/* Visual Header / Type Indicator */}
      <div className="relative">
        <img
          src={item.imageUrl}
          alt={item.title}
          referrerPolicy="no-referrer"
          className="w-full h-44 object-cover"
        />
        
        {/* Type Ribbon */}
        <span className={`absolute top-3 left-3 text-[11px] font-bold font-mono uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm border ${
          item.type === 'lost' 
            ? 'bg-red-500 text-white border-red-400' 
            : 'bg-emerald-500 text-white border-emerald-400'
        }`}>
          {item.type}
        </span>

        {/* Reward Card, only if Lost & reward exists */}
        {item.type === 'lost' && item.reward && (
          <span className="absolute bottom-3 right-3 bg-white text-slate-900 border border-slate-100 shadow-sm text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1">
            <Gift className="w-3.5 h-3.5 text-amber-500" />
            Reward: {item.reward}
          </span>
        )}
      </div>

      {/* Description & metadata body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Tags & Badges */}
          <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
            <span className={`text-[10px] font-bold tracking-tight px-2 py-0.5 rounded-full border ${getCategoryColor(item.category)}`}>
              <Tag className="w-2.5 h-2.5 inline-block mr-1 align-middle" />
              {item.category}
            </span>
            <span className={`text-[10px] font-semibold tracking-tight px-2 py-0.5 rounded-full border ${statusLabel.style}`}>
              {statusLabel.text}
            </span>
            {item.isAnonymous && (
              <span className="text-[10px] font-semibold bg-gray-50 border border-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                Anonymous Mode
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-bold text-slate-950 font-sans tracking-tight text-base mb-1.5 leading-snug line-clamp-1">
            {item.title}
          </h3>

          {/* Location & Date block */}
          <div className="flex flex-col gap-1 text-xs text-slate-500 font-mono mb-3">
            <span className="flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              Location: <strong className="text-slate-700">{item.location}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              Date Event: <strong className="text-slate-700">{formattedDate}</strong>
            </span>
          </div>

          {/* Description text */}
          <p className="text-slate-400 font-sans text-xs leading-relaxed mb-4 line-clamp-3">
            {item.description}
          </p>
        </div>

        {/* Profile attribution section */}
        <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={posterAvatar}
              className="w-6 h-6 rounded-full @theme font-sans border border-slate-200"
              alt={posterName}
            />
            <div className="text-left">
              <span className="text-[10px] text-slate-400 block font-mono">POSTED BY</span>
              <span className="text-[11px] font-bold text-slate-700 block leading-tight">
                {posterName}
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div className="p-4 pt-0 bg-slate-50/50 border-t border-slate-100 flex flex-col gap-2">
        {isOwner ? (
          /* OWNER SUITE */
          <div className="flex items-center justify-between gap-1.5 mt-3">
            <div className="flex items-center gap-1">
              <button
                onClick={() => onOpenMatches(item.id)}
                className="p-1 px-3 text-xs bg-slate-900 text-white rounded-md font-medium hover:bg-slate-800 transition-colors flex items-center gap-1"
                title="Search matched posts in our campus database"
                id={`btn-match-${item.id}`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Possible Matches</span>
              </button>
              
              {item.status !== 'resolved' && (
                <button
                  onClick={() => onResolve(item.id)}
                  className="p-1 px-3 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-md font-medium transition-colors flex items-center gap-1"
                  title="Mark status as solved and move to resolved archive"
                  id={`btn-resolve-${item.id}`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Mark Resolved</span>
                </button>
              )}
            </div>

            <button
              onClick={() => onDelete(item.id)}
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              title="Delete post permanently"
              id={`btn-delete-${item.id}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          /* PUBLIC VISITOR SUITE */
          <div className="flex items-center gap-1.5 mt-3">
            {item.status !== 'resolved' && (
              <>
                <button
                  onClick={() => onOpenClaim(item.id)}
                  className={`flex-1 py-1.5 font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 text-white ${
                    item.type === 'lost'
                      ? 'bg-indigo-600 hover:bg-indigo-700'
                      : 'bg-emerald-500 hover:bg-emerald-600'
                  }`}
                  id={`btn-claim-${item.id}`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{item.type === 'lost' ? "Found This?" : "This is Mine"}</span>
                </button>

                <button
                  onClick={() => onOpenReply(item.userId, item.id)}
                  className="p-1.5 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold"
                  title="Chat securely about item location"
                  id={`btn-chat-${item.id}`}
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              </>
            )}

            {currentUser?.isAdmin && (
              <button
                onClick={() => onDelete(item.id)}
                className="p-1.5 px-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-md text-xs font-medium flex items-center gap-1"
                id={`btn-admin-del-${item.id}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Mod Delete</span>
              </button>
            )}
          </div>
        )}

        {/* Claim Review Warning Box for Item Owners & Admins */}
        {isOwner && pendingClaims.length > 0 && (
          <div className="mt-2 p-2 bg-amber-50 rounded-lg border border-amber-100 flex flex-col gap-1.5 text-[11px] text-amber-900">
            <div className="flex items-start gap-1 font-bold">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <span>{pendingClaims.length} Pending Claim request(s) waiting!</span>
            </div>
            <p className="text-[10px] text-amber-600">
              Check Dashboard to verify claimant wallpapers/wallet colors safely.
            </p>
            {/* Quick report suspicious claim for safety moderation */}
            <div className="flex justify-end gap-1.5 mt-0.5">
              <button
                onClick={() => onOpenReport(pendingClaims[0].id, item.id)}
                className="text-[10px] font-bold text-red-600 hover:underline flex items-center gap-0.5"
              >
                <AlertTriangle className="w-3 h-3 text-red-500" />
                Report Suspicious Claim
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
