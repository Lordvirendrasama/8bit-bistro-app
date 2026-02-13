"use client";

import { useState, useRef, FormEvent, ChangeEvent, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Camera, Loader2, PartyPopper } from "lucide-react";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  FirebaseStorage,
} from "firebase/storage";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  query,
  where,
  getDocs,
  orderBy,
  Firestore,
} from "firebase/firestore";
import { useFirestore, useAuth as useFirebaseAuthInstance } from "@/firebase";
import { User, signInAnonymously } from "firebase/auth";

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
import { useGames } from "@/lib/hooks/use-games";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { proactiveFraudDetectionForScoreSubmissions } from "@/ai/flows/proactive-fraud-detection-for-score-submissions-flow";

/**
 * Handles background tasks for a submission: image upload and AI fraud analysis.
 * This function is designed to be called without being awaited.
 */
const uploadAndAnalyze = async ({
  firestore,
  storage,
  docId,
  imageFile,
  scoreData,
  user,
}: {
  firestore: Firestore;
  storage: FirebaseStorage;
  docId: string;
  imageFile: File;
  scoreData: any;
  user: User;
}) => {
  try {
    // 1. Upload image
    const storageRef = ref(
      storage,
      `score_proofs/${user.uid}_${Date.now()}_${imageFile.name}`
    );
    const snapshot = await uploadBytes(storageRef, imageFile, {
      contentType: imageFile.type,
    });
    const imageUrl = await getDownloadURL(snapshot.ref);

    // 2. Update doc with image URL
    const scoreDocRef = doc(firestore, "scoreSubmissions", docId);
    await updateDoc(scoreDocRef, { imageUrl });

    // 3. Proactive Fraud Detection
    const playerContext = {
      name: scoreData.playerName,
      instagram: scoreData.playerInstagram,
    };

    const previousScoresQuery = query(
      collection(firestore, "scoreSubmissions"),
      where("playerName", "==", scoreData.playerName),
      where("gameId", "==", scoreData.gameId),
      orderBy("submittedAt", "desc")
    );
    const previousScoresSnapshot = await getDocs(previousScoresQuery);
    const previousScoresByPlayerForGame = previousScoresSnapshot.docs
      .map((doc) => {
        const data = doc.data();
        if (doc.id === docId || !data.submittedAt) return null;
        return {
          scoreValue: data.scoreValue,
          timestamp: data.submittedAt.toDate().toISOString(),
        };
      })
      .filter((item): item is { scoreValue: number; timestamp: string } =>
        item !== null
      );

    const fraudCheckResult = await proactiveFraudDetectionForScoreSubmissions({
      currentSubmission: {
        playerId: scoreData.playerId,
        gameName: scoreData.gameName,
        scoreValue: scoreData.scoreValue,
        imageURL: imageUrl,
        timestamp: new Date().toISOString(),
      },
      playerContext,
      previousScoresByPlayerForGame,
    });

    if (fraudCheckResult.isSuspicious) {
      await updateDoc(scoreDocRef, {
        isSuspicious: true,
        suspicionReason: `${fraudCheckResult.reason} (Confidence: ${fraudCheckResult.confidence}%)`,
      });
    }
  } catch (error) {
    console.error("Error in background submission task:", error);
    try {
      const scoreDocRef = doc(firestore, "scoreSubmissions", docId);
      await updateDoc(scoreDocRef, {
        status: "rejected",
        suspicionReason:
          "Background processing failed. Error: " +
          (error instanceof Error ? error.message : "Unknown"),
      });
    } catch (updateError) {
      console.error(
        "Failed to update submission with error status:",
        updateError
      );
    }
  }
};

