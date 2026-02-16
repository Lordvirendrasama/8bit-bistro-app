import type { Timestamp } from 'firebase/firestore';

export type Player = {
  id: string; // Corresponds to Firebase Auth UID
  name: string;
  instagram?: string;
  groupSize: number;
  createdAt: Timestamp;
  eventId: string;
};

export type Game = {
  id: string;
  name: string;
  isActive: boolean;
};

export type Event = {
  id: string;
  name: string;
  createdAt: Timestamp;
};

export type Score = {
  id:string;
  playerId: string;
  gameId: string;
  eventId: string;
  playerName: string;
  playerInstagram: string;
  gameName: string;
  eventName: string;
  scoreValue: number;
  level: number;
  submittedAt: Timestamp;
};

    