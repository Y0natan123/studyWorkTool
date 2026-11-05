import React, { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

const WEEKDAY_LABELS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"]

export default function MoveSeriesModal({ open, onOpenChange, event, onConfirm }) {
  const [weekday, setWeekday] = useState(0)
  const [time, setTime] = useState("09:00")

  useEffect(() => {
    if (open && event) {
      const start = new Date(event.start)
      setWeekday(start.getDay())
      const pad = (n) => String(n).padStart(2, "0")
      setTime(`${pad(start.getHours())}:${pad(start.getMinutes())}`)
    }
  }, [open, event])

  if (!event) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    const [hour, minute] = time.split(":").map(Number)
    onConfirm({ weekday, hour, minute })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>הזזת כל המופעים העתידיים</DialogTitle>
          <DialogDescription>
            "{event.title}" — יעודכן ליום ושעה חדשים, מהמופע הקרוב ואילך. מופעים שכבר עברו לא ישתנו.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              יום בשבוע
            </Label>
            <div className="flex flex-wrap gap-2">
              {WEEKDAY_LABELS.map((label, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setWeekday(idx)}
                  className={cn(
                    "rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
                    weekday === idx
                      ? "border-transparent bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground hover:bg-accent"
                  )}
                >
                  יום {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ms-time" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              שעה
            </Label>
            <input
              id="ms-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              className="h-9 rounded-full border border-input bg-background px-4 text-base shadow-sm sm:text-sm"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
            <Button type="submit" className="rounded-full">
              הזז את כל המופעים
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
