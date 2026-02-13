"use client";

import { useState, useEffect, useRef } from "react";
import { useFormState } from "react-dom";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Camera, Loader2, PartyPopper } from "lucide-react";

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
import { submitScore } from "@/app/actions";
import { useGames } from "@/lib/hooks/use-games";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function SubmitButton() {
  const [pending, setPending] = useState(false);
  
  // A trick to access form status
  useEffect(() => {
    const form = document.querySelector('form');
    if (form) {
      const handleFormSubmit = (e: SubmitEvent) => {
        setPending(true);
      };
      form.addEventListener('submit', handleFormSubmit);
      return () => form.removeEventListener('submit', handleFormSubmit);
    }
  }, []);

  return (
    <Button type="submit" className="w-full text-lg py-6" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Submitting...
        </>
      ) : (
        "Submit Score"
      )}
    </Button>
  );
}

function SubmitScoreForm() {
  const { user } = useAuth();
  const { games, loading: gamesLoading } = useGames();
  const { toast } = useToast();
  const router = useRouter();

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialState = { message: null, errors: {} };
  const [state, dispatch] = useFormState(submitScore, initialState);
  
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    if (state?.success) {
        setShowSuccessModal(true);
        // Reset form or redirect
    } else if (state && !state.success && (state.message || state.errors)) {
      const errorMessage = state.message || Object.values(state.errors).flat().join(' ');
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: errorMessage,
      });
    }
  }, [state, toast]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
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

  return (
    <>
      <form action={dispatch} className="space-y-6">
        <input type="hidden" name="playerId" value={user?.uid} />

        <div>
          <Label htmlFor="gameName">Game</Label>
          <Select name="gameName" disabled={gamesLoading}>
            <SelectTrigger id="gameName">
              <SelectValue placeholder="Select a game..." />
            </SelectTrigger>
            <SelectContent>
              {gamesLoading ? (
                <SelectItem value="loading" disabled>
                  Loading games...
                </SelectItem>
              ) : (
                games.map((game) => (
                  <SelectItem key={game.id} value={game.name}>
                    {game.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {state?.errors?.gameName && (
            <p className="text-destructive text-sm mt-1">{state.errors.gameName[0]}</p>
          )}
        </div>

        <div>
          <Label htmlFor="scoreValue">Score</Label>
          <Input
            id="scoreValue"
            name="scoreValue"
            type="number"
            placeholder="Enter your score"
          />
           {state?.errors?.scoreValue && (
            <p className="text-destructive text-sm mt-1">{state.errors.scoreValue[0]}</p>
          )}
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
          />
          <Button
            type="button"
            variant="outline"
            className="w-full h-32 flex-col"
            onClick={handleCameraClick}
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
          {state?.errors?.image && (
            <p className="text-destructive text-sm mt-1">{state.errors.image[0]}</p>
          )}
        </div>

        <SubmitButton />
      </form>
      
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader className="items-center text-center">
            <PartyPopper className="h-16 w-16 text-primary animate-bounce"/>
            <DialogTitle className="font-headline text-2xl">Score Submitted!</DialogTitle>
            <DialogDescription>
              Your score is pending approval. You can check the live leaderboard soon. Good luck!
            </DialogDescription>
          </DialogHeader>
          <Button className="w-full" onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
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
              Select your game, enter your score, and take a photo of the screen.
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
