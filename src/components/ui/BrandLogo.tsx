"use client";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

export default function BrandLogo({ size = "md", showIcon = true, className = "" }: BrandLogoProps) {
  const textSize = size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-lg";
  const iconSize = size === "sm" ? "h-6 w-6 text-[10px]" : size === "lg" ? "h-10 w-10 text-base" : "h-8 w-8 text-sm";

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {showIcon && (
        <span className={`flex items-center justify-center rounded-lg bg-blue-600 font-bold text-white ${iconSize}`}>
          <span>M</span>
        </span>
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
