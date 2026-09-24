import React, { useEffect, useState } from "react"
import { FileText, BookOpen, Users, Lightbulb, PencilLine, Repeat } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useStudyStore } from "@/store/StudyStoreContext"

const MAX_RECURRING_OCCURRENCES = 52 // safety cap — a year of weekly occurrences

const TYPE_OPTIONS = [
  { value: "assignment", label: "מטלה", icon: FileText },
  { value: "lecture", label: "הרצאה", icon: BookOpen },
  { value: "tutorial", label: "תרגול", icon: Users },
  { value: "self-study", label: "למידה עצמאית", icon: Lightbulb },
]

const EFFORT_MIN = 15
const EFFORT_MAX = 180
const EFFORT_STEP = 15

function effortEmoji(minutes) {
  if (minutes <= 30) return "🙂"
  if (minutes <= 90) return "🤔"
  return "🥵"
}

// datetime-local inputs expect "YYYY-MM-DDTHH:mm" in local time, not UTC.
export function toLocalDatetimeInputValue(date) {
  const pad = (n) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function defaultDueDate() {
  const d = new Date()
  d.setHours(d.getHours() + 2, 0, 0, 0)
  return toLocalDatetimeInputValue(d)
}

export default function QuickCreateModal({
  open,
  onOpenChange,
  initialName = "",
  initialCourseId = "",
  initialType = "assignment",
  initialDueDate = null,
  initialEffort = "60",
}) {
  const { courses, addEvent, addTask } = useStudyStore()
  const [name, setName] = useState("")
  const [courseId, setCourseId] = useState("")
  const [type, setType] = useState("assignment")
  const [dueDate, setDueDate] = useState(defaultDueDate())
  const [effort, setEffort] = useState("60")
  const [location, setLocation] = useState("")
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurUntil, setRecurUntil] = useState("")
  const [deadlineOnly, setDeadlineOnly] = useState(false)

  useEffect(() => {
    if (open) {
      setName(initialName)
      setCourseId(initialCourseId || courses[0]?.id || "")
      setType(initialType)
      setDueDate(initialDueDate || defaultDueDate())
      setEffort(initialEffort)
      setLocation("")
      setIsRecurring(false)
      setRecurUntil("")
      setDeadlineOnly(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    if (isRecurring && !recurUntil) return

    const durationMs = deadlineOnly ? 0 : (Number(effort) || 30) * 60_000
    const firstStart = new Date(dueDate)
    const untilDate = isRecurring ? new Date(`${recurUntil}T23:59:59`) : null

    const occurrenceStarts = [firstStart]
    if (isRecurring && untilDate) {
      let next = new Date(firstStart.getTime() + 7 * 24 * 3600_000)
      while (next <= untilDate && occurrenceStarts.length < MAX_RECURRING_OCCURRENCES) {
        occurrenceStarts.push(next)
        next = new Date(next.getTime() + 7 * 24 * 3600_000)
      }
    }

    occurrenceStarts.forEach((start) => {
      const end = new Date(start.getTime() + durationMs)

      if (type === "assignment") {
        addTask({
          title: name.trim(),
          courseId: courseId || null,
          status: "todo",
          priority: "medium",
          dueDate: start.toISOString(),
          estimateMinutes: deadlineOnly ? null : Number(effort) || 30,
        })
      }

      // Always create a schedule event too, so it shows on the weekly grid.
      addEvent({
        title: name.trim(),
        courseId: courseId || null,
        type,
        start: start.toISOString(),
        end: end.toISOString(),
        location: location.trim() || undefined,
      })
    })

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <PencilLine className="h-5 w-5" />
            צור משימה
          </DialogTitle>
          <DialogDescription>
            תיעוד מהיר — הוסיפו אותה ללוח ותנו לה רגע על השעון.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="qc-name" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              שם
            </Label>
            <Input
              id="qc-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="לדוגמה: תרגיל בית 5"
              required
              className="rounded-full px-4"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">סוג</Label>
            <div className="flex flex-wrap gap-2">
              {TYPE_OPTIONS.map((t) => {
                const Icon = t.icon
                const isActive = type === t.value
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "border-transparent bg-primary text-primary-foreground"
                        : "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/70"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {t.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">קורס</Label>
            <div className="flex flex-wrap gap-2">
              {courses.map((c) => {
                const isActive = courseId === c.id
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCourseId(c.id)}
                    className={cn(
                      "rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "border-transparent bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground hover:bg-accent"
                    )}
                  >
                    {c.name}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_140px]">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="qc-due" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                תאריך ויעד
              </Label>
              <Input
                id="qc-due"
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="rounded-full px-4"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="qc-location"
                className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                מיקום
              </Label>
              <Input
                id="qc-location"
                placeholder="אולם B"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="rounded-full px-4"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-2xl bg-secondary/60 p-4">
            <button
              type="button"
              onClick={() => setIsRecurring((r) => !r)}
              className="flex items-center gap-2 text-sm font-medium"
            >
              <span
                className={cn(
                  "flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border",
                  isRecurring ? "border-primary bg-primary" : "border-input"
                )}
              />
              <Repeat className="h-3.5 w-3.5 text-muted-foreground" />
              חזור שבועי
            </button>
            {isRecurring && (
              <div className="flex flex-col gap-1.5 ps-6">
                <Label
                  htmlFor="qc-recur-until"
                  className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  חזור עד תאריך
                </Label>
                <Input
                  id="qc-recur-until"
                  type="date"
                  value={recurUntil}
                  onChange={(e) => setRecurUntil(e.target.value)}
                  min={dueDate.slice(0, 10)}
                  required={isRecurring}
                  className="max-w-[200px] rounded-full px-4"
                />
                <p className="text-[11px] text-muted-foreground">
                  ייצור מופע אחד לכל שבוע, מתאריך היעד ועד התאריך שנבחר (עד {MAX_RECURRING_OCCURRENCES}{" "}
                  מופעים).
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 rounded-2xl bg-secondary/60 p-4">
            <button
              type="button"
              onClick={() => setDeadlineOnly((d) => !d)}
              className="flex items-center gap-2 text-sm font-medium"
            >
              <span
                className={cn(
                  "flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border",
                  deadlineOnly ? "border-primary bg-primary" : "border-input"
                )}
              />
              רק תאריך יעד, בלי הערכת זמן עבודה
            </button>
            <p className="ps-6 text-[11px] text-muted-foreground">
              לדוגמה: הגשת תרגיל בית — רק דדליין, בלי צורך לתזמן זמן עבודה עליה.
            </p>
          </div>

          {!deadlineOnly && (
            <div className="flex flex-col gap-3 rounded-2xl bg-secondary/60 p-4">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="qc-effort"
                  className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  מאמץ משוער
                </Label>
                <span className="flex items-center gap-1.5 text-sm font-semibold">
                  <span aria-hidden>{effortEmoji(Number(effort))}</span>
                  {effort} דק׳
                </span>
              </div>
              <input
                id="qc-effort"
                type="range"
                min={EFFORT_MIN}
                max={EFFORT_MAX}
                step={EFFORT_STEP}
                value={effort}
                onChange={(e) => setEffort(e.target.value)}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted-foreground/20 accent-primary"
              />
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>קצר</span>
                <span>עבודה מעמיקה</span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => onOpenChange(false)}
            >
              ביטול
            </Button>
            <Button
              type="submit"
              className="rounded-full"
              disabled={isRecurring && !recurUntil}
            >
              צור משימה
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
