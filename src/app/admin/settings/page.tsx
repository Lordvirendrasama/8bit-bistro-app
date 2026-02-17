"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// This page has been moved to /admin/media
// Redirect to the dashboard to avoid showing a blank page.
export default function DeprecatedAdminSettingsPage() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/admin/dashboard');
    }, [router]);
    return null;
}
