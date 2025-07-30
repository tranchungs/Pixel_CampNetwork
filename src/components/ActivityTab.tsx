import React, { useState, useEffect } from "react";
import { ActivityData, ActivityResponse } from "@/types/rarible";
import { getCollectionActivity } from "@/services/raribleApi";

interface ActivityTabProps {
  contractAddress: string;
  walletAddress?: string;
}

const ActivityTab: React.FC<ActivityTabProps> = ({
  contractAddress,
  walletAddress,
}) => {
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(true);

  // Fetch activity data
  const fetchActivityData = async (loadMore = false) => {
    setLoading(true);
    setError(null);

    try {
      // ✅ Cast response to ActivityResponse type
      const response = (await getCollectionActivity(
        contractAddress,
        loadMore ? cursor : undefined,
        20 // Page size
      )) as ActivityResponse;

      if (loadMore) {
        setActivities((prev) => [...prev, ...response.activities]);
      } else {
        setActivities(response.activities);
      }

      setCursor(response.cursor);
      setHasMore(!!response.cursor);
    } catch (err) {
      console.error("Error fetching activity data:", err);
      setError("Failed to load activity data");

      if (!loadMore) {
        setActivities([]);
      }
    } finally {
      setLoading(false);
    }
  };

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

    const hash = address.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);

    return colors[Math.abs(hash) % colors.length];
  };

  // Format address display
  const formatAddress = (address: string) => {
    const addr = address.includes(":") ? address.split(":")[1] : address;
    return `${addr.slice(0, 3)}...${addr.slice(-4)}`;
  };

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffHours >= 24) {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } else if (diffHours >= 1) {
      return `${diffHours}h ago`;
    } else {
      return `${Math.max(1, diffMinutes)}m ago`;
    }
  };

  // Check if address is current user
  const isYou = (address: string) => {
    if (!walletAddress) return false;
    const addr = address.includes(":") ? address.split(":")[1] : address;
    return addr.toLowerCase() === walletAddress.toLowerCase();
  };

  // Get action type styling
  const getActionStyle = (type: string) => {
    switch (type) {
      case "BUY":
        return "text-green-400 bg-green-900/20";
      case "SELL":
        return "text-red-400 bg-red-900/20";
      case "LIST":
        return "text-blue-400 bg-blue-900/20";
      case "TRANSFER":
        return "text-purple-400 bg-purple-900/20";
      case "MINT":
        return "text-yellow-400 bg-yellow-900/20";
      case "CANCEL":
        return "text-orange-400 bg-orange-900/20";
      case "BID":
        return "text-cyan-400 bg-cyan-900/20";
      default:
        return "text-gray-400 bg-gray-900/20";
    }
  };

  // ✅ Format price with proper number handling
  const formatPrice = (amount: string) => {
    const num = parseFloat(amount);
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  // ✅ Get display person based on activity type
  const getDisplayPerson = (activity: ActivityData) => {
    // For BUY: show seller (who sold it)
    // For SELL: show buyer (who bought it)
    // For TRANSFER: show recipient (to)
    switch (activity.type) {
      case "BUY":
        return activity.seller;
      case "SELL":
        return activity.buyer;
      case "TRANSFER":
        return activity.buyer; // recipient
      default:
        return activity.seller;
    }
  };

  // Load data on mount
  useEffect(() => {
    if (contractAddress) {
      fetchActivityData();
    }
  }, [contractAddress]);

  return (
    <div className="bg-slate-800 text-white">
      {/* Header */}
      <div className="grid grid-cols-12 gap-4 px-6 py-4 text-sm font-medium text-gray-400 border-b border-slate-700">
        <div className="col-span-2">TIME</div>
        <div className="col-span-2">ACTION</div>
        <div className="col-span-3">ITEM</div>
        <div className="col-span-2 text-center">VALUE</div>
        <div className="col-span-3 text-right pr-4">FROM/TO</div>
      </div>

      {/* Activity List */}
      <div className="max-h-96 overflow-y-auto holders-scrollbar">
        {loading && activities.length === 0 && (
          <div className="text-center py-12 text-purple-400">
            <div className="animate-pulse">🔄 Loading activities...</div>
          </div>
        )}

        {error && (
          <div className="text-center py-12 text-red-400">
            <div className="mb-4">❌ {error}</div>
            <button
              onClick={() => fetchActivityData(false)} // ✅ Fix: Pass function reference, not call it
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              🔄 Retry
            </button>
          </div>
        )}

        {!loading && !error && activities.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-4">📊</div>
            <div>No activity data available</div>
          </div>
        )}

        {activities.map((activity) => {
          const displayPerson = getDisplayPerson(activity);

          return (
            <div
              key={activity.id}
              className="grid grid-cols-12 gap-4 px-6 py-4 text-sm hover:bg-slate-700/50 transition-colors border-b border-slate-800"
            >
              {/* Time */}
              <div className="col-span-2 flex items-center">
                <span className="text-gray-300">
                  {formatTimeAgo(activity.date)}
                </span>
              </div>

              {/* Action */}
              <div className="col-span-2 flex items-center">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${getActionStyle(
                    activity.type
                  )}`}
                >
                  {activity.type}
                </span>
              </div>

              {/* Item */}
              <div className="col-span-3 flex items-center gap-3">
                {/* NFT Image */}
                <div className="w-8 h-8 rounded-lg overflow-hidden bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 flex-shrink-0">
                  {activity.nft.image ? (
                    <img
                      src={activity.nft.image}
                      alt={activity.nft.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-xs">
                      🎨
                    </div>
                  )}
                </div>

                {/* NFT Info */}
                <div className="min-w-0">
                  <div className="text-white font-medium truncate">
                    {activity.nft.name}
                  </div>
                  <div className="text-gray-400 text-xs">
                    #{activity.nft.id.split(":")[2]}
                  </div>
                </div>
              </div>

              {/* Value */}
              <div className="col-span-2 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-white font-semibold">
                    {formatPrice(activity.price.amount)}
                  </div>
                  <div className="text-gray-400 text-xs uppercase">
                    {activity.price.currency.abbreviation}
                  </div>
                </div>
              </div>

              {/* From/To */}
              <div className="col-span-3 flex items-center justify-end pr-4">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarColor(
                      displayPerson
                    )} flex items-center justify-center flex-shrink-0`}
                  >
                    <span className="text-white text-xs font-bold">
                      {displayPerson
                        .split(":")[1]
                        ?.slice(2, 4)
                        ?.toUpperCase() || "??"}
                    </span>
                  </div>

                  {/* Address or "You" */}
                  <div className="flex items-center">
                    {isYou(displayPerson) ? (
                      <span className="bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap">
                        You
                      </span>
                    ) : (
                      <span className="font-mono text-gray-300 text-sm whitespace-nowrap">
                        {formatAddress(displayPerson)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading more indicator */}
        {loading && activities.length > 0 && (
          <div className="text-center py-4 text-purple-400">
            <div className="animate-pulse">Loading more...</div>
          </div>
        )}
      </div>

      {/* Load More Button */}
      {!loading && !error && activities.length > 0 && hasMore && (
        <div className="px-6 py-4 border-t border-slate-700 text-center">
          <button
            onClick={() => fetchActivityData(true)} // ✅ Fix: Pass true for loadMore
            disabled={loading}
            className="bg-slate-700 hover:bg-slate-600 text-gray-300 hover:text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Loading..." : "Load More Activities"}
          </button>
        </div>
      )}

      {/* End of data indicator */}
      {!loading && !error && activities.length > 0 && !hasMore && (
        <div className="px-6 py-4 border-t border-slate-700 text-center">
          <span className="text-gray-400 text-sm">
            🎉 You've seen all activities!
          </span>
        </div>
      )}
    </div>
  );
};

export default ActivityTab;
