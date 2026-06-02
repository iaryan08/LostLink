"use client";

import { useAppContext } from "../providers";
import MessageInbox from "../../components/MessageInbox";

export default function MessagesPage() {
  const {
    currentUser,
    messages,
    items,
    profiles,
    handleSendMessage,
    initiateChatDraftItemId,
    initiateChatPartnerId,
  } = useAppContext();

  if (!currentUser) return null;

  return (
    <div className="space-y-4 block text-left" id="secure-messages-tab-view">
      <div>
        <h2 className="text-xl font-bold font-sans text-slate-950 tracking-tight">Handover Lobby Channels</h2>
        <p className="text-xs text-slate-500">
          Liaise with finders and owners privately. Avoid exposing personal emails, mobile IDs, or hostel numbers.
        </p>
      </div>

      <MessageInbox
        currentUser={currentUser}
        messages={messages}
        items={items}
        profiles={profiles}
        onSendMessage={handleSendMessage}
        selectedItemId={initiateChatDraftItemId}
        selectedPartnerId={initiateChatPartnerId}
      />
    </div>
  );
}
