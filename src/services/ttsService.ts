/**
 * On-Demand Text-To-Speech (TTS) Service
 * Communicates with backend /api/tts endpoint (ElevenLabs API)
 * with seamless Web Speech API fallback for zero-downtime audio playback.
 */

export interface TTSState {
  playingId: string | null;
  loadingId: string | null;
}

type Listener = (state: TTSState) => void;

let currentAudio: HTMLAudioElement | null = null;
let currentBlobUrl: string | null = null;
let currentUtterance: SpeechSynthesisUtterance | null = null;

let playingId: string | null = null;
let loadingId: string | null = null;

const listeners: Set<Listener> = new Set();

export function subscribeTTS(listener: Listener): () => void {
  listeners.add(listener);
  listener({ playingId, loadingId });
  return () => {
    listeners.delete(listener);
  };
}

function notify() {
  listeners.forEach((l) => l({ playingId, loadingId }));
}

export function stopSpeaking() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  if (currentBlobUrl) {
    URL.revokeObjectURL(currentBlobUrl);
    currentBlobUrl = null;
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }
  playingId = null;
  loadingId = null;
  notify();
}

/**
 * On-demand audio playback trigger
 */
export async function speakText(id: string, textToSpeak: string) {
  // If already playing this exact item, stop playback
  if (playingId === id) {
    stopSpeaking();
    return;
  }

  // Stop any other currently playing audio
  stopSpeaking();

  loadingId = id;
  notify();

  // Sanitize text for crisp speech
  const cleanText = textToSpeak
    .replace(/[""']/g, '')
    .replace(/^[—\-]\s*/, '')
    .replace(/\(.*?\)/g, '')
    .trim();

  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: cleanText }),
    });

    const contentType = res.headers.get('Content-Type') || '';

    if (res.ok && contentType.includes('audio/mpeg')) {
      const blob = await res.blob();
      currentBlobUrl = URL.createObjectURL(blob);
      currentAudio = new Audio(currentBlobUrl);

      currentAudio.onended = () => {
        stopSpeaking();
      };
      currentAudio.onerror = () => {
        speakWebSpeech(id, cleanText);
      };

      await currentAudio.play();
      playingId = id;
      loadingId = null;
      notify();
      return;
    }

    // Fallback if API returned json fallback flag or non-audio
    speakWebSpeech(id, cleanText);
  } catch (err) {
    console.warn('Network issue reaching /api/tts, invoking Web Speech API:', err);
    speakWebSpeech(id, cleanText);
  }
}

function speakWebSpeech(id: string, text: string) {
  if (!('speechSynthesis' in window)) {
    console.warn('SpeechSynthesis is not supported in this browser environment.');
    loadingId = null;
    notify();
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 0.92;

  const voices = window.speechSynthesis.getVoices();
  const maleOrDeepVoice = voices.find(
    (v) =>
      v.lang.startsWith('en') &&
      (v.name.toLowerCase().includes('male') ||
        v.name.toLowerCase().includes('david') ||
        v.name.toLowerCase().includes('daniel') ||
        v.name.toLowerCase().includes('google uk english male') ||
        v.name.toLowerCase().includes('natural'))
  );

  if (maleOrDeepVoice) {
    utterance.voice = maleOrDeepVoice;
  }

  utterance.onstart = () => {
    playingId = id;
    loadingId = null;
    notify();
  };

  utterance.onend = () => {
    stopSpeaking();
  };

  utterance.onerror = () => {
    stopSpeaking();
  };

  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}
