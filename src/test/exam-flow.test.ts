import { describe, expect, it } from "vitest";
import { selectExamQuestions } from "@/lib/exam-selection";
import { bankText, examDocument } from "@/lib/exam-output";
import { parseExamText, saveBank, getBanks, saveExam, getExams, deleteBank, deleteExam, getStats, type Exam, type BankQuestion } from "@/lib/store";

const questions: BankQuestion[] = [
  { id: "1", type: "choose", text: "عاصمة مصر؟", options: ["Cairo", "Giza", "Luxor", "Aswan"], answer: "Cairo" },
  { id: "2", type: "complete", text: "Water is ___", answer: "liquid" },
];
const exam: Exam = { id: "test", title: "English <exam>", grade: "2", className: "2/1", subject: "English", timeMinutes: 30, totalPoints: 4, plan: [{ type: "choose", count: 1, marks: 2 }, { type: "complete", count: 1, marks: 2 }], bankIds: ["bank"], random: false, questions, createdAt: "2026-10-22" };
describe("Exam creation and output", () => {
  it("random selection honors the count for each type", () => {
    expect(selectExamQuestions(questions, exam.plan, true, [], 4).map((q) => q.type)).toEqual(["choose", "complete"]);
  });
  it("manual selection requires the teacher's chosen counts", () => {
    expect(() => selectExamQuestions(questions, exam.plan, false, ["1"], 4)).toThrow("Pick exactly 1 Complete");
  });
  it("question marks must match the teacher's exam points", () => {
    expect(() => selectExamQuestions(questions, exam.plan, true, [], 20)).toThrow("exam points (20)");
  });
  it("Choose questions require four options", () => {
    expect(() => selectExamQuestions([{ id: "x", type: "choose", text: "q", answer: "a", options: ["a", "b"] }], [{ type: "choose", count: 1, marks: 2 }], true, [], 2)).toThrow("four options");
  });
  it("downloaded bank text preserves types, choices and answers when reuploaded", () => {
    expect(parseExamText(bankText({ questions })).map(({ id, ...q }) => q)).toEqual(questions.map(({ id, ...q }) => q));
  });
  it("student exam omits answers while answer key contains them", () => {
    expect(examDocument(exam)).not.toContain("liquid");
    expect(examDocument(exam, true)).toContain("liquid");
    expect(examDocument(exam)).toContain("English &lt;exam&gt;");
  });
  it("banks and exams retain their selected Grade 2 folder", () => {
    localStorage.clear();
    saveBank({ id: "bank", name: "Bank", grade: "2", subject: "English", createdAt: exam.createdAt, questions });
    saveExam(exam);
    expect(getBanks()[0]?.grade).toBe("2");
    expect(getExams()[0]?.grade).toBe("2");
  });
  it("deleting a bank preserves previously saved exam questions", () => {
    localStorage.clear();
    saveBank({ id: "bank", name: "Bank", grade: "2", subject: "English", createdAt: exam.createdAt, questions });
    saveExam(exam); deleteBank("bank");
    expect(getBanks()).toHaveLength(0);
    expect(getExams()[0]?.questions).toHaveLength(2);
  });
  it("stats count only saved exams, banks and bank questions", () => {
    localStorage.clear();
    saveBank({ id: "bank", name: "Bank", grade: "2", subject: "English", createdAt: exam.createdAt, questions });
    saveExam(exam);
    expect(getStats()).toEqual({ exams: 1, banks: 1, questions: 2 });
    deleteExam(exam.id);
    expect(getStats()).toEqual({ exams: 0, banks: 1, questions: 2 });
  });
});