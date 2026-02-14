"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Header() {
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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-40 items-center justify-center">
        <Link href="/dashboard" onClick={handleLogoClick}>
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
