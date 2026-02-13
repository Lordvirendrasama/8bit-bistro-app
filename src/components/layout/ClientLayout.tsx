"use client";

import { Toaster } from "@/components/ui/toaster";
import dynamic from "next/dynamic";

const Footer = dynamic(() => import("@/components/layout/Footer"), {
  ssr: false,
});

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <main className="flex-grow">{children}</main>
      <Toaster />
      <Footer />
    </>
  );
}
