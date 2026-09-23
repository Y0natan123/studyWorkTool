import React, { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Play, Pause, RotateCcw, SkipForward, Plus, ArrowLeft } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CircularTimer } from "@/components/ui/circular-timer"
import QuickCreateModal from "@/components/shared/QuickCreateModal"
import TodayScheduleStrip from "@/components/schedule/TodayScheduleStrip"
import WeeklyBarStrip from "@/components/dashboard/WeeklyBarStrip"
import { cn } from "@/lib/utils"
import { useStudyStore } from "@/store/StudyStoreContext"
import { useIsMobile } from "@/hooks/useIsMobile"

const MODES = {
  focus: { label: "פוקוס", minutes: 25 },
  short: { label: "הפסקה קצרה", minutes: 5 },
  long: { label: "הפסקה ארוכה", minutes: 15 },
}

function findActiveClassEvent(events, nowMs) {
  return (
    events.find((e) => {
      if (e.type !== "lecture" && e.type !== "tutorial") return false
      const start = new Date(e.start).getTime()
      const end = new Date(e.end).getTime()
      return nowMs >= start && nowMs <= end
    }) || null
  )
}

function greeting(hour) {
  if (hour < 12) return "בוקר טוב"
  if (hour < 18) return "צהריים טובים"
  return "ערב טוב"
}

export default function TodayPage({ onNavigate }) {
  const { events, courses, tasks, toggleTaskDone, googleCalendarEvents, studyHistory, settings } =
    useStudyStore()
  const isMobile = useIsMobile()
  const [now, setNow] = useState(Date.now())
  const [mode, setMode] = useState("focus")
  const [secondsLeft, setSecondsLeft] = useState(MODES.focus.minutes * 60)
  const [running, setRunning] = useState(false)
  const [createTaskOpen, setCreateTaskOpen] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setSecondsLeft((s) => Math.max(s - 1, 0)), 1000)
    return () => clearInterval(t)
  }, [running])

  useEffect(() => {
    if (secondsLeft === 0 && running) setRunning(false)
  }, [secondsLeft, running])

  const nowDate = new Date(now)
  const activeEvent = useMemo(() => findActiveClassEvent(events, now), [events, now])

  const totalSeconds = MODES[mode].minutes * 60
  const elapsedPct = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0")
  const ss = String(secondsLeft % 60).padStart(2, "0")

  const selectMode = (nextMode) => {
    setMode(nextMode)
    if (!running) setSecondsLeft(MODES[nextMode].minutes * 60)
  }

  const handleReset = () => {
    setRunning(false)
    setSecondsLeft(totalSeconds)
  }

  const handleSkip = () => {
    setRunning(false)
    setSecondsLeft(0)
  }

  const todayStr = nowDate.toDateString()
  const todaysTasks = useMemo(() => {
    return tasks
      .filter((t) => new Date(t.dueDate).toDateString() === todayStr || t.status === "in-progress")
      .slice(0, 6)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, todayStr])
  const doneCount = todaysTasks.filter((t) => t.status === "done").length

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_220px]"
    >
      {/* Main column: greeting, timer + tasks, weekly bar strip */}
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {greeting(nowDate.getHours())}
            {settings.userName ? `, ${settings.userName}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground">בוא נעשה את היום הזה שווה.</p>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Focus timer — dark navy block */}
        <Card className="border-none bg-primary text-primary-foreground shadow-lg">
          <CardContent className="flex flex-col items-center gap-4 px-4 py-6 sm:gap-6 sm:py-10">
            <Tabs value={mode} onValueChange={selectMode}>
              <TabsList className="bg-white/10">
                {Object.entries(MODES).map(([key, m]) => (
                  <TabsTrigger
                    key={key}
                    value={key}
                    disabled={running}
                    className="text-white/70 data-[state=active]:bg-white data-[state=active]:text-primary"
                  >
                    {m.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <CircularTimer
              pct={elapsedPct}
              label={`${mm}:${ss}`}
              sublabel={`סשן ${MODES[mode].label}`}
              ringClassName="text-white"
              className="text-white/20"
              size={isMobile ? 190 : 260}
            />

            <div className="flex items-center gap-3">
              <Button
                size="icon"
                variant="ghost"
                className="h-11 w-11 rounded-full text-white/70 hover:bg-white/10 hover:text-white"
                onClick={handleReset}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                className="h-14 w-14 rounded-full bg-white text-primary shadow-md hover:bg-white/90"
                onClick={() => setRunning((r) => !r)}
              >
                {running ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-11 w-11 rounded-full text-white/70 hover:bg-white/10 hover:text-white"
                onClick={handleSkip}
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 text-white/70 hover:bg-white/10 hover:text-white"
              onClick={() => onNavigate?.("live")}
            >
              {activeEvent ? `הצטרפות ל${activeEvent.title}` : "פתח סביבת עבודה מלאה"}
              <ArrowLeft className="h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>

        {/* Today's Tasks — light warm card */}
        <Card>
          <CardContent className="flex flex-col gap-3 py-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">משימות היום</h2>
              <span className="text-xs font-medium text-muted-foreground">
                {doneCount}/{todaysTasks.length} הושלמו
              </span>
            </div>

            <div className="flex flex-col gap-1">
              {todaysTasks.length === 0 && (
                <p className="py-3 text-center text-xs text-muted-foreground">אין משימות להיום.</p>
              )}
              {todaysTasks.map((t) => {
                const taskCourse = courses.find((c) => c.id === t.courseId)
                const done = t.status === "done"
                return (
                  <button
                    key={t.id}
                    onClick={() => toggleTaskDone(t.id)}
                    className="flex items-center gap-2.5 rounded-lg px-1.5 py-2 text-start transition-colors hover:bg-accent"
                  >
                    <span
                      className={cn(
                        "flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                        done ? "border-primary bg-primary" : "border-muted-foreground/30"
                      )}
                    >
                      {done && <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
                    </span>
                    <span
                      className={cn(
                        "flex-1 truncate text-sm",
                        done && "text-muted-foreground line-through"
                      )}
                    >
                      {t.title}
                    </span>
                    {taskCourse && (
                      <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-secondary-foreground">
                        {taskCourse.code}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="mt-1 gap-1.5 rounded-xl border-dashed"
              onClick={() => setCreateTaskOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              הוסף משימה
            </Button>
          </CardContent>
        </Card>
        </div>

        {/* This week */}
        <WeeklyBarStrip data={studyHistory} />
      </div>

      {/* Today's schedule — independent side column, full height, vertical list, no container */}
      <div className="flex flex-col gap-3 lg:sticky lg:top-6">
        <h2 className="text-sm font-semibold text-muted-foreground">מערכת שעות היום</h2>
        <TodayScheduleStrip
          events={events}
          courses={courses}
          googleCalendarEvents={googleCalendarEvents}
          vertical
          compact
        />
      </div>

      <QuickCreateModal open={createTaskOpen} onOpenChange={setCreateTaskOpen} initialType="assignment" />
    </motion.div>
  )
}
