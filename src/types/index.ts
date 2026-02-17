
import type { Timestamp } from 'firebase/firestore';

export type Player = {
  id: string; // Corresponds to Firebase Auth UID
  name: string;
  instagram?: string;
  groupSize: number;
  createdAt: Timestamp;
  eventId?: string;
  eventName?: string;
};

export type Game = {
  id: string;
  name: string;
  isActive: boolean;
};

export type Event = {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: Timestamp;
};

export type Score = {
  id:string;
  playerId: string;
  gameId: string;
  eventId: string;
  eventName: string;
  playerName: string;
  playerInstagram: string;
  gameName: string;
  scoreValue: number;
  level: number;
  submittedAt: Timestamp;
};

export type MediaConfig = {
    id: string;
    playlistId: string;
};

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export type Offer = {
  id: string;
  title: string;
  description: string;
  rewardType: 'food' | 'discount' | 'bonus_time';
  value: string;
  triggerType: 'random_drop' | 'highscore' | 'scheduled' | 'streak';
  startTime?: Timestamp;
  endTime?: Timestamp;
  daysOfWeek?: DayOfWeek[];
  recurringStartTime?: string; // "HH:mm"
  recurringEndTime?: string; // "HH:mm"
  isActive: boolean;
  createdAt: Timestamp;
};
