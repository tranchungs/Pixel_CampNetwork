"use client";
import React, { useEffect, useState } from "react";

interface AnimatedCampLogoProps {
  className?: string;
}

const AnimatedCampLogo: React.FC<AnimatedCampLogoProps> = ({
  className = "",
}) => {
  const [animatedPixels, setAnimatedPixels] = useState<Set<number>>(new Set());
  const [pixelColors, setPixelColors] = useState<Map<number, string>>(
    new Map()
  );

  // Camp Network logo pattern (from your original React component)
  const getCampLogoPattern = () => {
    const pattern: Array<{
      index: number;
      type: "flame" | "mountain" | "outline";
    }> = [];

    for (let i = 0; i < 100; i++) {
      const x = i % 10;
      const y = Math.floor(i / 10);

      // Camp Network logo logic
      const isCampLogo =
        // Vòng ngoài chữ C
        ((x === 1 || x === 2 || x === 7 || x === 8) && y >= 2 && y <= 7) ||
        ((x === 3 || x === 6) && (y === 1 || y === 8)) ||
        ((x === 4 || x === 5) && (y === 0 || y === 9)) ||
        // Ngọn lửa cam (vị trí 4,3 và 5,3 và 4,4)
        ((x === 4 || x === 5) && y === 3) ||
        (x === 4 && y === 4) ||
        // Đỉnh núi ở dưới
        ((x === 3 || x === 4 || x === 5 || x === 6) && y === 6) ||
        ((x === 4 || x === 5) && y === 7);

      // Màu sắc khác nhau cho các phần logo
      const isFlame = ((x === 4 || x === 5) && y === 3) || (x === 4 && y === 4);
      const isMountain =
        ((x === 3 || x === 4 || x === 5 || x === 6) && y === 6) ||
        ((x === 4 || x === 5) && y === 7);

      // vùng rỗng bên trong chữ C
      const hole = x >= 4 && x <= 5 && y >= 2 && y <= 5 && !isFlame;

      if (isCampLogo && !hole) {
        let type: "flame" | "mountain" | "outline" = "outline";
        if (isFlame) type = "flame";
        else if (isMountain) type = "mountain";

        pattern.push({ index: i, type });
      }
    }

    return pattern;
  };

  // Animation function
  const animatePixels = () => {
    const pattern = getCampLogoPattern();

    // Clear previous animation
    setAnimatedPixels(new Set());
    setPixelColors(new Map());

    // Animate each pixel with delay
    pattern.forEach(({ index, type }, animationIndex) => {
      setTimeout(() => {
        setAnimatedPixels((prev) => new Set([...prev, index]));
        setPixelColors((prev) => new Map([...prev, [index, type]]));
      }, animationIndex * 100); // 100ms delay between each pixel
    });
  };

  // Start animation on mount and repeat
  useEffect(() => {
    // Initial animation after 1 second
    const initialTimer = setTimeout(animatePixels, 1000);

    // Repeat animation every 8 seconds
    const repeatTimer = setInterval(() => {
      // Clear pixels first
      setAnimatedPixels(new Set());
      setPixelColors(new Map());

      // Start animation after 500ms
      setTimeout(animatePixels, 500);
    }, 8000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(repeatTimer);
    };
  }, []);

  // Get pixel style based on animation state
  const getPixelStyle = (index: number) => {
    const isAnimated = animatedPixels.has(index);
    const colorType = pixelColors.get(index);

    if (!isAnimated || !colorType) {
      return "bg-[#0a0b0f] border border-gray-800";
    }

    switch (colorType) {
      case "flame":
        return "bg-gradient-to-br from-orange-400 to-orange-600 shadow-sm animate-pulse";
      case "mountain":
        return "bg-white shadow-sm animate-pulse";
      case "outline":
        return "bg-gray-800 border border-gray-600 animate-pulse";
      default:
        return "bg-[#0a0b0f] border border-gray-800";
    }
  };

  return (
    <div
      className={`mx-auto w-[120px] h-[120px] grid grid-cols-10 grid-rows-10 gap-[1px] bg-gradient-to-br from-gray-900 to-black p-[3px] rounded-lg shadow-inner ${className}`}
    >
      {Array.from({ length: 100 }).map((_, i) => (
        <div
          key={i}
          className={`w-[9px] h-[9px] rounded-[1px] transition-all duration-300 ${getPixelStyle(
            i
          )}`}
        />
      ))}
    </div>
  );
};

export default AnimatedCampLogo;
