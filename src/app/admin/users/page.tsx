
"use client";

import { useState, useMemo, useEffect } from "react";
import { collection, query, orderBy, doc, updateDoc, deleteDoc, getDocs, writeBatch } from "firebase/firestore";
import { formatDistanceToNow } from "date-fns";
import { Loader2, ChevronDown, ChevronUp, Instagram, Users, MoreVertical, Edit, Trash2 } from "lucide-react";

import { useFirestore, useCollection, useMemoFirebase, FirestorePermissionError, errorEmitter } from "@/firebase";
import { useAuth } from "@/hooks/use-auth";
import type { Player, Event } from "@/types";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


export default function AdminUsersPage() {
  const firestore = useFirestore();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  
  const playersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "players"), orderBy("createdAt", "desc"));
  }, [firestore]);

  const { data: players, isLoading: loadingPlayers } = useCollection<Player>(playersQuery);

  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    if (!firestore) {
      setEventsLoading(false);
      return;
    }
    const fetchEvents = async () => {
      setEventsLoading(true);
      try {
        const eventsQuery = query(collection(firestore, "events"), orderBy("createdAt", 'desc'));
        const querySnapshot = await getDocs(eventsQuery);
        const eventsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
        setEvents(eventsData);
      } catch (error) {
          console.error("Error fetching events:", error);
          toast({
            variant: 'destructive',
            title: 'Failed to load events',
            description: 'Could not fetch events for assignment.',
          });
          setEvents([]);
      } finally {
        setEventsLoading(false);
      }
    };
    fetchEvents();
  }, [firestore, toast]);


  const [sortConfig, setSortConfig] = useState<{
    key: keyof Player;
    direction: "ascending" | "descending";
  } | null>({ key: "createdAt", direction: "descending" });

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  
  const [playerToEdit, setPlayerToEdit] = useState<Player | null>(null);
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);

  const [editedName, setEditedName] = useState("");
  const [editedInstagram, setEditedInstagram] = useState("");
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
    setPlayerToEdit(player);
    setEditedName(player.name);
    setEditedInstagram(player.instagram || "");
    setEditModalOpen(true);
  };

  const handleEditSubmit = () => {
    if (!isAdmin) {
      toast({ variant: 'destructive', title: 'Permission Denied', description: 'You do not have permission to edit players.' });
      return;
    }
    if (!playerToEdit || isSubmitting || !firestore) return;
    
    setIsSubmitting(true);
    const updatedData = {
        name: editedName.trim(),
        instagram: editedInstagram.trim(),
    };
    const playerDocRef = doc(firestore, "players", playerToEdit.id);
    updateDoc(playerDocRef, updatedData)
      .then(() => {
        toast({ title: "Success", description: "Player details updated." });
        setEditModalOpen(false);
      })
      .catch(() => {
        const permissionError = new FirestorePermissionError({
            path: playerDocRef.path,
            operation: 'update',
            requestResourceData: updatedData,
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const openDeleteAlert = (player: Player) => {
    setPlayerToDelete(player);
    setDeleteAlertOpen(true);
  };

  const handleDeleteSubmit = () => {
    if (!isAdmin) {
      toast({ variant: 'destructive', title: 'Permission Denied', description: 'You do not have permission to delete players.' });
      return;
    }
    if (!playerToDelete || !firestore) return;
    setIsSubmitting(true);
    
    const playerDocRef = doc(firestore, "players", playerToDelete.id);
    deleteDoc(playerDocRef)
      .then(() => {
        toast({ title: "Success", description: "Player deleted." });
      })
      .catch(() => {
        const permissionError = new FirestorePermissionError({
            path: playerDocRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setIsSubmitting(false);
        setDeleteAlertOpen(false);
      });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPlayerIds(sortedPlayers.map((p) => p.id));
    } else {
      setSelectedPlayerIds([]);
    }
  };

  const handleSelectPlayer = (playerId: string, checked: boolean) => {
    if (checked) {
      setSelectedPlayerIds((prev) => [...prev, playerId]);
    } else {
      setSelectedPlayerIds((prev) => prev.filter((id) => id !== playerId));
    }
  };

  const handleAssignToEvent = async () => {
    if (!isAdmin) {
      toast({ variant: 'destructive', title: 'Permission Denied', description: 'You cannot assign players to events.' });
      return;
    }
    if (selectedPlayerIds.length === 0 || !selectedEventId || !firestore) {
      toast({ variant: 'destructive', title: 'Assignment Failed', description: 'Please select players and an event.' });
      return;
    }

    setIsAssigning(true);
    const selectedEvent = events.find(e => e.id === selectedEventId);
    if (!selectedEvent) {
        toast({ variant: 'destructive', title: 'Error', description: 'Selected event not found.' });
        setIsAssigning(false);
        return;
    }

    const batch = writeBatch(firestore);
    selectedPlayerIds.forEach(playerId => {
        const playerDocRef = doc(firestore, "players", playerId);
        batch.update(playerDocRef, {
            eventId: selectedEvent.id,
            eventName: selectedEvent.name,
        });
    });

    try {
        await batch.commit();
        toast({
            title: 'Success!',
            description: `${selectedPlayerIds.length} players assigned to ${selectedEvent.name}.`
        });
        setSelectedPlayerIds([]);
        setSelectedEventId("");
    } catch (error) {
        console.error("Batch update failed", error);
        const permissionError = new FirestorePermissionError({
            path: 'players',
            operation: 'update',
            requestResourceData: { eventId: selectedEvent.id, eventName: selectedEvent.name }
        });
        errorEmitter.emit('permission-error', permissionError);
    } finally {
        setIsAssigning(false);
    }
  };

  const numSelected = selectedPlayerIds.length;
  const isAllSelected = numSelected > 0 && numSelected === sortedPlayers.length;

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
            {numSelected > 0 && (
                <div className="mb-4 flex flex-col sm:flex-row items-center gap-4 rounded-lg border bg-muted/50 p-4">
                    <p className="font-medium flex-shrink-0">{numSelected} player{numSelected > 1 ? 's' : ''} selected</p>
                    <div className="flex flex-grow w-full sm:w-auto items-center gap-2">
                        <Select onValueChange={setSelectedEventId} value={selectedEventId} disabled={isAssigning || eventsLoading}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select an event to assign" />
                            </SelectTrigger>
                            <SelectContent>
                                {eventsLoading ? (
                                    <div className="flex items-center justify-center p-2">
                                        <Loader2 className="h-4 w-4 animate-spin"/>
                                    </div>
                                ) : (
                                    events.map(event => <SelectItem key={event.id} value={event.id}>{event.name}</SelectItem>)
                                )}
                            </SelectContent>
                        </Select>
                        <Button onClick={handleAssignToEvent} disabled={isAssigning || !selectedEventId}>
                            {isAssigning && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Assign
                        </Button>
                    </div>
                </div>
            )}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead padding="checkbox" className="w-12">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={(checked) => handleSelectAll(!!checked)}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <SortableHeader label="Player" sortKey="name" />
                    <SortableHeader label="Instagram" sortKey="instagram" />
                    <TableHead>Current Event</TableHead>
                    <SortableHeader label="Registered" sortKey="createdAt" />
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedPlayers.map((player) => (
                    <TableRow key={player.id} data-state={selectedPlayerIds.includes(player.id) && "selected"}>
                      <TableCell padding="checkbox">
                        <Checkbox
                            checked={selectedPlayerIds.includes(player.id)}
                            onCheckedChange={(checked) => handleSelectPlayer(player.id, !!checked)}
                            aria-label={`Select player ${player.name}`}
                        />
                      </TableCell>
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
                        {player.eventName ? <Badge variant="secondary">{player.eventName}</Badge> : <span className="text-muted-foreground/50">None</span>}
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
                            <Button variant="ghost" size="icon" disabled={isSubmitting}>
                              <MoreVertical className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onSelect={() => openEditModal(player)} disabled={isSubmitting}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onSelect={() => openDeleteAlert(player)}
                              disabled={isSubmitting}
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
                          <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
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

      <Dialog open={editModalOpen} onOpenChange={(isOpen) => {
        setEditModalOpen(isOpen);
        if (!isOpen) {
            setPlayerToEdit(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Player</DialogTitle>
            <DialogDescription>
              Update the details for {playerToEdit?.name}.
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
      
      <AlertDialog open={deleteAlertOpen} onOpenChange={(isOpen) => {
          setDeleteAlertOpen(isOpen);
          if (!isOpen) {
              setPlayerToDelete(null);
          }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the player "{playerToDelete?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSubmit}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
