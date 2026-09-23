// Mock/seed data used the first time the app runs (no LocalStorage data yet).

export const COURSE_COLORS = [
  "emerald",
  "indigo",
  "amber",
  "rose",
  "sky",
  "violet",
  "teal",
  "fuchsia",
  "orange",
]

export const seedCourses = [
  {
    id: "c1",
    name: "אלגברה לינארית ב׳",
    code: "MATH-204",
    credits: 5,
    color: "indigo",
    assignmentsTotal: 8,
    assignmentsDone: 6,
    weeklyHours: 4.5,
    links: [{ label: "אתר הקורס", url: "https://example.edu/math204" }],
    notes: [],
    resourceLinks: [],
    syllabusTopics: [],
  },
  {
    id: "c2",
    name: "מבני נתונים",
    code: "CS-210",
    credits: 6,
    color: "emerald",
    assignmentsTotal: 10,
    assignmentsDone: 7,
    weeklyHours: 6,
    links: [{ label: "GitHub Classroom", url: "https://example.edu/cs210" }],
    notes: [],
    resourceLinks: [],
    syllabusTopics: [],
  },
  {
    id: "c3",
    name: "כימיה אורגנית",
    code: "CHEM-150",
    credits: 5,
    color: "amber",
    assignmentsTotal: 6,
    assignmentsDone: 2,
    weeklyHours: 3,
    links: [{ label: "מדריך מעבדה", url: "https://example.edu/chem150" }],
    notes: [],
    resourceLinks: [],
    syllabusTopics: [],
  },
  {
    id: "c4",
    name: "מיקרו-כלכלה",
    code: "ECON-101",
    credits: 4,
    color: "rose",
    assignmentsTotal: 5,
    assignmentsDone: 5,
    weeklyHours: 2,
    links: [{ label: "מצגות", url: "https://example.edu/econ101" }],
    notes: [],
    resourceLinks: [],
    syllabusTopics: [],
  },
  {
    id: "c5",
    name: "מערכות ספרתיות",
    code: "EE-220",
    credits: 5,
    color: "sky",
    assignmentsTotal: 7,
    assignmentsDone: 3,
    weeklyHours: 3.5,
    links: [{ label: "פורטל מעבדה", url: "https://example.edu/ee220" }],
    notes: [],
    resourceLinks: [],
    syllabusTopics: [],
  },
]

