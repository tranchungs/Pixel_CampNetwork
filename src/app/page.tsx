"use client";

import { CampModal, useAuth } from "@campnetwork/origin/react";
import Game from "@/components/GameCanvas";
import { useState, useEffect } from "react";
import AnimatedCampLogo from "@/components/CampLogoPixel";
export default function Auth() {
  const { jwt, origin, viem } = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  // 🔧 FIX: Only render after component mounts to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 🔧 FIX: Show loading state until mounted
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0b10] via-[#1a1c23] to-[#0e0f14] text-white flex items-center justify-center">
        <div className="max-w-sm w-full px-6 py-10 bg-gradient-to-b from-[#1f2129] to-[#161821] rounded-3xl text-center space-y-6 shadow-2xl border border-gray-800">
          <div className="text-xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  if (!jwt && !viem) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0b10] via-[#1a1c23] to-[#0e0f14] text-white flex items-center justify-center">
        <div className="max-w-sm w-full px-6 py-10 bg-gradient-to-b from-[#1f2129] to-[#161821] rounded-3xl text-center space-y-6 shadow-2xl border border-gray-800">
          <h1 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
            Pixel CampNetwork
          </h1>
          <p className="text-sm text-gray-300 leading-relaxed">
            Pixel is a blank canvas 500x500px where users transform pixels.
          </p>

          <div className="mx-auto w-[120px] h-[120px] grid grid-cols-10 grid-rows-10 gap-[1px] bg-gradient-to-br from-gray-900 to-black p-[3px] rounded-lg shadow-inner">
            <AnimatedCampLogo></AnimatedCampLogo>
          </div>

          {/* Instructions */}
          <div className="text-left text-sm text-gray-300 space-y-3">
            <p>
              <span className="font-bold">1.</span> You can put some pixels on
              it, but you have to wait to continue.
            </p>
            <p>
              <span className="font-bold">2.</span> Get rewarded in ◼ for
              repainting and owning pixels.
            </p>
            <p>
              <span className="font-bold">3.</span> Be creative. Enjoy.
            </p>
          </div>
          <div className="w-full pt-2">
            <CampModal />
          </div>
        </div>
      </div>
    );
  } else {
    return <Game />;
  }
}
