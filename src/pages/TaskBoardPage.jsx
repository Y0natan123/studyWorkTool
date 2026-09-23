import React, { useMemo, useState } from "react"
import { motion } from "framer-motion"
import TaskColumn from "@/components/tasks/TaskColumn"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { useStudyStore } from "@/store/StudyStoreContext"

const COLUMNS = [
  { status: "todo", title: "לביצוע", accentClass: "bg-sky-tag" },
  { status: "in-progress", title: "בתהליך", accentClass: "bg-amber-tag" },
  { status: "done", title: "הושלם", accentClass: "bg-emerald-tag" },
]

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
        {COLUMNS.map((col) => (
          <TaskColumn
            key={col.status}
            title={col.title}
            status={col.status}
            accentClass={col.accentClass}
            tasks={filteredTasks.filter((t) => t.status === col.status)}
            courseById={courseById}
            onDrop={handleDrop}
            onDelete={deleteTask}
          />
        ))}
      </div>
    </motion.div>
  )
}
