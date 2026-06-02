"use client";

import { createContext, useContext, useState, useEffect, FormEvent, ChangeEvent, ReactNode } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Profile, Item, Claim, Message, AppNotification, RecentActivity, SafeZone, Report } from '../types';

interface AppContextType {
  // Auth state
  authToken: string | null;
  currentUser: Profile | null;
  loading: boolean;
  authInitialized: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  
  // Data stores
  items: Item[];
  claims: Claim[];
  messages: Message[];
  notifications: AppNotification[];
  recentActivities: RecentActivity[];
  safeZones: SafeZone[];
  profiles: Profile[];
  reports: Report[];
  
  // Auth Form State
  authMode: 'login' | 'register';
  setAuthMode: (mode: 'login' | 'register') => void;
  authEmail: string;
  setAuthEmail: (email: string) => void;
  authPassword: string;
  setAuthPassword: (password: string) => void;
  authFullName: string;
  setAuthFullName: (name: string) => void;
  authGender: string;
  setAuthGender: (gender: string) => void;
  authError: string;
  setAuthError: (error: string) => void;

  // Profile Customizer State
  profileGender: string;
  setProfileGender: (gender: string) => void;
  profileAvatarUrl: string;
  setProfileAvatarUrl: (url: string) => void;
  profilePhotoUploading: boolean;
  profileSuccessMsg: string;
  setProfileSuccessMsg: (msg: string) => void;
  profileErrorMsg: string;
  setProfileErrorMsg: (msg: string) => void;

  // Search & Filters State
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterCategory: string;
  setFilterCategory: (cat: string) => void;
  filterLocation: string;
  setFilterLocation: (loc: string) => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;

  // Modals visibility
  showNewItemModal: boolean;
  setShowNewItemModal: (show: boolean) => void;
  showSafeZonesModal: boolean;
  setShowSafeZonesModal: (show: boolean) => void;
  showQRTagModal: boolean;
  setShowQRTagModal: (show: boolean) => void;

  // Contextual targets
  claimingItemId: string | null;
  setClaimingItemId: (id: string | null) => void;
  reportingClaimId: string | null;
  setReportingClaimId: (id: string | null) => void;
  reportingItemId: string | null;
  setReportingItemId: (id: string | null) => void;
  initiateChatPartnerId: string | undefined;
  setInitiateChatPartnerId: (id: string | undefined) => void;
  initiateChatDraftItemId: string | undefined;
  setInitiateChatDraftItemId: (id: string | undefined) => void;
  
  // Matches list
  scoringItemId: string | null;
  setScoringItemId: (id: string | null) => void;
  scoringMatches: { item: Item; score: number }[];
  setScoringMatches: (matches: { item: Item; score: number }[]) => void;

