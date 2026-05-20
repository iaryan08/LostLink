import { useState, FormEvent } from 'react';
import { X, ShieldAlert, Send } from 'lucide-react';

interface ReportModalProps {
  claimId: string;
  itemId: string;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}

export default function ReportModal({ claimId, itemId, onClose, onSubmit }: ReportModalProps) {
  const [reasonCategory, setReasonCategory] = useState('Fake identity details');
  const [details, setDetails] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const REASONS = [
    'Fake identity details',
    'Abusive/harassing responses',
    'Asking for money rewards upfront',
    'Phishing / suspicious links shared',
    'Spam duplication'
  ];

  const handleReportSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!details.trim() || details.trim().length < 6) {
      setErrorMsg('Please specify some description detail (at least 6 characters) regarding why this is flagged.');
      return;
    }
    onSubmit(`[${reasonCategory}] - ${details.trim()}`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 block text-left"
        id="report-modal"
      >
        {/* Header toolbar */}
        <div className="p-4 bg-red-50 border-b border-red-150 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-red-700">
            <ShieldAlert className="w-5 h-5" />
            <span className="font-bold text-sm">Report Suspicious Claim</span>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-red-100 rounded-full text-red-400 hover:text-red-700 transition-colors"
            id="close-report-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleReportSubmit} className="p-5 space-y-4" id="suspicious-report-form">
          <div>
            <label className="text-xs font-bold text-slate-800 block uppercase tracking-wider mb-1 font-mono">
              Suspicious Activity Category
            </label>
            <select
              value={reasonCategory}
              onChange={(e) => setReasonCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-800"
              id="report-category-select"
            >
              {REASONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 block uppercase tracking-wider mb-1.5 font-mono">
              Provide Evidence / Explanation *
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="e.g. This claimant claimed they had a blue library badge inside, but they wrote a different student name that doesn't exist."
              rows={3}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-800"
              required
              id="report-details-textarea"
            />
          </div>

          {errorMsg && (
            <div className="text-xs font-semibold text-red-600">
              {errorMsg}
            </div>
          )}

          <div className="p-3 bg-red-50/50 rounded-xl border border-red-100/30 text-[10px] text-red-700 leading-snug">
            <strong>Moderation Security Notice:</strong> This action will alert campus administrators to inspect this specific claim instantly. Duplicate fake reports may lead to account restrictions.
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-lg border border-slate-200"
              id="btn-cancel-report"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
              id="btn-submit-report"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Broadcast Safety Flag</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
