
"use client";
import { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, where, FirestoreError } from 'firebase/firestore';
import { useFirestore, FirestorePermissionError, errorEmitter } from '@/firebase';
import type { Event } from '@/types';

export function useEvents({ activeOnly = false }: { activeOnly?: boolean } = {}) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore) {
        setLoading(false);
        return;
    };

    const fetchEvents = async () => {
        setLoading(true);
        try {
            let q = query(collection(firestore, 'events'), orderBy('createdAt', 'desc'));
            if (activeOnly) {
                q = query(q, where('isActive', '==', true));
            }
            const querySnapshot = await getDocs(q);
            const eventsData: Event[] = [];
            querySnapshot.forEach((doc) => {
                eventsData.push({ id: doc.id, ...doc.data() } as Event);
            });
            setEvents(eventsData);
        } catch (error) {
            console.error("Error fetching events:", error);
            const contextualError = new FirestorePermissionError({
                path: 'events',
                operation: 'list',
            });
            errorEmitter.emit('permission-error', contextualError);
        } finally {
            setLoading(false);
        }
    };

    fetchEvents();
    
  }, [firestore, activeOnly]);

  return { events, loading };
}
