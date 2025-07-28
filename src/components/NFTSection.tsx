import React, { useState, useEffect } from "react";
import getUserNFTsFromContract, {
  NFTResult,
  CollectionInfo,
  ProcessedNFT,
} from "./getUserNFTsFromContract";
import NFTCard from "./NFTCard";

interface NFTSectionProps {
  contractAddress: string;
  walletAddress?: string; // Required wallet address prop
  className?: string;
  title?: string;
  hideHeader?: boolean; // New prop to hide collection header
}

const NFTSection: React.FC<NFTSectionProps> = ({
  contractAddress,
  walletAddress,
  className = "",
  title,
  hideHeader = false,
}) => {
  const [userNFTs, setUserNFTs] = useState<ProcessedNFT[]>([]);
  const [nftCollection, setNftCollection] = useState<CollectionInfo | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserNFTs = async (): Promise<void> => {
    if (!walletAddress) return;

    setLoading(true);
    setError(null);

    try {
      const result: NFTResult = await getUserNFTsFromContract(
        walletAddress,
        contractAddress
      );

      if (result.found && result.collection) {
        setNftCollection(result.collection);
        setUserNFTs(result.nfts);
        console.log(
          `✅ Found ${result.nfts.length} NFTs from ${result.collection.name}`
        );
      } else {
        setUserNFTs([]);
        setNftCollection(null);
        setError(result.message || "No NFTs found");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch NFTs";
      setError(errorMessage);
      console.error("Failed to fetch NFTs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (walletAddress) {
      fetchUserNFTs();
    } else {
      setUserNFTs([]);
      setNftCollection(null);
      setError(null);
    }
  }, [walletAddress, contractAddress]);

  // Loading state
  if (loading) {
    return (
      <div className={`text-center p-10 ${className}`}>
        <div className="text-blue-500 text-lg animate-pulse">
          🔄 Fetching NFT...
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`text-center p-10 ${className}`}>
        <div className="text-red-500 font-medium mb-4">❌ {error}</div>
        <button
          onClick={fetchUserNFTs}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
        >
          🔄 Reload
        </button>
      </div>
    );
  }

  // Empty state
  if (!nftCollection || userNFTs.length === 0) {
    return (
      <div className={`text-center p-10 ${className}`}>
        <div className="text-gray-500 text-base">
          📦{" "}
          {!walletAddress
            ? "Vui lòng kết nối ví để xem NFT"
            : "Không có NFT nào từ contract này"}
        </div>
      </div>
    );
  }

  // Success state with NFTs
  return (
    <div className={`${className}`}>
      {!hideHeader && (
        <div className="mb-5 pb-4 border-b-2 border-gray-200">
          <h3 className="text-2xl font-semibold text-gray-800 mb-2">
            {title || `🎨 ${nftCollection.name}`}
          </h3>
          <div className="flex flex-wrap gap-4 items-center text-sm text-gray-600">
            <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
              {nftCollection.symbol}
            </span>
            <span>Owned: {userNFTs.length} NFTs</span>
            {nftCollection.totalSupply && (
              <span>Total Supply: {nftCollection.totalSupply}</span>
            )}
            <span
              className="font-mono bg-gray-100 px-2 py-1 rounded text-xs"
              title={nftCollection.address}
            >
              {nftCollection.address.slice(0, 6)}...
              {nftCollection.address.slice(-4)}
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {userNFTs.map((nft: ProcessedNFT) => (
          <NFTCard
            key={`${nft.contractAddress}-${nft.tokenId}`}
            nft={nft}
            showCollection={false}
            showOwner={true}
            ownerAddress={walletAddress} // Pass the actual wallet address
            className="w-full" // Full width in grid
          />
        ))}
      </div>
    </div>
  );
};

export default NFTSection;