  // Actions
  handleAuthSubmit: (e: FormEvent) => Promise<void>;
  handleLogout: () => void;
  handleProfilePhotoUpload: (e: ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleSaveProfile: () => Promise<void>;
  triggerQuickLogin: (email: string) => Promise<void>;
  handleCreateItem: (formData: any) => Promise<void>;
  handleDeleteItem: (id: string) => Promise<void>;
  handleResolveItem: (id: string) => Promise<void>;
  handleSelectItem: (id: string) => void;
  handleClaimSubmit: (verificationAnswer: string) => Promise<void>;
  handleAcceptClaim: (claimId: string) => Promise<void>;
  handleRejectClaim: (claimId: string) => Promise<void>;
  handleReportClaimSubmit: (reason: string) => Promise<void>;
  handleSendMessage: (receiverId: string, itemId: string, messageText: string) => Promise<void>;
  triggerQuickMessage: (partnerId: string, itemId: string) => void;
  handleNotificationRead: (id: string) => Promise<void>;
  handleNotificationsAllRead: () => Promise<void>;
  handleClearAllNotifications: () => Promise<void>;
  handleOpenMatches: (itemId: string) => Promise<void>;
  handleToggleUserBan: (userId: string, currentBan: boolean) => Promise<void>;
  handleDismissReport: (reportId: string) => Promise<void>;
  loadWorkspaceData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const GENDER_AVATARS: Record<string, string[]> = {
  "Male": [
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Jack&top=shortFlat&facialHair=beardLight&facialHairProbability=100",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&top=frizzle&facialHair=beardMedium&facialHairProbability=100",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Max&top=shaggy&facialHair=beardMajestic&facialHairProbability=100",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Leo&top=shortCurly&facialHair=moustacheMagnum&facialHairProbability=100",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex&top=theCaesar&facialHair=moustacheFancy&facialHairProbability=100"
  ],
  "Female": [
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&top=longButNotTooLong&facialHairProbability=0",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Missy&top=curly&facialHairProbability=0",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Sara&top=straight01&facialHairProbability=0",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Maya&top=bob&facialHairProbability=0",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe&top=curvy&facialHairProbability=0"
  ],
  "Other": [
    "https://api.dicebear.com/7.x/bottts/svg?seed=Robo1",
    "https://api.dicebear.com/7.x/bottts/svg?seed=Robo2",
    "https://api.dicebear.com/7.x/identicon/svg?seed=Id1",
    "https://api.dicebear.com/7.x/identicon/svg?seed=Id2",
    "https://api.dicebear.com/7.x/shapes/svg?seed=Shape1"
  ]
};

export function AppContextProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  
  // Session Access Token / User Auth State
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  
  // DB Data stores
  const [items, setItems] = useState<Item[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [safeZones, setSafeZones] = useState<SafeZone[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [reports, setReports] = useState<Report[]>([]);

  const pathname = usePathname();
  const [activeTab, setActiveTabState] = useState<string>('feed');

  useEffect(() => {
    if (pathname === '/') setActiveTabState('feed');
    else if (pathname === '/dashboard') setActiveTabState('dashboard');
    else if (pathname === '/messages') setActiveTabState('messages');
    else if (pathname === '/admin') setActiveTabState('admin');
  }, [pathname]);

  const setActiveTab = (tab: string) => {
    if (tab === 'feed') router.push('/');
    else if (tab === 'dashboard') router.push('/dashboard');
    else if (tab === 'messages') router.push('/messages');
    else if (tab === 'admin') router.push('/admin');
  };

  const [loading, setLoading] = useState<boolean>(true);
  const [authInitialized, setAuthInitialized] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(true);
  
  // Authentication Forms State
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authFullName, setAuthFullName] = useState('');
  const [authGender, setAuthGender] = useState('Male');
  const [authError, setAuthError] = useState('');

  // Profile customizer states
  const [profileGender, setProfileGender] = useState('Male');
  const [profileAvatarUrl, setProfileAvatarUrl] = useState('');
  const [profilePhotoUploading, setProfilePhotoUploading] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');

  // Search & Filter parameters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  // Modal displays state
  const [showNewItemModal, setShowNewItemModal] = useState(false);
  const [showSafeZonesModal, setShowSafeZonesModal] = useState(false);
  const [showQRTagModal, setShowQRTagModal] = useState(false);
  
  // Specific contextual target payloads
  const [claimingItemId, setClaimingItemId] = useState<string | null>(null);
  const [reportingClaimId, setReportingClaimId] = useState<string | null>(null);
  const [reportingItemId, setReportingItemId] = useState<string | null>(null);
  
  // Messaging link shortcut values
  const [initiateChatPartnerId, setInitiateChatPartnerId] = useState<string | undefined>(undefined);
  const [initiateChatDraftItemId, setInitiateChatDraftItemId] = useState<string | undefined>(undefined);

  // Scoring/Matches results display
  const [scoringItemId, setScoringItemId] = useState<string | null>(null);
  const [scoringMatches, setScoringMatches] = useState<{item: Item, score: number}[]>([]);

  // Load token and theme from localStorage after mounting
  useEffect(() => {
    const token = localStorage.getItem('lostlink_token');
    setAuthToken(token);
    setLoading(!!token);
    
    const themeSaved = localStorage.getItem('lostlink_theme_dark');
    if (themeSaved) {
      setDarkMode(themeSaved === 'true');
    }
    setAuthInitialized(true);
  }, []);

  // Base HTTP Request header generators
  const getHeaders = () => {
    return {
      'Content-Type': 'application/json',
      'Authorization': authToken ? `Bearer ${authToken}` : ''
    };
  };

  // --- API OPERATIONS ---

  // Auth bootstrap
  const fetchMe = async (token: string) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const profile = await res.json();
        setCurrentUser(profile);
      } else {
        // Clear stale session
        setLoading(false);
        handleLogout();
      }
    } catch {
      setLoading(false);
      handleLogout();
    }
  };

  // Main data load orchestration
  const loadWorkspaceData = async () => {
    if (!authToken) return;
    setLoading(true);
    try {
      const [itemsRes, claimsRes, messagesRes, notificationsRes, activitiesRes, safeZonesRes] = await Promise.all([
        fetch('/api/items', { headers: getHeaders() }),
        fetch('/api/claims', { headers: getHeaders() }),
        fetch('/api/messages', { headers: getHeaders() }),
        fetch('/api/notifications', { headers: getHeaders() }),
        fetch('/api/activities'),
        fetch('/api/safezones'),
      ]);

      if (itemsRes.ok) setItems(await itemsRes.json());
      if (claimsRes.ok) setClaims(await claimsRes.json());
      if (messagesRes.ok) setMessages(await messagesRes.json());
      if (notificationsRes.ok) setNotifications(await notificationsRes.json());
      if (activitiesRes.ok) setRecentActivities(await activitiesRes.json());
      if (safeZonesRes.ok) setSafeZones(await safeZonesRes.json());

      // If user is Admin, load profiles & reports
      // We will check currentUser below in useEffect once profile is fetched
    } catch (e) {
      console.error("Failed to load workspace data", e);
    } finally {
      setLoading(false);
    }
  };

  const loadAdminData = async () => {
    if (!authToken || !currentUser?.isAdmin) return;
    try {
      const [profilesRes, reportsRes] = await Promise.all([
        fetch('/api/admin/users', { headers: getHeaders() }).catch(() => null),
        fetch('/api/reports', { headers: getHeaders() }).catch(() => null)
      ]);
      if (profilesRes && profilesRes.ok) setProfiles(await profilesRes.json());
      if (reportsRes && reportsRes.ok) setReports(await reportsRes.json());
    } catch (e) {
      console.error("Failed to load admin data", e);
    }
  };

  useEffect(() => {
    if (authToken) {
      fetchMe(authToken);
    } else {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    if (currentUser) {
      loadWorkspaceData();
    }
  }, [currentUser, authToken]);

  useEffect(() => {
    if (currentUser && currentUser.isAdmin) {
      loadAdminData();
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      setProfileGender(currentUser.gender || 'Male');
      setProfileAvatarUrl(currentUser.avatarUrl || '');
    }
  }, [currentUser]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('lostlink_theme_dark', darkMode.toString());
  }, [darkMode]);

  // Periodic slow polling to simulate real-time sockets notifications
  useEffect(() => {
    if (!authToken || !currentUser) return;
    const interval = setInterval(() => {
      fetch('/api/notifications', { headers: getHeaders() })
        .then(res => res.ok ? res.json() : null)
        .then(data => data && setNotifications(data));

      fetch('/api/messages', { headers: getHeaders() })
        .then(res => res.ok ? res.json() : null)
        .then(data => data && setMessages(data));
    }, 9000);

    return () => clearInterval(interval);
  }, [authToken, currentUser]);

  // Handle registration & logins
  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!authEmail || !authPassword || (authMode === 'register' && !authFullName)) {
      setAuthError('Please populate all forms');
      return;
    }

    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const body = authMode === 'login' 
      ? { email: authEmail, password: authPassword }
      : { fullName: authFullName, email: authEmail, password: authPassword, gender: authGender };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      
      if (!res.ok) {
        setAuthError(data.error || 'Authentication failed');
        return;
      }

      localStorage.setItem('lostlink_token', data.token);
      setAuthToken(data.token);
      setCurrentUser(data.user);
      setAuthEmail('');
      setAuthPassword('');
      setAuthFullName('');
      router.push('/');
    } catch (err) {
      setAuthError('Connection failure. Ensure server is online.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('lostlink_token');
    setAuthToken(null);
    setCurrentUser(null);
    setItems([]);
    setClaims([]);
    setMessages([]);
    setNotifications([]);
    router.push('/');
  };

  const handleProfilePhotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setProfileErrorMsg('Image size must be smaller than 5MB');
      return;
    }

    setProfilePhotoUploading(true);
    setProfileErrorMsg('');
    setProfileSuccessMsg('');

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = (reader.result as string).split(',')[1];
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            base64Data,
            fileName: `profile_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`,
            contentType: file.type
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to upload photo');
        }

        const data = await response.json();
        setProfileAvatarUrl(data.publicUrl);
        setProfileSuccessMsg('Custom photo uploaded successfully!');
      } catch (err: any) {
        console.error("Profile photo upload error:", err);
        setProfileErrorMsg(err.message || 'Photo upload failed.');
      } finally {
        setProfilePhotoUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    setProfileErrorMsg('');
    setProfileSuccessMsg('');

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          gender: profileGender,
          avatarUrl: profileAvatarUrl
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to update profile');
      }

      const updatedProfile = await response.json();
      setCurrentUser(updatedProfile);
      setProfileSuccessMsg('Profile settings updated successfully!');
      setProfiles(prev => prev.map(p => p.id === updatedProfile.id ? updatedProfile : p));
    } catch (err: any) {
      setProfileErrorMsg(err.message || 'Failed to save changes.');
    }
  };

  const triggerQuickLogin = async (email: string) => {
    setAuthError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'password' })
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error);
        return;
      }
      localStorage.setItem('lostlink_token', data.token);
      setAuthToken(data.token);
      setCurrentUser(data.user);
      router.push('/');
    } catch {
      setAuthError('Quick login failed.');
    }
  };

  const handleCreateItem = async (formData: any) => {
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowNewItemModal(false);
        await loadWorkspaceData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to submit report');
      }
    } catch {
      alert('Error creating item');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you confident you want to remove this report listing permanently?')) return;
    try {
      const res = await fetch(`/api/items/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        await loadWorkspaceData();
        if (scoringItemId === id) setScoringItemId(null);
      }
    } catch {
      alert('Deletion error');
    }
  };

  const handleResolveItem = async (id: string) => {
    try {
      const res = await fetch(`/api/items/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status: 'resolved' })
      });
      if (res.ok) {
        await loadWorkspaceData();
      }
    } catch {
      alert('Error resolving item');
    }
  };

  const handleSelectItem = (id: string) => {
    setSearchQuery('');
    setFilterCategory('All');
    setFilterStatus('All');
    setFilterLocation('');
    router.push('/');
    setTimeout(() => {
      const cardEl = document.getElementById(`item-card-${id}`);
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        cardEl.classList.add('ring-4', 'ring-indigo-600', 'ring-offset-2', 'duration-500');
        setTimeout(() => {
          cardEl.classList.remove('ring-4', 'ring-indigo-600', 'ring-offset-2');
        }, 4000);
      }
    }, 200);
  };

  const handleClaimSubmit = async (verificationAnswer: string) => {
    if (!claimingItemId) return;
    try {
      const res = await fetch('/api/claims', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ itemId: claimingItemId, verificationAnswer })
      });
      if (res.ok) {
        setClaimingItemId(null);
        await loadWorkspaceData();
        alert('Claim request sent safely to owner. You can keep track in My Dashboard!');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to submit claim');
      }
    } catch {
      alert('Claim insertion error');
    }
  };

  const handleAcceptClaim = async (claimId: string) => {
    if (!confirm('Marking this claim as accepted will close conflicting claims. OK to proceed?')) return;
    try {
      const res = await fetch(`/api/claims/${claimId}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status: 'accepted' })
      });
      if (res.ok) {
        await loadWorkspaceData();
      }
    } catch {
      alert('Error processing claim approval');
    }
  };

  const handleRejectClaim = async (claimId: string) => {
    try {
      const res = await fetch(`/api/claims/${claimId}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status: 'rejected' })
      });
      if (res.ok) {
        await loadWorkspaceData();
      }
    } catch {
      alert('Error rejecting claim');
    }
  };

  const handleReportClaimSubmit = async (reason: string) => {
    if (!reportingClaimId || !reportingItemId) return;
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ 
          claimId: reportingClaimId, 
          itemId: reportingItemId, 
          reason 
        })
      });
      if (res.ok) {
        setReportingClaimId(null);
        setReportingItemId(null);
        await loadWorkspaceData();
        alert('Thank you for safeguarding the campus network! Suspicious claim has been administrative flagged.');
      }
    } catch {
      alert('Reporting error');
    }
  };

  const handleSendMessage = async (receiverId: string, itemId: string, messageText: string) => {
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ receiverId, itemId, message: messageText })
      });
      if (res.ok) {
        setInitiateChatDraftItemId(undefined);
        setInitiateChatPartnerId(undefined);
        await loadWorkspaceData();
      }
    } catch {
      alert('Error shipping message');
    }
  };

  const triggerQuickMessage = (partnerId: string, itemId: string) => {
    setInitiateChatPartnerId(partnerId);
    setInitiateChatDraftItemId(itemId);
    router.push('/messages');
  };

  const handleNotificationRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: getHeaders()
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch {}
  };

  const handleNotificationsAllRead = async () => {
    try {
      await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: getHeaders()
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {}
  };

  const handleClearAllNotifications = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'DELETE',
        headers: getHeaders()
      });
      setNotifications([]);
    } catch {}
  };

  const handleOpenMatches = async (itemId: string) => {
    setScoringItemId(itemId);
    try {
      const res = await fetch(`/api/items/${itemId}/matches`, { headers: getHeaders() });
      if (res.ok) {
        setScoringMatches(await res.json());
      }
    } catch {
      console.error('Error fetching matches list');
    }
  };

  const handleToggleUserBan = async (userId: string, currentBan: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ isBanned: !currentBan })
      });
      if (res.ok) {
        await loadWorkspaceData();
        await loadAdminData();
      } else {
        const d = await res.json();
        alert(d.error || 'Action blocked');
      }
    } catch {
      alert('Error updating user ban state');
    }
  };

  const handleDismissReport = async (reportId: string) => {
    alert('Report cleared from administrative attention.');
  };

  return (
    <AppContext.Provider value={{
      authToken,
      currentUser,
      loading,
      authInitialized,
      activeTab,
      setActiveTab,
      darkMode,
      setDarkMode,
      
      items,
      claims,
      messages,
      notifications,
      recentActivities,
      safeZones,
      profiles,
      reports,
      
      authMode, setAuthMode,
      authEmail, setAuthEmail,
      authPassword, setAuthPassword,
      authFullName, setAuthFullName,
      authGender, setAuthGender,
      authError, setAuthError,
      
      profileGender, setProfileGender,
      profileAvatarUrl, setProfileAvatarUrl,
      profilePhotoUploading,
      profileSuccessMsg, setProfileSuccessMsg,
      profileErrorMsg, setProfileErrorMsg,
      
      searchQuery, setSearchQuery,
      filterCategory, setFilterCategory,
      filterLocation, setFilterLocation,
      filterStatus, setFilterStatus,
      showFilters, setShowFilters,
      
      showNewItemModal, setShowNewItemModal,
      showSafeZonesModal, setShowSafeZonesModal,
      showQRTagModal, setShowQRTagModal,
      
      claimingItemId, setClaimingItemId,
      reportingClaimId, setReportingClaimId,
      reportingItemId, setReportingItemId,
      initiateChatPartnerId, setInitiateChatPartnerId,
      initiateChatDraftItemId, setInitiateChatDraftItemId,
      
      scoringItemId, setScoringItemId,
      scoringMatches, setScoringMatches,
      
      handleAuthSubmit,
      handleLogout,
      handleProfilePhotoUpload,
      handleSaveProfile,
      triggerQuickLogin,
      handleCreateItem,
      handleDeleteItem,
      handleResolveItem,
      handleSelectItem,
      handleClaimSubmit,
      handleAcceptClaim,
      handleRejectClaim,
      handleReportClaimSubmit,
      handleSendMessage,
      triggerQuickMessage,
      handleNotificationRead,
      handleNotificationsAllRead,
      handleClearAllNotifications,
      handleOpenMatches,
      handleToggleUserBan,
      handleDismissReport,
      loadWorkspaceData
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppContextProvider');
  }
  return context;
}
