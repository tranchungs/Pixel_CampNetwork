"use client";
import { ReactTogether } from "react-together";
import PixelBoard from "./PixelBoard";
import { useMemo } from "react";
export default function Game() {
  console.log("Game rendered");
  const sessionParams = useMemo(
    () => ({
      apiKey: "2RP7Bs24e13LWqCQgNPFbqPCEvdPr7GSCMxCRmvepg",
      appId: "com.example.pixel",
    }),
    []
  );
  return (
    <ReactTogether sessionParams={sessionParams}>
      <PixelBoard />
    </ReactTogether>
  );
}
