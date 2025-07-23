import { defineChain } from "viem";

export const myCustomChain = defineChain({
  id: 123420001114,
  name: "basecamp",
  network: "my-custom-chain",
  nativeCurrency: {
    decimals: 18, // Replace this with the number of decimals for your chain's native token
    name: "CAMP",
    symbol: "CAMP",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.basecamp.t.raas.gelato.cloud"],
    },
  },
  blockExplorers: {
    default: {
      name: "Explorer",
      url: "https://basecamp.cloud.blockscout.com/",
    },
  },
});
