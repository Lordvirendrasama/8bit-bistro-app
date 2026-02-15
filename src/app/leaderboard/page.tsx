
"use client";

import { useState, useEffect, useMemo } from "react";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
} from "firebase/firestore";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { useFirestore } from "@/firebase";
import type { Score } from "@/types";
import { Loader2, Crown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// This component now just renders a list of scores passed to it.
function ScoreList({ scores }: { scores: Score[] }) {
  if (scores.length === 0) {
    return (
      <p className="text-center text-foreground/80 pt-10">
        No scores yet. Be the first!
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {scores.map((score, index) => (
        <Card key={score.id} className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarFallback>{score.playerName?.charAt(0) ?? 'A'}</AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-2">
              <div className="font-bold text-lg sm:text-xl">
                {score.playerName ?? "Anonymous"}
              </div>
              {index === 0 && (
                <Crown className="h-6 w-6 text-yellow-400" />
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold font-mono text-primary">
              {score.scoreValue.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground -mt-1">
              Level {score.level}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}


function LeaderboardPage() {
  const [allScores, setAllScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore) return;

    const scoresQuery = query(
      collection(firestore, "scoreSubmissions"),
      orderBy("scoreValue", "desc")
    );

    const unsubscribe = onSnapshot(scoresQuery, (snapshot) => {
      const scoresData = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Score)
      );
      setAllScores(scoresData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching scores: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore]);

  const groupedScores = useMemo(() => {
    return allScores.reduce((acc, score) => {
      const gameId = score.gameId;
      if (!acc[gameId]) {
        acc[gameId] = {
          gameName: score.gameName,
          scores: [],
        };
      }
      acc[gameId].scores.push(score);
      return acc;
    }, {} as Record<string, { gameName: string; scores: Score[] }>);
  }, [allScores]);
  
  const gameIdsWithScores = Object.keys(groupedScores);

  return (
    <div className="py-10">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1
          className="font-headline text-5xl sm:text-7xl text-center font-black text-primary uppercase tracking-wider mb-8"
        >
          8 Bit Leaderboard
        </h1>

        {loading && (
          <div className="flex justify-center items-center p-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        )}

        {!loading && gameIdsWithScores.length === 0 && (
          <p className="text-center text-foreground text-xl mt-8">
            No scores have been submitted yet.
          </p>
        )}

        {!loading && gameIdsWithScores.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {gameIdsWithScores.map((gameId) => {
              const gameData = groupedScores[gameId];
              return (
                <div key={gameId}>
                  <h2 className="font-headline text-3xl sm:text-4xl text-center text-foreground mb-4 bg-primary/80 py-2 rounded-md shadow-lg">
                    {gameData.gameName}
                  </h2>
                  <ScoreList scores={gameData.scores} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function GuardedLeaderboardPage() {
  return (
    <AuthGuard>
      <LeaderboardPage />
    </AuthGuard>
  );
}
