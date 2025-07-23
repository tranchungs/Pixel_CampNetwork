import { useEffect, useState } from "react";

export default function TransactionToast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onClose();
    }, 1500);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!visible) return null;

  return (
    <div
      className={`fixed right-4 px-4 py-2 rounded shadow-lg text-white z-[1000] transition-all duration-300
      ${type === "success" ? "bg-green-600" : "bg-red-600"}`}
      style={{
        bottom: "150px", // cao hơn lớp dưới
        maxWidth: "500px",
        fontWeight: 500,
        opacity: 0.85,
      }}
    >
      {message}
    </div>
  );
}
