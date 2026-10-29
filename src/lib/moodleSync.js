// Thin client for the Technion Moodle REST web service (moodle26.technion.ac.il).
// The user generates a personal access token in Moodle (Preferences > Security
// keys > Manage tokens) and pastes it into Settings — no password ever touches
// this app. The endpoint sends Access-Control-Allow-Origin: *, so plain browser
// fetch() calls work without a backend proxy.

const BASE_URL = "https://moodle26.technion.ac.il/webservice/rest/server.php"

async function callFunction(token, wsfunction, params = {}) {
  const qs = new URLSearchParams({
    wstoken: token,
    wsfunction,
    moodlewsrestformat: "json",
    ...params,
  })
  const res = await fetch(`${BASE_URL}?${qs.toString()}`, { method: "GET" })
  const json = await res.json()
  if (json && json.exception) {
    throw new Error(json.message || json.errorcode || "שגיאת Moodle")
  }
  return json
}

// Validates the token and returns { userid, sitename, ... }.
export async function getSiteInfo(token) {
  return callFunction(token, "core_webservice_get_site_info")
}

export async function getUserCourses(token, userId) {
  const courses = await callFunction(token, "core_enrol_get_users_courses", { userid: userId })
  return Array.isArray(courses) ? courses : []
}

// Returns assignments grouped by course: [{ id: courseId, assignments: [...] }]
export async function getAssignments(token, courseIds) {
  const params = {}
  courseIds.forEach((id, i) => {
    params[`courseids[${i}]`] = id
  })
  const data = await callFunction(token, "mod_assign_get_assignments", params)
  return Array.isArray(data?.courses) ? data.courses : []
}

// Returns course content sections, each with modules/resources (files, folders, etc.)
export async function getCourseContents(token, courseId) {
  try {
    const sections = await callFunction(token, "core_course_get_contents", { courseid: courseId })
    return Array.isArray(sections) ? sections : []
  } catch {
    // Some tokens/services don't expose this function — treat as "no files available"
    // rather than failing the whole sync.
    return []
  }
}
