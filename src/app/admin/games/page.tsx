"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { Loader2, PlusCircle, Trash2 } from "lucide-react";

import { useFirestore } from "@/firebase";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function AdminGamesPage() {
  const firestore = useFirestore();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGameName, setNewGameName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

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
    });

    return () => unsubscribe();
  }, [firestore]);

  const handleAddGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGameName.trim() || isSubmitting || !firestore) return;

    setIsSubmitting(true);
    
    try {
        await addDoc(collection(firestore, "games"), {
            name: newGameName.trim(),
            isActive: true,
        });
        toast({ title: "Success", description: `Game '${newGameName.trim()}' added.` });
        setNewGameName("");
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        toast({
            title: "Error",
            description: `Failed to add game: ${message}`,
            variant: "destructive",
        });
    }

    setIsSubmitting(false);
  };

  const handleDeleteGame = async (gameId: string) => {
    if (!firestore) return;
    try {
        await deleteDoc(doc(firestore, "games", gameId));
        toast({ title: "Success", description: "Game deleted." });
    } catch(error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        toast({
            title: "Error",
            description: `Failed to delete game: ${message}`,
            variant: "destructive",
        });
    }
  };

  const handleStatusToggle = async (gameId: string, currentStatus: boolean) => {
    if (!firestore) return;
    try {
        await updateDoc(doc(firestore, "games", gameId), {
            isActive: !currentStatus,
        });
        toast({
            title: "Success",
            description: "Game status updated.",
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        toast({
            title: "Error",
            description: `Failed to update status: ${message}`,
            variant: "destructive",
        });
    }
  };

  return (
    <div className="p-4 md:p-8">
      <h1 className="font-headline text-4xl mb-6">Game Management</h1>
        <Card>
          <CardHeader>
            <CardTitle>Manage Games</CardTitle>
            <CardDescription>
              Add new games and toggle their active status for the event.
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
              <Button type="submit" disabled={!newGameName.trim() || isSubmitting}>
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
                                onCheckedChange={() => handleStatusToggle(game.id, game.isActive)}
                            />
                            <Label htmlFor={`active-switch-${game.id}`} className={game.isActive ? 'text-green-400' : 'text-muted-foreground'}>
                                {game.isActive ? 'Active' : 'Inactive'}
                            </Label>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Are you sure?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the game "{game.name}" and may affect existing score submissions.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteGame(game.id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                  {games.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">No games added yet.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
    </div>
  );
}
