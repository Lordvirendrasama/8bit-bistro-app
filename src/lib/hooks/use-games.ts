"use client";
import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, FirestoreError } from 'firebase/firestore';
import { useFirestore, FirestorePermissionError, errorEmitter } from '@/firebase';
import type { Game } from '@/types';

export function useGames() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore) {
        setLoading(false);
        return;
    };
    const q = query(collection(firestore, 'games'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const gamesData: Game[] = [];
      querySnapshot.forEach((doc) => {
        const game = { id: doc.id, ...doc.data() } as Game;
        if (game.isActive) {
          gamesData.push(game);
        }
      });
      setGames(gamesData);
      setLoading(false);
    },
    (error: FirestoreError) => {
        const contextualError = new FirestorePermissionError({
            path: 'games',
            operation: 'list',
        });
        errorEmitter.emit('permission-error', contextualError);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore]);

  return { games, loading };
}
