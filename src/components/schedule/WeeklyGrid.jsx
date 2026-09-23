import React, { useEffect, useMemo, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { EVENT_TYPES, COURSE_TAG_CLASSES } from "@/lib/constants"
import { Sparkles } from "lucide-react"

const DAY_START_HOUR = 7
const DAY_END_HOUR = 22
const HOUR_HEIGHT = 56 // px per hour

// Compact mode (mobile single-day): narrower study window + smaller row height so the
// whole day fits on a phone viewport without vertical scrolling.
const COMPACT_DAY_START_HOUR = 8
const COMPACT_DAY_END_HOUR = 20
const COMPACT_HOUR_HEIGHT = 38

const SNAP_MINUTES = 15

function startOfWeek(date) {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

function getFreeSlots(dayEvents, dayStart, dayEnd) {
  const sorted = [...dayEvents].sort((a, b) => new Date(a.start) - new Date(b.start))
  const slots = []
  let cursor = dayStart

  for (const ev of sorted) {
    const evStart = new Date(ev.start)
    const evEnd = new Date(ev.end)
    if (evStart <= cursor) {
      if (evEnd > cursor) cursor = evEnd
      continue
    }
    if (evStart - cursor >= 45 * 60_000) {
      slots.push({ start: new Date(cursor), end: evStart })
    }
    if (evEnd > cursor) cursor = evEnd
  }
  if (dayEnd - cursor >= 45 * 60_000) {
    slots.push({ start: new Date(cursor), end: dayEnd })
  }
  return slots
}

function topOffset(date, dayStartHour, hourHeight) {
  const hours = date.getHours() + date.getMinutes() / 60
  return (hours - dayStartHour) * hourHeight
}

function blockHeight(start, end, hourHeight) {
  const durationHours = (end - start) / 3600000
  return Math.max(durationHours * hourHeight, hourHeight < 40 ? 16 : 22)
}

// Converts a pointer Y offset (px, relative to the day column top) into a Date on `day`,
// snapped to SNAP_MINUTES.
function offsetYToTime(day, offsetY, dayStartHour, hourHeight) {
  const rawMinutes = (offsetY / hourHeight) * 60 + dayStartHour * 60
  const snapped = Math.round(rawMinutes / SNAP_MINUTES) * SNAP_MINUTES
  const d = new Date(day)
  d.setHours(0, snapped, 0, 0)
  return d
}

export default function WeeklyGrid({
  events,
  courses,
  activeFilters,
  weekAnchor,
  googleCalendarEvents = [],
  onSlotClick,
  onEventChange,
  singleDay = false,
  dayAnchor,
  compact = false,
}) {
  const dayStartHour = compact ? COMPACT_DAY_START_HOUR : DAY_START_HOUR
  const dayEndHour = compact ? COMPACT_DAY_END_HOUR : DAY_END_HOUR
  const hourHeight = compact ? COMPACT_HOUR_HEIGHT : HOUR_HEIGHT

  const weekStart = useMemo(() => startOfWeek(weekAnchor || new Date()), [weekAnchor])
  const columnRefs = useRef({})
  const [drag, setDrag] = useState(null) // { eventId, mode: "move" | "resize", dayIndex, ... }
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(t)
  }, [])

  const courseById = useMemo(() => {
    const map = {}
    courses.forEach((c) => (map[c.id] = c))
    return map
  }, [courses])

  const days = useMemo(() => {
    if (singleDay) {
      const d = new Date(dayAnchor || new Date())
      d.setHours(0, 0, 0, 0)
      return [d]
    }
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart)
      d.setDate(d.getDate() + i)
      return d
    })
  }, [weekStart, singleDay, dayAnchor])

  const filteredEvents = useMemo(
    () => events.filter((e) => activeFilters.includes(e.type)),
    [events, activeFilters]
  )

  const hours = useMemo(
    () => Array.from({ length: dayEndHour - dayStartHour }, (_, i) => dayStartHour + i),
    [dayStartHour, dayEndHour]
  )

  const deadlinesByDay = useMemo(() => {
    const map = {}
    days.forEach((day) => {
      map[day.toDateString()] = filteredEvents.filter((e) => {
        const s = new Date(e.start)
        return s.toDateString() === day.toDateString() && e.type === "assignment"
      })
    })
    return map
  }, [days, filteredEvents])

  const handlePointerDownMove = (e, ev) => {
    e.stopPropagation()
    setDrag({
      eventId: ev.id,
      mode: "move",
      originalStart: new Date(ev.start),
      originalEnd: new Date(ev.end),
      startClientY: e.clientY,
    })
  }

  const handlePointerDownResize = (e, ev) => {
    e.stopPropagation()
    setDrag({
      eventId: ev.id,
      mode: "resize",
      originalStart: new Date(ev.start),
      originalEnd: new Date(ev.end),
      startClientY: e.clientY,
    })
  }

  const handlePointerMove = (e) => {
    if (!drag) return
    const deltaPx = e.clientY - drag.startClientY
    const deltaMinutesRaw = (deltaPx / hourHeight) * 60
    const deltaMinutes = Math.round(deltaMinutesRaw / SNAP_MINUTES) * SNAP_MINUTES

    if (drag.mode === "move") {
      const newStart = new Date(drag.originalStart.getTime() + deltaMinutes * 60_000)
      const durationMs = drag.originalEnd - drag.originalStart
      const newEnd = new Date(newStart.getTime() + durationMs)
      setDrag((prev) => ({ ...prev, previewStart: newStart, previewEnd: newEnd }))
    } else {
      const minDurationMs = 15 * 60_000
      const newEnd = new Date(
        Math.max(drag.originalEnd.getTime() + deltaMinutes * 60_000, drag.originalStart.getTime() + minDurationMs)
      )
      setDrag((prev) => ({ ...prev, previewStart: drag.originalStart, previewEnd: newEnd }))
    }
  }

  const handlePointerUp = () => {
    if (!drag) return
    const finalStart = drag.previewStart || drag.originalStart
    const finalEnd = drag.previewEnd || drag.originalEnd
    if (finalStart.getTime() !== drag.originalStart.getTime() || finalEnd.getTime() !== drag.originalEnd.getTime()) {
      onEventChange?.(drag.eventId, { start: finalStart.toISOString(), end: finalEnd.toISOString() })
    }
    setDrag(null)
  }

  // Double-click (not a single click) opens the create modal — avoids accidental modals
  // from a slightly-off drag release or a stray tap landing on empty space.
  const handleColumnDoubleClick = (e, day, dayIndex) => {
    const col = columnRefs.current[dayIndex]
    if (!col) return
    const rect = col.getBoundingClientRect()
    const offsetY = e.clientY - rect.top
    const clickedTime = offsetYToTime(day, offsetY, dayStartHour, hourHeight)
    onSlotClick?.(clickedTime)
  }

  return (
    <div
      className={cn(
        "overflow-x-auto scrollbar-thin rounded-xl border border-border bg-card",
        compact && "max-h-[calc(100vh-260px)] overflow-y-auto"
      )}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={() => drag && handlePointerUp()}
    >
      <div
        className={cn(
          "grid",
          singleDay
            ? compact
              ? "grid-cols-[40px_1fr]"
              : "grid-cols-[56px_1fr]"
            : "min-w-[820px] grid-cols-[56px_repeat(7,1fr)]"
        )}
      >
        {/* Header row */}
        <div className="sticky top-0 z-10 border-b border-r border-border bg-card" />
        {days.map((d, i) => {
          const isToday = d.toDateString() === now.toDateString()
          return (
            <div
              key={i}
              className={cn(
                "sticky top-0 z-10 border-b border-border px-2 py-2.5 text-center",
                isToday ? "bg-primary/10" : "bg-card",
                i < days.length - 1 && "border-r"
              )}
            >
              <p
                className={cn(
                  "text-[11px] font-medium",
                  isToday ? "text-primary" : "text-muted-foreground"
                )}
              >
                {d.toLocaleDateString("he-IL", { weekday: "short" })}
              </p>
              <p
                className={cn(
                  "text-sm font-semibold",
                  isToday && "mx-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
                )}
              >
                {d.getDate()}
              </p>
            </div>
          )
        })}

        {/* Deadlines row */}
        <div className="border-b border-r border-border" />
        {days.map((day, i) => {
          const dayDeadlines = deadlinesByDay[day.toDateString()] || []
          return (
            <div
              key={`deadline-${i}`}
              className={cn(
                "flex flex-col gap-0.5 border-b border-border p-1",
                i < days.length - 1 && "border-r",
                dayDeadlines.length === 0 && "py-0"
              )}
            >
              {dayDeadlines.map((ev) => {
                const tag = COURSE_TAG_CLASSES.rose
                return (
                  <div
                    key={ev.id}
                    className={cn(
                      "truncate rounded-md border px-1.5 py-0.5 text-[9px] font-semibold",
                      tag.bg,
                      tag.border,
                      tag.text
                    )}
                    title={ev.title}
                  >
                    &#9888; {ev.title}
                  </div>
                )
              })}
            </div>
          )
        })}

        {/* Hour labels column */}
        <div className="relative border-r border-border">
          {hours.map((h) => (
            <div
              key={h}
              style={{ height: hourHeight }}
              className={cn(
                "relative -top-2 text-end text-muted-foreground",
                compact ? "px-1 text-[9px]" : "px-1.5 text-[10px]"
              )}
            >
              {h % 12 === 0 ? 12 : h % 12}
              {compact ? (h < 12 ? "a" : "p") : h < 12 ? "am" : "pm"}
            </div>
          ))}
        </div>

        {/* Day columns */}
        {days.map((day, i) => {
          const dayStart = new Date(day)
          dayStart.setHours(dayStartHour, 0, 0, 0)
          const dayEnd = new Date(day)
          dayEnd.setHours(dayEndHour, 0, 0, 0)

          const dayEvents = filteredEvents.filter((e) => {
            const s = new Date(e.start)
            return s.toDateString() === day.toDateString() && e.type !== "assignment"
          })

          const dayGoogleEvents = googleCalendarEvents.filter((e) => {
            const s = new Date(e.startISO)
            return s.toDateString() === day.toDateString()
          })

          const freeSlots = getFreeSlots([...dayEvents, ...dayGoogleEvents.map((e) => ({ start: e.startISO, end: e.endISO }))], dayStart, dayEnd)

          const isToday = day.toDateString() === now.toDateString()

          return (
            <div
              key={i}
              ref={(el) => (columnRefs.current[i] = el)}
              className={cn(
                "relative cursor-pointer",
                i < days.length - 1 && "border-r border-border",
                isToday && "bg-primary/[0.04]"
              )}
              style={{ height: hours.length * hourHeight }}
              onDoubleClick={(e) => handleColumnDoubleClick(e, day, i)}
            >
              {hours.map((h) => (
                <div
                  key={h}
                  className="border-b border-border/60"
                  style={{ height: hourHeight }}
                />
              ))}

              {/* Live "Now" indicator, only in today's column */}
              {isToday && now.getHours() >= dayStartHour && now.getHours() < dayEndHour && (
                <div
                  className="pointer-events-none absolute left-0 right-0 z-20 flex items-center gap-1"
                  style={{ top: topOffset(now, dayStartHour, hourHeight) }}
                >
                  <span className="-translate-y-1/2 rounded-full bg-rose-500 px-1.5 py-0.5 text-[8px] font-bold uppercase text-white shadow-sm">
                    עכשיו
                  </span>
                  <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                  <div className="h-px flex-1 bg-rose-500/70" />
                </div>
              )}

              {/* Free slots */}
              {freeSlots.map((slot, idx) => (
                <div
                  key={`free-${idx}`}
                  style={{
                    top: topOffset(slot.start, dayStartHour, hourHeight),
                    height: blockHeight(slot.start, slot.end, hourHeight),
                  }}
                  className="absolute left-0.5 right-0.5 rounded-md border border-dashed border-emerald-tag/50 bg-emerald-tag/[0.06] px-1.5 py-0.5"
                  title={`פנוי: ${slot.start.toLocaleTimeString("he-IL", {
                    hour: "numeric",
                    minute: "2-digit",
                  })} - ${slot.end.toLocaleTimeString("he-IL", { hour: "numeric", minute: "2-digit" })}`}
                >
                  {blockHeight(slot.start, slot.end, hourHeight) > (compact ? 20 : 30) && (
                    <span className="flex items-center gap-1 text-[9px] font-medium text-emerald-700 dark:text-emerald-300">
                      <Sparkles className="h-2.5 w-2.5" />
                      פנוי
                    </span>
                  )}
                </div>
              ))}

              {/* External Google Calendar events (read-only, visually distinct) */}
              {dayGoogleEvents.map((ev) => {
                const start = new Date(ev.startISO)
                const end = new Date(ev.endISO)
                return (
                  <div
                    key={ev.calendarEventId}
                    style={{
                      top: topOffset(start, dayStartHour, hourHeight),
                      height: blockHeight(start, end, hourHeight),
                    }}
                    className={cn(
                      "absolute left-0.5 right-0.5 overflow-hidden rounded-md border border-dashed border-slate-400/60 bg-slate-400/[0.08] dark:border-slate-500/60 dark:bg-slate-500/10",
                      compact ? "px-1 py-0.5" : "px-1.5 py-1"
                    )}
                    title={`${ev.title} (יומן Google)`}
                  >
                    <p className="truncate text-[10px] font-semibold leading-tight text-slate-600 dark:text-slate-300">
                      G · {ev.title}
                    </p>
                    {!compact && (
                      <p className="truncate text-[9px] text-muted-foreground">
                        {start.toLocaleTimeString("he-IL", { hour: "numeric", minute: "2-digit" })}
                      </p>
                    )}
                  </div>
                )
              })}

              {/* Events (app-managed, draggable/resizable) */}
              {dayEvents.map((ev) => {
                const isDragging = drag?.eventId === ev.id
                const start = isDragging && drag.previewStart ? drag.previewStart : new Date(ev.start)
                const end = isDragging && drag.previewEnd ? drag.previewEnd : new Date(ev.end)
                const info = EVENT_TYPES[ev.type]
                const tag = COURSE_TAG_CLASSES[courseById[ev.courseId]?.color || info.color]
                return (
                  <div
                    key={ev.id}
                    style={{
                      top: topOffset(start, dayStartHour, hourHeight),
                      height: blockHeight(start, end, hourHeight),
                    }}
                    className={cn(
                      "group absolute left-0.5 right-0.5 overflow-hidden rounded-md border shadow-sm",
                      compact ? "px-1 py-0.5" : "px-1.5 py-1",
                      tag.bg,
                      tag.border,
                      isDragging ? "cursor-grabbing opacity-80 ring-2 ring-primary" : "cursor-grab"
                    )}
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => handlePointerDownMove(e, ev)}
                  >
                    <p className={cn("truncate text-[10px] font-semibold leading-tight", tag.text)}>
                      {ev.title}
                    </p>
                    {blockHeight(start, end, hourHeight) > (compact ? 24 : 0) && (
                      <p className="truncate text-[9px] text-muted-foreground">
                        {start.toLocaleTimeString("he-IL", { hour: "numeric", minute: "2-digit" })}
                      </p>
                    )}
                    {ev.location && blockHeight(start, end, hourHeight) > (compact ? 40 : 34) && (
                      <p className="truncate text-[9px] text-muted-foreground/80">{ev.location}</p>
                    )}
                    <div
                      className="absolute inset-x-0 bottom-0 h-3 cursor-ns-resize opacity-0 group-hover:opacity-100"
                      onPointerDown={(e) => handlePointerDownResize(e, ev)}
                    >
                      <div className="mx-auto h-0.5 w-6 rounded-full bg-current opacity-40" />
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
