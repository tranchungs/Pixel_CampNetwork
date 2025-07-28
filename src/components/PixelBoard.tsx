"use client";

import { useRef, useEffect, useState } from "react";
import { useStateTogether } from "react-together";
import { CampModal } from "@campnetwork/origin/react";
import { encodeFunctionData, parseAbi, parseEther } from "viem";
import { myCustomChain } from "./MyCustomChain";
import TransactionToast from "./TransactionToast";
import { createPublicClient, http } from "viem";
import { useAuth, useConnect, useAuthState } from "@campnetwork/origin/react";
import BombTargetHighlight from "./BombTargetHighlight";
import BoomEffect from "./BoomEffect";
import RocketStrike from "./RocketEffect";
import WeaponShop, { WeaponType, WeaponItem } from "./WeaponShop";
import { getPinataService } from "./pinataService";
import SimpleNFTSuccessModal, {
  useSimpleNFTModal,
} from "./SimpleNFTSuccessModal";
import NFTModal from "./NFTModal";

// Internal BoomEffect Component
const CANVAS_SIZE = 500;
const INITIAL_SCALE = 16;
const MIN_SCALE = 3;
const DEFAULT_CANVAS_WIDTH = 375; // Default mobile width
const DEFAULT_CANVAS_HEIGHT = 600; // Default mobile height

const COLORS = [
  // Màu gốc
  "#E46E6E", // Đỏ nhạt
  "#FFD635", // Vàng
  "#7EED56", // Xanh lá nhạt
  "#00CCC0", // Xanh ngọc
  "#51E9F4", // Xanh da trời nhạt
  "#94B3FF", // Xanh tím nhạt
  "#E4ABFF", // Tím nhạt
  "#FF99AA", // Hồng nhạt
  "#FFB470", // Cam nhạt
  "#FFFFFF", // Trắng
  "#BE0039", // Đỏ đậm
  "#FF9600", // Cam
  "#00CC78", // Xanh lá
  "#009EAA", // Xanh ngọc đậm
  "#3690EA", // Xanh da trời
  "#6A5CFF", // Xanh tím
  "#B44AC0", // Tím
  "#FF3881", // Hồng đậm
  "#9C6926", // Nâu vàng
  "#898D90", // Xám
  "#6D001A", // Đỏ rượu
  "#BF4300", // Cam đậm
  "#00A368", // Xanh lá đậm
  "#00756F", // Xanh rêu
  "#2450A4", // Xanh navy
  "#493AC1", // Tím đậm
  "#811E9F", // Tím violet
  "#A00357", // Hồng đậm
  "#6D482F", // Nâu
  "#000000", // Đen

  // Thêm màu mới
  "#FF6B6B", // Đỏ coral
  "#4ECDC4", // Xanh mint
  "#45B7D1", // Xanh dương nhạt
  "#96CEB4", // Xanh lá pastel
  "#FFEAA7", // Vàng kem
  "#DDA0DD", // Tím plum
  "#98D8C8", // Xanh ngọc nhạt
  "#F7DC6F", // Vàng nhạt
  "#BB8FCE", // Tím lavender
  "#85C1E9", // Xanh sky
  "#F8C471", // Cam vàng
  "#82E0AA", // Xanh lá mint
  "#F1948A", // Hồng salmon
  "#85929E", // Xám xanh
  "#D2B4DE", // Tím nhạt pastel
  "#AED6F1", // Xanh baby
  "#A9DFBF", // Xanh lá nhạt pastel
  "#F9E79F", // Vàng pastel
  "#D7BDE2", // Tím lilac
  "#A3E4D7", // Xanh ngọc pastel
  "#FAD7A0", // Cam peach
  "#ABEBC6", // Xanh lá sea foam
  "#F5B7B1", // Hồng pastel
  "#BFC9CA", // Xám nhạt
  "#E8DAEF", // Tím rất nhạt
  "#D6EAF8", // Xanh ice
  "#D1F2EB", // Xanh mint rất nhạt
  "#FCF3CF", // Vàng cream
  "#FADBD8", // Hồng rất nhạt
  "#EAEDED", // Xám rất nhạt

  // Màu gradient và tone đặc biệt
  "#FF7675", // Đỏ french
  "#74B9FF", // Xanh french
  "#FD79A8", // Hồng french
  "#FDCB6E", // Vàng french
  "#6C5CE7", // Tím french
  "#00B894", // Xanh lá french
  "#E17055", // Cam đất
  "#A29BFE", // Tím periwinkle
  "#FD83A8", // Hồng watermelon
  "#55A3FF", // Xanh dodger
  "#26D0CE", // Xanh turquoise
  "#FEA47F", // Cam peach
  "#B8860B", // Vàng darkgoldenrod
  "#32CD32", // Xanh lime
  "#FF1493", // Hồng deep pink
  "#00BFFF", // Xanh deep sky
  "#FF4500", // Cam red orange
  "#9370DB", // Tím medium purple
  "#20B2AA", // Xanh light sea green
  "#DC143C", // Đỏ crimson
];
const CONTRACT_ADDRESS = process.env
  .NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
const CONTRACT_ABI = parseAbi([
  "event AreaBombed(address indexed user, uint256 x, uint256 y, uint256 radius)",
  "event RocketFired(address indexed user, uint256 x, uint256 y, uint256 radius)",
  "function bombs(address user) external view returns (uint256)",
  "function rockets(address user) external view returns (uint256)",
  "function bombPrice() external view returns (uint256)", // Keep old function
  "function rocketPrice() external view returns (uint256)", // Keep old function
  "function buyBomb() external payable",
  "function bombArea(uint256 centerX, uint256 centerY, uint256 radius) external",
  "function placePixel(uint256 x, uint256 y, string color) external",
  "function mintNFT(string memory tokenURI) external returns (uint256)",
  "event NFTMinted(address indexed to, uint256 tokenId, string tokenURI)",
  "function fireRocket(uint256 centerX, uint256 centerY, uint256 radius) external",
  "function buyBomb() external payable",
  "function buyRocket() external payable",
  "function claimDaily() external payable",
  "function canClaimToday(address user) external view returns (bool)",
  "function dailyClaimFee() external view returns (uint256)",
]);

