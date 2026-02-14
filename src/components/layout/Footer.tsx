'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/firebase';
import Image from 'next/image';

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
    { href: '/admin/settings', label: 'Settings' },
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
        <div className="mt-4 w-full flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            <Link href="/dashboard">
                <Logo />
            </Link>
            <Link href="/dashboard">
              <Image
                src="/272827436_301614021993701_2066672914547571489_n.jpg"
                alt="Sponsor Logo"
                width={150}
                height={150}
                className="h-20 w-auto"
              />
            </Link>
            <Link href="/admin/dashboard">
              <Image
                src="/301485854_511554380976736_393831328011205696_n.jpg"
                alt="Sponsor Logo"
                width={150}
                height={150}
                className="h-20 w-auto"
              />
            </Link>
        </div>
      </div>
    </footer>
    )
  }

  return (
    <footer className="w-full py-8 mt-auto">
      <div className="w-full flex flex-wrap items-center justify-center gap-x-12 gap-y-6 px-4">
        <Link href="/dashboard">
          <Logo />
        </Link>
        <Link href="/dashboard">
          <Image
            src="/272827436_301614021993701_2066672914547571489_n.jpg"
            alt="Sponsor Logo"
            width={150}
            height={150}
            className="h-20 w-auto"
          />
        </Link>
        <Link href="/admin/dashboard">
          <Image
            src="/301485854_511554380976736_393831328011205696_n.jpg"
            alt="Sponsor Logo"
            width={150}
            height={150}
            className="h-20 w-auto"
          />
        </Link>
      </div>
    </footer>
  );
}
