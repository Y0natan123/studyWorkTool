/**
 * Study Monitor Sync — Google Apps Script backend.
 *
 * Setup:
 * 1. Make a copy of the template Google Sheet (or create a blank Sheet).
 * 2. Extensions > Apps Script, paste this whole file in as Code.gs.
 * 3. Deploy > New deployment > type "Web app".
 *    - Execute as: Me
 *    - Who has access: Anyone (the URL itself is the secret)
 * 4. Copy the deployment URL and paste it into the app's Settings page.
 *
 * Each collection lives in its own sheet tab, one JSON-serialized row per record
 * plus an "id" column used as the primary key. Tabs are created on first use.
 *
 * Calendar sync (createCalendarEvent / updateCalendarEvent / deleteCalendarEvent /
 * getCalendarEvents) reads and writes the user's DEFAULT Google Calendar via
 * CalendarApp.getDefaultCalendar() — the same calendar as their main personal one.
 * Redeploying after adding this requires re-authorizing the script for Calendar access.
 *
 * Telegram reminders (custom per-course alarms only): sendDueTelegramReminders() is meant
 * to run on a time-driven trigger (Triggers > Add Trigger > time-driven > every 15 min —
 * this is a ONE-TIME MANUAL step in the Apps Script editor, it cannot be installed by
 * running the script or by the web app). It reads the "alarms" and "events" sheets
 * directly (not via the web app), computes which enabled alarms are due, and sends a
 * Telegram message via the bot token/chat ID stored in "settings". Already-sent alarms
 * are tracked in Script Properties (sendTelegramReminders_sentIds), NOT written back onto
 * the alarm record itself — the app can freely overwrite the "alarms" sheet from the
 * browser (e.g. adding a new alarm pushes the whole local array) without that clobbering
 * the "already sent" bookkeeping.
 */

var COLLECTIONS = ["courses", "events", "tasks", "studyHistory", "heatmap", "alarms", "settings"];

function doGet(e) {
  var action = (e.parameter.action || "pullAll");
  if (action === "pullAll") {
    return jsonResponse(pullAll());
  }
  if (action === "getCalendarEvents") {
    try {
      return jsonResponse({
        events: getCalendarEvents(e.parameter.startISO, e.parameter.endISO),
      });
    } catch (err) {
      return jsonResponse({ error: String(err) }, 500);
    }
  }
  return jsonResponse({ error: "Unknown action: " + action }, 400);
}

function doPost(e) {
  var body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  var action = body.action;
  try {
    if (action === "pushAll") {
      pushAll(body.data);
      return jsonResponse({ ok: true });
    }
    if (action === "upsert") {
      upsertRecord(body.collection, body.record);
      return jsonResponse({ ok: true });
    }
    if (action === "delete") {
      deleteRecord(body.collection, body.id);
      return jsonResponse({ ok: true });
    }
    if (action === "setSettings") {
      setSettings(body.settings);
      return jsonResponse({ ok: true });
    }
    if (action === "createCalendarEvent") {
      var calendarEventId = createCalendarEvent(body.title, body.startISO, body.endISO, body.description);
      return jsonResponse({ ok: true, calendarEventId: calendarEventId });
    }
    if (action === "updateCalendarEvent") {
      updateCalendarEvent(body.calendarEventId, body.title, body.startISO, body.endISO);
      return jsonResponse({ ok: true });
    }
    if (action === "deleteCalendarEvent") {
      deleteCalendarEvent(body.calendarEventId);
      return jsonResponse({ ok: true });
    }
    if (action === "sendTelegramTest") {
      var settingsForTest = readCollection("settings")[0] || {};
      sendTelegramMessage(
        settingsForTest.telegramBotToken,
        settingsForTest.telegramChatId,
        "✅ חיבור טלגרם פעיל — ההתראות מוכנות."
      );
      return jsonResponse({ ok: true });
    }
    return jsonResponse({ error: "Unknown action: " + action }, 400);
  } catch (err) {
    return jsonResponse({ error: String(err) }, 500);
  }
}

function jsonResponse(obj, statusCode) {
  var out = ContentService.createTextOutput(JSON.stringify(obj));
  out.setMimeType(ContentService.MimeType.JSON);
  return out;
}

function getSheet(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(["id", "json"]);
  }
  return sheet;
}

function readCollection(name) {
  var sheet = getSheet(name);
  var rows = sheet.getDataRange().getValues();
  var records = [];
  for (var i = 1; i < rows.length; i++) {
    var id = rows[i][0];
    var json = rows[i][1];
    if (!id && !json) continue;
    try {
      records.push(JSON.parse(json));
    } catch (err) {
      // skip malformed row
    }
  }
  return records;
}

function writeCollection(name, records) {
  var sheet = getSheet(name);
  sheet.clear();
  sheet.appendRow(["id", "json"]);
  if (!records || !records.length) return;
  var rows = records.map(function (r) {
    return [r.id || "", JSON.stringify(r)];
  });
  sheet.getRange(2, 1, rows.length, 2).setValues(rows);
}

function pullAll() {
  var result = {};
  COLLECTIONS.forEach(function (name) {
    if (name === "settings") {
      var records = readCollection("settings");
      result.settings = records.length ? records[0] : null;
    } else {
      result[name] = readCollection(name);
    }
  });
  return result;
}

function pushAll(data) {
  COLLECTIONS.forEach(function (name) {
    if (name === "settings") {
      if (data.settings) writeCollection("settings", [data.settings]);
    } else if (Array.isArray(data[name])) {
      writeCollection(name, data[name]);
    }
  });
}

