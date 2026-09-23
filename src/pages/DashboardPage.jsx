import React from "react"
import { motion } from "framer-motion"
import KpiCards from "@/components/dashboard/KpiCards"
import StudyTimeChart from "@/components/dashboard/StudyTimeChart"
import ProductivityHeatmap from "@/components/dashboard/ProductivityHeatmap"
import CourseTable from "@/components/dashboard/CourseTable"
import { useStudyStore } from "@/store/StudyStoreContext"

export default function DashboardPage({ onOpenCourse }) {
  const { courses, tasks, settings, studyHistory, heatmap } = useStudyStore()

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-5"
    >
      <KpiCards courses={courses} tasks={tasks} settings={settings} studyHistory={studyHistory} />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <StudyTimeChart data={studyHistory} />
        <ProductivityHeatmap data={heatmap} />
      </div>

      <CourseTable courses={courses} onOpenCourse={onOpenCourse} />
    </motion.div>
  )
}
