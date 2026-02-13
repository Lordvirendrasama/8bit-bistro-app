"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useUser } from "@/firebase";

// You can change this to your actual admin's email
export const ADMIN_EMAIL = "viren@example.com";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (isUserLoading) {
      return; // Wait until user state is loaded
    }

    // Allow login page to be accessed by anyone
    if (pathname === "/admin/login") {
      setIsVerified(true);
      return;
    }

    // Check if there is a logged-in user and if they are the admin
    if (user && user.email === ADMIN_EMAIL && !user.isAnonymous) {
      setIsVerified(true);
    } else {
      // If not the admin, redirect to the login page
      router.replace("/admin/login");
    }
  }, [user, isUserLoading, router, pathname]);

  // Special handling to allow login page to render without the layout's auth check
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // Show a loading spinner while verifying auth state
  if (isUserLoading || !isVerified) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Render the admin layout for the verified admin user
  return (
    <>
      {children}
    </>
  );
}
