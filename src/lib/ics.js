// Minimal RFC 5545 (.ics) generator — builds a VCALENDAR with one VEVENT per event.
// Client-side only, no backend involved: this just serializes the app's local `events`
// array into a file a user can import into any calendar app (Apple/Outlook/Google/etc.).

function escapeText(str) {
  return String(str || "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n")
}

// RFC 5545 wants folded lines no longer than 75 octets, continued with a leading space.
function foldLine(line) {
  if (line.length <= 75) return line
  const parts = []
  let rest = line
  while (rest.length > 75) {
    parts.push(rest.slice(0, 75))
    rest = " " + rest.slice(75)
  }
  parts.push(rest)
  return parts.join("\r\n")
}

function toIcsUtc(dateInput) {
  const d = new Date(dateInput)
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
}

export function buildIcs(events, { courseById = {}, calendarName = "Study Monitor" } = {}) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Study Monitor//He//",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${escapeText(calendarName)}`,
  ]

  const now = toIcsUtc(new Date())

  events.forEach((ev) => {
    const course = courseById[ev.courseId]
    const summary = course ? `${ev.title} (${course.code || course.name})` : ev.title
    lines.push("BEGIN:VEVENT")
    lines.push(`UID:${ev.id}@study-monitor`)
    lines.push(`DTSTAMP:${now}`)
    lines.push(`DTSTART:${toIcsUtc(ev.start)}`)
    lines.push(`DTEND:${toIcsUtc(ev.end)}`)
    lines.push(foldLine(`SUMMARY:${escapeText(summary)}`))
    if (ev.location) {
      lines.push(foldLine(`LOCATION:${escapeText(ev.location)}`))
    }
    lines.push("END:VEVENT")
  })

  lines.push("END:VCALENDAR")
  return lines.join("\r\n")
}

