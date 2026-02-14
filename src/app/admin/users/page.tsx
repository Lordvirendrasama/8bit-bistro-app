"use client";

import { useState, useMemo } from "react";
import { collection, query, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { formatDistanceToNow } from "date-fns";
import { Loader2, ChevronDown, ChevronUp, Instagram, Users, MoreVertical, Edit, Trash2 } from "lucide-react";

import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import type { Player } from "@/types";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function AdminUsersPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const playersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "players"), orderBy("createdAt", "desc"));
  }, [firestore]);

  const { data: players, isLoading: loadingPlayers } = useCollection<Player>(playersQuery);

  const [sortConfig, setSortConfig] = useState<{
    key: keyof Player;
    direction: "ascending" | "descending";
  } | null>({ key: "createdAt", direction: "descending" });

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [editedName, setEditedName] = useState("");
  const [editedInstagram, setEditedInstagram] = useState("");
  const [editedGroupSize, setEditedGroupSize] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sortedPlayers = useMemo(() => {
    if (!players) return [];
    let sortableItems = [...players];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (sortConfig.key === "createdAt") {
          const aDate = a.createdAt?.toDate() ?? new Date(0);
          const bDate = b.createdAt?.toDate() ?? new Date(0);
          if (aDate < bDate) return sortConfig.direction === "ascending" ? -1 : 1;
          if (aDate > bDate) return sortConfig.direction === "ascending" ? 1 : -1;
          return 0;
        }

        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;

        if (String(aValue).toLowerCase() < String(bValue).toLowerCase())
          return sortConfig.direction === "ascending" ? -1 : 1;
        if (String(aValue).toLowerCase() > String(bValue).toLowerCase())
          return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [players, sortConfig]);

  const requestSort = (key: keyof Player) => {
    let direction: "ascending" | "descending" = "ascending";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "ascending"
    ) {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const SortableHeader = ({
    label,
    sortKey,
  }: {
    label: string;
    sortKey: keyof Player;
  }) => (
    <TableHead
      className="cursor-pointer hover:bg-muted/50"
      onClick={() => requestSort(sortKey)}
    >
      <div className="flex items-center gap-2">
        {label}
        {sortConfig?.key === sortKey &&
          (sortConfig.direction === "ascending" ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          ))}
      </div>
    </TableHead>
  );

  const openEditModal = (player: Player) => {
    setSelectedPlayer(player);
    setEditedName(player.name);
    setEditedInstagram(player.instagram || "");
    setEditedGroupSize(String(player.groupSize));
    setEditModalOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedPlayer || isSubmitting || !firestore) return;
    
    const groupSize = parseInt(editedGroupSize, 10);
    if (isNaN(groupSize) || groupSize <= 0) {
      toast({
        title: "Invalid Group Size",
        description: "Please enter a valid positive number for group size.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      await updateDoc(doc(firestore, "players", selectedPlayer.id), {
        name: editedName.trim(),
        instagram: editedInstagram.trim(),
        groupSize,
      });
      toast({ title: "Success", description: "Player details updated." });
      setEditModalOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "Error",
        description: `Failed to update player: ${message}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteAlert = (player: Player) => {
    setSelectedPlayer(player);
    setDeleteAlertOpen(true);
  };

  const handleDeleteSubmit = async () => {
    if (!selectedPlayer || !firestore) return;
    setIsSubmitting(true);
    try {
      await deleteDoc(doc(firestore, "players", selectedPlayer.id));
      toast({ title: "Success", description: "Player deleted." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "Error",
        description: `Failed to delete player: ${message}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setDeleteAlertOpen(false);
      setSelectedPlayer(null);
    }
  };

  if (loadingPlayers) {
    return (
      <div className="p-8 flex justify-center items-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="p-4 md:p-8">
        <h1 className="font-headline text-4xl mb-2">Player Management</h1>
        <p className="text-muted-foreground mb-6">
          View all registered players for the event.
        </p>
        <Card>
          <CardHeader>
            <CardTitle>Registered Players</CardTitle>
            <CardDescription>
              A total of {players?.length ?? 0} players have registered.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHeader label="Player" sortKey="name" />
                    <SortableHeader label="Instagram" sortKey="instagram" />
                    <TableHead>Group Size</TableHead>
                    <SortableHeader label="Registered" sortKey="createdAt" />
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedPlayers.map((player) => (
                    <TableRow key={player.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                              <AvatarFallback>
                                  {player.name ? player.name.charAt(0) : "P"}
                              </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{player.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {player.instagram ? (
                          <a 
                            href={`https://instagram.com/${player.instagram.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Instagram className="h-4 w-4" />
                            {player.instagram}
                          </a>
                        ) : (
                          <span className="text-muted-foreground/50">Not provided</span>
                        )}
                      </TableCell>
                      <TableCell>
                          <Badge variant="outline" className="flex items-center gap-1.5 w-fit">
                              <Users className="h-4 w-4" />
                              {player.groupSize}
                          </Badge>
                      </TableCell>
                      <TableCell>
                        {player.createdAt
                          ? formatDistanceToNow(player.createdAt.toDate(), {
                              addSuffix: true,
                            })
                          : "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onSelect={() => openEditModal(player)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onSelect={() => openDeleteAlert(player)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {sortedPlayers.length === 0 && (
                      <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                              No players have registered yet.
                          </TableCell>
                      </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Player</DialogTitle>
            <DialogDescription>
              Update the details for {selectedPlayer?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Player Name</Label>
              <Input
                id="edit-name"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-instagram">Instagram</Label>
              <Input
                id="edit-instagram"
                value={editedInstagram}
                placeholder="@handle"
                onChange={(e) => setEditedInstagram(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-groupSize">Group Size</Label>
              <Input
                id="edit-groupSize"
                type="number"
                min="1"
                value={editedGroupSize}
                onChange={(e) => setEditedGroupSize(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the player "{selectedPlayer?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSubmit} className="bg-destructive hover:bg-destructive/90" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
