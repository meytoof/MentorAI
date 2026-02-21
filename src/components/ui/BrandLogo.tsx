"use client";

import Image from "next/image";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

export default function BrandLogo({ size = "md", showIcon = true, className = "" }: BrandLogoProps) {
  const textSize = size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-lg";
  const iconSize = size === "sm" ? 24 : size === "lg" ? 40 : 32;

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {showIcon && (
        <Image
          src="/logo-maieutique.png"
          alt="Maïeutique"
          width={iconSize}
          height={iconSize}
          className="rounded-lg"
        />
      )}
      <span className={`font-bold tracking-tight text-white ${textSize}`}>
        M<span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">ai</span>eutique
      </span>
    </span>
  );
}

export function BrandName() {
  return (
    <>M<span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">ai</span>eutique</>
  );
}
