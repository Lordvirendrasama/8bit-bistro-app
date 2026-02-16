"use client";

import { usePathname } from "next/navigation";
import { Toaster } from "@/components/ui/toaster";
import Header from "@/components/layout/Header";
import AdminHeader from "@/components/layout/AdminHeader";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');

  return (
    <>
      {isAdminPage ? <AdminHeader /> : <Header />}
      <main className="flex-grow">{children}</main>
      <Toaster />
    </>
  );
}
