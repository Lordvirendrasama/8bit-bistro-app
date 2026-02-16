"use client";

import Link from "next/link";
import Logo from "@/components/Logo";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto flex h-40 items-center justify-center">
        <Link href="/">
          <Logo className="h-32" />
        </Link>
      </div>
    </header>
  );
}
