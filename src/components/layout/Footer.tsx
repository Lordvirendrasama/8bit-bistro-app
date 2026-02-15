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

  const navItems = [
    { href: '/admin/dashboard', label: 'Main' },
    { href: '/admin/users', label: 'Users' },
    { href: '/admin/games', label: 'Games' },
    { href: '/admin/settings', label: 'Settings' },
  ];

  if (pathname.startsWith('/admin')) {
    return (
    <footer className="w-full border-t border-border/40 bg-background/95 py-6 mt-auto">
      <div className="container flex flex-col items-center justify-center gap-4">
        <nav className="flex items-center gap-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary',
                pathname === item.href
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard">View App</Link>
            </Button>
        </div>
        <div className="mt-4 w-full flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            <Link href="/dashboard">
                <Logo className="h-20" />
            </Link>
        </div>
      </div>
    </footer>
    )
  }

  return (
    <footer className="w-full py-8 mt-auto">
      <div className="w-full flex flex-wrap items-center justify-center gap-x-12 gap-y-6 px-4">
        <Link href="/dashboard" onClick={handleSecretClick}>
          <Logo className="h-20" />
        </Link>
      </div>
    </footer>
  );
}