export default function PixelBoard() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const highlightCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [pixelUpdates, setPixelUpdates] = useStateTogether<
    Record<string, string>
  >("pixelUpdates", {});
  const [selectedColor, setSelectedColor] = useStateTogether(
    "selectedColor",
    "#FFD635"
  );
  const { origin, jwt, viem, walletAddress } = useAuth();
  const auth = useAuth();
  const { authenticated, loading } = useAuthState();
  const { connect } = useConnect();
  // 🔧 FIX: Canvas size state instead of direct window access
  const [canvasSize, setCanvasSize] = useState({
    width: DEFAULT_CANVAS_WIDTH,
    height: DEFAULT_CANVAS_HEIGHT,
  });
  const [isMounted, setIsMounted] = useState(false);

  const client = createPublicClient({
    chain: myCustomChain,
    transport: http(),
  });
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [isOnchain, setIsOnchain] = useState(true);
  const [scale, setScale] = useState(INITIAL_SCALE);
  const [offset, setOffset] = useState<{ x: number; y: number }>({
    x: 200,
    y: 200,
  });
  const [hoverPixel, setHoverPixel] = useState<{ x: number; y: number } | null>(
    null
  );
  const [selectedPixel, setSelectedPixel] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [booms, setBooms] = useState<
    { x: number; y: number; radius: number; id: number }[]
  >([]);
  const [overlayImg, setOverlayImg] = useState<HTMLImageElement | null>(null);
  const [overlayOpacity, setOverlayOpacity] = useState(0.4);
  const [overlayOffset, setOverlayOffset] = useState({ x: 5, y: 5 });
  const [overlayLocked, setOverlayLocked] = useState(false);
  const [userBombs, setUserBombs] = useState(0);
  const [userRockets, setUserRockets] = useState(0);

  const [showColorPalette, setShowColorPalette] = useState(false);

  // NFT States
  const [isSelectingNFTArea, setIsSelectingNFTArea] = useState(false);
  const [nftSelectionStart, setNftSelectionStart] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [nftSelectionEnd, setNftSelectionEnd] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [selectedNFTArea, setSelectedNFTArea] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [nftImage, setNftImage] = useState<string | null>(null);

  // Bomb targeting
  const [targetHighlights, setTargetHighlights] = useState<
    Array<{ x: number; y: number; radius: number; id: number }>
  >([]);

  // Dragging states
  const dragging = useRef(false);
  const draggingOverlay = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const touchStartTime = useRef(0);
  const hasMoved = useRef(false);

  // Interaction disabled check
  const isInteractionDisabled =
    targetHighlights.length > 0 || isSelectingNFTArea;
  //ROCKET
  const [isActive, setIsActive] = useState(false);
  const [targetPos, setTargetPos] = useState({ x: 250, y: 250 });
  const [scaleRocket] = useState(16);
  const [offsetRocket] = useState({ x: 200, y: 200 });
  const [showExplosion, setShowExplosion] = useState(false);
  //SHOP
  const [showWeaponShop, setShowWeaponShop] = useState(false);
  const [currentWeaponItem, setCurrentWeaponItem] = useState<WeaponItem | null>(
    null
  );
  //DaiLy
  const [isClaimingDaily, setIsClaimingDaily] = useState(false);
  const [canClaimDaily, setCanClaimDaily] = useState(false);
  const pinata = getPinataService();
  //NFT
  const {
    isVisible,
    transactionHash, // ✅ Lấy từ hook
    nftImage: modalNftImage,
    coordinates,
    size,
    showSuccess,
    hideSuccess,
  } = useSimpleNFTModal();
  // 🔧 FIX: Handle canvas sizing after component mounts
  useEffect(() => {
    setIsMounted(true);

    const updateCanvasSize = () => {
      if (typeof window !== "undefined") {
        setCanvasSize({
          width: window.innerWidth,
          height: window.innerHeight - 140, // Header + Bottom bar
        });
      }
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, []);
  useEffect(() => {
    // Auto-reconnect khi component mount
    if (!authenticated && !loading) {
      auth
        .recoverProvider()
        .then(() => {
          if (auth.isAuthenticated) {
            console.log("✅ Wallet reconnected automatically!");
          }
        })
        .catch(() => {
          console.log("ℹ️ No previous session - manual connect required");
        });
    }
  }, []);
  // Use canvas size from state
  const canvasWidth = canvasSize.width;
  const canvasHeight = canvasSize.height;

  const getColor = (x: number, y: number): string => {
    const key = `${x},${y}`;
    return pixelUpdates[key] || "#111";
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    const startX = Math.max(0, Math.floor(offset.x));
    const startY = Math.max(0, Math.floor(offset.y));
    const endX = Math.min(
      CANVAS_SIZE,
      Math.ceil(offset.x + canvasWidth / scale)
    );
    const endY = Math.min(
      CANVAS_SIZE,
      Math.ceil(offset.y + canvasHeight / scale)
    );

    // Draw pixels
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const cx = Math.floor((x - offset.x) * scale);
        const cy = Math.floor((y - offset.y) * scale);

        ctx.fillStyle = getColor(x, y);
        ctx.fillRect(cx, cy, scale, scale);

        if (scale >= 8) {
          ctx.strokeStyle = "rgba(255,255,255,0.1)";
          ctx.lineWidth = 1;
          ctx.strokeRect(cx + 0.5, cy + 0.5, scale - 1, scale - 1);
        }
      }
    }

    // Draw overlay image
    if (overlayImg) {
      ctx.globalAlpha = overlayOpacity;
      ctx.drawImage(
        overlayImg,
        (overlayOffset.x - offset.x) * scale,
        (overlayOffset.y - offset.y) * scale,
        25 * scale,
        25 * scale
      );
      ctx.globalAlpha = 1;
    }

    // Draw NFT selection area while selecting
    if (isSelectingNFTArea && nftSelectionStart && nftSelectionEnd) {
      const minX = Math.min(nftSelectionStart.x, nftSelectionEnd.x);
      const minY = Math.min(nftSelectionStart.y, nftSelectionEnd.y);
      const maxX = Math.max(nftSelectionStart.x, nftSelectionEnd.x);
      const maxY = Math.max(nftSelectionStart.y, nftSelectionEnd.y);

      const screenX = (minX - offset.x) * scale;
      const screenY = (minY - offset.y) * scale;
      const screenWidth = (maxX - minX + 1) * scale;
      const screenHeight = (maxY - minY + 1) * scale;

      // Draw semi-transparent yellow background
      ctx.fillStyle = "rgba(255, 214, 53, 0.3)";
      ctx.fillRect(screenX, screenY, screenWidth, screenHeight);

      // Draw thick yellow border
      ctx.strokeStyle = "#FFD635";
      ctx.lineWidth = 3;
      ctx.strokeRect(screenX, screenY, screenWidth, screenHeight);

      // Show selection size
      ctx.fillStyle = "#FFD635";
      ctx.font = "12px Arial";
      const width = maxX - minX + 1;
      const height = maxY - minY + 1;
      ctx.fillText(`${width}×${height}`, screenX, screenY - 5);
    }

    // Draw confirmed NFT area
    if (selectedNFTArea && !isSelectingNFTArea) {
      const screenX = (selectedNFTArea.x - offset.x) * scale;
      const screenY = (selectedNFTArea.y - offset.y) * scale;
      const screenWidth = selectedNFTArea.width * scale;
      const screenHeight = selectedNFTArea.height * scale;

      // Draw yellow border
      ctx.strokeStyle = "#FFD635";
      ctx.lineWidth = 2;
      ctx.strokeRect(screenX, screenY, screenWidth, screenHeight);

      // Draw corner indicators
      const cornerSize = 6;
      ctx.fillStyle = "#FFD635";

      // Four corners
      ctx.fillRect(
        screenX - cornerSize / 2,
        screenY - cornerSize / 2,
        cornerSize,
        cornerSize
      );
      ctx.fillRect(
        screenX + screenWidth - cornerSize / 2,
        screenY - cornerSize / 2,
        cornerSize,
        cornerSize
      );
      ctx.fillRect(
        screenX - cornerSize / 2,
        screenY + screenHeight - cornerSize / 2,
        cornerSize,
        cornerSize
      );
      ctx.fillRect(
        screenX + screenWidth - cornerSize / 2,
        screenY + screenHeight - cornerSize / 2,
        cornerSize,
        cornerSize
      );

      // NFT label
      ctx.fillStyle = "#FFD635";
      ctx.font = "10px Arial";
      ctx.fillText("NFT AREA", screenX, screenY - 5);
    }

    // Draw selected pixel highlight
    if (selectedPixel && scale >= 4 && !isSelectingNFTArea) {
      const { x, y } = selectedPixel;
      const sx = (x - offset.x) * scale;
      const sy = (y - offset.y) * scale;

      // Blue highlight border
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 2;
      ctx.strokeRect(sx, sy, scale, scale);

      // Inner highlight
      ctx.strokeStyle = "#60a5fa";
      ctx.lineWidth = 1;
      ctx.strokeRect(sx + 1, sy + 1, scale - 2, scale - 2);
    }

    // Draw hover pixel (only when not selecting NFT and not targeting bomb)
    if (
      hoverPixel &&
      scale >= 2 &&
      !isSelectingNFTArea &&
      targetHighlights.length === 0
    ) {
      const { x, y } = hoverPixel;
      const hx = (x - offset.x) * scale;
      const hy = (y - offset.y) * scale;

      // Color preview
      ctx.fillStyle = selectedColor;
      ctx.globalAlpha = 0.6;
      ctx.fillRect(hx, hy, scale, scale);
      ctx.globalAlpha = 1;

      ctx.strokeStyle = "white";
      ctx.lineWidth = 1;
      ctx.strokeRect(hx + 0.5, hy + 0.5, scale - 1, scale - 1);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isMounted) return; // 🔧 FIX: Only draw after mounted
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    draw(ctx);
  }, [
    isMounted, // 🔧 FIX: Add isMounted dependency
    scale,
    offset.x,
    offset.y,
    hoverPixel?.x,
    hoverPixel?.y,
    selectedPixel?.x,
    selectedPixel?.y,
    pixelUpdates,
    overlayImg,
    overlayOpacity,
    overlayOffset,
    isSelectingNFTArea,
    nftSelectionStart,
    nftSelectionEnd,
    selectedNFTArea,
    targetHighlights.length,
    selectedColor,
    canvasWidth,
    canvasHeight,
  ]);

  // Load bomb count
  const loadBombCount = async () => {
    if (!origin || !viem) {
      return;
    }
    try {
      const bombCount = await client.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "bombs",
        args: [walletAddress as `0x${string}`],
      });

      setUserBombs(Number(bombCount));
    } catch (error) {
      console.error("Failed to load bomb count:", error);
    }
  };
  const loadRocketCount = async () => {
    if (!origin || !viem) {
      return;
    }
    try {
      const rocketCount = await client.readContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "rockets",
        args: [walletAddress as `0x${string}`],
      });

      setUserRockets(Number(rocketCount));
    } catch (error) {
      console.error("Failed to load bomb count:", error);
    }
  };
  const handleReloadAsset = async () => {
    loadBombCount();
    loadRocketCount();
  };

  useEffect(() => {
    loadBombCount();
    loadRocketCount();
  }, [viem]);

  // Event listener for bombs
  useEffect(() => {
    if (!viem || !client || !CONTRACT_ADDRESS) return;

    const unwatchBombs = client.watchContractEvent({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      eventName: "AreaBombed",
      onLogs: (logs) => {
        for (const log of logs) {
          const { x, y, radius } = log.args;
          const isMyBomb = log.args?.user === walletAddress;
          if (!isMyBomb) {
            setBooms((prev) => [
              ...prev,
              {
                x: Number(x),
                y: Number(y),
                radius: Number(radius),
                id: Date.now(),
              },
            ]);
          }

          // Update pixels
          const updates: Record<string, string> = {};
          const centerX = Number(x);
          const centerY = Number(y);
          const bombRadius = Number(radius);

          for (let dx = -bombRadius; dx <= bombRadius; dx++) {
            for (let dy = -bombRadius; dy <= bombRadius; dy++) {
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist <= bombRadius) {
                const px = centerX + dx;
                const py = centerY + dy;
                const key = `${px},${py}`;
                updates[key] = "#111";
              }
            }
          }
          setPixelUpdates((prev) => ({ ...prev, ...updates }));
        }
      },
      onError: (logs) => {},
    });
    const unwatchRockets = client.watchContractEvent({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: CONTRACT_ABI,
      eventName: "RocketFired",
      onLogs: (logs) => {
        for (const log of logs) {
          const { x, y, radius } = log.args;
          const isMyRocket = log.args?.user === walletAddress;
          if (!isMyRocket) {
            setIsActive(true);
            setTargetPos({ x: Number(x), y: Number(y) });
          }
        }
      },
      onError: (log) => {},
    });
    return () => {
      unwatchBombs();
      unwatchRockets();
    };
  }, [viem]);
  //DAiLY
  const checkCanClaimDaily = async () => {
    if (!viem || !client || !CONTRACT_ADDRESS || !walletAddress) {
      setCanClaimDaily(false);
      return;
    }

    try {
      const canClaim = await client.readContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: "canClaimToday",
        args: [walletAddress as `0x${string}`],
      });
      setCanClaimDaily(Boolean(canClaim));
    } catch (error) {
      console.error("Failed to check daily claim:", error);
      setCanClaimDaily(false);
    }
  };
  useEffect(() => {
    checkCanClaimDaily();
  }, [viem, walletAddress, CONTRACT_ADDRESS]);
  const handleClaimDaily = async () => {
    if (!viem || !origin) {
      setToast({ message: "No wallet connected!", type: "error" });
      return;
    }

    setIsClaimingDaily(true);
    try {
      const FeeClaim = await client.readContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: "dailyClaimFee",
        args: [],
      });
      const data = encodeFunctionData({
        abi: CONTRACT_ABI,
        functionName: "claimDaily",
        args: [],
      });
      const walletClient = viem.walletClient || viem;
      const hash = await walletClient.sendTransaction({
        to: CONTRACT_ADDRESS,
        data: data,
        value: FeeClaim,
      });
      const receipt = await client.waitForTransactionReceipt({
        hash,
        timeout: 60000, // 60 seconds timeout
      });
      if (receipt.status === "success") {
        setToast({
          message: "🎁 Daily rewards claimed!",
          type: "success",
        });
      } else {
        setToast({ message: "Daily claim failed!", type: "error" });
      }
    } catch (error) {
      setToast({ message: "Daily claim failed!", type: "error" });
    } finally {
      setIsClaimingDaily(false);
    }
  };
  // FIXED: More precise pixel detection
  const getEventPos = (e: React.TouchEvent | React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;

    let clientX, clientY;
    if ("touches" in e) {
      if (e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if (e.changedTouches.length > 0) {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
      } else return null;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Get precise canvas position
    const canvasX = clientX - rect.left;
    const canvasY = clientY - rect.top;

    // Convert to world coordinates with proper rounding
    const worldX = Math.floor((canvasX + scale / 2) / scale + offset.x);
    const worldY = Math.round((canvasY + scale / 2) / scale + offset.y);

    // Bounds check
    if (
      worldX < 0 ||
      worldX >= CANVAS_SIZE ||
      worldY < 0 ||
      worldY >= CANVAS_SIZE
    ) {
      return null;
    }

    return { x: worldX, y: worldY, clientX, clientY };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    // Fix passive event listener warning

    e.stopPropagation();

    touchStartTime.current = Date.now();
    hasMoved.current = false;

    const pos = getEventPos(e);
    if (!pos) return;

    setHoverPixel({ x: pos.x, y: pos.y });

    // Check overlay dragging
    if (
      overlayImg &&
      !overlayLocked &&
      pos.x >= overlayOffset.x &&
      pos.x < overlayOffset.x + 25 &&
      pos.y >= overlayOffset.y &&
      pos.y < overlayOffset.y + 25 &&
      !isInteractionDisabled
    ) {
      draggingOverlay.current = true;
      lastMouse.current = { x: pos.clientX, y: pos.clientY };
      return;
    }

    // NFT selection
    if (
      isSelectingNFTArea &&
      pos.x >= 0 &&
      pos.x < CANVAS_SIZE &&
      pos.y >= 0 &&
      pos.y < CANVAS_SIZE
    ) {
      if (!nftSelectionStart) {
        setNftSelectionStart({ x: pos.x, y: pos.y });
        setNftSelectionEnd({ x: pos.x, y: pos.y });
      }
      return;
    }

    if (!isInteractionDisabled) {
      dragging.current = true;
      lastMouse.current = { x: pos.clientX, y: pos.clientY };
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    hasMoved.current = true;

    const pos = getEventPos(e);
    if (!pos) return;

    setHoverPixel({ x: pos.x, y: pos.y });

    // Update NFT selection end point while selecting
    if (isSelectingNFTArea && nftSelectionStart) {
      setNftSelectionEnd({ x: pos.x, y: pos.y });
    }

    // Handle overlay dragging
    if (
      draggingOverlay.current &&
      overlayImg &&
      !isInteractionDisabled &&
      !overlayLocked
    ) {
      const dx = (pos.clientX - lastMouse.current.x) / scale;
      const dy = (pos.clientY - lastMouse.current.y) / scale;
      setOverlayOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      lastMouse.current = { x: pos.clientX, y: pos.clientY };
      return;
    }

    // Handle canvas dragging
    if (dragging.current && !isInteractionDisabled) {
      const dx = (lastMouse.current.x - pos.clientX) / scale;
      const dy = (lastMouse.current.y - pos.clientY) / scale;

      const newOffsetX = Math.max(
        0,
        Math.min(CANVAS_SIZE - canvasWidth / scale, offset.x + dx)
      );
      const newOffsetY = Math.max(
        0,
        Math.min(CANVAS_SIZE - canvasHeight / scale, offset.y + dy)
      );

      setOffset({ x: newOffsetX, y: newOffsetY });
      lastMouse.current = { x: pos.clientX, y: pos.clientY };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragging.current = false;
    draggingOverlay.current = false;

    const touchDuration = Date.now() - touchStartTime.current;

    // NFT selection logic - works for both tap and drag
    if (isSelectingNFTArea && nftSelectionStart) {
      const pos = getEventPos(e);
      if (pos) {
        const endPos = nftSelectionEnd || pos; // Use current pos if no end set
        const startX = Math.min(nftSelectionStart.x, endPos.x);
        const startY = Math.min(nftSelectionStart.y, endPos.y);
        const width = Math.abs(endPos.x - nftSelectionStart.x) + 1;
        const height = Math.abs(endPos.y - nftSelectionStart.y) + 1;

        // Complete NFT selection immediately
        setSelectedNFTArea({ x: startX, y: startY, width, height });
        setIsSelectingNFTArea(false);
        setNftSelectionStart(null);
        setNftSelectionEnd(null);

        // Generate image and show preview immediately
        setTimeout(() => {
          generateNFTImage(startX, startY, width, height);
        }, 50); // Small delay to ensure state is updated

        setToast({
          message: `NFT area selected: ${width}×${height}`,
          type: "success",
        });
        setHoverPixel(null);
        return;
      }
    }

    // Regular pixel selection for short taps
    if (touchDuration < 300 && !hasMoved.current) {
      const pos = getEventPos(e);
      if (pos && targetHighlights.length === 0 && !isSelectingNFTArea) {
        setSelectedPixel({ x: pos.x, y: pos.y });
        setHoverPixel(null);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const pos = getEventPos(e);
    if (!pos) {
      setHoverPixel(null);
      return;
    }

    setHoverPixel({ x: pos.x, y: pos.y });

    // Update NFT selection end point while dragging
    if (isSelectingNFTArea && nftSelectionStart) {
      setNftSelectionEnd({ x: pos.x, y: pos.y });
    }

    // Canvas dragging
    if (dragging.current && !isInteractionDisabled) {
      const dx = (lastMouse.current.x - e.clientX) / scale;
      const dy = (lastMouse.current.y - e.clientY) / scale;
      const newOffsetX = Math.max(
        0,
        Math.min(CANVAS_SIZE - canvasWidth / scale, offset.x + dx)
      );
      const newOffsetY = Math.max(
        0,
        Math.min(CANVAS_SIZE - canvasHeight / scale, offset.y + dy)
      );
      setOffset({ x: newOffsetX, y: newOffsetY });
      lastMouse.current = { x: e.clientX, y: e.clientY };
    } else if (
      draggingOverlay.current &&
      overlayImg &&
      !isInteractionDisabled &&
      !overlayLocked
    ) {
      const dx = (e.clientX - lastMouse.current.x) / scale;
      const dy = (e.clientY - lastMouse.current.y) / scale;
      setOverlayOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      lastMouse.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (targetHighlights.length > 0) return;

    const pos = getEventPos(e);
    if (!pos) return;

    if (isSelectingNFTArea) {
      setNftSelectionStart({ x: pos.x, y: pos.y });
      setNftSelectionEnd({ x: pos.x, y: pos.y });
      return;
    }

    if (overlayImg && !overlayLocked) {
      const withinOverlay =
        pos.x >= overlayOffset.x &&
        pos.x < overlayOffset.x + 25 &&
        pos.y >= overlayOffset.y &&
        pos.y < overlayOffset.y + 25;
      if (withinOverlay) {
        draggingOverlay.current = true;
        lastMouse.current = { x: e.clientX, y: e.clientY };
        return;
      }
    }

    if (!isSelectingNFTArea) {
      dragging.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => {
    // NFT selection completion for mouse
    if (isSelectingNFTArea && nftSelectionStart && nftSelectionEnd) {
      const startX = Math.min(nftSelectionStart.x, nftSelectionEnd.x);
      const startY = Math.min(nftSelectionStart.y, nftSelectionEnd.y);
      const width = Math.abs(nftSelectionEnd.x - nftSelectionStart.x) + 1;
      const height = Math.abs(nftSelectionEnd.y - nftSelectionStart.y) + 1;

      setSelectedNFTArea({ x: startX, y: startY, width, height });
      setIsSelectingNFTArea(false);
      setNftSelectionStart(null);
      setNftSelectionEnd(null);

      // Generate image immediately
      setTimeout(() => {
        generateNFTImage(startX, startY, width, height);
      }, 50);

      return;
    }

    dragging.current = false;
    draggingOverlay.current = false;

    // Regular pixel selection
    if (hoverPixel && !isSelectingNFTArea && targetHighlights.length === 0) {
      setSelectedPixel({ x: hoverPixel.x, y: hoverPixel.y });
    }
  };

  const handleWheel = (e: WheelEvent) => {
    if (isInteractionDisabled) {
      e.preventDefault();
      return;
    }

    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const worldX = mouseX / scale + offset.x;
    const worldY = mouseY / scale + offset.y;

    const delta = e.deltaY > 0 ? -1 : 1;
    const newScale = Math.max(MIN_SCALE, Math.min(40, scale + delta));

    const newOffsetX = Math.max(
      0,
      Math.min(CANVAS_SIZE - canvasWidth / newScale, worldX - mouseX / newScale)
    );
    const newOffsetY = Math.max(
      0,
      Math.min(
        CANVAS_SIZE - canvasHeight / newScale,
        worldY - mouseY / newScale
      )
    );

    setScale(newScale);
    setOffset({ x: newOffsetX, y: newOffsetY });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isMounted) return; // 🔧 FIX: Only add listener after mounted
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, [scale, offset, isInteractionDisabled, isMounted]); // 🔧 FIX: Add isMounted dependency

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Create a 25x25 preview canvas
        const canvas = document.createElement("canvas");
        canvas.width = 25;
        canvas.height = 25;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Draw image scaled to 25x25
        ctx.imageSmoothingEnabled = false; // For pixelated effect
        ctx.drawImage(img, 0, 0, 25, 25);

        // Create the preview image
        const previewImg = new Image();
        previewImg.onload = () => {
          setOverlayImg(previewImg);

          // Set overlay position to hover position if available, otherwise use default
          if (selectedPixel) {
            setOverlayOffset({ x: selectedPixel.x, y: selectedPixel.y });
          } else {
            if (hoverPixel) {
              setOverlayOffset({ x: hoverPixel.x, y: hoverPixel.y }); // Default position
            } else {
              setOverlayOffset({ x: 5, y: 5 }); // Default position
            }
          }
        };
        previewImg.src = canvas.toDataURL();
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);

    // Clear the input so same file can be selected again
    e.target.value = "";
  };

  const handlePaint = async () => {
    if (!selectedPixel) {
      setToast({ message: "Please select a pixel first", type: "error" });
      return;
    }
    if (!viem || !origin) {
      setToast({ message: "No wallet connected!", type: "error" });
      return;
    }
    const key = `${selectedPixel.x},${selectedPixel.y}`;
    if (isOnchain) {
      try {
        setToast({ message: "Wait confirm transaction", type: "success" });
        const data = encodeFunctionData({
          abi: CONTRACT_ABI,
          functionName: "placePixel",
          args: [
            BigInt(selectedPixel.x),
            BigInt(selectedPixel.y),
            selectedColor,
          ],
        });
        const walletClient = viem.walletClient || viem;
        const hash = await walletClient.sendTransaction({
          to: CONTRACT_ADDRESS, // Replace with actual address
          data: data, // Empty data for simple transfer
          value: BigInt(0),
        });
        const receipt = await client.waitForTransactionReceipt({
          hash,
          timeout: 60000, // 60 seconds timeout
        });
        if (receipt.status === "success") {
          setToast({
            message: "Pixel placed successfully!",
            type: "success",
          });
          setPixelUpdates((prev) => ({ ...prev, [key]: selectedColor }));
        } else {
          throw new Error("Transaction reverted");
        }
      } catch (err) {
        setToast({ message: "Transaction failed!", type: "error" });
      }
    } else {
      setPixelUpdates((prev) => ({ ...prev, [key]: selectedColor }));
    }
  };

  const handleBombAction = async () => {
    if (!viem) return;
    const bombCount = (await client?.readContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: CONTRACT_ABI,
      functionName: "bombs",
      args: [walletAddress as `0x${string}`],
    })) as bigint;

    if (bombCount <= 0) {
      // Buy bomb
      if (!origin || !viem) return;
      const price = (await client.readContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: "bombPrice",
      })) as bigint;
      setCurrentWeaponItem({
        type: "bomb",
        name: "Bomb",
        emoji: "💣",
        price: Number(price) / 1e18, // Convert wei to ETH
        description: "Destroys 3x3 area",
      });
      setShowWeaponShop(true);
    } else {
      if (!origin || !selectedPixel) {
        setToast({
          message: "Please select a pixel to throw Boom!",
          type: "error",
        });
        return;
      }

      setToast({
        message: "Wait confirm in wallet!",
        type: "success",
      });
      const targetId = Date.now();
      try {
        setTargetHighlights((prev) => [
          ...prev,
          {
            x: selectedPixel.x,
            y: selectedPixel.y,
            radius: 3,
            id: targetId,
          },
        ]);
        const data = encodeFunctionData({
          abi: CONTRACT_ABI,
          functionName: "bombArea",
          args: [BigInt(selectedPixel.x), BigInt(selectedPixel.y), BigInt(3)],
        });
        const walletClient = viem.walletClient || viem;
        const hash = await walletClient.sendTransaction({
          to: CONTRACT_ADDRESS, // Replace with actual address
          data: data, // Empty data for simple transfer
          value: BigInt(0),
        });
        const receipt = await client.waitForTransactionReceipt({
          hash,
          timeout: 60000, // 60 seconds timeout
        });
        if (receipt.status === "success") {
          setTargetHighlights((prev) => prev.filter((t) => t.id !== targetId));
          setBooms((prev) => [
            ...prev,
            {
              x: selectedPixel.x,
              y: selectedPixel.y,
              radius: 3,
              id: Date.now(),
            },
          ]);

          const shortHash = `${hash.slice(0, 6)}...${hash.slice(-4)}`;
          setToast({ message: `💥 BOOM! ${shortHash}`, type: "success" });

          // Clear pixels immediately
          const updates: Record<string, string> = {};
          for (let dx = -3; dx <= 3; dx++) {
            for (let dy = -3; dy <= 3; dy++) {
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist <= 3) {
                const px = selectedPixel.x + dx;
                const py = selectedPixel.y + dy;
                const key = `${px},${py}`;
                updates[key] = "#111";
              }
            }
          }
          setPixelUpdates((prev) => ({ ...prev, ...updates }));
          setUserBombs(userBombs - 1);
        } else {
          setTargetHighlights((prev) => prev.filter((t) => t.id !== targetId));
          setToast({ message: "Bomb failed hehe!", type: "error" });
        }
      } catch (error) {
        console.log(`${error}`);
        setTargetHighlights((prev) => prev.filter((t) => t.id !== targetId));
        setToast({ message: "Bomb failed!", type: "error" });
      }
    }
  };

  const handleFireRocket = async () => {
    if (!viem || !origin) return;
    const rocketCount = (await client.readContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: CONTRACT_ABI,
      functionName: "rockets",
      args: [walletAddress as `0x${string}`],
    })) as bigint;
    if (rocketCount <= 0) {
      const price = (await client.readContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: "rocketPrice",
      })) as bigint;

      setCurrentWeaponItem({
        type: "rocket",
        name: "rocket",
        emoji: "🚀",
        price: Number(price) / 1e18,
        description: "Destroys 3x3 area",
      });
      setShowWeaponShop(true);
    } else {
      if (!selectedPixel) {
        setToast({
          message: "Please select a pixel to fire rocket!",
          type: "error",
        });
        return;
      }
      setToast({
        message: "Wait confirm in wallet!",
        type: "success",
      });
      const targetId = Date.now();
      try {
        const data = encodeFunctionData({
          abi: CONTRACT_ABI,
          functionName: "fireRocket",
          args: [BigInt(selectedPixel.x), BigInt(selectedPixel.y), BigInt(3)],
        });

        // Set target và kích hoạt rocket
        setTargetPos({ x: selectedPixel.x, y: selectedPixel.y });

        setTargetHighlights((prev) => [
          ...prev,
          {
            x: selectedPixel.x,
            y: selectedPixel.y,
            radius: 3,
            id: targetId,
          },
        ]);
        const walletClient = viem.walletClient || viem;
        const hash = await walletClient.sendTransaction({
          to: CONTRACT_ADDRESS,
          data: data,
          value: BigInt(0),
        });
        const receipt = await client.waitForTransactionReceipt({
          hash,
          timeout: 60000, // 60 seconds timeout
        });
        if (receipt.status === "success") {
          setIsActive(true);
          const shortHash = `${hash.slice(0, 6)}...${hash.slice(-4)}`;
          setToast({ message: `💥 Rocket! ${shortHash}`, type: "success" });

          // Clear pixels immediately
          const updates: Record<string, string> = {};
          for (let dx = -3; dx <= 3; dx++) {
            for (let dy = -3; dy <= 3; dy++) {
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist <= 3) {
                const px = selectedPixel.x + dx;
                const py = selectedPixel.y + dy;
                const key = `${px},${py}`;
                updates[key] = "#111";
              }
            }
          }
          setPixelUpdates((prev) => ({ ...prev, ...updates }));
          setUserRockets(userRockets - 1);
        } else {
          setTargetHighlights((prev) => prev.filter((t) => t.id !== targetId));
          setToast({ message: "Bomb failed!", type: "error" });
        }
      } catch (error) {
        setTargetHighlights((prev) => prev.filter((t) => t.id !== targetId));
        setToast({ message: "Bomb failed!", type: "error" });
      }
    }
  };

  const handleWeaponPurchase = async (
    weaponType: WeaponType,
    quantity: number,
    totalCost: number
  ) => {
    if (!viem) {
      setToast({ message: "Disconnected!", type: "error" });
      return;
    }

    if (weaponType === "bomb") {
      const data = encodeFunctionData({
        abi: CONTRACT_ABI,
        functionName: "buyBomb",
        args: [],
      });
      try {
        const walletClient = viem.walletClient || viem;
        const hash = await walletClient.sendTransaction({
          to: CONTRACT_ADDRESS,
          data: data,
          value: parseEther(`${totalCost}`),
        });
        const receipt = await client.waitForTransactionReceipt({
          hash,
          timeout: 60000, // 60 seconds timeout
        });
        if (receipt.status === "success") {
          const shortHash = `${data.slice(0, 6)}...${data.slice(-4)}`;
          setToast({
            message: `💣 Bomb purchased! ${shortHash} need reload`,
            type: "success",
          });
          setUserBombs(userBombs + quantity);
        } else {
          setToast({ message: "Purchase failed!", type: "error" });
        }
      } catch (error) {
        setToast({ message: "Purchase failed!", type: "error" });
      }
    } else {
      const data = encodeFunctionData({
        abi: CONTRACT_ABI,
        functionName: "buyRocket",
        args: [],
      });
      try {
        const walletClient = viem.walletClient || viem;
        const hash = await walletClient.sendTransaction({
          to: CONTRACT_ADDRESS, // Replace with actual address
          data: data, // Empty data for simple transfer
          value: parseEther(`${totalCost}`),
        });
        const receipt = await client.waitForTransactionReceipt({
          hash,
          timeout: 60000, // 60 seconds timeout
        });
        if (receipt.status === "success") {
          const shortHash = `${hash.slice(0, 6)}...${hash.slice(-4)}`;
          setToast({
            message: `💣 Rocket purchased! ${shortHash} need reload`,
            type: "success",
          });
          setUserRockets(userRockets + quantity);
        } else {
          setToast({ message: "Purchase failed!", type: "error" });
        }
      } catch (error) {
        console.log(error);
        setToast({ message: "Purchase failed!", type: "error" });
      }
    }
  };

  const handleNFTAction = () => {
    if (selectedNFTArea && nftImage) {
      // Mint NFT
      handleMintNFT();
    } else {
      // Start NFT selection mode
      setIsSelectingNFTArea(true);
      setSelectedPixel(null);
      setToast({
        message: "📏 NFT Mode: Select area by touching corners",
        type: "success",
      });
    }
  };

  const generateNFTImage = (
    startX: number,
    startY: number,
    width: number,
    height: number
  ) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pixelSize = 10;
    canvas.width = width * pixelSize;
    canvas.height = height * pixelSize;

    // Fill background first
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw pixels
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const color = getColor(startX + x, startY + y);
        ctx.fillStyle = color;
        ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
      }
    }

    const dataURL = canvas.toDataURL("image/png");

    // Force re-render by updating state
    setNftImage(null);
    setTimeout(() => {
      setNftImage(dataURL);
    }, 10);
  };

  const cancelNFTSelection = () => {
    setIsSelectingNFTArea(false);
    setNftSelectionStart(null);
    setNftSelectionEnd(null);
    setSelectedNFTArea(null);
    setNftImage(null);
  };

  const base64ToFile = async (
    base64: string,
    filename: string
  ): Promise<File> => {
    try {
      const response = await fetch(base64);
      const blob = await response.blob();
      return new File([blob], filename, { type: "image/png" });
    } catch (error) {
      throw new Error(`Failed to convert base64 to file: ${error}`);
    }
  };

  const handleMintNFT = async () => {
    if (!origin || !jwt || !selectedNFTArea || !nftImage) {
      return;
    }
    const licence = {
      price: BigInt(0),
      duration: 2592000,
      royaltyBps: 0,
      paymentToken: "0x0000000000000000000000000000000000000000",
    } as const;
    try {
      const metadata = {
        name: `Pixel Art`,
        description: `Pixel art created on canvas at coordinates (${selectedNFTArea.x}, ${selectedNFTArea.y})`,
        attributes: [
          { trait_type: "Width", value: selectedNFTArea.width },
          { trait_type: "Height", value: selectedNFTArea.height },
          { trait_type: "X Position", value: selectedNFTArea.x },
          { trait_type: "Y Position", value: selectedNFTArea.y },
        ],
      };
      const result = await pinata.uploadCompleteNFT(nftImage, metadata);
      console.log(result);
      setToast({
        message: `✅ NFT prepared! ${selectedNFTArea.width}×${selectedNFTArea.height} pixels ready to mint`,
        type: "success",
      });
      if (result) {
        const data = encodeFunctionData({
          abi: CONTRACT_ABI,
          functionName: "mintNFT",
          args: [result.metadataIPFS],
        });
        const walletClient = viem.walletClient || viem;
        const hash = await walletClient.sendTransaction({
          to: CONTRACT_ADDRESS, // Replace with actual address
          data: data, // Empty data for simple transfer
          value: BigInt(0),
        });
        const receipt = await client.waitForTransactionReceipt({
          hash,
          timeout: 60000, // 60 seconds timeout
        });
        if (receipt.status === "success") {
          showSuccess(
            hash, // transaction hash
            nftImage, // base64 image
            { x: selectedNFTArea.x, y: selectedNFTArea.y }, // optional coords
            { width: selectedNFTArea.width, height: selectedNFTArea.height } // optional size
          );
          cancelNFTSelection();
        } else {
          setToast({ message: "Mint NFT failed!", type: "error" });
        }
      } else {
        setToast({ message: "Upload NFT Fail!", type: "error" });
      }
    } catch (error) {
      console.log(error);
      setToast({ message: "NFT minting failed!", type: "error" });
    }
  };
  const getNFTCountFromContract = async () => {};
  // Clean up effects
  useEffect(() => {
    const timer = setInterval(() => {
      setBooms((prev) => prev.filter((b) => Date.now() - b.id < 800));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // 🔧 FIX: Show loading screen until mounted
  if (!isMounted) {
    return (
      <div className="h-screen bg-slate-900 text-white flex flex-col items-center justify-center">
        <div className="text-2xl font-bold mb-4">🎨 Pixel Board</div>
        <div className="text-gray-400">Loading canvas...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-900 text-white flex flex-col overflow-hidden">
      {/* Header - Fixed to top */}
      <div className="flex justify-between items-center px-4 py-3 bg-slate-800 z-50">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold">Pixel</h1>
          <button
            onClick={() => setIsOnchain(!isOnchain)}
            className={`px-3 py-1 rounded text-sm ${
              isOnchain ? "bg-green-600" : "bg-slate-600"
            }`}
          >
            {isOnchain ? "On" : "Off"}
          </button>
          <button className="text-gray-400 text-lg">⋮</button>
          <a
            href="https://pixel-game-campnetwork.gitbook.io/pixel-game-campnetwork-docs/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors duration-200 border border-blue-500"
            title="View Documentation"
          >
            📚 Docs
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"></path>
            </svg>
          </a>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-3">
            {/* NFT Modal Button */}
            <NFTModal
              contractAddress="0x40C1c12be203d7F439960B8E7D0e56239e46913f"
              walletAddress={walletAddress as `0x${string}`} // Pass wallet address as prop
              buttonText="NFT Collections"
            />

            <button
              onClick={handleClaimDaily}
              disabled={!viem || !canClaimDaily || isClaimingDaily}
              className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1 ${
                canClaimDaily && viem
                  ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                  : "bg-gray-600 text-gray-400 cursor-not-allowed"
              }`}
              title={
                !viem
                  ? "Connect wallet first"
                  : !canClaimDaily
                  ? "Already claimed today"
                  : "Claim Daily Rewards"
              }
            >
              {isClaimingDaily ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <span className="text-lg">{canClaimDaily ? "🎁" : "⏰"}</span>
              )}
              <span className="text-sm font-medium">
                {canClaimDaily ? "Claim" : "Claimed"}
              </span>
            </button>
          </div>
          <CampModal />
        </div>
      </div>

      {/* Canvas Container - Takes remaining space */}
      <div className="flex-1 relative bg-black overflow-hidden">
        <canvas
          ref={canvasRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          className="absolute inset-0 w-full h-full"
          style={{
            touchAction: "none",
            userSelect: "none",
            WebkitUserSelect: "none",
          }}
        />

        {/* Right Side Controls - Add remove overlay button */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          {/* Zoom Controls */}
          <button
            onClick={() => setScale(Math.min(30, scale + 2))}
            className="w-12 h-12 bg-slate-700 hover:bg-slate-600 rounded flex items-center justify-center text-lg font-bold"
            disabled={isInteractionDisabled}
          >
            +
          </button>
          <button
            onClick={() => setScale(Math.max(MIN_SCALE, scale - 2))}
            className="w-12 h-12 bg-slate-700 hover:bg-slate-600 rounded flex items-center justify-center text-lg font-bold"
            disabled={isInteractionDisabled}
          >
            −
          </button>

          {/* Image Upload - Better styling */}
          <label
            htmlFor="upload"
            className="w-12 h-12 bg-slate-700 hover:bg-slate-600 rounded flex items-center justify-center text-lg cursor-pointer overflow-hidden relative border-2 border-slate-600 hover:border-slate-400 transition-colors"
            title="Upload image overlay"
          >
            {overlayImg ? (
              <img
                src={overlayImg.src}
                alt="overlay preview"
                className="w-full h-full object-cover"
                style={{ imageRendering: "pixelated" }}
              />
            ) : (
              <span className="text-gray-300">🖼️</span>
            )}
            {overlayImg && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border border-slate-700 rounded-full"></div>
            )}
            {overlayImg && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation(); // Không trigger upload
                  setOverlayLocked(!overlayLocked);
                }}
                className="absolute top-0 left-0 -translate-x-1 m-1 w-6 h-6 flex items-center justify-center bg-black/60 text-white text-xs rounded-full border border-slate-400 hover:bg-black/80 transition"
                title={overlayLocked ? "Unlock" : "Lock"}
              >
                {overlayLocked ? "🔒" : "🔓"}
              </button>
            )}
          </label>
          <input
            id="upload"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          {/* Overlay Opacity - Show when LOCK loaded */}

          {/* Overlay Opacity - Show when image loaded */}
          {overlayImg && (
            <div className="flex flex-col items-center w-12">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={overlayOpacity}
                onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                className="w-12"
                style={{
                  WebkitAppearance: "none",
                  height: "6px",
                  background: "linear-gradient(to right, #374151, #6b7280)",
                  borderRadius: "4px",
                  outline: "none",
                }}
                disabled={isInteractionDisabled}
              />
              <div className="text-xs text-gray-300 mt-1">
                {Math.round(overlayOpacity * 100)}%
              </div>
            </div>
          )}
          {/* Rocket Button */}
          <button
            onClick={handleFireRocket}
            className="w-12 h-12 bg-slate-700 hover:bg-slate-600 rounded flex items-center justify-center text-lg font-bold relative"
          >
            {isActive ? "🚀" : "🚀"}
            {userRockets > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {userRockets}
              </span>
            )}
          </button>
          {/* Bomb Button */}
          <button
            onClick={handleBombAction}
            className="w-12 h-12 bg-orange-600 hover:bg-orange-700 rounded flex items-center justify-center text-lg relative"
            disabled={targetHighlights.length > 0}
          >
            💣
            {userBombs > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {userBombs}
              </span>
            )}
          </button>

          {/* NFT Button */}
          <button
            onClick={handleNFTAction}
            className={`w-12 h-12 rounded flex items-center justify-center text-lg relative ${
              isSelectingNFTArea
                ? "bg-yellow-600 hover:bg-yellow-700 animate-pulse"
                : selectedNFTArea
                ? "bg-green-600 hover:bg-green-700"
                : "bg-purple-600 hover:bg-purple-700"
            }`}
            disabled={targetHighlights.length > 0}
          >
            {isSelectingNFTArea ? "📏" : selectedNFTArea ? "✅" : "📸"}
            {selectedNFTArea && !isSelectingNFTArea && (
              <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                !
              </span>
            )}
          </button>
        </div>

        {/* FIXED: NFT Preview - Now positioned on the left side for better mobile visibility */}
        {nftImage && selectedNFTArea && !isSelectingNFTArea && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-slate-800 border-2 border-yellow-500 rounded-lg p-3 z-50 shadow-xl max-w-xs">
            <div className="text-xs text-yellow-400 mb-2 text-center font-semibold">
              🎨 NFT Preview
            </div>
            <img
              src={nftImage}
              alt="NFT Preview"
              className="w-32 h-32 object-contain border border-gray-600 rounded mx-auto bg-gray-900"
              style={{ imageRendering: "pixelated" }}
            />
            <div className="text-xs text-gray-400 mt-2 text-center">
              {selectedNFTArea.width}×{selectedNFTArea.height} pixels
            </div>
            <div className="text-xs text-gray-500 text-center">
              Position: ({selectedNFTArea.x}, {selectedNFTArea.y})
            </div>
            <button
              onClick={cancelNFTSelection}
              className="w-full mt-2 px-2 py-1 bg-red-600 rounded text-xs hover:bg-red-700"
            >
              Clear Selection
            </button>
            <button
              onClick={handleMintNFT}
              className="w-full mt-2 px-2 py-1 bg-green-600 rounded text-xs hover:bg-green-700"
            >
              Mint NFT
            </button>
          </div>
        )}

        {/* Effects */}
        {targetHighlights.map((target) => (
          <BombTargetHighlight
            key={target.id}
            x={target.x}
            y={target.y}
            radius={target.radius}
            scale={scale}
            offset={offset}
            isActive={true}
            canvasRef={canvasRef}
            onCancel={() => {
              setTargetHighlights((prev) =>
                prev.filter((t) => t.id !== target.id)
              );
            }}
          />
        ))}

        {booms.map((b) => (
          <BoomEffect
            key={b.id}
            x={b.x}
            y={b.y}
            radius={b.radius}
            scale={scale}
            offset={offset}
          />
        ))}
        <div className="absolute inset-0 pointer-events-none z-100">
          {isActive && targetPos && (
            <RocketStrike
              targetX={targetPos.x}
              targetY={targetPos.y}
              scale={scale}
              offset={offset}
              isActive={true}
              onComplete={() => {
                // Tìm highlight target tương ứng để xóa
                const currentTarget = targetHighlights.find(
                  (t) => t.x === targetPos.x && t.y === targetPos.y
                );

                // Khi rocket đến đích, tạo boom effect
                setBooms((prev) => [
                  ...prev,
                  {
                    x: targetPos.x,
                    y: targetPos.y,
                    radius: 3,
                    id: Date.now(),
                  },
                ]);

                // Xóa highlight
                if (currentTarget) {
                  setTargetHighlights((prev) =>
                    prev.filter((t) => t.id !== currentTarget.id)
                  );
                }

                // Reset rocket state
                setIsActive(false);
                setTargetPos({ x: 0, y: 0 });

                setToast({ message: "💥 Rocket hit target!", type: "success" });
              }}
            />
          )}
        </div>
        {/* Coordinate Display - Only for hover */}
        {hoverPixel && !selectedPixel && (
          <div className="absolute bottom-24 left-4 bg-black bg-opacity-75 px-2 py-1 rounded text-sm">
            {hoverPixel.x}, {hoverPixel.y}
          </div>
        )}

        {/* NFT Selection Status - Mobile Optimized */}
        {isSelectingNFTArea && (
          <div className="absolute top-16 left-4 right-4 bg-yellow-900 border border-yellow-500 rounded p-3 z-30">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-yellow-400 font-semibold">
                  🎨 NFT Selection Mode
                </div>
                {nftSelectionStart && nftSelectionEnd && (
                  <div className="text-xs text-yellow-300 mt-1">
                    Size:{" "}
                    {Math.abs(nftSelectionEnd.x - nftSelectionStart.x) + 1}×
                    {Math.abs(nftSelectionEnd.y - nftSelectionStart.y) + 1}
                  </div>
                )}
              </div>
              <button
                onClick={cancelNFTSelection}
                className="px-3 py-1 bg-red-600 rounded text-sm hover:bg-red-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* NFT Area Selected - Mobile Optimized */}
        {selectedNFTArea && !isSelectingNFTArea && (
          <div className="absolute top-16 left-4 right-4 bg-green-900 border border-green-500 rounded p-3 z-30">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-green-400 font-semibold">
                  ✅ NFT Area Ready
                </div>
                <div className="text-xs text-green-300 mt-1">
                  {selectedNFTArea.width}×{selectedNFTArea.height} pixels at (
                  {selectedNFTArea.x}, {selectedNFTArea.y})
                </div>
              </div>
              <button
                onClick={cancelNFTSelection}
                className="px-3 py-1 bg-gray-600 rounded text-sm hover:bg-gray-700"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Color Palette Overlay */}
      {showColorPalette && (
        <div className="fixed inset-0 bg-[#00000038] flex items-end z-50">
          <div className="w-full bg-slate-800 rounded-t-2xl max-h-96 flex flex-col">
            {/* Header cố định */}
            <div className="flex justify-between items-center p-4 pb-2 border-b border-slate-700 bg-slate-800 rounded-t-2xl">
              <h3 className="text-lg font-semibold text-white">Choose Color</h3>
              <button
                onClick={() => setShowColorPalette(false)}
                className="text-gray-400 text-xl hover:text-white transition-colors p-1"
              >
                ✕
              </button>
            </div>

            {/* Phần scroll được */}
            <div className="flex-1 overflow-y-auto p-4 pt-2">
              <div className="grid grid-cols-8 gap-3">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    className={`w-12 h-12 rounded border-2 transition-all ${
                      selectedColor === color
                        ? "border-white scale-110"
                        : "border-gray-600 hover:border-gray-400"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      setSelectedColor(color);
                      setShowColorPalette(false);
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Controls - Fixed to bottom */}
      <div className="bg-slate-800 border-t border-slate-700 z-50">
        {/* Info Section */}
        <div className="flex items-center justify-between px-4 py-3">
          {/* Color Selector */}
          <button
            onClick={() => setShowColorPalette(true)}
            className="w-12 h-12 rounded border-2 border-slate-600 hover:border-slate-400 transition-colors"
            style={{ backgroundColor: selectedColor }}
            disabled={isInteractionDisabled}
          />

          {/* Status Info */}
          <div className="flex-1 text-center">
            {selectedPixel && (
              <div className="text-xs text-gray-400 mt-1">
                {selectedPixel.x}, {selectedPixel.y}
              </div>
            )}
          </div>

          <div className="w-12 text-right">
            <button
              onClick={handleReloadAsset} // hàm reload bạn tự định nghĩa
              className="w-12 h-12 bg-slate-700 hover:bg-slate-600 rounded flex items-center justify-center text-lg font-bold relative"
              title="Reload"
            >
              🔄
            </button>
          </div>
        </div>

        {/* Paint Button */}
        <button
          onClick={handlePaint}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold flex items-center justify-center gap-2"
          disabled={!selectedPixel}
        >
          <span>🎨</span>
          <span>Paint</span>
        </button>
      </div>

      {/* Hidden Components */}

      {/* Toast */}
      {toast && (
        <TransactionToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      {currentWeaponItem && (
        <WeaponShop
          isVisible={showWeaponShop}
          onClose={() => {
            setShowWeaponShop(false);
            setCurrentWeaponItem(null);
          }}
          onPurchase={handleWeaponPurchase}
          weaponItem={currentWeaponItem}
          isConnected={origin ? true : false}
        />
      )}
      <SimpleNFTSuccessModal
        isVisible={isVisible}
        onClose={hideSuccess}
        transactionHash={transactionHash}
        nftImage={modalNftImage}
        coordinates={coordinates}
        size={size}
      />
    </div>
  );
}
