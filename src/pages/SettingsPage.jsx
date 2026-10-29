import React, { useRef, useState } from "react"
import { motion } from "framer-motion"
import {
  Download,
  Upload,
  RotateCcw,
  Trash2,
  Plus,
  Moon,
  Sun,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  Bell,
  BellOff,
  Send,
  CalendarPlus,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { useStudyStore } from "@/store/StudyStoreContext"
import { cn } from "@/lib/utils"
import * as sheetsSync from "@/lib/sheetsSync"
import { buildIcs, downloadIcs } from "@/lib/ics"
import IcsImportModal from "@/components/shared/IcsImportModal"

export default function SettingsPage() {
  const {
    settings,
    updateSettings,
    courses,
    events,
    addCourse,
    updateCourse,
    deleteCourse,
    exportData,
    importData,
    resetAllData,
    syncStatus,
    syncError,
    syncNow,
    pushSettingsNow,
    calendarPushStatus,
    calendarPushError,
    calendarSyncStatus,
    pullGoogleCalendarEvents,
    googleCalendarEvents,
  } = useStudyStore()

  const fileInputRef = useRef(null)
  const [newCourseName, setNewCourseName] = useState("")
  const [newCourseCode, setNewCourseCode] = useState("")
  const [newCourseCredits, setNewCourseCredits] = useState("5")
  const [importStatus, setImportStatus] = useState(null)
  const [icsImportOpen, setIcsImportOpen] = useState(false)
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  )
  const [telegramTestStatus, setTelegramTestStatus] = useState("idle") // idle | sending | sent | error
  const [telegramTestError, setTelegramTestError] = useState(null)

  const handleTestTelegram = async () => {
    if (!settings.appsScriptUrl?.trim()) return
    setTelegramTestStatus("sending")
    try {
      await sheetsSync.sendTelegramTest(settings.appsScriptUrl.trim())
      setTelegramTestStatus("sent")
      setTelegramTestError(null)
    } catch (err) {
      setTelegramTestStatus("error")
      setTelegramTestError(err.message)
    }
  }

  const handleEnableNotifications = async () => {
    if (typeof Notification === "undefined") return
    const result = await Notification.requestPermission()
    setNotifPermission(result)
    if (result === "granted") {
      updateSettings({ notificationsEnabled: true })
      pushSettingsNow({ ...settings, notificationsEnabled: true })
    }
  }

  const toggleAssignmentStage = (hours) => {
    const current = settings.assignmentAlertStagesHours || []
    const next = current.includes(hours)
      ? current.filter((h) => h !== hours)
      : [...current, hours].sort((a, b) => b - a)
    updateSettings({ assignmentAlertStagesHours: next })
    pushSettingsNow({ ...settings, assignmentAlertStagesHours: next })
  }

  const handleExport = () => {
    const data = exportData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `study-data-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportIcs = () => {
    const courseById = {}
    courses.forEach((c) => (courseById[c.id] = c))
    const ics = buildIcs(events, { courseById, calendarName: settings.semesterName || "Study Monitor" })
    downloadIcs(ics, `study-monitor-${new Date().toISOString().slice(0, 10)}.ics`)
  }

  const handleImportClick = () => fileInputRef.current?.click()

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      const ok = importData(data)
      setImportStatus(ok ? "success" : "error")
    } catch {
      setImportStatus("error")
    } finally {
      e.target.value = ""
      setTimeout(() => setImportStatus(null), 3000)
    }
  }

  const handleTestCalendar = () => {
    const now = new Date()
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60_000)
    pullGoogleCalendarEvents(now.toISOString(), in30Days.toISOString())
  }

  const handleAddCourse = (e) => {
    e.preventDefault()
    if (!newCourseName.trim() || !newCourseCode.trim()) return
    addCourse({
      name: newCourseName.trim(),
      code: newCourseCode.trim(),
      credits: Number(newCourseCredits) || 0,
    })
    setNewCourseName("")
    setNewCourseCode("")
    setNewCourseCredits("5")
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="mx-auto flex max-w-3xl flex-col gap-5"
    >
      <h2 className="text-lg font-semibold">הגדרות</h2>

      <Card>
        <CardHeader>
          <CardTitle>מראה</CardTitle>
          <CardDescription>בחרו מצב בהיר או כהה</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div className="flex items-center gap-2">
              {settings.theme === "dark" ? (
                <Moon className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Sun className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-sm font-medium">מצב כהה</span>
            </div>
            <Switch
              checked={settings.theme === "dark"}
              onCheckedChange={(checked) => {
                const theme = checked ? "dark" : "light"
                updateSettings({ theme })
                pushSettingsNow({ ...settings, theme })
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>סמסטר</CardTitle>
          <CardDescription>משמש לספירה לאחור ומעקב נקודות זכות</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="semester-name">שם הסמסטר</Label>
            <Input
              id="semester-name"
              value={settings.semesterName}
              onChange={(e) => updateSettings({ semesterName: e.target.value })}
              onBlur={() => pushSettingsNow()}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="semester-end">תאריך סיום הסמסטר</Label>
            <Input
              id="semester-end"
              type="date"
              value={settings.semesterEnd?.slice(0, 10)}
              onChange={(e) => updateSettings({ semesterEnd: new Date(e.target.value).toISOString() })}
              onBlur={() => pushSettingsNow()}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="completed-credits">נקודות זכות שהושלמו</Label>
            <Input
              id="completed-credits"
              type="number"
              value={settings.completedCredits}
              onChange={(e) => updateSettings({ completedCredits: Number(e.target.value) || 0 })}
              onBlur={() => pushSettingsNow()}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="total-credits">יעד נקודות זכות כולל (נק״ז)</Label>
            <Input
              id="total-credits"
              type="number"
              value={settings.totalCreditsGoal}
              onChange={(e) => updateSettings({ totalCreditsGoal: Number(e.target.value) || 0 })}
              onBlur={() => pushSettingsNow()}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>תזכורות והתראות</CardTitle>
          <CardDescription>
            התראות דפדפן בזמן שהאפליקציה פתוחה — הן לא יגיעו לטלפון שלכם ולא יופעלו אם אין
            כרטיסייה פתוחה.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div className="flex items-center gap-2">
              {notifPermission === "granted" ? (
                <Bell className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <BellOff className="h-4 w-4 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium">התראות דפדפן</p>
                <p className="text-xs text-muted-foreground">
                  {notifPermission === "unsupported" && "לא נתמך בדפדפן זה."}
                  {notifPermission === "granted" && "מופעל — תזכורות יופיעו כהתראות דפדפן."}
                  {notifPermission === "denied" &&
                    "חסום. הפעילו מחדש התראות לאתר זה בהגדרות הדפדפן שלכם."}
                  {notifPermission === "default" && "עדיין לא הופעל."}
                </p>
              </div>
            </div>
            {notifPermission !== "granted" && notifPermission !== "unsupported" && (
              <Button size="sm" onClick={handleEnableNotifications}>
                הפעל
              </Button>
            )}
            {notifPermission === "granted" && (
              <Switch
                checked={settings.notificationsEnabled}
                onCheckedChange={(checked) => {
                  updateSettings({ notificationsEnabled: checked })
                  pushSettingsNow({ ...settings, notificationsEnabled: checked })
                }}
              />
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="class-lead-time">תזכורת לפני שיעור (דקות מראש)</Label>
            <Input
              id="class-lead-time"
              type="number"
              min="0"
              value={settings.classLeadTimeMinutes}
              onChange={(e) => updateSettings({ classLeadTimeMinutes: Number(e.target.value) || 0 })}
              onBlur={() => pushSettingsNow()}
              className="max-w-[140px]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>אזהרות מועד הגשה למטלות</Label>
            <div className="flex flex-wrap gap-2">
              {[48, 24, 12, 3, 1].map((hours) => {
                const active = (settings.assignmentAlertStagesHours || []).includes(hours)
                return (
                  <button
                    key={hours}
                    onClick={() => toggleAssignmentStage(hours)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-accent"
                    )}
                  >
                    {hours} שעות לפני
                  </button>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            התראות טלגרם
          </CardTitle>
          <CardDescription>
            תזכורות מותאמות אישית לפי קורס (מוגדרות בעמוד הקורס) יישלחו אליכם בטלגרם, גם כשהאפליקציה
            סגורה — דרך תריגר מתוזמן ב-Apps Script שרץ כל 15 דקות. דורש שסנכרון Google Sheets יהיה
            מופעל למעלה, ושתתקינו את התריגר פעם אחת באופן ידני (ראו appsscript/README.md).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="telegram-bot-token">Bot Token</Label>
            <Input
              id="telegram-bot-token"
              placeholder="123456789:ABCdefGhIJKlmNoPQRstuVwXYZ"
              value={settings.telegramBotToken}
              onChange={(e) => updateSettings({ telegramBotToken: e.target.value })}
              onBlur={() => pushSettingsNow()}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="telegram-chat-id">Chat ID</Label>
            <Input
              id="telegram-chat-id"
              placeholder="123456789"
              value={settings.telegramChatId}
              onChange={(e) => updateSettings({ telegramChatId: e.target.value })}
              onBlur={() => pushSettingsNow()}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {telegramTestStatus === "sending" && (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  שולח...
                </>
              )}
              {telegramTestStatus === "sent" && (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  נשלח! בדקו את טלגרם.
                </>
              )}
              {telegramTestStatus === "error" && (
                <>
                  <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                  {telegramTestError ? `שליחה נכשלה: ${telegramTestError}` : "שליחה נכשלה"}
                </>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={
                !settings.syncEnabled ||
                !settings.appsScriptUrl?.trim() ||
                !settings.telegramBotToken?.trim() ||
                !settings.telegramChatId?.trim() ||
                telegramTestStatus === "sending"
              }
              onClick={handleTestTelegram}
            >
              <Send className="h-4 w-4" />
              שלח הודעת בדיקה
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>קורסים</CardTitle>
          <CardDescription>ניהול הקורסים שאליהם נרשמתם</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {courses.map((course) => (
            <div
              key={course.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Badge variant={course.color}>{course.code}</Badge>
                <span className="truncate text-sm font-medium">{course.name}</span>
                <span className="whitespace-nowrap text-xs text-muted-foreground">{course.credits} נק״ז</span>
              </div>
              <button
                onClick={() => deleteCourse(course.id)}
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          <form onSubmit={handleAddCourse} className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_120px_100px_auto]">
            <Input
              placeholder="שם הקורס"
              value={newCourseName}
              onChange={(e) => setNewCourseName(e.target.value)}
            />
            <Input
              placeholder="קוד"
              value={newCourseCode}
              onChange={(e) => setNewCourseCode(e.target.value)}
            />
            <Input
              type="number"
              placeholder="נק״ז"
              value={newCourseCredits}
              onChange={(e) => setNewCourseCredits(e.target.value)}
            />
            <Button type="submit" size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              הוסף
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>נתונים וסנכרון</CardTitle>
          <CardDescription>אחסון מקומי בראש ובראשונה — ייצוא, ייבוא, או איפוס הנתונים שלכם</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium">סנכרון עם Google Sheets</p>
              <p className="text-xs text-muted-foreground">
                סנכרון הנתונים שלכם לגיליון Google שבבעלותכם, באמצעות Apps Script קטן.{" "}
                ראו <span className="font-mono">appsscript/README.md</span> בפרויקט לשלבי ההתקנה.
              </p>
            </div>
            <Switch
              checked={settings.syncEnabled}
              onCheckedChange={(checked) => updateSettings({ syncEnabled: checked })}
            />
          </div>

          {settings.syncEnabled && (
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="apps-script-url">כתובת URL של Apps Script Web App</Label>
                <Input
                  id="apps-script-url"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={settings.appsScriptUrl}
                  onChange={(e) => updateSettings({ appsScriptUrl: e.target.value })}
                  onBlur={() => pushSettingsNow()}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {syncStatus === "syncing" && (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      מסנכרן…
                    </>
                  )}
                  {syncStatus === "synced" && (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      מסונכרן
                    </>
                  )}
                  {syncStatus === "error" && (
                    <>
                      <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                      {syncError ? `הסנכרון נכשל: ${syncError}` : "הסנכרון נכשל"}
                    </>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  disabled={!settings.appsScriptUrl?.trim() || syncStatus === "syncing"}
                  onClick={syncNow}
                >
                  <RefreshCw className="h-4 w-4" />
                  סנכרן עכשיו
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport}>
              <Download className="h-4 w-4" />
              ייצוא JSON
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExportIcs}>
              <CalendarPlus className="h-4 w-4" />
              ייצוא ליומן (.ics)
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleImportClick}>
              <Upload className="h-4 w-4" />
              ייבוא JSON
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setIcsImportOpen(true)}>
              <CalendarPlus className="h-4 w-4" />
              ייבוא מיומן (.ics)
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-destructive hover:text-destructive"
              onClick={() => {
                if (confirm("לאפס את כל הנתונים לברירת המחדל? לא ניתן לבטל פעולה זו.")) resetAllData()
              }}
            >
              <RotateCcw className="h-4 w-4" />
              איפוס לברירת מחדל
            </Button>
          </div>

          {importStatus === "success" && (
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              הנתונים יובאו בהצלחה.
            </p>
          )}
          {importStatus === "error" && (
            <p className="text-xs font-medium text-destructive">ייבוא הקובץ נכשל — JSON לא תקין.</p>
          )}
        </CardContent>
      </Card>

      {settings.syncEnabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              סנכרון עם יומן Google
            </CardTitle>
            <CardDescription>
              אירועים שאתם יוצרים כאן נדחפים אוטומטית ליומן Google הראשי שלכם. משתמש באותה
              כתובת URL של Apps Script כמו סנכרון ה-Sheets מעלה.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {calendarPushStatus === "idle" && <span>לא נדחפו אירועים בסשן הזה עדיין.</span>}
                {calendarPushStatus === "pushing" && (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    דוחף ליומן…
                  </>
                )}
                {calendarPushStatus === "pushed" && (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    דחיפת האירוע האחרון הצליחה
                  </>
                )}
                {calendarPushStatus === "error" && (
                  <>
                    <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                    {calendarPushError ? `דחיפה ליומן נכשלה: ${calendarPushError}` : "דחיפה ליומן נכשלה"}
                  </>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={calendarSyncStatus === "loading"}
                onClick={handleTestCalendar}
              >
                <RefreshCw className="h-4 w-4" />
                בדוק חיבור
              </Button>
            </div>

            {calendarSyncStatus === "loading" && (
              <p className="text-xs text-muted-foreground">קורא את יומן Google שלכם…</p>
            )}
            {calendarSyncStatus === "loaded" && (
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                מחובר — נמצאו {googleCalendarEvents.length} אירועים ביומן שלכם ב-30 הימים הקרובים.
              </p>
            )}
            {calendarSyncStatus === "error" && (
              <p className="text-xs font-medium text-destructive">
                לא ניתן לקרוא את יומן Google שלכם. הקפידו לפרוס מחדש את Apps Script
                ולאשר מחדש גישה ליומן (ראו appsscript/README.md).
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <IcsImportModal open={icsImportOpen} onOpenChange={setIcsImportOpen} />
    </motion.div>
  )
}
