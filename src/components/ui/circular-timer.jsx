import * as React from "react"
import { cn } from "@/lib/utils"

// A large circular progress ring with the time label centered inside — the focus-session
// timer look. `pct` is 0-100 (percent elapsed of the current duration).
export function CircularTimer({ pct, label, sublabel, className, ringClassName, size = 260 }) {
  const strokeWidth = 6
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - Math.min(100, Math.max(0, pct)) / 100)

  return (
    <div className={cn("relative flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-current opacity-20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn("stroke-current transition-[stroke-dashoffset] duration-500 ease-linear", ringClassName)}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span
          className="font-mono font-bold tabular-nums"
          style={{ fontSize: size < 220 ? "2.25rem" : "3rem" }}
        >
          {label}
        </span>
        {sublabel && (
          <span className="mt-1 text-[11px] font-semibold uppercase tracking-[0.15em] opacity-70">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  )
}
