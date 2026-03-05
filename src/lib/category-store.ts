export type SubCategory = {
  id: string;
  name: string;
};

export type Category = {
  id: string;
  name: string;
  subCategories: SubCategory[];
};

const STORAGE_KEY = "didimzip_categories";

const DEFAULT_CATEGORIES: Category[] = [
  { id: "cat_insight", name: "인사이트", subCategories: [] },
  { id: "cat_network", name: "네트워킹", subCategories: [] },
  { id: "cat_invest", name: "투자정보", subCategories: [] },
  { id: "cat_job", name: "채용공고", subCategories: [] },
  { id: "cat_event", name: "이벤트", subCategories: [] },
  { id: "cat_notice", name: "공지사항", subCategories: [] },
];

function loadAll(): Category[] {
  if (typeof window === "undefined") return DEFAULT_CATEGORIES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Category[]) : DEFAULT_CATEGORIES;
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

function saveAll(categories: Category[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
}

export function getCategories(): Category[] {
  return loadAll();
}

export function saveCategories(categories: Category[]): void {
  saveAll(categories);
}

/** 카테고리 이름 목록만 반환 (콘텐츠 작성 폼에서 사용) */
export function getCategoryNames(): string[] {
  return loadAll().map((c) => c.name);
}

/** 특정 카테고리의 세부 카테고리 이름 목록 반환 */
export function getSubCategoryNames(categoryName: string): string[] {
  const cat = loadAll().find((c) => c.name === categoryName);
  return cat ? cat.subCategories.map((s) => s.name) : [];
}
