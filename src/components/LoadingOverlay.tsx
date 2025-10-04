"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function LoadingOverlay() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");
      if (link && link.href.startsWith(window.location.origin)) {
        setIsVisible(true);
      }
    };

    const handleDone = () => setTimeout(() => setIsVisible(false), 400);

    window.addEventListener("click", handleClick);
    window.addEventListener("pageshow", handleDone);

    return () => {
      window.removeEventListener("click", handleClick);
      window.removeEventListener("pageshow", handleDone);
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black transition-opacity duration-500 ${
        isVisible
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
    >
      <Image
        src="/logo/logo.png"
        alt="Papaya logo"
        width={80}
        height={80}
        className="animate-pulse opacity-90"
      />
    </div>
  );
}
