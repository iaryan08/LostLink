import { useState, useMemo, FormEvent } from 'react';
import { 
  Send, 
  UserCheck, 
  Lock, 
  Unlock, 
  MessageCircle,
  ShieldAlert,
  MapPin,
  Megaphone
} from 'lucide-react';
import { Message, Profile, Item } from '../types';

interface MessageInboxProps {
  currentUser: Profile | null;
  messages: Message[];
  items: Item[];
  profiles: Profile[];
  onSendMessage: (receiverId: string, itemId: string, text: string) => void;
  selectedItemId?: string;
  selectedPartnerId?: string;
}

export default function MessageInbox({
  currentUser,
  messages,
  items,
  profiles,
  onSendMessage,
  selectedItemId,
  selectedPartnerId
}: MessageInboxProps) {
  const [activeThreadKey, setActiveThreadKey] = useState<string | null>(() => {
    if (selectedItemId && selectedPartnerId) {
      return `${selectedItemId}_${selectedPartnerId}`;
    }
    return null;
  });
  
  const [typedMessage, setTypedMessage] = useState('');
  const [revealedThreads, setRevealedThreads] = useState<Record<string, boolean>>({});

  // Group messages into distinct coversations/threads
  // Key = itemId_partnerId (where partnerId is the user who is NOT currentUser)
  const threads = useMemo(() => {
    if (!currentUser) return [];

    const groups: Record<string, { 
      itemId: string; 
      partnerId: string; 
      messages: Message[];
      lastMessage: Message;
    }> = {};

    messages.forEach(msg => {
      const isSender = msg.senderId === currentUser.id;
      const partnerId = isSender ? msg.receiverId : msg.senderId;
      const key = `${msg.itemId}_${partnerId}`;

      if (!groups[key]) {
        groups[key] = {
          itemId: msg.itemId,
          partnerId,
          messages: [],
          lastMessage: msg
        };
      }

      groups[key].messages.push(msg);
      // Determine latest message
      if (new Date(msg.createdAt) > new Date(groups[key].lastMessage.createdAt)) {
        groups[key].lastMessage = msg;
      }
    });

    // If an item/partner was requested starting out, and thread didn't exist, create temporary slot
    if (selectedItemId && selectedPartnerId && currentUser.id !== selectedPartnerId) {
      const initKey = `${selectedItemId}_${selectedPartnerId}`;
      if (!groups[initKey]) {
        groups[initKey] = {
          itemId: selectedItemId,
          partnerId: selectedPartnerId,
          messages: [],
          lastMessage: {
            id: 'temp_init',
            itemId: selectedItemId,
            senderId: currentUser.id,
            receiverId: selectedPartnerId,
            message: 'No messages exchanged yet.',
            createdAt: new Date().toISOString()
          }
        };
      }
    }

    // Convert to sorted list by latest message time
    return Object.values(groups).sort((a, b) => 
      new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
    );
  }, [messages, currentUser, selectedItemId, selectedPartnerId]);

  // Handle active thread selection automatically when props load
  useMemo(() => {
    if (selectedItemId && selectedPartnerId) {
      setActiveThreadKey(`${selectedItemId}_${selectedPartnerId}`);
    } else if (threads.length > 0 && !activeThreadKey) {
      const first = threads[0];
      setActiveThreadKey(`${first.itemId}_${first.partnerId}`);
    }
  }, [threads, selectedItemId, selectedPartnerId]);

  const activeThread = useMemo(() => {
    return threads.find(t => `${t.itemId}_${t.partnerId}` === activeThreadKey);
  }, [threads, activeThreadKey]);

  // Handle message send
  const handleSendSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser || !activeThread || !typedMessage.trim()) return;

    onSendMessage(
      activeThread.partnerId,
      activeThread.itemId,
      typedMessage.trim()
    );
    setTypedMessage('');
  };

  const handleToggleReveal = (key: string) => {
    setRevealedThreads(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[500px]" id="message-inbox-workspace">
      {/* Threads list sidebar pane */}
      <div className="md:col-span-4 border-r border-slate-100 flex flex-col justify-between" id="inbox-sidebar">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
            <MessageCircle className="w-5 h-5 text-slate-800" />
            <span>Secure Conversations</span>
          </div>
          <span className="text-[10px] font-mono font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
            {threads.length} CHATS
          </span>
        </div>

        <div className="divide-y divide-slate-50 overflow-y-auto max-h-[540px] flex-1">
          {threads.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No active conversations. View a report to secure-contact users.
            </div>
          ) : (
            threads.map(thread => {
              const item = items.find(i => i.id === thread.itemId);
              const partner = profiles.find(p => p.id === thread.partnerId);
              const key = `${thread.itemId}_${thread.partnerId}`;
              
              // Handle anonymous visibility
              const isAnonymousMode = item?.isAnonymous;
              const isRevealed = revealedThreads[key];
              const displayPartnerName = (isAnonymousMode && !isRevealed)
                ? 'Anonymous Finder'
                : (partner?.fullName || 'Active Student');

              const displayPartnerAvatar = (isAnonymousMode && !isRevealed)
                ? `https://api.dicebear.com/7.x/avataaars/svg?seed=AnonymousFinder`
                : (partner?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${thread.partnerId}`);

              const isActive = activeThreadKey === key;

              return (
                <div
                  key={key}
                  onClick={() => setActiveThreadKey(key)}
                  className={`p-3.5 text-left transition-colors cursor-pointer flex gap-3 items-start relative ${
                    isActive ? 'bg-slate-50' : 'hover:bg-slate-50/50'
                  }`}
                  id={`thread-button-${key}`}
                >
                  <img
                    src={displayPartnerAvatar}
                    alt={displayPartnerName}
                    className="w-9 h-9 rounded-full border border-slate-200"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className="font-bold text-slate-900 text-xs truncate">
                        {displayPartnerName}
                      </h4>
                      <span className="text-[9px] text-slate-400 font-mono">
                        {new Date(thread.lastMessage.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <strong className="text-[11px] text-indigo-600 block line-clamp-1 mb-1 font-sans">
                      ↳ Re: {item?.title || 'Unknown valuable'}
                    </strong>

                    <p className="text-[11px] text-slate-400 truncate leading-snug">
                      {thread.lastMessage.message}
                    </p>
                  </div>

                  {item?.isAnonymous && (
                    <span 
                      className="absolute bottom-2.5 right-2.5" 
                      title="Identity hidden in Anonymous Mode"
                    >
                      {isRevealed ? <Unlock className="w-3.5 h-3.5 text-emerald-500" /> : <Lock className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Active chat window pane */}
      <div className="md:col-span-8 flex flex-col justify-between" id="inbox-chat-window">
        {activeThread ? (
          (() => {
            const item = items.find(i => i.id === activeThread.itemId);
            const partner = profiles.find(p => p.id === activeThread.partnerId);
            const key = `${activeThread.itemId}_${activeThread.partnerId}`;
            const isAnonymousMode = item?.isAnonymous;
            const isRevealed = revealedThreads[key];

            const displayPartnerName = (isAnonymousMode && !isRevealed)
              ? 'Anonymous Finder'
              : (partner?.fullName || 'Student Finder/Owner');

            const displayPartnerAvatar = (isAnonymousMode && !isRevealed)
              ? `https://api.dicebear.com/7.x/avataaars/svg?seed=AnonymousFinder`
              : (partner?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeThread.partnerId}`);

            return (
              <>
                {/* Chat window Header */}
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-left">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={displayPartnerAvatar}
                      alt={displayPartnerName}
                      className="w-10 h-10 rounded-full border border-slate-200"
                    />
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-tight flex items-center gap-1.5">
                        {displayPartnerName}
                        {isAnonymousMode && (
                          <span className="p-0.5 bg-indigo-50 text-indigo-700 text-[9px] font-bold px-1.5 rounded-full font-mono uppercase">
                            {isRevealed ? 'UNLOCKED' : 'ANONYMOUS'}
                          </span>
                        )}
                      </h3>
                      <span className="text-[11px] text-slate-400 block font-mono">
                        Active participant for: <strong className="text-slate-600 underline font-sans">{item?.title}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Anonymous connection handshake trigger */}
                  {isAnonymousMode && (
                    <button
                      type="button"
                      onClick={() => handleToggleReveal(key)}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1 ${
                        isRevealed 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                      }`}
                      id="btn-reveal-identity"
                    >
                      {isRevealed ? (
                        <>
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Identity Revealed</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>Reveal Student Identity</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Sub-Header Widget for safe exchange */}
                <div className="p-2.5 bg-emerald-50/40 border-b border-emerald-100/40 text-left flex items-start gap-1.5 text-[11px] text-emerald-800">
                  <Megaphone className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span><strong>Proactive Safe Zone Recommendation:</strong> Work out your handover at marked safe exchange coordinates like </span>
                    <strong className="underline text-emerald-950 font-sans">{item?.location || 'Campus Center Lounge'}</strong>
                    <span> or security reception desks to safeguard high-value handovers.</span>
                  </div>
                </div>

                {/* Message Logs Feed */}
                <div className="p-4 space-y-3.5 overflow-y-auto h-[350px] bg-slate-50/30 text-left flex flex-col justify-end">
                  {activeThread.messages.length === 0 ? (
                    <div className="text-center text-slate-400 text-xs py-12 flex flex-col items-center justify-center gap-1">
                      <Lock className="w-8 h-8 text-slate-300" />
                      <span>Start secure, privacy-guaranteed 1-to-1 conversation below.</span>
                      <span className="text-[10px]">Your personal email & mobile details are shielded.</span>
                    </div>
                  ) : (
                    <div className="space-y-3 overflow-y-auto flex-1 pr-1" id="message-container">
                      {activeThread.messages.map(msg => {
                        const isMe = msg.senderId === currentUser?.id;
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                          >
                            <div 
                              className={`max-w-[80%] rounded-2xl p-3 px-4 shadow-xs text-xs scale-95 duration-150 ${
                                isMe 
                                  ? 'bg-indigo-600 text-white rounded-br-sm text-right' 
                                  : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm text-left'
                              }`}
                            >
                              <p className="leading-relaxed font-sans">{msg.message}</p>
                              <span className={`text-[9px] block mt-1.5 font-mono ${
                                isMe ? 'text-indigo-200' : 'text-slate-400'
                              }`}>
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Text entry field form */}
                <form 
                  onSubmit={handleSendSubmit} 
                  className="p-3 bg-white border-t border-slate-100 flex items-center gap-2"
                  id="message-text-entry-form"
                >
                  <input
                    type="text"
                    value={typedMessage}
                    onChange={(e) => setTypedMessage(e.target.value)}
                    placeholder="Type a secure message (e.g., 'Hey! Let's meet tomorrow near the library cafeteria desk...')"
                    className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-800 focus:bg-white"
                    required
                    id="message-text-input"
                  />
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 h-9 w-9 rounded-lg flex items-center justify-center transition-all shadow-sm"
                    title="Send Secure Message"
                    id="btn-send-message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            );
          })()
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 p-8 text-center text-slate-400 text-sm">
            <Lock className="w-12 h-12 text-slate-200 mb-2" />
            <h3 className="font-bold text-slate-800 text-sm">Secure Messaging Lobby</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Keep personal numbers and emails out of public visibility. Select an ongoing conversation or initiate one from an item details screen.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
