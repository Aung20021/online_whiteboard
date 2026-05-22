"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

const AuthContext = createContext(null);

export function SupabaseAuthProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const guestToken =
    searchParams.get("guest") ||
    searchParams.get("token") ||
    searchParams.get("guestToken") ||
    null;

  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const isGuestBoardPage = pathname?.startsWith("/board/") && Boolean(guestToken);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;

      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession ?? null);
        setUser(nextSession?.user ?? null);
        router.refresh();
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    if (loading) return;

    if (!session && !isAuthPage && !isGuestBoardPage) {
      router.replace("/login");
      return;
    }

    if (session && isAuthPage) {
      router.replace("/");
    }
  }, [loading, session, isAuthPage, isGuestBoardPage, router]);

  const value = useMemo(
    () => ({
      session,
      user,
      loading,
      guestToken,
      isGuestBoardPage,
    }),
    [session, user, loading, guestToken, isGuestBoardPage]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useSupabaseAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useSupabaseAuth must be used inside SupabaseAuthProvider");
  }

  return value;
}
