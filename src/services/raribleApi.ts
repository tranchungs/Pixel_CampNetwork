import {
  StatisticData,
  SearchNFTsParams,
  SearchNFTsResponse,
  ActivityData,
  ActivityResponse,
} from "@/types/rarible";

// 🔧 Base configuration
const BASE_URL = "https://bff.rarible.fun/api";
const API_BASE_URL = "https://api.rarible.org/v0.1";
const API_KEY = "555bb639-8325-4840-91c0-c25a9c38f366";

// 🔧 Common headers
const getCommonHeaders = (includeContentType = false) => {
  const headers: Record<string, string> = {
    accept: "*/*",
    "accept-language": "vi-VN,vi;q=0.9",
    "cache-control": "no-cache",
    origin: "https://rarible.fun",
    referer: "https://rarible.fun/",
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  };

  if (includeContentType) {
    headers["content-type"] = "application/json";
  }

  return headers;
};

const getApiHeaders = () => ({
  accept: "*/*",
  "accept-language": "vi-VN,vi;q=0.9",
  "cache-control": "no-cache",
  origin: "https://rarible.fun",
  referer: "https://rarible.fun/",
  "x-api-key": API_KEY,
});

// 🔧 Error handling
class RaribleApiError extends Error {
  constructor(message: string, public status?: number, public response?: any) {
    super(message);
    this.name = "RaribleApiError";
  }
}

// 🔧 Generic fetch wrapper
const apiRequest = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new RaribleApiError(
        `HTTP error! status: ${response.status}`,
        response.status
      );
    }
    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof RaribleApiError) {
      throw error;
    }
    throw new RaribleApiError(`Network error: ${error}`);
  }
};

// 📊 Collection Statistics
export const getCollectionStatistics = async (contractAddress: string) => {
  const url = `${BASE_URL}/collections/BASECAMPTESTNET:${contractAddress}/statistic`;

  try {
    const data = await apiRequest<StatisticData>(url, {
      headers: getCommonHeaders(),
    });
    return data;
  } catch (error) {
    console.error("Error fetching collection statistics:", error);
    throw error;
  }
};

// 🔍 Search NFTs

export const searchNFTs = async (params: SearchNFTsParams) => {
  const url = `${BASE_URL}/nfts/search`;

  return apiRequest<SearchNFTsResponse>(url, {
    method: "POST",
    headers: getCommonHeaders(true),
    body: JSON.stringify({
      sort: params.sort || "LOW_PRICE_FIRST",
      filters: {
        status: params.status || "all",
        collection: `BASECAMPTESTNET:${params.contractAddress}`,
        blockchains: ["BASECAMPTESTNET"],
      },
      continuation: params.continuation,
      size: params.size,
    }),
  });
};

// 🎨 Get Item Details
export const getItemDetails = async (itemId: string) => {
  const encodedId = encodeURIComponent(itemId);
  const url = `${API_BASE_URL}/items/${encodedId}`;

  return apiRequest(url, {
    headers: getApiHeaders(),
  });
};

// 📈 Collection Activity
export const getCollectionActivity = async (
  contractAddress: string,
  cursor?: string,
  size?: number
): Promise<ActivityResponse> => {
  const url = `${BASE_URL}/collections/BASECAMPTESTNET:${contractAddress}/activity`;

  const queryParams = new URLSearchParams();
  if (cursor) {
    queryParams.append("cursor", cursor);
  }
  if (size) {
    queryParams.append("size", size.toString());
  }

  const finalUrl = queryParams.toString() ? `${url}?${queryParams}` : url;

  try {
    const response = await apiRequest<ActivityResponse>(finalUrl, {
      headers: getCommonHeaders(),
    });

    console.log("📈 Activity response:", response);
    return response;
  } catch (error) {
    console.error("Error fetching collection activity:", error);
    throw error;
  }
};

// 🏪 Create Sell Order
export interface CreateSellOrderParams {
  maker: string;
  data: {
    dataType: string;
    isMakeFill: boolean;
    originFees: any[];
    payouts: any[];
  };
  end: number;
  make: {
    assetType: {
      assetClass: string;
      contract: string;
      tokenId: string;
    };
    value: string;
  };
  salt: string;
  signature: string;
  start: number;
  take: {
    assetType: {
      assetClass: string;
    };
    value: string;
  };
  type: string;
}

export const createSellOrder = async (params: CreateSellOrderParams) => {
  const url = "https://basecamptestnet-api.rarible.org/v0.1/order/orders";

  return apiRequest(url, {
    method: "POST",
    headers: {
      accept: "*/*",
      "content-type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify(params),
  });
};

// 🔍 Get Orders by Item
export const getOrdersByItem = async (itemId: string) => {
  const url = `${API_BASE_URL}/orders/sell/byItem?itemId=${itemId}`;

  return apiRequest(url, {
    headers: getApiHeaders(),
  });
};

// 📋 Get Order Details
export const getOrderDetails = async (orderId: string) => {
  const url = `${API_BASE_URL}/orders/${orderId}`;

  return apiRequest(url, {
    headers: getApiHeaders(),
  });
};

// 🎯 Utility functions
export const formatCollectionId = (contractAddress: string) =>
  `BASECAMPTESTNET:${contractAddress}`;

export const formatItemId = (contractAddress: string, tokenId: string) =>
  `BASECAMPTESTNET:${contractAddress}:${tokenId}`;

export const parseItemId = (itemId: string) => {
  const parts = itemId.split(":");
  return {
    blockchain: parts[0],
    contractAddress: parts[1],
    tokenId: parts[2],
  };
};

// 🔄 Retry mechanism for failed requests
export const withRetry = async <T>(
  apiCall: () => Promise<T>,
  maxRetries = 5,
  delay = 3000
): Promise<T> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      console.log(`API call failed, retrying... (${i + 1}/${maxRetries})`);
      await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
    }
  }
  throw new Error("Max retries exceeded");
};

// 📦 Export all functions
export const RaribleApi = {
  getCollectionStatistics,
  searchNFTs,
  getItemDetails,
  getCollectionActivity,
  createSellOrder,
  getOrdersByItem,
  getOrderDetails,
  formatCollectionId,
  formatItemId,
  parseItemId,
  withRetry,
};

export default RaribleApi;
