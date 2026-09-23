import React, { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useStudyStore } from "@/store/StudyStoreContext"

const BLOCK_LABELS = ["6-9", "9-12", "12-15", "15-18", "18-21", "21-24"]
const DAY_LABELS = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"]

// Sequential blue ramp, low -> high intensity (validated with scripts/validate_palette.js --ordinal)
const SEQUENTIAL_LIGHT = ["#86b6ef", "#3987e5", "#1c5cab", "#104281"]
const SEQUENTIAL_DARK = ["#184f95", "#256abf", "#3987e5", "#6da7ec"]

function colorForValue(value, isDark) {
  const steps = isDark ? SEQUENTIAL_DARK : SEQUENTIAL_LIGHT
  if (value <= 0) return "var(--muted)"
  const idx = Math.max(0, Math.min(steps.length - 1, value - 1))
  return steps[idx]
}

export default function ProductivityHeatmap({ data }) {
  const { settings } = useStudyStore()
  const isDark = settings.theme === "dark"
  const [hovered, setHovered] = useState(null)
  const steps = isDark ? SEQUENTIAL_DARK : SEQUENTIAL_LIGHT

  const grid = useMemo(() => {
    const map = {}
    data.forEach((cell) => {
      map[`${cell.day}-${cell.block}`] = cell.value
    })
    return map
  }, [data])

  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle>שיא הפרודוקטיביות</CardTitle>
        <CardDescription>צפיפות ריכוז לפי יום ושעת יום</CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="overflow-x-auto scrollbar-thin">
          <div className="min-w-[420px]">
            <div className="grid grid-cols-[46px_repeat(6,1fr)] gap-1">
              <div />
              {BLOCK_LABELS.map((b) => (
                <div key={b} className="text-center text-[9px] font-medium text-muted-foreground">
                  {b}
                </div>
              ))}
              {DAY_LABELS.map((day) => (
                <React.Fragment key={day}>
                  <div className="flex items-center text-[10px] font-medium text-muted-foreground">{day}</div>
                  {BLOCK_LABELS.map((block) => {
                    const value = grid[`${day}-${block}`] ?? 0
                    const key = `${day}-${block}`
                    return (
                      <div
                        key={key}
                        onMouseEnter={() => setHovered({ day, block, value })}
                        onMouseLeave={() => setHovered(null)}
                        className={cn(
                          "aspect-square rounded-md border border-black/5 transition-transform dark:border-white/5",
                          hovered?.day === day && hovered?.block === block && "scale-110 ring-2 ring-primary"
                        )}
                        style={{ backgroundColor: colorForValue(value, isDark) }}
                        title={`${day} ${block}h: intensity ${value}`}
                      />
                    )
                  })}
                </React.Fragment>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{hovered ? `${hovered.day}, ${hovered.block} — עצימות ${hovered.value}/5` : "רחפו מעל תא לפרטים"}</span>
              <div className="flex items-center gap-1">
                <span>נמוך</span>
                {steps.map((c, i) => (
                  <span key={i} className="h-2.5 w-2.5 rounded-sm border border-black/5 dark:border-white/5" style={{ backgroundColor: c }} />
                ))}
                <span>גבוה</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
