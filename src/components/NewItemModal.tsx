import { useState, FormEvent, ChangeEvent } from 'react';
import { X, ClipboardCheck, ArrowUpCircle, Eye, EyeOff } from 'lucide-react';

interface NewItemModalProps {
  onClose: () => void;
  onSubmit: (formData: any) => void;
}

const CATEGORY_IMAGE_PRESETS: Record<string, string> = {
  "Mobile": "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=500&auto=format&fit=crop&q=60",
  "Wallet": "https://images.unsplash.com/photo-1627124118123-fe45c61393f6?w=500&auto=format&fit=crop&q=60",
  "ID Card": "https://images.unsplash.com/photo-1578159802020-13ec49d669df?w=500&auto=format&fit=crop&q=60",
  "Keys": "https://images.unsplash.com/photo-1582139329536-e7284fece509?w=500&auto=format&fit=crop&q=60",
  "Bag": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&auto=format&fit=crop&q=60",
  "Electronics": "https://images.unsplash.com/photo-1588508065123-287b28e013da?w=500&auto=format&fit=crop&q=60",
  "Documents": "https://images.unsplash.com/photo-1626266025114-c48c3b7b4d08?w=500&auto=format&fit=crop&q=60",
  "Jewellery": "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&auto=format&fit=crop&q=60",
  "Others": "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=500&auto=format&fit=crop&q=60"
};

const CATEGORIES = [
  'Mobile', 'Wallet', 'ID Card', 'Keys', 'Bag', 'Electronics', 'Documents', 'Jewellery', 'Others'
];

export default function NewItemModal({ onClose, onSubmit }: NewItemModalProps) {
  const [type, setType] = useState<'lost' | 'found'>('lost');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Mobile');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [dateEvent, setDateEvent] = useState(new Date().toISOString().split('T')[0]);
  const [reward, setReward] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handlePresetSelect = (catName: string) => {
    setCategory(catName);
    setImageUrl(CATEGORY_IMAGE_PRESETS[catName] || '');
    setUploadSuccess(false);
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image size must be smaller than 5MB');
      return;
    }

    setUploading(true);
    setUploadSuccess(false);
    setErrorMsg('');

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = (reader.result as string).split(',')[1];
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': localStorage.getItem('lostlink_token') ? `Bearer ${localStorage.getItem('lostlink_token')}` : ''
          },
          body: JSON.stringify({
            base64Data,
            fileName: `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`,
            contentType: file.type
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to upload image');
        }

        const data = await response.json();
        setImageUrl(data.publicUrl);
        setUploadSuccess(true);
      } catch (err: any) {
        console.error("Upload error:", err);
        setErrorMsg(err.message || 'Image upload failed. Please try again.');
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !location.trim() || !dateEvent) {
      setErrorMsg('Please populate all primary fields (Title, Category, Location, Date, Description)');
      return;
    }

    const payload = {
      type,
      title: title.trim(),
      category,
      description: description.trim(),
      location: location.trim(),
      dateEvent,
      reward: type === 'lost' ? reward.trim() : undefined,
      imageUrl: imageUrl.trim() || CATEGORY_IMAGE_PRESETS[category],
      isAnonymous
    };

    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 block text-left"
        id="new-item-modal"
      >
        {/* Header toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-slate-800" />
            <h2 className="font-bold text-slate-900 text-base">File New Campus Report</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-700 transition-colors"
            id="close-new-item-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body Form */}
        <form onSubmit={handleFormSubmit} className="p-5 space-y-3.5 max-h-[80vh] overflow-y-auto" id="new-item-form">
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-100 rounded-lg text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Toggle Type Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider mb-1.5 font-mono">
              Report Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { setType('lost'); handlePresetSelect('Mobile'); }}
                className={`py-2 px-4 rounded-lg font-semibold text-xs border text-center transition-all ${
                  type === 'lost'
                    ? 'bg-red-500 text-white border-red-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
                id="btn-select-lost"
              >
                I Lost Something
              </button>
              <button
                type="button"
                onClick={() => { setType('found'); handlePresetSelect('Keys'); }}
                className={`py-2 px-4 rounded-lg font-semibold text-xs border text-center transition-all ${
                  type === 'found'
                    ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
                id="btn-select-found"
              >
                I Found Something
              </button>
            </div>
          </div>

          {/* Title input */}
          <div>
            <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider mb-1 font-mono">
              Item Name *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Phone, Wallet, ID Card"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
              maxLength={45}
              id="input-title"
              required
            />
          </div>

          {/* Category Dropdowns and predefined presets */}
          <div>
            <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider mb-1 font-mono">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => handlePresetSelect(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-800 focus:ring-1 focus:ring-slate-800 cursor-pointer"
              id="select-category"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Location & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider mb-1 font-mono">
                {type === 'lost' ? "Location" : "Found Location"} *
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Cafeteria, Block B"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
                maxLength={50}
                id="input-location"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider mb-1 font-mono">
                Date *
              </label>
              <input
                type="date"
                value={dateEvent}
                onChange={(e) => setDateEvent(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
                id="input-date"
                required
              />
            </div>
          </div>

          {/* Conditional Reward Input (Lost only) */}
          {type === 'lost' && (
            <div>
              <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider mb-1 font-mono">
                Reward (Optional)
              </label>
              <input
                type="text"
                value={reward}
                onChange={(e) => setReward(e.target.value)}
                placeholder="e.g. Cash reward or token of appreciation"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
                maxLength={30}
                id="input-reward"
              />
            </div>
          )}

          {/* Image Upload / URL Section */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider font-mono">
              Item Image
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100 cursor-pointer disabled:opacity-50"
                  id="input-image-file"
                />
              </div>
              <div className="text-xs">
                {uploading && <span className="text-indigo-600 font-semibold animate-pulse">Uploading to Supabase...</span>}
                {uploadSuccess && <span className="text-emerald-600 font-semibold">✓ Upload successful!</span>}
                {!uploading && !uploadSuccess && <span className="text-slate-400">Or use stock category preset</span>}
              </div>
            </div>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value);
                setUploadSuccess(false);
              }}
              placeholder="Or paste an image URL directly"
              className="w-full px-3 py-2 text-[11px] font-mono bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-800"
              id="input-imageurl"
            />
          </div>

          {/* Description Box */}
          <div>
            <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider mb-1 font-mono">
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                type === 'lost'
                  ? "Describe brand, colors, unique markings/scratches..."
                  : "Describe general look. Keep key details secret to verify ownership."
              }
              rows={2}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
              id="input-description"
              required
            />
          </div>

          {/* Anonymous Settings Toggle */}
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
            <div className="text-left select-none pr-4">
              <span className="font-bold text-slate-900 text-xs block flex items-center gap-1.5">
                {isAnonymous ? <EyeOff className="w-4 h-4 text-slate-600" /> : <Eye className="w-4 h-4 text-slate-600" />}
                Anonymous Post Mode
              </span>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                <span className="hidden sm:inline">Hide your profile name and avatar from listing. Users will chat with you anonymously.</span>
                <span className="sm:inline hidden">Hide identity on public listing.</span>
              </p>
            </div>
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-4 h-4 text-slate-950 border-slate-300 rounded-sm focus:ring-slate-950 cursor-pointer"
              id="checkbox-anonymous"
            />
          </div>

          {/* Controls Footer */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-lg border border-slate-200 transition-all"
              id="btn-cancel-post"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
              id="btn-submit-post"
            >
              <ArrowUpCircle className="w-3.5 h-3.5" />
              <span>Broadcast Report</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
