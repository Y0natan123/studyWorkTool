import React from "react"
import { motion } from "framer-motion"
import { Calendar, Clock, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { COURSE_TAG_CLASSES, PRIORITY_CLASSES } from "@/lib/constants"

const STATUS_PILL_CLASSES = {
  todo: "bg-sky-tag/20 text-sky-700 dark:text-sky-300",
  "in-progress": "bg-amber-tag/20 text-amber-700 dark:text-amber-300",
  done: "bg-emerald-tag/20 text-emerald-700 dark:text-emerald-300",
}

const STATUS_LABELS = {
  todo: "לביצוע",
  "in-progress": "בתהליך",
  done: "הושלם",
}

const PRIORITY_LABELS = {
  high: "גבוהה",
  medium: "בינונית",
  low: "נמוכה",
}

export default function TaskCard({ task, course, onDragStart, onDelete }) {
  const tag = course ? COURSE_TAG_CLASSES[course.color] : null
  const dueDate = new Date(task.dueDate)
  const isOverdue = task.status !== "done" && dueDate.getTime() < Date.now()

  return (
    <motion.div
      layout
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group cursor-grab rounded-xl border border-border bg-card p-3.5 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing"
    >
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[10px] font-semibold",
            STATUS_PILL_CLASSES[task.status]
          )}
        >
          {STATUS_LABELS[task.status]}
        </span>
        <button
          onClick={() => onDelete(task.id)}
          className="opacity-0 transition-opacity group-hover:opacity-100 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <p className="text-sm font-semibold leading-snug">{task.title}</p>
      {course && (
        <span className={cn("mt-1 inline-block text-[11px] font-medium", tag.text)}>{course.code}</span>
      )}

      <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
        <span className={cn("flex items-center gap-1", isOverdue && "text-destructive font-medium")}>
          <Calendar className="h-3 w-3" />
          {dueDate.toLocaleDateString("he-IL", { month: "short", day: "numeric" })}
        </span>
        {task.estimateMinutes != null && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {task.estimateMinutes} דק׳
          </span>
        )}
        <span className={cn("font-medium", PRIORITY_CLASSES[task.priority])}>{PRIORITY_LABELS[task.priority]}</span>
      </div>
    </motion.div>
  )
}
