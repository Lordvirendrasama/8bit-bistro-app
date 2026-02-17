"use client";

import { usePathname } from 'next/navigation';
import { AdminGuard } from '@/components/auth/AdminGuard';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';
  
  // Do not apply the guard to the login page itself
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Wrap all other admin pages with the AdminGuard
  return <AdminGuard>{children}</AdminGuard>;
}
