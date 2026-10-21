// Local data store for the Smart Quiz Platform (saved in the browser).
export type QuestionType = "complete" | "choose" | "tf" | "correct";

export interface Teacher {
  name: string;
  email: string;
  school: string;
  governorate: string;
  specialization: string;
  classes: string;
}

export interface BankQuestion {
  id: string;
  type: QuestionType;
  text: string;
  options?: string[]; // choose
  answer: string; // model answer / correct option / true-false
}

export interface QuestionBank {
  id: string;
  name: string;
  grade: string; // "1" | "2" | "3"
  subject: string;
  createdAt: string;
  questions: BankQuestion[];
}

export interface ExamTypePlan {
  type: QuestionType;
  count: number;
  marks: number;
}

export interface Exam {
  id: string;
  title: string;
  subject: string;
  className: string;
  grade: string;
  timeMinutes: number;
  totalPoints: number;
  plan: ExamTypePlan[];
  bankIds: string[];
  random: boolean;
  questions: BankQuestion[];
  createdAt: string;
}

const K = {
  teacher: "sqp_teacher",
  banks: "sqp_banks",
  exams: "sqp_exams",
  session: "sqp_session",
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export const getTeacher = () => read<Teacher | null>(K.teacher, null);
export const saveTeacher = (t: Teacher) => write(K.teacher, t);

export const isLoggedIn = () => read<boolean>(K.session, false);
export const setLoggedIn = (v: boolean) => write(K.session, v);

export const getBanks = () => read<QuestionBank[]>(K.banks, []);
export const saveBank = (bank: QuestionBank) => {
  const all = getBanks().filter((b) => b.id !== bank.id);
  all.unshift(bank);
  write(K.banks, all);
};

export const getExams = () => read<Exam[]>(K.exams, []);
export const saveExam = (exam: Exam) => {
  const all = getExams().filter((e) => e.id !== exam.id);
  all.unshift(exam);
  write(K.exams, all);
};

export const TYPE_META: Record<
  QuestionType,
  { label: string; desc: string; icon: string; color: string; bg: string }
> = {
  complete: {
    label: "Complete",
    desc: "The student completes a missing word or blank",
    icon: "✍️",
    color: "#8a6cff",
    bg: "#f0ebff",
  },
  choose: {
    label: "Choose",
    desc: "The student picks the answer from 4 options",
    icon: "🔘",
    color: "#7a4fd0",
    bg: "#f3efff",
  },
  tf: {
    label: "True or False",
    desc: "The student decides if the sentence is true or false",
    icon: "✅",
    color: "#5fb44a",
    bg: "#eaf8e3",
  },
  correct: {
    label: "Correct",
    desc: "A sentence with a mistake — the student writes the correction",
    icon: "🩹",
    color: "#ff9a62",
    bg: "#fff0e6",
  },
};

export const GRADES = ["1", "2", "3"] as const;
export const SUBJECTS = [
  "English",
  "Math",
  "Science",
  "Arabic",
  "Social Studies",
  "ICT",
  "French",
  "German",
] as const;
export const GOVERNORATES = [
  "Cairo", "Giza", "Alexandria", "North Sinai", "South Sinai", "Port Said",
  "Suez", "Ismailia", "Dakahlia", "Sharqia", "Qalyubia", "Gharbia",
  "Monufia", "Beheira", "Kafr El Sheikh", "Damietta", "Fayoum", "Beni Suef",
  "Minya", "Assiut", "Sohag", "Qena", "Luxor", "Aswan", "Red Sea",
  "New Valley", "Matrouh",
] as const;

// Parse a pasted/uploaded exam text into questions.
// Format per block:
//   [choose] Question text | opt1 | opt2 | opt3 | opt4 | answer: opt2
//   [complete] Question text | answer: word
//   [tf] Question text | answer: true
//   [correct] Wrong sentence | answer: corrected sentence
export function parseExamText(raw: string): BankQuestion[] {
  const questions: BankQuestion[] = [];
  const blocks = raw.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  for (const block of blocks) {
    const m = block.match(/^\[(complete|choose|tf|correct)\]\s*/i);
    const type = (m?.[1]?.toLowerCase() ?? "complete") as QuestionType;
    const body = m ? block.slice(m[0].length) : block;
    const parts = body.split("|").map((p) => p.trim()).filter(Boolean);
    const ansPart = parts.find((p) => /^answer\s*:/i.test(p));
    const answer = ansPart ? ansPart.replace(/^answer\s*:/i, "").trim() : "";
    const rest = parts.filter((p) => p !== ansPart);
    const text = rest[0] ?? "";
    if (!text) continue;
    const q: BankQuestion = { id: uid(), type, text, answer };
    if (type === "choose") q.options = rest.slice(1, 5);
    questions.push(q);
  }
  return questions;
}
