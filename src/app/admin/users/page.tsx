
"use client";
import { useState, useMemo, useEffect } from "react";
import { collection, query, orderBy, doc, updateDoc, deleteDoc, getDocs, writeBatch } from "firebase/firestore";
import { formatDistanceToNow } from "date-fns";
import { Loader2, ChevronDown, ChevronUp, Instagram, Users, MoreVertical, Edit, Trash2 } from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase, FirestorePermissionError, errorEmitter } from "@/firebase";
import { useAuth } from "@/hooks/use-auth";
import type { Player, Event } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminUsersPage() {
  const firestore = useFirestore();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const playersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, "players"), orderBy("createdAt", "desc")) : null, [firestore]);
  const { data: players, isLoading: loadingPlayers } = useCollection<Player>(playersQuery);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [playerToEdit, setPlayerToEdit] = useState<Player | null>(null);
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);
  const [editedName, setEditedName] = useState("");
  const [editedInstagram, setEditedInstagram] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!firestore) return;
    getDocs(query(collection(firestore, "events"), orderBy("createdAt", "desc"))).then(s => setEvents(s.docs.map(d => ({id: d.id, ...d.data()} as Event))));
  }, [firestore]);

  const handleEditSubmit = () => {
    if (!isAdmin || !playerToEdit || !firestore) return;
    setIsSubmitting(true);
    updateDoc(doc(firestore, "players", playerToEdit.id), { name: editedName.trim(), instagram: editedInstagram.trim() })
      .then(() => { toast({ title: "Success" }); setEditModalOpen(false); })
      .catch(() => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'players', operation: 'update' })))
      .finally(() => setIsSubmitting(false));
  };

  const handleDeleteSubmit = () => {
    if (!isAdmin || !playerToDelete || !firestore) return;
    deleteDoc(doc(firestore, "players", playerToDelete.id))
      .then(() => toast({ title: "Deleted" }))
      .catch(() => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'players', operation: 'delete' })))
      .finally(() => setDeleteAlertOpen(false));
  };

  const handleAssign = async () => {
    if (!isAdmin || selectedPlayerIds.length === 0 || !selectedEventId || !firestore) return;
    setIsAssigning(true);
    const event = events.find(e => e.id === selectedEventId);
    const batch = writeBatch(firestore);
    selectedPlayerIds.forEach(id => batch.update(doc(firestore, "players", id), { eventId: event?.id, eventName: event?.name }));
    batch.commit().then(() => { toast({ title: "Assigned" }); setSelectedPlayerIds([]); }).finally(() => setIsAssigning(false));
  };

  if (loadingPlayers) return <Loader2 className="animate-spin mx-auto mt-20" />;

  return (
    <div className="p-4 md:p-8">
      <h1 className="font-headline text-4xl mb-6">Players</h1>
      <Card>
        <CardContent>
          {selectedPlayerIds.length > 0 && (
            <div className="flex gap-2 mb-4 p-4 border rounded bg-muted">
              <Select value={selectedEventId} onValueChange={setSelectedEventId}><SelectTrigger><SelectValue placeholder="Event" /></SelectTrigger><SelectContent>{events.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent></Select>
              <Button onClick={handleAssign} disabled={isAssigning}>Assign</Button>
            </div>
          )}
          <Table>
            <TableHeader><TableRow><TableHead><Checkbox onCheckedChange={c => setSelectedPlayerIds(!!c ? players?.map(p => p.id) || [] : [])} /></TableHead><TableHead>Name</TableHead><TableHead>Insta</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {players?.map(player => (
                <TableRow key={player.id}>
                  <TableCell><Checkbox checked={selectedPlayerIds.includes(player.id)} onCheckedChange={c => setSelectedPlayerIds(p => !!c ? [...p, player.id] : p.filter(id => id !== player.id))} /></TableCell>
                  <TableCell>{player.name}</TableCell><TableCell>{player.instagram}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setTimeout(() => { setPlayerToEdit(player); setEditedName(player.name); setEditedInstagram(player.instagram || ""); setEditModalOpen(true); }, 0)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onSelect={() => setTimeout(() => { setPlayerToDelete(player); setDeleteAlertOpen(true); }, 0)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={editModalOpen} onOpenChange={o => { if (!o) setEditModalOpen(false); }}><DialogContent><DialogHeader><DialogTitle>Edit Player</DialogTitle></DialogHeader><div className="space-y-4"><Input value={editedName} onChange={e => setEditedName(e.target.value)} /><Input value={editedInstagram} onChange={e => setEditedInstagram(e.target.value)} /></div><DialogFooter><Button onClick={handleEditSubmit}>Save</Button></DialogFooter></DialogContent></Dialog>
      <AlertDialog open={deleteAlertOpen} onOpenChange={o => { if (!o) setDeleteAlertOpen(false); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Player?</AlertDialogTitle></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteSubmit} className="bg-destructive">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
}
