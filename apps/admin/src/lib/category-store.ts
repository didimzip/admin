import { categoriesApi, type Category as ApiCategory } from "@didimzip/api";

// ─── 카테고리 스토어 (API 기반) ───────────────────────────────────────────────
//
// 기존 localStorage 구현을 공유 Mock API(@didimzip/api)로 전환.
// Admin은 아이콘(iconName 문자열)·노출여부(isVisible)까지 관리하고,
// 저장 시 전체 배열을 순서대로 교체 저장(save-all)한다.
// 실백엔드 전환 시에도 admin 화면 코드는 무수정 (API Client/Repository만 교체).

export type SubCategory = {
  id: string;
  name: string;
  slug: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  iconName: string; // react-icons/ri 이름 문자열 (예: "RiLightbulbLine")
  isVisible: boolean;
  subCategories: SubCategory[];
};

function toLocal(c: ApiCategory): Category {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    iconName: c.iconName,
    isVisible: c.isVisible,
    subCategories: c.subCategories.map((s) => ({ id: s.id, name: s.name, slug: s.slug })),
  };
}

/** 전체 카테고리 조회 (sortOrder 오름차순). */
export async function getCategories(): Promise<Category[]> {
  const categories = await categoriesApi.list();
  return categories.map(toLocal);
}

/** 전체 카테고리를 배열 순서대로 교체 저장 (Admin save-all). */
export async function saveCategories(categories: Category[]): Promise<Category[]> {
  const saved = await categoriesApi.replaceAll(
    categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      iconName: c.iconName,
      isVisible: c.isVisible,
      subCategories: c.subCategories.map((s) => ({ id: s.id, name: s.name, slug: s.slug })),
    })),
  );
  return saved.map(toLocal);
}
