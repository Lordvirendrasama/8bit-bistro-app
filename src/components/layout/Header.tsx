"use client";

import Link from "next/link";
import Logo from "@/components/Logo";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase";

export default function Header() {
  const { user } = useAuth();
  
  const handleSignOut = () => {
    auth.signOut();
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
