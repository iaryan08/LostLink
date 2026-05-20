import { useState } from 'react';
import { X, QrCode, ClipboardCopy, Download, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface QRTagModalProps {
  onClose: () => void;
  userEmail: string;
}

export default function QRTagModal({ onClose, userEmail }: QRTagModalProps) {
  const [copied, setCopied] = useState(false);
  const [stickerColor, setStickerColor] = useState('bg-slate-900');

  const recoveryUrl = `${window.location.origin}/?recovery_owner=${encodeURIComponent(userEmail)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(recoveryUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 block text-left"
        id="qr-tag-modal"
      >
        {/* Header toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-800 font-bold text-sm">
            <QrCode className="w-5 h-5 text-slate-700" />
            <span>Generate Valuables QR Recovery Sticker</span>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-700 transition-colors"
            id="close-qr-tag-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content detail */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed text-left">
            Print this unique recovery badge and sticker it to your laptop, keys, textbook or calculator. When found, a finder scans it to securely message you anonymously without reading your phone number.
          </p>

          {/* Sticker Preview */}
          <div className="flex justify-center p-4 bg-slate-100/50 rounded-2xl border border-slate-200/50">
            <div className={`w-64 p-4 rounded-xl text-white shadow-md flex flex-col items-center justify-between ${stickerColor} transition-colors`}>
              {/* Sticker Content */}
              <div className="w-full flex items-center justify-between border-b border-white/20 pb-2 mb-3">
                <span className="text-[10px] font-mono tracking-widest font-bold">LOSTLINK ID</span>
                <span className="text-[9px] font-sans font-semibold bg-white/20 px-2 py-0.5 rounded-full">SCAN TO RECOVER</span>
              </div>

              {/* Real dynamically generated QR code */}
              <div className="bg-white p-3.5 rounded-lg mb-3 shadow-inner relative flex flex-col items-center">
                <div className="w-32 h-32 bg-white flex items-center justify-center border-2 border-slate-950/20 rounded-md relative overflow-hidden">
                  <QRCodeSVG 
                    value={recoveryUrl} 
                    size={128} 
                    level="Q" 
                    fgColor="#0f172a" 
                  />
                  {/* Center Dot Badge overlay */}
                  <div className="absolute inset-0 m-auto w-8 h-8 bg-slate-950 rounded-md border-2 border-white flex items-center justify-center font-bold text-[9px] text-white shadow-sm">
                    LL
                  </div>
                </div>
              </div>

              <div className="text-center">
                <p className="text-[11px] font-semibold tracking-wide">If found, scan badge</p>
                <span className="text-[9px] text-white/60 font-mono block mt-0.5">Secure, non-public handover</span>
              </div>
            </div>
          </div>

          {/* Color Switcher */}
          <div className="flex items-center gap-1.5 justify-center">
            <span className="text-[11px] text-slate-400 font-mono">Sticker Theme:</span>
            {[
              { id: 'bg-slate-900', color: 'bg-slate-900' },
              { id: 'bg-indigo-900', color: 'bg-indigo-900' },
              { id: 'bg-emerald-900', color: 'bg-emerald-900' },
              { id: 'bg-red-950', color: 'bg-red-950' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setStickerColor(item.color)}
                className={`w-5 h-5 rounded-full border-2 ${item.color} ${
                  stickerColor === item.color ? 'border-slate-400 scale-110' : 'border-transparent'
                }`}
              />
            ))}
          </div>

          {/* Action Link bar */}
          <div className="p-3 bg-slate-50 border border-slate-200/50 rounded-xl space-y-1 text-left">
            <span className="text-[10px] text-slate-400 font-mono block">RECOVERY HANDSHAKE STATIC URL</span>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                readOnly
                value={recoveryUrl}
                className="flex-1 bg-white border border-slate-200 rounded-md px-2 py-1 text-[11px] font-mono text-slate-500 overflow-ellipsis"
              />
              <button
                onClick={handleCopy}
                className="p-1 px-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold flex items-center gap-1 shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <ClipboardCopy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Download Action Footer */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-50 text-slate-700 hover:bg-slate-100 text-xs font-semibold rounded-lg border border-slate-200 transition-all"
            >
              Close
            </button>
            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Copy Web Redirect Link</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
