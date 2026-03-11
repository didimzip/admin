import { mockMentorQuestions, type MentorQuestion, type QuestionStatus } from "@/data/mock-data";

const STORAGE_KEY = "didimzip_admin_mentor_qna";

function loadAll(): MentorQuestion[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw || raw === "[]") {
      // seed from mock data
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockMentorQuestions));
      return [...mockMentorQuestions];
    }
    return JSON.parse(raw) as MentorQuestion[];
  } catch {
    return [];
  }
}

function saveAll(questions: MentorQuestion[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(questions));
}

export function getAllQuestions(): MentorQuestion[] {
  return loadAll();
}

export function getQuestion(id: string): MentorQuestion | undefined {
  return loadAll().find((q) => q.id === id);
}

export function upsertQuestion(
  data: Omit<MentorQuestion, "id" | "createdAt" | "updatedAt"> & { id?: string | null }
): MentorQuestion {
  const questions = loadAll();
  const now = new Date().toISOString();
  const existing = data.id ? questions.find((q) => q.id === data.id) : undefined;

  if (existing) {
    const updated: MentorQuestion = {
      ...existing,
      ...data,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: now,
    };
    saveAll(questions.map((q) => (q.id === existing.id ? updated : q)));
    return updated;
  }

  const newQuestion: MentorQuestion = {
    ...(data as Omit<MentorQuestion, "id" | "createdAt" | "updatedAt">),
    id: `mq_${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  };
  saveAll([newQuestion, ...questions]);
  return newQuestion;
}

export function deleteQuestion(id: string): void {
  saveAll(loadAll().filter((q) => q.id !== id));
}

export function deleteQuestions(ids: string[]): void {
  const idSet = new Set(ids);
  saveAll(loadAll().filter((q) => !idSet.has(q.id)));
}

export function answerQuestion(id: string, answer: string): void {
  const questions = loadAll();
  const now = new Date().toISOString();
  saveAll(
    questions.map((q) =>
      q.id === id
        ? { ...q, answer, answeredAt: now, status: "ANSWERED" as QuestionStatus, updatedAt: now }
        : q
    )
  );
}

export function closeQuestion(id: string): void {
  const questions = loadAll();
  const now = new Date().toISOString();
  saveAll(
    questions.map((q) =>
      q.id === id
        ? { ...q, status: "CLOSED" as QuestionStatus, updatedAt: now }
        : q
    )
  );
}
