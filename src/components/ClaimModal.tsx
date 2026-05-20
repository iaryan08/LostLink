import { useState, FormEvent } from 'react';
import { X, ShieldQuestion, Send } from 'lucide-react';
import { Item } from '../types';

interface ClaimModalProps {
  item: Item;
  onClose: () => void;
  onSubmit: (verificationAnswer: string) => void;
}

export default function ClaimModal({ item, onClose, onSubmit }: ClaimModalProps) {
  const [answer, setAnswer] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleClaimSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || answer.trim().length < 8) {
      setErrorMsg('Please write a detailed, descriptive answer (at least 8 characters) to help verify ownership.');
      return;
    }
    onSubmit(answer.trim());
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 block text-left"
        id="claim-modal"
      >
        {/* Header toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldQuestion className="w-5 h-5 text-indigo-600" />
            <span className="font-bold text-slate-900 text-sm">Ownership Verification Request</span>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-700 transition-colors"
            id="close-claim-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Panel */}
        <form onSubmit={handleClaimSubmit} className="p-5 space-y-4" id="claim-verification-form">
          <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/30">
            <span className="text-[10px] text-indigo-600 font-bold block uppercase tracking-wider font-mono">
              VERIFYING FOR VALUABLE
            </span>
            <strong className="text-slate-950 font-sans text-sm block mt-0.5">{item.title}</strong>
            <p className="text-[11px] text-slate-400 mt-1">
              Location lost/found: <strong className="text-slate-600">{item.location}</strong>
            </p>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 block uppercase tracking-wider mb-2 font-mono">
              Ownership Questionnaire / Proof *
            </label>
            <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
              {item.type === 'found' ? (
                <span>
                  Please describe unique identification details that the poster omitted. For instance:
                  <strong> "What wallpaper did you set?", "What color is inside?", "Is there a scratch?"</strong>
                </span>
              ) : (
                <span>
                  Please describe how you found this item, or verify you hold ownership of the object the reporter posted (e.g. details, colors, codes).
                </span>
              )}
            </p>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="e.g. Inside the brown wallet, my Student ID card lies in the second slot and is printed with the name John. There is also around $20."
              rows={4}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
              required
              id="verification-answer-textarea"
            />
          </div>

          {errorMsg && (
            <div className="text-xs font-semibold text-red-600">
              {errorMsg}
            </div>
          )}

          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] text-slate-400 leading-snug">
            <strong>Security Safeguard:</strong> The listing owner will manually cross-reference this description before releasing details or setting up a pickup chat thread. Any false/spam claims will be administrative flagged. Note: 3 flagged claims in a month will result in permanent account suspension.
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-lg border border-slate-200 transition-all"
              id="btn-cancel-claim"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
              id="btn-submit-claim"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit for Verification</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
