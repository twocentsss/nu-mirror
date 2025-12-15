"use client";

import { useMemo, useRef } from "react";
import type { MouseEvent as ReactMouseEvent, ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  maxDeg?: number; // small (2-4) recommended
};

export default function Tilt({ children, className = "", maxDeg = 3 }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  const style = useMemo(
    () => ({
      transformStyle: "preserve-3d" as const,
    }),
    [],
  );

  function onMove(e: ReactMouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;

    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width; // 0..1
    const py = (e.clientY - r.top) / r.height; // 0..1

    const rx = (0.5 - py) * maxDeg; // invert Y
    const ry = (px - 0.5) * maxDeg;

    el.style.setProperty("--rx", `${rx}deg`);
    el.style.setProperty("--ry", `${ry}deg`);
    el.style.setProperty("--hx", `${px * 100}%`);
    el.style.setProperty("--hy", `${py * 100}%`);
  }

  function onLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", `0deg`);
    el.style.setProperty("--ry", `0deg`);
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onMouseEnter={onMove}
      className={[
        "relative tap group",
        // tilt transform
        "transition-transform duration-300 ease-out",
        "[transform:perspective(900px)_rotateX(var(--rx))_rotateY(var(--ry))]",
        className,
      ].join(" ")}
      style={style}
    >
      {/* specular highlight */}
      <div
        className={[
          "pointer-events-none absolute inset-0 rounded-[inherit]",
          "opacity-0 transition-opacity duration-300",
          "group-hover:opacity-100",
        ].join(" ")}
      />
      <div
        className={[
          "pointer-events-none absolute inset-0 rounded-[inherit]",
          "opacity-90",
          "[background:radial-gradient(400px_260px_at_var(--hx)_var(--hy),rgba(255,255,255,0.65),transparent_60%)]",
          "mix-blend-soft-light",
        ].join(" ")}
      />
      {children}
    </div>
  );
}
