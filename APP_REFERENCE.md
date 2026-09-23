# Study Monitor — AI Reference

Purpose-built reference for AI agents working in this codebase. Optimized for lookup, not narrative.

## 1. What this app is

A single-user, client-only React study/semester tracker: course list, weekly/daily calendar, kanban
task board, an analytics dashboard, and a "Study Now" focus mode that shows either a live-class panel
or a self-study workspace depending on whether a class is happening right now. No backend server.
Optional bidirectional sync to a Google Sheet + the user's Google Calendar, per user (each user deploys
their own Apps Script; see §7).

## 2. Stack

- React 19 + Vite 8, no TypeScript (`jsconfig.json` only, JS + JSX).
- No router. Tab-based navigation via component-key lookup in state (see §4).
- State: React Context (`StudyStoreContext`) backed by `localStorage`, optionally mirrored to Google
  Sheets + Google Calendar.
- UI: Tailwind v4, Radix UI primitives (`@radix-ui/react-*`) wrapped in `src/components/ui/`,
  `framer-motion` for transitions, `recharts` for charts, `lucide-react` for icons.
- Lint: `oxlint`.

## 3. Data model

All state lives in `src/store/StudyStoreContext.jsx`, seeded from `src/data/mockData.js`. Six
collections, each persisted under its own `localStorage` key (`sm_courses`, `sm_events`, `sm_tasks`,
`sm_study_history`, `sm_heatmap`, `sm_settings`):

| Collection | Shape (per record) | Notes |
|---|---|---|
| `courses` | `{id, name, code, credits, color, assignmentsTotal, assignmentsDone, weeklyHours, links:[{label,url}], notes:[{id,title,contentMarkdown,updatedAt}], resourceLinks:[{id,label,url,category}]}` | `color` ∈ `COURSE_COLORS = ["emerald","indigo","amber","rose","sky"]`. `category` ∈ `moodle\|drive\|recordings\|general` (`RESOURCE_LINK_CATEGORIES` in `src/lib/constants.js`). All seed courses currently have empty `notes`/`resourceLinks` arrays — no UI exists yet to populate `resourceLinks` (no Course Hub page built), so "Quick Resources" widgets will show empty until that's added or `addResourceLink` is called some other way. |
| `events` | `{id, title, courseId, type, start, end, calendarEventId?}` (ISO datetime strings) | `type` ∈ `lecture\|tutorial\|assignment\|self-study` (`EVENT_TYPES`). `calendarEventId` is set asynchronously after a successful push to Google Calendar (see §7) — absent until then, and absent forever if sync is off or the push failed. Assignment-type events render in a separate "Deadlines" row above the weekly grid, not as normal blocks. |
| `tasks` | `{id, title, courseId, status, priority, dueDate, estimateMinutes}` | `status` ∈ `todo\|in-progress\|done`. `priority` ∈ `high\|medium\|low`. `toggleTaskDone` flips only between `done`↔`todo` (never touches `in-progress`). No late-completion tracking field. |
| `studyHistory` | `{date (YYYY-MM-DD), label, hours}` | Last-7-days series for the dashboard area chart. Has a real write path now: `logStudySession` upserts by `date`, adding hours if the date already exists. |
| `heatmap` | `{day, block, value}` | 7 days × 6 blocks (`HEATMAP_DAYS`, `HEATMAP_BLOCKS = ["6-9","9-12","12-15","15-18","18-21","21-24"]`), `value` 0–4. `logStudySession` increments the matching cell, capped at 4. |
| `settings` | `{theme, semesterName, semesterEnd, totalCreditsGoal, completedCredits, syncEnabled, appsScriptUrl}` | Singleton object. `theme` ∈ `light\|dark`. |

IDs: `uid(prefix)` → `${prefix}_${base36 timestamp}_${random}`, client-side only.

**Known leftover**: `src/data/mockData.js`'s `seedEvents` still contains a test record, `e0-mock-live`
(`title: "Mock Live Lecture (test)"`, `courseId: "c1"`, `type: "lecture"`, `start`/`end` computed via
`minutesFromNow(-20)`/`minutesFromNow(70)`), added to test the Live Class Dashboard and never removed
despite its own comment saying to remove it. Because its start/end are relative to load time, it
always covers "now" on a fresh/reset app, so **"Study Now" will show the live-class panel, not
Self-Study Workspace, on any fresh install** until this record is deleted from seed data.

