
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
} from "firebase/firestore";
import Link from "next/link";
import Image from "next/image";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Edit,
  MoreVertical,
  Trash2,
  Sparkles,
  Loader2,
  PlusCircle,
  ImageOff,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import type { Score } from "@/types";
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
  
  const scoresQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "scoreSubmissions"), orderBy("submittedAt", "desc"));
  }, [firestore]);

  const { data: scores, isLoading: loadingScores } = useCollection<Score>(scoresQuery);

  const [sortConfig, setSortConfig] = useState<{
    key: keyof Score;
    direction: "ascending" | "descending";
  } | null>(null);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [aiVerifyModalOpen, setAiVerifyModalOpen] = useState(false);
  const [selectedScore, setSelectedScore] = useState<Score | null>(null);
  const [newScoreValue, setNewScoreValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiVerificationResult, setAiVerificationResult] =
    useState<AdminScoreImageVerificationAssistantOutput | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

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

        if (sortConfig.key === "gameName") {
          const aGameName = a.gameName ?? "";
          const bGameName = b.gameName ?? "";
          if (aGameName < bGameName)
            return sortConfig.direction === "ascending" ? -1 : 1;
          if (aGameName > bGameName)
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

  const openDeleteModal = (score: Score) => {
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

  const openAiVerifyModal = async (score: Score) => {
    setSelectedScore(score);
    setAiVerifyModalOpen(true);
    setIsVerifying(true);
    setAiVerificationResult(null);

    try {
      if (!firestore) throw new Error("Firestore not available");

      const { imageUrl, scoreValue, gameName } = score;

      if (!imageUrl) {
        toast({
          title: "Cannot Verify",
          description: "Image is not yet available for this submission.",
          variant: "destructive",
        });
        setAiVerifyModalOpen(false);
        setIsVerifying(false);
        return;
      }

      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error("Failed to fetch image from storage.");

      const blob = await response.blob();
      const photoDataUri = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

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
              <Sparkles className="h-5 w-5 text-green-400" />
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
                      <TableCell>{score.gameName}</TableCell>
                      <TableCell className="font-mono">
                        {score.scoreValue.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <TimeAgo timestamp={score.submittedAt} />
                      </TableCell>
                      <TableCell>
                        {score.imageUrl ? (
                          <Link
                            href={score.imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative block h-16 w-28 overflow-hidden rounded-md border group"
                          >
                            <Image
                              src={score.imageUrl}
                              alt={`Score proof for ${score.playerName}`}
                              fill
                              className="object-cover transition-transform group-hover:scale-110"
                            />
                          </Link>
                        ) : (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex h-16 w-28 items-center justify-center rounded-md border border-dashed bg-muted/50">
                                <ImageOff className="h-6 w-6 text-muted-foreground" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>No image submitted.</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
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
                            <DropdownMenuItem
                              onSelect={() =>
                                score.imageUrl && openAiVerifyModal(score)
                              }
                              disabled={!score.imageUrl}
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

        {/* AI Verify Modal */}
        <Dialog open={aiVerifyModalOpen} onOpenChange={setAiVerifyModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>AI Score Verification</DialogTitle>
              <DialogDescription>
                Comparing the submitted image with the entered score value.
              </DialogDescription>
            </DialogHeader>
            {renderAiVerificationResult()}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
