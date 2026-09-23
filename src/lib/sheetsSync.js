// Thin client for the Google Apps Script web app backend (see appsscript/Code.gs).
// All requests use no-cors-safe simple requests (text/plain) since Apps Script
// web apps don't reliably support CORS preflight for application/json.

async function post(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (json && json.error) throw new Error(json.error)
  return json
}

export async function pullAll(url) {
  const res = await fetch(`${url}?action=pullAll`, { method: "GET" })
  const json = await res.json()
  if (json && json.error) throw new Error(json.error)
  return json
}

export async function pushAll(url, data) {
  return post(url, { action: "pushAll", data })
}

export async function upsertRecord(url, collection, record) {
  return post(url, { action: "upsert", collection, record })
}

export async function deleteRecord(url, collection, id) {
  return post(url, { action: "delete", collection, id })
}

export async function pushSettings(url, settings) {
  return post(url, { action: "setSettings", settings })
}

export async function getCalendarEvents(url, startISO, endISO) {
  const qs = new URLSearchParams({ action: "getCalendarEvents", startISO, endISO })
  const res = await fetch(`${url}?${qs.toString()}`, { method: "GET" })
  const json = await res.json()
  if (json && json.error) throw new Error(json.error)
  return json.events
}

export async function createCalendarEvent(url, { title, startISO, endISO, description }) {
  const json = await post(url, { action: "createCalendarEvent", title, startISO, endISO, description })
  return json.calendarEventId
}

export async function updateCalendarEvent(url, { calendarEventId, title, startISO, endISO }) {
  return post(url, { action: "updateCalendarEvent", calendarEventId, title, startISO, endISO })
}

export async function deleteCalendarEvent(url, calendarEventId) {
  return post(url, { action: "deleteCalendarEvent", calendarEventId })
}

export async function sendTelegramTest(url) {
  return post(url, { action: "sendTelegramTest" })
}
