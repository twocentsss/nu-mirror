"use client";

import type { ReactNode } from "react";
import Tilt from "@/ui/Tilt";

export function MirrorCard({
  children,
  className = "",
  tilt = true,
}: {
  children: ReactNode;
  className?: string;
  tilt?: boolean;
}) {
  const core =
    "rounded-[18px] bg-[var(--glass-bg)] backdrop-blur-[18px] " +
    "border border-[var(--glass-border)] shadow-[0_10px_30px_rgba(0,0,0,0.06)]";

  if (!tilt) {
    return <div className={`${core} ${className}`}>{children}</div>;
  }

  return (
    <Tilt className={`${core} ${className}`} maxDeg={2.5}>
      {children}
    </Tilt>
  );
}
