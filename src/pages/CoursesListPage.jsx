import React from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, AlertCircle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { useStudyStore } from "@/store/StudyStoreContext"

const DAY_MS = 24 * 3600 * 1000

// Finds this course's soonest not-done task and describes how urgent it is.
function nextDeadlineInfo(courseId, tasks, now) {
  const upcoming = tasks
    .filter((t) => t.courseId === courseId && t.status !== "done")
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
  const next = upcoming[0]
  if (!next) return null

  const daysLeft = Math.ceil((new Date(next.dueDate).getTime() - now) / DAY_MS)
  let label
  if (daysLeft < 0) label = "באיחור"
  else if (daysLeft === 0) label = "היום"
  else if (daysLeft === 1) label = "מחר"
  else label = `בעוד ${daysLeft} ימים`

  const urgency = daysLeft <= 1 ? "urgent" : daysLeft <= 4 ? "soon" : "later"
  return { title: next.title, label, urgency }
}

const URGENCY_CLASSES = {
  urgent: "text-destructive",
  soon: "text-amber-600 dark:text-amber-400",
  later: "text-muted-foreground",
}

export default function CoursesListPage({ onOpenCourse }) {
  const { courses, tasks } = useStudyStore()
  const now = Date.now()

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="mx-auto flex max-w-5xl flex-col gap-5"
    >
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">קורסים</h1>
        <p className="text-sm text-muted-foreground">בחרו קורס לפתיחת עמוד הקורס — הערות, קישורים, נושאי סילבוס ותזכורות.</p>
      </div>

      {courses.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          אין קורסים עדיין. הוסיפו קורס בעמוד ההגדרות.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const pct = course.assignmentsTotal
              ? Math.round((course.assignmentsDone / course.assignmentsTotal) * 100)
              : 0
            const deadline = nextDeadlineInfo(course.id, tasks, now)
            return (
              <button
                key={course.id}
                onClick={() => onOpenCourse?.(course.id)}
                className="text-start"
              >
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardContent className="flex flex-col gap-3 py-5">
                    <div className="flex items-center justify-between">
                      <Badge variant={course.color}>{course.code}</Badge>
                      <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="truncate text-sm font-semibold">{course.name}</p>
                      <p className="text-xs text-muted-foreground">{course.credits} נק״ז</p>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>מטלות</span>
                        <span>
                          {course.assignmentsDone}/{course.assignmentsTotal}
                        </span>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </div>
                    {deadline && (
                      <div
                        className={cn(
                          "flex items-center gap-1.5 text-xs font-medium",
                          URGENCY_CLASSES[deadline.urgency]
                        )}
                      >
                        {deadline.urgency === "urgent" ? (
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        ) : (
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                        )}
                        <span className="truncate">
                          {deadline.title} — {deadline.label}
                        </span>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">{course.weeklyHours} שעות שבועיות</p>
                  </CardContent>
                </Card>
              </button>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
