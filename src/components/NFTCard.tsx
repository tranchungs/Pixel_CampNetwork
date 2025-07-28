import React, { useState } from "react";
import { ProcessedNFT } from "./getUserNFTsFromContract";

interface NFTCardProps {
  nft: ProcessedNFT;
  showCollection?: boolean;
  showOwner?: boolean;
  ownerAddress?: string; // Add owner address prop
  className?: string;
}

const NFTCard: React.FC<NFTCardProps> = ({
  nft,
  showCollection = false,
  showOwner = false,
  ownerAddress,
  className = "",
}) => {
  const [imageError, setImageError] = useState(false);

  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <div
      className={`bg-slate-700 border border-slate-600 rounded-lg overflow-hidden ${className}`}
    >
      <div className="aspect-square bg-black overflow-hidden">
        {nft.image && !imageError ? (
          <img
            src={nft.image}
            alt={nft.name}
            className="w-full h-full object-contain"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 text-gray-500">
            <span className="text-lg">🖼️</span>
            <span className="text-xs">No Image</span>
          </div>
        )}
      </div>

      <div className="p-2 bg-slate-700">
        <h4
          className="text-white text-sm font-bold mb-1 truncate"
          title={nft.name}
        >
          ID# {nft.tokenId}
        </h4>

        {showCollection && (
          <p
            className="text-blue-400 text-xs font-medium truncate mb-1"
            title={nft.contractName}
          >
            📦 {nft.contractName}
          </p>
        )}

        {showOwner && ownerAddress && (
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <span className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0"></span>
            <span className="font-mono">{formatAddress(ownerAddress)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default NFTCard;
