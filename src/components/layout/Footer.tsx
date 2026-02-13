'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/firebase';
import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function Footer() {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLogout = () => {
    if (auth) {
      auth.signOut();
      router.push('/admin/login');
    }
  };

  const navItems = [
    { href: '/admin/dashboard', label: 'Main' },
    { href: '/admin/users', label: 'Users' },
    { href: '/admin/games', label: 'Games' },
  ];
  
  if (!isClient) {
    // Render null on the server and initial client render to avoid hydration mismatch
    return null;
  }

  if (pathname === '/admin/login') {
    return null;
  }

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
            <Button variant="ghost" size="sm" onClick={handleLogout}>
            Logout
            </Button>
        </div>
        <div className="mt-4 flex items-center justify-center gap-8">
            <Link href="/admin/dashboard">
                <Logo />
            </Link>
            <a href="https://www.instagram.com/kalakaricartel/" target="_blank" rel="noopener noreferrer">
              <Image
                src="/kalakari-logo.png"
                alt="Kalakari Cartel Logo"
                width={150}
                height={150}
                className="h-20 w-auto filter invert"
              />
            </a>
        </div>
      </div>
    </footer>
    )
  }

  return (
    <footer className="w-full py-8 mt-auto">
      <div className="container flex items-center justify-center gap-x-12">
        <Link href="/dashboard">
          <Logo />
        </Link>
        <a href="https://www.instagram.com/kalakaricartel/" target="_blank" rel="noopener noreferrer">
          <Image
            src="/kalakari-logo.png"
            alt="Kalakari Cartel Logo"
            width={150}
            height={150}
            className="h-20 w-auto filter invert"
          />
        </a>
      </div>
    </footer>
  );
}
