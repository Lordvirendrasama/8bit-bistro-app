"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";

export const ADMIN_PASSWORD_KEY = "pixel-podium-admin-auth";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This effect should only run on the client
    try {
      const storedPass = localStorage.getItem(ADMIN_PASSWORD_KEY);
      const adminPass = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

      if (storedPass === adminPass) {
        setIsVerified(true);
      } else {
        if (pathname !== "/admin/login") {
          router.replace("/admin/login");
        }
      }
    } catch (error) {
      // If localStorage is not available or any other error occurs
      if (pathname !== "/admin/login") {
        router.replace("/admin/login");
      }
    } finally {
      setLoading(false);
    }
  }, [router, pathname]);

  // Allow login page to render without verification
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (loading || !isVerified) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <Toaster />
      </div>
    );
  }

  return <>{children}</>;
}
