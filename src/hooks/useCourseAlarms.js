import { useEffect, useRef } from "react"
import { useStudyStore } from "@/store/StudyStoreContext"

const POLL_MS = 30_000
// How close to (or past) a trigger moment we still consider "due" — guards against a
// missed poll tick letting an alarm slip through the cracks silently.
const DUE_WINDOW_MS = POLL_MS * 2

function playChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = "sine"
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.6)
  } catch {
    // audio isn't critical — a failed chime shouldn't break the notification itself
  }
}

function notify(title, body) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return
  try {
    new Notification(title, { body, icon: "/favicon.svg" })
    playChime()
  } catch {
    // Notification constructor can throw in some contexts (e.g. service-worker-only
    // environments) — fail silently rather than crash the polling loop.
  }
}

// Fires browser notifications (Notification API) for: class lead-time, multi-stage
// assignment deadlines, and custom per-course/per-event alarms. Client-side only — this
// only works while a tab running this app is open; it cannot reach the user's phone or
// fire when the browser is closed. See appsscript/README.md if a server-side (phone)
// alerting channel is ever added later.
export function useCourseAlarms() {
  const { events, tasks, courses, alarms, settings } = useStudyStore()
  const firedRef = useRef(new Set())

  useEffect(() => {
    if (!settings.notificationsEnabled) return

    const check = () => {
      const now = Date.now()
      const courseById = {}
      courses.forEach((c) => (courseById[c.id] = c))

      // Class lead-time alarms
      const leadMs = (settings.classLeadTimeMinutes || 0) * 60_000
      if (leadMs > 0) {
        events
          .filter((e) => e.type === "lecture" || e.type === "tutorial")
          .forEach((e) => {
            const startMs = new Date(e.start).getTime()
            const triggerAt = startMs - leadMs
            const key = `class_${e.id}`
            if (firedRef.current.has(key)) return
            if (now >= triggerAt && now <= triggerAt + DUE_WINDOW_MS && startMs > now) {
              const course = courseById[e.courseId]
              notify(
                `${e.title} מתחיל בקרוב`,
                `${course ? course.code + " — " : ""}בעוד ${settings.classLeadTimeMinutes} דק׳`
              )
              firedRef.current.add(key)
            }
          })
      }

      // Assignment multi-stage deadline warnings
      const stages = settings.assignmentAlertStagesHours || []
      tasks
        .filter((t) => t.status !== "done")
        .forEach((t) => {
          const dueMs = new Date(t.dueDate).getTime()
          stages.forEach((hoursBefore) => {
            const triggerAt = dueMs - hoursBefore * 3600_000
            const key = `assignment_${t.id}_${hoursBefore}`
            if (firedRef.current.has(key)) return
            if (now >= triggerAt && now <= triggerAt + DUE_WINDOW_MS && dueMs > now) {
              const course = courseById[t.courseId]
              notify(
                `${t.title} להגשה בעוד ${hoursBefore} שעות`,
                course ? course.code : "מועד הגשה מתקרב"
              )
              firedRef.current.add(key)
            }
          })
        })

      // Custom alarms
      alarms
        .filter((a) => a.enabled)
        .forEach((a) => {
          let anchorMs = null
          if (a.eventId) {
            const ev = events.find((e) => e.id === a.eventId)
            if (ev) anchorMs = new Date(ev.start).getTime()
          }
          if (anchorMs == null) return
          const triggerAt = anchorMs - (a.triggerMinutesBefore || 0) * 60_000
          const key = `custom_${a.id}`
          if (firedRef.current.has(key)) return
          if (now >= triggerAt && now <= triggerAt + DUE_WINDOW_MS && anchorMs > now) {
            const course = courseById[a.courseId]
            notify(course ? `תזכורת ל${course.code}` : "תזכורת", a.message)
            firedRef.current.add(key)
          }
        })
    }

    check()
    const interval = setInterval(check, POLL_MS)
    return () => clearInterval(interval)
  }, [events, tasks, courses, alarms, settings])
}
