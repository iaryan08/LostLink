import { X, ShieldAlert, CheckCircle, MapPin } from 'lucide-react';
import { SafeZone } from '../types';

interface SafeZonesModalProps {
  onClose: () => void;
  safeZones: SafeZone[];
}

export default function SafeZonesModal({ onClose, safeZones }: SafeZonesModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 block text-left"
        id="safezones-modal"
      >
        {/* Header toolbar */}
        <div className="p-4 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-sm">
            <MapPin className="w-5 h-5 text-emerald-600" />
            <span>Campus Safe Exchange Zones</span>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-emerald-100 rounded-full text-emerald-500 hover:text-emerald-800 transition-colors"
            id="close-safezones-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content detail */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Never meet strangers in isolated locations on campus. We recommend handing over valuables at these verified <strong className="font-semibold text-slate-800">Safe Exchange Zones</strong> which feature staff monitoring, secure lighting, and surveillance.
          </p>

          <div className="space-y-3">
            {safeZones.map(zone => (
              <div 
                key={zone.id} 
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100/60 transition-colors flex gap-2.5 items-start text-left"
              >
                <div className="p-1.5 bg-white rounded-lg border border-slate-100 text-emerald-600 shrink-0 mt-0.5 shadow-xs">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">
                    {zone.name}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                    COORDINATES: {zone.location}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {zone.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/40 text-[10px] text-indigo-700 leading-snug flex items-start gap-1.5">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              <strong>Note:</strong> Campus security desk wardens will happily assist inside these zones to witness claims or sign of. Always double check ID credentials first.
            </span>
          </div>

          <div className="flex justify-end pt-1">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs"
              id="btn-close-safezones"
            >
              Agree & Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
