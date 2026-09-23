import React, { useMemo, useState, useEffect, useRef } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Search, BookOpen, CheckSquare, CalendarClock } from "lucide-react"
import { useStudyStore } from "@/store/StudyStoreContext"
import { cn } from "@/lib/utils"

export default function CommandPalette({ open, onOpenChange, onSelectCourse, onSelectTask, onSelectEvent }) {
  const { courses, tasks, events } = useStudyStore()
  const [query, setQuery] = useState("")
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) {
      setQuery("")
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const courseMatches = courses
      .filter((c) => !q || c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
      .slice(0, 5)
      .map((c) => ({ kind: "course", id: c.id, label: c.name, sub: c.code, data: c }))

    const taskMatches = tasks
      .filter((t) => !q || t.title.toLowerCase().includes(q))
      .slice(0, 5)
      .map((t) => ({ kind: "task", id: t.id, label: t.title, sub: "משימה", data: t }))

    const eventMatches = events
      .filter((e) => !q || e.title.toLowerCase().includes(q))
      .slice(0, 5)
      .map((e) => ({ kind: "event", id: e.id, label: e.title, sub: "אירוע", data: e }))

    return [...courseMatches, ...taskMatches, ...eventMatches]
  }, [query, courses, tasks, events])

  const handleSelect = (item) => {
    onOpenChange(false)
    if (item.kind === "course") onSelectCourse?.(item.data)
    if (item.kind === "task") onSelectTask?.(item.data)
    if (item.kind === "event") onSelectEvent?.(item.data)
  }

  const iconFor = (kind) => {
    if (kind === "course") return BookOpen
    if (kind === "task") return CheckSquare
    return CalendarClock
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[20%] max-w-lg translate-y-0 p-0 gap-0 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חיפוש קורסים, משימות, אירועים..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="max-h-80 overflow-y-auto scrollbar-thin p-2">
          {results.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">לא נמצאו תוצאות.</p>
          )}
          {results.map((item) => {
            const Icon = iconFor(item.kind)
            return (
              <button
                key={`${item.kind}-${item.id}`}
                onClick={() => handleSelect(item)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-start text-sm transition-colors hover:bg-accent"
                )}
              >
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
                <span className="text-xs text-muted-foreground">{item.sub}</span>
              </button>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
