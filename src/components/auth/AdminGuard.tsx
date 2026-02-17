
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/firebase";
import { Loader2, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "../ui/button";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  // The 'isRoleLoading' state is no longer needed or provided by useUser.
  const { user, isAdmin, isUserLoading } = useUser();
  const router = useRouter();

  // isLoading now only depends on the auth state.
  const isLoading = isUserLoading;

  useEffect(() => {
    // Redirect if not loading and no user is authenticated.
    if (!isLoading && !user) {
      router.replace("/admin/login");
    }
  }, [user, isLoading, router]);

  // If auth state is still loading, show the full-screen spinner.
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // If loading is finished but there's still no user, we show the loader
  // while the useEffect redirect to the login page happens.
  if (!user) {
    return (
        <div className="flex h-screen items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  // Once loading is complete and we have a user, check for admin status based on email.
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
                    You do not have the necessary permissions to access this page. Access is restricted to the admin email 'admin@8bit.com'.
                </CardDescription>

                <div className="mt-4 rounded-md border border-dashed border-muted-foreground/50 bg-muted/50 p-3 text-left text-xs text-muted-foreground">
                    <h3 className="font-bold text-foreground mb-2">Debug Info:</h3>
                    <p><strong>UID:</strong> {user.uid}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                </div>

                <Button onClick={() => router.push('/')} className="mt-6">
                    Return to Home
                </Button>
            </CardContent>
        </Card>
      </div>
    );
  }

  // If all checks pass, the user is an authenticated admin.
  return <>{children}</>;
}
