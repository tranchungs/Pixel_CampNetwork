import { useEffect, useState } from "react";

interface RocketStrikeProps {
  targetX: number;
  targetY: number;
  scale: number;
  offset: { x: number; y: number };
  isActive: boolean;
  onComplete: () => void; // Callback khi rocket đến đích và nổ
}

interface Rocket {
  x: number;
  y: number;
  dx: number;
  dy: number;
  angle: number;
  trail: { x: number; y: number; opacity: number }[];
  thrusterParticles: ThrusterParticle[];
}

interface ThrusterParticle {
  x: number;
  y: number;
  dx: number;
  dy: number;
  life: number;
  maxLife: number;
  size: number;
}

export default function RocketStrike({
  targetX,
  targetY,
  scale,
  offset,
  isActive,
  onComplete,
}: RocketStrikeProps) {
  const [rocket, setRocket] = useState<Rocket | null>(null);
  const [hasCompleted, setHasCompleted] = useState(false);

  // Handle completion in useEffect to avoid setState during render
  useEffect(() => {
    if (hasCompleted) {
      onComplete();
      setHasCompleted(false);
    }
  }, [hasCompleted, onComplete]);

  useEffect(() => {
    if (!isActive) {
      setRocket(null);
      return;
    }

    // Random spawn từ 1 trong 4 cạnh màn hình
    const viewportWidth = window.innerWidth / scale;
    const viewportHeight = window.innerHeight / scale;

    const spawnSide = Math.floor(Math.random() * 4);
    let startX, startY;
    switch (spawnSide) {
      case 0: // Top
        startX = offset.x + Math.random() * viewportWidth;
        startY = offset.y - 15;
        break;
      case 1: // Right
        startX = offset.x + viewportWidth + 15;
        startY = offset.y + Math.random() * viewportHeight;
        break;
      case 2: // Bottom
        startX = offset.x + Math.random() * viewportWidth;
        startY = offset.y + viewportHeight + 15;
        break;
      default: // Left
        startX = offset.x - 15;
        startY = offset.y + Math.random() * viewportHeight;
    }

    // Tính vector hướng tới target
    const deltaX = targetX - startX;
    const deltaY = targetY - startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const speed = 1; // Tăng tốc độ để dễ thấy

    const newRocket: Rocket = {
      x: startX,
      y: startY,
      dx: (deltaX / distance) * speed,
      dy: (deltaY / distance) * speed,
      angle: Math.atan2(deltaY, deltaX) * (180 / Math.PI),
      trail: [],
      thrusterParticles: [],
    };

    setRocket(newRocket);

    // Animation loop
    const animationInterval = setInterval(() => {
      setRocket((prev) => {
        if (!prev) return null;

        const newX = prev.x + prev.dx;
        const newY = prev.y + prev.dy;

        // Check if reached target (within 2 pixels)
        const distToTarget = Math.sqrt(
          (newX - targetX) ** 2 + (newY - targetY) ** 2
        );

        if (distToTarget < 2) {
          // Rocket reached target - trigger explosion
          clearInterval(animationInterval);
          setHasCompleted(true);
          return null;
        }

        // Update trail
        const newTrail = [
          { x: prev.x, y: prev.y, opacity: 1 },
          ...prev.trail.map((t) => ({
            ...t,
            opacity: t.opacity * 0.9,
          })),
        ].slice(0, 8);

        // Create thruster particles
        const newThrusterParticles: ThrusterParticle[] = [];

        // Add new thruster particles
        for (let i = 0; i < 2; i++) {
          const spreadAngle =
            (prev.angle + 180 + (Math.random() - 0.5) * 45) * (Math.PI / 180);
          const particleSpeed = 0.3 + Math.random() * 0.2;

          newThrusterParticles.push({
            x: prev.x - Math.cos((prev.angle * Math.PI) / 180) * 1,
            y: prev.y - Math.sin((prev.angle * Math.PI) / 180) * 1,
            dx: Math.cos(spreadAngle) * particleSpeed,
            dy: Math.sin(spreadAngle) * particleSpeed,
            life: 12,
            maxLife: 12,
            size: 0.3 + Math.random() * 0.3,
          });
        }

        // Update existing thruster particles
        const updatedThrusterParticles = [
          ...newThrusterParticles,
          ...prev.thrusterParticles
            .map((p) => ({
              ...p,
              x: p.x + p.dx,
              y: p.y + p.dy,
              dx: p.dx * 0.95,
              dy: p.dy * 0.95,
              life: p.life - 1,
            }))
            .filter((p) => p.life > 0),
        ];

        return {
          ...prev,
          x: newX,
          y: newY,
          trail: newTrail.filter((t) => t.opacity > 0.1),
          thrusterParticles: updatedThrusterParticles,
        };
      });
    }, 50); // 20 FPS

    // Safety cleanup after 10 seconds
    const safetyCleanup = setTimeout(() => {
      clearInterval(animationInterval);
      setRocket(null);
    }, 10000);

    return () => {
      clearInterval(animationInterval);
      clearTimeout(safetyCleanup);
    };
  }, [isActive, targetX, targetY]);

  if (!rocket) return null;

  const screenX = (rocket.x - offset.x) * scale;
  const screenY = (rocket.y - offset.y) * scale;

  // Skip if outside viewport
  if (
    screenX < -100 ||
    screenX > window.innerWidth + 100 ||
    screenY < -100 ||
    screenY > window.innerHeight + 100
  ) {
    return null;
  }

  const rocketSize = scale * 1.5;

  return (
    <>
      {/* Thruster particles */}
      {rocket.thrusterParticles.map((particle, i) => {
        const particleScreenX = (particle.x - offset.x) * scale;
        const particleScreenY = (particle.y - offset.y) * scale;
        const particleOpacity = particle.life / particle.maxLife;
        const particleSize = particle.size * scale;

        return (
          <div
            key={i}
            className="absolute pointer-events-none"
            style={{
              left: `${particleScreenX}px`,
              top: `${particleScreenY}px`,
              width: `${particleSize}px`,
              height: `${particleSize}px`,
              backgroundColor: "#FF4500",
              opacity: particleOpacity,
              borderRadius: "50%",
              transform: "translate(-50%, -50%)",
              boxShadow: `0 0 ${particleSize * 2}px #FF4500`,
            }}
          />
        );
      })}

      {/* Trail */}
      {rocket.trail.map((point, i) => {
        const trailScreenX = (point.x - offset.x) * scale;
        const trailScreenY = (point.y - offset.y) * scale;
        const trailSize = scale * (1 - i * 0.1) * 1.2;

        return (
          <div
            key={i}
            className="absolute pointer-events-none"
            style={{
              left: `${trailScreenX}px`,
              top: `${trailScreenY}px`,
              width: `${trailSize}px`,
              height: `${trailSize}px`,
              backgroundColor: "#FF6347",
              opacity: point.opacity * 0.6,
              borderRadius: "50%",
              transform: "translate(-50%, -50%)",
            }}
          />
        );
      })}

      {/* Rocket body */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: `${screenX}px`,
          top: `${screenY}px`,
          width: `${rocketSize}px`,
          height: `${rocketSize * 0.4}px`,
          backgroundColor: "#C0C0C0",
          transform: `translate(-50%, -50%) rotate(${rocket.angle}deg)`,
          borderRadius: "0 50% 50% 0",
          boxShadow: `0 0 ${rocketSize}px #FF4500`,
        }}
      />

      {/* Rocket tip */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: `${
            screenX +
            Math.cos((rocket.angle * Math.PI) / 180) * rocketSize * 0.3
          }px`,
          top: `${
            screenY +
            Math.sin((rocket.angle * Math.PI) / 180) * rocketSize * 0.3
          }px`,
          width: `${rocketSize * 0.6}px`,
          height: `${rocketSize * 0.2}px`,
          backgroundColor: "#FFD700",
          transform: `translate(-50%, -50%) rotate(${rocket.angle}deg)`,
          borderRadius: "0 50% 50% 0",
        }}
      />
    </>
  );
}

