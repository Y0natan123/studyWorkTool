// Curated homework/assignment deadlines for specific courses, keyed by SAP course
// code (the "מספר מקצוע" field). Loaded on demand via the "טען מטלות מהתבנית"
// button on a course's page (CourseHubPage) — not auto-applied, so loading is
// safe to repeat (duplicates are skipped by matching existing task titles).
//
// dueDate uses "YYYY-MM-DD" (local date, due end-of-day) to keep entries easy to
// read/edit here; the import code converts it to a full ISO datetime.

export const HOMEWORK_TEMPLATES = {
  // פיסיקה 1 (01140051)
  "01140051": [
    { title: "הכנה 2", dueDate: "2026-11-10" },
    { title: "גיליון 1", dueDate: "2026-11-11" },
    { title: "הכנה 3", dueDate: "2026-11-17" },
    { title: "גיליון 2", dueDate: "2026-11-18" },
    { title: "הכנה 4", dueDate: "2026-11-24" },
    { title: "גיליון 3", dueDate: "2026-11-25" },
    { title: "הכנה 5", dueDate: "2026-12-01" },
    { title: "גיליון 4", dueDate: "2026-12-02" },
    { title: "הכנה 6", dueDate: "2026-12-08" },
    { title: "גיליון 5", dueDate: "2026-12-09" },
    { title: "הכנה 7", dueDate: "2026-12-15" },
    { title: "גיליון 6", dueDate: "2026-12-16" },
    { title: "הכנה 8", dueDate: "2026-12-22" },
    { title: "גיליון 7", dueDate: "2026-12-23" },
    { title: "הכנה 9", dueDate: "2026-12-29" },
    { title: "גיליון 8", dueDate: "2026-12-30" },
    { title: "גיליון 9", dueDate: "2027-01-06" },
    { title: "גיליון 10", dueDate: "2027-01-13" },
    { title: "גיליון 11", dueDate: "2027-01-20" },
    { title: "גיליון 12", dueDate: "2027-01-27" },
  ],

  // אלגברה 1מ3 (01040067)
  "01040067": [
    { title: "WB01", dueDate: "2026-11-11" },
    { title: "WB02", dueDate: "2026-11-15" },
    { title: "תרגיל בית 1", dueDate: "2026-11-17" },
    { title: "WB03", dueDate: "2026-11-22" },
    { title: "WB04", dueDate: "2026-11-29" },
    { title: "תרגיל בית 2", dueDate: "2026-12-01" },
    { title: "WB05", dueDate: "2026-12-05" },
    { title: "WB06", dueDate: "2026-12-20" },
    { title: "תרגיל בית 3", dueDate: "2026-12-15" },
    { title: "WB07", dueDate: "2027-01-03" },
    { title: "תרגיל בית 4", dueDate: "2027-01-03" },
    { title: "WB08", dueDate: "2027-01-10" },
    { title: "תרגיל בית 5", dueDate: "2027-01-17" },
    { title: "WB09", dueDate: "2027-01-17" },
    { title: "WB10", dueDate: "2027-01-24" },
    { title: "WB11", dueDate: "2027-01-24" },
    { title: "תרגיל בית 6", dueDate: "2027-01-28" },
    { title: "WB12", dueDate: "2027-01-28" },
  ],

  // חשבון דיפרנציאלי ואינטגרלי 1מ3 (01040047)
  "01040047": [
    { title: "תרגיל בית 1", dueDate: "2026-11-18" },
    { title: "WB02", dueDate: "2026-11-18" },
    { title: "WB03", dueDate: "2026-11-25" },
    { title: "WB04", dueDate: "2026-11-29" },
    { title: "WB05", dueDate: "2026-12-08" },
    { title: "תרגיל בית 2", dueDate: "2026-12-02" },
    { title: "WB06", dueDate: "2026-12-20" },
    { title: "תרגיל בית 3", dueDate: "2026-12-16" },
    { title: "WB07", dueDate: "2026-12-27" },
    { title: "WB08", dueDate: "2027-01-03" },
    { title: "תרגיל בית 4", dueDate: "2026-12-30" },
    { title: "WB09", dueDate: "2027-01-10" },
    { title: "WB10", dueDate: "2027-01-17" },
    { title: "תרגיל בית 5", dueDate: "2027-01-14" },
    { title: "תרגיל בית 6", dueDate: "2027-01-28" },
    { title: "WB11", dueDate: "2027-01-28" },
    { title: "WB12", dueDate: "2027-01-28" },
    { title: "WB13", dueDate: "2027-01-28" },
  ],
}
