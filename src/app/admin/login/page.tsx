"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { useToast } from "@/hooks/use-toast";
import { ADMIN_PASSWORD_KEY } from "../layout";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const [logoClicks, setLogoClicks] = useState(0);

  useEffect(() => {
    try {
      const storedPass = localStorage.getItem(ADMIN_PASSWORD_KEY);
      const adminPass = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

      if (storedPass === adminPass) {
        router.replace("/admin/dashboard");
      }
    } catch (error) {
      // If localStorage is not available, do nothing
    }
  }, [router]);

  useEffect(() => {
    if (logoClicks >= 5) {
      router.push("/admin/login");
      setLogoClicks(0);
    }
  }, [logoClicks, router]);

  const handleLogoClick = () => {
    setLogoClicks((prevClicks) => prevClicks + 1);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const adminPass = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

    if (password === adminPass) {
      try {
        localStorage.setItem(ADMIN_PASSWORD_KEY, password);
        router.push("/admin/dashboard");
      } catch (error) {
        toast({
            variant: "destructive",
            title: "Login Failed",
            description: "Could not save session. Please enable local storage.",
        });
        setIsLoading(false);
      }
    } else {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "The password you entered is incorrect.",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm">
            <div
              className="mb-8 flex justify-center cursor-pointer"
              onClick={handleLogoClick}
            >
                <Logo />
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl text-center">Admin Access</CardTitle>
                    <CardDescription className="text-center">Enter password to continue</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
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