function toISO(daysFromNow, hour = 9, minute = 0) {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

// weekday offsets computed relative to "today" for demo purposes
export const seedEvents = [
  {
    id: "e1",
    title: "הרצאה באלגברה לינארית",
    courseId: "c1",
    type: "lecture",
    start: toISO(0, 9, 0),
    end: toISO(0, 10, 30),
    location: "אולם B",
  },
  {
    id: "e2",
    title: "תרגול במבני נתונים",
    courseId: "c2",
    type: "tutorial",
    start: toISO(0, 11, 0),
    end: toISO(0, 12, 0),
    location: "חדר 208",
  },
  {
    id: "e3",
    title: "הגשת תרגיל בית 4",
    courseId: "c1",
    type: "assignment",
    start: toISO(1, 23, 59),
    end: toISO(1, 23, 59),
  },
  {
    id: "e4",
    title: "מעבדה בכימיה אורגנית",
    courseId: "c3",
    type: "lecture",
    start: toISO(1, 13, 0),
    end: toISO(1, 16, 0),
    location: "בניין המדעים, קומה 3",
  },
  {
    id: "e5",
    title: "למידה עצמאית: אלגוריתמי מיון",
    courseId: "c2",
    type: "self-study",
    start: toISO(2, 15, 0),
    end: toISO(2, 17, 0),
    location: "ספרייה, חדר 2",
  },
  {
    id: "e6",
    title: "הרצאה במיקרו-כלכלה",
    courseId: "c4",
    type: "lecture",
    start: toISO(2, 10, 0),
    end: toISO(2, 11, 30),
    location: "אולם C",
  },
  {
    id: "e7",
    title: "הגשת מטלה במערכות ספרתיות",
    courseId: "c5",
    type: "assignment",
    start: toISO(3, 23, 59),
    end: toISO(3, 23, 59),
  },
  {
    id: "e8",
    title: "תרגול במערכות ספרתיות",
    courseId: "c5",
    type: "tutorial",
    start: toISO(3, 9, 0),
    end: toISO(3, 10, 0),
    location: "חדר 114",
  },
  {
    id: "e9",
    title: "למידה עצמאית: חזרה בכימיה",
    courseId: "c3",
    type: "self-study",
    start: toISO(4, 14, 0),
    end: toISO(4, 15, 30),
    location: "ספרייה, חדר 2",
  },
  {
    id: "e10",
    title: "תרגול באלגברה לינארית",
    courseId: "c1",
    type: "tutorial",
    start: toISO(4, 11, 0),
    end: toISO(4, 12, 0),
    location: "חדר 208",
  },
  {
    id: "e11",
    title: "הכנה למבחן אמצע במבני נתונים",
    courseId: "c2",
    type: "self-study",
    start: toISO(-1, 16, 0),
    end: toISO(-1, 18, 0),
    location: "ספרייה, חדר 2",
  },
  {
    id: "e12",
    title: "הגשת תרגיל בית במיקרו-כלכלה",
    courseId: "c4",
    type: "assignment",
    start: toISO(-2, 23, 59),
    end: toISO(-2, 23, 59),
  },
]

export const seedTasks = [
  {
    id: "t1",
    title: "לסיים תרגיל בית 4",
    courseId: "c1",
    status: "in-progress",
    priority: "high",
    dueDate: toISO(1, 23, 59),
    estimateMinutes: 120,
  },
  {
    id: "t2",
    title: "לקרוא פרק 6 - עצים",
    courseId: "c2",
    status: "todo",
    priority: "medium",
    dueDate: toISO(2, 23, 59),
    estimateMinutes: 60,
  },
  {
    id: "t3",
    title: "דוח מעבדה - אסטריפיקציה",
    courseId: "c3",
    status: "todo",
    priority: "high",
    dueDate: toISO(4, 23, 59),
    estimateMinutes: 90,
  },
  {
    id: "t4",
    title: "לחזור על סיכומי היצע וביקוש",
    courseId: "c4",
    status: "done",
    priority: "low",
    dueDate: toISO(-1, 23, 59),
    estimateMinutes: 45,
  },
  {
    id: "t5",
    title: "מטלה 3 במערכות ספרתיות",
    courseId: "c5",
    status: "in-progress",
    priority: "high",
    dueDate: toISO(3, 23, 59),
    estimateMinutes: 150,
  },
  {
    id: "t6",
    title: "תרגול אלכסון מטריצות",
    courseId: "c1",
    status: "todo",
    priority: "medium",
    dueDate: toISO(5, 23, 59),
    estimateMinutes: 40,
  },
  {
    id: "t7",
    title: "מימוש עץ חיפוש בינארי",
    courseId: "c2",
    status: "todo",
    priority: "high",
    dueDate: toISO(6, 23, 59),
    estimateMinutes: 100,
  },
  {
    id: "t8",
    title: "צפייה בהקלטת הרצאה 5",
    courseId: "c4",
    status: "done",
    priority: "low",
    dueDate: toISO(-3, 23, 59),
    estimateMinutes: 50,
  },
]

// Study hours per day (last 7 days) for the analytics chart
export const seedStudyHistory = (() => {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push({
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("he-IL", { weekday: "short" }),
      hours: Math.round((Math.random() * 4 + 1) * 10) / 10,
    })
  }
  return days
})()

// Productivity heatmap: 7 days x 6 time blocks, values 0-4 (intensity)
export const seedHeatmap = (() => {
  const blocks = ["6-9", "9-12", "12-15", "15-18", "18-21", "21-24"]
  const days = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"]
  const grid = []
  for (const day of days) {
    for (const block of blocks) {
      grid.push({ day, block, value: Math.floor(Math.random() * 5) })
    }
  }
  return grid
})()

export const seedSettings = {
  theme: "light",
  semesterName: "סמסטר סתיו 2026",
  semesterEnd: (() => {
    const d = new Date()
    d.setDate(d.getDate() + 84)
    return d.toISOString()
  })(),
  totalCreditsGoal: 160,
  completedCredits: 18,
  syncEnabled: false,
  appsScriptUrl: "",
  notificationsEnabled: false,
  classLeadTimeMinutes: 10,
  assignmentAlertStagesHours: [24, 3],
  telegramBotToken: "",
  telegramChatId: "",
}

// Custom per-course/per-event textual reminders (e.g. "Bring formula sheet").
// {id, message, courseId?, eventId?, triggerMinutesBefore, enabled}
export const seedAlarms = []
