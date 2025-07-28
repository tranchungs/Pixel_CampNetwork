import { useState } from "react";

interface SimpleNFTSuccessModalProps {
  isVisible: boolean;
  onClose: () => void;
  transactionHash: string | null;
  nftImage: string | null; // base64 image
  coordinates?: { x: number; y: number };
  size?: { width: number; height: number };
}

export default function SimpleNFTSuccessModal({
  isVisible,
  onClose,
  transactionHash,
  nftImage,
  coordinates,
  size,
}: SimpleNFTSuccessModalProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isVisible) return null;

  // Share to X
  const handleShareToX = () => {
    setIsSharing(true);

    const shareText = `🎨 Just minted my pixel art NFT!
    (Copy and replace it with your image)
📍 Coordinates: (42, 18)
📏 Size: 64×64 pixels

Create yours at ✨ https://pixel-camp-network.vercel.app

#PixelGame @campnetworkxyz @WizzHQ `;

    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      shareText
    )}`;
    window.open(tweetUrl, "_blank", "width=550,height=420");

    setTimeout(() => setIsSharing(false), 1000);
  };

  // Copy transaction hash
  const handleCopyImage = async () => {
    if (!nftImage) return;

    try {
      // Extract base64 data and mime type
      const [header, data] = nftImage.split(",");
      const mimeType = header.match(/:(.*?);/)?.[1] || "image/png";

      // Convert base64 to binary
      const binaryString = atob(data);
      const bytes = new Uint8Array(binaryString.length);

      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Create blob
      const blob = new Blob([bytes], { type: mimeType });

      // Copy to clipboard
      await navigator.clipboard.write([
        new ClipboardItem({ [mimeType]: blob }),
      ]);

      console.log("✅ Image copied to clipboard!");
    } catch (error) {
      console.error("❌ Copy failed:", error);
      throw error;
    }
  };

  return (
    <div className="fixed inset-0 bg-[#00000038] bg-opacity-10 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg border-2 border-slate-600 p-4 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            🎉 NFT Minted!
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl transition-colors"
          >
            ✕
          </button>
        </div>

        {/* NFT Image */}
        <div className="mb-4">
          <div className="p-4 rounded-lg border-2 border-purple-500 bg-purple-900/30">
            <div className="bg-white rounded-lg overflow-hidden aspect-square mb-3">
              {nftImage ? (
                <img
                  src={nftImage}
                  alt="Minted NFT"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🎨</div>
                    <div className="text-gray-500 text-sm">Your Pixel Art</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* NFT Stats */}
        {(coordinates || size) && (
          <div className="mb-4 space-y-2">
            <h3 className="text-sm font-semibold text-gray-300">NFT Details</h3>

            <div className="grid grid-cols-2 gap-2">
              {/* Position */}
              {coordinates && (
                <div className="bg-slate-700 rounded-lg p-3">
                  <div className="text-xs text-blue-400 mb-1">📍 Position</div>
                  <div className="text-sm font-bold text-white">
                    ({coordinates.x}, {coordinates.y})
                  </div>
                </div>
              )}

              {/* Size */}
              {size && (
                <div className="bg-slate-700 rounded-lg p-3">
                  <div className="text-xs text-green-400 mb-1">📏 Size</div>
                  <div className="text-sm font-bold text-white">
                    {size.width}×{size.height}px
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {/* Share to X */}
          <button
            onClick={handleShareToX}
            disabled={isSharing}
            className="w-full py-3 rounded-lg font-bold text-sm transition-all bg-black hover:bg-gray-800 text-white disabled:bg-gray-600"
          >
            {isSharing ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                Sharing...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                Share on X
              </div>
            )}
          </button>
          <button
            onClick={handleCopyImage}
            className="w-full py-3 rounded-lg font-bold text-sm transition-all bg-orange-500 hover:bg-orange-600 text-white disabled:bg-gray-600 disabled:text-gray-400"
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Image
            </div>
          </button>
          {/* Secondary Actions */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() =>
                window.open(
                  `https://basecamp.cloud.blockscout.com/tx/${transactionHash}`,
                  "_blank"
                )
              }
              className="py-2 text-xs bg-gray-600 hover:bg-gray-700 rounded transition-colors text-white"
            >
              📊 View Transaction
            </button>
            <button
              onClick={onClose}
              className="py-2 text-xs bg-purple-600 hover:bg-purple-700 rounded transition-colors text-white"
            >
              🎨 Create Another
            </button>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full py-2 text-sm bg-slate-600 hover:bg-slate-500 rounded transition-colors text-white"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

export const useSimpleNFTModal = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [nftImage, setNftImage] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<
    { x: number; y: number } | undefined
  >();
  const [size, setSize] = useState<
    { width: number; height: number } | undefined
  >();

  const showSuccess = (
    hash: string,
    image: string,
    coords?: { x: number; y: number },
    dimensions?: { width: number; height: number }
  ) => {
    setTransactionHash(hash);
    setNftImage(image);
    setCoordinates(coords);
    setSize(dimensions);
    setIsVisible(true);
  };

  const hideSuccess = () => {
    setIsVisible(false);
    // Reset sau 300ms
    setTimeout(() => {
      setTransactionHash(null);
      setNftImage(null);
      setCoordinates(undefined);
      setSize(undefined);
    }, 300);
  };

  return {
    isVisible,
    transactionHash,
    nftImage,
    coordinates,
    size,
    showSuccess,
    hideSuccess,
  };
};