### Store API (`useStudyStore()`)

Course: `addCourse(course)`, `updateCourse(id, patch)`, `deleteCourse(id)` (cascades: also removes
that course's `events` and `tasks`).
Notes/links: `upsertCourseNote(courseId, note)` — pass `note.id` to update in place, omit to create;
always stamps `updatedAt`; **returns the note's id**. `deleteCourseNote(courseId, noteId)`.
`addResourceLink(courseId, link)`, `deleteResourceLink(courseId, linkId)`.
Study logging: `logStudySession(courseId, minutes, date, timeBlock)` — `date` is `"YYYY-MM-DD"`,
`timeBlock` one of `HEATMAP_BLOCKS`. Updates `courses.weeklyHours`, `studyHistory`, and `heatmap` in
one call (see §3 table). This is the only write path into `studyHistory`/`heatmap`.
Events: `addEvent`, `updateEvent(id, patch)`, `deleteEvent(id)` — all local-first; see §7 for their
Google Calendar side effects.
Tasks: `addTask`, `updateTask(id, patch)`, `deleteTask(id)`, `toggleTaskDone(id)`.
Settings: `updateSettings(patch)` (shallow merge); `pushSettingsNow(overrideSettings?)` (see §7).
Bulk: `exportData()` → `{courses, events, tasks, studyHistory, heatmap, settings, exportedAt, version:1}`;
`importData(data)`; `resetAllData()` (restores seeds, preserves `syncEnabled`/`appsScriptUrl`).
Sync status/actions: `syncStatus` (`idle|syncing|synced|error`), `syncError`, `syncNow()` (immediate
full push, bypasses debounce), `googleCalendarEvents` (last-pulled array), `calendarSyncStatus`
(`idle|loading|loaded|error` — tracks *pulling* from Calendar), `pullGoogleCalendarEvents(startISO, endISO)`,
`calendarPushStatus` (`idle|pushing|pushed|error` — tracks *pushing* to Calendar from
`addEvent`/`updateEvent`/`deleteEvent`; a distinct field from `calendarSyncStatus`), `calendarPushError`.

## 4. Navigation / composition

- `src/main.jsx` → `createRoot` renders `<App/>` in `<StrictMode>`. No router.
- `src/App.jsx`: `PAGES = {schedule, live, dashboard, tasks, settings}` → `SchedulePage`,
  `LiveClassDashboard`, `DashboardPage`, `TaskBoardPage`, `SettingsPage`. `activePage` state defaults
  to `"schedule"` — **there is no auto-redirect to `"live"` on app load**; the live-vs-self-study
  routing described in §5 is internal to `LiveClassDashboard`, only reached once the user navigates to
  the "Study Now" tab. Cmd/Ctrl+K toggles `CommandPalette`. Layout: `md:pl-16` content offset for the
  desktop rail; `<main>` has extra bottom padding on mobile (`pb-20`) to clear the floating pill nav.
- `Sidebar` (`components/layout/Sidebar.jsx`) — **desktop** (`md:flex`, hidden below): fixed left icon
  rail, 5 items (Schedule/Study Now/Analytics/Task Board/Settings), hover tooltips. **Mobile**
  (`md:hidden`): a floating rounded-pill nav bar, centered near the bottom (offset by
  `env(safe-area-inset-bottom) + 12px`), icon-only, active item lifts slightly with a filled circle in
  the app's own primary color (not a fixed brand color).
- `TopBar` (`components/layout/TopBar.jsx`) — **desktop**: full date + semester/days-left text, full
  search bar with ⌘K hint, sync status badge (Cloud/CloudOff + "Synced"/"Local"), theme toggle, Create
  button. **Mobile**: short date label, icon-only search button, and a "⋮" overflow `DropdownMenu`
  (Radix) surfacing the full date/semester/sync info as disabled menu rows instead of hiding it
  entirely; theme toggle and Create button stay visible either way.

## 5. Pages

- **SchedulePage** (`src/pages/SchedulePage.jsx`, default route) — weekly or single-day calendar.
  Local state: `selectedDate`, `weekAnchor`, `activeFilters` (event types, all on by default),
  `slotModalDate`. Uses `useIsMobile()` (see §6). Refetches Google Calendar events for the visible week
  whenever `weekAnchor` or sync settings change. **Desktop**: prev/next week nav, `CategoryFilters` in
  the left sidebar column (with `MiniCalendar` + `UpcomingFocus` above it). **Mobile**: layout order is
  reversed via `order-1`/`order-2` classes so the day-strip + grid render first (today-first, no
  scrolling past the mini-calendar); a 5-day strip (2 before/2 after `selectedDate`) replaces the week
  nav; left/right touch swipe (`SWIPE_THRESHOLD_PX = 50`) shifts `selectedDate` by ±1 day;
  `CategoryFilters` renders as a horizontal scroll-chip row (`variant="chips"`) instead of the full
  card. Passes `singleDay`/`compact` (both `= isMobile`) to `WeeklyGrid` (see §6).
- **DashboardPage** (`src/pages/DashboardPage.jsx`) — analytics. Pure composition of `KpiCards`,
  `StudyTimeChart` (renders `studyHistory`, now real data via `logStudySession`), `ProductivityHeatmap`
  (renders `heatmap`, ditto), `CourseTable`. No local state, no mobile-specific logic (Tailwind
  breakpoints only).
- **TaskBoardPage** (`src/pages/TaskBoardPage.jsx`) — kanban, 3 fixed columns. Local state:
  `courseFilter`. Columns stack vertically on mobile, side-by-side on desktop
  (`flex-col md:flex-row`) — CSS-only, no `useIsMobile`. Drag-and-drop (native HTML5 DnD) calls
  `updateTask(id, {status})`. `TaskCard` shows a rounded-full status pill (`STATUS_PILL_CLASSES` /
  `STATUS_LABELS` in the component: todo→"To do", in-progress→"In progress", done→"Done") rather than
  the plain course-code tag it used to have.
- **SettingsPage** (`src/pages/SettingsPage.jsx`) — theme toggle, semester fields (all pushed via
  `pushSettingsNow` on blur, not per-keystroke — see §7), course add/remove, JSON export/import,
  reset-to-defaults, Google Sheets sync controls, and — only when `settings.syncEnabled` is on — a
  separate "Google Calendar Sync" card showing `calendarPushStatus`/`calendarPushError` and a "Test
  Connection" button that pulls the next 30 days of Calendar events and reports the count.
- **LiveClassDashboard** (`src/pages/LiveClassDashboard.jsx`) — **this is a router, not just a live-
  class view**. Every second it checks whether a `lecture`/`tutorial` event covers `now`
  (`findActiveClassEvent`). If **none** is active, it renders `<SelfStudyWorkspace />` and returns
  early (all hooks still run unconditionally above that check — don't reintroduce an early return
  before the hooks, that broke the Rules of Hooks once already). If one **is** active, it renders: a
  progress card (elapsed/total/remaining minutes + a `Progress` bar), a Quick Notes card with
  `QUICK_TAGS = ["Important", "Exam Material", "Need to Review"]` buttons that append `**[tag]**`
  markdown into the textarea, which autosaves (1s debounce) into that course's `notes` via
  `upsertCourseNote` (tracks the returned note id in `noteId`, reset whenever the active event's `id`
  changes), a "Log Session" button (`logStudySession`), and a "Schedule Review Session" button that
  opens `QuickCreateModal` prefilled for tomorrow 6pm / self-study / 120 min.
- **SelfStudyWorkspace** (`src/pages/SelfStudyWorkspace.jsx`) — 2-column focus dashboard, shown by
  `LiveClassDashboard` when no class is active (not directly reachable via `PAGES`). Layout:
  `grid-cols-1 lg:grid-cols-[1fr_320px]` (stacks on narrower screens; no `useIsMobile`, CSS only).
  **Main column**: course-picker button grid + a free-text "topic" `Input`; a timer card
  (`PRESETS = 25min/50min` + custom-minutes input, big `mm:ss`, Start/Pause/Reset — auto-pauses at 0
  but does **not** auto-log) that gets a soft pulsing highlight ring while running; a Session Notes
  card with its own `QUICK_TAGS` (Return to TA / Hard—revisit / Exam topic, distinct wording from
  LiveClassDashboard's) and a "Complete & Log" button. **Sidebar column**: "Course Tasks" (open tasks
  for the selected course; checking one only stages its id in local `checkedTaskIds` — nothing is
  written to the store until Complete & Log calls `toggleTaskDone` for each staged id; staged checks
  are cleared if you switch courses mid-session), "Quick Resources" (renders the selected course's
  `resourceLinks`; empty for every course today, see §3), "Distraction Log" (a **session-only**,
  never-persisted scratch list of `{id, text}` for off-topic thoughts — cleared on Complete & Log or
  on leaving the page; deliberately not written to `localStorage` or the store).

## 6. Schedule grid (`src/components/schedule/WeeklyGrid.jsx`)

Props: `events, courses, activeFilters, weekAnchor, googleCalendarEvents=[], onSlotClick,
onEventChange, singleDay=false, dayAnchor, compact=false`.

- **Week vs. single-day**: `singleDay` renders just `dayAnchor`'s column instead of all 7. All
  "which day is this" logic (borders, "is today" checks) uses `days.length - 1` rather than a
  hardcoded `6`, so it already generalizes — don't reintroduce a hardcoded day count.
- **Compact mode** (`compact`, used on mobile): swaps `DAY_START_HOUR=7/DAY_END_HOUR=22/HOUR_HEIGHT=56`
  for `COMPACT_DAY_START_HOUR=8/COMPACT_DAY_END_HOUR=20/COMPACT_HOUR_HEIGHT=38`; narrower hour-label
  column (`40px` vs `56px`), smaller/abbreviated hour labels (`"8a"` vs `"8am"`); the scroll container
  gets `max-h-[calc(100vh-260px)] overflow-y-auto` as a fallback in case the compact math still
  doesn't fit a given phone (untested on real hardware — no browser automation tool is available in
  this dev environment, so this was verified by build/lint only, not a live device).
