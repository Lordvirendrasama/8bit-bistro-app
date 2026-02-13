"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";

import { AuthGuard } from "@/components/auth/AuthGuard";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/firebase";
import type { Game, Score, Player } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Crown } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function Leaderboard() {
  const [games, setGames] = useState<Game[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "games"), where("isActive", "==", true));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const gamesData: Game[] = [];
      querySnapshot.forEach((doc) => {
        gamesData.push({ id: doc.id, ...doc.data() } as Game);
      });
      setGames(gamesData);
      setLoadingGames(false);
    });

    return () => unsubscribe();
  }, []);

  if (loadingGames) {
    return (
      <div className="flex justify-center items-center p-10">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (games.length === 0) {
    return (
        <Card>
            <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No active games for leaderboard.</p>
            </CardContent>
        </Card>
    )
  }

  return (
    <Tabs defaultValue={games[0]?.id} className="w-full">
      <TabsList className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => (
          <TabsTrigger key={game.id} value={game.id} className="font-headline">
            {game.name}
          </TabsTrigger>
        ))}
      </TabsList>
      {games.map((game) => (
        <TabsContent key={game.id} value={game.id}>
          <GameLeaderboard gameId={game.id} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

type EnrichedScore = Score & { player?: Player };

function GameLeaderboard({ gameId }: { gameId: string }) {
  const [scores, setScores] = useState<EnrichedScore[]>([]);
  const [loadingScores, setLoadingScores] = useState(true);

  useEffect(() => {
    const scoresQuery = query(
      collection(db, "scores"),
      where("gameName", "==", gameId),
      where("status", "==", "approved"),
      orderBy("scoreValue", "desc"),
      limit(10)
    );

    const unsubscribe = onSnapshot(scoresQuery, async (snapshot) => {
      const scoresData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Score));
      
      const playerIds = [...new Set(scoresData.map(score => score.playerId))];
      const playersMap = new Map<string, Player>();

      if(playerIds.length > 0) {
        const playerChunks = [];
        for (let i = 0; i < playerIds.length; i += 10) {
            playerChunks.push(playerIds.slice(i, i + 10));
        }
        
        for (const chunk of playerChunks) {
            const playersQuery = query(collection(db, "players"), where('__name__', 'in', chunk));
            const playerSnapshots = await onSnapshot(playersQuery, (playerSnapshot) => {
                 playerSnapshot.docs.forEach(doc => {
                    playersMap.set(doc.id, { id: doc.id, ...doc.data() } as Player);
                });
            });
        }
      }

      const enrichedScores = scoresData.map(score => ({
        ...score,
        player: playersMap.get(score.playerId)
      }));

      setScores(enrichedScores);
      setLoadingScores(false);
    });

    return () => unsubscribe();
  }, [gameId]);

  if (loadingScores) {
    return (
      <div className="flex justify-center items-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (scores.length === 0) {
    return (
      <p className="text-center text-muted-foreground pt-10">
        No approved scores yet. Be the first!
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {scores.map((score, index) => (
        <Card key={score.id} className={`p-4 flex items-center justify-between gap-4 ${index === 0 ? 'border-primary border-2 shadow-lg shadow-primary/20' : ''}`}>
          <div className="flex items-center gap-4">
            <div className="text-2xl font-bold w-8 text-center text-muted-foreground">{index + 1}</div>
            <Avatar>
                <AvatarFallback>{score.player?.name?.charAt(0) ?? '?'}</AvatarFallback>
            </Avatar>
            <div>
                <div className="font-bold flex items-center gap-2">
                    {score.player?.name ?? 'Anonymous'}
                    {index === 0 && <Crown className="h-5 w-5 text-yellow-400" />}
                </div>
                <div className="text-sm text-muted-foreground">{score.player?.instagram}</div>
            </div>
          </div>
          <div className="text-xl md:text-2xl font-bold font-mono text-primary">{score.scoreValue.toLocaleString()}</div>
        </Card>
      ))}
    </div>
  );
}

function LeaderboardPage() {
  return (
    <>
      <Header />
      <div className="container mx-auto max-w-4xl p-4">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-3xl">
              Live Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Leaderboard />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default function GuardedLeaderboardPage() {
  return (
    <AuthGuard>
      <LeaderboardPage />
    </AuthGuard>
  );
}
