
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
import type { Score, Game } from "@/types";
import { Loader2, Crown, ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function LeaderboardPage() {
  const [allScores, setAllScores] = useState<Score[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore) {
      setLoading(false);
      return;
    }

    setLoading(true);
    let loadingCount = 2; // We are waiting for 2 fetches: scores and games
    const doneLoading = () => {
      loadingCount--;
      if (loadingCount === 0) {
        setLoading(false);
      }
    };

    // 1. Fetch all scores
    const scoresQuery = query(
      collection(firestore, "scoreSubmissions"),
      orderBy("scoreValue", "desc")
    );
    const unsubscribeScores = onSnapshot(
      scoresQuery,
      (snapshot) => {
        const scoresData = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Score)
        );
        setAllScores(scoresData);
        doneLoading();
      },
      (error) => {
        console.error("Error fetching scores: ", error);
        doneLoading();
      }
    );

    // 2. Fetch all games
    const gamesQuery = query(collection(firestore, "games"));
    const unsubscribeGames = onSnapshot(
      gamesQuery,
      (snapshot) => {
        const gamesData = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Game)
        );
        setGames(gamesData);
        doneLoading();
      },
      (error) => {
        console.error("Error fetching games: ", error);
        doneLoading();
      }
    );


    return () => {
      unsubscribeScores();
      unsubscribeGames();
    };
  }, [firestore]);

  const rankedGames = useMemo(() => {
    // Create a map of game IDs to their current names for quick lookup.
    const gameNameMap = games.reduce((acc, game) => {
      acc[game.id] = game.name;
      return acc;
    }, {} as Record<string, string>);

    // Group all scores by their game ID
    const scoresByGame = allScores.reduce((acc, score) => {
      const gameId = score.gameId;
      if (!acc[gameId]) {
        // Use the current game name from the map, or fall back to the score's stored name
        // if the game has been deleted.
        const currentGameName = gameNameMap[gameId] || score.gameName;
        acc[gameId] = {
          gameName: currentGameName,
          scores: [],
        };
      }
      acc[gameId].scores.push(score);
      return acc;
    }, {} as Record<string, { gameName: string; scores: Score[] }>);

    // Process each game to rank players
    return Object.values(scoresByGame).map((gameData) => {
      if (!gameData.gameName) return null; // Don't show games without a name
      
      // Group scores within a game by player ID
      const scoresByPlayer = gameData.scores.reduce((acc, score) => {
        if (!acc[score.playerId]) {
          acc[score.playerId] = [];
        }
        acc[score.playerId].push(score);
        return acc;
      }, {} as Record<string, Score[]>);

      // Create a ranked list of players for the game
      const rankedPlayers = Object.values(scoresByPlayer)
        .map((playerScores) => {
          // Sort a player's scores to find their best one
          const sortedPlayerScores = [...playerScores].sort(
            (a, b) => b.scoreValue - a.scoreValue
          );
          const bestScore = sortedPlayerScores[0];
          return {
            playerId: bestScore.playerId,
            playerName: bestScore.playerName,
            bestScore: bestScore,
            allScores: sortedPlayerScores,
          };
        })
        // Sort all players by their best score to determine rank
        .sort((a, b) => b.bestScore.scoreValue - a.bestScore.scoreValue);

      return {
        gameName: gameData.gameName,
        rankedPlayers: rankedPlayers,
      };
    }).filter((game): game is NonNullable<typeof game> => game !== null);
  }, [allScores, games]);

  return (
    <div className="py-10">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="font-headline text-4xl sm:text-6xl text-center font-black text-primary uppercase tracking-wider mb-8">
          8 Bit Leaderboard
        </h1>

        {loading && (
          <div className="flex justify-center items-center p-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        )}

        {!loading && rankedGames.length === 0 && (
          <p className="text-center text-foreground text-xl mt-8">
            No scores have been submitted yet.
          </p>
        )}

        {!loading && rankedGames.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {rankedGames.map((gameData, gameIndex) => {
              if (!gameData || gameData.rankedPlayers.length === 0) return null;
              return (
                <div key={gameData.gameName}>
                  <h2 className={cn(
                    "font-headline text-2xl sm:text-3xl text-center text-foreground mb-4 py-2 rounded-md shadow-lg",
                    gameIndex % 2 === 0 ? "bg-primary/80" : "bg-accent/80"
                  )}>
                    {gameData.gameName}
                  </h2>
                  <div className="space-y-4">
                    {gameData.rankedPlayers.map((playerEntry, playerIndex) => {
                      const rank = playerIndex + 1;
                      const hasMultipleScores = playerEntry.allScores.length > 1;

                      return (
                        <Collapsible key={playerEntry.playerId}>
                          <Card>
                            <div className="flex items-center gap-2 p-3 sm:p-4">
                              {/* Ranking, Avatar, and Name */}
                              <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                                <div className="w-8 flex-shrink-0 text-center text-xl font-bold">
                                  {rank}
                                </div>
                                <Avatar className="h-9 w-9 sm:h-10 sm:w-10">
                                  <AvatarFallback>
                                    {playerEntry.playerName?.charAt(0) ?? "A"}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex min-w-0 items-center gap-2">
                                  <div className="truncate font-bold text-base sm:text-lg">
                                    {playerEntry.playerName ?? "Anonymous"}
                                  </div>
                                  {rank === 1 && (
                                    <Crown className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 text-yellow-400" />
                                  )}
                                </div>
                              </div>
                              {/* Best Score */}
                              <div className="text-right">
                                <div className={cn(
                                    "text-lg font-bold font-mono sm:text-xl md:text-2xl",
                                    gameIndex % 2 === 0 ? "text-primary" : "text-accent"
                                )}>
                                  {playerEntry.bestScore.scoreValue.toLocaleString()}
                                </div>
                                <div className="text-xs text-muted-foreground -mt-1">
                                  Level {playerEntry.bestScore.level}
                                </div>
                              </div>
                              {/* Dropdown Trigger */}
                              {hasMultipleScores && (
                                <CollapsibleTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 flex-shrink-0 [&[data-state=open]>svg]:rotate-180"
                                  >
                                    <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                                  </Button>
                                </CollapsibleTrigger>
                              )}
                            </div>

                            {/* Collapsible Content for Other Scores */}
                            {hasMultipleScores && (
                              <CollapsibleContent>
                                <div className="space-y-2 border-t px-4 pb-4 pt-2">
                                  {playerEntry.allScores
                                    .slice(1)
                                    .map((score) => (
                                      <div
                                        key={score.id}
                                        className="flex items-center justify-between pl-10 sm:pl-12 text-sm"
                                      >
                                        <span className="text-muted-foreground">
                                          Level {score.level}
                                        </span>
                                        <span className="font-mono">
                                          {score.scoreValue.toLocaleString()}
                                        </span>
                                      </div>
                                    ))}
                                </div>
                              </CollapsibleContent>
                            )}
                          </Card>
                        </Collapsible>
                      );
                    })}
                  </div>
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
