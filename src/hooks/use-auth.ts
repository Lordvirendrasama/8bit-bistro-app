"use client";

import { useUser } from "@/firebase";

export const useAuth = () => {
  const { user, isUserLoading, userError } = useUser();
  return { user, loading: isUserLoading, error: userError };
};
