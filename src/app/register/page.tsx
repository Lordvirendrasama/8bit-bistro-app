"use client";

import { useState, useRef, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { useFirestore, useAuth as useFirebaseAuthInstance } from "@/firebase";
import { signInAnonymously } from "firebase/auth";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PartyPopper } from "lucide-react";

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

function RegisterPlayerPage() {
  const { user, loading: userLoading } = useAuth();
  const auth = useFirebaseAuthInstance();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!firestore) return;

    const formData = new FormData(event.currentTarget);
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

    setIsSubmitting(true);

    try {
      // Check if player already exists
      const playersRef = collection(firestore, "players");
      const q = query(playersRef, where("name", "==", name));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        toast({
          variant: "destructive",
          title: "Player Exists",
          description: `A player with the name "${name}" is already registered.`,
        });
        setIsSubmitting(false);
        return;
      }

      // Add new player
      await addDoc(playersRef, {
        name,
        instagram,
        groupSize,
        createdAt: serverTimestamp(),
      });

      setShowSuccessModal(true);
      formRef.current?.reset();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast({
        variant: "destructive",
        title: "Registration Error",
        description: message,
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
      <div className="container mx-auto max-w-lg p-4 pt-10">
        <Card className="shadow-2xl shadow-primary/10">
          <CardHeader>
            <CardTitle className="font-headline text-3xl">
              Register Player
            </CardTitle>
            <CardDescription>
              Add a new player to the event roster.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name">Player Name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter player's name"
                  required
                  disabled={isSubmitting}
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
                />
              </div>

              <div>
                <Label htmlFor="groupSize">Group Size</Label>
                <Input
                  id="groupSize"
                  name="groupSize"
                  type="number"
                  placeholder="e.g., 2"
                  required
                  min="1"
                  defaultValue="2"
                  disabled={isSubmitting}
                />
              </div>

              <Button
                type="submit"
                className="w-full text-lg py-6"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Registering...
                  </>
                ) : (
                  "Register Player"
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
              Player Registered!
            </DialogTitle>
            <DialogDescription>
              You can now submit a score for this player.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center flex-col sm:flex-col sm:space-x-0 gap-2">
            <Button
              className="w-full"
              onClick={() => setShowSuccessModal(false)}
            >
              Register Another Player
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push("/")}
            >
              Submit a Score
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default RegisterPlayerPage;
