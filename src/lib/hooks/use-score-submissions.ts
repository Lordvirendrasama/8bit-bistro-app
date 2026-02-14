"use client";
import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Score } from '@/types';

export function useScoreSubmissions() {
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore) {
        setLoading(false);
        return;
    };
    const q = query(collection(firestore, 'scoreSubmissions'), orderBy('submittedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const scoresData: Score[] = [];
      querySnapshot.forEach((doc) => {
        scoresData.push({ id: doc.id, ...doc.data() } as Score);
      });
      setScores(scoresData);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching score submissions: ", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore]);

  return { scores, loading };
}
