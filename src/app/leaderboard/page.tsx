"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { useFirestore } from "@/firebase";
import type { Score } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Crown, User } from "lucide-react";
import { useGames } from "@/lib/hooks/use-games";

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
        <div key={score.id} className="flex items-stretch gap-2 sm:gap-4">
          <div className="border-4 border-primary p-1 bg-black">
            <div className="bg-muted w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
              <User
                className="h-8 w-8 sm:h-12 sm:w-12 text-foreground"
                strokeWidth={3}
              />
            </div>
          </div>

          <div className="flex-1 border-4 border-primary p-1 bg-black">
            <div className="h-full flex justify-between items-center px-2 sm:px-4 bg-card">
              <div className="flex items-center gap-2">
                <div className="font-bold text-lg sm:text-2xl text-foreground">
                  {score.playerName ?? "Anonymous"}
                </div>
                {index === 0 && (
                  <Crown className="h-5 w-5 sm:h-6 sm:h-6 text-yellow-400" />
                )}
              </div>
              <div className="text-xl sm:text-3xl font-bold font-mono text-secondary">
                {score.scoreValue.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function LeaderboardPage() {
  const { games, loading: loadingGames } = useGames();

  return (
    <div className="min-h-screen pt-10 pb-10">
      <div className="container mx-auto max-w-4xl p-4">
        <h1
          className="font-headline text-5xl sm:text-7xl text-center font-black text-secondary uppercase tracking-wider mb-2"
          style={{ textShadow: "4px 4px 0px hsl(var(--secondary-foreground))" }}
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
          <Tabs defaultValue={games[0]?.id} className="w-full mt-8">
            <TabsList className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3 bg-black/50 border-2 border-primary">
              {games.map((game) => (
                <TabsTrigger
                  key={game.id}
                  value={game.id}
                  className="font-headline text-lg data-[state=active]:bg-primary/80 data-[state=active]:text-primary-foreground"
                >
                  {game.name}
                </TabsTrigger>
              ))}
            </TabsList>
            {games.map((game) => (
              <TabsContent key={game.id} value={game.id} className="mt-6">
                <GameLeaderboard gameId={game.id} />
              </TabsContent>
            ))}
          </Tabs>
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
