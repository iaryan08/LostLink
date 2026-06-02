"use client";

import { Search, SlidersHorizontal, Plus, Activity, MapPin, ShieldAlert, Star, CheckCircle2, Lock } from "lucide-react";
import { useAppContext } from "./providers";
import ItemCard from "../components/ItemCard";

export default function FeedPage() {
  const {
    currentUser,
    items,
    profiles,
    claims,
    searchQuery,
    setSearchQuery,
    filterCategory,
    setFilterCategory,
    filterLocation,
    setFilterLocation,
    filterStatus,
    setFilterStatus,
    showFilters,
    setShowFilters,
    setShowNewItemModal,
    setClaimingItemId,
    setReportingClaimId,
    setReportingItemId,
    handleDeleteItem,
    handleResolveItem,
    handleOpenMatches,
    triggerQuickMessage,
  } = useAppContext();

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

  return (
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
  );
}
