
"use client";
import { useState, useMemo } from "react";
import { collection, query, orderBy, doc, updateDoc, deleteDoc, where } from "firebase/firestore";
import { format } from "date-fns";
import { Edit, Loader2, MoreVertical, Trash2, Trophy, Calendar, Search, Hash } from "lucide-react";
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

export default function AdminFifaPage() {
  const firestore = useFirestore();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [filterSessionId, setFilterSessionId] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const sessionsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, "fifaSessions"), orderBy("startTime", "desc")) : null, [firestore]);
  const { data: sessions, isLoading: loadingSessions } = useCollection<FifaSession>(sessionsQuery);
  const matchesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    let q = query(collection(firestore, "fifaMatches"), orderBy("timestamp", "desc"));
    if (filterSessionId !== "all") q = query(collection(firestore, "fifaMatches"), where("sessionId", "==", filterSessionId), orderBy("timestamp", "desc"));
    return q;
  }, [firestore, filterSessionId]);
  const { data: matches, isLoading: loadingMatches } = useCollection<FifaMatch>(matchesQuery);

  const [editingMatch, setEditingMatch] = useState<FifaMatch | null>(null);
  const [editScore1, setEditScore1] = useState("");
  const [editScore2, setEditScore2] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [matchToDelete, setMatchToDelete] = useState<FifaMatch | null>(null);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);

  const filteredMatches = useMemo(() => {
    if (!matches) return [];
    if (!searchTerm.trim()) return matches;
    const term = searchTerm.toLowerCase();
    return matches.filter(m => m.player1Name.toLowerCase().includes(term) || m.player2Name.toLowerCase().includes(term));
  }, [matches, searchTerm]);

  const handleUpdateMatch = async () => {
    if (!firestore || !editingMatch || !isAdmin) return;
    setIsUpdating(true);
    const updatedData = { player1Score: Number(editScore1), player2Score: Number(editScore2) };
    updateDoc(doc(firestore, "fifaMatches", editingMatch.id), updatedData)
      .then(() => { toast({ title: "Success" }); setEditingMatch(null); })
      .catch(() => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'fifaMatches', operation: 'update' })))
      .finally(() => setIsUpdating(false));
  };

  const handleDeleteMatch = async () => {
    if (!firestore || !matchToDelete || !isAdmin) return;
    deleteDoc(doc(firestore, "fifaMatches", matchToDelete.id))
      .then(() => toast({ title: "Deleted" }))
      .catch(() => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'fifaMatches', operation: 'delete' })))
      .finally(() => { setDeleteAlertOpen(false); setMatchToDelete(null); });
  };

  if (loadingMatches || loadingSessions) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="font-headline text-4xl">FIFA Admin</h1>
        <div className="flex gap-2">
          <Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <Select value={filterSessionId} onValueChange={setFilterSessionId}>
            <SelectTrigger><SelectValue placeholder="Sessions" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All</SelectItem>{sessions?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <Card>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Teams</TableHead><TableHead className="text-center">Score</TableHead><TableHead>Session</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {filteredMatches.map((match) => (
                <TableRow key={match.id}>
                  <TableCell>{match.player1Name} vs {match.player2Name}</TableCell>
                  <TableCell className="text-center font-mono">{match.player1Score} - {match.player2Score}</TableCell>
                  <TableCell><Badge variant="outline">{match.sessionName}</Badge></TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setTimeout(() => { setEditingMatch(match); setEditScore1(String(match.player1Score)); setEditScore2(String(match.player2Score)); }, 0)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onSelect={() => setTimeout(() => { setMatchToDelete(match); setDeleteAlertOpen(true); }, 0)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={!!editingMatch} onOpenChange={(o) => { if (!o) setEditingMatch(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Score</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4"><Input type="number" value={editScore1} onChange={(e) => setEditScore1(e.target.value)} /><Input type="number" value={editScore2} onChange={(e) => setEditScore2(e.target.value)} /></div>
          <DialogFooter><Button onClick={handleUpdateMatch} disabled={isUpdating}>{isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={deleteAlertOpen} onOpenChange={(o) => { if (!o) setDeleteAlertOpen(false); }}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Match?</AlertDialogTitle></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteMatch} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
