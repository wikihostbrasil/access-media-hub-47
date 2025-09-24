import { create } from 'zustand';

interface AudioState {
  currentlyPlaying: string | null;
  isPlaying: boolean;
  setCurrentlyPlaying: (fileId: string | null) => void;
  setIsPlaying: (playing: boolean) => void;
  stopOthers: (currentFileId: string) => void;
}

export const useGlobalAudioPlayer = create<AudioState>((set, get) => ({
  currentlyPlaying: null,
  isPlaying: false,
  setCurrentlyPlaying: (fileId) => set({ currentlyPlaying: fileId }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  stopOthers: (currentFileId) => {
    const state = get();
    if (state.currentlyPlaying && state.currentlyPlaying !== currentFileId) {
      // Stop the previously playing audio
      const prevAudio = document.querySelector(`audio[data-file-id="${state.currentlyPlaying}"]`) as HTMLAudioElement;
      if (prevAudio) {
        prevAudio.pause();
        prevAudio.currentTime = 0;
      }
    }
    set({ currentlyPlaying: currentFileId, isPlaying: true });
  },
}));