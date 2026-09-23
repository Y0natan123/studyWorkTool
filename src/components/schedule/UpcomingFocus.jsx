import React, { useMemo, useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, RotateCcw, CheckCircle2, Clock } from "lucide-react"
import { EVENT_TYPES } from "@/lib/constants"
import { useStudyStore } from "@/store/StudyStoreContext"

function formatCountdown(ms) {
  if (ms <= 0) return "עכשיו"
  const mins = Math.floor(ms / 60000)
  const hrs = Math.floor(mins / 60)
  const days = Math.floor(hrs / 24)
  if (days > 0) return `${days} ימים ${hrs % 24} שעות`
  if (hrs > 0) return `${hrs} שעות ${mins % 60} דק׳`
  return `${mins} דק׳`
}

export default function UpcomingFocus() {
  const { events, courses, tasks, toggleTaskDone } = useStudyStore()
  const [now, setNow] = useState(Date.now())
  const [focusRunning, setFocusRunning] = useState(false)
  const [focusSeconds, setFocusSeconds] = useState(25 * 60)
  const intervalRef = useRef(null)

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (focusRunning) {
      intervalRef.current = setInterval(() => {
        setFocusSeconds((s) => (s > 0 ? s - 1 : 0))
      }, 1000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [focusRunning])

  const next = useMemo(() => {
    const upcoming = events
      .filter((e) => new Date(e.start).getTime() >= now - 5 * 60_000)
      .sort((a, b) => new Date(a.start) - new Date(b.start))
    return upcoming[0] || null
  }, [events, now])

  const nextTask = useMemo(() => {
    return tasks
      .filter((t) => t.status !== "done")
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0]
  }, [tasks])

  const course = courses.find((c) => c.id === next?.courseId)
  const typeInfo = next ? EVENT_TYPES[next.type] : null

  const mm = String(Math.floor(focusSeconds / 60)).padStart(2, "0")
  const ss = String(focusSeconds % 60).padStart(2, "0")

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>בהמשך</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {next ? (
          <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-muted/40 p-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <Badge variant={typeInfo?.color || "indigo"} className="text-[10px]">
                  {typeInfo?.label}
                </Badge>
                {course && (
                  <span className="text-[10px] font-medium text-muted-foreground">{course.code}</span>
                )}
              </div>
              <p className="mt-1 truncate text-sm font-semibold">{next.title}</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                בעוד {formatCountdown(new Date(next.start).getTime() - now)}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">אין אירועים מתוכננים. תיהנו מההפסקה!</p>
        )}

        {nextTask && (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-border p-3">
            <div className="min-w-0">
              <p className="truncate text-xs font-medium">{nextTask.title}</p>
              <p className="text-[11px] text-muted-foreground">
                מועד הגשה {new Date(nextTask.dueDate).toLocaleDateString("he-IL", { month: "short", day: "numeric" })}
              </p>
            </div>
            <Button size="sm" variant="outline" className="shrink-0 gap-1" onClick={() => toggleTaskDone(nextTask.id)}>
              <CheckCircle2 className="h-3.5 w-3.5" />
              סמן כהושלם
            </Button>
          </div>
        )}

        <div className="flex items-center justify-between rounded-lg bg-primary/5 p-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground">טיימר פוקוס</p>
            <p className="font-mono text-lg font-semibold tabular-nums">
              {mm}:{ss}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setFocusRunning((r) => !r)}>
              {focusRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8"
              onClick={() => {
                setFocusRunning(false)
                setFocusSeconds(25 * 60)
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
