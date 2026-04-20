"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { ApiAuthSession } from "@/lib/contracts/community-api";

type CommunitySessionContextValue = {
  currentUser: ApiAuthSession | null;
};

const CommunitySessionContext = createContext<CommunitySessionContextValue>({
  currentUser: null
});

export function CommunitySessionProvider({
  children,
  currentUser
}: {
  children: ReactNode;
  currentUser: ApiAuthSession | null;
}) {
  return (
    <CommunitySessionContext.Provider value={{ currentUser }}>
      {children}
    </CommunitySessionContext.Provider>
  );
}

export function useCommunitySession() {
  return useContext(CommunitySessionContext);
}
