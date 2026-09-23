import React from "react"
import { cn } from "@/lib/utils"

// Compact "this week" bar strip — pill-shaped vertical bars, today's bar highlighted.
export default function WeeklyBarStrip({ data }) {
  const maxHours = Math.max(1, ...data.map((d) => d.hours))
  const todayLabel = new Date().toLocaleDateString("he-IL", { weekday: "short" })
  const totalHours = data.reduce((sum, d) => sum + d.hours, 0)
  const totalH = Math.floor(totalHours)
  const totalM = Math.round((totalHours - totalH) * 60)

  return (
    <div className="rounded-2xl bg-secondary/60 p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          השבוע
        </span>
        <span className="text-sm font-bold tabular-nums">
          {totalH} ש׳ {totalM} ד׳
        </span>
      </div>
      <div className="flex items-end justify-between gap-2">
        {data.map((d) => {
          const isToday = d.label === todayLabel
          const heightPct = Math.max(8, (d.hours / maxHours) * 100)
          return (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex h-16 w-full items-end justify-center">
                <div
                  className={cn(
                    "w-2.5 rounded-full transition-all",
                    isToday ? "bg-primary" : "bg-foreground/20"
                  )}
                  style={{ height: `${heightPct}%` }}
                />
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium",
                  isToday ? "text-primary" : "text-muted-foreground"
                )}
              >
                {d.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
