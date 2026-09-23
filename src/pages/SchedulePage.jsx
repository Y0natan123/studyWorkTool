import React, { useEffect, useMemo, useRef, useState } from "react"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight, Clock, CircleDot, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import MiniCalendar from "@/components/schedule/MiniCalendar"
import UpcomingFocus from "@/components/schedule/UpcomingFocus"
import CategoryFilters from "@/components/schedule/CategoryFilters"
import WeeklyGrid from "@/components/schedule/WeeklyGrid"
import QuickCreateModal, { toLocalDatetimeInputValue } from "@/components/shared/QuickCreateModal"
import { useStudyStore } from "@/store/StudyStoreContext"
import { useIsMobile } from "@/hooks/useIsMobile"
import { cn } from "@/lib/utils"

const WEEK_WAKING_HOURS = 7 * 16 // rough "available" hours/week (16h/day) for the free-time stat

const ALL_TYPES = ["lecture", "tutorial", "assignment", "self-study"]
const SWIPE_THRESHOLD_PX = 50

export default function SchedulePage() {
  const {
    events,
    courses,
    updateEvent,
    settings,
    googleCalendarEvents,
    pullGoogleCalendarEvents,
  } = useStudyStore()
  const isMobile = useIsMobile()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [weekAnchor, setWeekAnchor] = useState(new Date())
  const [activeFilters, setActiveFilters] = useState(ALL_TYPES)
  const [slotModalDate, setSlotModalDate] = useState(null)
  const [viewMode, setViewMode] = useState("week") // "week" | "day" — desktop only; mobile always shows day
  const touchStartX = useRef(null)
  const showDayView = isMobile || viewMode === "day"

  // Refetch external Google Calendar events whenever the visible week changes.
  useEffect(() => {
    if (!settings.syncEnabled || !settings.appsScriptUrl?.trim()) return
    const start = new Date(weekAnchor)
    start.setDate(start.getDate() - start.getDay())
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(end.getDate() + 7)
    pullGoogleCalendarEvents(start.toISOString(), end.toISOString())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekAnchor, settings.syncEnabled, settings.appsScriptUrl])

  const toggleFilter = (key) => {
    setActiveFilters((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))
  }

  const shiftWeek = (delta) => {
    setWeekAnchor((prev) => {
      const d = new Date(prev)
      d.setDate(d.getDate() + delta * 7)
      return d
    })
  }

  const shiftDay = (delta) => {
    setSelectedDate((prev) => {
      const d = new Date(prev)
      d.setDate(d.getDate() + delta)
      return d
    })
  }

  const weekLabel = (() => {
    const start = new Date(weekAnchor)
    start.setDate(start.getDate() - start.getDay())
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    return `${start.toLocaleDateString("he-IL", { month: "short", day: "numeric" })} – ${end.toLocaleDateString(
      "he-IL",
      { month: "short", day: "numeric" }
    )}`
  })()

  const weekStats = useMemo(() => {
    const start = new Date(weekAnchor)
    start.setDate(start.getDate() - start.getDay())
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(end.getDate() + 7)

    const weekEvents = events.filter((e) => {
      const s = new Date(e.start).getTime()
      return s >= start.getTime() && s < end.getTime() && e.type !== "assignment"
    })
    const scheduledHours = weekEvents.reduce(
      (sum, e) => sum + (new Date(e.end).getTime() - new Date(e.start).getTime()) / 3600000,
      0
    )
    const courseIds = new Set(weekEvents.map((e) => e.courseId).filter(Boolean))

    return {
      scheduledHours: Math.round(scheduledHours),
      freeHours: Math.max(0, Math.round(WEEK_WAKING_HOURS - scheduledHours)),
      courseCount: courseIds.size,
    }
  }, [events, weekAnchor])

  const dayStrip = (() => {
    const strip = []
    for (let offset = -2; offset <= 2; offset++) {
      const d = new Date(selectedDate)
      d.setDate(d.getDate() + offset)
      strip.push(d)
    }
    return strip
  })()

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e) => {
    if (touchStartX.current == null) return
    const deltaX = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(deltaX) > SWIPE_THRESHOLD_PX) {
      shiftDay(deltaX < 0 ? 1 : -1)
    }
    touchStartX.current = null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_1fr]"
    >
      <div className="order-2 flex flex-col gap-5 lg:order-1">
        <MiniCalendar
          events={events}
          courses={courses}
          selectedDate={selectedDate}
          onSelectDate={(d) => {
            setSelectedDate(d)
            setWeekAnchor(d)
          }}
        />
        <UpcomingFocus />
        {!isMobile && <CategoryFilters active={activeFilters} onToggle={toggleFilter} />}
      </div>

      <div className="order-1 flex flex-col gap-3 lg:order-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">יומן</h1>
          <p className="text-sm text-muted-foreground">
            השבוע שלך, מסודר בבירור — {weekStats.scheduledHours} שעות מתוכננות,{" "}
            {weekStats.freeHours} פנויות.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          {isMobile ? (
            <h2 className="text-sm font-semibold text-muted-foreground">מערכת שעות היום</h2>
          ) : (
            <Tabs value={viewMode} onValueChange={setViewMode}>
              <TabsList>
                <TabsTrigger value="week">שבוע</TabsTrigger>
                <TabsTrigger value="day">יום</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => (showDayView ? setSelectedDate(new Date()) : setWeekAnchor(new Date()))}
            >
              היום
            </Button>
            {!isMobile && (
              <div className="flex items-center gap-1 rounded-full border border-border bg-card px-1 py-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full"
                  onClick={() => (showDayView ? shiftDay(-1) : shiftWeek(-1))}
                >
                  {/* RTL: "previous" (backward in time) visually points right */}
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <span className="min-w-[110px] text-center text-sm font-medium text-muted-foreground">
                  {showDayView
                    ? selectedDate.toLocaleDateString("he-IL", { month: "short", day: "numeric" })
                    : weekLabel}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full"
                  onClick={() => (showDayView ? shiftDay(1) : shiftWeek(1))}
                >
                  {/* RTL: "next" (forward in time) visually points left */}
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {isMobile && (
          <div className="flex items-center justify-between gap-1.5">
            {dayStrip.map((d) => {
              const isSelected = d.toDateString() === selectedDate.toDateString()
              const isToday = d.toDateString() === new Date().toDateString()
              return (
                <button
                  key={d.toISOString()}
                  onClick={() => setSelectedDate(d)}
                  className={cn(
                    "flex flex-1 flex-col items-center gap-1 rounded-xl py-2 transition-colors",
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : isToday
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent"
                  )}
                >
                  <span className="text-[10px] font-medium uppercase">
                    {d.toLocaleDateString("he-IL", { weekday: "short" })}
                  </span>
                  <span className="text-sm font-semibold">{d.getDate()}</span>
                </button>
              )
            })}
          </div>
        )}

        {isMobile && <CategoryFilters active={activeFilters} onToggle={toggleFilter} variant="chips" />}

        <div onTouchStart={isMobile ? handleTouchStart : undefined} onTouchEnd={isMobile ? handleTouchEnd : undefined}>
          <WeeklyGrid
            events={events}
            courses={courses}
            activeFilters={activeFilters}
            weekAnchor={weekAnchor}
            singleDay={showDayView}
            compact={isMobile}
            dayAnchor={selectedDate}
            googleCalendarEvents={googleCalendarEvents}
            onSlotClick={(date) => setSlotModalDate(date)}
            onEventChange={(id, patch) => updateEvent(id, patch)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-secondary/60 px-4 py-3 text-xs font-medium text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {weekStats.scheduledHours} שעות מתוכננות השבוע
          </span>
          <span className="flex items-center gap-1.5">
            <CircleDot className="h-3.5 w-3.5" />
            {weekStats.freeHours} שעות פנויות
          </span>
          <span className="flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            {weekStats.courseCount} קורסים
          </span>
        </div>
      </div>

      <QuickCreateModal
        open={!!slotModalDate}
        onOpenChange={(open) => !open && setSlotModalDate(null)}
        initialType="self-study"
        initialDueDate={slotModalDate ? toLocalDatetimeInputValue(slotModalDate) : null}
      />
    </motion.div>
  )
}
