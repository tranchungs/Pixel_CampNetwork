// MarketplaceModal.tsx - Refactored with props control
import React, { useState, useEffect } from "react";
import MarketplaceSection from "./MarketplaceSection";
import { StatisticData } from "@/types/rarible";
import { getCollectionStatistics } from "@/services/raribleApi";

interface MarketplaceModalProps {
  isVisible: boolean; // ✅ Control from parent
  onClose: () => void; // ✅ Control from parent
  contractAddress: string;
  walletAddress?: string;
}

const MarketplaceModal: React.FC<MarketplaceModalProps> = ({
  isVisible, // ✅ Received from parent
  onClose, // ✅ Received from parent
  contractAddress,
  walletAddress,
}) => {
  const [stats, setStats] = useState<StatisticData | null>(null);

  // 🔥 Fetch collection statistics
  const fetchStats = async () => {
    try {
      const data = await getCollectionStatistics(contractAddress);

      if (data) {
        console.log("📊 Modal stats:", data);
        setStats(data);
      }
    } catch (err) {
      console.error("Error fetching modal stats:", err);
    }
  };

  // 🔥 Format currency display
  const formatCurrency = (amount: number, currency: string) => {
    if (amount < 0.01 && amount > 0) {
      return `<0.01 ${currency.toUpperCase()}`;
    }
    if (amount === 0) {
      return "—";
    }
    return `${amount} ${currency.toUpperCase()}`;
  };

  // 🔥 Prevent body scroll và hide other elements khi modal mở
  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = "hidden";
      // Hide other high z-index elements
      const paintSection = document.querySelector('[class*="z-50"]');
      if (paintSection) {
        (paintSection as HTMLElement).style.zIndex = "1";
      }

      // Fetch stats when modal opens
      fetchStats();
    } else {
      document.body.style.overflow = "unset";
      // Restore other elements
      const paintSection = document.querySelector('[class*="z-50"]');
      if (paintSection) {
        (paintSection as HTMLElement).style.zIndex = "50";
      }
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "unset";
      const paintSection = document.querySelector('[class*="z-50"]');
      if (paintSection) {
        (paintSection as HTMLElement).style.zIndex = "50";
      }
    };
  }, [isVisible, contractAddress]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose(); // ✅ Use prop function
    }
  };

  // 🔥 Dynamic stats configuration
  const getStatsConfig = () => {
    if (!stats) {
      // Loading state stats
      return [
        {
          label: "Floor Price",
          value: "—",
          gradient: "from-green-500 to-emerald-500",
        },
        {
          label: "Top Offer",
          value: "—",
          gradient: "from-blue-500 to-cyan-500",
        },
        {
          label: "24h Vol",
          value: "—",
          gradient: "from-purple-500 to-pink-500",
        },
        {
          label: "Listed / Supply",
          value: "—",
          gradient: "from-orange-500 to-red-500",
        },
      ];
    }

    return [
      {
        label: "Floor Price",
        value: stats.floor
          ? formatCurrency(
              stats.floor.amount || 0,
              stats.floor.currency.abbreviation || "CAMP"
            )
          : "—",
        gradient: "from-green-500 to-emerald-500",
      },
      {
        label: "Top Offer",
        value: stats.topOffer
          ? formatCurrency(
              stats.topOffer.amount || 0,
              stats.topOffer.currency.abbreviation || "CAMP"
            )
          : "—",
        gradient: "from-blue-500 to-cyan-500",
      },
      {
        label: "24h Vol",
        value: formatCurrency(
          stats.dayVolume?.amount || 0,
          stats.dayVolume?.currency.abbreviation || "CAMP"
        ),
        gradient: "from-purple-500 to-pink-500",
      },
      {
        label: "Listed / Supply",
        value: `${stats.listedItems}/${stats.items}`,
        gradient: "from-orange-500 to-red-500",
      },
    ];
  };

  const statsConfig = getStatsConfig();

  // ✅ Return null if not visible
  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
      style={{ zIndex: 9999 }} // ✅ Higher z-index
      onClick={handleOverlayClick}
    >
      {/* 🔥 Modal Container - Fixed sizing */}
      <div
        className="bg-slate-800 rounded-xl border-2 border-slate-600 shadow-2xl w-full max-w-7xl h-[88vh] flex flex-col overflow-hidden"
        style={{ zIndex: 10000 }} // ✅ Highest z-index
        onClick={(e) => e.stopPropagation()}
      >
        {/* 🔥 Header với proper avatar */}
        <div className="flex items-center justify-between p-6 border-b border-slate-600 bg-slate-800 rounded-t-xl flex-shrink-0">
          <div className="flex items-center gap-4">
            {/* Simple avatar thay vì gradient phức tạp */}
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              PC
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">PixelCanvasNFT</h2>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span className="font-mono">
                  📄 {contractAddress.slice(0, 4)}...
                  {contractAddress.slice(-4)}
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(contractAddress)}
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  📋
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Refresh Stats Button */}
            <button
              onClick={fetchStats}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 text-gray-400 hover:text-white transition-colors"
              title="Refresh Stats"
            >
              🔄
            </button>

            {/* Close Button */}
            <button
              onClick={onClose} // ✅ Use prop function
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 text-gray-400 hover:text-white transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* 🔥 Dynamic Stats Row */}
        <div className="px-6 py-3 bg-slate-800 border-b border-slate-600 flex-shrink-0">
          <div className="grid grid-cols-4 gap-4">
            {statsConfig.map((stat, index) => (
              <div key={index} className="relative h-16">
                {/* Gradient border */}
                <div
                  className={`absolute inset-0 bg-gradient-to-r ${stat.gradient} rounded-lg p-0.5`}
                >
                  <div className="bg-slate-800 rounded-md h-full px-3 py-2 flex flex-col justify-center text-center">
                    <div className="text-xs text-gray-400 mb-1 leading-tight">
                      {stat.label}
                    </div>
                    <div
                      className={`font-bold text-sm leading-tight ${
                        !stats ? "text-gray-500 animate-pulse" : "text-white"
                      }`}
                    >
                      {stat.value}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 🔥 Additional Stats Row (Optional) */}
        {stats && (
          <div className="px-6 py-2 bg-slate-900 border-b border-slate-600 flex-shrink-0">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-6">
                <span className="text-gray-400">
                  Total Volume:{" "}
                  <span className="text-white font-medium">
                    {formatCurrency(
                      stats.totalVolume.amount,
                      stats.totalVolume.currency.abbreviation
                    )}
                  </span>
                </span>
                <span className="text-gray-400">
                  Owners:{" "}
                  <span className="text-white font-medium">{stats.owners}</span>
                </span>
                <span className="text-gray-400">
                  Listed:{" "}
                  <span className="text-white font-medium">
                    {((stats.listedItems / stats.items) * 100).toFixed(0)}%
                  </span>
                </span>
              </div>
              <div className="text-gray-500 text-xs">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        )}

        {/* 🔥 Content với slate background */}
        <div className="flex-1 overflow-hidden bg-slate-800">
          <MarketplaceSection
            contractAddress={contractAddress}
            walletAddress={walletAddress}
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
};

export default MarketplaceModal;
