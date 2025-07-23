"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { PropsWithChildren } from "react";
import { myCustomChain } from "@/components/MyCustomChain";
import { addRpcUrlOverrideToChain } from "@privy-io/chains";

export function Providers({ children }: PropsWithChildren) {
  const mainnetOverride = addRpcUrlOverrideToChain(
    myCustomChain,
    "https://rpc.basecamp.t.raas.gelato.cloud"
  );
  return (
    <PrivyProvider
      appId="cmd4f5ai701bdky0mlghn1gr5" // 👉 thay bằng appId của bạn
      config={{
        embeddedWallets: {
          createOnLogin: "all-users",
        },
        supportedChains: [mainnetOverride],
      }}
    >
      {children}
    </PrivyProvider>
  );
}
