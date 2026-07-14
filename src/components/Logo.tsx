import React from "react";

interface LogoProps {
  light?: boolean;
  className?: string;
}

export default function Logo({ light = false, className = "" }: LogoProps) {
  return (
    <div className={`flex items-center justify-center select-none ${className}`}>
      <img
        src="/logo.png"
        alt="The Art Ledger"
        className={`h-8 md:h-10 object-contain w-auto ${light ? "invert brightness-200" : ""}`}
      />
    </div>
  );
}
