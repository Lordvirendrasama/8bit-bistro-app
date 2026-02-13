"use client";

import { useState, useRef, FormEvent } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Camera, Loader2, PartyPopper } from "lucide-react";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { useFirestore } from "@/firebase";

import { AuthGuard } from "@/components/auth/AuthGuard";
import Header from "@/components/layout/Header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGames } from "@/lib/hooks/use-games";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function SubmitScoreForm() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const { games, loading: gamesLoading } = useGames();
  const { toast } = useToast();
  const router = useRouter();

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [selectedGameId, setSelectedGameId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !firestore || !imageFile || isSubmitting) {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "Please fill all fields and provide an image.",
      });
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const gameId = selectedGameId;
    const scoreValue = formData.get("scoreValue") as string;
    const game = games.find((g) => g.id === gameId);

    if (!gameId || !scoreValue || !game) {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "A valid game and score are required.",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // 1. Check submission limit
      const scoresQuery = query(
        collection(firestore, "scoreSubmissions"),
        where("playerId", "==", user.uid),
        where("gameId", "==", gameId)
      );
      const scoresSnapshot = await getDocs(scoresQuery);
      if (scoresSnapshot.size >= 5) {
        toast({
          variant: "destructive",
          title: "Submission Limit Reached",
          description: `You have reached the submission limit of 5 for ${game.name}.`,
        });
        return;
      }

      // 2. Upload image to Storage
      const storage = getStorage(firestore.app);
      const storageRef = ref(
        storage,
        `score_proofs/${user.uid}_${Date.now()}_${imageFile.name}`
      );
      const snapshot = await uploadBytes(storageRef, imageFile, {
        contentType: imageFile.type,
      });
      const imageUrl = await getDownloadURL(snapshot.ref);

      // 3. Get player data
      const playerDocRef = doc(firestore, "players", user.uid);
      const playerDoc = await getDoc(playerDocRef);
      const playerData = playerDoc.data();

      // 4. Prepare score data
      const scoreData = {
        playerId: user.uid,
        playerName: playerData?.name ?? "Unknown Player",
        playerInstagram: playerData?.instagram ?? "",
        gameId,
        gameName: game.name,
        scoreValue: Number(scoreValue),
        imageUrl,
        status: "pending" as const,
        submittedAt: serverTimestamp(),
      };

      // 5. Add score document to Firestore
      await addDoc(collection(firestore, "scoreSubmissions"), scoreData);

      // 6. Success!
      setShowSuccessModal(true);
      formRef.current?.reset();
      setImagePreview(null);
      setImageFile(null);
      setSelectedGameId("");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "An unknown error occurred. Check console for details.";
      console.error("Submission Error:", error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: message,
      });
    } finally {
      // 7. Reset submitting state
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="gameId">Game</Label>
          <Select
            name="gameId"
            onValueChange={setSelectedGameId}
            value={selectedGameId}
            disabled={gamesLoading || isSubmitting}
            required
          >
            <SelectTrigger id="gameId">
              <SelectValue placeholder="Select a game..." />
            </SelectTrigger>
            <SelectContent>
              {gamesLoading ? (
                <SelectItem value="loading" disabled>
                  Loading games...
                </SelectItem>
              ) : (
                games.map((game) => (
                  <SelectItem key={game.id} value={game.id}>
                    {game.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="scoreValue">Score</Label>
          <Input
            id="scoreValue"
            name="scoreValue"
            type="number"
            placeholder="Enter your score"
            required
            disabled={isSubmitting}
          />
        </div>

        <div>
          <Label>Photo Proof</Label>
          <input
            type="file"
            name="image"
            accept="image/*"
            capture="environment"
            ref={fileInputRef}
            onChange={handleImageChange}
            className="hidden"
            required
          />
          <Button
            type="button"
            variant="outline"
            className="w-full h-32 flex-col relative"
            onClick={handleCameraClick}
            disabled={isSubmitting}
          >
            {imagePreview ? (
              <Image
                src={imagePreview}
                alt="Image preview"
                fill
                className="object-contain rounded-md"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Camera className="h-10 w-10" />
                <span className="font-semibold">Tap to open camera</span>
              </div>
            )}
          </Button>
        </div>

        <Button
          type="submit"
          className="w-full text-lg py-6"
          disabled={isSubmitting || !imageFile || !selectedGameId}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Score"
          )}
        </Button>
      </form>

      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader className="items-center text-center">
            <PartyPopper className="h-16 w-16 text-primary animate-bounce" />
            <DialogTitle className="font-headline text-2xl">
              Score Submitted!
            </DialogTitle>
            <DialogDescription>
              Your score is pending approval. You can check the live leaderboard
              soon. Good luck!
            </DialogDescription>
          </DialogHeader>
          <Button
            className="w-full"
            onClick={() => router.push("/dashboard")}
          >
            Back to Dashboard
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SubmitScorePage() {
  return (
    <>
      <Header />
      <div className="container mx-auto max-w-lg p-4">
        <Card className="shadow-2xl shadow-primary/10">
          <CardHeader>
            <CardTitle className="font-headline text-3xl">
              Submit High Score
            </CardTitle>
            <CardDescription>
              Select your game, enter your score, and take a photo of the
              screen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SubmitScoreForm />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default function GuardedSubmitScorePage() {
  return (
    <AuthGuard>
      <SubmitScorePage />
    </AuthGuard>
  );
}
