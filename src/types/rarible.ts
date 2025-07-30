export interface StatisticData {
  floor?: {
    amount: number;
    currency: {
      abbreviation: string;
    };
  };
  dayVolume: {
    amount: number;
    currency: {
      abbreviation: string;
    };
  };
  totalVolume: {
    amount: number;
    currency: {
      abbreviation: string;
    };
  };
  owners: number;
  listedItems: number;
  items: number;
  topOffer?: {
    amount: number;
    currency: {
      abbreviation: string;
    };
  };
}

export interface CollectionStats {
  floorPrice: string;
  listed: number;
  totalSupply: number;
  owners: number;
}
export interface SearchNFTsParams {
  contractAddress: string;
  sort?: "LOW_PRICE_FIRST" | "HIGH_PRICE_FIRST" | "NEWEST" | "OLDEST";
  status?: "all" | "listed" | "unlisted";
  continuation?: string;
  size?: number;
}
export interface SearchNFTsResponse {
  nfts: NFTItem[];
  continuation?: string;
  totalNftsCount: number;
}

export interface NFTItem {
  id: string;
  collection: {
    id: string;
    blockchain: string;
  };
  name?: string;
  image?: string;
  owner?: string;
  lastSellPrice?: {
    amount: number;
    currency: {
      id: string;
      symbol: string;
      abbreviation: string;
      usdExchangeRate: number;
    };
  };
}
//ACTIVITY
export interface ActivityData {
  id: string;
  type: "BUY" | "SELL" | "LIST" | "TRANSFER";
  date: string;
  price: {
    amount: string;
    currency: {
      abbreviation: string;
    };
  };
  seller: string;
  buyer: string;
  transactionHash: string;
  nft: {
    id: string;
    image: string;
    name: string;
  };
}
export interface ActivityResponse {
  activities: ActivityData[];
  cursor?: string; // For pagination
}
