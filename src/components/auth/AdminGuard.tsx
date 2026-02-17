"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "../ui/button";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/admin/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user) {
    // This case is primarily handled by the useEffect redirect,
    // but this prevents a flash of content.
    return (
        <div className="flex h-screen items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto flex h-[calc(100vh-200px)] items-center justify-center p-4">
        <Card className="max-w-md text-center">
            <CardHeader>
                <div className="mx-auto bg-destructive/20 rounded-full p-3 w-fit">
                    <ShieldAlert className="h-10 w-10 text-destructive" />
                </div>
                <CardTitle className="font-headline text-2xl mt-4">Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
                <CardDescription>
                    You do not have the necessary permissions to access this page. Please contact a system administrator if you believe this is an error.
                </CardDescription>
                <Button onClick={() => router.push('/')} className="mt-6">
                    Return to Home
                </Button>
            </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
