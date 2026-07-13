import type { Author, AuthorUpsertInput } from "@didimzip/api";
import { readDb, writeDb } from "../db";

// ─── Authors Repository (교체 이음새) ────────────────────────────────────────
//
// 작성자 신원(닉네임·프로필 이미지)의 단일 출처. Post 는 authorId 로 이 레코드를 참조하고,
// web 은 조회 시점에 최신 값을 읽는다. PostgreSQL(Users 테이블) 전환 시 이 구현만 교체.

export const authorsRepository = {
  async findAll(): Promise<Author[]> {
    return readDb().authors;
  },

  async findById(id: string): Promise<Author | null> {
    return readDb().authors.find((a) => a.id === id) ?? null;
  },

  /**
   * 다건 upsert — id 기준으로 있으면 nickname/profileImage 갱신, 없으면 생성.
   * 목록에 없는 기존 작성자는 그대로 보존한다(부분 동기화).
   */
  async upsertMany(inputs: AuthorUpsertInput[]): Promise<Author[]> {
    const db = readDb();
    const now = new Date().toISOString();
    for (const input of inputs) {
      if (!input?.id) continue;
      const idx = db.authors.findIndex((a) => a.id === input.id);
      if (idx === -1) {
        db.authors.push({
          id: input.id,
          nickname: input.nickname,
          profileImage: input.profileImage ?? "",
          createdAt: now,
          updatedAt: now,
        });
      } else {
        const existing = db.authors[idx];
        db.authors[idx] = {
          ...existing,
          nickname: input.nickname,
          profileImage: input.profileImage ?? existing.profileImage,
          updatedAt: now,
        };
      }
    }
    writeDb(db);
    return db.authors;
  },
};
