// Lightweight audio coordinator ensuring only one voice over plays at a time across all cards

type AudioPauseCallback = () => void;
type AudioStopCallback = () => void;

interface ActivePlayer {
  id: string;
  pause: AudioPauseCallback;
  stop: AudioStopCallback;
}

let activePlayer: ActivePlayer | null = null;

export function registerActivePlayer(id: string, pause: AudioPauseCallback, stop: AudioStopCallback) {
  if (activePlayer && activePlayer.id !== id) {
    try {
      activePlayer.pause();
    } catch {
      // Ignore
    }
  }
  activePlayer = { id, pause, stop };
}

export function unregisterActivePlayer(id: string) {
  if (activePlayer && activePlayer.id === id) {
    activePlayer = null;
  }
}

export function stopAllActiveAudio() {
  if (activePlayer) {
    try {
      activePlayer.stop();
    } catch {
      // Ignore
    }
    activePlayer = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

