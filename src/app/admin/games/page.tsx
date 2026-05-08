
"use client";
import { useState } from "react";
import { collection, query, orderBy, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { Edit, Loader2, MoreVertical, PlusCircle, Trash2 } from "lucide-react";
import { useFirestore, FirestorePermissionError, errorEmitter, useCollection, useMemoFirebase } from "@/firebase";
import { useAuth } from "@/hooks/use-auth";
import type { Game } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function AdminGamesPage() {
  const firestore = useFirestore();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const gamesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, "games"), orderBy("name")) : null, [firestore]);
  const { data: games, isLoading: loading } = useCollection<Game>(gamesQuery);
  const [newGameName, setNewGameName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [editedGameName, setEditedGameName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [gameToDelete, setGameToDelete] = useState<Game | null>(null);

  const handleAddGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !newGameName.trim() || isSubmitting || !firestore) return;
    setIsSubmitting(true);
    addDoc(collection(firestore, "games"), { name: newGameName.trim(), isActive: true })
      .then(() => { toast({ title: "Success" }); setNewGameName(""); })
      .catch(() => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'games', operation: 'create' })))
      .finally(() => setIsSubmitting(false));
  };

  const handleStatusToggle = (gameId: string, currentStatus: boolean) => {
    if (!isAdmin || !firestore) return;
    updateDoc(doc(firestore, "games", gameId), { isActive: !currentStatus })
      .then(() => toast({ title: "Updated" }))
      .catch(() => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'games', operation: 'update' })));
  };

  const openEditModal = (game: Game) => { setSelectedGame(game); setEditedGameName(game.name); setEditModalOpen(true); };

  const handleEditGame = () => {
    if (!isAdmin || !firestore || !selectedGame || isEditing) return;
    setIsEditing(true);
    updateDoc(doc(firestore, "games", selectedGame.id), { name: editedGameName.trim() })
      .then(() => { toast({ title: "Success" }); setEditModalOpen(false); })
      .catch(() => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'games', operation: 'update' })))
      .finally(() => setIsEditing(false));
  };

  const handleDeleteGame = () => {
    if (!isAdmin || !firestore || !gameToDelete) return;
    deleteDoc(doc(firestore, "games", gameToDelete.id))
      .then(() => toast({ title: "Deleted" }))
      .catch(() => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'games', operation: 'delete' })))
      .finally(() => setDeleteAlertOpen(false));
  };

  return (
    <div className="p-4 md:p-8">
      <h1 className="font-headline text-4xl mb-6">Game Management</h1>
      <Card>
        <CardContent>
          <form onSubmit={handleAddGame} className="flex gap-2 mb-8">
            <Input value={newGameName} onChange={(e) => setNewGameName(e.target.value)} placeholder="e.g. Pac-Man" />
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}Add</Button>
          </form>
          {loading ? <Loader2 className="animate-spin mx-auto" /> : (
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {games?.map((game) => (
                  <TableRow key={game.id}>
                    <TableCell>{game.name}</TableCell>
                    <TableCell><Switch checked={game.isActive} onCheckedChange={() => handleStatusToggle(game.id, game.isActive)} /></TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-5 w-5" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => setTimeout(() => openEditModal(game), 0)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onSelect={() => setTimeout(() => { setGameToDelete(game); setDeleteAlertOpen(true); }, 0)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Dialog open={editModalOpen} onOpenChange={(o) => { if (!o) setEditModalOpen(false); }}>
        <DialogContent><DialogHeader><DialogTitle>Edit Game</DialogTitle></DialogHeader><Input value={editedGameName} onChange={(e) => setEditedGameName(e.target.value)} /><DialogFooter><Button onClick={handleEditGame} disabled={isEditing}>Save</Button></DialogFooter></DialogContent>
      </Dialog>
      <AlertDialog open={deleteAlertOpen} onOpenChange={(o) => { if (!o) setDeleteAlertOpen(false); }}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Game?</AlertDialogTitle></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteGame} className="bg-destructive">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
