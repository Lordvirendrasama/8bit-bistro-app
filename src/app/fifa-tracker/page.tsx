
"use client";

import { useState, useMemo, useEffect } from "react";
import { useFirestore, useCollection, useMemoFirebase, useAuth } from "@/firebase";
import { collection, query, orderBy, addDoc, serverTimestamp, updateDoc, doc, limit, where } from "firebase/firestore";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePlayers } from "@/lib/hooks/use-players";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Loader2, Trophy, History, UserPlus, PlayCircle, StopCircle, Calendar } from "lucide-react";
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

function FifaTrackerPage() {
  const firestore = useFirestore();
  const { user } = useAuth();
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

  // New Player Form State
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerInstagram, setNewPlayerInstagram] = useState("");
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);

  // Session Management
  const [isSessionActionLoading, setIsSessionActionLoading] = useState(false);
  const sessionsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "fifaSessions"), orderBy("startTime", "desc"), limit(1));
  }, [firestore]);
  const { data: latestSessions } = useCollection<FifaSession>(sessionsQuery);
  const activeSession = latestSessions?.find(s => !s.endTime) || null;

  const matchesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "fifaMatches"), orderBy("timestamp", "desc"));
  }, [firestore]);
  const { data: allMatches, isLoading: matchesLoading } = useCollection<FifaMatch>(matchesQuery);

  const handleStartSession = async () => {
    if (!firestore || !user) return;
    setIsSessionActionLoading(true);
    try {
      await addDoc(collection(firestore, "fifaSessions"), {
        name: `Session - ${format(new Date(), "PPp")}`,
        startTime: serverTimestamp(),
        endTime: null,
        createdBy: user.uid
      });
      toast({ title: "Session Started", description: "All matches recorded will now be linked to this session." });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error", description: "Failed to start session." });
    } finally {
      setIsSessionActionLoading(false);
    }
  };

  const handleEndSession = async () => {
    if (!firestore || !activeSession) return;
    setIsSessionActionLoading(true);
    try {
      await updateDoc(doc(firestore, "fifaSessions", activeSession.id), {
        endTime: serverTimestamp()
      });
      toast({ title: "Session Ended", description: "The current competition is now finalized." });
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

    if (player1Id === player2Id || (player1bId && player1bId === player2Id) || (player2bId && player2bId === player1Id)) {
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
        sessionId: activeSession?.id || null,
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

  const calculateStats = (matchesToProcess: FifaMatch[]) => {
    const stats: Record<string, { name: string; wins: number; draws: number; losses: number; gf: number; ga: number; points: number }> = {};

    matchesToProcess.forEach(m => {
      const team1 = [{ id: m.player1Id, name: m.player1Name }];
      if (m.player1bId) team1.push({ id: m.player1bId, name: m.player1bName! });

      const team2 = [{ id: m.player2Id, name: m.player2Name }];
      if (m.player2bId) team2.push({ id: m.player2bId, name: m.player2bName! });

      // Process Team 1 Players
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

      // Process Team 2 Players
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
      if (!activeSession || !allMatches) return [];
      return calculateStats(allMatches.filter(m => m.sessionId === activeSession.id));
  }, [allMatches, activeSession]);

  if (playersLoading || matchesLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 pt-10 max-w-6xl">
      {/* Session Banner */}
      <Card className="mb-8 border-2 border-primary/40 bg-primary/5">
          <CardContent className="flex flex-col md:flex-row items-center justify-between p-6 gap-4">
              <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${activeSession ? 'bg-green-500/20 text-green-500' : 'bg-muted text-muted-foreground'}`}>
                      <PlayCircle className="h-6 w-6" />
                  </div>
                  <div>
                      <h2 className="text-xl font-headline">{activeSession ? 'Active Session' : 'No Active Session'}</h2>
                      <p className="text-sm text-muted-foreground">
                          {activeSession ? `Started ${formatDistanceToNow(activeSession.startTime.toDate())} ago` : 'Start a session to track current play separately.'}
                      </p>
                  </div>
              </div>
              <div className="flex items-center gap-2">
                  {activeSession ? (
                      <Button variant="destructive" onClick={handleEndSession} disabled={isSessionActionLoading}>
                          {isSessionActionLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <StopCircle className="mr-2 h-4 w-4" />}
                          End Session
                      </Button>
                  ) : (
                      <Button onClick={handleStartSession} disabled={isSessionActionLoading}>
                          {isSessionActionLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <PlayCircle className="mr-2 h-4 w-4" />}
                          Start Session
                      </Button>
                  )}
              </div>
          </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Match Recording Form */}
        <div className="space-y-8">
          <Card className="shadow-2xl shadow-primary/10 border-2 border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-headline text-3xl flex items-center gap-2">
                    <Trophy className="text-primary" /> New Match
                  </CardTitle>
                  <CardDescription>Enter match results for FIFA 25.</CardDescription>
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
                        <Input 
                          id="playerName" 
                          placeholder="e.g. Cristiano Ronaldo" 
                          value={newPlayerName} 
                          onChange={e => setNewPlayerName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="playerInsta">Instagram (Optional)</Label>
                        <Input 
                          id="playerInsta" 
                          placeholder="@handle" 
                          value={newPlayerInstagram} 
                          onChange={e => setNewPlayerInstagram(e.target.value)}
                        />
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
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  {/* Team 1 */}
                  <div className="space-y-4 p-4 rounded-lg bg-primary/5 border border-primary/10">
                    <Label className="text-primary font-bold">Team 1 (Home)</Label>
                    <Select onValueChange={setPlayer1Id} value={player1Id}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Player 1" />
                      </SelectTrigger>
                      <SelectContent>
                        {players.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select onValueChange={setPlayer1bId} value={player1bId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Player 2 (Optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {players.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input placeholder="Team (e.g. Real Madrid)" value={player1Team} onChange={e => setPlayer1Team(e.target.value)} />
                    <Input type="number" placeholder="Goals" value={player1Score} onChange={e => setPlayer1Score(e.target.value)} className="text-2xl font-mono text-center" />
                  </div>

                  {/* Team 2 */}
                  <div className="space-y-4 p-4 rounded-lg bg-accent/5 border border-accent/10">
                    <Label className="text-accent font-bold">Team 2 (Away)</Label>
                    <Select onValueChange={setPlayer2Id} value={player2Id}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Player 1" />
                      </SelectTrigger>
                      <SelectContent>
                        {players.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select onValueChange={setPlayer2bId} value={player2bId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Player 2 (Optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {players.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input placeholder="Team (e.g. Man City)" value={player2Team} onChange={e => setPlayer2Team(e.target.value)} />
                    <Input type="number" placeholder="Goals" value={player2Score} onChange={e => setPlayer2Score(e.target.value)} className="text-2xl font-mono text-center" />
                  </div>
                </div>

                <Button type="submit" className="w-full text-lg py-6" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : "Submit Match Result"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Leaderboard Tabs */}
          <Card className="border-2 border-primary/20">
            <CardHeader className="pb-0">
              <CardTitle className="font-headline text-2xl flex items-center gap-2">
                <Trophy className="text-yellow-500" /> Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="session" className="w-full mt-4">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="session">Session</TabsTrigger>
                        <TabsTrigger value="global">All-Time</TabsTrigger>
                    </TabsList>
                    <TabsContent value="session">
                        <StatsTable stats={sessionStats} emptyMessage={activeSession ? "No matches in this session yet." : "No active session."} />
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
                  <div key={match.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {match.timestamp ? formatDistanceToNow(match.timestamp.toDate(), { addSuffix: true }) : "Just now"}
                      </span>
                      {match.sessionId === activeSession?.id && (
                          <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full uppercase font-bold">Active Session</span>
                      )}
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
                {allMatches?.length === 0 && (
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

export default function GuardedFifaTrackerPage() {
  return (
    <AuthGuard>
      <FifaTrackerPage />
    </AuthGuard>
  );
}
