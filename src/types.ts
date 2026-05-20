/**
 * LostLink Application Type Definitions
 */

export interface Profile {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string;
  createdAt: string;
  isAdmin?: boolean;
  isBanned?: boolean;
  gender?: string;
}

export type ItemType = 'lost' | 'found';
export type ItemStatus = 'lost' | 'found' | 'claimed' | 'resolved';

export interface Item {
  id: string;
  userId: string;
  type: ItemType;
  title: string;
  category: string;
  description: string;
  location: string;
  imageUrl: string;
  status: ItemStatus;
  reward?: string;
  dateEvent: string;
  createdAt: string;
  // Optional flag to allow anonymous post
  isAnonymous?: boolean;
}

export type ClaimStatus = 'pending' | 'accepted' | 'rejected';

export interface Claim {
  id: string;
  itemId: string;
  claimantId: string;
  verificationAnswer: string;
  status: ClaimStatus;
  createdAt: string;
  isReported?: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  itemId: string;
  message: string;
  createdAt: string;
}

export interface Report {
  id: string;
  claimId: string;
  itemId: string;
  reporterId: string;
  reason: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: 'message' | 'claim' | 'claim_update' | 'report' | 'item_match';
  title: string;
  content: string;
  isRead: boolean;
  itemId: string;
  createdAt: string;
}

export interface SafeZone {
  id: string;
  name: string;
  description: string;
  location: string;
}

export interface RecentActivity {
  id: string;
  userId: string;
  userName: string;
  action: string;
  targetTitle: string;
  createdAt: string;
}
