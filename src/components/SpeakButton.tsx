import React, { useState, useEffect } from 'react';
import { Volume2, Square, Loader2, VolumeX } from 'lucide-react';
import { subscribeTTS, speakText, stopSpeaking } from '../services/ttsService';

interface SpeakButtonProps {
  id: string;
  text: string;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  label?: string;
}

export const SpeakButton: React.FC<SpeakButtonProps> = ({
  id,
  text,
  size = 'sm',
  className = '',
  label,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeTTS((state) => {
      setIsPlaying(state.playingId === id);
      setIsLoading(state.loadingId === id);
    });
    return () => unsubscribe();
  }, [id]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!text || text.trim().length === 0) return;
    if (isPlaying || isLoading) {
      stopSpeaking();
    } else {
      speakText(id, text);
    }
  };

  const sizeClasses = {
    xs: 'px-2 py-1 text-[10px] gap-1',
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-3 py-1.5 text-xs gap-2',
  }[size];

  return (
    <button
      onClick={handleClick}
      type="button"
      className={`inline-flex items-center rounded-xl font-mono transition-all duration-200 cursor-pointer shadow-sm active:scale-95 ${
        isPlaying
          ? 'bg-[#E64833] text-[#FBE9D0] border border-[#FBE9D0]/40 font-bold animate-pulse'
          : isLoading
          ? 'bg-[#244855] text-[#90AEAD] border border-[#90AEAD]/40 cursor-wait'
          : 'bg-[#244855] hover:bg-[#E64833] text-[#FBE9D0] border border-[#90AEAD]/40 hover:border-[#FBE9D0]/40'
      } ${sizeClasses} ${className}`}
      title={isPlaying ? 'Click to stop audio playback' : 'Click to hear audio readout'}
      aria-label={isPlaying ? 'Stop speaking' : 'Speak text aloud'}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E64833]" />
          <span>Generating...</span>
        </>
      ) : isPlaying ? (
        <>
          <Square className="w-3 h-3 fill-current text-[#FBE9D0]" />
          <span>{label || 'Speaking...'}</span>
        </>
      ) : (
        <>
          <Volume2 className="w-3.5 h-3.5 text-[#E64833] group-hover:text-[#FBE9D0] transition-colors" />
          <span>{label || 'Speak'}</span>
        </>
      )}
    </button>
  );
};
