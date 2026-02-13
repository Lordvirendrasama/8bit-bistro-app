"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { useAuth as useUserAuth } from "@/hooks/use-auth";
import { useAuth } from "@/firebase";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Header() {
  const { user } = useUserAuth();
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
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

  const navItems = [
    { href: '/dashboard', label: 'Home' },
    { href: '/submit-score', label: 'Submit Score' },
    { href: '/leaderboard', label: 'Leaderboard' },
    { href: '/media', label: 'Event Media' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-4xl items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" onClick={handleLogoClick}>
            <Logo />
          </Link>
          <nav className="hidden md:flex items-center gap-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary',
                  pathname === item.href ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        {user && (
            <Button variant="ghost" size="sm" onClick={handleSignOut}>Sign Out</Button>
        )}
      </div>
    </header>
  );
}
