import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { EVENT_TYPES, COURSE_TAG_CLASSES } from "@/lib/constants"

// variant="chips": compact horizontal scroll row for mobile, instead of the full card list.
export default function CategoryFilters({ active, onToggle, variant = "card" }) {
  if (variant === "chips") {
    return (
      <div className="flex gap-1.5 overflow-x-auto scrollbar-thin pb-0.5">
        {Object.entries(EVENT_TYPES).map(([key, info]) => {
          const isActive = active.includes(key)
          const tag = COURSE_TAG_CLASSES[info.color]
          return (
            <button
              key={key}
              onClick={() => onToggle(key)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                isActive ? cn(tag.bg, tag.border, tag.text) : "border-border text-muted-foreground opacity-60"
              )}
            >
              <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", tag.solid)} />
              {info.label}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>סינון</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {Object.entries(EVENT_TYPES).map(([key, info]) => {
          const isActive = active.includes(key)
          const tag = COURSE_TAG_CLASSES[info.color]
          return (
            <button
              key={key}
              onClick={() => onToggle(key)}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-start text-sm transition-colors",
                isActive ? cn(tag.bg, tag.border) : "border-transparent hover:bg-accent opacity-60"
              )}
            >
              <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", tag.solid)} />
              <span className="flex-1 font-medium">{info.label}</span>
            </button>
          )
        })}
      </CardContent>
    </Card>
  )
}
