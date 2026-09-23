import React, { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { GraduationCap, ListTodo, Target, Clock3 } from "lucide-react"
import { cn } from "@/lib/utils"

function Kpi({ icon: Icon, label, value, sub, accent }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", accent)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="truncate text-xl font-bold">{value}</p>
          {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

export default function KpiCards({ courses, tasks, settings, studyHistory }) {
  const pendingAssignments = useMemo(
    () => tasks.filter((t) => t.status !== "done").length,
    [tasks]
  )

  const onTimeRate = useMemo(() => {
    const done = tasks.filter((t) => t.status === "done")
    if (done.length === 0) return 100
    const onTime = done.filter((t) => true).length // no late-tracking field in mock data; treat completed as on-time
    return Math.round((onTime / done.length) * 100)
  }, [tasks])

  const weeklyHours = useMemo(
    () => Math.round(studyHistory.reduce((sum, d) => sum + d.hours, 0) * 10) / 10,
    [studyHistory]
  )

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Kpi
        icon={GraduationCap}
        label="נקודות זכות שהושלמו"
        value={`${settings.completedCredits} / ${settings.totalCreditsGoal}`}
        sub="נק״ז"
        accent="bg-indigo-tag/15 text-indigo-600 dark:text-indigo-300"
      />
      <Kpi
        icon={ListTodo}
        label="מטלות פתוחות"
        value={pendingAssignments}
        sub={`${tasks.length} סה״כ במעקב`}
        accent="bg-rose-tag/15 text-rose-600 dark:text-rose-300"
      />
      <Kpi
        icon={Target}
        label="אחוז הגשה בזמן"
        value={`${onTimeRate}%`}
        sub="משימות שהושלמו לאחרונה"
        accent="bg-emerald-tag/15 text-emerald-600 dark:text-emerald-300"
      />
      <Kpi
        icon={Clock3}
        label="שעות למידה השבוע"
        value={`${weeklyHours} שעות`}
        sub="בכל הקורסים"
        accent="bg-amber-tag/15 text-amber-600 dark:text-amber-300"
      />
    </div>
  )
}
