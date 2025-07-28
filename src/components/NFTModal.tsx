import React, { useState } from "react";
import NFTSection from "./NFTSection";

interface NFTModalProps {
  contractAddress: string;
  walletAddress?: string; // Optional wallet address prop
  buttonText?: string;
  title?: string;
  className?: string;
}

const NFTModal: React.FC<NFTModalProps> = ({
  contractAddress,
  walletAddress,
  buttonText = "Collection",
  title = "My NFT Collection",
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => {
    if (!walletAddress) {
      alert("Please connect your wallet first!");
      return;
    }
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  // Close modal when clicking outside
  const handleOverlayClick = (e: React.MouseEvent) => {
    // Only close if clicking directly on overlay, not on modal content
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  // Close modal with Escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        closeModal();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed"; // Extra prevention
      document.body.style.width = "100%";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
      document.body.style.position = "unset";
      document.body.style.width = "unset";
    };
  }, [isOpen]);

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={openModal}
        className={`bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-none py-3 px-6 rounded-lg text-base font-medium cursor-pointer transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 inline-flex items-center gap-2 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none ${className}`}
        disabled={!walletAddress}
      >
        {buttonText}
        {!walletAddress && (
          <span className="text-sm opacity-80"> (Connect Wallet)</span>
        )}
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-[#00000038] bg-opacity-10 flex items-center justify-center z-[9999] p-4"
          onClick={handleOverlayClick}
        >
          <div className="bg-slate-800 rounded-lg border-2 border-slate-600 p-4 w-full max-w-sm shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                🎨 PixelCanvasNFT
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-white text-xl transition-colors"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Modal Body - NFT Grid */}
            <div className="space-y-3">
              <NFTSection
                contractAddress={contractAddress}
                walletAddress={walletAddress}
                className="!m-0 !p-0 !bg-transparent !border-0"
                hideHeader={true}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NFTModal;
