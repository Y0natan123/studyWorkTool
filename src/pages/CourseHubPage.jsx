import React, { useState } from "react"
import { motion } from "framer-motion"
import {
  ExternalLink,
  Plus,
  Trash2,
  ArrowRight,
  BookOpen,
  Clock,
  ListChecks,
  StickyNote,
  BellRing,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { RESOURCE_LINK_CATEGORIES } from "@/lib/constants"
import { useStudyStore } from "@/store/StudyStoreContext"

const CATEGORY_ORDER = ["moodle", "drive", "recordings", "general"]

export default function CourseHubPage({ courseId, onBack }) {
  const {
    courses,
    tasks,
    events,
    alarms,
    addAlarm,
    updateAlarm,
    deleteAlarm,
    addResourceLink,
    deleteResourceLink,
    upsertCourseNote,
    deleteCourseNote,
    addSyllabusTopic,
    toggleSyllabusTopic,
    deleteSyllabusTopic,
  } = useStudyStore()

  const course = courses.find((c) => c.id === courseId)

  const [linkLabel, setLinkLabel] = useState("")
  const [linkUrl, setLinkUrl] = useState("")
  const [linkCategory, setLinkCategory] = useState("general")

  const [editingNoteId, setEditingNoteId] = useState(null)
  const [noteTitle, setNoteTitle] = useState("")
  const [noteBody, setNoteBody] = useState("")

  const [topicLabel, setTopicLabel] = useState("")

  const [alarmMessage, setAlarmMessage] = useState("")
  const [alarmEventId, setAlarmEventId] = useState("")
  const [alarmMinutesBefore, setAlarmMinutesBefore] = useState("60")

  if (!course) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-sm text-muted-foreground">הקורס לא נמצא.</p>
        <Button variant="outline" size="sm" onClick={onBack} className="gap-1.5">
          {/* RTL: "back" visually points right */}
          <ArrowRight className="h-3.5 w-3.5" />
          חזרה
        </Button>
      </div>
    )
  }

  const courseTasks = tasks.filter((t) => t.courseId === courseId)
  const pendingTasks = courseTasks.filter((t) => t.status !== "done")
  const assignmentPct = course.assignmentsTotal
    ? Math.round((course.assignmentsDone / course.assignmentsTotal) * 100)
    : 0

  const resourceLinks = course.resourceLinks || []
  const notes = course.notes || []
  const syllabusTopics = course.syllabusTopics || []
  const syllabusDoneCount = syllabusTopics.filter((t) => t.done).length
  const courseEvents = events
    .filter((e) => e.courseId === courseId && new Date(e.start).getTime() > Date.now())
    .sort((a, b) => new Date(a.start) - new Date(b.start))
  const courseAlarms = alarms.filter((a) => a.courseId === courseId)

  const handleAddLink = (e) => {
    e.preventDefault()
    if (!linkLabel.trim() || !linkUrl.trim()) return
    addResourceLink(courseId, { label: linkLabel.trim(), url: linkUrl.trim(), category: linkCategory })
    setLinkLabel("")
    setLinkUrl("")
  }

  const startEditNote = (note) => {
    setEditingNoteId(note?.id || "new")
    setNoteTitle(note?.title || "")
    setNoteBody(note?.contentMarkdown || "")
  }

  const handleSaveNote = () => {
    if (!noteBody.trim()) return
    upsertCourseNote(courseId, {
      id: editingNoteId === "new" ? undefined : editingNoteId,
      title: noteTitle.trim() || "הערה ללא כותרת",
      contentMarkdown: noteBody,
    })
    setEditingNoteId(null)
    setNoteTitle("")
    setNoteBody("")
  }

  const handleAddTopic = (e) => {
    e.preventDefault()
    if (!topicLabel.trim()) return
    addSyllabusTopic(courseId, topicLabel.trim())
    setTopicLabel("")
  }

  const handleAddAlarm = (e) => {
    e.preventDefault()
    if (!alarmMessage.trim() || !alarmEventId) return
    addAlarm({
      courseId,
      eventId: alarmEventId,
      message: alarmMessage.trim(),
      triggerMinutesBefore: Number(alarmMinutesBefore) || 0,
    })
    setAlarmMessage("")
    setAlarmEventId("")
    setAlarmMinutesBefore("60")
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="mx-auto flex max-w-5xl flex-col gap-5"
    >
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={onBack}>
          {/* RTL: "back" visually points right */}
          <ArrowRight className="h-4 w-4" />
        </Button>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Badge variant={course.color}>{course.code}</Badge>
            <h2 className="truncate text-lg font-semibold">{course.name}</h2>
          </div>
          <p className="text-xs text-muted-foreground">{course.credits} נק״ז</p>
        </div>
      </div>

      {/* Progress & Metrics */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <Clock className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xl font-bold tabular-nums">{course.weeklyHours} שעות</p>
              <p className="text-xs text-muted-foreground">שעות למידה שבועיות</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1.5 py-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">מטלות</span>
              <span className="text-xs font-medium">
                {course.assignmentsDone}/{course.assignmentsTotal}
              </span>
            </div>
            <Progress value={assignmentPct} />
            <p className="text-[11px] text-muted-foreground">{pendingTasks.length} משימות פתוחות</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <ListChecks className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xl font-bold tabular-nums">
                {syllabusDoneCount}/{syllabusTopics.length}
              </p>
              <p className="text-xs text-muted-foreground">נושאי סילבוס שהושלמו</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Resource links */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              קישורים ומשאבים
            </CardTitle>
            <CardDescription>מודל, תיקיות דרייב, הקלטות, וקישורים נוספים.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {CATEGORY_ORDER.map((cat) => {
              const items = resourceLinks.filter((l) => l.category === cat)
              if (items.length === 0) return null
              return (
                <div key={cat} className="flex flex-col gap-1.5">
                  <p className="text-xs font-semibold text-muted-foreground">
                    {RESOURCE_LINK_CATEGORIES[cat]?.label}
                  </p>
                  {items.map((link) => (
                    <div
                      key={link.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-border p-2 text-sm"
                    >
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex min-w-0 flex-1 items-center gap-1.5 truncate text-start hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">{link.label}</span>
                      </a>
                      <button
                        onClick={() => deleteResourceLink(courseId, link.id)}
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )
            })}
            {resourceLinks.length === 0 && (
              <p className="text-xs text-muted-foreground">אין קישורים עדיין — הוסיפו אחד למטה.</p>
            )}

            <form onSubmit={handleAddLink} className="flex flex-col gap-2 border-t border-border pt-3">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Input
                  placeholder="תווית (לדוגמה: שקפי הרצאה)"
                  value={linkLabel}
                  onChange={(e) => setLinkLabel(e.target.value)}
                />
                <Select value={linkCategory} onValueChange={setLinkCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_ORDER.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {RESOURCE_LINK_CATEGORIES[cat]?.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="https://..."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" size="sm" className="gap-1.5 shrink-0">
                  <Plus className="h-3.5 w-3.5" />
                  הוסף
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Syllabus checklist */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-1.5">
              <ListChecks className="h-4 w-4" />
              נושאי סילבוס
            </CardTitle>
            <CardDescription>מעקב אחר מה שכוסה במהלך הסמסטר.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {syllabusTopics.length === 0 && (
              <p className="text-xs text-muted-foreground">אין נושאים עדיין — הוסיפו אחד למטה.</p>
            )}
            {syllabusTopics.map((topic) => (
              <div
                key={topic.id}
                className="flex items-center gap-2 rounded-lg border border-border p-2 text-sm"
              >
                <button
                  onClick={() => toggleSyllabusTopic(courseId, topic.id)}
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                    topic.done ? "border-primary bg-primary" : "border-input"
                  )}
                />
                <span className={cn("flex-1 truncate", topic.done && "text-muted-foreground line-through")}>
                  {topic.label}
                </span>
                <button
                  onClick={() => deleteSyllabusTopic(courseId, topic.id)}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <form onSubmit={handleAddTopic} className="flex gap-2 border-t border-border pt-3">
              <Input
                placeholder="לדוגמה: פרק 4 — ערכים עצמיים"
                value={topicLabel}
                onChange={(e) => setTopicLabel(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="sm" className="gap-1.5 shrink-0">
                <Plus className="h-3.5 w-3.5" />
                הוסף
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Custom alarms */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-1.5">
            <BellRing className="h-4 w-4" />
            תזכורות מותאמות
          </CardTitle>
          <CardDescription>
            תזכורות טקסטואליות המקושרות לשיעור קרוב בקורס זה (לדוגמה: "להביא דף נוסחאות").
            תופיע כהתראת דפדפן אם הופעלה בהגדרות.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {courseAlarms.length === 0 && (
            <p className="text-xs text-muted-foreground">אין תזכורות מותאמות עדיין.</p>
          )}
          {courseAlarms.map((alarm) => {
            const linkedEvent = events.find((e) => e.id === alarm.eventId)
            return (
              <div
                key={alarm.id}
                className="flex items-center gap-2 rounded-lg border border-border p-2 text-sm"
              >
                <Switch
                  checked={alarm.enabled}
                  onCheckedChange={(checked) => updateAlarm(alarm.id, { enabled: checked })}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate">{alarm.message}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {linkedEvent ? linkedEvent.title : "האירוע לא מתוכנן יותר"} ·{" "}
                    {alarm.triggerMinutesBefore} דק׳ לפני
                  </p>
                </div>
                <button
                  onClick={() => deleteAlarm(alarm.id)}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          })}

          <form onSubmit={handleAddAlarm} className="flex flex-col gap-2 border-t border-border pt-3">
            <Input
              placeholder="טקסט התזכורת (לדוגמה: להביא דף נוסחאות)"
              value={alarmMessage}
              onChange={(e) => setAlarmMessage(e.target.value)}
            />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_120px]">
              <Select value={alarmEventId} onValueChange={setAlarmEventId}>
                <SelectTrigger>
                  <SelectValue placeholder="שיעור קרוב" />
                </SelectTrigger>
                <SelectContent>
                  {courseEvents.length === 0 && (
                    <SelectItem value="_none" disabled>
                      אין אירועים קרובים
                    </SelectItem>
                  )}
                  {courseEvents.map((ev) => (
                    <SelectItem key={ev.id} value={ev.id}>
                      {ev.title} — {new Date(ev.start).toLocaleDateString("he-IL", { month: "short", day: "numeric" })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                min="0"
                placeholder="דק׳ לפני"
                value={alarmMinutesBefore}
                onChange={(e) => setAlarmMinutesBefore(e.target.value)}
              />
            </div>
            <Button type="submit" size="sm" className="gap-1.5 self-start" disabled={courseEvents.length === 0}>
              <Plus className="h-3.5 w-3.5" />
              הוסף תזכורת
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-1.5">
            <StickyNote className="h-4 w-4" />
            מחברת
          </CardTitle>
          <CardDescription>הערות סשן והערות הרצאה שנשמרו לקורס זה.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {editingNoteId ? (
            <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
              <Input
                placeholder="כותרת ההערה"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
              />
              <Textarea
                placeholder="כתבו ב-Markdown…"
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                className="min-h-[160px]"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditingNoteId(null)}>
                  ביטול
                </Button>
                <Button size="sm" onClick={handleSaveNote}>
                  שמור הערה
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" size="sm" className="gap-1.5 self-start" onClick={() => startEditNote(null)}>
              <Plus className="h-3.5 w-3.5" />
              הערה חדשה
            </Button>
          )}

          {notes.length === 0 ? (
            <p className="text-xs text-muted-foreground">אין הערות שמורות עדיין.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {[...notes]
                .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                .map((note) => (
                  <div key={note.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{note.title}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(note.updatedAt).toLocaleString("he-IL", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          onClick={() => startEditNote(note)}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          ערוך
                        </button>
                        <button
                          onClick={() => deleteCourseNote(courseId, note.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">
                      {note.contentMarkdown}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
