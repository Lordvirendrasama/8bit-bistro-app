
"use client";
import { useState, useEffect, useMemo } from "react";
import {
  collection,
  query,
  doc,
  getDocs,
  updateDoc,
  deleteDoc,
  orderBy,
  where,
  writeBatch,
} from "firebase/firestore";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  Edit,
  MoreVertical,
  Trash2,
  Loader2,
  PlusCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { useFirestore, useCollection, useMemoFirebase, FirestorePermissionError, errorEmitter } from "@/firebase";
import { useAuth } from "@/hooks/use-auth";
import type { Score, Game, Event } from "@/types";

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useGames } from "@/lib/hooks/use-games";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";


// Helper component to avoid hydration mismatch error with date formatting.
const TimeAgo = ({ timestamp }: { timestamp?: { toDate: () => Date } }) => {
  const [text, setText] = useState('');

  useEffect(() => {
    if (timestamp) {
      setText(formatDistanceToNow(timestamp.toDate(), { addSuffix: true }));
    } else {
      setText('N/A');
    }
  }, [timestamp]);

  // Render a placeholder on the server and initial client render
  if (!text) {
    return <>...</>;
  }

  return <>{text}</>;
};

export default function AdminMainPage() {
  const firestore = useFirestore();
  const { isAdmin } = useAuth();
  const { games, loading: gamesLoading } = useGames();
  const [filterEventId, setFilterEventId] = useState<string | "all">("all");
  
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  const [selectedScoreIds, setSelectedScoreIds] = useState<string[]>([]);
  const [selectedEventIdForAssignment, setSelectedEventIdForAssignment] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);

  const { toast } = useToast();

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
            description: 'Could not fetch events due to a permission error. Please check Firestore rules.',
          });
          setEvents([]); // Prevent crash by setting to empty array
      } finally {
        setEventsLoading(false);
      }
    };
    fetchEvents();
  }, [firestore, toast]);


  const scoresQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    let scoresCollectionRef = collection(firestore, "scoreSubmissions");
    let q;
    if (filterEventId === 'all') {
        q = query(scoresCollectionRef, orderBy("submittedAt", "desc"));
    } else {
        q = query(scoresCollectionRef, where("eventId", "==", filterEventId), orderBy("submittedAt", "desc"));
    }
    return q;
  }, [firestore, filterEventId]);

  const { data: scores, isLoading: loadingScores } = useCollection<Score>(scoresQuery);

  const [sortConfig, setSortConfig] = useState<{
    key: keyof Score;
    direction: "ascending" | "descending";
  } | null>(null);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedScore, setSelectedScore] = useState<Score | null>(null);
  const [newScoreValue, setNewScoreValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sortedScores = useMemo(() => {
    let sortableItems = [...(scores || [])];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (sortConfig.key === "submittedAt") {
          const aDate = a.submittedAt?.toDate() ?? new Date(0);
          const bDate = b.submittedAt?.toDate() ?? new Date(0);
          if (aDate < bDate)
            return sortConfig.direction === "ascending" ? -1 : 1;
          if (aDate > bDate)
            return sortConfig.direction === "ascending" ? 1 : -1;
          return 0;
        }

        if (sortConfig.key === "gameName" || sortConfig.key === "eventName") {
          const aName = a[sortConfig.key] ?? "";
          const bName = b[sortConfig.key] ?? "";
          if (aName < bName)
            return sortConfig.direction === "ascending" ? -1 : 1;
          if (aName > bName)
            return sortConfig.direction === "ascending" ? 1 : -1;
          return 0;
        }

        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;

        if (aValue < bValue)
          return sortConfig.direction === "ascending" ? -1 : 1;
        if (aValue > bValue)
          return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [scores, sortConfig]);

  const requestSort = (key: keyof Score) => {
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
    sortKey: keyof Score;
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

  const openEditModal = (score: Score) => {
    setSelectedScore(score);
    setNewScoreValue(String(score.scoreValue));
    setEditModalOpen(true);
  };

  const handleEditSubmit = () => {
    if (!isAdmin) {
      toast({ variant: 'destructive', title: 'Permission Denied', description: 'You do not have permission to edit scores.' });
      return;
    }
    if (!selectedScore || isSubmitting || !firestore) return;

    const scoreValue = parseInt(newScoreValue, 10);
    if (isNaN(scoreValue)) {
      toast({
        title: "Invalid Score",
        description: "Please enter a valid number.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const updatedData = { scoreValue };
    const scoreDocRef = doc(firestore, "scoreSubmissions", selectedScore.id);
    
    updateDoc(scoreDocRef, updatedData)
      .then(() => {
        toast({ title: "Success", description: "Score value updated." });
      })
      .catch(() => {
        const permissionError = new FirestorePermissionError({
            path: scoreDocRef.path,
            operation: 'update',
            requestResourceData: updatedData
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setIsSubmitting(false);
        setEditModalOpen(false);
      });
  };

  const openDeleteModal = (score: Score) => {
    setSelectedScore(score);
    setDeleteModalOpen(true);
  };

  const handleDeleteSubmit = () => {
    if (!isAdmin) {
      toast({ variant: 'destructive', title: 'Permission Denied', description: 'You do not have permission to delete scores.' });
      return;
    }
    if (!selectedScore || isSubmitting || !firestore) return;
    setIsSubmitting(true);
    
    const scoreDocRef = doc(firestore, "scoreSubmissions", selectedScore.id);
    deleteDoc(scoreDocRef)
      .then(() => {
        toast({ title: "Success", description: "Score deleted." });
      })
      .catch(() => {
        const permissionError = new FirestorePermissionError({
            path: scoreDocRef.path,
            operation: 'delete'
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setIsSubmitting(false);
        setDeleteModalOpen(false);
      });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedScoreIds(sortedScores.map((s) => s.id));
    } else {
      setSelectedScoreIds([]);
    }
  };

  const handleSelectScore = (scoreId: string, checked: boolean) => {
    if (checked) {
      setSelectedScoreIds((prev) => [...prev, scoreId]);
    } else {
      setSelectedScoreIds((prev) => prev.filter((id) => id !== scoreId));
    }
  };

  const handleAssignToEvent = async () => {
    if (!isAdmin) {
      toast({ variant: 'destructive', title: 'Permission Denied', description: 'You cannot assign scores to events.' });
      return;
    }
    if (selectedScoreIds.length === 0 || !selectedEventIdForAssignment || !firestore) {
      toast({ variant: 'destructive', title: 'Assignment Failed', description: 'Please select scores and an event.' });
      return;
    }

    setIsAssigning(true);
    const selectedEvent = events.find(e => e.id === selectedEventIdForAssignment);
    if (!selectedEvent) {
        toast({ variant: 'destructive', title: 'Error', description: 'Selected event not found.' });
        setIsAssigning(false);
        return;
    }

    const batch = writeBatch(firestore);
    selectedScoreIds.forEach(scoreId => {
        const scoreDocRef = doc(firestore, "scoreSubmissions", scoreId);
        batch.update(scoreDocRef, {
            eventId: selectedEvent.id,
            eventName: selectedEvent.name,
        });
    });

    try {
        await batch.commit();
        toast({
            title: 'Success!',
            description: `${selectedScoreIds.length} score${selectedScoreIds.length > 1 ? 's' : ''} assigned to ${selectedEvent.name}.`
        });
        setSelectedScoreIds([]);
        setSelectedEventIdForAssignment("");
    } catch (error) {
        console.error("Batch update failed", error);
        const permissionError = new FirestorePermissionError({
            path: 'scoreSubmissions',
            operation: 'update',
            requestResourceData: { eventId: selectedEvent.id, eventName: selectedEvent.name }
        });
        errorEmitter.emit('permission-error', permissionError);
    } finally {
        setIsAssigning(false);
    }
  };

  const numSelected = selectedScoreIds.length;
  const isAllSelected = numSelected > 0 && numSelected === sortedScores.length;

  if (loadingScores || gamesLoading || eventsLoading) {
    return (
      <div className="p-8 flex justify-center items-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="p-4 md:p-8">
        <h1 className="font-headline text-4xl mb-2">Admin Main</h1>
        <p className="text-muted-foreground mb-6">
          Review, approve, or reject player scores.
        </p>
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Score Submissions</CardTitle>
                <CardDescription>
                  A total of {scores?.length ?? 0} scores submitted.
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Select onValueChange={setFilterEventId} defaultValue="all">
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Filter by event" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Events</SelectItem>
                        {events?.map((event) => (
                            <SelectItem key={event.id} value={event.id}>
                                {event.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button asChild>
                  <Link href="/admin/games">
                    <PlusCircle className="mr-2 h-4 w-4" /> Manage Games
                  </Link>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {numSelected > 0 && (
                <div className="mb-4 flex flex-col sm:flex-row items-center gap-4 rounded-lg border bg-muted/50 p-4">
                    <p className="font-medium flex-shrink-0">{numSelected} score{numSelected > 1 ? 's' : ''} selected</p>
                    <div className="flex flex-grow w-full sm:w-auto items-center gap-2">
                        <Select onValueChange={setSelectedEventIdForAssignment} value={selectedEventIdForAssignment} disabled={isAssigning || eventsLoading}>
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
                        <Button onClick={handleAssignToEvent} disabled={isAssigning || !selectedEventIdForAssignment}>
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
                    <TableHead>Player</TableHead>
                    <SortableHeader label="Event" sortKey="eventName" />
                    <SortableHeader label="Game" sortKey="gameName" />
                    <SortableHeader label="Score" sortKey="scoreValue" />
                    <TableHead>Level</TableHead>
                    <SortableHeader label="Submitted" sortKey="submittedAt" />
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedScores.map((score) => (
                    <TableRow key={score.id} data-state={selectedScoreIds.includes(score.id) && "selected"}>
                      <TableCell padding="checkbox">
                        <Checkbox
                            checked={selectedScoreIds.includes(score.id)}
                            onCheckedChange={(checked) => handleSelectScore(score.id, !!checked)}
                            aria-label={`Select score by ${score.playerName}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {score.playerName
                                ? score.playerName.charAt(0)
                                : "P"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {score.playerName ?? "Unknown Player"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {score.playerInstagram}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{score.eventName}</TableCell>
                      <TableCell>{score.gameName}</TableCell>
                      <TableCell className="font-mono">
                        {score.scoreValue.toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono">{score.level}</TableCell>
                      <TableCell>
                        <TimeAgo timestamp={score.submittedAt} />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem
                              onSelect={() => openEditModal(score)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Score
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onSelect={() => openDeleteModal(score)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Edit Modal */}
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Score</DialogTitle>
              <DialogDescription>
                Update the score value for{" "}
                {selectedScore?.playerName ?? "this player"}.
              </DialogDescription>
            </DialogHeader>
            <Input
              type="number"
              value={newScoreValue}
              onChange={(e) => setNewScoreValue(e.target.value)}
              placeholder="Enter new score"
            />
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditModalOpen(false)}
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

        {/* Delete Modal */}
        <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Are you sure?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete the
                score submission.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteSubmit}
                variant="destructive"
                disabled={isSubmitting}
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
