export enum LoadingState {
  IDLE = 'IDLE',
  EXTRACTING_TEXT = 'EXTRACTING_TEXT',
  GENERATING_AUDIO = 'GENERATING_AUDIO',
  ERROR = 'ERROR'
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  speed: number;
}

export interface VoiceOption {
  name: string;
  label: string;
}

export interface HistoryItem {
  id: string;
  text: string;
  audioUrl: string | null;
  createdAt: number;
  preview: string;
  hasAudio?: boolean;
}