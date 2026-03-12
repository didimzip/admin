import { mockCampaigns, type CampaignStatus, type CampaignChannel, type Campaign } from "@/data/mock-data";
import { getAllUsers } from "@/lib/user-store";
import type { AuthStatus } from "@/types/user";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CampaignTargetFilter = {
  companyTypes: string[];
  jobCategories: string[];
  authStatus: AuthStatus | "";
  hasBadge: boolean | null;
};

export type CampaignMessage = {
  senderName: string;
  subject: string; // 이메일 제목 or 푸시 제목
  body: string;    // 이메일 본문 / 브랜드 메시지 내용 / 푸시 내용
};

export type SentRecipient = {
  nickname: string;
  email: string;       // 이메일 주소 또는 전화번호
  companyName: string;
  jobCategory: string;
};

export type StoredCampaign = {
  id: string;
  title: string;
  description: string;
  channel: CampaignChannel;
  status: CampaignStatus;
  targetFilter: CampaignTargetFilter;
  targetCount: number;
  sentCount: number;
  failedCount: number;
  failedEmails: string[];
  smsType?: "SMS" | "LMS" | "MMS";
  smsSender?: string;
  smsImageData?: string;
  smsByteCount?: number;
  smsUnitCost?: number;
  smsTotalCost?: number;
  failedPhones?: string[];
  failedReasons?: string[];
  smsGroupId?: string;
  sentRecipients?: SentRecipient[]; // 실제 발송 대상 목록 (발송 시점에 저장)
  openRate: number;
  message: CampaignMessage;
  sendType: "IMMEDIATE" | "SCHEDULED";
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null; // 작성자 관리자 ID
};

// ─── Migration helper (mock data → StoredCampaign) ────────────────────────────

function migrateFromMock(c: Campaign): StoredCampaign {
  return {
    id: c.id,
    title: c.title,
    description: "",
    channel: c.channel,
    status: c.status,
    targetFilter: {
      companyTypes: c.targetFilter.companyType ? [c.targetFilter.companyType] : [],
      jobCategories: c.targetFilter.jobCategory ? [c.targetFilter.jobCategory] : [],
      authStatus: "",
      hasBadge: null,
    },
    targetCount: c.targetCount,
    sentCount: c.sentCount,
    failedCount: 0,
    failedEmails: [],
    openRate: c.openRate,
    message: { senderName: "DidimZip 운영팀", subject: "", body: "" },
    sendType: c.scheduledAt ? "SCHEDULED" : "IMMEDIATE",
    scheduledAt: c.scheduledAt,
    sentAt: c.sentAt,
    createdAt: c.createdAt,
    updatedAt: c.createdAt,
    createdBy: null,
  };
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = "didimzip_admin_campaigns";

function loadAll(): StoredCampaign[] {
  if (typeof window === "undefined") return mockCampaigns.map(migrateFromMock);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parsed = JSON.parse(raw) as any[];
      // FRIENDTALK → BRANDMSG 마이그레이션
      let dirty = false;
      for (const c of parsed) {
        if (c.channel === "FRIENDTALK") { c.channel = "BRANDMSG"; dirty = true; }
      }
      if (dirty) localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      return parsed as StoredCampaign[];
    }
    const migrated = mockCampaigns.map(migrateFromMock);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    return migrated;
  } catch {
    return mockCampaigns.map(migrateFromMock);
  }
}

function saveAll(campaigns: StoredCampaign[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns));
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export function getAllCampaigns(): StoredCampaign[] {
  return loadAll();
}

export function getCampaign(id: string): StoredCampaign | undefined {
  return loadAll().find((c) => c.id === id);
}

export function upsertCampaign(
  data: Omit<StoredCampaign, "id" | "createdAt" | "updatedAt"> & { id?: string | null }
): StoredCampaign {
  const campaigns = loadAll();
  const now = new Date().toISOString();
  const existing = data.id ? campaigns.find((c) => c.id === data.id) : undefined;

  if (existing) {
    const updated: StoredCampaign = {
      ...existing,
      ...data,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: now,
    };
    saveAll(campaigns.map((c) => (c.id === existing.id ? updated : c)));
    if (typeof window !== "undefined" && updated.status === "SCHEDULED" && updated.scheduledAt) {
      window.dispatchEvent(
        new CustomEvent("campaign-saved", { detail: { id: updated.id, scheduledAt: updated.scheduledAt } })
      );
    }
    return updated;
  }

  const newCampaign: StoredCampaign = {
    ...(data as Omit<StoredCampaign, "id" | "createdAt" | "updatedAt">),
    id: `camp_${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  };
  saveAll([newCampaign, ...campaigns]);
  if (typeof window !== "undefined" && newCampaign.status === "SCHEDULED" && newCampaign.scheduledAt) {
    window.dispatchEvent(
      new CustomEvent("campaign-saved", { detail: { id: newCampaign.id, scheduledAt: newCampaign.scheduledAt } })
    );
  }
  return newCampaign;
}

export function deleteCampaign(id: string): void {
  saveAll(loadAll().filter((c) => c.id !== id));
}

export function restoreCampaigns(items: StoredCampaign[]): void {
  const current = loadAll();
  const existingIds = new Set(current.map((c) => c.id));
  saveAll([...items.filter((c) => !existingIds.has(c.id)), ...current]);
}

// ─── Targeting ────────────────────────────────────────────────────────────────

/**
 * 필터 조건에 맞는 활성 회원 수를 계산합니다.
 * 빈 배열 / null은 "전체" 를 의미합니다.
 *
 * 나중에 실제 API로 교체 시 이 함수만 수정하면 됩니다.
 * (예: return fetch("/api/campaigns/target-count", { method: "POST", body: JSON.stringify(filter) }).then(r => r.json()))
 */
export function computeTargetCount(filter: CampaignTargetFilter): number {
  return getTargetUsers(filter).length;
}

export function getTargetUsers(filter: CampaignTargetFilter) {
  return getAllUsers().filter((u) => {
    if (u.status !== "ACTIVE") return false;
    if (filter.companyTypes.length > 0 && !filter.companyTypes.includes(u.companyType)) return false;
    if (filter.jobCategories.length > 0 && !filter.jobCategories.includes(u.jobCategory)) return false;
    if (filter.authStatus && u.authStatus !== filter.authStatus) return false;
    if (filter.hasBadge !== null && u.hasBadge !== filter.hasBadge) return false;
    return true;
  });
}

export function getTargetUsersForSms(filter: CampaignTargetFilter) {
  return getTargetUsers(filter).filter((u) => {
    if (!u.phone) return false;
    const digits = u.phone.replace(/[^0-9]/g, "");
    return /^01[016789]\d{7,8}$/.test(digits);
  });
}

export function computeTargetCountForSms(filter: CampaignTargetFilter): number {
  return getTargetUsersForSms(filter).length;
}
