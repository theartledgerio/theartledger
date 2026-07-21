/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
        className={`h-9 md:h-12 w-auto object-contain transition-all duration-300 ${
          light ? "invert brightness-200" : ""
        }`}
      />
    </div>
  );
}
