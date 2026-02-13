"use client";
import { useState, useEffect, useMemo } from "react";
import {
  collection,
  query,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Edit,
  FileImage,
  HelpCircle,
  MoreVertical,
  Trash2,
  XCircle,
  Sparkles,
  Loader2,
  PlusCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import type { Score, Player, ScoreStatus } from "@/types";
import { adminScoreImageVerificationAssistant } from "@/ai/flows/admin-score-image-verification-assistant";

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
import { Badge } from "@/components/ui/badge";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { AdminScoreImageVerificationAssistantOutput } from "@/ai/flows/admin-score-image-verification-assistant";
import { useGames } from "@/lib/hooks/use-games";

type EnrichedScore = Score & { player?: Player; gameName?: string };
type ScoreData = Omit<Score, "id">;

export default function AdminDashboardPage() {
  const firestore = useFirestore();
  const { games, loading: gamesLoading } = useGames();

  const scoresQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "scoreSubmissions"));
  }, [firestore]);

  const { data: scores, isLoading: loadingScores } =
    useCollection<ScoreData>(scoresQuery);

  const [players, setPlayers] = useState<Map<string, Player>>(new Map());
  const [sortConfig, setSortConfig] = useState<{
    key: keyof EnrichedScore;
    direction: "ascending" | "descending";
  } | null>({ key: "submittedAt", direction: "descending" });

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [aiVerifyModalOpen, setAiVerifyModalOpen] = useState(false);
  const [selectedScore, setSelectedScore] = useState<EnrichedScore | null>(
    null
  );
  const [newScoreValue, setNewScoreValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiVerificationResult, setAiVerificationResult] =
    useState<AdminScoreImageVerificationAssistantOutput | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    if (!firestore) return;
    const playersQuery = query(collection(firestore, "players"));
    const unsubscribePlayers = onSnapshot(playersQuery, (snapshot) => {
      const playersMap = new Map<string, Player>();
      snapshot.forEach((doc) => {
        playersMap.set(doc.id, { id: doc.id, ...doc.data() } as Player);
      });
      setPlayers(playersMap);
    });

    return () => unsubscribePlayers();
  }, [firestore]);

  const enrichedScores = useMemo(() => {
    return (scores ?? []).map((score) => ({
      ...score,
      player: players.get(score.playerId),
      gameName: games.find((g) => g.id === score.gameId)?.name ?? "Unknown Game",
    }));
  }, [scores, players, games]);

  const sortedScores = useMemo(() => {
    let sortableItems = [...enrichedScores];
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

        if (sortConfig.key === "gameName") {
          const aGameName = a.gameName ?? "";
          const bGameName = b.gameName ?? "";
          if (aGameName < bGameName)
            return sortConfig.direction === "ascending" ? -1 : 1;
          if (aGameName > bGameName)
            return sortConfig.direction === "ascending" ? 1 : -1;
          return 0;
        }

        if (aValue < bValue)
          return sortConfig.direction === "ascending" ? -1 : 1;
        if (aValue > bValue)
          return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [enrichedScores, sortConfig]);

  const requestSort = (key: keyof EnrichedScore) => {
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
    sortKey: keyof EnrichedScore;
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

  const handleStatusUpdate = async (id: string, status: ScoreStatus) => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, "scoreSubmissions", id), { status });
      toast({
        title: "Success",
        description: `Score status updated to ${status}.`,
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

  const openEditModal = (score: EnrichedScore) => {
    setSelectedScore(score);
    setNewScoreValue(String(score.scoreValue));
    setEditModalOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedScore || isSubmitting || !firestore) return;
    setIsSubmitting(true);
    const scoreValue = parseInt(newScoreValue, 10);
    if (isNaN(scoreValue)) {
      toast({
        title: "Invalid Score",
        description: "Please enter a valid number.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }
    try {
      await updateDoc(doc(firestore, "scoreSubmissions", selectedScore.id), {
        scoreValue,
      });
      toast({ title: "Success", description: "Score value updated." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "Error",
        description: `Failed to update score: ${message}`,
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
    setEditModalOpen(false);
  };

  const openDeleteModal = (score: EnrichedScore) => {
    setSelectedScore(score);
    setDeleteModalOpen(true);
  };

  const handleDeleteSubmit = async () => {
    if (!selectedScore || isSubmitting || !firestore) return;
    setIsSubmitting(true);
    try {
      await deleteDoc(doc(firestore, "scoreSubmissions", selectedScore.id));
      toast({ title: "Success", description: "Score deleted." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "Error",
        description: `Failed to delete score: ${message}`,
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
    setDeleteModalOpen(false);
  };

  const openAiVerifyModal = async (score: EnrichedScore) => {
    setSelectedScore(score);
    setAiVerifyModalOpen(true);
    setIsVerifying(true);
    setAiVerificationResult(null);

    try {
      if (!firestore) throw new Error("Firestore not available");
      const scoreDoc = await getDoc(
        doc(firestore, "scoreSubmissions", score.id)
      );
      if (!scoreDoc.exists()) throw new Error("Score not found");

      const scoreData = scoreDoc.data();
      const { imageUrl, scoreValue, gameId } = scoreData;
      const gameName =
        games.find((g) => g.id === gameId)?.name ?? "Unknown Game";

      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error("Failed to fetch image from storage.");

      const imageBuffer = await response.arrayBuffer();
      const imageBase64 = Buffer.from(imageBuffer).toString("base64");
      const mimeType = response.headers.get("content-type") || "image/jpeg";
      const photoDataUri = `data:${mimeType};base64,${imageBase64}`;

      const aiResult = await adminScoreImageVerificationAssistant({
        photoDataUri,
        enteredScore: scoreValue,
        gameName,
      });

      setAiVerificationResult(aiResult);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "AI Verification Error",
        description: message,
        variant: "destructive",
      });
      setAiVerifyModalOpen(false);
    }
    setIsVerifying(false);
  };

  const getStatusBadge = (status: ScoreStatus) => {
    switch (status) {
      case "approved":
        return (
          <Badge variant="secondary" className="bg-green-600/80 text-white">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Rejected
          </Badge>
        );
      case "pending":
      default:
        return (
          <Badge variant="outline" className="text-amber-400 border-amber-400">
            <HelpCircle className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
    }
  };

  const renderAiVerificationResult = () => {
    if (isVerifying) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">
            AI is analyzing the score...
          </p>
        </div>
      );
    }
    if (!aiVerificationResult) return null;

    const { isVerified, imageDetectedScore, discrepancyReason, confidence } =
      aiVerificationResult;

    return (
      <div className="space-y-4">
        <div
          className={`p-4 rounded-lg ${
            isVerified ? "bg-green-900/50" : "bg-destructive/20"
          }`}
        >
          <div className="flex items-center gap-2">
            {isVerified ? (
              <CheckCircle2 className="h-5 w-5 text-green-400" />
            ) : (
              <AlertCircle className="h-5 w-5 text-destructive" />
            )}
            <h3 className="text-lg font-bold">
              {isVerified ? "Score Verified" : "Discrepancy Found"}
            </h3>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {discrepancyReason}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-card p-3 rounded-md">
            <p className="text-muted-foreground">Entered Score</p>
            <p className="font-bold text-lg">
              {selectedScore?.scoreValue.toLocaleString()}
            </p>
          </div>
          <div className="bg-card p-3 rounded-md">
            <p className="text-muted-foreground">AI Detected Score</p>
            <p className="font-bold text-lg">
              {imageDetectedScore?.toLocaleString() ?? "N/A"}
            </p>
          </div>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">
            AI Confidence:{" "}
            <span className="font-mono text-foreground">
              {(confidence * 100).toFixed(1)}%
            </span>
          </p>
        </div>
      </div>
    );
  };

  if (loadingScores || gamesLoading) {
    return (
      <div className="p-8 flex justify-center items-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="p-4 md:p-8">
        <h1 className="font-headline text-4xl mb-2">Admin Dashboard</h1>
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
              <Button asChild>
                <Link href="/admin/games">
                  <PlusCircle className="mr-2 h-4 w-4" /> Manage Games
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <SortableHeader label="Game" sortKey="gameName" />
                    <SortableHeader label="Score" sortKey="scoreValue" />
                    <SortableHeader label="Status" sortKey="status" />
                    <SortableHeader label="Submitted" sortKey="submittedAt" />
                    <TableHead>Image</TableHead>
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
                              {score.player?.name
                                ? score.player.name.charAt(0)
                                : "P"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {score.player?.name ?? "Unknown Player"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {score.player?.instagram}
                            </div>
                          </div>
                          {score.isSuspicious && (
                            <Tooltip>
                              <TooltipTrigger>
                                <AlertCircle className="h-4 w-4 text-amber-400" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p className="font-bold">Suspicious Activity</p>
                                <p>{score.suspicionReason}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{score.gameName}</TableCell>
                      <TableCell className="font-mono">
                        {score.scoreValue.toLocaleString()}
                      </TableCell>
                      <TableCell>{getStatusBadge(score.status)}</TableCell>
                      <TableCell>
                        {score.submittedAt
                          ? formatDistanceToNow(score.submittedAt.toDate(), {
                              addSuffix: true,
                            })
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" asChild>
                          <Link
                            href={score.imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <FileImage className="h-5 w-5" />
                          </Link>
                        </Button>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {score.status !== "approved" && (
                              <DropdownMenuItem
                                onSelect={() =>
                                  handleStatusUpdate(score.id, "approved")
                                }
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Approve
                              </DropdownMenuItem>
                            )}
                            {score.status !== "rejected" && (
                              <DropdownMenuItem
                                onSelect={() =>
                                  handleStatusUpdate(score.id, "rejected")
                                }
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Reject
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onSelect={() => openEditModal(score)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Score
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => openAiVerifyModal(score)}
                            >
                              <Sparkles className="mr-2 h-4 w-4" />
                              Verify with AI
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
                {selectedScore?.player?.name ?? "this player"}.
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
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteSubmit}
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

        {/* AI Verify Modal */}
        <Dialog open={aiVerifyModalOpen} onOpenChange={setAiVerifyModalOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Score Verification
              </DialogTitle>
              <DialogDescription>
                AI analysis of the submitted photo vs. the entered score.
              </DialogDescription>
            </DialogHeader>
            {renderAiVerificationResult()}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setAiVerifyModalOpen(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
