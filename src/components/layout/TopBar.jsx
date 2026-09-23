import React, { useEffect, useState } from "react"
import { Search, Plus, Cloud, CloudOff, Sun, Moon, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { useStudyStore } from "@/store/StudyStoreContext"

function useDaysLeft(dateISO) {
  const [days, setDays] = useState(0)
  useEffect(() => {
    const end = new Date(dateISO).getTime()
    const now = Date.now()
    setDays(Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24))))
  }, [dateISO])
  return days
}

export default function TopBar({ onOpenSearch, onOpenCreate }) {
  const { settings, updateSettings } = useStudyStore()
  const daysLeft = useDaysLeft(settings.semesterEnd)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(t)
  }, [])

  const dateLabel = now.toLocaleDateString("he-IL", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  const dateLabelShort = now.toLocaleDateString("he-IL", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })

  const toggleTheme = () => {
    updateSettings({ theme: settings.theme === "dark" ? "light" : "dark" })
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <div className="hidden flex-col leading-tight sm:flex">
        <span className="text-sm font-semibold">{dateLabel}</span>
        <span className="text-xs text-muted-foreground">
          {settings.semesterName} &middot; נותרו {daysLeft} ימים
        </span>
      </div>

      <span className="text-sm font-medium text-muted-foreground sm:hidden">{dateLabelShort}</span>

      <button
        onClick={onOpenSearch}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground sm:hidden"
        title="חיפוש"
      >
        <Search className="h-4 w-4" />
      </button>

      <button
        onClick={onOpenSearch}
        className="ms-4 hidden flex-1 max-w-md items-center gap-2 rounded-lg border border-input bg-muted/50 px-3 py-2 text-sm text-muted-foreground shadow-sm transition-colors hover:bg-muted sm:flex"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-start">חיפוש קורסים, משימות, אירועים&hellip;</span>
        <kbd className="hidden items-center gap-0.5 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium sm:inline-flex">
          &#8984;K
        </kbd>
      </button>

      <div className="me-auto flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground md:hidden"
              title="פרטים"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{dateLabel}</DropdownMenuLabel>
            <DropdownMenuItem disabled className="text-xs text-muted-foreground">
              {settings.semesterName} &middot; נותרו {daysLeft} ימים
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled className="gap-1.5 text-xs">
              {settings.syncEnabled ? (
                <Cloud className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <CloudOff className="h-3.5 w-3.5" />
              )}
              {settings.syncEnabled ? "מסונכרן עם Google Sheets" : "מקומי בלבד (אחסון מקומי)"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          title="החלפת ערכת נושא"
        >
          {settings.theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <div
          className="hidden items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground md:flex"
          title={settings.syncEnabled ? "מסונכרן עם Google Apps Script" : "מקומי בלבד (אחסון מקומי)"}
        >
          {settings.syncEnabled ? (
            <Cloud className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <CloudOff className="h-3.5 w-3.5" />
          )}
          {settings.syncEnabled ? "מסונכרן" : "מקומי"}
        </div>

        <Button onClick={onOpenCreate} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">יצירה</span>
        </Button>
      </div>
    </header>
  )
}
