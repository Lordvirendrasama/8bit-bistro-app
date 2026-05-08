
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function AdminHeader() {
  const pathname = usePathname();

  const navItems = [
    { href: '/admin/dashboard', label: 'Main' },
    { href: '/admin/users', label: 'Users' },
    { href: '/admin/games', label: 'Games' },
    { href: '/admin/events', label: 'Events' },
    { href: '/admin/offers', label: 'Offers' },
    { href: '/admin/media', label: 'Media' },
    { href: '/fifa-tracker', label: 'FIFA Tracker' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-black/95 backdrop-blur-sm">
      <div className="container flex h-48 flex-col items-center justify-center gap-2">
        <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center">
            <div />
            <div className="flex flex-col items-center">
                <Link href="/admin/dashboard" className="justify-self-center">
                    <Logo className="h-32" />
                </Link>
                <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest opacity-40 -mt-2">
                    v1.1.0 Admin
                </div>
            </div>
            <div className="flex items-center justify-self-end gap-2 pr-4">
                <Button variant="outline" size="sm" asChild>
                    <Link href="/">View App</Link>
                </Button>
            </div>
        </div>
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
      </div>
    </header>
  );
}
