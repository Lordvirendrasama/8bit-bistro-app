"use client";

import Link from "next/link";
import Logo from "@/components/Logo";
import { useAuth as useUserAuth } from "@/hooks/use-auth";
import { useAuth } from "@/firebase";
import { Button } from "@/components/ui/button";

export default function Header() {
  const { user } = useUserAuth();
  const auth = useAuth();
  
  const handleSignOut = () => {
    if (auth) {
        auth.signOut();
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-4xl items-center justify-between">
        <Link href="/dashboard">
          <Logo />
        </Link>
        {user && (
            <Button variant="ghost" size="sm" onClick={handleSignOut}>Sign Out</Button>
        )}
      </div>
    </header>
  );
}
