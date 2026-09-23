import React, { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { COURSE_TAG_CLASSES } from "@/lib/constants"

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export default function MiniCalendar({ events, courses, selectedDate, onSelectDate }) {
  const [cursor, setCursor] = useState(startOfMonth(selectedDate || new Date()))

  const courseColorById = useMemo(() => {
    const map = {}
    courses.forEach((c) => (map[c.id] = c.color))
    return map
  }, [courses])

  const eventsByDay = useMemo(() => {
    const map = {}
    events.forEach((e) => {
      const key = new Date(e.start).toDateString()
      if (!map[key]) map[key] = []
      map[key].push(e)
    })
    return map
  }, [events])

  const days = useMemo(() => {
    const first = startOfMonth(cursor)
    const startWeekday = first.getDay()
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()
    const cells = []
    for (let i = 0; i < startWeekday; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), d))
    }
    return cells
  }, [cursor])

  const today = new Date()

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle>{cursor.toLocaleDateString("he-IL", { month: "long", year: "numeric" })}</CardTitle>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
          >
            {/* RTL: "previous month" visually points right */}
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
          >
            {/* RTL: "next month" visually points left */}
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-y-1 text-center text-[10px] font-medium text-muted-foreground">
          {["א", "ב", "ג", "ד", "ה", "ו", "ש"].map((d, i) => (
            <div key={i}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {days.map((day, i) => {
            if (!day) return <div key={i} />
            const isToday = day.toDateString() === today.toDateString()
            const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString()
            const dayEvents = eventsByDay[day.toDateString()] || []
            const dots = [...new Set(dayEvents.map((e) => courseColorById[e.courseId] || "indigo"))].slice(0, 3)

            return (
              <button
                key={i}
                onClick={() => onSelectDate?.(day)}
                className={cn(
                  "relative mx-auto flex h-7 w-7 flex-col items-center justify-center rounded-full text-xs transition-colors",
                  isSelected
                    ? "bg-primary text-primary-foreground font-semibold"
                    : isToday
                    ? "border border-primary text-primary font-semibold"
                    : "hover:bg-accent"
                )}
              >
                {day.getDate()}
                {dots.length > 0 && (
                  <span className="absolute -bottom-1 flex gap-0.5">
                    {dots.map((color, idx) => (
                      <span
                        key={idx}
                        className={cn("h-1 w-1 rounded-full", COURSE_TAG_CLASSES[color]?.solid)}
                      />
                    ))}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
