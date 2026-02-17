"use client";

import { useUser } from "@/firebase";

/**
 * The primary hook for components to get the current authentication and role status.
 * It combines the user loading and role loading states into a single `loading` boolean.
 */
export const useAuth = () => {
  const { user, isUserLoading, userError, isAdmin, isRoleLoading } = useUser();

  return {
    user,
    loading: isUserLoading || isRoleLoading, // Combined loading state
    error: userError,
    isAdmin,
  };
};
