import type {
  Banner,
  BannerCreateInput,
  BannerListQuery,
  BannerUpdateInput,
} from "@didimzip/api";
import { readDb, writeDb } from "../db";

// ─── Banners Repository (교체 이음새) ────────────────────────────────────────
//
// admin/web 은 이 repository 를 직접 쓰지 않고 API(Route Handler)로 접근한다.
// PostgreSQL + Prisma 전환 시 아래 함수 구현만 교체하면 되고, 시그니처(계약)는
// 유지되므로 Route Handler·Client·UI는 무수정.

export const bannersRepository = {
  async findAll(query?: BannerListQuery): Promise<Banner[]> {
    let banners = [...readDb().banners];

    if (query?.type) {
      banners = banners.filter((b) => b.bannerType === query.type);
    }
    if (query?.position) {
      banners = banners.filter((b) => b.position === query.position);
    }
    if (query?.active !== undefined) {
      banners = banners.filter((b) => b.isActive === query.active);
    }

    // 노출 순서(sortOrder) 오름차순
    return banners.sort((a, b) => a.sortOrder - b.sortOrder);
  },

  async findById(id: string): Promise<Banner | null> {
    return readDb().banners.find((b) => b.id === id) ?? null;
  },

  async create(input: BannerCreateInput): Promise<Banner> {
    const db = readDb();
    const now = new Date().toISOString();
    const banner: Banner = {
      ...input,
      id: `banner_${Date.now()}`,
      clickCount: 0,
      impressionCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    db.banners.unshift(banner);
    writeDb(db);
    return banner;
  },

  async update(id: string, input: BannerUpdateInput): Promise<Banner | null> {
    const db = readDb();
    const idx = db.banners.findIndex((b) => b.id === id);
    if (idx === -1) return null;

    const existing = db.banners[idx];
    const updated: Banner = {
      ...existing,
      ...input,
      id: existing.id,
      clickCount: existing.clickCount,
      impressionCount: existing.impressionCount,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };
    db.banners[idx] = updated;
    writeDb(db);
    return updated;
  },

  async remove(id: string): Promise<boolean> {
    const db = readDb();
    const before = db.banners.length;
    db.banners = db.banners.filter((b) => b.id !== id);
    if (db.banners.length === before) return false;
    writeDb(db);
    return true;
  },

  /** ids 순서대로 sortOrder 1,2,3… 재부여. 갱신된 전체 목록 반환. */
  async reorder(orderedIds: string[]): Promise<Banner[]> {
    const db = readDb();
    const now = new Date().toISOString();
    db.banners = db.banners.map((b) => {
      const idx = orderedIds.indexOf(b.id);
      if (idx === -1) return b;
      return { ...b, sortOrder: idx + 1, updatedAt: now };
    });
    writeDb(db);
    return [...db.banners].sort((a, b) => a.sortOrder - b.sortOrder);
  },
};
