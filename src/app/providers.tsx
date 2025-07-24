"use client";
import { PropsWithChildren } from "react";
import { CampProvider } from "@campnetwork/origin/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PrivyProvider } from "@privy-io/react-auth";
import { myCustomChain } from "@/components/MyCustomChain";
import { http } from "viem";
import { WagmiProvider, createConfig } from "@privy-io/wagmi";

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
  const wagmiConfig = createConfig({
    chains: [myCustomChain],
    transports: {
      [myCustomChain.id]: http(),
    },
    pollingInterval: 0,
  });

  return (
    <PrivyProvider
      appId="cmd4f5ai701bdky0mlghn1gr5" // 👉 thay bằng appId của bạn
      config={{
        embeddedWallets: {
          createOnLogin: "all-users",
        },
        supportedChains: [myCustomChain],
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          <CampProvider clientId="fce77d7a-8085-47ca-adff-306a933e76aa">
            {children}
          </CampProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
