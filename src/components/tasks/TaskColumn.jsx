import React, { useState } from "react"
import { AnimatePresence } from "framer-motion"
import TaskCard from "@/components/tasks/TaskCard"
import { cn } from "@/lib/utils"

export default function TaskColumn({ title, status, tasks, courseById, onDrop, onDelete, accentClass }) {
  const [isOver, setIsOver] = useState(false)

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsOver(true)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsOver(false)
    const taskId = e.dataTransfer.getData("text/plain")
    if (taskId) onDrop(taskId, status)
  }

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData("text/plain", taskId)
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={() => setIsOver(false)}
      onDrop={handleDrop}
      className={cn(
        "flex min-h-[200px] flex-1 flex-col gap-2 rounded-xl border border-border bg-muted/30 p-3 transition-colors",
        isOver && "border-primary/50 bg-primary/5"
      )}
    >
      <div className="mb-1 flex items-center gap-2">
        <span className={cn("h-2 w-2 rounded-full", accentClass)} />
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="me-auto rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground border border-border">
          {tasks.length}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <AnimatePresence initial={false}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              course={courseById[task.courseId]}
              onDragStart={handleDragStart}
              onDelete={onDelete}
            />
          ))}
        </AnimatePresence>
        {tasks.length === 0 && (
          <p className="py-6 text-center text-xs text-muted-foreground">גררו משימות לכאן</p>
        )}
      </div>
    </div>
  )
}