export function downloadIcs(icsText, filename = "study-monitor.ics") {
  const blob = new Blob([icsText], { type: "text/calendar;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function unescapeText(str) {
  return String(str || "")
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\")
}

// Unfolds RFC 5545 continuation lines (a line starting with a space or tab continues
// the previous line) and normalizes CRLF/LF.
function unfoldLines(text) {
  const rawLines = text.replace(/\r\n/g, "\n").split("\n")
  const lines = []
  rawLines.forEach((line) => {
    if ((line.startsWith(" ") || line.startsWith("\t")) && lines.length) {
      lines[lines.length - 1] += line.slice(1)
    } else if (line.length) {
      lines.push(line)
    }
  })
  return lines
}

// Israel Standard/Daylight Time offset, in hours, for a given *local* Y/M/D/H/M reading
// (i.e. the wall-clock time already written in the file, before we know the UTC instant).
// DST in Israel runs from the last Friday of March 02:00 to the last Sunday of October
// 02:00 (the exact rule the file's own VTIMEZONE block encodes for Asia/Jerusalem). This
// is a pragmatic special-case for the one named zone real-world exports from Israeli
// university tools (CheeseFork and similar) actually use — not a general TZID resolver.
function israelUtcOffsetHours(year, month, day, hour) {
  function lastWeekdayOfMonth(y, m, weekday) {
    // m is 1-indexed; walk backward from the last day of the month to the target weekday
    const d = new Date(y, m, 0) // day 0 of next month = last day of this month
    while (d.getDay() !== weekday) d.setDate(d.getDate() - 1)
    return d
  }
  const dstStart = lastWeekdayOfMonth(year, 3, 5) // last Friday of March
  const dstEnd = lastWeekdayOfMonth(year, 10, 0) // last Sunday of October
  const current = new Date(year, month - 1, day, hour)
  const afterStart = current >= new Date(dstStart.getFullYear(), dstStart.getMonth(), dstStart.getDate(), 2)
  const beforeEnd = current < new Date(dstEnd.getFullYear(), dstEnd.getMonth(), dstEnd.getDate(), 2)
  return afterStart && beforeEnd ? 3 : 2
}

// Parses a DTSTART/DTEND value into an ISO string. `tzid`, if given (from a ;TZID= param
// on the same line), is used to resolve local wall-clock time to the correct UTC instant —
// currently only "Asia/Jerusalem" is resolved precisely; any other named zone falls back to
// UTC+2 (a reasonable default for Israel-focused calendar exports, better than silently
// treating it as UTC or as the browser's own local time). Handles: UTC ("...Z"), TZID-
// qualified local time, plain floating local time, and all-day date-only ("YYYYMMDD").
function parseIcsDate(value, tzid) {
  if (/^\d{8}$/.test(value)) {
    // date-only (all-day event) — treat as local midnight, no timezone math needed
    const y = value.slice(0, 4)
    const m = value.slice(4, 6)
    const d = value.slice(6, 8)
    return new Date(`${y}-${m}-${d}T00:00:00`).toISOString()
  }

  const isUtc = value.endsWith("Z")
  const clean = value.replace("Z", "")
  const y = Number(clean.slice(0, 4))
  const m = Number(clean.slice(4, 6))
  const d = Number(clean.slice(6, 8))
  const hh = Number(clean.slice(9, 11) || "0")
  const mm = Number(clean.slice(11, 13) || "0")
  const ss = Number(clean.slice(13, 15) || "0")

  if (isUtc) {
    return new Date(Date.UTC(y, m - 1, d, hh, mm, ss)).toISOString()
  }

  if (tzid) {
    // Resolve the named zone's offset for this wall-clock reading, then build the UTC
    // instant directly — do NOT use `new Date(isoWithNoZ)`, since that's interpreted in
    // the *browser's* local zone, not the file's declared zone.
    const offsetHours = tzid.includes("Jerusalem") ? israelUtcOffsetHours(y, m, d, hh) : 2
    return new Date(Date.UTC(y, m - 1, d, hh - offsetHours, mm, ss)).toISOString()
  }

  // No TZID and no "Z" — a genuinely floating local time; interpret in the browser's own
  // zone, same as before.
  return new Date(`${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}T${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`).toISOString()
}

// Parses an RRULE value's FREQ/UNTIL/COUNT (only what's needed for weekly expansion — any
// other FREQ is left un-expanded, i.e. treated as a single occurrence, since this app has
// no use for daily/monthly recurrence today).
function parseWeeklyRrule(value) {
  const parts = {}
  value.split(";").forEach((pair) => {
    const [k, v] = pair.split("=")
    parts[k] = v
  })
  if (parts.FREQ !== "WEEKLY") return null
  const until = parts.UNTIL ? parseIcsDate(parts.UNTIL) : null
  const count = parts.COUNT ? Number(parts.COUNT) : null
  return { until, count }
}

// Heuristic categorizer: guesses an app `type` (lecture/tutorial/assignment/self-study)
// from the event title, since real-world .ics exports (course schedule tools, personal
// calendars) don't carry this app's own type field. Hebrew keyword match first (these
// files are Hebrew-authored), falling back to English, then a default.
const TYPE_KEYWORDS = [
  { type: "lecture", words: ["הרצאה", "lecture"] },
  { type: "tutorial", words: ["תרגול", "סמינר", "מעבדה", "tutorial", "seminar", "lab"] },
  { type: "assignment", words: ["מועד א", "מועד ב", "מבחן", "בוחן", "הגשה", "exam", "test", "quiz", "due"] },
]
// Personal/non-academic time blocks (meals, sport, "good time to revise X") — these are
// real calendar entries but not a class or deadline, so they map to self-study rather than
// being dropped, but are flagged separately so the review UI can pre-uncheck them if
// wanted later.
const PERSONAL_KEYWORDS = ["ריצ", "אוכל", "אידאלי", "נבחרת", "ספורט"]

export function guessEventType(title) {
  const lower = title.toLowerCase()
  for (const { type, words } of TYPE_KEYWORDS) {
    if (words.some((w) => lower.includes(w.toLowerCase()))) return type
  }
  return "self-study"
}

export function isLikelyPersonalTime(title) {
  return PERSONAL_KEYWORDS.some((w) => title.includes(w))
}

// Parses a .ics file's text into a plain array of
// {title, start, end, location?, isRecurring?, isPersonal?}. Ignores anything that isn't a
// VEVENT (timezones, alarms, etc.). Weekly RRULEs are expanded into one entry per
// occurrence (respecting UNTIL/COUNT and EXDATE exclusions); non-weekly recurrence is left
// as a single occurrence. Events with no DTEND get a same-instant end (all-day markers like
// exam dates) rather than being dropped — this app treats those as zero/short-duration
// events, matching how "Problem Set Due"-style entries already work internally. Best-effort
// — malformed events are silently skipped rather than throwing.
export function parseIcs(text) {
  const lines = unfoldLines(text)
  const events = []
  let current = null

  function paramsOf(rawKey) {
    const parts = rawKey.split(";")
    const params = {}
    parts.slice(1).forEach((p) => {
      const [k, v] = p.split("=")
      if (k && v) params[k.toUpperCase()] = v
    })
    return params
  }

  lines.forEach((line) => {
    if (line === "BEGIN:VEVENT") {
      current = { exdates: [] }
      return
    }
    if (line === "END:VEVENT") {
      if (current && current.start && current.title) {
        finalizeEvent(current, events)
      }
      current = null
      return
    }
    if (!current) return

    const colonIndex = line.indexOf(":")
    if (colonIndex === -1) return
    const rawKey = line.slice(0, colonIndex)
    const value = line.slice(colonIndex + 1)
    const key = rawKey.split(";")[0].toUpperCase()
    const params = paramsOf(rawKey)

    try {
      if (key === "SUMMARY") current.title = unescapeText(value)
      else if (key === "LOCATION") current.location = unescapeText(value) || undefined
      else if (key === "DTSTART") {
        current.start = parseIcsDate(value, params.TZID)
        current.startIsDateOnly = /^\d{8}$/.test(value)
      } else if (key === "DTEND") current.end = parseIcsDate(value, params.TZID)
      else if (key === "RRULE") current.rrule = parseWeeklyRrule(value)
      else if (key === "EXDATE") current.exdates.push(parseIcsDate(value, params.TZID))
    } catch {
      // skip unparseable date/field — the event-level check above will drop it if
      // start/title end up missing
    }
  })

  return events
}

const DEFAULT_MAX_OCCURRENCES = 26 // safety cap (~half a year of weekly classes)

function finalizeEvent(current, events) {
  const durationMs = current.end ? new Date(current.end) - new Date(current.start) : 0
  const title = current.title
  const location = current.location
  const type = guessEventType(title)
  const isPersonal = isLikelyPersonalTime(title)

  const exdateSet = new Set(current.exdates.map((d) => new Date(d).toDateString()))

  if (!current.rrule) {
    events.push({
      title,
      start: current.start,
      end: current.end || current.start,
      location,
      type,
      isPersonal,
    })
    return
  }

  // Weekly recurrence: emit one occurrence per week from DTSTART, stopping at UNTIL/COUNT/
  // the safety cap, skipping any date that matches an EXDATE.
  const { until, count } = current.rrule
  const startDate = new Date(current.start)
  const maxOccurrences = count || DEFAULT_MAX_OCCURRENCES
  let occurrenceStart = startDate

  for (let i = 0; i < maxOccurrences; i++) {
    if (until && occurrenceStart > new Date(until)) break
    if (!exdateSet.has(occurrenceStart.toDateString())) {
      const occurrenceEnd = new Date(occurrenceStart.getTime() + durationMs)
      events.push({
        title,
        start: occurrenceStart.toISOString(),
        end: (current.end ? occurrenceEnd : occurrenceStart).toISOString(),
        location,
        type,
        isPersonal,
      })
    }
    occurrenceStart = new Date(occurrenceStart.getTime() + 7 * 24 * 3600 * 1000)
  }
}
