import React from "react"
import { cn } from "@/lib/utils"
import { EVENT_TYPES, COURSE_TAG_CLASSES } from "@/lib/constants"

// A compact list of today's events, time-ordered. Read-only (no drag/resize) — for the
// WeeklyGrid's interactive hour-grid, use WeeklyGrid itself. `vertical` switches from a
// horizontal scroll row to a stacked vertical list (e.g. to sit beside a tasks card).
// `compact` drops the card/border container per item in favor of a thin accent stripe +
// divider lines, for use as a narrow, containerless side column.
export default function TodayScheduleStrip({
  events,
  courses,
  googleCalendarEvents = [],
  vertical = false,
  compact = false,
}) {
  const todayStr = new Date().toDateString()
  const courseById = {}
  courses.forEach((c) => (courseById[c.id] = c))

  const todaysEvents = events
    .filter((e) => new Date(e.start).toDateString() === todayStr)
    .map((e) => ({ ...e, kind: "app" }))

  const todaysGoogleEvents = googleCalendarEvents
    .filter((e) => new Date(e.startISO).toDateString() === todayStr)
    .map((e) => ({
      id: e.calendarEventId,
      title: e.title,
      start: e.startISO,
      end: e.endISO,
      kind: "google",
    }))

  const all = [...todaysEvents, ...todaysGoogleEvents].sort(
    (a, b) => new Date(a.start) - new Date(b.start)
  )

  if (all.length === 0) {
    return (
      <div
        className={cn(
          "text-sm text-muted-foreground",
          compact ? "py-4 text-start" : "rounded-2xl border border-dashed border-border p-6 text-center"
        )}
      >
        אין אירועים מתוכננים היום.
      </div>
    )
  }

  if (compact) {
    return (
      <div className="flex flex-col divide-y divide-border">
        {all.map((ev) => {
          const start = new Date(ev.start)
          const end = new Date(ev.end)
          const course = courseById[ev.courseId]
          const info = ev.kind === "app" ? EVENT_TYPES[ev.type] : null
          const tag = ev.kind === "app" ? COURSE_TAG_CLASSES[course?.color || info?.color] : null

          return (
            <div key={ev.id} className="flex items-start gap-2 py-2.5">
              <span
                className={cn(
                  "mt-1 h-2 w-2 shrink-0 rounded-full",
                  ev.kind === "google" ? "bg-slate-400" : tag.solid
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{ev.title}</p>
                <p className="text-[11px] text-muted-foreground">
                  {start.toLocaleTimeString("he-IL", { hour: "numeric", minute: "2-digit" })} –{" "}
                  {end.toLocaleTimeString("he-IL", { hour: "numeric", minute: "2-digit" })}
                </p>
                {ev.location && (
                  <p className="truncate text-[10px] text-muted-foreground/70">{ev.location}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div
      className={cn(
        vertical
          ? "flex flex-col gap-2"
          : "flex gap-3 overflow-x-auto scrollbar-none pb-1"
      )}
    >
      {all.map((ev) => {
        const start = new Date(ev.start)
        const end = new Date(ev.end)
        const course = courseById[ev.courseId]
        const info = ev.kind === "app" ? EVENT_TYPES[ev.type] : null
        const tag = ev.kind === "app" ? COURSE_TAG_CLASSES[course?.color || info?.color] : null

        return (
          <div
            key={ev.id}
            className={cn(
              "flex flex-col gap-1 rounded-2xl border p-3",
              vertical ? "w-full" : "min-w-[160px] shrink-0",
              ev.kind === "google"
                ? "border-dashed border-slate-400/60 bg-slate-400/[0.06]"
                : cn(tag.border, tag.bg)
            )}
          >
            <span
              className={cn(
                "text-[10px] font-semibold uppercase tracking-wide",
                ev.kind === "google" ? "text-slate-500" : tag.text
              )}
            >
              {ev.kind === "google" ? "יומן Google" : course?.code || info?.label}
            </span>
            <p className="truncate text-sm font-medium">{ev.title}</p>
            <p className="text-xs text-muted-foreground">
              {start.toLocaleTimeString("he-IL", { hour: "numeric", minute: "2-digit" })} –{" "}
              {end.toLocaleTimeString("he-IL", { hour: "numeric", minute: "2-digit" })}
            </p>
            {ev.location && (
              <p className="truncate text-[11px] text-muted-foreground/80">{ev.location}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
