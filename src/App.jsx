import React, { useEffect, useState, useCallback } from "react"
import { AnimatePresence } from "framer-motion"
import Sidebar from "@/components/layout/Sidebar"
import TopBar from "@/components/layout/TopBar"
import CommandPalette from "@/components/shared/CommandPalette"
import QuickCreateModal from "@/components/shared/QuickCreateModal"
import TodayPage from "@/pages/TodayPage"
import SchedulePage from "@/pages/SchedulePage"
import DashboardPage from "@/pages/DashboardPage"
import TaskBoardPage from "@/pages/TaskBoardPage"
import SettingsPage from "@/pages/SettingsPage"
import LiveClassDashboard from "@/pages/LiveClassDashboard"
import CourseHubPage from "@/pages/CourseHubPage"
import CoursesListPage from "@/pages/CoursesListPage"
import { StudyStoreProvider } from "@/store/StudyStoreContext"
import { useCourseAlarms } from "@/hooks/useCourseAlarms"

const PAGES = {
  today: TodayPage,
  schedule: SchedulePage,
  live: LiveClassDashboard,
  courses: CoursesListPage,
  dashboard: DashboardPage,
  tasks: TaskBoardPage,
  settings: SettingsPage,
}

function AppShell() {
  useCourseAlarms()
  const [activePage, setActivePage] = useState("today")
  const [searchOpen, setSearchOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedCourseId, setSelectedCourseId] = useState(null)
  const [courseHubReturnTo, setCourseHubReturnTo] = useState("courses")

  const openCourseHub = useCallback(
    (courseId) => {
      setSelectedCourseId(courseId)
      setCourseHubReturnTo(activePage === "course-hub" ? courseHubReturnTo : activePage)
      setActivePage("course-hub")
    },
    [activePage, courseHubReturnTo]
  )

  const handleKeyDown = useCallback((e) => {
    const isMeta = e.metaKey || e.ctrlKey
    if (isMeta && e.key.toLowerCase() === "k") {
      e.preventDefault()
      setSearchOpen((v) => !v)
    }
  }, [])

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  const ActivePageComponent = PAGES[activePage] || SchedulePage
  const isCourseHub = activePage === "course-hub"

  return (
    <div className="min-h-screen bg-background">
      <Sidebar active={activePage} onNavigate={setActivePage} />

      <div className="md:pr-16">
        <TopBar onOpenSearch={() => setSearchOpen(true)} onOpenCreate={() => setCreateOpen(true)} />

        <main className="p-4 pb-20 sm:p-6 md:pb-6">
          <AnimatePresence mode="wait">
            {isCourseHub ? (
              <CourseHubPage
                key="course-hub"
                courseId={selectedCourseId}
                onBack={() => setActivePage(courseHubReturnTo)}
              />
            ) : (
              <ActivePageComponent key={activePage} onOpenCourse={openCourseHub} onNavigate={setActivePage} />
            )}
          </AnimatePresence>
        </main>
      </div>

      <CommandPalette
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onSelectCourse={(course) => openCourseHub(course.id)}
        onSelectTask={() => setActivePage("tasks")}
        onSelectEvent={() => setActivePage("schedule")}
      />

      <QuickCreateModal open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}

export default function App() {
  return (
    <StudyStoreProvider>
      <AppShell />
    </StudyStoreProvider>
  )
}
