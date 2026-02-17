
"use client";

import { useUser } from "@/firebase";

/**
 * The primary hook for components to get the current authentication and role status.
 */
export const useAuth = () => {
  const { user, isUserLoading, userError, isAdmin } = useUser();

  return {
    user,
    loading: isUserLoading, // Loading state now only depends on auth initialization
    error: userError,
    isAdmin,
  };
};