function upsertRecord(collectionName, record) {
  if (COLLECTIONS.indexOf(collectionName) === -1) {
    throw new Error("Unknown collection: " + collectionName);
  }
  var sheet = getSheet(collectionName);
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === record.id) {
      sheet.getRange(i + 1, 1, 1, 2).setValues([[record.id, JSON.stringify(record)]]);
      return;
    }
  }
  sheet.appendRow([record.id, JSON.stringify(record)]);
}

function deleteRecord(collectionName, id) {
  if (COLLECTIONS.indexOf(collectionName) === -1) {
    throw new Error("Unknown collection: " + collectionName);
  }
  var sheet = getSheet(collectionName);
  var rows = sheet.getDataRange().getValues();
  for (var i = rows.length - 1; i >= 1; i--) {
    if (rows[i][0] === id) {
      sheet.deleteRow(i + 1);
    }
  }
}

function setSettings(settings) {
  writeCollection("settings", [settings]);
}

function getCalendarEvents(startISO, endISO) {
  if (!startISO || !endISO) {
    throw new Error("startISO and endISO are required");
  }
  var calendar = CalendarApp.getDefaultCalendar();
  var events = calendar.getEvents(new Date(startISO), new Date(endISO));
  return events.map(function (ev) {
    return {
      calendarEventId: ev.getId(),
      title: ev.getTitle(),
      startISO: ev.getStartTime().toISOString(),
      endISO: ev.getEndTime().toISOString(),
      description: ev.getDescription(),
    };
  });
}

function createCalendarEvent(title, startISO, endISO, description) {
  var calendar = CalendarApp.getDefaultCalendar();
  var event = calendar.createEvent(title, new Date(startISO), new Date(endISO), {
    description: description || "",
  });
  return event.getId();
}

function updateCalendarEvent(calendarEventId, title, startISO, endISO) {
  if (!calendarEventId) {
    throw new Error("calendarEventId is required");
  }
  var calendar = CalendarApp.getDefaultCalendar();
  var event = calendar.getEventById(calendarEventId);
  if (!event) {
    throw new Error("Calendar event not found: " + calendarEventId);
  }
  if (title) event.setTitle(title);
  if (startISO && endISO) event.setTime(new Date(startISO), new Date(endISO));
}

function deleteCalendarEvent(calendarEventId) {
  if (!calendarEventId) {
    throw new Error("calendarEventId is required");
  }
  var calendar = CalendarApp.getDefaultCalendar();
  var event = calendar.getEventById(calendarEventId);
  if (event) event.deleteEvent();
}

function sendTelegramMessage(botToken, chatId, text) {
  if (!botToken || !chatId) {
    throw new Error("Telegram bot token / chat ID not configured");
  }
  var url = "https://api.telegram.org/bot" + botToken + "/sendMessage";
  var response = UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({ chat_id: chatId, text: text }),
    muteHttpExceptions: true,
  });
  var result = JSON.parse(response.getContentText());
  if (!result.ok) {
    throw new Error("Telegram API error: " + (result.description || response.getContentText()));
  }
}

// Time-driven trigger entry point (install manually: Triggers > Add Trigger > time-driven
// > every 15 minutes). Sends a Telegram message for each enabled custom alarm that is due
// (its linked event starts within triggerMinutesBefore, within the next 15-min window) and
// hasn't already been sent. "Already sent" is tracked in Script Properties, keyed by
// alarm id, so it survives the browser app overwriting the alarms sheet on its next sync.
function sendDueTelegramReminders() {
  var settings = readCollection("settings")[0] || {};
  if (!settings.telegramBotToken || !settings.telegramChatId) return;

  var alarms = readCollection("alarms");
  if (!alarms.length) return;

  var events = readCollection("events");
  var eventsById = {};
  events.forEach(function (e) {
    eventsById[e.id] = e;
  });

  var courses = readCollection("courses");
  var coursesById = {};
  courses.forEach(function (c) {
    coursesById[c.id] = c;
  });

  var props = PropertiesService.getScriptProperties();
  var sentIdsRaw = props.getProperty("sendTelegramReminders_sentIds");
  var sentIds = sentIdsRaw ? JSON.parse(sentIdsRaw) : [];
  var sentIdsSet = {};
  sentIds.forEach(function (id) {
    sentIdsSet[id] = true;
  });

  var now = new Date().getTime();
  var CHECK_WINDOW_MS = 15 * 60 * 1000; // matches the trigger's own interval
  var newlySent = [];

  alarms.forEach(function (alarm) {
    if (!alarm.enabled || !alarm.eventId || sentIdsSet[alarm.id]) return;
    var event = eventsById[alarm.eventId];
    if (!event) return;

    var eventStartMs = new Date(event.start).getTime();
    var triggerAtMs = eventStartMs - (alarm.triggerMinutesBefore || 0) * 60 * 1000;

    // Due if the trigger moment falls within this run's lookback window and the event
    // hasn't already started.
    if (now >= triggerAtMs && now < triggerAtMs + CHECK_WINDOW_MS && eventStartMs > now) {
      var course = coursesById[alarm.courseId];
      var prefix = course ? "תזכורת ל" + (course.code || course.name) : "תזכורת";
      var text = prefix + ": " + alarm.message + "\n" + event.title;
      try {
        sendTelegramMessage(settings.telegramBotToken, settings.telegramChatId, text);
        newlySent.push(alarm.id);
      } catch (err) {
        // one failed send shouldn't stop the rest of this run
      }
    }
  });

  if (newlySent.length) {
    // Keep the stored set from growing forever — drop ids for alarms that no longer
    // exist (deleted or long past).
    var stillRelevant = sentIds.filter(function (id) {
      return alarms.some(function (a) {
        return a.id === id;
      });
    });
    props.setProperty(
      "sendTelegramReminders_sentIds",
      JSON.stringify(stillRelevant.concat(newlySent))
    );
  }
}
