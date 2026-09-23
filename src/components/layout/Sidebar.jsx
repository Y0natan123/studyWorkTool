import React from "react"
import {
  CalendarDays,
  LayoutDashboard,
  KanbanSquare,
  Settings,
  GraduationCap,
  Radio,
  Home,
  BookOpen,
} from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { id: "today", label: "היום", icon: Home },
  { id: "schedule", label: "מערכת שעות", icon: CalendarDays },
  { id: "live", label: "פוקוס", icon: Radio },
  { id: "courses", label: "קורסים", icon: BookOpen },
  { id: "dashboard", label: "אנליטיקה", icon: LayoutDashboard },
  { id: "tasks", label: "לוח משימות", icon: KanbanSquare },
  { id: "settings", label: "הגדרות", icon: Settings },
]

export default function Sidebar({ active, onNavigate }) {
  return (
    <>
      {/* Desktop: icon rail on the right (reading-start side in RTL) */}
      <aside className="fixed inset-y-0 right-0 z-40 hidden w-16 flex-col items-center border-s border-sidebar-border bg-sidebar py-4 md:flex">
        <div className="mb-6 flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <GraduationCap className="h-5 w-5" />
        </div>

        <nav className="flex flex-1 flex-col items-center gap-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = active === item.id
            return (
              <button
                key={item.id}
                title={item.label}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  "group relative flex h-11 w-11 items-center justify-center rounded-xl transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-sidebar-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="pointer-events-none absolute right-full mr-2 whitespace-nowrap rounded-md bg-popover px-2 py-1 text-xs font-medium text-popover-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100 border border-border z-50">
                  {item.label}
                </span>
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Mobile: floating pill nav bar */}
      <div
        className="fixed inset-x-0 z-40 flex justify-center px-4 md:hidden"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 44px)" }}
      >
        <nav className="flex items-center gap-1 rounded-full border border-sidebar-border bg-sidebar p-1.5 shadow-lg">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = active === item.id
            return (
              <button
                key={item.id}
                title={item.label}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full transition-all",
                  isActive
                    ? "-translate-y-0.5 bg-primary text-primary-foreground shadow-md"
                    : "text-sidebar-foreground/70"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="sr-only">{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>
    </>
  )
}
