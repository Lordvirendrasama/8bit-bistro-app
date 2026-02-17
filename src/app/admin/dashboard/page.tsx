
"use client";
import { useState, useEffect, useMemo } from "react";
import {
  collection,
  query,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  where,
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
  const { games, loading: gamesLoading } = useGames();
  const [selectedEventId, setSelectedEventId] = useState<string | "all">("all");
  
  const eventsQuery = useMemoFirebase(() => {
      if (!firestore) return null;
      return query(collection(firestore, "events"), orderBy("createdAt", 'desc'));
  }, [firestore]);
  const { data: events, isLoading: eventsLoading } = useCollection<Event>(eventsQuery);

  const scoresQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    let scoresCollectionRef = collection(firestore, "scoreSubmissions");
    let q;
    if (selectedEventId === 'all') {
        q = query(scoresCollectionRef, orderBy("submittedAt", "desc"));
    } else {
        q = query(scoresCollectionRef, where("eventId", "==", selectedEventId), orderBy("submittedAt", "desc"));
    }
    return q;
  }, [firestore, selectedEventId]);

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

  const { toast } = useToast();

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
                <Select onValueChange={setSelectedEventId} defaultValue="all">
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
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
                    <TableRow key={score.id}>
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
