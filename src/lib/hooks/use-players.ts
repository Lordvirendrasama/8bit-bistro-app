"use client";
import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Player } from '@/types';

export function usePlayers() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore) {
        setLoading(false);
        return;
    };
    const q = query(collection(firestore, 'players'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const playersData: Player[] = [];
      querySnapshot.forEach((doc) => {
        playersData.push({ id: doc.id, ...doc.data() } as Player);
      });
      setPlayers(playersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore]);

  return { players, loading };
}
