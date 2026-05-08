
"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { useAuth as useFirebaseAuth } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const auth = useFirebaseAuth();
  const { toast } = useToast();
  
  // These are the pre-filled credentials
  const [email, setEmail] = useState("admin@8bit.com");
  const [password, setPassword] = useState("password");
  
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Please enter both email and password.",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      // First, try to sign in.
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Force refresh the ID token to ensure claims are up-to-date for security rules.
      await userCredential.user.getIdToken(true);
      toast({
        title: "Login Successful",
        description: "Redirecting to dashboard...",
      });
      router.replace("/admin/dashboard");
    } catch (signInError: any) {
      // If sign-in fails, try to create the user (this acts as a "reset/setup" if account doesn't exist)
      if (signInError.code === 'auth/invalid-credential' || signInError.code === 'auth/user-not-found' || signInError.code === 'auth/wrong-password') {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          await userCredential.user.getIdToken(true);

          toast({
            title: "Account Created",
            description: "Successfully created your account and logged you in.",
          });
          router.replace("/admin/dashboard");
        } catch (signUpError: any) {
          if (signUpError.code === 'auth/email-already-in-use') {
            toast({
              variant: "destructive",
              title: "Login Failed",
              description: "Invalid credentials. If you forgot your password, please reset it in the Firebase Console.",
            });
          } else {
            console.error("Admin sign-up fallback error:", signUpError);
            toast({
              variant: "destructive",
              title: "Sign-Up Error",
              description: signUpError.message || "Could not create account.",
            });
          }
        }
      } else {
        console.error("Admin login error:", signInError);
        toast({
          variant: "destructive",
          title: "Login Error",
          description: signInError.message || "An unexpected error occurred.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-sm p-4 pt-10">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Admin Login</CardTitle>
          <CardDescription>
            Log in to the admin dashboard. The admin email must be 'admin@8bit.com'.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@8bit.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Log In / Sign Up
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
