import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { 
  Plus, 
  Search, 
  SlidersHorizontal, 
  Activity, 
  MapPin, 
  ShieldAlert, 
  Star,
  CheckCircle2,
  Lock,
  ArrowRight,
  UserCheck,
  TrendingUp,
  X
} from 'lucide-react';
import { Profile, Item, Claim, Message, AppNotification, RecentActivity, SafeZone } from './types';
import Navbar from './components/Navbar';
import ItemCard from './components/ItemCard';
import NewItemModal from './components/NewItemModal';
import ClaimModal from './components/ClaimModal';
import ReportModal from './components/ReportModal';
import MessageInbox from './components/MessageInbox';
import AdminPanel from './components/AdminPanel';
import SafeZonesModal from './components/SafeZonesModal';
import QRTagModal from './components/QRTagModal';
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

export default function App() {
  // Session Access Token / User Auth State
  const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem('lostlink_token'));
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  
  // DB Data stores
  const [items, setItems] = useState<Item[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [safeZones, setSafeZones] = useState<SafeZone[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]); // for admins and name queries
  const [reports, setReports] = useState<Report[]>([]);

  // App layouts / navigational control
  const [activeTab, setActiveTab] = useState<string>('feed');
  const [loading, setLoading] = useState<boolean>(!!localStorage.getItem('lostlink_token'));
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('lostlink_theme_dark');
    return saved ? saved === 'true' : true;
  });
  
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

      if (currentUser?.isAdmin) {
        const [profilesRes, reportsRes] = await Promise.all([
          fetch('/api/admin/users', { headers: getHeaders() }).catch(() => null),
          fetch('/api/reports', { headers: getHeaders() }).catch(() => null)
        ]);
        if (profilesRes && profilesRes.ok) setProfiles(await profilesRes.json());
        if (reportsRes && reportsRes.ok) setReports(await reportsRes.json());
      }
    } catch (e) {
      console.error("Failed to load full-stack state", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authToken) {
      fetchMe(authToken);
    }
  }, [authToken]);

  useEffect(() => {
    if (currentUser) {
      loadWorkspaceData();
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      setProfileGender(currentUser.gender || 'Male');
      setProfileAvatarUrl(currentUser.avatarUrl || '');

      // Check if user landed from scanning a valuable's recovery QR tag
      const params = new URLSearchParams(window.location.search);
      const recoveryOwner = params.get('recovery_owner');
      if (recoveryOwner) {
        if (currentUser.email === recoveryOwner) {
          alert("You scanned your own valuable's QR recovery sticker!");
        } else {
          alert(`🔍 Found Valuable: You scanned a QR recovery sticker belonging to ${recoveryOwner}. Use the Chats tab to coordinate a secure, anonymous handover!`);
        }
        // Clean up URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
      }
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
      // Just fetch lightweight notifications/messages to refresh state silently
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
      // Update in profiles local listing as well so avatar updates everywhere
      setProfiles(prev => prev.map(p => p.id === updatedProfile.id ? updatedProfile : p));
    } catch (err: any) {
      setProfileErrorMsg(err.message || 'Failed to save changes.');
    }
  };

  // Developer Fast Pass Bypass logins
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
    } catch {
      setAuthError('Quick login failed.');
    }
  };

  // --- ACTIONS ---

  // Compose new item
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

  // Delete item bulletin
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

  // Resolve item bulletin status
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

  // Select and center highlight item card from active feeds
  const handleSelectItem = (id: string) => {
    setSearchQuery('');
    setFilterCategory('All');
    setFilterStatus('All');
    setFilterLocation('');
    setTimeout(() => {
      const cardEl = document.getElementById(`item-card-${id}`);
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Highlight selected item card with smooth transient ring indicator for 4 seconds
        cardEl.classList.add('ring-4', 'ring-indigo-600', 'ring-offset-2', 'duration-500');
        setTimeout(() => {
          cardEl.classList.remove('ring-4', 'ring-indigo-600', 'ring-offset-2');
        }, 4000);
      }
    }, 100);
  };

  // Submit hand-over claim ownership form containing answering verification
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

  // Accept claim -> mark item as claimed/resolved & rejects conflicting claims
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

  // Reject claim
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

  // Report fake / suspicious claim to administrators
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

  // Dispatch new chat message
  const handleSendMessage = async (receiverId: string, itemId: string, messageText: string) => {
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ receiverId, itemId, message: messageText })
      });
      if (res.ok) {
        // Clear message drafts parameters if just initiated
        setInitiateChatDraftItemId(undefined);
        setInitiateChatPartnerId(undefined);
        await loadWorkspaceData();
      }
    } catch {
      alert('Error shipping message');
    }
  };

  // Quick Open Claim Chat trigger
  const triggerQuickMessage = (partnerId: string, itemId: string) => {
    setInitiateChatPartnerId(partnerId);
    setInitiateChatDraftItemId(itemId);
    setActiveTab('messages');
  };

  // Read notification mark helper
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

  // Calculate Matches via similarity algorithms in our backend
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

  // Admin Toggle Account suspension State
  const handleToggleUserBan = async (userId: string, currentBan: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ isBanned: !currentBan })
      });
      if (res.ok) {
        await loadWorkspaceData();
      } else {
        const d = await res.json();
        alert(d.error || 'Action blocked');
      }
    } catch {
      alert('Error updating user ban state');
    }
  };

  // Admin Dismiss Suspicious flag
  const handleDismissReport = async (reportId: string) => {
    // For simple demo, we just clear/dismiss it from administrative view
    alert('Report cleared from administrative attention.');
  };

  // --- RENDERING PARSERS ---

  // Live client-side keyword search & filter matrix
  const filteredItems = items.filter(item => {
    // 1. Term check
    const matchesQuery = searchQuery.trim() === '' || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    // 2. Category check
    const matchesCategory = filterCategory === 'All' || item.category === filterCategory;

    // 3. Location check
    const matchesLocation = filterLocation.trim() === '' || 
      item.location.toLowerCase().includes(filterLocation.toLowerCase());

    // 4. Status Check
    const matchesStatus = filterStatus === 'All' || item.status === filterStatus;

    return matchesQuery && matchesCategory && matchesLocation && matchesStatus;
  });

  // Render loading state while recovering user session
  if (loading && authToken && !currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <span className="text-xs font-mono text-slate-400 mt-3">Re-establishing secure session...</span>
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

        {/* FEED / EXPLORE TAB */}
        {activeTab === 'feed' && (
          <div className="space-y-8" id="explore-tab-view">
            
            {/* Geometric Balance Stats Banner */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="theme-stats-alerts">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs text-left">
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 font-mono">Total Bulletins Reported</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-slate-800 tracking-tight">{items.length}</span>
                  <span className="text-xs text-emerald-600 font-semibold font-mono">
                    +{items.filter(i => {
                      const diffTime = Math.abs(Date.now() - new Date(i.createdAt).getTime());
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      return diffDays <= 7;
                    }).length} this week
                  </span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs text-left">
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 font-mono">Successful Handovers</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-slate-800 tracking-tight">
                    {items.length > 0 ? Math.round((items.filter(i => i.status === 'resolved').length / items.length) * 100) : 0}%
                  </span>
                  <span className="text-xs text-indigo-600 font-semibold font-mono">Reunited</span>
                </div>
              </div>
            </div>

            {/* Feed Main Body Grid */}
            <div className="space-y-6">
              
              {/* Toolbar search bar widget */}
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-3 block text-left">
                <div className="flex gap-2.5">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-hidden focus:border-slate-800 focus:bg-white"
                      placeholder="Search items by keywords (e.g. CASIO, Keys, Blue cover, Library)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      id="livesearch-bar"
                    />
                  </div>
                  
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-2 rounded-lg border flex items-center gap-1.5 text-xs font-semibold select-none ${
                      showFilters 
                        ? 'bg-slate-100 font-bold border-slate-300 text-slate-900' 
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Filters</span>
                  </button>

                  <button
                    onClick={() => setShowNewItemModal(true)}
                    className="px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-all shadow-sm flex items-center justify-center gap-1 shrink-0"
                    id="trigger-create-item"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Report Item</span>
                  </button>
                </div>

                {/* Grid controls shown dynamically */}
                {showFilters && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 animate-in fade-in slide-in-from-top-1 duration-100" id="filters-workspace">
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 block uppercase tracking-wider mb-1 font-mono">Category</label>
                      <select
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        id="filter-category"
                      >
                        <option value="All">All Categories</option>
                        <option value="Mobile">Mobile Phones</option>
                        <option value="Wallet">Wallets & Bags</option>
                        <option value="ID Card">Student ID Cards</option>
                        <option value="Keys">Keys & Keychains</option>
                        <option value="Bag">Bags & Portfolios</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Documents">Documents/Books</option>
                        <option value="Jewellery">Jewellery/Precious</option>
                        <option value="Others">Others</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-700 block uppercase tracking-wider mb-1 font-mono">Status</label>
                      <select
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        id="filter-status"
                      >
                        <option value="All">All Items Status</option>
                        <option value="lost">Only Lost Reports</option>
                        <option value="found">Only Found Listings</option>
                        <option value="claimed">Handover Claims In-Process</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-700 block uppercase tracking-wider mb-1 font-mono">Campus Zone</label>
                      <input
                        type="text"
                        placeholder="e.g. Cafeteria, Hostel"
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white"
                        value={filterLocation}
                        onChange={(e) => setFilterLocation(e.target.value)}
                        id="filter-location"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Feed Display Case Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" id="items-feed-grid">
                {filteredItems.length === 0 ? (
                  <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4 bg-white rounded-xl p-16 text-center border border-slate-100 text-slate-400 text-sm">
                    No active lost/found items found matching those specifications.
                  </div>
                ) : (
                  filteredItems.map(item => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      currentUser={currentUser}
                      authors={profiles}
                      claims={claims}
                      onOpenReply={(partnerId, itemId) => triggerQuickMessage(partnerId, itemId)}
                      onOpenClaim={(id) => setClaimingItemId(id)}
                      onDelete={(id) => { handleDeleteItem(id); }}
                      onResolve={(id) => { handleResolveItem(id); }}
                      onOpenMatches={(id) => { handleOpenMatches(id); }}
                      onOpenReport={(cId, itId) => {
                        setReportingClaimId(cId);
                        setReportingItemId(itId);
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 block text-left" id="student-dashboard-workspace">
            <div>
              <h2 className="text-xl font-bold font-sans text-slate-950 tracking-tight">Student Dashboard</h2>
              <p className="text-xs text-slate-500">
                Oversee your submitted bulletins, active claims, and manage verified handovers.
              </p>
            </div>

            {/* Dashboard blocks */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left pane: claim requests received */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Claims requests on MY listings */}
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 block uppercase mb-3">
                    Verification requests on your bulletins
                  </span>

                  <div className="space-y-4">
                    {(() => {
                      // Items posted by currentUser
                      const myItems = items.filter(i => i.userId === currentUser.id);
                      const myItemIds = myItems.map(i => i.id);
                      
                      // Active claims on my items
                      const claimsOnMyItems = claims.filter(c => myItemIds.includes(c.itemId));

                      if (claimsOnMyItems.length === 0) {
                        return (
                          <div className="py-8 text-center text-xs text-slate-400">
                            No verification claims received yet.
                          </div>
                        );
                      }

                      return claimsOnMyItems.map(claim => {
                        const relatedItem = myItems.find(i => i.id === claim.itemId);
                        const claimant = profiles.find(p => p.id === claim.claimantId);

                        return (
                          <div 
                            key={claim.id} 
                            className={`p-4 rounded-xl border text-left space-y-3 transition-colors ${
                              claim.isReported
                                ? 'bg-red-50/50 border-rose-300 ring-2 ring-red-100 animate-pulse'
                                : claim.status === 'accepted' 
                                ? 'bg-emerald-50/20 border-emerald-100' 
                                : claim.status === 'rejected'
                                ? 'bg-red-50/20 border-red-100'
                                : 'bg-slate-50 border-slate-100'
                            }`}
                            id={`claim-box-${claim.id}`}
                          >
                            {/* Safety Alert Flag Banner */}
                            {claim.isReported && (
                              <div className="flex items-center gap-1.5 p-2 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-semibold">
                                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                                <span>CAUTION ADVISED: Claim reported for suspicious admin attention!</span>
                              </div>
                            )}

                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100/65 pb-2">
                              <div>
                                <strong className="text-indigo-600 text-xs font-mono font-bold block uppercase">
                                  REGARDING VALUABLE:
                                </strong>
                                <span className="font-bold text-slate-950 text-sm font-sans">{relatedItem?.title}</span>
                              </div>
                              <span className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full border ${
                                claim.status === 'accepted'
                                  ? 'bg-emerald-500 text-white border-emerald-400'
                                  : claim.status === 'rejected'
                                  ? 'bg-red-500 text-white border-red-400'
                                  : 'bg-amber-500 text-white border-amber-400'
                              }`}>
                                {claim.status}
                              </span>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[10px] text-slate-400 block font-mono">CLAIMANT DESCRIPTION / WALLPAPER ANSWERS</span>
                              <p className="text-xs bg-white text-slate-800 p-2.5 rounded-lg border border-slate-100 italic leading-relaxed font-sans shadow-sm">
                                "{claim.verificationAnswer}"
                              </p>
                              <div className="text-[10px] text-slate-400 font-mono">
                                Submitted for evaluation by: <strong className="text-slate-600">{claimant?.fullName || 'Active Student'}</strong> • {new Date(claim.createdAt).toLocaleString()}
                              </div>
                            </div>

                            {/* Verification Evaluation Buttons */}
                            {claim.status === 'pending' && (
                              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={() => handleAcceptClaim(claim.id)}
                                    className="px-3.5 py-1.5 bg-slate-900 border border-slate-900 text-white hover:bg-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
                                  >
                                    <UserCheck className="w-3.5 h-3.5" /> Approved / Confirm Owner
                                  </button>
                                  <button
                                    onClick={() => handleRejectClaim(claim.id)}
                                    className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors"
                                  >
                                    Decline Claim
                                  </button>
                                </div>

                                {!claim.isReported ? (
                                  <button
                                    onClick={() => {
                                      setReportingClaimId(claim.id);
                                      setReportingItemId(claim.itemId);
                                    }}
                                    className="text-[10px] font-bold text-red-600 hover:underline flex items-center gap-1.5 font-mono"
                                  >
                                    <ShieldAlert className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                                    Report Suspicious Claim
                                  </button>
                                ) : (
                                  <span className="text-[10px] font-bold font-mono text-rose-600 flex items-center gap-1 select-none">
                                    ✓ Administratively Flagged
                                  </span>
                                )}
                              </div>
                            )}

                            {claim.status === 'accepted' && (
                              <div className="pt-1 select-none flex items-center justify-between">
                                <span className="text-xs text-emerald-800 font-semibold flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                  Claim is Approved. Setup chat handover coordination.
                                </span>
                                <button
                                  onClick={() => triggerQuickMessage(claim.claimantId, claim.itemId)}
                                  className="py-1 px-3 bg-slate-900 text-white rounded-md font-bold text-[10px] hover:bg-slate-800 shadow-xs"
                                >
                                  Open secure chat with {claimant?.fullName}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* MY LOST bulletins index list */}
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 block uppercase mb-3">
                    Your Registered Bulletins ({items.filter(i => i.userId === currentUser.id).length})
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {items.filter(i => i.userId === currentUser.id).length === 0 ? (
                      <div className="sm:col-span-2 py-8 text-center text-xs text-slate-400">
                        You have not broadcasted any reports.
                      </div>
                    ) : (
                      items.filter(i => i.userId === currentUser.id).map(item => (
                        <div key={item.id} className="p-3 bg-slate-50 border border-slate-100/60 rounded-xl flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 max-w-[70%]">
                            <img src={item.imageUrl} alt={item.title} className="w-9 h-9 object-cover rounded-lg border border-slate-200" />
                            <div className="truncate text-left">
                              <span className={`text-[9px] uppercase font-mono font-bold block ${item.type === 'lost' ? 'text-red-500' : 'text-emerald-500'}`}>
                                {item.type} • {item.status}
                              </span>
                              <strong className="text-xs text-slate-800 block truncate">{item.title}</strong>
                            </div>
                          </div>

                          <div className="flex gap-1 shrink-0">
                            <button
                              onClick={() => handleOpenMatches(item.id)}
                              className="p-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-md text-[10px] font-bold text-slate-700"
                              title="Recalculate potential database matches"
                            >
                              Matches
                            </button>
                            {item.status !== 'resolved' && (
                              <button
                                onClick={() => handleResolveItem(item.id)}
                                className="p-1 px-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-md text-[10px] font-bold"
                                title="Mark status as solved and archival close"
                              >
                                Mark Solved
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Right pane: my outstanding claims made on other student bulletins */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-4">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 block uppercase">
                    Claims submitted by you
                  </span>

                  <div className="space-y-3.5 divide-y divide-slate-50">
                    {(() => {
                      const myClaimsExchanged = claims.filter(c => c.claimantId === currentUser?.id);
                      if (myClaimsExchanged.length === 0) {
                        return (
                          <div className="py-8 text-center text-xs text-slate-400 whitespace-nowrap">
                            No claims submitted yet.
                          </div>
                        );
                      }

                      return myClaimsExchanged.map(claim => {
                        const relatedItem = items.find(i => i.id === claim.itemId);
                        return (
                          <div key={claim.id} className="pt-2.5 space-y-1.5 text-left">
                            <div className="flex items-center justify-between">
                              <strong className="text-xs text-slate-900 block truncate font-sans max-w-[80%]">
                                ↳ {relatedItem?.title || 'Unknown valuable'}
                              </strong>
                              <span className={`text-[9px] font-mono tracking-wide uppercase px-1.5 font-bold rounded-sm border ${
                                claim.status === 'accepted'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                  : claim.status === 'rejected'
                                  ? 'bg-red-50 text-red-700 border-red-100'
                                  : 'bg-amber-50 text-amber-700 border-amber-100'
                              }`}>
                                {claim.status}
                              </span>
                            </div>
                            <p className="text-[11px] font-serif text-slate-400 leading-snug truncate">
                              "{claim.verificationAnswer}"
                            </p>
                            {claim.status === 'accepted' && relatedItem && (
                              <button
                                onClick={() => triggerQuickMessage(relatedItem.userId, relatedItem.id)}
                                className="w-full py-1 text-center bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-md text-[10px] font-bold"
                              >
                                Secure Handover chat enabled! Message Owner
                              </button>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Profile Customizer Card */}
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-4">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 block uppercase">
                    Profile settings & avatar
                  </span>

                  <div className="space-y-4">
                    {/* Display current details */}
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100/50">
                      <img
                        src={profileAvatarUrl}
                        alt="Avatar Preview"
                        className="w-12 h-12 rounded-full border border-slate-200 object-cover bg-white"
                      />
                      <div className="text-left">
                        <strong className="text-xs font-semibold text-slate-900 block leading-tight">{currentUser.fullName}</strong>
                        <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">Gender: {profileGender || 'Not Specified'}</span>
                      </div>
                    </div>

                    {/* Form inputs */}
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1 text-left">
                          Select Gender
                        </label>
                        <select
                          value={profileGender}
                          onChange={(e) => {
                            const newGen = e.target.value;
                            setProfileGender(newGen);
                            const list = GENDER_AVATARS[newGen] || GENDER_AVATARS['Other'];
                            setProfileAvatarUrl(list[0]);
                          }}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-800"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1.5 text-left">
                          Select Avatar Preset
                        </label>
                        <div className="grid grid-cols-5 gap-2">
                          {(GENDER_AVATARS[profileGender] || GENDER_AVATARS['Other']).map((url, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setProfileAvatarUrl(url)}
                              className={`p-1 bg-slate-50 border rounded-lg hover:bg-slate-100 transition-all ${
                                profileAvatarUrl === url ? 'border-indigo-600 ring-2 ring-indigo-50 bg-white' : 'border-slate-150'
                              }`}
                            >
                              <img src={url} alt={`Avatar Preset ${idx}`} className="w-full h-auto rounded-full" />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="relative">
                        <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1.5 text-left">
                          Or Upload Custom Photo
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProfilePhotoUpload}
                          className="hidden"
                          id="profile-photo-upload-input"
                        />
                        <label
                          htmlFor="profile-photo-upload-input"
                          className="w-full py-2 bg-slate-50 border border-dashed border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-[10px] rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider font-mono"
                        >
                          {profilePhotoUploading ? 'Uploading...' : 'Choose Custom Image'}
                        </label>
                      </div>

                      <button
                        onClick={handleSaveProfile}
                        disabled={profilePhotoUploading}
                        className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] rounded-lg shadow-sm transition-all uppercase tracking-wider font-mono disabled:opacity-50"
                      >
                        Save Profile Settings
                      </button>

                      {profileSuccessMsg && (
                        <p className="text-[10px] text-emerald-600 font-bold font-mono text-center">
                          ✓ {profileSuccessMsg}
                        </p>
                      )}
                      {profileErrorMsg && (
                        <p className="text-[10px] text-red-650 font-bold font-mono text-center">
                          ✕ {profileErrorMsg}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECURE CHATS MESSAGES TAB */}
        {activeTab === 'messages' && (
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
        )}

        {/* ADMIN CONTROL PANEL TAB */}
        {activeTab === 'admin' && currentUser?.isAdmin && (
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
        )}
      </main>

      {/* --- POPUP MATCHES MODALS PANEL --- */}
      {scoringItemId && (
        <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div 
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 block text-left"
            id="matches-scoring-modal"
          >
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm">Potential Matches in Campus DB</h3>
              </div>
              <button 
                onClick={() => setScoringItemId(null)}
                className="p-1 hover:bg-slate-800 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <span className="text-[10px] text-slate-400 font-mono block">MATCHING SOURCE BULLETIN:</span>
              <strong className="text-slate-950 text-sm block">
                {items.find(i => i.id === scoringItemId)?.title}
              </strong>

              <div className="divide-y divide-slate-100">
                {scoringMatches.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    Our similarity index didn't find clear opposing lost/found items inside this category and location word patterns. New matches appear in real-time as users report them.
                  </div>
                ) : (
                  scoringMatches.map(match => (
                    <div key={match.item.id} className="py-3.5 flex items-start justify-between gap-4 text-left">
                      <div className="flex items-start gap-2.5 max-w-[70%]">
                        <img src={match.item.imageUrl} alt={match.item.title} className="w-12 h-12 object-cover rounded-lg border" />
                        <div>
                          <span className="text-[9px] uppercase font-mono font-bold text-indigo-500">
                            Scoring Alignment: {match.score}% match
                          </span>
                          <h4 className="font-bold text-slate-900 text-xs mt-0.5">{match.item.title}</h4>
                          <span className="text-[10px] text-slate-400 font-sans block truncate">
                            Location: <strong>{match.item.location}</strong>
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setScoringItemId(null);
                          triggerQuickMessage(match.item.userId, match.item.id);
                        }}
                        className="px-3 py-1 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-xs font-semibold shrink-0"
                      >
                        Contact finder/owner
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-3 bg-indigo-50 text-[10px] text-indigo-950 leading-snug select-none text-center">
              Our system weights categories and location tokens to calculate automated correlation scores.
            </div>
          </div>
        </div>
      )}

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

      {reportingClaimId && (
        <ReportModal
          claimId={reportingClaimId}
          itemId={reportingItemId!}
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
