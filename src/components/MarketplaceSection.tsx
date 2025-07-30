import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import PriceInputModal from "./PriceInputModal";
import HoldersTab from "./HoldersTab";
import ActivityTab from "./ActivityTab";
import {
  CollectionStats,
  SearchNFTsParams,
  SearchNFTsResponse,
} from "@/types/rarible";
import { searchNFTs } from "@/services/raribleApi";
// Use the actual Rarible types instead of custom interface
type OwnershipData = any; // Will use the actual Ownership type from Rarible API

interface CompleteMarketplaceProps {
  contractAddress: string;
  walletAddress?: string;
  className?: string;
}
const RARIBLE_TRANSFER_PROXY = "0x00C74eD067Cea48F1D6F7D00aBABa3C1D5B2598b";
const RARIBLE_EXCHANGE_ADDRESS = "0x61512179f6a16bec0d259d8010cc0485ce363868";
const ERC721_ABI = [
  "function isApprovedForAll(address owner, address operator) view returns (bool)",
  "function setApprovalForAll(address operator, bool approved)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function getApproved(uint256 tokenId) view returns (address)",
];
const CompleteMarketplace: React.FC<CompleteMarketplaceProps> = ({
  contractAddress,
  walletAddress,
  className = "",
}) => {
  const [activeTab, setActiveTab] = useState<
    "items" | "myItems" | "holders" | "activity"
  >("items");
  const [ownerships, setOwnerships] = useState<OwnershipData[]>([]);
  const [stats, setStats] = useState<CollectionStats>({
    floorPrice: "0.001",
    listed: 1,
    totalSupply: 19,
    owners: 6,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Fetch collection data from Rarible.fun API
  const fetchCollectionData = async () => {
    setLoading(true);
    setError(null);

    try {
      const searchParams: SearchNFTsParams = {
        contractAddress,
        sort: "LOW_PRICE_FIRST",
        status: "all",
      };
      const searchResult = await searchNFTs(searchParams);

      if (!searchResult) {
        throw new Error(`HTTP error! status: ${searchResult}`);
      }

      console.log("Rarible.fun API result:", searchResult);

      const itemsArray = searchResult.nfts || [];
      setOwnerships(itemsArray);

      // Calculate stats from nfts array
      const listedItems = itemsArray.filter((item: any) => item.price) || [];
      const uniqueOwners = new Set(
        itemsArray
          .map((item: any) => {
            // Owner format: "ETHEREUM:0x57d680566ff38635929ecb95a551b3a1373f5ccc"
            return item.owner ? item.owner.split(":")[1] : null;
          })
          .filter(Boolean)
      ).size;

      setStats({
        floorPrice:
          listedItems.length > 0
            ? Math.min(
                ...listedItems.map((item: any) => {
                  return item.price?.amount || 0;
                })
              ).toString()
            : "—",
        listed: listedItems.length,
        totalSupply: searchResult.totalNftsCount || itemsArray.length,
        owners: uniqueOwners,
      });
    } catch (err) {
      console.error("Error fetching collection data:", err);
      setError("Failed to load collection data");
    } finally {
      setLoading(false);
    }
  };

  // Buy NFT function - Direct contract interaction
  const buyNFT = async (item: any) => {
    if (!item.price) {
      alert("This NFT is not for sale");
      return;
    }

    if (!walletAddress) {
      alert("Please connect your wallet first");
      return;
    }

    console.log("🛒 Item to buy:", item);
    console.log("💳 Buyer wallet:", walletAddress);

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const buyerAddress = await signer.getAddress();

      const ETH_ASSET_CLASS = "0xaaaebeba";
      const ERC721_ASSET_CLASS = "0x73ad2146";

      // Parse item data
      const nftContract = item.collection.id.split(":")[1];
      const tokenId = item.id.split(":")[2]; // "4"
      const sellerAddress = item.owner.split(":")[1];
      const priceAmount = item.price.amount; // 0.001

      console.log("🎨 NFT Contract:", nftContract);
      console.log("🆔 Token ID:", tokenId);
      console.log("👤 Seller:", sellerAddress);
      console.log("💰 Price:", priceAmount, "ETH");

      const priceInWei = ethers.utils.parseEther(priceAmount.toString());
      const currentTime = Math.floor(Date.now() / 1000);

      // Generate salt cho buy order
      const generateSalt = () => {
        const hexChars = Array.from(Array(64))
          .map(() => Math.floor(16 * Math.random()).toString(16))
          .join("");
        return ethers.BigNumber.from("0x" + hexChars).toString();
      };

      const buyerSalt = generateSalt();

      // Helper to create asset
      const createAsset = (
        assetClass: string,
        tokenAddress: string,
        tokenId: string,
        value: string
      ) => {
        let data;
        if (assetClass === ERC721_ASSET_CLASS) {
          data = ethers.utils.defaultAbiCoder.encode(
            ["address", "uint256"],
            [tokenAddress, tokenId]
          );
        } else if (assetClass === ETH_ASSET_CLASS) {
          data = "0x";
        }
        return {
          assetType: { assetClass: assetClass, data: data },
          value: value,
        };
      };

      // 🔥 Step 1: Get item details and sell order from Rarible API
      console.log("🔍 Fetching item details from Rarible API...");

      let sellOrder, sellSignature;

      try {
        const itemId = encodeURIComponent(item.id); // Encode the ID properly
        const apiResponse = await fetch(
          `https://api.rarible.org/v0.1/items/${itemId}`,
          {
            headers: {
              accept: "*/*",
              "accept-language": "vi-VN,vi;q=0.9",
              "cache-control": "no-cache",
              origin: "https://rarible.fun",
              referer: "https://rarible.fun/",
              "x-api-key": "555bb639-8325-4840-91c0-c25a9c38f366",
            },
          }
        );

        if (!apiResponse.ok) {
          throw new Error(`API Error: ${apiResponse.status}`);
        }

        const itemData = await apiResponse.json();
        console.log("📋 Item data from API:", itemData);

        if (!itemData.bestSellOrder) {
          throw new Error("No sell order found for this NFT");
        }

        const bestOrder = itemData.bestSellOrder;
        console.log("💰 Best sell order:", bestOrder);

        // Convert API format to contract format
        sellOrder = {
          maker: bestOrder.maker.split(":")[1], // Remove "ETHEREUM:" prefix
          makeAsset: {
            assetType: {
              assetClass: "0x73ad2146", // ERC721
              data: ethers.utils.defaultAbiCoder.encode(
                ["address", "uint256"],
                [nftContract, tokenId]
              ),
            },
            value: "1",
          },
          taker: "0x0000000000000000000000000000000000000000",
          takeAsset: {
            assetType: {
              assetClass: "0xaaaebeba", // ETH
              data: "0x",
            },
            value: ethers.utils.parseEther(bestOrder.take.value).toString(), // Convert to wei
          },
          salt: bestOrder.salt, // Already in hex format
          start: "0",
          end: Math.floor(
            new Date(bestOrder.endedAt).getTime() / 1000
          ).toString(),
          dataType: "0x4ade54ca", // Rarible V2
          data: "0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        };

        sellSignature = bestOrder.signature;

        console.log("✅ Converted sell order:", sellOrder);
        console.log("🔐 Sell signature:", sellSignature);

        // Verify price matches
        const apiPrice = parseFloat(bestOrder.take.value);
        if (Math.abs(apiPrice - priceAmount) > 0.0001) {
          console.warn(
            `⚠️ Price mismatch: API=${apiPrice}, Item=${priceAmount}`
          );
        }
      } catch (apiError) {
        console.error("❌ API Error:", apiError);
        alert(
          "Could not fetch sell order for this NFT. Please try again later."
        );
        return { success: false, error: "Sell order not found" };
      }

      // 🔥 Step 2: Create buy order (orderLeft)
      const exactData =
        "0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

      const buyOrder = {
        maker: buyerAddress,
        makeAsset: {
          assetType: {
            assetClass: "0xaaaebeba", // ETH
            data: "0x",
          },
          value: priceInWei.toString(),
        },
        taker: "0x0000000000000000000000000000000000000000",
        takeAsset: {
          assetType: {
            assetClass: "0x73ad2146", // ERC721
            data: ethers.utils.defaultAbiCoder.encode(
              ["address", "uint256"],
              [nftContract, tokenId]
            ),
          },
          value: "1",
        },
        salt: buyerSalt,
        start: "0",
        end: (currentTime + 3600).toString(), // Valid for 1 hour
        dataType: "0x4ade54ca", // Same as sell order
        data: exactData,
      };

      // 🔥 Step 3: Sign buy order
      const domain = {
        name: "Exchange",
        version: "2",
        chainId: 123420001114,
        verifyingContract: RARIBLE_EXCHANGE_ADDRESS,
      };

      const types = {
        AssetType: [
          { name: "assetClass", type: "bytes4" },
          { name: "data", type: "bytes" },
        ],
        Asset: [
          { name: "assetType", type: "AssetType" },
          { name: "value", type: "uint256" },
        ],
        Order: [
          { name: "maker", type: "address" },
          { name: "makeAsset", type: "Asset" },
          { name: "taker", type: "address" },
          { name: "takeAsset", type: "Asset" },
          { name: "salt", type: "uint256" },
          { name: "start", type: "uint256" },
          { name: "end", type: "uint256" },
          { name: "dataType", type: "bytes4" },
          { name: "data", type: "bytes" },
        ],
      };

      console.log("🔐 Signing buy order...");
      const buySignature = await signer._signTypedData(domain, types, buyOrder);
      console.log("✅ Buy signature:", buySignature);

      // 🔥 Step 4: Execute matchOrders
      const MATCH_ORDERS_ABI = [
        {
          inputs: [
            {
              name: "orderLeft",
              type: "tuple",
              components: [
                { name: "maker", type: "address" },
                {
                  name: "makeAsset",
                  type: "tuple",
                  components: [
                    {
                      name: "assetType",
                      type: "tuple",
                      components: [
                        { name: "assetClass", type: "bytes4" },
                        { name: "data", type: "bytes" },
                      ],
                    },
                    { name: "value", type: "uint256" },
                  ],
                },
                { name: "taker", type: "address" },
                {
                  name: "takeAsset",
                  type: "tuple",
                  components: [
                    {
                      name: "assetType",
                      type: "tuple",
                      components: [
                        { name: "assetClass", type: "bytes4" },
                        { name: "data", type: "bytes" },
                      ],
                    },
                    { name: "value", type: "uint256" },
                  ],
                },
                { name: "salt", type: "uint256" },
                { name: "start", type: "uint256" },
                { name: "end", type: "uint256" },
                { name: "dataType", type: "bytes4" },
                { name: "data", type: "bytes" },
              ],
            },
            { name: "signatureLeft", type: "bytes" },
            {
              name: "orderRight",
              type: "tuple",
              components: [
                { name: "maker", type: "address" },
                {
                  name: "makeAsset",
                  type: "tuple",
                  components: [
                    {
                      name: "assetType",
                      type: "tuple",
                      components: [
                        { name: "assetClass", type: "bytes4" },
                        { name: "data", type: "bytes" },
                      ],
                    },
                    { name: "value", type: "uint256" },
                  ],
                },
                { name: "taker", type: "address" },
                {
                  name: "takeAsset",
                  type: "tuple",
                  components: [
                    {
                      name: "assetType",
                      type: "tuple",
                      components: [
                        { name: "assetClass", type: "bytes4" },
                        { name: "data", type: "bytes" },
                      ],
                    },
                    { name: "value", type: "uint256" },
                  ],
                },
                { name: "salt", type: "uint256" },
                { name: "start", type: "uint256" },
                { name: "end", type: "uint256" },
                { name: "dataType", type: "bytes4" },
                { name: "data", type: "bytes" },
              ],
            },
            { name: "signatureRight", type: "bytes" },
          ],
          name: "matchOrders",
          outputs: [],
          stateMutability: "payable",
          type: "function",
        },
      ];

      const exchangeContract = new ethers.Contract(
        RARIBLE_EXCHANGE_ADDRESS,
        MATCH_ORDERS_ABI,
        signer
      );
      const tx = await exchangeContract.matchOrders(
        buyOrder, // orderLeft - buyer order
        buySignature, // signatureLeft - buyer signature
        sellOrder, // orderRight - seller order
        sellSignature, // signatureRight - seller signature
        {
          value: priceInWei, // Send ETH for purchase
          gasLimit: 500000,
        }
      );

      console.log("📡 Transaction sent:", tx.hash);

      // Wait for confirmation
      const receipt = await tx.wait();
      return {
        success: true,
        data: {
          txHash: tx.hash,
          receipt: receipt,
          nftContract: nftContract,
          tokenId: tokenId,
          seller: sellerAddress,
          buyer: buyerAddress,
          price: priceAmount,
          item: item,
        },
      };
    } catch (error: any) {
      console.error("❌ Purchase failed:", error);

      let errorMessage = "Failed to purchase NFT";
      if (error.code === 4001) {
        errorMessage = "User rejected transaction";
      } else if (error.message) {
        errorMessage = error.message;
      }

      alert(`❌ ${errorMessage}`);
      return { success: false, error: errorMessage };
    } finally {
      fetchCollectionData();
    }
  };
  const checkApproval = async (nftContract: string, ownerAddress: string) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(nftContract, ERC721_ABI, provider);

      // Check if owner has approved Rarible transfer proxy for all tokens
      const isApprovedForAll = await contract.isApprovedForAll(
        ownerAddress,
        RARIBLE_TRANSFER_PROXY
      );

      console.log("🔍 Approval check:", {
        nftContract,
        owner: ownerAddress,
        transferProxy: RARIBLE_TRANSFER_PROXY,
        isApprovedForAll,
      });

      return isApprovedForAll;
    } catch (error) {
      console.error("❌ Error checking approval:", error);
      return false;
    }
  };
  const approveRarible = async (nftContract: string) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(nftContract, ERC721_ABI, signer);

      const tx = await contract.setApprovalForAll(RARIBLE_TRANSFER_PROXY, true);

      console.log("📡 Approval transaction sent:", tx.hash);

      // Show loading state
      const loadingAlert = alert(
        "⏳ Approving Rarible transfer proxy... Please wait for confirmation."
      );

      // Wait for confirmation
      const receipt = await tx.wait();

      console.log("✅ Approval confirmed:", receipt);

      return {
        success: true,
        txHash: tx.hash,
        receipt,
      };
    } catch (error: any) {
      console.error("❌ Approval failed:", error);

      let errorMessage = "Failed to approve Rarible";
      if (error.code === 4001) {
        errorMessage = "User rejected approval transaction";
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  };
  const generateRaribleSalt = () => {
    // Tạo 64 ký tự hex random (giống hệt code Rarible)
    const hexChars = Array.from(Array(64))
      .map(() => Math.floor(16 * Math.random()).toString(16))
      .join("");

    const saltHex = "0x" + hexChars;

    // Convert thành BigNumber như Rarible
    const salt = ethers.BigNumber.from(saltHex);

    console.log("🔥 Generated Salt Hex:", saltHex);
    console.log("🔥 Generated Salt BigNumber:", salt.toString());

    return salt.toString();
  };

  // 🔥 Define types for fee structure
  interface RaribleFee {
    account: string;
    value: number;
  }

  const unListNFT = async (item: any) => {
    console.log(item);
    if (!walletAddress) {
      alert("Please connect your wallet first");
      return;
    }

    if (!item.price) {
      alert("This NFT is not listed for sale");
      return;
    }
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const userAddress = await signer.getAddress();

      const itemId = encodeURIComponent(item.id);
      const apiResponse = await fetch(
        `https://api.rarible.org/v0.1/items/${itemId}`,
        {
          headers: {
            accept: "*/*",
            "accept-language": "vi-VN,vi;q=0.9",
            "cache-control": "no-cache",
            origin: "https://rarible.fun",
            referer: "https://rarible.fun/",
            "x-api-key": "555bb639-8325-4840-91c0-c25a9c38f366",
          },
        }
      );

      if (!apiResponse.ok) {
        throw new Error(`API Error: ${apiResponse.status}`);
      }

      const itemData = await apiResponse.json();
      console.log("📋 Item data from API:", itemData);

      if (!itemData.bestSellOrder) {
        throw new Error("No active sell order found for this NFT");
      }

      const sellOrder = itemData.bestSellOrder;
      console.log("💰 Sell order to cancel:", sellOrder);

      // Check if user is the maker of this order
      const orderMaker = sellOrder.maker.split(":")[1]; // Remove "ETHEREUM:" prefix
      if (orderMaker.toLowerCase() !== userAddress.toLowerCase()) {
        throw new Error("You can only cancel your own listings");
      }

      // Step 2: Build order structure for cancel function
      const nftContract = item.collection.id.split(":")[1];
      const tokenId = item.id.split(":")[2];

      // Convert sellOrder to contract format for cancel
      const orderToCancel = {
        maker: orderMaker,
        makeAsset: {
          assetType: {
            assetClass: "0x73ad2146", // ERC721
            data: ethers.utils.defaultAbiCoder.encode(
              ["address", "uint256"],
              [nftContract, tokenId]
            ),
          },
          value: "1",
        },
        taker: "0x0000000000000000000000000000000000000000",
        takeAsset: {
          assetType: {
            assetClass: "0xaaaebeba", // ETH
            data: "0x",
          },
          value: ethers.utils.parseEther(sellOrder.take.value).toString(),
        },
        salt: sellOrder.salt,
        start: "0",
        end: Math.floor(
          new Date(sellOrder.endedAt).getTime() / 1000
        ).toString(),
        dataType: "0x4ade54ca", // Rarible V2
        data: "0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
      };

      console.log("🔥 Order structure for cancel:", orderToCancel);

      // Step 3: Call cancel function on exchange contract
      const CANCEL_ABI = [
        {
          inputs: [
            {
              name: "order",
              type: "tuple",
              components: [
                { name: "maker", type: "address" },
                {
                  name: "makeAsset",
                  type: "tuple",
                  components: [
                    {
                      name: "assetType",
                      type: "tuple",
                      components: [
                        { name: "assetClass", type: "bytes4" },
                        { name: "data", type: "bytes" },
                      ],
                    },
                    { name: "value", type: "uint256" },
                  ],
                },
                { name: "taker", type: "address" },
                {
                  name: "takeAsset",
                  type: "tuple",
                  components: [
                    {
                      name: "assetType",
                      type: "tuple",
                      components: [
                        { name: "assetClass", type: "bytes4" },
                        { name: "data", type: "bytes" },
                      ],
                    },
                    { name: "value", type: "uint256" },
                  ],
                },
                { name: "salt", type: "uint256" },
                { name: "start", type: "uint256" },
                { name: "end", type: "uint256" },
                { name: "dataType", type: "bytes4" },
                { name: "data", type: "bytes" },
              ],
            },
          ],
          name: "cancel",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
      ];

      const exchangeContract = new ethers.Contract(
        RARIBLE_EXCHANGE_ADDRESS,
        CANCEL_ABI,
        signer
      );

      console.log("📡 Sending cancel transaction...");

      const tx = await exchangeContract.cancel(orderToCancel, {
        gasLimit: 200000, // Conservative gas limit for cancel
      });

      // Wait for confirmation
      const receipt = await tx.wait();
      console.log("✅ Cancel transaction confirmed:", receipt);

      return {
        success: true,
        data: {
          txHash: tx.hash,
          receipt: receipt,
          cancelledOrder: sellOrder,
        },
      };
    } catch (error: any) {
      console.error("❌ Unlist failed:", error);
      let errorMessage = "Failed to unlist NFT";
      if (error.code === 4001) {
        errorMessage = "User rejected transaction";
      } else if (error.message) {
        errorMessage = error.message;
      }
      return { success: false, error: errorMessage };
    } finally {
      fetchCollectionData();
    }
  };
  // List NFT function using prepare pattern
  const listNFT = async (item: any, price: string) => {
    if (!walletAddress) {
      alert("Please connect your wallet first");
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const sellerAddress = await signer.getAddress();

      const ETH_ASSET_CLASS = "0xaaaebeba";
      const ERC721_ASSET_CLASS = "0x73ad2146";
      // Parse NFT data
      const nftContract = item.collection.id.split(":")[1];
      const tokenId = item.id.split(":")[2];
      const isApproved = await checkApproval(nftContract, sellerAddress);
      if (!isApproved) {
        const approvalResult = await approveRarible(nftContract);
        if (!approvalResult.success) {
          return;
        }
      }
      console.log("🚀 Creating CORRECT Rarible order structure");
      console.log("Contract:", nftContract);
      console.log("TokenId:", tokenId);
      console.log("Price:", price, "ETH");

      const priceInWei = ethers.utils.parseEther(price);
      const currentTime = Math.floor(Date.now() / 1000);

      // 🔥 Generate salt exactly like Rarible
      const accurateSalt = generateRaribleSalt();

      // 🔥 Create order theo EXACT structure mày cung cấp
      const raribleOrder = {
        "@type": "RARIBLE_V2",
        blockchain: "BASECAMPTESTNET",
        data: {
          "@type": "ETH_RARIBLE_V2_3", // 🔥 CORRECT TYPE
          isMakeFill: true,
          payouts: [], // Empty array
          originFees: [], // Empty array
        },
        endedAt: new Date(currentTime * 1000 + 86400 * 30 * 1000).toString(), // 30 days from now
        make: {
          type: {
            "@type": "ERC721",
            contract: nftContract,
            tokenId: tokenId,
            blockchain: "BASECAMPTESTNET",
          },
          value: "1",
        },
        maker: `BASECAMPTESTNET:${sellerAddress}`, // 🔥 CORRECT FORMAT
        salt: accurateSalt,
        signature: "0x", // Will be filled after signing
        startedAt: undefined,
        take: {
          type: {
            "@type": "ETH",
            blockchain: "BASECAMPTESTNET",
          },
          value: priceInWei.toString(),
        },
      };

      console.log("🔥 Rarible Order Structure:", raribleOrder);

      // 🔥 Create order for EIP-712 signing (different structure)
      const createAsset = (
        assetClass: string,
        tokenAddress: string,
        tokenId: string,
        value: string
      ) => {
        let data;
        if (assetClass === ERC721_ASSET_CLASS) {
          data = ethers.utils.defaultAbiCoder.encode(
            ["address", "uint256"],
            [tokenAddress, tokenId]
          );
        } else if (assetClass === ETH_ASSET_CLASS) {
          data = "0x";
        }
        return {
          assetType: { assetClass: assetClass, data: data },
          value: value,
        };
      };

      // 🔥 EXACT data từ debug - sử dụng dataType 0x4ade54ca
      const exactData =
        "0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

      // Create sell order EXACT như debug
      const sellOrder = {
        maker: sellerAddress,
        makeAsset: {
          assetType: {
            assetClass: "0x73ad2146", // ERC721
            data: ethers.utils.defaultAbiCoder.encode(
              ["address", "uint256"],
              [nftContract, tokenId]
            ),
          },
          value: "1", // String, không phải BigNumber
        },
        taker: "0x0000000000000000000000000000000000000000",
        takeAsset: {
          assetType: {
            assetClass: "0xaaaebeba", // ETH
            data: "0x",
          },
          value: priceInWei.toString(), // String format
        },
        salt: accurateSalt, // String format
        start: "0", // String format
        end: (currentTime + 86400 * 30).toString(), // String format
        dataType: "0x4ade54ca", // 🔥 EXACT từ debug
        data: exactData, // 🔥 EXACT từ debug
      };

      // EIP-712 Domain
      const domain = {
        name: "Exchange",
        version: "2",
        chainId: 123420001114,
        verifyingContract: RARIBLE_EXCHANGE_ADDRESS,
      };

      // 🔥 EIP-712 Types (BỎ EIP712Domain - ethers.js tự động thêm)
      const types = {
        AssetType: [
          { name: "assetClass", type: "bytes4" },
          { name: "data", type: "bytes" },
        ],
        Asset: [
          { name: "assetType", type: "AssetType" },
          { name: "value", type: "uint256" },
        ],
        Order: [
          { name: "maker", type: "address" },
          { name: "makeAsset", type: "Asset" },
          { name: "taker", type: "address" },
          { name: "takeAsset", type: "Asset" },
          { name: "salt", type: "uint256" },
          { name: "start", type: "uint256" },
          { name: "end", type: "uint256" },
          { name: "dataType", type: "bytes4" },
          { name: "data", type: "bytes" },
        ],
      };

      console.log("🔐 Signing order EXACT structure...");
      console.log("Message to sign:", sellOrder);
      console.log("Salt:", accurateSalt);
      console.log("DataType:", sellOrder.dataType);
      console.log("Data:", sellOrder.data);
      console.log("End:", sellOrder.end);
      console.log("MakeAsset value type:", typeof sellOrder.makeAsset.value);
      console.log("TakeAsset value type:", typeof sellOrder.takeAsset.value);
      const signature = await signer._signTypedData(domain, types, sellOrder);
      console.log("✅ Signature:", signature);

      // Update signature trong raribleOrder
      raribleOrder.signature = signature;

      // 🔥 API payload theo CORRECT format
      const apiPayload = {
        maker: sellerAddress,
        data: {
          dataType: "RARIBLE_V2_DATA_V3", // 🔥 V3 for ETH_RARIBLE_V2_3
          isMakeFill: true,
          originFees: [],
          payouts: [],
        },
        end: currentTime + 86400 * 30,
        make: {
          assetType: {
            assetClass: "ERC721",
            contract: nftContract,
            tokenId: tokenId,
          },
          value: "1",
        },
        salt: accurateSalt,
        signature: signature,
        start: 0,
        take: {
          assetType: {
            assetClass: "ETH",
          },
          value: priceInWei.toString(),
        },
        type: "RARIBLE_V2",
      };

      console.log("📡 API Payload:", apiPayload);

      // Call Rarible API
      const response = await fetch(
        "https://basecamptestnet-api.rarible.org/v0.1/order/orders",
        {
          method: "POST",
          headers: {
            accept: "*/*",
            "content-type": "application/json",
            "x-api-key": "555bb639-8325-4840-91c0-c25a9c38f366",
          },
          body: JSON.stringify(apiPayload),
        }
      );

      console.log("📡 Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API Error:", errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();

      return {
        success: true,
        data: {
          raribleOrder: raribleOrder, // Structure giống web
          sellOrder: sellOrder, // For contract interaction
          signature: signature,
          apiResponse: result,
          salt: accurateSalt,
        },
      };
    } catch (error: any) {
      console.error("❌ Error:", error);

      let errorMessage = "Failed to list NFT";
      if (error.code === 4001) {
        errorMessage = "User rejected signing";
      } else if (error.message) {
        errorMessage = error.message;
      }

      alert(`❌ ${errorMessage}`);
      return { success: false, error: errorMessage };
    } finally {
      fetchCollectionData();
    }
  };
  const handlePriceSubmit = async (item: any, price: string) => {
    await listNFT(item, price);
  };

  // 🔥 Handle opening modal
  const handleListNFT = (item: any) => {
    setSelectedItem(item);
    setShowPriceModal(true);
  };
  const handleCloseModal = () => {
    setShowPriceModal(false);
    setSelectedItem(null);
  };

  // Format address
  const formatAddress = (address: string) => {
    const addr = address.includes(":") ? address.split(":")[1] : address;
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  };

  // Load data on mount
  useEffect(() => {
    if (contractAddress) {
      fetchCollectionData();
    }
  }, [contractAddress]);

  // Filter data based on active tab
  const getFilteredData = () => {
    switch (activeTab) {
      case "items":
        return ownerships;
      case "myItems":
        return walletAddress
          ? ownerships.filter((item: any) => {
              const ownerField = item.owner || item.ownerIfSingle;
              if (!ownerField) return false;

              // Parse owner address correctly
              const ownerAddr = ownerField.includes(":")
                ? ownerField.split(":")[1] // "BASECAMPTESTNET:0x123" -> "0x123"
                : ownerField;

              // Compare with wallet address
              return ownerAddr?.toLowerCase() === walletAddress.toLowerCase();
            })
          : [];
      case "holders":
        return ownerships;
      case "activity":
        return ownerships;
      default:
        return ownerships;
    }
  };

  const filteredData = getFilteredData();

  return (
    <div className={`bg-slate-800 h-full flex flex-col ${className}`}>
      {/* 🔥 Tabs với slate theme */}
      <div className="border-b border-slate-600 bg-slate-800 flex-shrink-0">
        <div className="flex space-x-0 px-6">
          {[
            { key: "items", label: "Items", count: ownerships.length },
            {
              key: "myItems",
              label: "My Items",
              count: (() => {
                if (!walletAddress || ownerships.length === 0) return 0;

                const count = ownerships.filter((item: any) => {
                  const ownerField = item.owner || item.ownerIfSingle;
                  if (!ownerField) return false;

                  const ownerAddr = ownerField.includes(":")
                    ? ownerField.split(":")[1]
                    : ownerField;

                  return (
                    ownerAddr?.toLowerCase() === walletAddress.toLowerCase()
                  );
                }).length;
                return count;
              })(),
            },
            { key: "holders", label: "Holders", count: stats.owners },
            { key: "activity", label: "Activity", count: 0 },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-4 px-6 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap ${
                activeTab === tab.key
                  ? "border-purple-500 text-purple-400 bg-purple-900/20"
                  : "border-transparent text-gray-400 hover:text-gray-300 hover:bg-slate-700/50"
              }`}
            >
              {tab.label}{" "}
              {tab.count > 0 && (
                <span
                  className={`text-xs px-2 py-1 rounded-full ml-2 ${
                    activeTab === tab.key
                      ? "bg-purple-900/50 text-purple-300"
                      : "bg-slate-700 text-gray-400"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 🔥 Scrollable Content */}
      <div className="flex-1 overflow-y-auto bg-slate-800 holders-scrollbar">
        <div className="p-6">
          {/* Loading State - Slate theme */}
          {loading && (
            <div className="text-center py-16">
              <div className="text-purple-400 text-lg animate-pulse">
                🔄 Loading...
              </div>
            </div>
          )}

          {/* Error State - Slate theme */}
          {error && (
            <div className="text-center py-16">
              <div className="text-red-400 mb-4">❌ {error}</div>
              <button
                onClick={fetchCollectionData}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg"
              >
                🔄 Retry
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Special tabs content */}
              {activeTab === "activity" ? (
                <ActivityTab
                  contractAddress={contractAddress}
                  walletAddress={walletAddress}
                />
              ) : activeTab === "holders" ? (
                <HoldersTab
                  ownerships={ownerships}
                  walletAddress={walletAddress}
                  totalSupply={stats.totalSupply}
                />
              ) : (
                /* NFT Grid for items/myItems/offers tabs */
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                    {filteredData.map((item: any) => {
                      const isMyNFT = activeTab === "myItems";
                      const ownerField = item.owner || item.ownerIfSingle;
                      const itemOwnerAddr = ownerField?.includes(":")
                        ? ownerField.split(":")[1]
                        : ownerField;
                      const isOwner =
                        itemOwnerAddr &&
                        walletAddress &&
                        itemOwnerAddr.toLowerCase() ===
                          walletAddress.toLowerCase();

                      return (
                        <div key={item.id} className="relative group">
                          {/* Gradient border wrapper */}
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-blue-500 to-pink-500 rounded-xl p-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="w-full h-full bg-slate-800 rounded-xl"></div>
                          </div>

                          {/* Main card */}
                          <div className="relative bg-slate-700 rounded-xl overflow-hidden hover:bg-slate-600 transition-all duration-200 border border-slate-600 group-hover:border-transparent">
                            {/* NFT Image */}
                            <div className="aspect-square bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 flex items-center justify-center relative overflow-hidden">
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={
                                    item.name ||
                                    `Token #${item.id?.split(":")[2]}`
                                  }
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                  onError={(e) => {
                                    (
                                      e.target as HTMLImageElement
                                    ).style.display = "none";
                                  }}
                                />
                              ) : (
                                <div className="text-white text-3xl opacity-60">
                                  🎨
                                </div>
                              )}

                              {/* Token ID */}
                              <div className="absolute bottom-2 left-2 text-white text-sm bg-gradient-to-r from-purple-600/90 to-blue-600/90 backdrop-blur-sm px-3 py-1 rounded-lg font-medium">
                                #{item.id?.split(":")[2] || "??"}
                              </div>

                              {/* Status Badges */}
                              <div className="absolute top-2 right-2 flex flex-col gap-1">
                                {item.price && (
                                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-1 rounded-lg text-xs font-bold shadow-lg">
                                    LISTED
                                  </div>
                                )}
                                {isOwner && (
                                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-2 py-1 rounded-lg text-xs font-bold shadow-lg">
                                    YOURS
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Info Card */}
                            <div className="p-4 space-y-3">
                              {/* Title */}
                              <div className="text-white font-semibold text-base truncate">
                                {item.name || "Pixel Art"}
                              </div>

                              {/* Price */}
                              {item.price ? (
                                <div className="space-y-1">
                                  <div className="flex items-baseline gap-2">
                                    <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent font-bold text-lg">
                                      {item.price.amount}
                                    </span>
                                    <span className="text-green-300 text-sm">
                                      {item.price.currency?.abbreviation ||
                                        "ETH"}
                                    </span>
                                  </div>
                                  <div className="text-gray-400 text-sm">
                                    Last: —
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <div className="text-gray-400 text-base">
                                    Not listed
                                  </div>
                                  <div className="text-gray-500 text-sm">
                                    Last: —
                                  </div>
                                </div>
                              )}

                              {/* Owner */}
                              <div className="text-gray-400 text-sm">
                                Owner:{" "}
                                <span className="font-mono text-gray-300">
                                  {item.owner
                                    ? formatAddress(item.owner)
                                    : "Unknown"}
                                </span>
                              </div>

                              {/* Action Buttons */}
                              <div className="pt-2">
                                {isMyNFT ? (
                                  item.price ? (
                                    <button
                                      onClick={() => unListNFT(item)}
                                      className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-2.5 px-4 rounded-lg font-medium transition-all duration-200 shadow-lg"
                                    >
                                      🚫 Unlist NFT
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleListNFT(item)}
                                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-2.5 px-4 rounded-lg font-medium transition-all duration-200 shadow-lg"
                                    >
                                      🏷️ List for Sale
                                    </button>
                                  )
                                ) : item.price ? (
                                  <button
                                    onClick={() => buyNFT(item)}
                                    disabled={!walletAddress || isOwner}
                                    className={`w-full py-2.5 px-4 rounded-lg font-medium transition-all duration-200 shadow-lg ${
                                      !walletAddress || isOwner
                                        ? "bg-slate-600 text-gray-400 cursor-not-allowed"
                                        : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                                    }`}
                                  >
                                    {!walletAddress
                                      ? "Connect Wallet"
                                      : isOwner
                                      ? "Your NFT"
                                      : "🛒 Buy Now"}
                                  </button>
                                ) : (
                                  <button
                                    disabled
                                    className="w-full bg-slate-600 text-gray-400 py-2.5 px-4 rounded-lg font-medium cursor-not-allowed"
                                  >
                                    Not for Sale
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Empty State */}
                  {filteredData.length === 0 && (
                    <div className="text-center py-20">
                      <div className="text-6xl mb-6 opacity-20">📦</div>
                      <div className="text-gray-400 text-xl mb-2">
                        No items found
                      </div>
                      <div className="text-gray-500">
                        Try switching to a different tab
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
      <PriceInputModal
        isOpen={showPriceModal}
        selectedItem={selectedItem}
        onClose={handleCloseModal}
        onSubmit={handlePriceSubmit}
      />
    </div>
  );
};

export default CompleteMarketplace;
