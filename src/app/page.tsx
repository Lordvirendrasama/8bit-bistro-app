
"use client";

import { useState, useRef, FormEvent, ChangeEvent, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Upload,
  Loader2,
  PartyPopper,
  ChevronsUpDown,
  Check,
  PlusCircle,
} from "lucide-react";
import {
  getStorage,
  ref,
  uploadString,
  getDownloadURL,
} from "firebase/storage";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import {
  useFirestore,
  useAuth as useFirebaseAuthInstance,
  errorEmitter,
  FirestorePermissionError,
} from "@/firebase";
import { signInAnonymously } from "firebase/auth";

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
import { usePlayers } from "@/lib/hooks/use-players";
import type { Player } from "@/types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const AddPlayerModal = ({
  open,
  onOpenChange,
  onPlayerAdded,
  initialPlayerName = "",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPlayerAdded: (name: string) => void;
  initialPlayerName?: string;
}) => {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleAddPlayerSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore) return;

    const formData = new FormData(e.currentTarget);
    const name = (formData.get("name") as string)?.trim();
    const instagram = (formData.get("instagram") as string)?.trim();
    const groupSize = Number(formData.get("groupSize") as string);

    if (!name) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: "Player name is required.",
      });
      return;
    }
    if (isNaN(groupSize) || groupSize <= 0) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: "Please enter a valid group size.",
      });
      return;
    }

    setIsAddingPlayer(true);
    const playersRef = collection(firestore, "players");
    const q = query(playersRef, where("name", "==", name));

    getDocs(q)
      .then((querySnapshot) => {
        if (!querySnapshot.empty) {
          toast({
            variant: "destructive",
            title: "Player Exists",
            description: `A player with the name "${name}" is already registered.`,
          });
          setIsAddingPlayer(false);
          return;
        }

        const playerData = {
          name,
          instagram,
          groupSize,
          createdAt: serverTimestamp(),
        };

        addDoc(playersRef, playerData)
          .then(() => {
            toast({
              title: "Player Registered!",
              description: `You can now submit a score for ${name}.`,
            });
            onPlayerAdded(name);
            formRef.current?.reset();
          })
          .catch((firestoreError) => {
            console.error("Add Player Error:", firestoreError);
            const permissionError = new FirestorePermissionError({
              path: playersRef.path,
              operation: "create",
              requestResourceData: playerData,
            });
            errorEmitter.emit("permission-error", permissionError);

            toast({
              variant: "destructive",
              title: "Registration Error",
              description: "Could not register the new player.",
            });
          })
          .finally(() => {
            setIsAddingPlayer(false);
          });
      })
      .catch((error) => {
        console.error("Error checking for player:", error);
        toast({
          variant: "destructive",
          title: "Registration Error",
          description: "Could not check for existing players.",
        });
        setIsAddingPlayer(false);
      });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto top-[5%] translate-y-0 sm:top-[50%] sm:-translate-y-1/2">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">
            Add New Player
          </DialogTitle>
          <DialogDescription>
            Register a new player for the tournament.
          </DialogDescription>
        </DialogHeader>
        <form
          ref={formRef}
          onSubmit={handleAddPlayerSubmit}
          className="space-y-4"
        >
          <div>
            <Label htmlFor="name">Player Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={initialPlayerName}
              required
              disabled={isAddingPlayer}
            />
          </div>
          <div>
            <Label htmlFor="instagram">Instagram (Optional)</Label>
            <Input
              id="instagram"
              name="instagram"
              placeholder="@playerhandle"
              disabled={isAddingPlayer}
            />
          </div>
          <div>
            <Label htmlFor="groupSize">Group Size</Label>
            <Input
              id="groupSize"
              name="groupSize"
              type="number"
              defaultValue="1"
              min="1"
              required
              disabled={isAddingPlayer}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isAddingPlayer}>
              {isAddingPlayer && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Player
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

function HomePage() {
  const { user, loading: userLoading } = useAuth();
  const auth = useFirebaseAuthInstance();
  const firestore = useFirestore();
  const { games, loading: gamesLoading } = useGames();
  const { players, loading: playersLoading } = usePlayers();
  const { toast } = useToast();
  const router = useRouter();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedGameId, setSelectedGameId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Player selection state
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [playerSearch, setPlayerSearch] = useState("");
  const [isPlayerPopoverOpen, setIsPlayerPopoverOpen] = useState(false);

  // Add player modal state
  const [isAddPlayerModalOpen, setIsAddPlayerModalOpen] = useState(false);
  const [newlyAddedPlayerName, setNewlyAddedPlayerName] = useState<
    string | null
  >(null);

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

  useEffect(() => {
    if (newlyAddedPlayerName && players.length > 0) {
      const newPlayer = players.find((p) => p.name === newlyAddedPlayerName);
      if (newPlayer) {
        setSelectedPlayer(newPlayer);
        setNewlyAddedPlayerName(null);
      }
    }
  }, [players, newlyAddedPlayerName]);

  const filteredPlayers =
    playerSearch === ""
      ? players
      : players.filter((p) =>
          p.name.toLowerCase().includes(playerSearch.toLowerCase())
        );

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsProcessingImage(true);
      setImagePreview(null);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setIsProcessingImage(false);
      };
      reader.readAsDataURL(file);
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
      !imagePreview ||
      !selectedGameId ||
      !scoreValue ||
      !selectedPlayer ||
      !game
    ) {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description:
          "Please select a player, a game, enter a score, and provide an image.",
      });
      return;
    }

    setIsSubmitting(true);

    let imageUrl = "";
    try {
      const storage = getStorage(firestore.app);
      const storageRef = ref(storage, `score_proofs/${user.uid}_${Date.now()}`);
      const snapshot = await uploadString(storageRef, imagePreview, "data_url");
      imageUrl = await getDownloadURL(snapshot.ref);
    } catch (storageError) {
      console.error("Storage Upload Error:", storageError);
      toast({
        variant: "destructive",
        title: "Image Upload Failed",
        description:
          "Could not upload the image. Please check your connection and try again.",
      });
      setIsSubmitting(false);
      return;
    }

    const scoreData = {
      playerId: selectedPlayer.id,
      playerName: selectedPlayer.name,
      playerInstagram: selectedPlayer.instagram || "",
      gameId: selectedGameId,
      gameName: game.name,
      scoreValue: Number(scoreValue),
      submittedAt: serverTimestamp(),
      imageUrl: imageUrl,
    };

    const scoreSubmissionsRef = collection(firestore, "scoreSubmissions");

    addDoc(scoreSubmissionsRef, scoreData)
      .then(() => {
        setShowSuccessModal(true);
        // Reset form
        formRef.current?.reset();
        setImagePreview(null);
        setSelectedGameId("");
        setSelectedPlayer(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      })
      .catch((firestoreError) => {
        console.error("Firestore Write Error:", firestoreError);
        const permissionError = new FirestorePermissionError({
          path: scoreSubmissionsRef.path,
          operation: "create",
          requestResourceData: scoreData,
        });
        errorEmitter.emit("permission-error", permissionError);

        toast({
          variant: "destructive",
          title: "Submission Failed",
          description:
            "There was an error saving your score. Please try again.",
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
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
      <div className="container mx-auto max-w-lg p-4 pt-10">
        <Card className="shadow-2xl shadow-primary/10">
          <CardHeader>
            <CardTitle className="font-headline text-3xl">
              Tournament Desk
            </CardTitle>
            <CardDescription>
              Select a player, enter their score, and snap a photo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label>Player</Label>
                {playersLoading ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="flex-grow">
                      <Popover
                        open={isPlayerPopoverOpen}
                        onOpenChange={setIsPlayerPopoverOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={isPlayerPopoverOpen}
                            className="w-full justify-between"
                            disabled={isSubmitting}
                          >
                            <span className="truncate">
                              {selectedPlayer ? (
                                <>
                                  {selectedPlayer.name}
                                  {selectedPlayer.instagram && (
                                    <span className="ml-1 text-muted-foreground">
                                      ({selectedPlayer.instagram})
                                    </span>
                                  )}
                                </>
                              ) : (
                                "Select a player..."
                              )}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                          <div className="p-2 border-b">
                            <Input
                              placeholder="Search for a player..."
                              value={playerSearch}
                              onChange={(e) =>
                                setPlayerSearch(e.target.value)
                              }
                            />
                          </div>
                          <ScrollArea className="h-[200px]">
                            {filteredPlayers.length > 0 ? (
                              filteredPlayers.map((player) => (
                                <div
                                  key={player.id}
                                  onClick={() => {
                                    setSelectedPlayer(player);
                                    setIsPlayerPopoverOpen(false);
                                    setPlayerSearch("");
                                  }}
                                  className="flex cursor-pointer items-center p-2 hover:bg-accent"
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedPlayer?.id === player.id
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  <span className="truncate">
                                    {player.name}
                                    {player.instagram && (
                                      <span className="ml-1 text-muted-foreground">
                                        ({player.instagram})
                                      </span>
                                    )}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <p className="p-4 text-center text-sm text-muted-foreground">
                                No players found.
                              </p>
                            )}
                          </ScrollArea>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 flex-shrink-0"
                      onClick={() => setIsAddPlayerModalOpen(true)}
                      disabled={isSubmitting}
                      aria-label="Add new player"
                    >
                      <PlusCircle className="h-5 w-5" />
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <Label>Game</Label>
                {gamesLoading ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                  accept="image/png, image/jpeg"
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
                      <Upload className="h-10 w-10" />
                      <span className="font-semibold">Upload Image</span>
                      <span className="text-xs">PNG or JPG</span>
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
                  !imagePreview ||
                  !selectedGameId ||
                  !selectedPlayer
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

      <AddPlayerModal
        open={isAddPlayerModalOpen}
        onOpenChange={setIsAddPlayerModalOpen}
        initialPlayerName={playerSearch}
        onPlayerAdded={(playerName) => {
          setNewlyAddedPlayerName(playerName);
          setIsAddPlayerModalOpen(false);
          setIsPlayerPopoverOpen(false);
          setPlayerSearch("");
        }}
      />

      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader className="items-center text-center">
            <PartyPopper className="h-16 w-16 text-primary animate-bounce" />
            <DialogTitle className="font-headline text-2xl">
              Score Submitted!
            </DialogTitle>
            <DialogDescription>
              The score is now on the leaderboard. You can submit another or
              check the live leaderboard.
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
