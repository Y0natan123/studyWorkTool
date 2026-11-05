// Curated homework/assignment deadlines for specific courses, keyed by SAP course
// code (the "מספר מקצוע" field). Loaded on demand via the "טען מטלות מהתבנית"
// button on a course's page (CourseHubPage) — not auto-applied, so loading is
// safe to repeat (duplicates are skipped by matching existing task titles).
//
// Source: the user's own tracking sheet (שיעורי בית – חורף תשפ"ז), transcribed
// 2026-11-05. Only assignments with a confirmed due date are included — WebWork
// items that are "opens on X" but not yet due are left out until they get a real
// deadline, to avoid inventing dates.
//
// dueDate uses "YYYY-MM-DD" (local date, due end-of-day) to keep entries easy to
// read/edit here; the import code converts it to a full ISO datetime.

export const HOMEWORK_TEMPLATES = {
  // פיסיקה 1 (01140051)
  "01140051": [
    { title: "הכנה 1 – מבוא מתמטי, וקטורים", dueDate: "2026-11-03" },
    { title: "הכנה 2 – קינמטיקה", dueDate: "2026-11-10" },
    { title: "גיליון 1 – נגזרות ואינטגרלים", dueDate: "2026-11-11" },
    { title: "הכנה 3 – מערכות ייחוס", dueDate: "2026-11-17" },
    { title: "גיליון 2 – וקטורים", dueDate: "2026-11-18" },
    { title: "הכנה 4 – חוקי ניוטון", dueDate: "2026-11-24" },
    { title: "גיליון 3 – קינמטיקה", dueDate: "2026-11-25" },
    { title: "הכנה 5 – כוחות משמרים ואנרגיה פוטנציאלית", dueDate: "2026-12-01" },
    { title: "גיליון 4 – מערכות ייחוס ותנועה מעגלית", dueDate: "2026-12-02" },
    { title: "הכנה 6 – תנע קווי ומרכז המסה", dueDate: "2026-12-08" },
    { title: "גיליון 5 – חוקי ניוטון", dueDate: "2026-12-09" },
    { title: "הכנה 7 – מכפלה וקטורית, תנע זוויתי", dueDate: "2026-12-15" },
    { title: "גיליון 6 – חוקי ניוטון במשוואות דיפרנציאליות", dueDate: "2026-12-16" },
    { title: "הכנה 8 – טרנספורמציית לורנץ", dueDate: "2026-12-22" },
    { title: "גיליון 7 – עבודה, אנרגיה ושימור", dueDate: "2026-12-23" },
    { title: "הכנה 9 – דינמיקה יחסותית", dueDate: "2026-12-29" },
    { title: "גיליון 8 – תנע קווי ומרכז המסה", dueDate: "2026-12-30" },
    { title: "גיליון 9 – תנע זוויתי", dueDate: "2027-01-06" },
    { title: "גיליון 10 – טרנספורמציית לורנץ, התארכות הזמן", dueDate: "2027-01-13" },
    { title: "גיליון 11 – טרנספורמציית לורנץ, המשך", dueDate: "2027-01-20" },
    { title: "גיליון 12 – דינמיקה יחסותית", dueDate: "2027-01-27" },
  ],

  // אלגברה 1מ3 (01040067)
  "01040067": [
    { title: "HW01-Polynomials", dueDate: "2026-11-11" },
    { title: "תרגיל בית 1 (הגשה כתובה)", dueDate: "2026-11-17" },
    { title: "HW02-Complex", dueDate: "2026-11-18" },
  ],

  // חשבון דיפרנציאלי ואינטגרלי 1מ3 (01040047)
  "01040047": [
    { title: "HW01", dueDate: "2026-11-11" },
    { title: "תרגיל בית 1 (הגשה כתובה)", dueDate: "2026-11-18" },
    { title: "תרגיל בית 2 (הגשה כתובה)", dueDate: "2026-12-02" },
    { title: "תרגיל בית 3 (הגשה כתובה)", dueDate: "2026-12-16" },
    { title: "תרגיל בית 4 (הגשה כתובה)", dueDate: "2026-12-30" },
    { title: "תרגיל בית 5 (הגשה כתובה)", dueDate: "2027-01-14" },
    { title: "תרגיל בית 6 (הגשה כתובה)", dueDate: "2027-01-28" },
  ],

  // מבוא למחשב שפת פייתון (02340128)
  "02340128": [{ title: "Homework 0", dueDate: "2026-11-16" }],
}
