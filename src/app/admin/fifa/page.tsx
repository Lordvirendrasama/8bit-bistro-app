
"use client";
import { useState, useMemo } from "react";
import { collection, query, orderBy, doc, updateDoc, deleteDoc, where, serverTimestamp } from "firebase/firestore";
import { format } from "date-fns";
import { Edit, Loader2, MoreVertical, Trash2, Trophy, Calendar, Search, Hash, PlayCircle, StopCircle } from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase, FirestorePermissionError, errorEmitter } from "@/firebase";
import { useAuth } from "@/hooks/use-auth";
import type { FifaMatch, FifaSession } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function AdminFifaPage() {
  const firestore = useFirestore();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [filterSessionId, setFilterSessionId] = useState<string>("all");
  const [matchSearchTerm, setMatchSearchTerm] = useState("");
  
  // Sessions Data
  const sessionsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, "fifaSessions"), orderBy("startTime", "desc")) : null, [firestore]);
  const { data: sessions, isLoading: loadingSessions } = useCollection<FifaSession>(sessionsQuery);
  
  // Matches Data
  const matchesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    let q = query(collection(firestore, "fifaMatches"), orderBy("timestamp", "desc"));
    if (filterSessionId !== "all") q = query(collection(firestore, "fifaMatches"), where("sessionId", "==", filterSessionId), orderBy("timestamp", "desc"));
    return q;
  }, [firestore, filterSessionId]);
  const { data: matches, isLoading: loadingMatches } = useCollection<FifaMatch>(matchesQuery);

  // Match Edit State
  const [editingMatch, setEditingMatch] = useState<FifaMatch | null>(null);
  const [editScore1, setEditScore1] = useState("");
  const [editScore2, setEditScore2] = useState("");
  const [isUpdatingMatch, setIsUpdatingMatch] = useState(false);
  const [matchToDelete, setMatchToDelete] = useState<FifaMatch | null>(null);
  const [deleteMatchAlertOpen, setDeleteMatchAlertOpen] = useState(false);

  // Session Edit State
  const [editingSession, setEditingSession] = useState<FifaSession | null>(null);
  const [editSessionName, setEditSessionName] = useState("");
  const [isUpdatingSession, setIsUpdatingSession] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<FifaSession | null>(null);
  const [deleteSessionAlertOpen, setDeleteSessionAlertOpen] = useState(false);

  const filteredMatches = useMemo(() => {
    if (!matches) return [];
    if (!matchSearchTerm.trim()) return matches;
    const term = matchSearchTerm.toLowerCase();
    return matches.filter(m => 
      m.player1Name.toLowerCase().includes(term) || 
      m.player2Name.toLowerCase().includes(term) ||
      (m.player1Team && m.player1Team.toLowerCase().includes(term)) ||
      (m.player2Team && m.player2Team.toLowerCase().includes(term))
    );
  }, [matches, matchSearchTerm]);

  const handleUpdateMatch = async () => {
    if (!firestore || !editingMatch || !isAdmin) return;
    setIsUpdatingMatch(true);
    const updatedData = { player1Score: Number(editScore1), player2Score: Number(editScore2) };
    updateDoc(doc(firestore, "fifaMatches", editingMatch.id), updatedData)
      .then(() => { toast({ title: "Success" }); setEditingMatch(null); })
      .catch(() => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'fifaMatches', operation: 'update' })))
      .finally(() => setIsUpdatingMatch(false));
  };

  const handleDeleteMatch = async () => {
    if (!firestore || !matchToDelete || !isAdmin) return;
    deleteDoc(doc(firestore, "fifaMatches", matchToDelete.id))
      .then(() => { toast({ title: "Match Deleted" }); setMatchToDelete(null); })
      .catch(() => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'fifaMatches', operation: 'delete' })))
      .finally(() => { setDeleteMatchAlertOpen(false); });
  };

  const handleUpdateSession = async () => {
    if (!firestore || !editingSession || !isAdmin) return;
    setIsUpdatingSession(true);
    const updatedData = { name: editSessionName.trim() };
    updateDoc(doc(firestore, "fifaSessions", editingSession.id), updatedData)
      .then(() => { toast({ title: "Session Updated" }); setEditingSession(null); })
      .catch(() => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'fifaSessions', operation: 'update' })))
      .finally(() => setIsUpdatingSession(false));
  };

  const handleToggleSessionStatus = async (session: FifaSession, isActive: boolean) => {
    if (!firestore || !isAdmin) return;
    const updatedData = { endTime: isActive ? null : serverTimestamp() };
    updateDoc(doc(firestore, "fifaSessions", session.id), updatedData)
      .then(() => { toast({ title: isActive ? "Session Reopened" : "Session Closed" }); })
      .catch(() => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'fifaSessions', operation: 'update' })));
  };

  const handleDeleteSession = async () => {
    if (!firestore || !sessionToDelete || !isAdmin) return;
    deleteDoc(doc(firestore, "fifaSessions", sessionToDelete.id))
      .then(() => { toast({ title: "Session Deleted" }); setSessionToDelete(null); })
      .catch(() => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'fifaSessions', operation: 'delete' })))
      .finally(() => { setDeleteSessionAlertOpen(false); });
  };

  if (loadingMatches || loadingSessions) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="font-headline text-4xl">FIFA Admin</h1>
      </div>

      <Tabs defaultValue="matches" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mb-6">
          <TabsTrigger value="matches">Matches</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="matches" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search players or teams..." 
                className="pl-10"
                value={matchSearchTerm} 
                onChange={(e) => setMatchSearchTerm(e.target.value)} 
              />
            </div>
            <Select value={filterSessionId} onValueChange={setFilterSessionId}>
              <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="All Sessions" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sessions</SelectItem>
                {sessions?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Teams</TableHead>
                    <TableHead className="text-center">Score</TableHead>
                    <TableHead>Session</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMatches.map((match) => (
                    <TableRow key={match.id}>
                      <TableCell>
                        <div className="font-medium">{match.player1Name} vs {match.player2Name}</div>
                        <div className="text-xs text-muted-foreground">{match.player1Team} vs {match.player2Team}</div>
                      </TableCell>
                      <TableCell className="text-center font-mono text-lg">{match.player1Score} - {match.player2Score}</TableCell>
                      <TableCell><Badge variant="outline">{match.sessionName || "None"}</Badge></TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => setTimeout(() => { 
                              setEditingMatch(match); 
                              setEditScore1(String(match.player1Score)); 
                              setEditScore2(String(match.player2Score)); 
                            }, 0)}>
                              <Edit className="mr-2 h-4 w-4" />Edit Score
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onSelect={() => setTimeout(() => { 
                              setMatchToDelete(match); 
                              setDeleteMatchAlertOpen(true); 
                            }, 0)}>
                              <Trash2 className="mr-2 h-4 w-4" />Delete Match
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredMatches.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">No matches found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>FIFA Sessions</CardTitle>
              <CardDescription>Manage your tournament sessions and their names.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Session Name</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions?.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-bold">{session.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {session.startTime ? format(session.startTime.toDate(), "MMM d, h:mm a") : "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={!session.endTime} 
                            onCheckedChange={(checked) => handleToggleSessionStatus(session, checked)} 
                          />
                          <Badge variant={!session.endTime ? "default" : "secondary"}>
                            {!session.endTime ? "Active" : "Closed"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => setTimeout(() => { 
                              setEditingSession(session); 
                              setEditSessionName(session.name); 
                            }, 0)}>
                              <Edit className="mr-2 h-4 w-4" />Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onSelect={() => setTimeout(() => { 
                              setSessionToDelete(session); 
                              setDeleteSessionAlertOpen(true); 
                            }, 0)}>
                              <Trash2 className="mr-2 h-4 w-4" />Delete Session
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!sessions || sessions.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">No sessions created yet.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Match Edit Dialog */}
      <Dialog open={!!editingMatch} onOpenChange={(o) => { if (!o) setEditingMatch(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Match Score</DialogTitle>
            <DialogDescription>Update the final score for {editingMatch?.player1Name} vs {editingMatch?.player2Name}.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>{editingMatch?.player1Name}</Label>
              <Input type="number" value={editScore1} onChange={(e) => setEditScore1(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{editingMatch?.player2Name}</Label>
              <Input type="number" value={editScore2} onChange={(e) => setEditScore2(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMatch(null)}>Cancel</Button>
            <Button onClick={handleUpdateMatch} disabled={isUpdatingMatch}>
              {isUpdatingMatch && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Session Edit Dialog */}
      <Dialog open={!!editingSession} onOpenChange={(o) => { if (!o) setEditingSession(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Session</DialogTitle>
            <DialogDescription>Change the name of "{editingSession?.name}".</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="sessionName">New Name</Label>
            <Input 
              id="sessionName"
              value={editSessionName} 
              onChange={(e) => setEditSessionName(e.target.value)} 
              placeholder="e.g. 8 Bit Friday Night"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSession(null)}>Cancel</Button>
            <Button onClick={handleUpdateSession} disabled={isUpdatingSession || !editSessionName.trim()}>
              {isUpdatingSession && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Name
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Match Alert */}
      <AlertDialog open={deleteMatchAlertOpen} onOpenChange={setDeleteMatchAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this match record?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone and will permanently remove this score from the stats.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMatch} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Session Alert */}
      <AlertDialog open={deleteSessionAlertOpen} onOpenChange={setDeleteSessionAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete session "{sessionToDelete?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Deleting a session will NOT delete the matches within it, but those matches will no longer be linked to this session. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSession} className="bg-destructive hover:bg-destructive/90">Delete Session</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
