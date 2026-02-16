'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

export default function Footer() {
  const pathname = usePathname();
  const router = useRouter();
  const [logoClicks, setLogoClicks] = useState(0);

  useEffect(() => {
    if (logoClicks >= 7) {
      router.push("/admin/dashboard");
      setLogoClicks(0);
    }
  }, [logoClicks, router]);

  const handleSecretClick = (e: React.MouseEvent) => {
    if (pathname.startsWith('/admin')) return;

    setLogoClicks((prevClicks) => prevClicks + 1);
    if (logoClicks + 1 >= 7) {
      e.preventDefault();
    }
  };

  if (pathname.startsWith('/admin')) {
    return (
    <footer className="w-full border-t border-border/40 bg-background/95 py-6 mt-auto">
      <div className="container flex items-center justify-center gap-8">
          <Link href="/">
              <Logo className="h-40" />
          </Link>
          <Button size="lg" asChild>
              <Link href="/admin/settings">Settings</Link>
          </Button>
      </div>
    </footer>
    )
  }

  return (
    <footer className="w-full py-8 mt-auto">
      <div className="w-full flex flex-wrap items-center justify-center gap-x-12 gap-y-6 px-4">
        <Link href="/" onClick={handleSecretClick}>
          <Logo className="h-40" />
        </Link>
      </div>
    </footer>
  );
}
