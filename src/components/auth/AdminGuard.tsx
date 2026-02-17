"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/firebase"; // Directly use the granular hook from the provider
import { Loader2, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "../ui/button";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  // Destructure all states from the provider's hook
  const { user, isAdmin, isUserLoading, isRoleLoading } = useUser();
  const router = useRouter();

  // This combined loading state is the key.
  // It ensures we wait for BOTH Firebase Auth to initialize AND the Firestore role check to complete.
  const isLoading = isUserLoading || isRoleLoading;

  useEffect(() => {
    // Only attempt to redirect *after* all loading is finished.
    if (!isLoading && !user) {
      router.replace("/admin/login");
    }
  }, [user, isLoading, router]);

  // If either authentication or the role check is in progress, show the full-screen loader.
  // This prevents any premature rendering or redirection.
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // If loading is finished but there's still no user, show the loader
  // while the useEffect redirect to the login page happens. This prevents
  // a flash of the "Access Denied" page for unauthenticated users.
  if (!user) {
    return (
        <div className="flex h-screen items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  // ONLY after all loading is complete and we have a user, we check for admin role.
  // If the user is not an admin, show the "Access Denied" page.
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

  // If all checks pass, the user is an authenticated admin, so we render the protected content.
  return <>{children}</>;
}
