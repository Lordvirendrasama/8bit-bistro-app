'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/firebase';

export default function Footer() {
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
        <div className="mt-4">
            <Link href="/admin/dashboard">
                <Logo />
            </Link>
        </div>
      </div>
    </footer>
    )
  }

  return (
    <footer className="w-full py-8 mt-auto">
      <div className="container flex justify-center">
        <Link href="/dashboard">
          <Logo />
        </Link>
      </div>
    </footer>
  );
}
