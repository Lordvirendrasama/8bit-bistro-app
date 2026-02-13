"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { useFirestore } from "@/firebase";
import type { Score } from "@/types";
import { Loader2, Crown } from "lucide-react";
import { useGames } from "@/lib/hooks/use-games";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function GameLeaderboard({ gameId }: { gameId: string }) {
  const [scores, setScores] = useState<Score[]>([]);
  const [loadingScores, setLoadingScores] = useState(true);
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore) return;

    const scoresQuery = query(
      collection(firestore, "scoreSubmissions"),
      where("gameId", "==", gameId),
      where("status", "==", "approved")
    );

    const unsubscribe = onSnapshot(scoresQuery, async (snapshot) => {
      const scoresData = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Score)
      );

      const topScores = scoresData
        .sort((a, b) => b.scoreValue - a.scoreValue)
        .slice(0, 10);

      setScores(topScores);
      setLoadingScores(false);
    });

    return () => unsubscribe();
  }, [firestore, gameId]);

  if (loadingScores) {
    return (
      <div className="flex justify-center items-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (scores.length === 0) {
    return (
      <p className="text-center text-foreground/80 pt-10">
        No approved scores yet. Be the first!
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
          <div className="text-2xl font-bold font-mono text-primary">
            {score.scoreValue.toLocaleString()}
          </div>
        </Card>
      ))}
    </div>
  );
}

function LeaderboardPage() {
  const { games, loading: loadingGames } = useGames();

  return (
    <div className="py-10">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1
          className="font-headline text-5xl sm:text-7xl text-center font-black text-primary uppercase tracking-wider mb-8"
        >
          Leaderboard
        </h1>

        {loadingGames && (
          <div className="flex justify-center items-center p-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        )}

        {!loadingGames && games.length === 0 && (
          <p className="text-center text-foreground text-xl mt-8">
            No active games for leaderboard.
          </p>
        )}

        {!loadingGames && games.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {games.map((game) => {
              if (game.name.toUpperCase() === "SPACE INVADERS") {
                return (
                  <div key={game.id}>
                    <Link href="/dashboard" className="block">
                      <h2 className="font-headline text-3xl sm:text-4xl text-center text-foreground mb-4 bg-primary/80 py-2 rounded-md shadow-lg hover:bg-primary transition-colors cursor-pointer">
                        {game.name}
                      </h2>
                    </Link>
                    {/* This empty space keeps the layout consistent with other leaderboards. */}
                    <p className="text-center text-transparent pt-10">
                        &nbsp;
                    </p>
                  </div>
                );
              }
              return (
                <div key={game.id}>
                  <h2 className="font-headline text-3xl sm:text-4xl text-center text-foreground mb-4 bg-primary/80 py-2 rounded-md shadow-lg">
                    {game.name}
                  </h2>
                  <GameLeaderboard gameId={game.id} />
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
