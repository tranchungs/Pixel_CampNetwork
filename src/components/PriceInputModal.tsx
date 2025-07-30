import React, { useState } from "react";

interface PriceInputModalProps {
  isOpen: boolean;
  selectedItem: any;
  onClose: () => void;
  onSubmit: (item: any, price: string) => void;
}

const PriceInputModal: React.FC<PriceInputModalProps> = ({
  isOpen,
  selectedItem,
  onClose,
  onSubmit,
}) => {
  const [priceInput, setPriceInput] = useState("");
  const [priceError, setPriceError] = useState("");

  const handleSubmit = () => {
    // Validate price
    const price = parseFloat(priceInput);
    if (!priceInput || isNaN(price) || price <= 0) {
      setPriceError("Please enter a valid price greater than 0");
      return;
    }

    if (price > 999) {
      setPriceError("Price cannot exceed 999 CAMP");
      return;
    }

    // Clear error and proceed
    setPriceError("");
    onSubmit(selectedItem, priceInput);
    handleCloseModal();
  };

  const handleCloseModal = () => {
    onClose();
    setPriceInput("");
    setPriceError("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    } else if (e.key === "Escape") {
      handleCloseModal();
    }
  };

  if (!isOpen || !selectedItem) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleCloseModal}
    >
      <div
        className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-600 shadow-2xl animate-in fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">List NFT for Sale</h3>
          <button
            onClick={handleCloseModal}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-700"
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

        {/* NFT Preview */}
        <div className="flex items-center gap-4 mb-6 p-3 bg-slate-700 rounded-xl border border-slate-600">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 rounded-lg flex items-center justify-center overflow-hidden">
            {selectedItem?.image ? (
              <img
                src={selectedItem.image}
                alt={selectedItem.name || "NFT"}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="text-white text-2xl">🎨</div>
            )}
          </div>
          <div className="flex-1">
            <div className="text-white font-semibold truncate">
              {selectedItem?.name || "Pixel Art"}
            </div>
            <div className="text-gray-400 text-sm">
              Token #{selectedItem?.id?.split(":")[2] || "??"}
            </div>
            <div className="text-gray-500 text-xs mt-1">
              Collection: {selectedItem?.collection?.name || "Unknown"}
            </div>
          </div>
        </div>

        {/* Price Input Section */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Listing Price
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.001"
                min="0"
                max="999"
                value={priceInput}
                onChange={(e) => {
                  setPriceInput(e.target.value);
                  setPriceError("");
                }}
                placeholder="0.001"
                className="w-full bg-slate-700 border border-slate-500 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all pr-16"
                autoFocus
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-medium">
                CAMP
              </div>
            </div>
            {priceError && (
              <div className="mt-2 text-red-400 text-sm flex items-center gap-2">
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {priceError}
              </div>
            )}
          </div>

          {/* Quick Price Buttons */}
          <div>
            <div className="text-sm text-gray-400 mb-2">Quick select:</div>
            <div className="grid grid-cols-4 gap-2">
              {["0.001", "0.01", "0.1", "1"].map((price) => (
                <button
                  key={price}
                  type="button"
                  onClick={() => {
                    setPriceInput(price);
                    setPriceError("");
                  }}
                  className="bg-slate-700 hover:bg-slate-600 border border-slate-500 hover:border-slate-400 text-gray-300 hover:text-white px-3 py-2 rounded-lg text-sm transition-all duration-200"
                >
                  {price}
                </button>
              ))}
            </div>
          </div>

          {/* Fee Breakdown */}
          <div className="bg-slate-700/50 rounded-lg p-3 space-y-2 border border-slate-600">
            <div className="text-gray-400 text-sm font-medium">
              Fees breakdown:
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Listing price</span>
              <span className="text-white font-medium">
                {priceInput || "0"} CAMP
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Rarible fee (2.5%)</span>
              <span className="text-gray-300">
                {priceInput ? (parseFloat(priceInput) * 0.025).toFixed(4) : "0"}{" "}
                CAMP
              </span>
            </div>
            <div className="border-t border-slate-600 pt-2">
              <div className="flex justify-between text-sm">
                <span className="text-white font-medium">You'll receive</span>
                <span className="text-green-400 font-bold">
                  {priceInput
                    ? (parseFloat(priceInput) * 0.975).toFixed(4)
                    : "0"}{" "}
                  CAMP
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleCloseModal}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-gray-300 hover:text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 border border-slate-600"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!priceInput || parseFloat(priceInput) <= 0}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 shadow-lg ${
                !priceInput || parseFloat(priceInput) <= 0
                  ? "bg-slate-600 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-green-500/25"
              }`}
            >
              🏷️ List NFT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceInputModal;
