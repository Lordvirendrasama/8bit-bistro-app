"use client";

import Link from "next/link";
import Logo from "@/components/Logo";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-56 items-center justify-center">
        <Link href="/dashboard">
          <Logo className="h-48" />
        </Link>
      </div>
    </header>
  );
}
