'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/firebase';

export default function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();


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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-24 max-w-7xl items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/admin/dashboard">
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
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard">View App</Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Logout
            </Button>
        </div>
      </div>
    </header>
  );
}
