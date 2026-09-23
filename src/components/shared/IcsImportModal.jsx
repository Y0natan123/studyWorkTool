import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { CalendarPlus } from "lucide-react"
import { cn } from "@/lib/utils"
import { useStudyStore } from "@/store/StudyStoreContext"
import { parseIcs } from "@/lib/ics"

const TYPE_OPTIONS = [
  { value: "lecture", label: "הרצאה" },
  { value: "tutorial", label: "תרגול" },
  { value: "assignment", label: "מטלה" },
  { value: "self-study", label: "למידה עצמאית" },
]

// Review-before-import flow: pick an .ics file, see every event it contains, assign a
// type + (optional) course to each one, uncheck any you don't want, then commit.
export default function IcsImportModal({ open, onOpenChange }) {
  const { courses, addEvent } = useStudyStore()
  const [rows, setRows] = useState(null) // null = no file parsed yet
  const [parseError, setParseError] = useState(null)

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    try {
      const text = await file.text()
      const parsed = parseIcs(text)
      if (parsed.length === 0) {
        setParseError("לא נמצאו אירועים בקובץ.")
        setRows(null)
        return
      }
      setParseError(null)

      // Group by title+type: a weekly-recurring class expands to many individual
      // occurrences (one per week), which would otherwise flood the review list with
      // near-identical rows. Each group is reviewed/imported as one unit.
      const groups = new Map()
      parsed.forEach((ev) => {
        const groupKey = `${ev.title}__${ev.type}`
        if (!groups.has(groupKey)) {
          groups.set(groupKey, {
            key: groupKey,
            title: ev.title,
            type: ev.type,
            isPersonal: ev.isPersonal,
            location: ev.location,
            occurrences: [],
          })
        }
        groups.get(groupKey).occurrences.push({ start: ev.start, end: ev.end })
      })

      setRows(
        Array.from(groups.values()).map((g) => ({
          ...g,
          // Personal time blocks (runs, meals, "good time to revise X") are still shown
          // and can be included, but start unchecked so they don't clutter the schedule
          // by default.
          included: !g.isPersonal,
          courseId: "",
        }))
      )
    } catch {
      setParseError("לא ניתן לקרוא את הקובץ — ודאו שזהו קובץ .ics תקין.")
      setRows(null)
    }
  }

  const updateRow = (key, patch) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }

  const handleClose = (nextOpen) => {
    if (!nextOpen) {
      setRows(null)
      setParseError(null)
    }
    onOpenChange(nextOpen)
  }

  const handleImport = () => {
    const toImport = (rows || []).filter((r) => r.included)
    toImport.forEach((r) => {
      r.occurrences.forEach((occ) => {
        addEvent({
          title: r.title,
          type: r.type,
          courseId: r.courseId || null,
          start: occ.start,
          end: occ.end,
          location: r.location,
        })
      })
    })
    handleClose(false)
  }

  const includedGroupCount = (rows || []).filter((r) => r.included).length
  const includedEventCount = (rows || [])
    .filter((r) => r.included)
    .reduce((sum, r) => sum + r.occurrences.length, 0)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CalendarPlus className="h-5 w-5" />
            ייבוא מקובץ יומן (.ics)
          </DialogTitle>
          <DialogDescription>
            בחרו קובץ .ics, סמנו לכל אירוע סוג וקורס (אופציונלי), ואשרו את הייבוא.
          </DialogDescription>
        </DialogHeader>

        {!rows ? (
          <div className="flex flex-col gap-3">
            <input
              type="file"
              accept=".ics,text/calendar"
              onChange={handleFileChange}
              className="rounded-full border border-input bg-background px-4 py-2 text-sm"
            />
            {parseError && <p className="text-sm text-destructive">{parseError}</p>}
          </div>
        ) : (
          <>
            <div className="flex max-h-[50vh] flex-col gap-2 overflow-y-auto scrollbar-thin pe-1">
              {rows.map((r) => (
                <div
                  key={r.key}
                  className="flex flex-col gap-2 rounded-xl border border-border p-3 sm:flex-row sm:items-center sm:gap-3"
                >
                  <button
                    type="button"
                    onClick={() => updateRow(r.key, { included: !r.included })}
                    className={cn(
                      "flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border",
                      r.included ? "border-primary bg-primary" : "border-input"
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                      {r.title}
                      {r.isPersonal && (
                        <span className="shrink-0 rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-normal text-secondary-foreground">
                          זמן אישי
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.occurrences[0].start).toLocaleString("he-IL", {
                        weekday: "short",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                      {r.occurrences.length > 1
                        ? ` · ${r.occurrences.length} מופעים שבועיים`
                        : ` · ${new Date(r.occurrences[0].start).toLocaleDateString("he-IL", { month: "short", day: "numeric" })}`}
                      {r.location ? ` · ${r.location}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Select value={r.type} onValueChange={(v) => updateRow(r.key, { type: v })}>
                      <SelectTrigger className="w-[110px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TYPE_OPTIONS.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={r.courseId || "_none"}
                      onValueChange={(v) => updateRow(r.key, { courseId: v === "_none" ? "" : v })}
                    >
                      <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="ללא קורס" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_none">ללא קורס</SelectItem>
                        {courses.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" className="rounded-full" onClick={() => setRows(null)}>
                בחר קובץ אחר
              </Button>
              <Button
                type="button"
                className="rounded-full"
                disabled={includedGroupCount === 0}
                onClick={handleImport}
              >
                ייבוא {includedEventCount} אירועים ({includedGroupCount} שיעורים)
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
