"use client";
import { useState, useEffect } from "react";
import { Chat, useNicknames } from "react-together";
import { MessageSquare, X } from "lucide-react";
import { useWallets } from "@privy-io/react-auth";

export default function ChatGame() {
  const [open, setOpen] = useState(false);
  const [nickname, setNickname] = useNicknames();
  const wallets = useWallets();

  useEffect(() => {
    if (!wallets.ready || !wallets.wallets[0]) return;

    const address = wallets.wallets[0].address as `0x${string}`;
    const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
    setNickname(shortAddress);
  }, [wallets.ready, wallets.wallets, setNickname]);

  return (
    <div className="relative">
      {/* Toggle Button */}
      <div className="flex justify-center mt-2">
        <button
          onClick={() => setOpen(!open)}
          className="p-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white shadow-md transition"
        >
          {open ? <X size={20} /> : <MessageSquare size={20} />}
        </button>
      </div>

      {/* Chat Popup (beside canvas) */}
      {open && (
        <div className="absolute left-[110%] top-0 w-80 h-[500px] bg-zinc-900 rounded-xl shadow-xl z-40 flex flex-col border border-zinc-700 overflow-hidden">
          {/* Header */}
          <div className="bg-zinc-800 px-4 py-2 flex items-center justify-between border-b border-zinc-700">
            <span className="text-sm font-semibold text-white">Team Chat</span>
            <button
              onClick={() => setOpen(false)}
              className="text-zinc-400 hover:text-red-500"
            >
              <X size={18} />
            </button>
          </div>

          {/* Chat Content */}
          <div className="flex-1 overflow-hidden">
            <Chat
              rtKey={process.env.NEXT_PUBLIC_RT_KEY || "fallback-chat"}
              chatName="Team Chat"
            />
          </div>
        </div>
      )}
    </div>
  );
}
