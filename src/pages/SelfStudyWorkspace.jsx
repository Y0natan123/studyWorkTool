import React, { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import {
  Play,
  Pause,
  CheckCircle2,
  RotateCcw,
  SkipForward,
  ExternalLink,
  X,
  Tag,
  Inbox,
  Link2,
  Plus,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CircularTimer } from "@/components/ui/circular-timer"
import QuickCreateModal from "@/components/shared/QuickCreateModal"
import { cn } from "@/lib/utils"
import { HEATMAP_BLOCKS, RESOURCE_LINK_CATEGORIES } from "@/lib/constants"
import { useStudyStore } from "@/store/StudyStoreContext"

const MODES = {
  focus: { label: "פוקוס", minutes: 25 },
  short: { label: "הפסקה קצרה", minutes: 5 },
  long: { label: "הפסקה ארוכה", minutes: 15 },
}

const QUICK_TAGS = [
  { label: "לשאול את המתרגל", value: "⚠️ לשאול את המתרגל" },
  { label: "קשה — לחזור על זה", value: "🔁 קשה, לחזור על זה" },
  { label: "נושא למבחן", value: "🎯 נושא למבחן" },
]

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

export default function SelfStudyWorkspace() {
  const { courses, tasks, upsertCourseNote, logStudySession, toggleTaskDone, addResourceLink } =
    useStudyStore()
  const [courseId, setCourseId] = useState(courses[0]?.id || "")
  const [topic, setTopic] = useState("")
  const [mode, setMode] = useState("focus")
  const [secondsLeft, setSecondsLeft] = useState(MODES.focus.minutes * 60)
  const [running, setRunning] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [noteText, setNoteText] = useState("")
  const [justLogged, setJustLogged] = useState(false)
  const [checkedTaskIds, setCheckedTaskIds] = useState([])
  const [distractionText, setDistractionText] = useState("")
  const [distractions, setDistractions] = useState([])
  const [createTaskOpen, setCreateTaskOpen] = useState(false)
  const [addLinkOpen, setAddLinkOpen] = useState(false)
  const [newLinkLabel, setNewLinkLabel] = useState("")
  const [newLinkUrl, setNewLinkUrl] = useState("")
  const intervalRef = useRef(null)

  const totalSeconds = MODES[mode].minutes * 60

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => Math.max(s - 1, 0))
        setElapsedSeconds((s) => s + 1)
      }, 1000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running])

  // Auto-stop (but don't auto-log) when the countdown hits zero.
  useEffect(() => {
    if (secondsLeft === 0 && running) {
      setRunning(false)
    }
  }, [secondsLeft, running])

  // Switching courses mid-session would apply pending task checks to the wrong course's
  // list, so clear them (the checks aren't written to the store until Complete Session).
  useEffect(() => {
    setCheckedTaskIds([])
  }, [courseId])

  const selectMode = (nextMode) => {
    setMode(nextMode)
    if (!running) setSecondsLeft(MODES[nextMode].minutes * 60)
  }

  const handleSkip = () => {
    setRunning(false)
    setSecondsLeft(0)
  }

  const handleReset = () => {
    setRunning(false)
    setElapsedSeconds(0)
    setSecondsLeft(totalSeconds)
  }

  const handleQuickTag = (tagValue) => {
    setNoteText((prev) => (prev ? `${prev}\n\n**[${tagValue}]** ` : `**[${tagValue}]** `))
  }

  const handleAddLink = (e) => {
    e.preventDefault()
    if (!courseId || !newLinkLabel.trim() || !newLinkUrl.trim()) return
    addResourceLink(courseId, { label: newLinkLabel.trim(), url: newLinkUrl.trim(), category: "general" })
    setNewLinkLabel("")
    setNewLinkUrl("")
    setAddLinkOpen(false)
  }

  const handleAddDistraction = () => {
    if (!distractionText.trim()) return
    setDistractions((prev) => [...prev, { id: `d_${Date.now()}`, text: distractionText.trim() }])
    setDistractionText("")
  }

  const handleCompleteAndLog = () => {
    if (!courseId || elapsedSeconds === 0 || mode !== "focus") return
    setRunning(false)
    const minutes = Math.max(1, Math.round(elapsedSeconds / 60))
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10)
    logStudySession(courseId, minutes, dateStr, currentHeatmapBlock(now))

    if (noteText.trim()) {
      const title = topic.trim()
        ? `${topic.trim()} [${now.toLocaleDateString("he-IL")}]`
        : `סשן למידה עצמאית [${now.toLocaleDateString("he-IL")}]`
      upsertCourseNote(courseId, { title, contentMarkdown: noteText })
    }

    checkedTaskIds.forEach((taskId) => toggleTaskDone(taskId))

    setElapsedSeconds(0)
    setSecondsLeft(totalSeconds)
    setNoteText("")
    setTopic("")
    setCheckedTaskIds([])
    setDistractions([])
    setJustLogged(true)
    setTimeout(() => setJustLogged(false), 3000)
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0")
  const ss = String(secondsLeft % 60).padStart(2, "0")
  const elapsedPct = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0
  const selectedCourse = courses.find((c) => c.id === courseId)
  const courseTasks = tasks.filter((t) => t.courseId === courseId && t.status !== "done")
  const resourceLinks = selectedCourse?.resourceLinks || []

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="mx-auto grid max-w-6xl grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]"
    >
      <div className="flex flex-col gap-5">
        <div>
          <h2 className="text-lg font-semibold">למידה עצמאית</h2>
          <p className="text-sm text-muted-foreground">אין שיעור כרגע — זמן טוב ללמידה ממוקדת.</p>
        </div>

        <Card>
          <CardContent className="flex flex-col gap-3 pt-5">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {courses.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCourseId(c.id)}
                  className={cn(
                    "flex flex-col gap-0.5 rounded-lg border p-3 text-start transition-colors",
                    courseId === c.id
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:bg-accent"
                  )}
                >
                  <span className="text-xs font-semibold">{c.code}</span>
                  <span className="truncate text-[11px] text-muted-foreground">{c.name}</span>
                </button>
              ))}
            </div>
            <Input
              placeholder="על מה אתם עובדים? (לדוגמה: תרגיל בית 3)"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-none bg-primary text-primary-foreground shadow-lg">
          {running && (
            <motion.div
              className="pointer-events-none absolute inset-0 bg-white/5"
              animate={{ opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
          <CardContent className="relative flex flex-col items-center gap-6 py-10">
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
                disabled={!courseId}
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>הערות הסשן</CardTitle>
            <CardDescription>
              יישמר בהערות של {selectedCourse?.name || "הקורס הנבחר"} בסיום הסשן.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-1.5">
              {QUICK_TAGS.map((tag) => (
                <Button
                  key={tag.value}
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => handleQuickTag(tag.value)}
                >
                  <Tag className="h-3 w-3" />
                  {tag.label}
                </Button>
              ))}
            </div>
            <Textarea
              placeholder="על מה אתם עובדים?"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="min-h-[140px]"
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {justLogged ? "הסשן נשמר!" : `${Math.round(elapsedSeconds / 60)} דק׳ חלפו בסשן הזה`}
              </p>
              <Button
                size="sm"
                className="gap-1.5"
                disabled={!courseId || elapsedSeconds === 0 || mode !== "focus"}
                onClick={handleCompleteAndLog}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                השלם ורשום
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>משימות הקורס</CardTitle>
            <CardDescription>
              {selectedCourse ? `משימות פתוחות ל${selectedCourse.code}` : "בחרו קורס"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1.5">
            {courseTasks.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <Inbox className="h-6 w-6 text-muted-foreground/50" />
                <p className="text-xs text-muted-foreground">אין משימות פתוחות לקורס הזה.</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  disabled={!courseId}
                  onClick={() => setCreateTaskOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  צור משימה
                </Button>
              </div>
            )}
            {courseTasks.map((t) => {
              const checked = checkedTaskIds.includes(t.id)
              return (
                <button
                  key={t.id}
                  onClick={() =>
                    setCheckedTaskIds((prev) =>
                      checked ? prev.filter((id) => id !== t.id) : [...prev, t.id]
                    )
                  }
                  className="flex items-center gap-2 rounded-lg border border-border p-2 text-start text-xs transition-colors hover:bg-accent"
                >
                  <span
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                      checked ? "border-primary bg-primary text-primary-foreground" : "border-input"
                    )}
                  >
                    {checked && <CheckCircle2 className="h-3 w-3" />}
                  </span>
                  <span className={cn("truncate", checked && "text-muted-foreground line-through")}>
                    {t.title}
                  </span>
                </button>
              )
            })}
            {checkedTaskIds.length > 0 && (
              <p className="pt-1 text-[11px] text-muted-foreground">
                {checkedTaskIds.length} משימות יסומנו כהושלמו בלחיצה על השלם ורשום.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>משאבים מהירים</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1.5">
            {resourceLinks.length === 0 && !addLinkOpen && (
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <Link2 className="h-6 w-6 text-muted-foreground/50" />
                <p className="text-xs text-muted-foreground">אין קישורי משאבים שמורים לקורס הזה עדיין.</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  disabled={!courseId}
                  onClick={() => setAddLinkOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  הוסף קישור
                </Button>
              </div>
            )}
            {resourceLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-2 rounded-lg border border-border p-2 text-xs transition-colors hover:bg-accent"
              >
                <span className="truncate">
                  <span className="text-muted-foreground">
                    {RESOURCE_LINK_CATEGORIES[link.category]?.label || "קישור"} ·{" "}
                  </span>
                  {link.label}
                </span>
                <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
              </a>
            ))}
            {addLinkOpen ? (
              <form onSubmit={handleAddLink} className="flex flex-col gap-1.5 border-t border-border pt-2">
                <Input
                  placeholder="תווית (לדוגמה: שקפי הרצאה)"
                  value={newLinkLabel}
                  onChange={(e) => setNewLinkLabel(e.target.value)}
                  autoFocus
                />
                <div className="flex gap-1.5">
                  <Input
                    placeholder="https://..."
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" size="sm" className="shrink-0">
                    שמור
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => setAddLinkOpen(false)}
                  >
                    ביטול
                  </Button>
                </div>
              </form>
            ) : (
              resourceLinks.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-1 gap-1.5 self-start"
                  onClick={() => setAddLinkOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  הוסף קישור
                </Button>
              )
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>יומן הסחות דעת</CardTitle>
            <CardDescription>רשמו מחשבות לא רלוונטיות, ותחזרו לעניינים.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <div className="flex gap-1.5">
              <Input
                placeholder="לדוגמה: לקנות חלב"
                value={distractionText}
                onChange={(e) => setDistractionText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAddDistraction()
                  }
                }}
              />
              <Button size="sm" variant="outline" onClick={handleAddDistraction}>
                הוסף
              </Button>
            </div>
            {distractions.length > 0 && (
              <ul className="flex flex-col gap-1">
                {distractions.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-2 py-1 text-xs"
                  >
                    <span className="truncate">{d.text}</span>
                    <button
                      onClick={() => setDistractions((prev) => prev.filter((x) => x.id !== d.id))}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <QuickCreateModal
        open={createTaskOpen}
        onOpenChange={setCreateTaskOpen}
        initialCourseId={courseId}
        initialType="assignment"
      />
    </motion.div>
  )
}
