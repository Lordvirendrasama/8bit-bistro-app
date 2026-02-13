"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { useAuth as useUserAuth } from "@/hooks/use-auth";
import { useAuth } from "@/firebase";
import { Button } from "@/components/ui/button";

export default function Header() {
  const { user } = useUserAuth();
  const auth = useAuth();
  const router = useRouter();
  const [logoClicks, setLogoClicks] = useState(0);

  useEffect(() => {
    if (logoClicks >= 5) {
      router.push("/admin/login");
      setLogoClicks(0);
    }
  }, [logoClicks, router]);

  const handleLogoClick = (e: React.MouseEvent) => {
    setLogoClicks((prevClicks) => prevClicks + 1);
    if (logoClicks + 1 >= 5) {
      e.preventDefault();
    }
  };
  
  const handleSignOut = () => {
    if (auth) {
        auth.signOut();
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container relative flex h-28 items-center justify-center">
        <Link href="/dashboard" onClick={handleLogoClick}>
          <Logo />
        </Link>
        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
                <Link href="/admin/login">Admin</Link>
            </Button>
            {user && (
                <Button variant="ghost" size="sm" onClick={handleSignOut}>Sign Out</Button>
            )}
        </div>
      </div>
    </header>
  );
}
