// Curated homework/assignment deadlines for specific courses, keyed by SAP course
// code (the "מספר מקצוע" field). When a user imports one of these courses via the
// SAP course search in Settings, the matching tasks below are created automatically
// alongside the schedule — deadline-only (no effort estimate), same as a manually
// created "deadline only" task.
//
// dueDate uses "YYYY-MM-DD" (local date, due end-of-day) to keep entries easy to
// read/edit here; the import code converts it to a full ISO datetime.

export const HOMEWORK_TEMPLATES = {
  // פיסיקה 1 (01140051)
  "01140051": [],

  // אלגברה 1/מורחב (01040016)
  "01040016": [],

  // חשבון אינפיניטסימלי 1מ' (01040031)
  "01040031": [],
}
