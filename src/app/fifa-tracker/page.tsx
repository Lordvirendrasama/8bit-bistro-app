
"use client";

import { useState, useMemo, useEffect } from "react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { useAuth } from "@/hooks/use-auth";
import { collection, query, orderBy, addDoc, serverTimestamp, updateDoc, doc, limit, deleteDoc, getDocs, where } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePlayers } from "@/lib/hooks/use-players";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Loader2, Trophy, History, UserPlus, PlayCircle, StopCircle, Calendar, MoreVertical, Edit, Trash2, Users, AlertCircle, ExternalLink, Hash } from "lucide-react";
import type { Player, FifaMatch, FifaSession } from "@/types";
import { format, formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function FifaTrackerPage() {
  const firestore = useFirestore();
  const { user, isAdmin } = useAuth();
  const { players, loading: playersLoading } = usePlayers();
  const { toast } = useToast();

  const [player1Id, setPlayer1Id] = useState("");
  const [player1bId, setPlayer1bId] = useState("");
  const [player2Id, setPlayer2Id] = useState("");
  const [player2bId, setPlayer2bId] = useState("");
  
  const [player1Team, setPlayer1Team] = useState("");
  const [player2Team, setPlayer2Team] = useState("");
  const [player1Score, setPlayer1Score] = useState("");
  const [player2Score, setPlayer2Score] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Session Management
  const [isSessionActionLoading, setIsSessionActionLoading] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Fetch recent sessions (simplified to avoid composite index requirement)
  const recentSessionsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "fifaSessions"), orderBy("startTime", "desc"), limit(20));
  }, [firestore]);
  const { data: recentSessions, error: sessionsError } = useCollection<FifaSession>(recentSessionsQuery);

  // Filter for truly "active" sessions (those without an endTime) client-side
  const activeSessions = useMemo(() => {
    return (recentSessions || []).filter(s => !s.endTime).slice(0, 4);
  }, [recentSessions]);

  // Fetch all matches
  const matchesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "fifaMatches"), orderBy("timestamp", "desc"));
  }, [firestore]);
  const { data: allMatches, isLoading: matchesLoading, error: matchesError } = useCollection<FifaMatch>(matchesQuery);

  // Automatically select the first active session if none selected
  useEffect(() => {
    if (activeSessions && activeSessions.length > 0 && !activeSessionId) {
      setActiveSessionId(activeSessions[0].id);
    } else if (activeSessions && activeSessions.length === 0) {
      setActiveSessionId(null);
    }
  }, [activeSessions, activeSessionId]);

  const activeSession = activeSessions?.find(s => s.id === activeSessionId) || null;

  // Player Memory for current session
  const sessionPlayerIds = useMemo(() => {
    if (!activeSessionId || !allMatches) return new Set<string>();
    const ids = new Set<string>();
    allMatches
      .filter(m => m.sessionId === activeSessionId)
      .forEach(m => {
        ids.add(m.player1Id);
        if (m.player1bId) ids.add(m.player1bId);
        ids.add(m.player2Id);
        if (m.player2bId) ids.add(m.player2bId);
      });
    return ids;
  }, [allMatches, activeSessionId]);

  const sessionPlayers = useMemo(() => {
    return players.filter(p => sessionPlayerIds.has(p.id));
  }, [players, sessionPlayerIds]);

  const otherPlayers = useMemo(() => {
    return players.filter(p => !sessionPlayerIds.has(p.id));
  }, [players, sessionPlayerIds]);

  // Edit Match State
  const [editingMatch, setEditingMatch] = useState<FifaMatch | null>(null);
  const [editScore1, setEditScore1] = useState("");
  const [editScore2, setEditScore2] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // New Player Form State
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerInstagram, setNewPlayerInstagram] = useState("");
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);

  const handleStartSession = async () => {
    if (!firestore) return;
    if (activeSessions && activeSessions.length >= 4) {
      toast({ variant: "destructive", title: "Limit Reached", description: "You can only have 4 simultaneous active sessions." });
      return;
    }

    setIsSessionActionLoading(true);
    try {
      const allSessionsSnap = await getDocs(collection(firestore, "fifaSessions"));
      const nextNumber = allSessionsSnap.size + 1;
      
      const newSessionRef = await addDoc(collection(firestore, "fifaSessions"), {
        name: `8 Bit Session ${nextNumber}`,
        startTime: serverTimestamp(),
        endTime: null,
        createdBy: user?.uid || 'public'
      });
      setActiveSessionId(newSessionRef.id);
      toast({ title: "Session Started", description: `"${`8 Bit Session ${nextNumber}`}" is now active.` });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error", description: "Failed to start session." });
    } finally {
      setIsSessionActionLoading(false);
    }
  };

  const handleEndSession = async (sessionId: string) => {
    if (!firestore) return;
    setIsSessionActionLoading(true);
    try {
      await updateDoc(doc(firestore, "fifaSessions", sessionId), {
        endTime: serverTimestamp()
      });
      toast({ title: "Session Ended", description: "Competition finalized." });
      if (activeSessionId === sessionId) {
          setActiveSessionId(null);
      }
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error", description: "Failed to end session." });
    } finally {
      setIsSessionActionLoading(false);
    }
  };

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !newPlayerName.trim()) return;

    setIsAddingPlayer(true);
    try {
      await addDoc(collection(firestore, "players"), {
        name: newPlayerName.trim(),
        instagram: newPlayerInstagram.trim(),
        groupSize: 1,
        createdAt: serverTimestamp(),
      });
      toast({ title: "Player Added", description: `${newPlayerName} is now in the system.` });
      setNewPlayerName("");
      setNewPlayerInstagram("");
      setIsAddPlayerOpen(false);
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error", description: "Could not add player." });
    } finally {
      setIsAddingPlayer(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !player1Id || !player2Id || !player1Score || !player2Score) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Please fill out at least one player per team." });
      return;
    }

    if (player1Id === player2Id) {
      toast({ variant: "destructive", title: "Invalid Match", description: "A player cannot play against themselves." });
      return;
    }

    setIsSubmitting(true);
    const p1 = players.find(p => p.id === player1Id);
    const p1b = player1bId && player1bId !== "none" ? players.find(p => p.id === player1bId) : null;
    const p2 = players.find(p => p.id === player2Id);
    const p2b = player2bId && player2bId !== "none" ? players.find(p => p.id === player2bId) : null;

    try {
      await addDoc(collection(firestore, "fifaMatches"), {
        sessionId: activeSessionId || null,
        sessionName: activeSession?.name || null,
        player1Id,
        player1Name: p1?.name || "Unknown",
        player1bId: p1b?.id || null,
        player1bName: p1b?.name || null,
        player1Team,
        player1Score: Number(player1Score),
        player2Id,
        player2Name: p2?.name || "Unknown",
        player2bId: p2b?.id || null,
        player2bName: p2b?.name || null,
        player2Team,
        player2Score: Number(player2Score),
        timestamp: serverTimestamp(),
      });

      toast({ title: "Match Recorded!", description: "The score has been updated." });
      setPlayer1Score("");
      setPlayer2Score("");
      setPlayer1Team("");
      setPlayer2Team("");
      setPlayer1Id("");
      setPlayer1bId("");
      setPlayer2Id("");
      setPlayer2bId("");
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error", description: "Could not save match." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (!firestore || !isAdmin) return;
    if (!confirm("Are you sure you want to delete this match?")) return;

    try {
      await deleteDoc(doc(firestore, "fifaMatches", matchId));
      toast({ title: "Match Deleted" });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error", description: "Failed to delete match." });
    }
  };

  const handleUpdateMatch = async () => {
    if (!firestore || !editingMatch || !isAdmin) return;

    setIsUpdating(true);
    try {
      await updateDoc(doc(firestore, "fifaMatches", editingMatch.id), {
        player1Score: Number(editScore1),
        player2Score: Number(editScore2),
      });
      toast({ title: "Match Updated" });
      setEditingMatch(null);
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error", description: "Failed to update match." });
    } finally {
      setIsUpdating(false);
    }
  };

  const calculateStats = (matchesToProcess: FifaMatch[]) => {
    const stats: Record<string, { name: string; wins: number; draws: number; losses: number; gf: number; ga: number; points: number }> = {};

    matchesToProcess.forEach(m => {
      const team1 = [{ id: m.player1Id, name: m.player1Name }];
      if (m.player1bId) team1.push({ id: m.player1bId, name: m.player1bName! });

      const team2 = [{ id: m.player2Id, name: m.player2Name }];
      if (m.player2bId) team2.push({ id: m.player2bId, name: m.player2bName! });

      team1.forEach(p => {
        if (!stats[p.id]) stats[p.id] = { name: p.name, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, points: 0 };
        stats[p.id].gf += m.player1Score;
        stats[p.id].ga += m.player2Score;
        if (m.player1Score > m.player2Score) {
          stats[p.id].wins += 1;
          stats[p.id].points += 3;
        } else if (m.player1Score === m.player2Score) {
          stats[p.id].draws += 1;
          stats[p.id].points += 1;
        } else {
          stats[p.id].losses += 1;
        }
      });

      team2.forEach(p => {
        if (!stats[p.id]) stats[p.id] = { name: p.name, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, points: 0 };
        stats[p.id].gf += m.player2Score;
        stats[p.id].ga += m.player1Score;
        if (m.player2Score > m.player1Score) {
          stats[p.id].wins += 1;
          stats[p.id].points += 3;
        } else if (m.player2Score === m.player1Score) {
          stats[p.id].draws += 1;
          stats[p.id].points += 1;
        } else {
          stats[p.id].losses += 1;
        }
      });
    });

    return Object.values(stats).sort((a, b) => b.points - a.points || (b.gf - b.ga) - (a.gf - a.ga));
  };

  const globalStats = useMemo(() => calculateStats(allMatches || []), [allMatches]);
  const sessionStats = useMemo(() => {
      if (!activeSessionId || !allMatches) return [];
      return calculateStats(allMatches.filter(m => m.sessionId === activeSessionId));
  }, [allMatches, activeSessionId]);

  if (playersLoading || matchesLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const PlayerSelect = ({ id, value, onValueChange, placeholder }: { id: string, value: string, onValueChange: (v: string) => void, placeholder: string }) => (
    <Select onValueChange={onValueChange} value={value}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {sessionPlayers.length > 0 && (
          <div className="p-2 text-[10px] font-bold text-primary uppercase tracking-wider bg-primary/5">In-Session Players</div>
        )}
        {sessionPlayers.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
        {otherPlayers.length > 0 && sessionPlayers.length > 0 && (
          <div className="p-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-t">Other Players</div>
        )}
        {otherPlayers.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
      </SelectContent>
    </Select>
  );

  return (
    <div className="container mx-auto p-4 pt-10 max-w-6xl">
      {(sessionsError || matchesError) && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>System Notice</AlertTitle>
          <AlertDescription>
            <p className="mb-2">{sessionsError?.message || matchesError?.message || "There was an issue fetching data."}</p>
            {sessionsError?.message.includes('index') && (
              <Button asChild variant="outline" size="sm" className="mt-2 bg-destructive/10 border-destructive/20 hover:bg-destructive/20">
                <a href="https://console.firebase.google.com/u/0/project/_/firestore/indexes" target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 h-3 w-3" /> Create Required Index
                </a>
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Session Management */}
      <div className="mb-8 space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="font-headline text-2xl flex items-center gap-2">
                <PlayCircle className="text-primary" /> Active Sessions
            </h2>
            {(!activeSessions || activeSessions.length < 4) && (
                <Button onClick={handleStartSession} disabled={isSessionActionLoading} size="sm">
                    {isSessionActionLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <PlayCircle className="mr-2 h-4 w-4" />}
                    Start New Session
                </Button>
            )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {activeSessions?.map(s => (
                <Card key={s.id} className={`cursor-pointer transition-all border-2 ${activeSessionId === s.id ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-muted hover:border-primary/50'}`} onClick={() => setActiveSessionId(s.id)}>
                    <CardContent className="p-4 flex flex-col justify-between h-full">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-bold text-lg">{s.name}</h3>
                                <p className="text-[10px] text-muted-foreground">
                                    {s.startTime ? `Started ${formatDistanceToNow(s.startTime.toDate())} ago` : 'Starting...'}
                                </p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); handleEndSession(s.id); }}>
                                <StopCircle className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-primary font-bold">
                            <Users className="h-3 w-3" />
                            {allMatches?.filter(m => m.sessionId === s.id).length || 0} Matches
                        </div>
                    </CardContent>
                </Card>
            ))}
            {(!activeSessions || activeSessions.length === 0) && !sessionsError && (
                <Card className="col-span-full border-dashed border-2 p-8 text-center bg-muted/20">
                    <p className="text-muted-foreground mb-4">No active sessions found. Start one to begin tracking.</p>
                    <Button onClick={handleStartSession} disabled={isSessionActionLoading}>
                        Start First Session
                    </Button>
                </Card>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Match Recording Form */}
        <div className="space-y-8">
          <Card className="shadow-2xl shadow-primary/10 border-2 border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-headline text-3xl flex items-center gap-2">
                    <Trophy className="text-primary" /> {activeSession ? activeSession.name : 'New Match'}
                  </CardTitle>
                  <CardDescription>Enter match results for the current session.</CardDescription>
                </div>
                <Dialog open={isAddPlayerOpen} onOpenChange={setIsAddPlayerOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <UserPlus className="mr-2 h-4 w-4" /> Add Player
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Register New Player</DialogTitle>
                      <DialogDescription>Add a customer to start tracking their matches.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddPlayer} className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="playerName">Full Name</Label>
                        <Input id="playerName" placeholder="e.g. Cristiano Ronaldo" value={newPlayerName} onChange={e => setNewPlayerName(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="playerInsta">Instagram (Optional)</Label>
                        <Input id="playerInsta" placeholder="@handle" value={newPlayerInstagram} onChange={e => setNewPlayerInstagram(e.target.value)} />
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={isAddingPlayer}>
                          {isAddingPlayer ? <Loader2 className="animate-spin" /> : "Save Player"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {!activeSessionId ? (
                <div className="text-center py-10 text-muted-foreground">
                    Please select or start an active session to record a match.
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Team 1 */}
                    <div className="space-y-4 p-4 rounded-lg bg-primary/5 border border-primary/10">
                      <Label className="text-primary font-bold">Team 1 (Home)</Label>
                      <PlayerSelect id="p1" value={player1Id} onValueChange={setPlayer1Id} placeholder="Select Player 1" />
                      <PlayerSelect id="p1b" value={player1bId} onValueChange={setPlayer1bId} placeholder="Select Player 2 (Optional)" />
                      <Input placeholder="Team (e.g. Real Madrid)" value={player1Team} onChange={e => setPlayer1Team(e.target.value)} />
                      <Input type="number" placeholder="Goals" value={player1Score} onChange={e => setPlayer1Score(e.target.value)} className="text-2xl font-mono text-center" />
                    </div>

                    {/* Team 2 */}
                    <div className="space-y-4 p-4 rounded-lg bg-accent/5 border border-accent/10">
                      <Label className="text-accent font-bold">Team 2 (Away)</Label>
                      <PlayerSelect id="p2" value={player2Id} onValueChange={setPlayer2Id} placeholder="Select Player 1" />
                      <PlayerSelect id="p2b" value={player2bId} onValueChange={setPlayer2bId} placeholder="Select Player 2 (Optional)" />
                      <Input placeholder="Team (e.g. Man City)" value={player2Team} onChange={e => setPlayer2Team(e.target.value)} />
                      <Input type="number" placeholder="Goals" value={player2Score} onChange={e => setPlayer2Score(e.target.value)} className="text-2xl font-mono text-center" />
                    </div>
                  </div>

                  <Button type="submit" className="w-full text-lg py-6" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : "Submit Match Result"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Leaderboard */}
          <Card className="border-2 border-primary/20">
            <CardHeader className="pb-0">
              <CardTitle className="font-headline text-2xl flex items-center gap-2">
                <Trophy className="text-yellow-500" /> Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="session" className="w-full mt-4">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="session">Current Session</TabsTrigger>
                        <TabsTrigger value="global">All-Time</TabsTrigger>
                    </TabsList>
                    <TabsContent value="session">
                        <StatsTable stats={sessionStats} emptyMessage={activeSessionId ? "No matches in this session yet." : "Select an active session to see stats."} />
                    </TabsContent>
                    <TabsContent value="global">
                        <StatsTable stats={globalStats} emptyMessage="No matches recorded yet." />
                    </TabsContent>
                </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Match History */}
        <div>
          <Card className="h-full border-2 border-muted">
            <CardHeader>
              <CardTitle className="font-headline text-2xl flex items-center gap-2">
                <History className="text-muted-foreground" /> Match History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allMatches?.map(match => (
                  <div key={match.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors relative group">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {match.timestamp ? formatDistanceToNow(match.timestamp.toDate(), { addSuffix: true }) : "Just now"}
                          </span>
                          {match.sessionName && (
                              <Badge variant="outline" className="text-[9px] h-4 px-1.5 w-fit font-mono">
                                <Hash className="h-2 w-2 mr-0.5" /> {match.sessionName}
                              </Badge>
                          )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isAdmin && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setEditingMatch(match);
                                setEditScore1(String(match.player1Score));
                                setEditScore2(String(match.player2Score));
                              }}>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteMatch(match.id)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-lg">
                      <div className="flex-1 text-right pr-4">
                        <div className="font-bold truncate">
                          {match.player1Name}
                          {match.player1bName && <span className="block text-xs text-muted-foreground">& {match.player1bName}</span>}
                        </div>
                        <div className="text-xs text-muted-foreground italic">{match.player1Team}</div>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-2xl bg-muted px-4 py-1 rounded-md">
                        <span className={match.player1Score > match.player2Score ? "text-primary font-black" : ""}>
                          {match.player1Score}
                        </span>
                        <span className="text-muted-foreground text-sm">-</span>
                        <span className={match.player2Score > match.player1Score ? "text-primary font-black" : ""}>
                          {match.player2Score}
                        </span>
                      </div>
                      <div className="flex-1 text-left pl-4">
                        <div className="font-bold truncate">
                          {match.player2Name}
                          {match.player2bName && <span className="block text-xs text-muted-foreground">& {match.player2bName}</span>}
                        </div>
                        <div className="text-xs text-muted-foreground italic">{match.player2Team}</div>
                      </div>
                    </div>
                  </div>
                ))}
                {allMatches?.length === 0 && !matchesError && (
                  <div className="text-center py-20 text-muted-foreground">
                    <History className="mx-auto h-12 w-12 mb-4 opacity-20" />
                    Waiting for the first whistle...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Match Dialog */}
      <Dialog open={!!editingMatch} onOpenChange={(open) => !open && setEditingMatch(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Match Result</DialogTitle>
            <DialogDescription>Update the score for the match between {editingMatch?.player1Name} and {editingMatch?.player2Name}.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-8 py-4">
            <div className="space-y-2">
              <Label>{editingMatch?.player1Name}'s Score</Label>
              <Input type="number" value={editScore1} onChange={e => setEditScore1(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{editingMatch?.player2Name}'s Score</Label>
              <Input type="number" value={editScore2} onChange={e => setEditScore2(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMatch(null)}>Cancel</Button>
            <Button onClick={handleUpdateMatch} disabled={isUpdating}>
              {isUpdating ? <Loader2 className="animate-spin" /> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatsTable({ stats, emptyMessage }: { stats: any[], emptyMessage: string }) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead className="text-center">P</TableHead>
                    <TableHead className="text-center">W-D-L</TableHead>
                    <TableHead className="text-center">GD</TableHead>
                    <TableHead className="text-right">Pts</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {stats.map((stat, idx) => (
                    <TableRow key={stat.name} className={idx === 0 ? "bg-primary/10" : ""}>
                        <TableCell className="font-bold flex items-center gap-2">
                            {idx === 0 && <Trophy className="h-4 w-4 text-yellow-500" />}
                            {stat.name}
                        </TableCell>
                        <TableCell className="text-center">{stat.wins + stat.draws + stat.losses}</TableCell>
                        <TableCell className="text-center text-xs text-muted-foreground">{stat.wins}-{stat.draws}-{stat.losses}</TableCell>
                        <TableCell className="text-center font-mono">{stat.gf - stat.ga}</TableCell>
                        <TableCell className="text-right font-bold text-primary">{stat.points}</TableCell>
                    </TableRow>
                ))}
                {stats.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{emptyMessage}</TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}