- **Create gesture**: **double-click** (not single-click) on empty grid space opens the create flow,
  by design — single-click was removed because it fired accidentally after drag releases.
- **Drag-to-move / drag-to-resize**: pointer-down on an event block starts a move drag; a bottom-edge
  handle (visible on hover, `h-3` tall for tap-friendliness) starts a resize drag (`end` only, 15-min
  minimum duration). Both snap to 15-minute increments and commit via `onEventChange(id, {start, end})`
  on pointer-up, only if something actually changed.
- **Live "Now" line**: rose-colored horizontal indicator with a small "Now" pill, only rendered in
  today's column, only within the visible hour range; ticks every 60s (not per-second — this is a
  schedule view, not a stopwatch).
- **Today highlighting**: tinted header cell + circular date badge, tinted column background.
- **External Google Calendar events**: rendered separately from app events — dashed slate border/bg,
  `"G · "` title prefix, read-only (no drag handlers), keyed by `calendarEventId`, matched by
  `startISO`/`endISO` fields (not `start`/`end` — that's the app-event field naming).
- Free-slot detection unchanged in spirit: dashed emerald blocks for gaps ≥45 min, computed across
  both app events and Google events combined.

## 7. Google Sheets + Calendar sync (optional, per-user)

Design unchanged from before: no shared backend. One deployed Apps Script Web App per user, bound to
their own Sheet, using their own default Google Calendar. The deployment URL is the only secret.

- **Backend**: `appsscript/Code.gs`. `COLLECTIONS = ["courses","events","tasks","studyHistory","heatmap","settings"]`,
  one Sheet tab per collection (`id`,`json` columns).
  - `GET ?action=pullAll` → `{courses:[], events:[], tasks:[], studyHistory:[], heatmap:[], settings:<obj|null>}`.
  - `GET ?action=getCalendarEvents&startISO=&endISO=` → `{events:[{calendarEventId,title,startISO,endISO,description}]}`.
  - `POST` actions: `pushAll {data}`, `upsert {collection,record}`, `delete {collection,id}`,
    `setSettings {settings}`, `createCalendarEvent {title,startISO,endISO,description}` →
    `{calendarEventId}`, `updateCalendarEvent {calendarEventId,title,startISO,endISO}`,
    `deleteCalendarEvent {calendarEventId}`. All Calendar actions use `CalendarApp.getDefaultCalendar()`
    — the user's actual personal calendar, not a dedicated one; redeploying after adding this feature
    requires re-authorizing Calendar access.
- **Client**: `src/lib/sheetsSync.js` — `pullAll`, `pushAll`, `upsertRecord`, `deleteRecord`,
  `pushSettings`, `getCalendarEvents`, `createCalendarEvent`, `updateCalendarEvent`,
  `deleteCalendarEvent`. POST bodies use `Content-Type: text/plain` (Apps Script CORS-preflight
  workaround). Note: `pushSettings` is exported but **not actually used** by the store — 
  `pushSettingsNow` calls `sheetsSync.pushAll(syncUrl, {settings})` directly instead.
- **Orchestration** (`StudyStoreContext.jsx`): `syncUrl = settings.syncEnabled ? settings.appsScriptUrl : ""`.
  - One-time initial pull on mount (`hasPulledRef` guard) hydrates all 6 collections.
  - `readyToPushRef` is a **ref**, not state, set `true` only in that initial pull's `.finally()`. All
    five per-collection push effects gate on `readyToPushRef.current`. **This is deliberate**: an
    earlier version gated on `syncStatus` state instead, and every completed push flipped that state,
    re-running every push effect, scheduling new pushes, forever — an infinite sync loop. Do not
    reintroduce state into that gate.
  - `courses/events/tasks/studyHistory/heatmap` auto-push per-collection, debounced 1s
    (`pushCollectionDebounced`, `SYNC_DEBOUNCE_MS`).
  - `settings` does **not** auto-push on every keystroke (semester name/credits are live `onChange`
    text inputs). It pushes via `pushSettingsNow(overrideSettings?)` on blur, or immediately with an
    explicit override value for switches/toggles (avoids a stale-closure race with React's batched
    state).
  - `addEvent`/`updateEvent`/`deleteEvent` are local-first: state updates synchronously, then (if
    `syncUrl` is set) the matching Calendar action fires in the background. `addEvent` patches the
    returned `calendarEventId` onto the local record once the create call resolves. `updateEvent`/
    `deleteEvent` only touch Calendar if the local event already has a `calendarEventId` — an event
    created before sync was enabled, or whose initial Calendar push failed, has no `calendarEventId`
    and will **silently never sync to Calendar** on later edits; there's no retry and no UI indicator
    for this per-event gap (there is a page-level `calendarPushStatus`/`calendarPushError`, but nothing
    that says "this specific event never made it to Calendar").
  - `syncNow()` bypasses debouncing and pushes all 6 collections immediately.
  - `pullGoogleCalendarEvents(startISO, endISO)` is the only way `googleCalendarEvents` gets populated;
    called by `SchedulePage` (per visible week) and by Settings' "Test Connection" button.
- **Setup is manual, outside the app** (Sheet → Apps Script → deploy as Web App → paste URL into
  Settings); documented in `appsscript/README.md`, including the Calendar re-authorization step.

## 8. Dialogs / mobile primitives

- `src/components/ui/dialog.jsx` — `DialogContent` is responsive by default: below `sm` it's a bottom
  sheet (`inset-x-0 bottom-0`, slide-up animation, rounded top corners only, a small drag-handle bar),
  at `sm:` and up it's the original centered modal (fade+zoom). This applies automatically to every
  existing `<Dialog>` usage (`QuickCreateModal`, `CommandPalette`) — no per-call-site changes needed.
- `src/hooks/useIsMobile.js` — `matchMedia("(max-width: 767px)")`, SSR-safe init, subscribes to
  `change` events. This is the single source of truth for the mobile breakpoint used in JS logic
  (`SchedulePage`); purely-CSS responsive behavior elsewhere uses Tailwind's `md:`/`sm:` breakpoints
  directly instead of this hook, so the two should stay numerically consistent (767px ≈ Tailwind's
  `md` cutoff) if either changes.

## 9. Known simplifications (intentional, not bugs)

- The `e0-mock-live` test event in `mockData.js` (see §3) should be removed — it's leftover test
  scaffolding, not a feature.
- `CommandPalette` navigates to the right *page* for a search result but does not deep-link/scroll to
  the specific item.
- `QuickCreateModal` always creates an `events` record; it additionally creates a `tasks` record only
  when type is `assignment`.
- Sync is last-write-wins with no conflict resolution and no realtime push from Sheet/Calendar → app
  (pulls happen once per session/on-demand, not continuously).
- Dashboard's "on-time submission rate" (in `KpiCards`) still treats all `done` tasks as on-time; no
  late-completion tracking field exists.
- `resourceLinks` has full CRUD in the store (`addResourceLink`/`deleteResourceLink`) but no page UI to
  call it yet — every course's list is empty in practice.
