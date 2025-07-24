import { useState } from "react";

export type WeaponType = "rocket" | "bomb";

export interface WeaponItem {
  type: WeaponType;
  name: string;
  emoji: string;
  price: number; // Price in ETH
  description: string;
}

interface WeaponShopProps {
  isVisible: boolean;
  onClose: () => void;
  onPurchase: (
    weaponType: WeaponType,
    quantity: number,
    totalCost: number
  ) => Promise<void>;
  weaponItem: WeaponItem; // Chỉ hiện 1 weapon item
  isConnected: boolean;
}

export default function WeaponShop({
  isVisible,
  onClose,
  onPurchase,
  weaponItem,
  isConnected,
}: WeaponShopProps) {
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const totalCost = weaponItem.price * quantity;

  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, Math.min(99, quantity + delta));
    setQuantity(newQuantity);
  };

  const handlePurchase = async () => {
    if (!isConnected || isLoading) return;

    setIsLoading(true);
    try {
      await onPurchase(weaponItem.type, quantity, totalCost);
      // Reset after successful purchase
      setQuantity(1);
    } catch (error) {
      console.error("Purchase failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-[#00000038] bg-opacity-10 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg border-2 border-slate-600 p-4 w-full max-w-sm shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            {weaponItem.emoji} Buy {weaponItem.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Weapon Display */}
        <div className="mb-4">
          <div
            className={`p-4 rounded-lg border-2 ${
              weaponItem.type === "bomb"
                ? "border-orange-500 bg-orange-900/30"
                : "border-green-500 bg-green-900/30"
            }`}
          >
            <div className="text-center">
              <div className="text-4xl mb-2">{weaponItem.emoji}</div>
              <div className="text-lg font-bold text-white mb-1">
                {weaponItem.name}
              </div>
              <div className="text-sm text-gray-300 mb-1">
                {weaponItem.price} ETH
              </div>
              <div className="text-xs text-gray-400">
                {weaponItem.description}
              </div>
            </div>
          </div>
        </div>

        {/* Quantity Selector */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Quantity</h3>

          <div className="flex items-center justify-center gap-3 bg-slate-700 rounded-lg p-3">
            {/* Decrease Button */}
            <button
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= 1}
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                quantity <= 1
                  ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700 text-white"
              }`}
            >
              -
            </button>

            {/* Quantity Display */}
            <div className="flex flex-col items-center">
              <div className="text-2xl font-bold text-white">{quantity}</div>
              <div className="text-xs text-gray-400">
                {weaponItem.name}
                {quantity > 1 ? "s" : ""}
              </div>
            </div>

            {/* Increase Button */}
            <button
              onClick={() => handleQuantityChange(1)}
              disabled={quantity >= 99}
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                quantity >= 99
                  ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 text-white"
              }`}
            >
              +
            </button>
          </div>
        </div>

        {/* Cost Summary */}
        <div className="mb-4 bg-slate-700 rounded-lg p-3">
          <div className="flex justify-between items-center text-sm mb-1">
            <span className="text-gray-300">Unit Price:</span>
            <span className="text-white">{weaponItem.price} ETH</span>
          </div>
          <div className="flex justify-between items-center text-sm mb-1">
            <span className="text-gray-300">Quantity:</span>
            <span className="text-white">×{quantity}</span>
          </div>
          <div className="border-t border-slate-600 pt-2">
            <div className="flex justify-between items-center font-semibold">
              <span className="text-gray-200">Total Cost:</span>
              <span className="text-green-400">{totalCost.toFixed(4)} ETH</span>
            </div>
          </div>
        </div>

        {/* Purchase Button */}
        <div className="space-y-2">
          {!isConnected && (
            <div className="text-center text-xs text-orange-400 bg-orange-900/20 rounded-lg p-2">
              ⚠️ Please connect your wallet
            </div>
          )}

          <button
            onClick={handlePurchase}
            disabled={!isConnected || isLoading}
            className={`w-full py-3 rounded-lg font-bold text-sm transition-all ${
              isConnected && !isLoading
                ? `${
                    weaponItem.type === "bomb"
                      ? "bg-orange-600 hover:bg-orange-700"
                      : "bg-green-600 hover:bg-green-700"
                  } text-white`
                : "bg-gray-600 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                Processing...
              </div>
            ) : (
              <>
                {weaponItem.emoji} Purchase {quantity} {weaponItem.name}
                {quantity > 1 ? "s" : ""}
              </>
            )}
          </button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-1 mt-3">
          <button
            onClick={() => setQuantity(1)}
            className="py-1 text-xs bg-slate-600 hover:bg-slate-500 rounded transition-colors"
          >
            ×1
          </button>
          <button
            onClick={() => setQuantity(5)}
            className="py-1 text-xs bg-slate-600 hover:bg-slate-500 rounded transition-colors"
          >
            ×5
          </button>
          <button
            onClick={() => setQuantity(10)}
            className="py-1 text-xs bg-slate-600 hover:bg-slate-500 rounded transition-colors"
          >
            ×10
          </button>
        </div>
      </div>
    </div>
  );
}
