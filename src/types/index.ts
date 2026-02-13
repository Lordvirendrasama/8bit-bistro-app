import type { Timestamp } from 'firebase/firestore';

export type Player = {
  id: string; // Corresponds to Firebase Auth UID
  name: string;
  instagram?: string;
  groupSize: number;
  createdAt: Timestamp;
};

export type Game = {
  id: string;
  name: string;
  isActive: boolean;
};

export type Score = {
  id:string;
  playerId: string;
  gameId: string;
  playerName: string;
  playerInstagram: string;
  gameName: string;
  scoreValue: number;
  imageUrl?: string;
  submittedAt: Timestamp;
  isSuspicious?: boolean;
  suspicionReason?: string;
};
