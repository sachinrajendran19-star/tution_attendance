export const KEY = "tution_attendance_v1";

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function todayISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function shiftDay(iso, delta) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d + delta);
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function monthKey(iso) {
  return iso.slice(0, 7);
}

export function readableDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function feeMonths(futureCount = 6) {
  const now = new Date();
  const startYear = now.getMonth() < 7 ? now.getFullYear() - 1 : now.getFullYear();
  const start = new Date(startYear, 7, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + futureCount, 1);
  const out = [];
  for (const d = new Date(start); d <= end; d.setMonth(d.getMonth() + 1)) {
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

export const DEFAULT_ROSTER = [
  ["Sambath", "9th"],
  ["HariKrishna", "6th"],
  ["Sudharsan", "6th"],
  ["Aswanth", "3rd"],
  ["Burinesh", "5th"],
  ["Avinash", "3rd"],
  ["Nimisha", "2nd"],
  ["Aradhana", "7th"],
  ["Rithika", "3rd"],
  ["Mugilan", "9th"],
  ["Dharshini", "2nd"],
  ["Gopika", "7th"],
  ["Prasana", "9th"],
  ["Bhuvaneshwari", "7th"],
  ["Praveena", "4th"],
];

export function feeForClass(klass) {
  const num = parseInt(String(klass || "").replace(/\D/g, ""), 10);
  if (!num) return 0;
  if (num >= 9) return 1000;
  if (num >= 6) return 800;
  return 600;
}

export function emptyData() {
  return { students: [], attendance: {}, fees: {} };
}

export function defaultData() {
  return {
    students: DEFAULT_ROSTER.map(([name, klass]) => ({
      id: uid(),
      name,
      klass,
      contact: "",
      fee: feeForClass(klass),
    })),
    attendance: {},
    fees: {},
  };
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultData();
    const data = JSON.parse(raw);
    return {
      students: Array.isArray(data.students) ? data.students : [],
      attendance: data.attendance && typeof data.attendance === "object" ? data.attendance : {},
      fees: data.fees && typeof data.fees === "object" ? data.fees : {},
    };
  } catch {
    return defaultData();
  }
}

export function save(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function attendanceRate(data, studentId) {
  let marked = 0;
  let present = 0;
  for (const day of Object.keys(data.attendance)) {
    const status = data.attendance[day][studentId];
    if (!status) continue;
    marked++;
    if (status === "present") present++;
  }
  if (marked === 0) return { marked: 0, pct: null };
  return { marked, pct: Math.round((present / marked) * 100) };
}

export function overview(data) {
  const days = Object.keys(data.attendance).sort();
  const dayCounts = { present: 0, absent: 0, leave: 0 };
  for (const status of Object.values(data.attendance[days[days.length - 1]] || {})) {
    if (status) dayCounts[status] = (dayCounts[status] || 0) + 1;
  }
  return { days, last: days.length ? days[days.length - 1] : null, dayCounts };
}

export function attendanceByDay(data) {
  return Object.keys(data.attendance)
    .sort()
    .map((day) => {
      const counts = { present: 0, absent: 0, leave: 0 };
      for (const status of Object.values(data.attendance[day] || {})) {
        if (status) counts[status] = (counts[status] || 0) + 1;
      }
      const total = counts.present + counts.absent + counts.leave;
      return {
        day,
        present: counts.present,
        absent: counts.absent,
        leave: counts.leave,
        total,
        pct: total ? Math.round((counts.present / total) * 100) : 0,
      };
    });
}

export function attendanceByStudent(data) {
  return data.students.map((student) => {
    const counts = { present: 0, absent: 0, leave: 0 };
    for (const day of Object.keys(data.attendance)) {
      const status = data.attendance[day][student.id];
      if (status) counts[status] = (counts[status] || 0) + 1;
    }
    const total = counts.present + counts.absent + counts.leave;
    return {
      student,
      present: counts.present,
      absent: counts.absent,
      leave: counts.leave,
      total,
      pct: total ? Math.round((counts.present / total) * 100) : 0,
    };
  });
}