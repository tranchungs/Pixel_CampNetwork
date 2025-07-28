"use client";
import { PropsWithChildren } from "react";
import { CampProvider } from "@campnetwork/origin/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
const CLIENT_ID = process.env.NEXT_PUBLIC_CAMP_CLIENT_ID;
export function Providers({ children }: PropsWithChildren) {
  // Tạo QueryClient instance
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <CampProvider clientId={CLIENT_ID as string}>{children}</CampProvider>
    </QueryClientProvider>
  );
}
