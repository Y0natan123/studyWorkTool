// Client for the public Technion SAP course catalog, published by
// https://github.com/michael-maltsev/technion-sap-info-fetcher at
// sap.cheesefork.cf. This is a public, read-only catalog (course info +
// weekly schedule) — no login or personal data involved, and the host
// sends Access-Control-Allow-Origin: *.

const BASE_URL = "https://sap.cheesefork.cf"

const DAY_NAME_TO_INDEX = {
  ראשון: 0,
  שני: 1,
  שלישי: 2,
  רביעי: 3,
  חמישי: 4,
  שישי: 5,
  שבת: 6,
}

const SESSION_TYPE_TO_EVENT_TYPE = {
  הרצאה: "lecture",
  תרגיל: "tutorial",
  תרגול: "tutorial",
  מעבדה: "tutorial",
}

let catalogCache = null // { key: "year_semester", courses: [...] }

// Returns the most recent few semesters, newest first: [{ year, semester, start, end }]
export async function getRecentSemesters() {
  const res = await fetch(`${BASE_URL}/last_semesters.json`)
  if (!res.ok) throw new Error("לא ניתן לטעון את רשימת הסמסטרים")
  return res.json()
}

export async function getCourseCatalog(year, semester) {
  const key = `${year}_${semester}`
  if (catalogCache?.key === key) return catalogCache.courses
  const res = await fetch(`${BASE_URL}/courses_${key}.json`)
  if (!res.ok) throw new Error("לא ניתן לטעון את קטלוג הקורסים")
  const courses = await res.json()
  catalogCache = { key, courses }
  return courses
}

export function searchCourses(courses, query) {
  const q = query.trim()
  if (!q) return []
  const qLower = q.toLowerCase()
  return courses
    .filter((c) => {
      const num = c.general?.["מספר מקצוע"] || ""
      const name = c.general?.["שם מקצוע"] || ""
      return num.includes(q) || name.toLowerCase().includes(qLower)
    })
    .slice(0, 30)
}

export function getCourseGroups(course) {
  const schedule = course.schedule || []
  const groups = new Map()
  schedule.forEach((s) => {
    const g = s["קבוצה"]
    if (!groups.has(g)) groups.set(g, [])
    groups.get(g).push(s)
  })
  return Array.from(groups.entries()).map(([group, sessions]) => ({ group, sessions }))
}

function parseTimeRange(timeStr) {
  const [startStr, endStr] = (timeStr || "").split("-").map((s) => s.trim())
  if (!startStr || !endStr) return null
  const [sh, sm] = startStr.split(":").map(Number)
  const [eh, em] = endStr.split(":").map(Number)
  if ([sh, sm, eh, em].some(Number.isNaN)) return null
  return { startHour: sh, startMinute: sm, endHour: eh, endMinute: em }
}

// Builds weekly recurring event occurrences for one schedule session, from
// semesterStart to semesterEnd (both Date objects), capped at maxOccurrences.
export function buildSessionOccurrences(session, semesterStart, semesterEnd, maxOccurrences = 20) {
  const dayIndex = DAY_NAME_TO_INDEX[session["יום"]]
  const time = parseTimeRange(session["שעה"])
  if (dayIndex == null || !time) return []

  const occurrences = []
  const cursor = new Date(semesterStart)
  // advance to the first occurrence of the target weekday on/after semesterStart
  const diff = (dayIndex - cursor.getDay() + 7) % 7
  cursor.setDate(cursor.getDate() + diff)

  while (cursor <= semesterEnd && occurrences.length < maxOccurrences) {
    const start = new Date(cursor)
    start.setHours(time.startHour, time.startMinute, 0, 0)
    const end = new Date(cursor)
    end.setHours(time.endHour, time.endMinute, 0, 0)
    occurrences.push({ start, end })
    cursor.setDate(cursor.getDate() + 7)
  }
  return occurrences
}

export function sessionEventType(session) {
  return SESSION_TYPE_TO_EVENT_TYPE[session["סוג"]] || "lecture"
}

export function sessionLocation(session) {
  const building = session["בניין"]
  const room = session["חדר"]
  return [building, room].filter(Boolean).join(" ")
}
