"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { useFirestore, FirestorePermissionError, errorEmitter } from "@/firebase";
import type { Score } from "@/types";
import { Loader2, Crown } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

export function OverallLeaderboard() {
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore) {
      setLoading(false);
      return;
    }

    const scoresQuery = query(
      collection(firestore, "scoreSubmissions"),
      orderBy("scoreValue", "desc")
    );

    const unsubscribe = onSnapshot(
      scoresQuery,
      (snapshot) => {
        const scoresData = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Score)
        );
        setScores(scoresData);
        setLoading(false);
      },
      (error) => {
        const contextualError = new FirestorePermissionError({
            path: 'scoreSubmissions',
            operation: 'list'
        });
        errorEmitter.emit('permission-error', contextualError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore]);

  return (
    <Card className="h-[700px] flex flex-col">
        <CardHeader className='flex-shrink-0'>
            <CardTitle className="font-headline text-2xl text-center">
            Top Players
            </CardTitle>
        </CardHeader>
        <CardContent className="flex-grow overflow-hidden p-0">
            {loading ? (
            <div className="flex justify-center items-center h-full p-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            ) : scores.length === 0 ? (
            <p className="text-center text-muted-foreground pt-4 px-4">
                No scores submitted yet.
            </p>
            ) : (
            <ScrollArea className="h-full">
                <div className="space-y-4 p-6 pt-0">
                    {scores.map((score, index) => (
                    <div
                        key={score.id}
                        className="flex items-center justify-between gap-4"
                    >
                        <div className="flex items-center gap-3 min-w-0">
                        {index === 0 ? (
                            <Crown className="h-6 w-6 text-yellow-400 flex-shrink-0" />
                        ) : (
                            <div className="w-6 text-center font-bold flex-shrink-0">
                            {index + 1}
                            </div>
                        )}
                        <Avatar className="h-8 w-8">
                            <AvatarFallback>
                            {score.playerName?.charAt(0) ?? "A"}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                            <div className="font-bold text-md truncate">
                            {score.playerName ?? "Anonymous"}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                            {score.gameName} - Lvl {score.level}
                            </div>
                        </div>
                        </div>
                        <div className="text-lg font-bold font-mono text-primary flex-shrink-0">
                        {score.scoreValue.toLocaleString()}
                        </div>
                    </div>
                    ))}
                </div>
            </ScrollArea>
            )}
        </CardContent>
    </Card>
  );
}
