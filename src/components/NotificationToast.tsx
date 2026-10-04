import React, { useEffect } from 'react';
import { NotificationItem } from '../types';
import { X, Clock, Scroll, Sparkles } from 'lucide-react';

interface NotificationToastProps {
  toast: NotificationItem | null;
  onDismiss: () => void;
  onClick: (toast: NotificationItem) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  toast,
  onDismiss,
  onClick,
}) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 6000); // 6s auto dismiss
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const isUpcoming = toast.type === 'UPCOMING_BOOKING';
  const isWarden = toast.type === 'NEW_WARDEN_NOTE';

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-[#874F41] border-2 border-[#90AEAD] shadow-2xl rounded-sm p-4 text-[#FBE9D0] animate-in slide-in-from-bottom-3 duration-200">
      <div className="flex items-start justify-between gap-3">
        <div
          onClick={() => onClick(toast)}
          className="flex items-start gap-2.5 cursor-pointer flex-1"
        >
          <div
            className={`w-7 h-7 rounded-sm shrink-0 flex items-center justify-center mt-0.5 ${
              isUpcoming
                ? 'bg-emerald-500/20 text-emerald-300'
                : isWarden
                ? 'bg-[#E64833]/20 text-[#E64833]'
                : 'bg-amber-500/20 text-amber-300'
            }`}
          >
            {isUpcoming ? (
              <Clock className="w-4 h-4" />
            ) : isWarden ? (
              <Scroll className="w-4 h-4" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
          </div>

          <div>
            <div className="font-serif font-bold text-xs text-[#FBE9D0]">
              {toast.title}
            </div>
            <p className="text-[11px] text-[#FBE9D0]/85 mt-1 font-sans leading-snug line-clamp-2">
              {toast.message}
            </p>
            <span className="text-[9px] font-mono text-[#90AEAD] mt-1 block">
              Just now · Click to inspect
            </span>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="text-[#90AEAD] hover:text-[#FBE9D0] p-1 shrink-0 transition-colors"
          aria-label="Dismiss toast alert"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
