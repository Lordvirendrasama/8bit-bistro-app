
"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useAuth as useFirebaseAuthInstance } from "@/firebase";
import { signInAnonymously } from "firebase/auth";
import { Loader2 } from "lucide-react";

/**
 * AuthGuard ensures that a user is authenticated (at least anonymously)
 * before showing the children. This allows the app to function for
 * customers without forcing them to a login page.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const auth = useFirebaseAuthInstance();

  useEffect(() => {
    // If auth is finished loading and no user is present, sign in anonymously.
    // This happens in the background so the user stays on the current page.
    if (!loading && !user) {
      signInAnonymously(auth).catch((error) => {
        console.error("Anonymous sign-in failed:", error);
      });
    }
  }, [user, loading, auth]);

  // While checking for a user or waiting for anonymous sign-in, show a loader.
  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Once a user (anonymous or otherwise) is present, render the content.
  return <>{children}</>;
}
