import {
  bannersApi,
  type Banner as ApiBanner,
  type BannerCreateInput,
  type BannerUpdateInput,
} from "@didimzip/api";
import { type BannerTextColor } from "@/data/mock-data";
import { recordLog } from "@/lib/audit-log-store";

// ─── 배너 스토어 (API 기반) ───────────────────────────────────────────────────
//
// 기존 localStorage 구현을 공유 Mock API(@didimzip/api)로 전환.
// StoredBanner 는 공유 Banner 와 필드가 동일하므로 그대로 사용한다.
// 드래프트/이미지 압축/텍스트색 감지는 브라우저 로컬 유틸이라 유지.

export type StoredBanner = ApiBanner;

type UpsertInput = Omit<
  StoredBanner,
  "id" | "createdAt" | "updatedAt" | "clickCount" | "impressionCount"
> & { id?: string | null };

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function getAllBanners(): Promise<StoredBanner[]> {
  return bannersApi.list();
}

export async function getBanner(id: string): Promise<StoredBanner | undefined> {
  try {
    return await bannersApi.get(id);
  } catch {
    return undefined;
  }
}

export async function upsertBanner(data: UpsertInput): Promise<StoredBanner> {
  const { id, ...rest } = data;
  if (id) {
    return bannersApi.update(id, rest as BannerUpdateInput);
  }
  return bannersApi.create(rest as BannerCreateInput);
}

export async function deleteBanner(id: string): Promise<void> {
  await bannersApi.remove(id);
}

export async function deleteBanners(ids: string[]): Promise<void> {
  await Promise.all(ids.map((id) => bannersApi.remove(id)));
}

export async function restoreBanners(items: StoredBanner[]): Promise<void> {
  for (const item of items) {
    const { id: _id, createdAt: _c, updatedAt: _u, clickCount: _cc, impressionCount: _ic, ...rest } = item;
    void _id; void _c; void _u; void _cc; void _ic;
    await bannersApi.create(rest as BannerCreateInput);
  }
}

export async function toggleBannerActive(id: string): Promise<void> {
  const target = await getBanner(id);
  if (!target) return;
  await bannersApi.update(id, { isActive: !target.isActive });
  recordLog(
    "BANNER_CREATE",
    `배너 "${target.title.slice(0, 30)}" ${target.isActive ? "비활성화" : "활성화"}`,
    { targetType: "BANNER", targetId: id },
  );
}

/** 히어로 슬라이드 순서 일괄 업데이트. ids 배열 순서대로 sortOrder 1,2,3… 부여 */
export async function reorderHeroSlides(orderedIds: string[]): Promise<void> {
  await bannersApi.reorder(orderedIds);
}

// ─── Banner Drafts (로컬 전용 — 미발행 작업 상태, web과 공유하지 않음) ────────

export type BannerDraft = {
  id: string;
  name: string;
  bannerType: string;
  title: string;
  subtitle: string;
  subText: string;
  textColor: string;
  description: string;
  positions: string[];
  linkUrl: string;
  linkTarget: string;
  weight: number;
  isPaid: boolean;
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

// ─── Background brightness detection ─────────────────────────────────────────

/**
 * 이미지의 왼쪽 40% 영역의 평균 밝기를 분석하여 텍스트 색상 결정.
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

// ─── Image compression ───────────────────────────────────────────────────────

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
