
"use client";

import { useState, useMemo } from "react";
import {
  collection,
  query,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  where,
} from "firebase/firestore";
import { format } from "date-fns";
import {
  Edit,
  Loader2,
  MoreVertical,
  Trash2,
  Trophy,
  Calendar,
  Search,
} from "lucide-react";

import { useFirestore, useCollection, useMemoFirebase, FirestorePermissionError, errorEmitter } from "@/firebase";
import { useAuth } from "@/hooks/use-auth";
import type { FifaMatch, FifaSession } from "@/types";
import { useToast } from "@/hooks/use-toast";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminFifaPage() {
  const firestore = useFirestore();
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  const [filterSessionId, setFilterSessionId] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch Sessions
  const sessionsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "fifaSessions"), orderBy("startTime", "desc"));
  }, [firestore]);
  const { data: sessions, isLoading: loadingSessions } = useCollection<FifaSession>(sessionsQuery);

  // Fetch Matches
  const matchesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    let q = query(collection(firestore, "fifaMatches"), orderBy("timestamp", "desc"));
    if (filterSessionId !== "all") {
      q = query(collection(firestore, "fifaMatches"), where("sessionId", "==", filterSessionId), orderBy("timestamp", "desc"));
    }
    return q;
  }, [firestore, filterSessionId]);
  const { data: matches, isLoading: loadingMatches } = useCollection<FifaMatch>(matchesQuery);

  // State for Editing
  const [editingMatch, setEditingMatch] = useState<FifaMatch | null>(null);
  const [editScore1, setEditScore1] = useState("");
  const [editScore2, setEditScore2] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // State for Deletion
  const [matchToDelete, setMatchToDelete] = useState<FifaMatch | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredMatches = useMemo(() => {
    if (!matches) return [];
    if (!searchTerm.trim()) return matches;
    const term = searchTerm.toLowerCase();
    return matches.filter(m => 
      m.player1Name.toLowerCase().includes(term) ||
      m.player2Name.toLowerCase().includes(term) ||
      (m.player1bName && m.player1bName.toLowerCase().includes(term)) ||
      (m.player2bName && m.player2bName.toLowerCase().includes(term)) ||
      m.player1Team.toLowerCase().includes(term) ||
      m.player2Team.toLowerCase().includes(term)
    );
  }, [matches, searchTerm]);

  const handleUpdateMatch = async () => {
    if (!firestore || !editingMatch || !isAdmin) return;
    setIsUpdating(true);

    const matchDocRef = doc(firestore, "fifaMatches", editingMatch.id);
    const updatedData = {
      player1Score: Number(editScore1),
      player2Score: Number(editScore2),
    };

    try {
      await updateDoc(matchDocRef, updatedData);
      toast({ title: "Success", description: "Match score updated." });
      setEditingMatch(null);
    } catch (error) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: matchDocRef.path,
        operation: 'update',
        requestResourceData: updatedData
      }));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteMatch = async () => {
    if (!firestore || !matchToDelete || !isAdmin) return;
    setIsDeleting(true);

    const matchDocRef = doc(firestore, "fifaMatches", matchToDelete.id);

    try {
      await deleteDoc(matchDocRef);
      toast({ title: "Deleted", description: "Match record removed." });
      setMatchToDelete(null);
    } catch (error) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: matchDocRef.path,
        operation: 'delete',
      }));
    } finally {
      setIsDeleting(false);
    }
  };

  if (loadingMatches || loadingSessions) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-4xl mb-1">FIFA Admin</h1>
          <p className="text-muted-foreground">Manage match history, sessions, and track performance data.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search players or teams..."
              className="pl-9 w-full sm:w-[250px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={filterSessionId} onValueChange={setFilterSessionId}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="All Sessions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sessions</SelectItem>
              {sessions?.map(s => (
                <SelectItem key={s.id} value={s.id}>
                  {format(s.startTime.toDate(), "MMM d, h:mm a")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Match Records</CardTitle>
          <CardDescription>
            Showing {filteredMatches.length} matches.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Team 1 (Home)</TableHead>
                  <TableHead className="text-center">Score</TableHead>
                  <TableHead>Team 2 (Away)</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMatches.map((match) => (
                  <TableRow key={match.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {match.timestamp ? format(match.timestamp.toDate(), "PP p") : "Pending"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{match.player1Name}</div>
                      {match.player1bName && (
                        <div className="text-xs text-muted-foreground">& {match.player1bName}</div>
                      )}
                      <div className="text-[10px] italic text-primary/70">{match.player1Team}</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="font-mono text-xl font-bold bg-muted/50 rounded p-1 inline-block min-w-[60px]">
                        {match.player1Score} - {match.player2Score}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{match.player2Name}</div>
                      {match.player2bName && (
                        <div className="text-xs text-muted-foreground">& {match.player2bName}</div>
                      )}
                      <div className="text-[10px] italic text-primary/70">{match.player2Team}</div>
                    </TableCell>
                    <TableCell>
                      {match.sessionId ? (
                        <Badge variant="outline" className="text-[10px]">
                          Session ID: {match.sessionId.substring(0, 6)}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">No Session</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setEditingMatch(match);
                            setEditScore1(String(match.player1Score));
                            setEditScore2(String(match.player2Score));
                          }}>
                            <Edit className="mr-2 h-4 w-4" /> Edit Score
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => setMatchToDelete(match)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Match
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredMatches.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                      No matches found matching your criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingMatch} onOpenChange={(open) => !open && setEditingMatch(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Match Result</DialogTitle>
            <DialogDescription>
              Correct the score for {editingMatch?.player1Name} vs {editingMatch?.player2Name}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-6 py-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-primary">Home Goals</label>
              <Input
                type="number"
                value={editScore1}
                onChange={(e) => setEditScore1(e.target.value)}
                className="text-2xl font-mono text-center"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-primary">Away Goals</label>
              <Input
                type="number"
                value={editScore2}
                onChange={(e) => setEditScore2(e.target.value)}
                className="text-2xl font-mono text-center"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMatch(null)}>Cancel</Button>
            <Button onClick={handleUpdateMatch} disabled={isUpdating}>
              {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!matchToDelete} onOpenChange={(open) => !open && setMatchToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this match record. The stats on the leaderboard will be updated automatically.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMatch} className="bg-destructive hover:bg-destructive/90">
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete Record"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
