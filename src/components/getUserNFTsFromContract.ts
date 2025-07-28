// Types
interface NFTAttribute {
  trait_type: string;
  value: string | number;
  display_type?: string;
}

interface NFTMetadata {
  name?: string;
  description?: string;
  image?: string;
  external_url?: string;
  animation_url?: string;
  attributes?: NFTAttribute[];
  [key: string]: any;
}

interface TokenInstance {
  id: string;
  image_url?: string;
  animation_url?: string;
  external_app_url?: string;
  media_url?: string;
  metadata?: NFTMetadata;
  owner?: {
    hash: string;
  } | null;
  token_type: string;
  value: string;
}

interface Token {
  address: string;
  address_hash: string;
  name: string;
  symbol: string;
  type: string;
  total_supply?: string;
  holders_count?: string;
  holders?: string;
  decimals?: string | null;
  icon_url?: string | null;
}

interface NFTCollection {
  amount: string;
  token: Token;
  token_instances: TokenInstance[];
}

interface BlockscoutResponse {
  items: NFTCollection[];
  next_page_params?: string;
}

interface ProcessedNFT {
  tokenId: string;
  contractAddress: string;
  contractName: string;
  contractSymbol: string;
  amount: string;
  image?: string;
  animationUrl?: string;
  name: string;
  description?: string;
  attributes?: NFTAttribute[];
  metadata?: NFTMetadata;
}

interface CollectionInfo {
  address: string;
  name: string;
  symbol: string;
  totalSupply?: string;
  holders?: string;
}

interface NFTResult {
  found: boolean;
  collection?: CollectionInfo;
  totalAmount?: string;
  nfts: ProcessedNFT[];
  message?: string;
  error?: string;
}

// Main function
async function getUserNFTsFromContract(
  walletAddress: string,
  contractAddress: string
): Promise<NFTResult> {
  try {
    const baseUrl = "https://basecamp.cloud.blockscout.com/api/v2";
    let page: string | null = null;
    let targetCollection: NFTCollection | null = null;
    let attempts = 0;
    const maxAttempts = 50; // Safety limit

    // Loop through pages until we find the contract or no more pages
    while (attempts < maxAttempts) {
      // Build URL with pagination
      let url = `${baseUrl}/addresses/${walletAddress}/nft/collections?type=ERC-721%2CERC-404%2CERC-1155`;
      if (page) {
        url += `&next_page_params=${encodeURIComponent(page)}`;
      }

      console.log(
        `🔍 Fetching page: ${page || "first"} (attempt ${attempts + 1})`
      );

      const response = await fetch(url, {
        headers: {
          accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: BlockscoutResponse = await response.json();
      console.log(
        `📦 Found ${data.items?.length || 0} collections on this page`
      );

      // Check if target contract exists in current page
      targetCollection =
        data.items?.find(
          (collection) =>
            collection.token.address.toLowerCase() ===
            contractAddress.toLowerCase()
        ) || null;

      // If found, break the loop
      if (targetCollection) {
        console.log("✅ Found target contract!", targetCollection.token.name);
        break;
      }

      // If no more pages, break
      if (!data.next_page_params) {
        console.log("📄 Reached end of pagination, contract not found");
        break;
      }

      // Move to next page
      page = data.next_page_params;
      attempts++;
    }

    if (!targetCollection) {
      return {
        found: false,
        message: "Not Found NFT",
        nfts: [],
      };
    }

    // Extract NFT details from target collection
    const nfts: ProcessedNFT[] =
      targetCollection.token_instances?.map((nft) => ({
        tokenId: nft.id,
        contractAddress: targetCollection!.token.address,
        contractName: targetCollection!.token.name,
        contractSymbol: targetCollection!.token.symbol,
        amount: targetCollection!.amount,
        image: nft.image_url,
        animationUrl: nft.animation_url,
        name: nft.metadata?.name || `Token #${nft.id}`,
        description: nft.metadata?.description,
        attributes: nft.metadata?.attributes,
        metadata: nft.metadata,
      })) || [];

    return {
      found: true,
      collection: {
        address: targetCollection.token.address,
        name: targetCollection.token.name,
        symbol: targetCollection.token.symbol,
        totalSupply: targetCollection.token.total_supply,
        holders:
          targetCollection.token.holders_count ||
          targetCollection.token.holders,
      },
      totalAmount: targetCollection.amount,
      nfts: nfts,
    };
  } catch (error) {
    console.error("❌ Error fetching NFTs:", error);
    return {
      found: false,
      error: error instanceof Error ? error.message : "Unknown error",
      nfts: [],
    };
  }
}

// Export function and types
export default getUserNFTsFromContract;
export type {
  NFTResult,
  ProcessedNFT,
  CollectionInfo,
  NFTAttribute,
  NFTMetadata,
};
