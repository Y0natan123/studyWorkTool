import React, { createContext, useContext, useMemo, useCallback, useEffect, useRef, useState } from "react"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import {
  seedCourses,
  seedEvents,
  seedTasks,
  seedStudyHistory,
  seedHeatmap,
  seedSettings,
  seedAlarms,
  COURSE_COLORS,
} from "@/data/mockData"
import * as sheetsSync from "@/lib/sheetsSync"
import { HEATMAP_BLOCKS, HEATMAP_DAYS } from "@/lib/constants"

const StudyStoreContext = createContext(null)

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

const SYNC_DEBOUNCE_MS = 1000

export function StudyStoreProvider({ children }) {
  const [courses, setCourses] = useLocalStorage("sm_courses", seedCourses)
  const [events, setEvents] = useLocalStorage("sm_events", seedEvents)
  const [tasks, setTasks] = useLocalStorage("sm_tasks", seedTasks)
  const [studyHistory, setStudyHistory] = useLocalStorage("sm_study_history", seedStudyHistory)
  const [heatmap, setHeatmap] = useLocalStorage("sm_heatmap", seedHeatmap)
  const [settings, setSettings] = useLocalStorage("sm_settings", seedSettings)
  const [alarms, setAlarms] = useLocalStorage("sm_alarms", seedAlarms)

  const [syncStatus, setSyncStatus] = useState("idle") // idle | syncing | synced | error
  const [syncError, setSyncError] = useState(null)
  const pendingTimers = useRef({})
  const hasPulledRef = useRef(false)
  const readyToPushRef = useRef(false)

  // Apps Script serializes executions per user — firing many Calendar create/update/
  // delete calls at once (e.g. importing a semester's worth of SAP sessions) causes
  // timeouts, and a client-side timeout doesn't mean the server-side call didn't still
  // go through, which is how duplicate Calendar events happen. This queue runs Calendar
  // pushes one at a time instead of all in parallel.
  const calendarQueueRef = useRef(Promise.resolve())
  const queueCalendarCall = useCallback((fn) => {
    const next = calendarQueueRef.current.then(fn, fn)
    // swallow so one failed call doesn't poison the chain for later calls
    calendarQueueRef.current = next.catch(() => {})
    return next
  }, [])

  const [googleCalendarEvents, setGoogleCalendarEvents] = useState([])
  const [calendarSyncStatus, setCalendarSyncStatus] = useState("idle") // idle | loading | loaded | error
  // Tracks the last create/update/delete push to Google Calendar (distinct from
  // calendarSyncStatus, which tracks pulling FROM Calendar).
  const [calendarPushStatus, setCalendarPushStatus] = useState("idle") // idle | pushing | pushed | error
  const [calendarPushError, setCalendarPushError] = useState(null)

  const syncUrl = settings.syncEnabled ? settings.appsScriptUrl?.trim() : ""

  // apply theme class to <html>
  useEffect(() => {
    const root = document.documentElement
    if (settings.theme === "dark") {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
  }, [settings.theme])

  // pull from the Sheet once when sync becomes enabled/configured
  useEffect(() => {
    if (!syncUrl || hasPulledRef.current) return
    hasPulledRef.current = true
    setSyncStatus("syncing")
    sheetsSync
      .pullAll(syncUrl)
      .then((data) => {
        if (Array.isArray(data.courses)) setCourses(data.courses)
        if (Array.isArray(data.events)) setEvents(data.events)
        if (Array.isArray(data.tasks)) setTasks(data.tasks)
        if (Array.isArray(data.studyHistory)) setStudyHistory(data.studyHistory)
        if (Array.isArray(data.heatmap)) setHeatmap(data.heatmap)
        if (Array.isArray(data.alarms)) setAlarms(data.alarms)
        if (data.settings && typeof data.settings === "object") {
          setSettings((prev) => ({ ...prev, ...data.settings, syncEnabled: true, appsScriptUrl: syncUrl }))
        }
        setSyncStatus("synced")
        setSyncError(null)
      })
      .catch((err) => {
        setSyncStatus("error")
        setSyncError(err.message)
      })
      .finally(() => {
        readyToPushRef.current = true
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncUrl])

  const pushCollectionDebounced = useCallback(
    (key, records) => {
      if (!syncUrl) return
      clearTimeout(pendingTimers.current[key])
      pendingTimers.current[key] = setTimeout(() => {
        setSyncStatus("syncing")
        sheetsSync
          .pushAll(syncUrl, { [key]: records })
          .then(() => {
            setSyncStatus("synced")
            setSyncError(null)
          })
          .catch((err) => {
            setSyncStatus("error")
            setSyncError(err.message)
          })
      }, SYNC_DEBOUNCE_MS)
    },
    [syncUrl]
  )

  const syncNow = useCallback(async () => {
    if (!syncUrl) return
    setSyncStatus("syncing")
    try {
      await sheetsSync.pushAll(syncUrl, { courses, events, tasks, studyHistory, heatmap, alarms, settings })
      setSyncStatus("synced")
      setSyncError(null)
    } catch (err) {
      setSyncStatus("error")
      setSyncError(err.message)
    }
  }, [syncUrl, courses, events, tasks, studyHistory, heatmap, alarms, settings])

  const pullGoogleCalendarEvents = useCallback(
    async (startISO, endISO) => {
      if (!syncUrl) return
      setCalendarSyncStatus("loading")
      try {
        const calEvents = await sheetsSync.getCalendarEvents(syncUrl, startISO, endISO)
        setGoogleCalendarEvents(calEvents || [])
        setCalendarSyncStatus("loaded")
      } catch {
        setCalendarSyncStatus("error")
      }
    },
    [syncUrl]
  )

  // push each collection to the Sheet (debounced) whenever it changes locally,
  // but only after the initial pull has settled so we don't clobber remote data
  // with the local seed on first load. readyToPushRef is a ref (not state) so
  // that sync-status transitions don't re-trigger these effects and loop.
  useEffect(() => {
    if (!syncUrl || !readyToPushRef.current) return
    pushCollectionDebounced("courses", courses)
  }, [courses, syncUrl, pushCollectionDebounced])
  useEffect(() => {
    if (!syncUrl || !readyToPushRef.current) return
    pushCollectionDebounced("events", events)
  }, [events, syncUrl, pushCollectionDebounced])
  useEffect(() => {
    if (!syncUrl || !readyToPushRef.current) return
    pushCollectionDebounced("tasks", tasks)
  }, [tasks, syncUrl, pushCollectionDebounced])
  useEffect(() => {
    if (!syncUrl || !readyToPushRef.current) return
    pushCollectionDebounced("studyHistory", studyHistory)
  }, [studyHistory, syncUrl, pushCollectionDebounced])
  useEffect(() => {
    if (!syncUrl || !readyToPushRef.current) return
    pushCollectionDebounced("heatmap", heatmap)
  }, [heatmap, syncUrl, pushCollectionDebounced])
  useEffect(() => {
    if (!syncUrl || !readyToPushRef.current) return
    pushCollectionDebounced("alarms", alarms)
  }, [alarms, syncUrl, pushCollectionDebounced])

  // settings has live-typing inputs (semester name, credits, etc.), so it's pushed
  // explicitly on blur (see pushSettingsNow) rather than on every keystroke.
  const pushSettingsNow = useCallback((override) => {
    if (!syncUrl || !readyToPushRef.current) return
    setSyncStatus("syncing")
    sheetsSync
      .pushAll(syncUrl, { settings: override || settings })
      .then(() => {
        setSyncStatus("synced")
        setSyncError(null)
      })
      .catch((err) => {
        setSyncStatus("error")
        setSyncError(err.message)
      })
  }, [syncUrl, settings])

  const addCourse = useCallback(
    (course) => {
      const color = course.color || COURSE_COLORS[courses.length % COURSE_COLORS.length]
      setCourses((prev) => [
        ...prev,
        {
          id: uid("c"),
          assignmentsTotal: 0,
          assignmentsDone: 0,
          weeklyHours: 0,
          links: [],
          notes: [],
          resourceLinks: [],
          syllabusTopics: [],
          ...course,
          color,
        },
      ])
    },
    [courses.length, setCourses]
  )

  const updateCourse = useCallback(
    (id, patch) => {
      setCourses((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
    },
    [setCourses]
  )

  const deleteCourse = useCallback(
    (id) => {
      setCourses((prev) => prev.filter((c) => c.id !== id))
      setEvents((prev) => prev.filter((e) => e.courseId !== id))
      setTasks((prev) => prev.filter((t) => t.courseId !== id))
    },
    [setCourses, setEvents, setTasks]
  )

  // Deletes a batch of Google Calendar events by id, tolerating individual failures
  // (unlike Promise.all, one bad id doesn't abort the rest) and reports how many
  // actually succeeded so callers can surface partial failures instead of a single
  // opaque error.
  const deleteCalendarEventsBatch = useCallback(
    async (calendarEventIds) => {
      if (!syncUrl || calendarEventIds.length === 0) return
      setCalendarPushStatus("pushing")
      const results = await Promise.allSettled(
        calendarEventIds.map((id) => queueCalendarCall(() => sheetsSync.deleteCalendarEvent(syncUrl, id)))
      )
      const failures = results.filter((r) => r.status === "rejected")
      if (failures.length === 0) {
        setCalendarPushStatus("pushed")
        setCalendarPushError(null)
      } else {
        setCalendarPushStatus("error")
        setCalendarPushError(
          `${failures.length}/${calendarEventIds.length} מחיקות מהיומן נכשלו: ${failures[0].reason?.message || failures[0].reason}`
        )
      }
    },
    [syncUrl, queueCalendarCall]
  )

  // Removes all schedule events tied to a course (e.g. duplicates from re-importing a
  // SAP schedule) without touching the course itself or its tasks. Events whose
  // Calendar push is still in flight (no calendarEventId yet) are excluded from local
  // deletion too, so a later create-response can't resurrect/orphan them — callers
  // should warn the user to retry shortly if any are pending.
  const deleteCourseEvents = useCallback(
    (courseId) => {
      const toDelete = events.filter((e) => e.courseId === courseId)
      const pendingCount = toDelete.filter((e) => syncUrl && !e.calendarEventId).length
      const deletableIds = new Set(toDelete.filter((e) => !(syncUrl && !e.calendarEventId)).map((e) => e.id))
      const calendarEventIds = toDelete.filter((e) => e.calendarEventId).map((e) => e.calendarEventId)

      setEvents((prev) => prev.filter((e) => !deletableIds.has(e.id)))
      deleteCalendarEventsBatch(calendarEventIds)
      return { pendingCount }
    },
    [events, setEvents, syncUrl, deleteCalendarEventsBatch]
  )

  // Removes every schedule event (all courses, all dates) and the matching Google
  // Calendar entries — a full schedule wipe, e.g. to clean up after repeated test
  // imports. Courses, tasks and everything else are left untouched. Same in-flight
  // guard as deleteCourseEvents.
  const deleteAllEvents = useCallback(() => {
    const pendingCount = events.filter((e) => syncUrl && !e.calendarEventId).length
    const deletableIds = new Set(events.filter((e) => !(syncUrl && !e.calendarEventId)).map((e) => e.id))
    const calendarEventIds = events.filter((e) => e.calendarEventId).map((e) => e.calendarEventId)

    setEvents((prev) => prev.filter((e) => !deletableIds.has(e.id)))
    deleteCalendarEventsBatch(calendarEventIds)
    return { pendingCount }
  }, [events, setEvents, syncUrl, deleteCalendarEventsBatch])

  // Upserts by note.id: pass an existing id to update in place (used for autosave), or omit
  // id to create a new note. Returns the note's id either way.
  const upsertCourseNote = useCallback(
    (courseId, note) => {
      const noteId = note.id || uid("n")
      setCourses((prev) =>
        prev.map((c) => {
          if (c.id !== courseId) return c
          const notes = c.notes || []
          const existingIndex = notes.findIndex((n) => n.id === noteId)
          const updatedNote = { ...note, id: noteId, updatedAt: new Date().toISOString() }
          if (existingIndex === -1) {
            return { ...c, notes: [...notes, updatedNote] }
          }
          return { ...c, notes: notes.map((n) => (n.id === noteId ? updatedNote : n)) }
        })
      )
      return noteId
    },
    [setCourses]
  )

  const deleteCourseNote = useCallback(
    (courseId, noteId) => {
      setCourses((prev) =>
        prev.map((c) => (c.id === courseId ? { ...c, notes: (c.notes || []).filter((n) => n.id !== noteId) } : c))
      )
    },
    [setCourses]
  )

  const addResourceLink = useCallback(
    (courseId, link) => {
      setCourses((prev) =>
        prev.map((c) =>
          c.id === courseId
            ? { ...c, resourceLinks: [...(c.resourceLinks || []), { id: uid("rl"), ...link }] }
            : c
        )
      )
    },
    [setCourses]
  )

  const deleteResourceLink = useCallback(
    (courseId, linkId) => {
      setCourses((prev) =>
        prev.map((c) =>
          c.id === courseId
            ? { ...c, resourceLinks: (c.resourceLinks || []).filter((l) => l.id !== linkId) }
            : c
        )
      )
    },
    [setCourses]
  )

  const addSyllabusTopic = useCallback(
    (courseId, label) => {
      setCourses((prev) =>
        prev.map((c) =>
          c.id === courseId
            ? { ...c, syllabusTopics: [...(c.syllabusTopics || []), { id: uid("st"), label, done: false }] }
            : c
        )
      )
    },
    [setCourses]
  )

  const toggleSyllabusTopic = useCallback(
    (courseId, topicId) => {
      setCourses((prev) =>
        prev.map((c) =>
          c.id === courseId
            ? {
                ...c,
                syllabusTopics: (c.syllabusTopics || []).map((t) =>
                  t.id === topicId ? { ...t, done: !t.done } : t
                ),
              }
            : c
        )
      )
    },
    [setCourses]
  )

  const deleteSyllabusTopic = useCallback(
    (courseId, topicId) => {
      setCourses((prev) =>
        prev.map((c) =>
          c.id === courseId
            ? { ...c, syllabusTopics: (c.syllabusTopics || []).filter((t) => t.id !== topicId) }
            : c
        )
      )
    },
    [setCourses]
  )

  // alarm: {message, courseId?, eventId?, triggerMinutesBefore, enabled}
  const addAlarm = useCallback(
    (alarm) => {
      setAlarms((prev) => [...prev, { id: uid("al"), enabled: true, ...alarm }])
    },
    [setAlarms]
  )

  const updateAlarm = useCallback(
    (id, patch) => {
      setAlarms((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)))
    },
    [setAlarms]
  )

  const deleteAlarm = useCallback(
    (id) => {
      setAlarms((prev) => prev.filter((a) => a.id !== id))
    },
    [setAlarms]
  )

  // date: "YYYY-MM-DD"; timeBlock: one of HEATMAP_BLOCKS; day-of-week is derived from date.
  const logStudySession = useCallback(
    (courseId, minutes, date, timeBlock) => {
      const hours = minutes / 60

      setCourses((prev) =>
        prev.map((c) => (c.id === courseId ? { ...c, weeklyHours: Math.round((c.weeklyHours + hours) * 100) / 100 } : c))
      )

      setStudyHistory((prev) => {
        const existing = prev.find((d) => d.date === date)
        if (existing) {
          return prev.map((d) =>
            d.date === date ? { ...d, hours: Math.round((d.hours + hours) * 100) / 100 } : d
          )
        }
        const label = new Date(`${date}T00:00:00`).toLocaleDateString("he-IL", { weekday: "short" })
        return [...prev, { date, label, hours: Math.round(hours * 100) / 100 }]
      })

      if (HEATMAP_BLOCKS.includes(timeBlock)) {
        const day = HEATMAP_DAYS[new Date(`${date}T00:00:00`).getDay()]
        setHeatmap((prev) =>
          prev.map((cell) =>
            cell.day === day && cell.block === timeBlock ? { ...cell, value: Math.min(4, cell.value + 1) } : cell
          )
        )
      }
    },
    [setCourses, setStudyHistory, setHeatmap]
  )

  // Events are local-first: state updates synchronously, then (if sync is configured)
  // the matching Google Calendar event is created/updated/deleted in the background and
  // the returned calendarEventId is patched onto the local record once it resolves.
  const addEvent = useCallback(
    (event) => {
      const id = uid("e")
      setEvents((prev) => [...prev, { id, ...event }])

      if (syncUrl && event.start && event.end) {
        setCalendarPushStatus("pushing")
        queueCalendarCall(() =>
          sheetsSync.createCalendarEvent(syncUrl, {
            title: event.title,
            startISO: event.start,
            endISO: event.end,
            description: event.description,
          })
        )
          .then((calendarEventId) => {
            setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, calendarEventId } : e)))
            setCalendarPushStatus("pushed")
            setCalendarPushError(null)
          })
          .catch((err) => {
            // the event still exists locally/in the Sheet even if the Calendar push failed
            setCalendarPushStatus("error")
            setCalendarPushError(err.message)
          })
      }
    },
    [setEvents, syncUrl, queueCalendarCall]
  )

  const updateEvent = useCallback(
    (id, patch) => {
      const existing = events.find((e) => e.id === id)
      const calendarEventId = existing?.calendarEventId || null
      setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)))

      if (syncUrl && calendarEventId && (patch.title || patch.start || patch.end)) {
        setCalendarPushStatus("pushing")
        queueCalendarCall(() =>
          sheetsSync.updateCalendarEvent(syncUrl, {
            calendarEventId,
            title: patch.title,
            startISO: patch.start,
            endISO: patch.end,
          })
        )
          .then(() => {
            setCalendarPushStatus("pushed")
            setCalendarPushError(null)
          })
          .catch((err) => {
            setCalendarPushStatus("error")
            setCalendarPushError(err.message)
          })
      }
    },
    [events, setEvents, syncUrl, queueCalendarCall]
  )

  const deleteEvent = useCallback(
    (id) => {
      const existing = events.find((e) => e.id === id)
      const calendarEventId = existing?.calendarEventId || null
      setEvents((prev) => prev.filter((e) => e.id !== id))

      if (syncUrl && calendarEventId) {
        setCalendarPushStatus("pushing")
        queueCalendarCall(() => sheetsSync.deleteCalendarEvent(syncUrl, calendarEventId))
          .then(() => {
            setCalendarPushStatus("pushed")
            setCalendarPushError(null)
          })
          .catch((err) => {
            setCalendarPushStatus("error")
            setCalendarPushError(err.message)
          })
      }
    },
    [events, setEvents, syncUrl, queueCalendarCall]
  )

  const addTask = useCallback(
    (task) => {
      setTasks((prev) => [...prev, { id: uid("t"), status: "todo", priority: "medium", ...task }])
    },
    [setTasks]
  )

  const updateTask = useCallback(
    (id, patch) => {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
    },
    [setTasks]
  )

  const deleteTask = useCallback(
    (id) => {
      setTasks((prev) => prev.filter((t) => t.id !== id))
    },
    [setTasks]
  )

  const toggleTaskDone = useCallback(
    (id) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: t.status === "done" ? "todo" : "done" } : t))
      )
    },
    [setTasks]
  )

  const updateSettings = useCallback(
    (patch) => {
      setSettings((prev) => ({ ...prev, ...patch }))
    },
    [setSettings]
  )

  const exportData = useCallback(() => {
    return {
      courses,
      events,
      tasks,
      studyHistory,
      heatmap,
      alarms,
      settings,
      exportedAt: new Date().toISOString(),
      version: 1,
    }
  }, [courses, events, tasks, studyHistory, heatmap, alarms, settings])

  const importData = useCallback(
    (data) => {
      if (!data || typeof data !== "object") return false
      if (Array.isArray(data.courses)) setCourses(data.courses)
      if (Array.isArray(data.events)) setEvents(data.events)
      if (Array.isArray(data.tasks)) setTasks(data.tasks)
      if (Array.isArray(data.studyHistory)) setStudyHistory(data.studyHistory)
      if (Array.isArray(data.heatmap)) setHeatmap(data.heatmap)
      if (Array.isArray(data.alarms)) setAlarms(data.alarms)
      if (data.settings && typeof data.settings === "object")
        setSettings((prev) => ({ ...prev, ...data.settings }))
      return true
    },
    [setCourses, setEvents, setTasks, setStudyHistory, setHeatmap, setAlarms, setSettings]
  )

  const resetAllData = useCallback(() => {
    setCourses(seedCourses)
    setEvents(seedEvents)
    setTasks(seedTasks)
    setStudyHistory(seedStudyHistory)
    setHeatmap(seedHeatmap)
    setAlarms(seedAlarms)
    setSettings((prev) => ({
      ...seedSettings,
      syncEnabled: prev.syncEnabled,
      appsScriptUrl: prev.appsScriptUrl,
    }))
  }, [setCourses, setEvents, setTasks, setStudyHistory, setHeatmap, setAlarms, setSettings])

  const value = useMemo(
    () => ({
      courses,
      events,
      tasks,
      studyHistory,
      heatmap,
      alarms,
      settings,
      addCourse,
      updateCourse,
      deleteCourse,
      deleteCourseEvents,
      deleteAllEvents,
      upsertCourseNote,
      deleteCourseNote,
      addResourceLink,
      deleteResourceLink,
      addSyllabusTopic,
      toggleSyllabusTopic,
      deleteSyllabusTopic,
      addAlarm,
      updateAlarm,
      deleteAlarm,
      logStudySession,
      addEvent,
      updateEvent,
      deleteEvent,
      addTask,
      updateTask,
      deleteTask,
      toggleTaskDone,
      updateSettings,
      exportData,
      importData,
      resetAllData,
      syncStatus,
      syncError,
      syncNow,
      pushSettingsNow,
      googleCalendarEvents,
      calendarSyncStatus,
      pullGoogleCalendarEvents,
      calendarPushStatus,
      calendarPushError,
    }),
    [
      courses,
      events,
      tasks,
      studyHistory,
      heatmap,
      alarms,
      settings,
      addCourse,
      updateCourse,
      deleteCourse,
      deleteCourseEvents,
      deleteAllEvents,
      upsertCourseNote,
      deleteCourseNote,
      addResourceLink,
      deleteResourceLink,
      addSyllabusTopic,
      toggleSyllabusTopic,
      deleteSyllabusTopic,
      addAlarm,
      updateAlarm,
      deleteAlarm,
      logStudySession,
      addEvent,
      updateEvent,
      deleteEvent,
      addTask,
      updateTask,
      deleteTask,
      toggleTaskDone,
      updateSettings,
      googleCalendarEvents,
      calendarSyncStatus,
      pullGoogleCalendarEvents,
      calendarPushStatus,
      calendarPushError,
      syncStatus,
      syncError,
      syncNow,
      pushSettingsNow,
      exportData,
      importData,
      resetAllData,
    ]
  )

  return <StudyStoreContext.Provider value={value}>{children}</StudyStoreContext.Provider>
}

export function useStudyStore() {
  const ctx = useContext(StudyStoreContext)
  if (!ctx) throw new Error("useStudyStore must be used within a StudyStoreProvider")
  return ctx
}
