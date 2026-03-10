// 활동 추적 로그 — localStorage 기반 스토어

import { mockAuditLogs, type AuditLog, type AuditAction } from "@/data/mock-data";

const STORAGE_KEY = "didimzip_audit_logs";
const SESSION_KEY = "didimzip_admin_session";

// 순환 import 방지를 위해 auth-store 대신 localStorage 직접 참조
function getCurrentActor(): { name: string; role: "ADMIN" | "MEMBER" } {
  if (typeof window === "undefined") return { name: "관리자", role: "ADMIN" };
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      const s = JSON.parse(raw) as { name?: string };
      return { name: s.name ?? "관리자", role: "ADMIN" };
    }
  } catch {
    // ignore
  }
  return { name: "관리자", role: "ADMIN" };
}

function loadLogs(): AuditLog[] {
  if (typeof window === "undefined") return mockAuditLogs;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AuditLog[];
    // 최초 실행 시 mock 데이터 저장
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockAuditLogs));
    return mockAuditLogs;
  } catch {
    return mockAuditLogs;
  }
}

function saveLogs(logs: AuditLog[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

export function getAllLogs(): AuditLog[] {
  return [...loadLogs()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function recordLog(
  action: AuditAction,
  description: string,
  opts?: {
    targetType?: string;
    targetId?: string;
    actorName?: string;
    actorRole?: "ADMIN" | "MEMBER";
  }
): void {
  const actor = getCurrentActor();
  const log: AuditLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    action,
    actorNickname: opts?.actorName ?? actor.name,
    actorRole: opts?.actorRole ?? actor.role,
    targetType: opts?.targetType ?? "",
    targetId: opts?.targetId ?? "",
    description,
    ip: "211.234.xx.xx",
    createdAt: new Date().toISOString(),
  };
  const logs = loadLogs();
  saveLogs([log, ...logs]);
}
