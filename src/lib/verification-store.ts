import type { UserWithProfile } from "@/types/user";
import { getAllUsers, updateUser } from "./user-store";

export interface StoredVerification {
  id: string;
  userId: string;
  nickname: string;
  realName: string;
  companyName: string;
  companyType: string;
  docType: "BIZ_REG" | "CARD";
  fileUrl: string;
  submittedAt: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectMessage: string; // 반려 시 회원에게 표시되는 메시지
}

const STORAGE_KEY = "didimzip_admin_verifications";

function deriveFromUsers(users: UserWithProfile[]): StoredVerification[] {
  const result: StoredVerification[] = [];
  for (const user of users) {
    if (!user.documents?.length) continue;
    user.documents.forEach((doc, i) => {
      result.push({
        id: `verif_${user.id}_${i}`,
        userId: user.id,
        nickname: user.nickname,
        realName: user.realName,
        companyName: user.companyName,
        companyType: user.companyType,
        docType: doc.docType,
        fileUrl: doc.fileUrl,
        submittedAt: doc.uploadedAt,
        status: doc.status,
        rejectMessage: "",
      });
    });
  }
  return result;
}

function loadAll(): StoredVerification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as StoredVerification[];
    // 최초 실행 시 user-store 데이터에서 파생
    const seed = deriveFromUsers(getAllUsers());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  } catch {
    return [];
  }
}

function saveAll(vs: StoredVerification[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(vs));
}

export function getAllVerifications(): StoredVerification[] {
  return loadAll();
}

/**
 * 인증 상태 변경 + user-store 동기화 (authStatus, hasBadge, documents[].status)
 */
export function updateVerificationStatus(
  id: string,
  status: "PENDING" | "APPROVED" | "REJECTED",
  rejectMessage: string
): void {
  const all = loadAll();
  const verif = all.find((v) => v.id === id);
  if (!verif) return;

  // 승인/검토중으로 변경 시 반려 메시지 초기화
  const msg = status === "REJECTED" ? rejectMessage : "";
  saveAll(all.map((v) => (v.id === id ? { ...v, status, rejectMessage: msg } : v)));

  // user-store 동기화
  const users = getAllUsers();
  const user = users.find((u) => u.id === verif.userId);
  if (!user?.documents) return;

  const updatedDocs = user.documents.map((doc) =>
    doc.fileUrl === verif.fileUrl ? { ...doc, status } : doc
  );
  const hasApproved = updatedDocs.some((d) => d.status === "APPROVED");
  const hasPending = updatedDocs.some((d) => d.status === "PENDING");
  const allRejected = updatedDocs.length > 0 && updatedDocs.every((d) => d.status === "REJECTED");
  const authStatus = hasApproved ? "VERIFIED" : hasPending ? "PENDING" : allRejected ? "REJECTED" : "NONE";

  updateUser({ ...user, documents: updatedDocs, authStatus, hasBadge: hasApproved });
}
