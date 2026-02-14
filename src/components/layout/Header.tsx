"use client";

import Link from "next/link";
import Image from "next/image";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-40 items-center justify-center">
        <Link href="/dashboard">
          <Image
            src="/Floatersandsocks.png"
            alt="Floaters and Socks Logo"
            width={1200}
            height={300}
            priority
            className="h-32 w-auto"
          />
        </Link>
      </div>
    </header>
  );
}
