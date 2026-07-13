import type {
  FamilySite,
  FamilySiteInput,
  FamilySiteListQuery,
  FooterSettings,
  FooterSettingsInput,
} from "@didimzip/api";
import { readDb, writeDb } from "../db";

// ─── Footer Repository (교체 이음새) ──────────────────────────────────────────
//
// admin/web 은 이 repository 를 직접 쓰지 않고 API(Route Handler)로 접근한다.
// PostgreSQL + Prisma 전환 시 아래 함수 구현만 교체하면 되고, 시그니처(계약)는
// 유지되므로 Route Handler·Client·UI는 무수정.
//
// 관련 사이트(패밀리 사이트)의 순서(sortOrder)는 저장 시 배열 위치로 부여한다.

let seq = 0;
function uid(prefix: string): string {
  seq += 1;
  return `${prefix}_${Date.now()}_${seq}`;
}

export const footerRepository = {
  // ── 회사/고객센터 정보 (단일 레코드) ──
  async getSettings(): Promise<FooterSettings> {
    return readDb().footerSettings;
  },

  async updateSettings(input: FooterSettingsInput): Promise<FooterSettings> {
    const db = readDb();
    const updated: FooterSettings = {
      ...db.footerSettings,
      ...input,
      updatedAt: new Date().toISOString(),
    };
    db.footerSettings = updated;
    writeDb(db);
    return updated;
  },

  // ── 관련 사이트(패밀리 사이트) ──
  async listFamilySites(query?: FamilySiteListQuery): Promise<FamilySite[]> {
    let sites = [...readDb().familySites];
    if (query?.visible !== undefined) {
      sites = sites.filter((s) => s.isVisible === query.visible);
    }
    return sites.sort((a, b) => a.sortOrder - b.sortOrder);
  },

  /**
   * 전체 관련 사이트를 배열 순서대로 교체 저장(Admin save-all).
   * sortOrder 는 배열 위치로 재부여한다(Admin 순서 = 배열 순서).
   */
  async saveFamilySites(inputs: FamilySiteInput[]): Promise<FamilySite[]> {
    const next: FamilySite[] = inputs.map((input, index) => ({
      id: input.id && input.id.trim() ? input.id : uid("fam"),
      name: input.name,
      url: input.url,
      newTab: input.newTab ?? false,
      sortOrder: index + 1,
      isVisible: input.isVisible ?? true,
    }));

    const db = readDb();
    db.familySites = next;
    writeDb(db);
    return [...next].sort((a, b) => a.sortOrder - b.sortOrder);
  },
};
