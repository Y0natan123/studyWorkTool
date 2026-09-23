import React, { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { CalendarPlus, Save, Tag } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { EVENT_TYPES, HEATMAP_BLOCKS } from "@/lib/constants"
import { useStudyStore } from "@/store/StudyStoreContext"
import QuickCreateModal, { toLocalDatetimeInputValue } from "@/components/shared/QuickCreateModal"
import SelfStudyWorkspace from "@/pages/SelfStudyWorkspace"

const QUICK_TAGS = ["חשוב", "חומר למבחן", "צריך לחזור על זה"]

function currentHeatmapBlock(date) {
  const hour = date.getHours()
  if (hour >= 6 && hour < 9) return "6-9"
  if (hour >= 9 && hour < 12) return "9-12"
  if (hour >= 12 && hour < 15) return "12-15"
  if (hour >= 15 && hour < 18) return "15-18"
  if (hour >= 18 && hour < 21) return "18-21"
  if (hour >= 21 || hour < 6) return "21-24"
  return HEATMAP_BLOCKS[0]
}

// Finds a lecture/tutorial event covering `now`, if any.
function findActiveClassEvent(events, now) {
  const t = now.getTime()
  return (
    events.find((e) => {
      if (e.type !== "lecture" && e.type !== "tutorial") return false
      const start = new Date(e.start).getTime()
      const end = new Date(e.end).getTime()
      return t >= start && t <= end
    }) || null
  )
}


export default function LiveClassDashboard() {
  const { courses, events, upsertCourseNote, logStudySession } = useStudyStore()
  const [now, setNow] = useState(Date.now())
  const [noteId, setNoteId] = useState(null)
  const [noteText, setNoteText] = useState("")
  const [reviewModalOpen, setReviewModalOpen] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const activeEvent = useMemo(() => findActiveClassEvent(events, new Date(now)), [events, now])

  // Reset the notes draft whenever the active class changes (including going from "some
  // class" to "no class"), so stale text/save-state from a previous session never lingers.
  useEffect(() => {
    setNoteId(null)
    setNoteText("")
  }, [activeEvent?.id])

  const course = courses.find((c) => c.id === activeEvent?.courseId)
  const typeInfo = activeEvent ? EVENT_TYPES[activeEvent.type] : null

  const start = activeEvent ? new Date(activeEvent.start).getTime() : 0
  const end = activeEvent ? new Date(activeEvent.end).getTime() : 0
  const totalMs = Math.max(end - start, 1)
  const elapsedMs = Math.min(Math.max(now - start, 0), totalMs)
  const remainingMs = Math.max(end - now, 0)
  const progressPct = Math.min(100, Math.round((elapsedMs / totalMs) * 100))

  const elapsedMin = Math.round(elapsedMs / 60000)
  const totalMin = Math.round(totalMs / 60000)
  const remainingMin = Math.round(remainingMs / 60000)

  // Debounced autosave: write to the course's notes array ~1s after the last keystroke.
  useEffect(() => {
    if (!noteText.trim() || !course || !activeEvent) return
    const t = setTimeout(() => {
      const id = upsertCourseNote(course.id, {
        id: noteId,
        title: `${activeEvent.title} [${new Date(activeEvent.start).toLocaleDateString("he-IL")}]`,
        contentMarkdown: noteText,
      })
      setNoteId(id)
    }, 1000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteText])

  const handleQuickTag = (tag) => {
    setNoteText((prev) => (prev ? `${prev}\n\n**[${tag}]** ` : `**[${tag}]** `))
  }

  const handleLogSession = () => {
    if (!course) return
    const nowDate = new Date(now)
    const dateStr = nowDate.toISOString().slice(0, 10)
    logStudySession(course.id, elapsedMin, dateStr, currentHeatmapBlock(nowDate))
  }

  const reviewDefaultStart = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    d.setHours(18, 0, 0, 0)
    return toLocalDatetimeInputValue(d)
  }, [])

  if (!activeEvent) {
    return <SelfStudyWorkspace />
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="mx-auto flex max-w-3xl flex-col gap-5"
    >
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
        </span>
        <h2 className="text-lg font-semibold">שיעור פעיל</h2>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-1.5">
            <Badge variant={typeInfo?.color || "indigo"}>{typeInfo?.label}</Badge>
            {course && <span className="text-xs font-medium text-muted-foreground">{course.code}</span>}
          </div>
          <CardTitle className="text-xl">{activeEvent.title}</CardTitle>
          <CardDescription>{course?.name}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <p className="font-mono text-2xl font-semibold tabular-nums">
              {elapsedMin} / {totalMin} דק׳ עברו
            </p>
            <p className="text-sm text-muted-foreground">{remainingMin} דק׳ נותרו</p>
          </div>
          <Progress value={progressPct} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>הערות מהירות ותובנות עיקריות</CardTitle>
          <CardDescription>נשמר אוטומטית להערות של {course?.name || "הקורס הזה"}.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-1.5">
            {QUICK_TAGS.map((tag) => (
              <Button key={tag} size="sm" variant="outline" className="gap-1.5" onClick={() => handleQuickTag(tag)}>
                <Tag className="h-3 w-3" />
                {tag}
              </Button>
            ))}
          </div>
          <Textarea
            placeholder="כתבו מה קורה בשיעור כרגע…"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            className="min-h-[160px]"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {noteId ? "נשמר" : noteText.trim() ? "שומר…" : "עדיין לא נכתב דבר"}
            </p>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={handleLogSession}>
              <Save className="h-3.5 w-3.5" />
              רשום סשן ({elapsedMin} דק׳)
            </Button>
          </div>
        </CardContent>
      </Card>

      <Button size="lg" className="gap-2" onClick={() => setReviewModalOpen(true)}>
        <CalendarPlus className="h-4 w-4" />
        קבע סשן חזרה
      </Button>

      <QuickCreateModal
        open={reviewModalOpen}
        onOpenChange={setReviewModalOpen}
        initialName={course ? `חזרה: ${course.name}` : "סשן חזרה"}
        initialCourseId={course?.id || ""}
        initialType="self-study"
        initialDueDate={reviewDefaultStart}
        initialEffort="120"
      />
    </motion.div>
  )
}