// Demo component để test
function RocketStrikeDemo() {
  const [isActive, setIsActive] = useState(false);
  const [targetPos, setTargetPos] = useState({ x: 250, y: 250 });
  const [scale] = useState(16);
  const [offset] = useState({ x: 200, y: 200 });
  const [showExplosion, setShowExplosion] = useState(false);

  const handleRocketComplete = () => {
    console.log("🚀➡️💥 Rocket reached target!");
    setIsActive(false);
    setShowExplosion(true);

    // Hide explosion after 2 seconds
    setTimeout(() => {
      setShowExplosion(false);
    }, 2000);
  };

  const fireRocket = () => {
    // Random target position
    setTargetPos({
      x: 200 + Math.random() * 100,
      y: 200 + Math.random() * 100,
    });
    setIsActive(true);
    setShowExplosion(false);
  };

  return (
    <div className="w-full h-screen bg-gray-900 relative overflow-hidden">
      {/* Target indicator */}
      <div
        className="absolute w-4 h-4 bg-red-500 border-2 border-white rounded-full pointer-events-none z-10"
        style={{
          left: `${(targetPos.x - offset.x) * scale}px`,
          top: `${(targetPos.y - offset.y) * scale}px`,
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* Rocket Strike */}
      <RocketStrike
        targetX={targetPos.x}
        targetY={targetPos.y}
        scale={scale}
        offset={offset}
        isActive={isActive}
        onComplete={handleRocketComplete}
      />

      {/* Explosion effect placeholder */}
      {showExplosion && (
        <div
          className="absolute w-16 h-16 bg-yellow-400 rounded-full pointer-events-none animate-ping"
          style={{
            left: `${(targetPos.x - offset.x) * scale}px`,
            top: `${(targetPos.y - offset.y) * scale}px`,
            transform: "translate(-50%, -50%)",
          }}
        />
      )}

      <div className="absolute top-4 left-4 z-10 space-y-2">
        <button
          onClick={fireRocket}
          disabled={isActive}
          className={`px-6 py-3 rounded-lg font-bold text-white transition-all ${
            isActive
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {isActive ? "🚀 Flying..." : "🚀 Fire Rocket!"}
        </button>

        <div className="text-white bg-black bg-opacity-50 px-4 py-2 rounded">
          <p>
            🎯 Target: ({Math.round(targetPos.x)}, {Math.round(targetPos.y)})
          </p>
          <p>🚀 Rocket will fly from random edge to target</p>
        </div>
      </div>
    </div>
  );
}
