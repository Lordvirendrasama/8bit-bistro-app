"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  collection,
  query,
  orderBy,
} from "firebase/firestore";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import type { Score, Game, Event } from "@/types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NewScoreAnnouncement } from "@/components/leaderboard/NewScoreAnnouncement";


function LeaderboardPage() {
  const firestore = useFirestore();
  const [selectedEventId, setSelectedEventId] = useState<string>('all');

  // Live Announcement State
  const [latestScore, setLatestScore] = useState<Score | null>(null);
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const previousScoresRef = useRef<Score[] | null>(null);


  const gamesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "games"));
  }, [firestore]);
  const { data: games, isLoading: loadingGames } = useCollection<Game>(gamesQuery);

  const eventsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "events"), orderBy("createdAt", "desc"));
  }, [firestore]);
  const { data: events, isLoading: loadingEvents } = useCollection<Event>(eventsQuery);

  const scoresQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // Order by submission time to easily find the newest score
    return query(
      collection(firestore, "scoreSubmissions"),
      orderBy("submittedAt", "desc")
    );
  }, [firestore]);
  const { data: allScores, isLoading: loadingScores } = useCollection<Score>(scoresQuery);

  // Effect to detect and announce new scores
  useEffect(() => {
    if (allScores && !loadingScores) {
      // On initial load, just set the reference and don't show any announcement.
      if (previousScoresRef.current === null) {
        previousScoresRef.current = allScores;
        return;
      }

      // Only announce if a new score has been *added*.
      if (allScores.length > previousScoresRef.current.length) {
        // The newest score is the first in the list because of the query's `orderBy`.
        const newScore = allScores[0];
        
        // A final check to ensure this score wasn't in the previous list at all
        const isTrulyNew = !previousScoresRef.current.find(s => s.id === newScore.id);
        
        if (isTrulyNew) {
            setLatestScore(newScore);
            setShowAnnouncement(true);
            const timer = setTimeout(() => {
              setShowAnnouncement(false);
            }, 4000); // Hide after 4 seconds
    
            // Cleanup the timer if the component unmounts or effect re-runs
            return () => clearTimeout(timer);
        }
      }
      
      // Update the reference for the next render.
      previousScoresRef.current = allScores;
    }
  }, [allScores, loadingScores]);


  const rankedGames = useMemo(() => {
    const gameNameMap = (games || []).reduce((acc, game) => {
      acc[game.id] = game.name;
      return acc;
    }, {} as Record<string, string>);

    const filteredScores = selectedEventId === 'all'
      ? (allScores || [])
      : (allScores || []).filter(score => score.eventId === selectedEventId);

    const scoresByGame = filteredScores.reduce((acc, score) => {
      const gameId = score.gameId;
      if (!acc[gameId]) {
        const currentGameName = gameNameMap[gameId] || score.gameName;
        acc[gameId] = {
          gameName: currentGameName,
          scores: [],
        };
      }
      acc[gameId].scores.push(score);
      return acc;
    }, {} as Record<string, { gameName: string; scores: Score[] }>);

    return Object.values(scoresByGame).map((gameData) => {
      if (!gameData.gameName) return null;
      
      const scoresByPlayer = gameData.scores.reduce((acc, score) => {
        if (!acc[score.playerId]) {
          acc[score.playerId] = [];
        }
        acc[score.playerId].push(score);
        return acc;
      }, {} as Record<string, Score[]>);

      const rankedPlayers = Object.values(scoresByPlayer)
        .map((playerScores) => {
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
        .sort((a, b) => b.bestScore.scoreValue - a.bestScore.scoreValue);

      return {
        gameName: gameData.gameName,
        rankedPlayers: rankedPlayers,
      };
    }).filter((game): game is NonNullable<typeof game> => game !== null);
  }, [allScores, games, selectedEventId]);
  
  const isLoading = loadingGames || loadingScores || loadingEvents;

  return (
    <>
      <NewScoreAnnouncement score={latestScore} show={showAnnouncement} />
      <div className="py-10">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
              <h1 className="font-headline text-4xl sm:text-6xl text-center font-black text-primary uppercase tracking-wider">
              Leaderboard
              </h1>
              <div className="w-full sm:w-auto min-w-[200px]">
                  <Select onValueChange={setSelectedEventId} defaultValue="all">
                      <SelectTrigger>
                          <SelectValue placeholder="Filter by event" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="all">All Events</SelectItem>
                          {events?.map((event) => (
                              <SelectItem key={event.id} value={event.id}>
                                  {event.name}
                              </SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
              </div>
          </div>


          {isLoading && (
            <div className="flex justify-center items-center p-10">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          )}

          {!isLoading && rankedGames.length === 0 && (
            <p className="text-center text-foreground text-xl mt-8">
              No scores have been submitted for this event yet.
            </p>
          )}

          {!isLoading && rankedGames.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
