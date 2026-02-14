"use client";

import { usePathname } from "next/navigation";
import { Toaster } from "@/components/ui/toaster";
import dynamic from "next/dynamic";
import Header from "@/components/layout/Header";
import AdminHeader from "@/components/layout/AdminHeader";

const Footer = dynamic(() => import("@/components/layout/Footer"), {
  ssr: false,
});

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');

  // The login page doesn't get a header.
  if (pathname === '/admin/login') {
    return (
      <>
        <main className="flex-grow">{children}</main>
        <Toaster />
      </>
    );
  }

  return (
    <>
      {isAdminPage ? <AdminHeader /> : <Header />}
      <main className="flex-grow">{children}</main>
      <Toaster />
      <Footer />
    </>
  );
}