function HomePage() {
  const { user, loading: userLoading } = useAuth();
  const auth = useFirebaseAuthInstance();
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
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [instagram, setInstagram] = useState("");

  useEffect(() => {
    if (!userLoading && !user && auth) {
      signInAnonymously(auth).catch((error) => {
        console.error("Anonymous sign-in failed:", error);
        toast({
          variant: "destructive",
          title: "Authentication Failed",
          description: "Could not sign you in. Please refresh the page.",
        });
      });
    }
  }, [user, userLoading, auth, toast]);

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = document.createElement("img");
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 1280;
          const MAX_HEIGHT = 720;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            return reject(new Error("Could not get canvas context"));
          }
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const newFile = new File([blob], file.name, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });
                resolve(newFile);
              } else {
                reject(new Error("Canvas to blob conversion failed"));
              }
            },
            "image/jpeg",
            0.8
          );
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsProcessingImage(true);
      setImagePreview(null);
      try {
        const compressedFile = await compressImage(file);
        setImageFile(compressedFile);

        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error("Image compression error:", error);
        toast({
          variant: "destructive",
          title: "Image Error",
          description: "Could not process image. Please try another one.",
        });
        setImageFile(null);
      } finally {
        setIsProcessingImage(false);
      }
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const scoreValue = formData.get("scoreValue") as string;
    const game = games.find((g) => g.id === selectedGameId);

    if (
      !user ||
      !firestore ||
      !imageFile ||
      !selectedGameId ||
      !scoreValue ||
      !playerName.trim() ||
      !game
    ) {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description:
          "Please select a game, enter a player name and score, and provide an image.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const scoreData = {
        playerId: user.uid,
        playerName: playerName.trim(),
        playerInstagram: instagram.trim(),
        gameId: selectedGameId,
        gameName: game.name,
        scoreValue: Number(scoreValue),
        status: "pending" as const,
        submittedAt: serverTimestamp(),
      };

      const docRef = await addDoc(
        collection(firestore, "scoreSubmissions"),
        scoreData
      );

      // --- Submission successful, start background tasks ---
      setShowSuccessModal(true);

      const imageToUpload = imageFile;
      const storage = getStorage(firestore.app);

      uploadAndAnalyze({
        firestore,
        storage,
        docId: docRef.id,
        imageFile: imageToUpload,
        scoreData,
        user,
      });

      // Reset form
      formRef.current?.reset();
      setImagePreview(null);
      setImageFile(null);
      setSelectedGameId("");
      setPlayerName("");
      setInstagram("");
    } catch (error) {
      console.error("Submission Error:", error);
      let description = "An unknown error occurred. Please try again.";
      if (error instanceof Error && error.message.includes("max retries")) {
        description =
          "Could not connect to the database. Please check your internet connection and try again in a moment.";
      } else if (error instanceof Error) {
        description = error.message;
      }

      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: description,
      });
    }

    setIsSubmitting(false);
  };

  if (userLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="container mx-auto max-w-lg p-4">
        <Card className="shadow-2xl shadow-primary/10">
          <CardHeader>
            <CardTitle className="font-headline text-3xl">
              Enter High Score
            </CardTitle>
            <CardDescription>
              Enter a player's score and take a photo of the screen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
               <div>
                  <Label htmlFor="playerName">Player Name</Label>
                  <Input
                    id="playerName"
                    name="playerName"
                    type="text"
                    placeholder="Enter player's name"
                    required
                    disabled={isSubmitting}
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="instagram">Instagram (Optional)</Label>
                  <Input
                    id="instagram"
                    name="instagram"
                    type="text"
                    placeholder="@playerhandle"
                    disabled={isSubmitting}
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                  />
                </div>

              <div>
                <Label>Game</Label>
                {gamesLoading ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {games.map((game) => (
                      <Button
                        key={game.id}
                        type="button"
                        variant={
                          selectedGameId === game.id ? "default" : "outline"
                        }
                        onClick={() => setSelectedGameId(game.id)}
                        disabled={isSubmitting}
                        className="w-full"
                      >
                        {game.name}
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="scoreValue">Score</Label>
                <Input
                  id="scoreValue"
                  name="scoreValue"
                  type="number"
                  placeholder="Enter score"
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
                  disabled={isSubmitting || isProcessingImage}
                >
                  {imagePreview ? (
                    <Image
                      src={imagePreview}
                      alt="Image preview"
                      fill
                      className="object-contain rounded-md"
                    />
                  ) : isProcessingImage ? (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-10 w-10 animate-spin" />
                      <span>Processing...</span>
                    </div>
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
                disabled={
                  isSubmitting ||
                  isProcessingImage ||
                  !imageFile ||
                  !selectedGameId ||
                  !playerName
                }
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
          </CardContent>
        </Card>
      </div>
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader className="items-center text-center">
            <PartyPopper className="h-16 w-16 text-primary animate-bounce" />
            <DialogTitle className="font-headline text-2xl">
              Score Submitted!
            </DialogTitle>
            <DialogDescription>
              The score is pending approval. You can submit another or check the
              live leaderboard.
            </DialogDescription>
          </DialogHeader>
          <Button
            className="w-full"
            onClick={() => setShowSuccessModal(false)}
          >
            Enter Another Score
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push("/leaderboard")}
          >
            View Leaderboard
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default HomePage;
