'use client';
import { useState, useEffect } from "react";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ADMIN_PASSWORD_KEY } from '@/app/admin/layout';

export default function AdminHeader() {
  const pathname = usePathname();
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

  const handleLogout = () => {
    try {
      localStorage.removeItem(ADMIN_PASSWORD_KEY);
      router.push('/admin/login');
    } catch (error) {
      console.error('Failed to logout', error);
    }
  };

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard' },
    { href: '/admin/games', label: 'Games' },
    { href: '/admin/settings', label: 'Settings' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-7xl items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/admin/dashboard" onClick={handleLogoClick}>
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
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </header>
  );
}
