"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { registerPlayer } from "@/app/actions";
import { signInAnonymously } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Logo from "@/components/Logo";

const registrationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  instagram: z.string().optional(),
  groupSize: z.coerce.number().int().min(1, "Group size must be at least 1.").max(10),
});

type RegistrationForm = z.infer<typeof registrationSchema>;

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
  });

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  const onSubmit = async (data: RegistrationForm) => {
    setIsSubmitting(true);
    try {
      const userCredential = await signInAnonymously(auth);
      const uid = userCredential.user.uid;
      
      await registerPlayer({ ...data, id: uid });
      
      toast({
        title: "Welcome to Pixel Podium!",
        description: "You're all set. Let the games begin!",
      });

      router.push("/dashboard");

    } catch (error) {
      console.error("Registration failed:", error);
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: "Could not complete registration. Please try again.",
      });
      setIsSubmitting(false);
    }
  };

  if (loading || user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
            <Logo />
        </div>
        <Card className="shadow-2xl shadow-primary/10">
          <CardHeader>
            <CardTitle className="font-headline text-3xl text-center">Join the Arena</CardTitle>
            <CardDescription className="text-center">Enter your details to start competing.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...register("name")} placeholder="Your Name" />
                {errors.name && <p className="text-destructive text-sm mt-1">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram (Optional)</Label>
                <Input id="instagram" {...register("instagram")} placeholder="@yourhandle" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="groupSize">Players in Group</Label>
                <Input id="groupSize" type="number" {...register("groupSize")} defaultValue={1} />
                {errors.groupSize && <p className="text-destructive text-sm mt-1">{errors.groupSize.message}</p>}
              </div>
              <Button type="submit" className="w-full font-bold text-lg py-6" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Entering...
                  </>
                ) : (
                  "Start Playing"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground text-center w-full">By entering, you agree to play fair and have fun.</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
