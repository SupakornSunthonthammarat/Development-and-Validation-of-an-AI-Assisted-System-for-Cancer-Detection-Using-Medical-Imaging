"use client";

import { useEffect, useState } from "react";

const TOKEN_KEY = "oncovision_token";

export function useAuthToken() {
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setToken(localStorage.getItem(TOKEN_KEY));
    setIsReady(true);
  }, []);

  return {
    token,
    isAuthenticated: Boolean(token),
    isReady,
  };
}
