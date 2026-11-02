import React, { useMemo, useState } from "react"
import { motion } from "framer-motion"
import TaskColumn from "@/components/tasks/TaskColumn"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { useStudyStore } from "@/store/StudyStoreContext"

const COLUMNS = [
  { status: "todo", title: "לביצוע", accentClass: "bg-sky-tag", perCourseLimit: 2 },
  { status: "in-progress", title: "בתהליך", accentClass: "bg-amber-tag", perCourseLimit: 1 },
  { status: "done", title: "הושלם", accentClass: "bg-emerald-tag", perCourseLimit: null },
]

// Caps how many tasks from the same course show in one column (soonest due date
// first), so a course with a large loaded homework template doesn't flood the
// board — the rest stay hidden until earlier tasks move out of this column.
function capPerCourse(tasks, limit) {
  if (limit == null) return tasks
  const sorted = [...tasks].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
  const countByCourse = {}
  return sorted.filter((t) => {
    const key = t.courseId || "none"
    const count = countByCourse[key] || 0
    if (count >= limit) return false
    countByCourse[key] = count + 1
    return true
  })
}

export default function TaskBoardPage() {
  const { tasks, courses, updateTask, deleteTask } = useStudyStore()
  const [courseFilter, setCourseFilter] = useState("all")

  const courseById = useMemo(() => {
    const map = {}
    courses.forEach((c) => (map[c.id] = c))
    return map
  }, [courses])

  const filteredTasks = useMemo(
    () => (courseFilter === "all" ? tasks : tasks.filter((t) => t.courseId === courseFilter)),
    [tasks, courseFilter]
  )

  const handleDrop = (taskId, newStatus) => {
    updateTask(taskId, { status: newStatus })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">לוח משימות</h2>
        <Select value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="כל הקורסים" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הקורסים</SelectItem>
            {courses.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-4 md:flex-row">
        {COLUMNS.map((col) => {
          const columnTasks = filteredTasks.filter((t) => t.status === col.status)
          const visibleTasks = capPerCourse(columnTasks, col.perCourseLimit)
          return (
            <TaskColumn
              key={col.status}
              title={col.title}
              status={col.status}
              accentClass={col.accentClass}
              tasks={visibleTasks}
              hiddenCount={columnTasks.length - visibleTasks.length}
              courseById={courseById}
              onDrop={handleDrop}
              onDelete={deleteTask}
            />
          )
        })}
      </div>
    </motion.div>
  )
}
