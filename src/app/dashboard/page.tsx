"use client";

import { ShieldAlert, UserCheck, CheckCircle2, TrendingUp, X } from "lucide-react";
import { useAppContext } from "../providers";

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

export default function DashboardPage() {
  const {
    currentUser,
    items,
    claims,
    profiles,
    reportingClaimId,
    setReportingClaimId,
    reportingItemId,
    setReportingItemId,
    handleAcceptClaim,
    handleRejectClaim,
    triggerQuickMessage,
    handleDeleteItem,
    handleResolveItem,
    handleOpenMatches,
    profileGender,
    setProfileGender,
    profileAvatarUrl,
    setProfileAvatarUrl,
    profilePhotoUploading,
    profileSuccessMsg,
    profileErrorMsg,
    handleProfilePhotoUpload,
    handleSaveProfile,
  } = useAppContext();

  if (!currentUser) return null;

  return (
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
                const myItems = items.filter(i => i.userId === currentUser.id);
                const myItemIds = myItems.map(i => i.id);
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
                              ✓ Flagged
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

          {/* MY bulletins list */}
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

        {/* Right pane: my outstanding claims made & profile customization */}
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
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100/50">
                <img
                  src={profileAvatarUrl || currentUser.avatarUrl}
                  alt="Avatar Preview"
                  className="w-12 h-12 rounded-full border border-slate-200 object-cover bg-white"
                />
                <div className="text-left">
                  <strong className="text-xs font-semibold text-slate-900 block leading-tight">{currentUser.fullName}</strong>
                  <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">Gender: {profileGender || 'Not Specified'}</span>
                </div>
              </div>

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
  );
}
