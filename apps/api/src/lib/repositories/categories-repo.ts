import type {
  Category,
  CategoryInput,
  CategoryListQuery,
  CategorySub,
} from "@didimzip/api";
import { readDb, writeDb } from "../db";

// ─── Categories Repository (교체 이음새) ─────────────────────────────────────
//
// admin/web 은 이 repository 를 직접 쓰지 않고 API(Route Handler)로 접근한다.
// PostgreSQL + Prisma 전환 시 아래 함수 구현만 교체하면 되고, 시그니처(계약)는
// 유지되므로 Route Handler·Client·UI는 무수정.
//
// 순서(sortOrder)는 저장 시 배열 위치로 부여한다(Admin의 드래그 순서 = 배열 순서).

let seq = 0;
function uid(prefix: string): string {
  seq += 1;
  return `${prefix}_${Date.now()}_${seq}`;
}

function normalizeSub(
  s: { id?: string; name: string; slug?: string },
): CategorySub {
  const id = s.id && s.id.trim() ? s.id : uid("sub");
  return {
    id,
    name: s.name,
    slug: s.slug && s.slug.trim() ? s.slug : id,
  };
}

export const categoriesRepository = {
  async findAll(query?: CategoryListQuery): Promise<Category[]> {
    let categories = [...readDb().categories];
    if (query?.visible !== undefined) {
      categories = categories.filter((c) => c.isVisible === query.visible);
    }
    return categories.sort((a, b) => a.sortOrder - b.sortOrder);
  },

  /**
   * 전체 카테고리를 배열 순서대로 교체 저장(Admin save-all).
   * 기존 항목의 createdAt 은 보존하고, sortOrder 는 배열 위치로 재부여한다.
   */
  async replaceAll(inputs: CategoryInput[]): Promise<Category[]> {
    const now = new Date().toISOString();
    const existing = readDb().categories;
    const byId = new Map(existing.map((c) => [c.id, c]));

    const next: Category[] = inputs.map((input, index) => {
      const id = input.id && input.id.trim() ? input.id : uid("cat");
      const prev = byId.get(id);
      return {
        id,
        name: input.name,
        slug: input.slug && input.slug.trim() ? input.slug : id,
        iconName: input.iconName ?? prev?.iconName ?? "",
        sortOrder: index + 1,
        isVisible: input.isVisible ?? prev?.isVisible ?? true,
        subCategories: (input.subCategories ?? prev?.subCategories ?? []).map(normalizeSub),
        createdAt: prev?.createdAt ?? now,
        updatedAt: now,
      };
    });

    const db = readDb();
    db.categories = next;
    writeDb(db);
    return [...next].sort((a, b) => a.sortOrder - b.sortOrder);
  },
};
