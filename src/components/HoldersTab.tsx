import React, { useState, useEffect } from "react";

interface HolderData {
  rank: number;
  address: string;
  holdCount: number;
  percentage: number;
  isYou?: boolean;
}

interface HoldersTabProps {
  ownerships: any[];
  walletAddress?: string;
  totalSupply: number;
}

const HoldersTab: React.FC<HoldersTabProps> = ({
  ownerships,
  walletAddress,
  totalSupply,
}) => {
  const [holders, setHolders] = useState<HolderData[]>([]);

  // Generate avatar color based on address
  const getAvatarColor = (address: string) => {
    const colors = [
      "from-orange-400 to-pink-400",
      "from-purple-400 to-pink-400",
      "from-blue-400 to-purple-400",
      "from-green-400 to-blue-400",
      "from-yellow-400 to-orange-400",
      "from-pink-400 to-red-400",
      "from-indigo-400 to-purple-400",
      "from-teal-400 to-green-400",
      "from-cyan-400 to-blue-400",
      "from-emerald-400 to-teal-400",
    ];

    // Use address hash to consistently pick same color
    const hash = address.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);

    return colors[Math.abs(hash) % colors.length];
  };

  // Format address display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 3)}...${address.slice(-4)}`;
  };

  // Calculate holders from ownerships data
  useEffect(() => {
    if (!ownerships || ownerships.length === 0) return;

    // Count NFTs per holder
    const holderMap = new Map<string, number>();

    ownerships.forEach((item: any) => {
      const ownerField = item.owner || item.ownerIfSingle;
      if (!ownerField) return;

      // Parse owner address
      const ownerAddr = ownerField.includes(":")
        ? ownerField.split(":")[1]
        : ownerField;

      if (ownerAddr) {
        holderMap.set(ownerAddr, (holderMap.get(ownerAddr) || 0) + 1);
      }
    });

    // Convert to array and sort by holding count
    const holdersArray: HolderData[] = Array.from(holderMap.entries())
      .map(([address, count]) => ({
        rank: 0, // Will be set after sorting
        address,
        holdCount: count,
        percentage: (count / totalSupply) * 100,
        isYou: walletAddress?.toLowerCase() === address.toLowerCase(),
      }))
      .sort((a, b) => b.holdCount - a.holdCount)
      .map((holder, index) => ({
        ...holder,
        rank: index + 1,
      }));

    setHolders(holdersArray);
  }, [ownerships, totalSupply, walletAddress]);

  return (
    <div className="bg-slate-800 text-white">
      {/* Header */}
      <div className="grid grid-cols-12 gap-4 px-6 py-4 text-sm font-medium text-gray-400 border-b border-slate-700">
        <div className="col-span-1">#</div>
        <div className="col-span-7">WALLET</div>
        <div className="col-span-2 text-center">HOLD</div>
        <div className="col-span-2 text-right">HOLD %</div>
      </div>

      {/* Holders List */}
      <div className="max-h-96 overflow-y-auto holders-scrollbar">
        {holders.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-4">👥</div>
            <div>No holders data available</div>
          </div>
        ) : (
          holders.map((holder) => (
            <div
              key={holder.address}
              className={`grid grid-cols-12 gap-4 px-6 py-4 text-sm hover:bg-slate-700/50 transition-colors border-b border-slate-800 ${
                holder.isYou ? "bg-purple-900/20 border-purple-500/30" : ""
              }`}
            >
              {/* Rank */}
              <div className="col-span-1 flex items-center">
                <span className="text-gray-300 font-medium">{holder.rank}</span>
              </div>

              {/* Wallet with Avatar */}
              <div className="col-span-7 flex items-center gap-3">
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarColor(
                    holder.address
                  )} flex items-center justify-center`}
                >
                  <span className="text-white text-xs font-bold">
                    {holder.address.slice(2, 4).toUpperCase()}
                  </span>
                </div>

                {/* Address */}
                <div className="flex items-center gap-2">
                  <span className="font-mono text-gray-200">
                    {formatAddress(holder.address)}
                  </span>
                  {holder.isYou && (
                    <span className="bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                      You
                    </span>
                  )}
                </div>
              </div>

              {/* Hold Count */}
              <div className="col-span-2 flex items-center justify-center">
                <span className="text-white font-semibold">
                  {holder.holdCount}
                </span>
              </div>

              {/* Hold Percentage */}
              <div className="col-span-2 flex items-center justify-end">
                <span className="text-gray-300 font-medium">
                  {holder.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HoldersTab;
