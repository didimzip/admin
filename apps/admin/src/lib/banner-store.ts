import { mockBanners, type Banner, type BannerTextColor } from "@/data/mock-data";
import { recordLog } from "@/lib/audit-log-store";

// ─── Types ────────────────────────────────────────────────────────────────────

export type StoredBanner = Banner & {
  description: string;
  imageData: string; // base64 이미지 (로컬 저장용)
  updatedAt: string;
  createdBy: string | null;
};

// ─── Migration (mock → StoredBanner) ─────────────────────────────────────────

function migrateFromMock(b: Banner): StoredBanner {
  return {
    ...b,
    description: "",
    imageData: "",
    updatedAt: b.createdAt,
    createdBy: null,
  };
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = "didimzip_admin_banners";

function loadAll(): StoredBanner[] {
  if (typeof window === "undefined") return mockBanners.map(migrateFromMock);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as StoredBanner[];
    const migrated = mockBanners.map(migrateFromMock);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    return migrated;
  } catch {
    return mockBanners.map(migrateFromMock);
  }
}

function saveAll(banners: StoredBanner[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(banners));
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export function getAllBanners(): StoredBanner[] {
  return loadAll();
}

export function getBanner(id: string): StoredBanner | undefined {
  return loadAll().find((b) => b.id === id);
}

export function upsertBanner(
  data: Omit<StoredBanner, "id" | "createdAt" | "updatedAt" | "clickCount" | "impressionCount"> & { id?: string | null }
): StoredBanner {
  const banners = loadAll();
  const now = new Date().toISOString();
  const existing = data.id ? banners.find((b) => b.id === data.id) : undefined;

  if (existing) {
    const updated: StoredBanner = {
      ...existing,
      ...data,
      id: existing.id,
      clickCount: existing.clickCount,
      impressionCount: existing.impressionCount,
      createdAt: existing.createdAt,
      updatedAt: now,
    };
    saveAll(banners.map((b) => (b.id === existing.id ? updated : b)));
    return updated;
  }

  const newBanner: StoredBanner = {
    ...(data as Omit<StoredBanner, "id" | "createdAt" | "updatedAt" | "clickCount" | "impressionCount">),
    id: `banner_${Date.now()}`,
    clickCount: 0,
    impressionCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  saveAll([newBanner, ...banners]);
  return newBanner;
}

export function deleteBanner(id: string): void {
  saveAll(loadAll().filter((b) => b.id !== id));
}

export function deleteBanners(ids: string[]): void {
  saveAll(loadAll().filter((b) => !ids.includes(b.id)));
}

export function restoreBanners(items: StoredBanner[]): void {
  const current = loadAll();
  const existingIds = new Set(current.map((b) => b.id));
  saveAll([...items.filter((b) => !existingIds.has(b.id)), ...current]);
}

export function toggleBannerActive(id: string): void {
  const banners = loadAll();
  const target = banners.find((b) => b.id === id);
  saveAll(
    banners.map((b) =>
      b.id === id ? { ...b, isActive: !b.isActive, updatedAt: new Date().toISOString() } : b
    )
  );
  if (target) {
    recordLog("BANNER_CREATE", `배너 "${target.title.slice(0, 30)}" ${target.isActive ? "비활성화" : "활성화"}`, { targetType: "BANNER", targetId: id });
  }
}

// ─── Banner Drafts ───────────────────────────────────────────────────────────

export type BannerDraft = {
  id: string;
  bannerType: string;
  title: string;
  subtitle: string;
  subText: string;
  textColor: string;
  description: string;
  position: string;
  linkUrl: string;
  sortOrder: number;
  isActive: boolean;
  startDate: string;
  endDate: string;
  imageData: string;
  createdBy: string | null;
  updatedAt: string;
};

const DRAFT_STORAGE_KEY = "didimzip_admin_banner_drafts";

function loadDrafts(): BannerDraft[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as BannerDraft[]) : [];
  } catch {
    return [];
  }
}

function saveDrafts(drafts: BannerDraft[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));
}

export function getAllBannerDrafts(createdBy?: string | null): BannerDraft[] {
  const all = loadDrafts();
  if (createdBy === undefined) return all;
  return all.filter((d) => d.createdBy === null || d.createdBy === createdBy);
}

export function saveBannerDraft(data: Omit<BannerDraft, "id" | "updatedAt"> & { id?: string | null }): BannerDraft {
  const drafts = loadDrafts();
  const now = new Date().toISOString();
  if (data.id) {
    const existing = drafts.find((d) => d.id === data.id);
    if (existing) {
      const updated = { ...existing, ...data, id: existing.id, updatedAt: now };
      saveDrafts(drafts.map((d) => (d.id === existing.id ? updated : d)));
      return updated;
    }
  }
  const newDraft: BannerDraft = {
    ...(data as Omit<BannerDraft, "id" | "updatedAt">),
    id: `banner_draft_${Date.now()}`,
    updatedAt: now,
  };
  saveDrafts([newDraft, ...drafts]);
  return newDraft;
}

export function deleteBannerDraft(id: string): void {
  saveDrafts(loadDrafts().filter((d) => d.id !== id));
}

// ─── Reorder ─────────────────────────────────────────────────────────────────

/** 히어로 슬라이드 순서 일괄 업데이트. ids 배열 순서대로 sortOrder 1,2,3… 부여 */
export function reorderHeroSlides(orderedIds: string[]): void {
  const banners = loadAll();
  const now = new Date().toISOString();
  const updated = banners.map((b) => {
    const idx = orderedIds.indexOf(b.id);
    if (idx === -1) return b;
    return { ...b, sortOrder: idx + 1, updatedAt: now };
  });
  saveAll(updated);
}

// ─── Background brightness detection ─────────────────────────────────────────

/**
 * 이미지의 왼쪽 40% 영역의 평균 밝기를 분석하여 텍스트 색상 결정.
 * 텍스트가 왼쪽에 오버레이되므로 왼쪽 영역 기준으로 판단.
 * 밝기 128 이상 → "dark" (어두운 텍스트), 미만 → "light" (밝은 텍스트)
 */
export async function detectTextColor(base64: string): Promise<BannerTextColor> {
  if (!base64 || !base64.startsWith("data:image")) return "light";
  return new Promise<BannerTextColor>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const sampleW = Math.min(img.width, 400);
      const sampleH = Math.min(img.height, 100);
      canvas.width = sampleW;
      canvas.height = sampleH;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve("light"); return; }
      ctx.drawImage(img, 0, 0, Math.round(img.width * 0.4), img.height, 0, 0, sampleW, sampleH);
      const data = ctx.getImageData(0, 0, sampleW, sampleH).data;
      let totalLum = 0;
      const pixels = data.length / 4;
      for (let i = 0; i < data.length; i += 4) {
        totalLum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      }
      resolve(totalLum / pixels >= 128 ? "dark" : "light");
    };
    img.onerror = () => resolve("light");
    img.src = base64;
  });
}

// ─── Image compression (post-store 패턴) ─────────────────────────────────────

export async function compressBannerImage(base64: string): Promise<string> {
  if (!base64 || !base64.startsWith("data:image")) return base64;
  return new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const MAX_W = 1920;
      let w = img.width;
      let h = img.height;
      if (w > MAX_W) {
        h = Math.round((h * MAX_W) / w);
        w = MAX_W;
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")?.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = () => resolve("");
    img.src = base64;
  });
}
