import React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { COURSE_TAG_CLASSES } from "@/lib/constants"

export default function CourseTable({ courses, onOpenCourse }) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle>פירוט קורסים</CardTitle>
        <CardDescription>התקדמות, עומס למידה, וקישורים מהירים</CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-start text-xs text-muted-foreground">
                <th className="pb-2 pe-4 font-medium">קורס</th>
                <th className="pb-2 pe-4 font-medium">נק״ז</th>
                <th className="pb-2 pe-4 font-medium">מטלות</th>
                <th className="pb-2 pe-4 font-medium">שעות שבועיות</th>
                <th className="pb-2 font-medium">קישורים</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => {
                const tag = COURSE_TAG_CLASSES[course.color]
                const pct = course.assignmentsTotal
                  ? Math.round((course.assignmentsDone / course.assignmentsTotal) * 100)
                  : 0
                return (
                  <tr key={course.id} className="border-b border-border/60 last:border-0">
                    <td className="py-3 pe-4">
                      <button
                        onClick={() => onOpenCourse?.(course.id)}
                        className="flex items-center gap-2 text-start hover:underline disabled:no-underline disabled:cursor-default"
                        disabled={!onOpenCourse}
                      >
                        <span className={cn("h-2 w-2 shrink-0 rounded-full", tag.solid)} />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{course.name}</p>
                          <p className="text-xs text-muted-foreground">{course.code}</p>
                        </div>
                      </button>
                    </td>
                    <td className="py-3 pe-4 text-muted-foreground">{course.credits} נק״ז</td>
                    <td className="py-3 pe-4">
                      <div className="flex items-center gap-2">
                        <Progress value={pct} className="h-1.5 w-24" />
                        <span className="whitespace-nowrap text-xs text-muted-foreground">
                          {course.assignmentsDone}/{course.assignmentsTotal}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 pe-4 text-muted-foreground">{course.weeklyHours} שעות</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        {(course.links || []).map((link, i) => (
                          <a
                            key={i}
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {link.label}
                          </a>
                        ))}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
