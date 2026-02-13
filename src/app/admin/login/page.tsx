"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useUser } from "@/firebase";
import { ADMIN_EMAIL } from "../layout";


export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    // If a user is loaded and they are the admin, redirect to dashboard
    if (!isUserLoading && user && user.email === ADMIN_EMAIL) {
      router.replace("/admin/dashboard");
    }
  }, [user, isUserLoading, router]);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged in the layout will handle the redirect
      router.push("/admin/dashboard");
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unknown error occurred";
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: message,
      });
      setIsLoading(false);
    }
  };

  // Prevent flicker if user is already logged in
  if (isUserLoading || user) {
     return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm">
            <div
              className="mb-8 flex justify-center"
            >
                <Logo />
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl text-center">Admin Access</CardTitle>
                    <CardDescription className="text-center">Enter your admin credentials</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input 
                                id="email" 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading}
                                placeholder="viren@example.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input 
                                id="password" 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                        <Button type="submit" className="w-full font-bold" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                 <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                 Logging in...
                                </>
                            ): "Login"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
