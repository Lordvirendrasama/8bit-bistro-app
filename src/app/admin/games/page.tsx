
"use client";

import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import {
  Edit,
  Loader2,
  MoreVertical,
  PlusCircle,
  Trash2,
} from "lucide-react";

import { useFirestore, FirestorePermissionError, errorEmitter } from "@/firebase";
import type { Game } from "@/types";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function AdminGamesPage() {
  const firestore = useFirestore();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGameName, setNewGameName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [editedGameName, setEditedGameName] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [gameToDelete, setGameToDelete] = useState<Game | null>(null);

  useEffect(() => {
    if (!firestore) return;
    const q = query(collection(firestore, "games"), orderBy("name"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const gamesData: Game[] = [];
      snapshot.forEach((doc) => {
        gamesData.push({ id: doc.id, ...doc.data() } as Game);
      });
      setGames(gamesData);
      setLoading(false);
    }, (err) => {
        const contextualError = new FirestorePermissionError({
            path: 'games',
            operation: 'list',
        });
        errorEmitter.emit('permission-error', contextualError);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore]);

  const handleAddGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGameName.trim() || isSubmitting || !firestore) return;

    setIsSubmitting(true);

    const gameData = {
      name: newGameName.trim(),
      isActive: true,
    };
    const gamesCollection = collection(firestore, "games");
    addDoc(gamesCollection, gameData)
      .then(() => {
        toast({
          title: "Success",
          description: `Game '${newGameName.trim()}' added.`,
        });
        setNewGameName("");
      })
      .catch(() => {
        const permissionError = new FirestorePermissionError({
            path: gamesCollection.path,
            operation: 'create',
            requestResourceData: gameData
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const openDeleteAlert = (game: Game) => {
    setGameToDelete(game);
    setDeleteAlertOpen(true);
  };

  const handleDeleteGame = () => {
    if (!firestore || !gameToDelete) return;
    
    const gameDocRef = doc(firestore, "games", gameToDelete.id);
    deleteDoc(gameDocRef)
      .then(() => {
        toast({ title: "Success", description: "Game deleted." });
      })
      .catch(() => {
        const permissionError = new FirestorePermissionError({
            path: gameDocRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setDeleteAlertOpen(false);
      });
  };

  const handleStatusToggle = (gameId: string, currentStatus: boolean) => {
    if (!firestore) return;
    
    const gameDocRef = doc(firestore, "games", gameId);
    const updatedData = { isActive: !currentStatus };
    updateDoc(gameDocRef, updatedData)
      .then(() => {
        toast({
          title: "Success",
          description: "Game status updated.",
        });
      })
      .catch(() => {
        const permissionError = new FirestorePermissionError({
            path: gameDocRef.path,
            operation: 'update',
            requestResourceData: updatedData
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const openEditModal = (game: Game) => {
    setSelectedGame(game);
    setEditedGameName(game.name);
    setEditModalOpen(true);
  };

  const handleEditGame = () => {
    if (!firestore || !selectedGame || !editedGameName.trim() || isEditing) return;

    setIsEditing(true);

    const gameDocRef = doc(firestore, "games", selectedGame.id);
    const updatedData = { name: editedGameName.trim() };
    updateDoc(gameDocRef, updatedData)
      .then(() => {
        toast({ title: "Success", description: "Game name updated." });
        setEditModalOpen(false);
      })
      .catch(() => {
        const permissionError = new FirestorePermissionError({
            path: gameDocRef.path,
            operation: 'update',
            requestResourceData: updatedData
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setIsEditing(false);
      });
  };

  return (
    <div className="p-4 md:p-8">
      <h1 className="font-headline text-4xl mb-6">Game Management</h1>
      <Card>
        <CardHeader>
          <CardTitle>Manage Games</CardTitle>
          <CardDescription>
            Add new games and manage their details for the event.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddGame} className="flex gap-2 mb-8">
            <Input
              value={newGameName}
              onChange={(e) => setNewGameName(e.target.value)}
              placeholder="e.g., Pac-Man"
              disabled={isSubmitting}
            />
            <Button
              type="submit"
              disabled={!newGameName.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PlusCircle className="mr-2 h-4 w-4" />
              )}
              Add Game
            </Button>
          </form>

          {loading ? (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {games.map((game) => (
                  <TableRow key={game.id}>
                    <TableCell className="font-medium">{game.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`active-switch-${game.id}`}
                          checked={game.isActive}
                          onCheckedChange={() =>
                            handleStatusToggle(game.id, game.isActive)
                          }
                        />
                        <Label
                          htmlFor={`active-switch-${game.id}`}
                          className={
                            game.isActive
                              ? "text-primary"
                              : "text-muted-foreground"
                          }
                        >
                          {game.isActive ? "Active" : "Inactive"}
                        </Label>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onSelect={() => openEditModal(game)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onSelect={() => openDeleteAlert(game)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {games.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-muted-foreground"
                    >
                      No games added yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Game Name</DialogTitle>
            <DialogDescription>
              Change the name for &quot;{selectedGame?.name}&quot;.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={editedGameName}
            onChange={(e) => setEditedGameName(e.target.value)}
            disabled={isEditing}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleEditGame} disabled={isEditing}>
              {isEditing && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Alert */}
      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the game &quot;{gameToDelete?.name}
              &quot; and may affect existing score submissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDeleteGame()}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
