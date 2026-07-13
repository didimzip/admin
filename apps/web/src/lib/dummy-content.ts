import type { ContentCard } from "./mock-data";

// ─── 개발용 더미 콘텐츠 (Infinite Scroll / Skeleton 테스트 전용) ────────────────
//
// ⚠️ 제거 방법: 실제 API(PostgreSQL) 연결 시 이 파일을 삭제하고,
//    content-queries.ts 의 `USE_DUMMY_CONTENT` 분기 한 줄만 지우면 된다.
//    카테고리 페이지 데이터 계층에서만 사용 → admin/홈 목록에는 영향 없음.
//
// index 기반 결정적 생성(Math.random 미사용) → 페이지 간 id/내용이 안정적이라
// Infinite Scroll 누적 시 중복·리마운트가 없다.

const TITLE_HEADS = [
  "초기 스타트업이 꼭 알아야 할",
  "예비창업자를 위한",
  "투자 유치 전 반드시 챙겨야 할",
  "1인 창업가를 위한 실전",
  "매출 10배 성장을 만든",
  "실패에서 배우는",
  "팀 빌딩부터 시작하는",
  "정부지원사업 200% 활용하는",
  "브랜드를 각인시키는",
  "고객을 팬으로 만드는",
];

const TITLE_TAILS = [
  "정부지원금 총정리",
  "IR 피치덱 작성법",
  "린 스타트업 실행 가이드",
  "마케팅 자동화 전략",
  "세무·회계 체크리스트",
  "채용 브랜딩 노하우",
  "MVP 검증 프레임워크",
  "그로스 해킹 사례",
  "온보딩 설계 원칙",
  "리텐션 개선 실험",
];

const SUMMARIES = [
  "실제 사례와 데이터를 바탕으로 핵심만 정리했습니다.",
  "지금 바로 적용할 수 있는 실전 팁을 담았습니다.",
  "많은 창업가들이 놓치는 부분을 짚어드립니다.",
  "처음이라면 반드시 알아야 할 내용을 모았습니다.",
  "현직 전문가의 인사이트를 확인해보세요.",
];

const AUTHORS = [
  "디딤에디터",
  "정언",
  "김창업",
  "오벤처",
  "이혁신",
  "박성장",
  "스타트업랩",
  "그로스팀",
];

const CATEGORIES: Array<{ category: string; subcategory: string }> = [
  { category: "정책·지원사업", subcategory: "정부지원금" },
  { category: "자금조달", subcategory: "투자유치" },
  { category: "마케팅", subcategory: "그로스" },
  { category: "조직·인사", subcategory: "채용" },
  { category: "사업화전략", subcategory: "MVP" },
  { category: "세무·회계", subcategory: "절세" },
];

/** count 개의 다양한 더미 콘텐츠 카드를 생성한다 (기본 84 = 12 × 7페이지). */
export function generateDummyContentCards(count = 84): ContentCard[] {
  return Array.from({ length: count }, (_, i) => {
    const cat = CATEGORIES[i % CATEGORIES.length];
    // 2026-06-30 부터 하루씩 과거로 (최신순 정렬 자연스럽게)
    const day = String(30 - (i % 28)).padStart(2, "0");
    return {
      id: `dummy_${i + 1}`,
      title: `${TITLE_HEADS[i % TITLE_HEADS.length]} ${TITLE_TAILS[(i * 3) % TITLE_TAILS.length]}`,
      summary: SUMMARIES[i % SUMMARIES.length],
      thumbnail: `https://picsum.photos/seed/didim-dummy-${i + 1}/480/320`,
      category: cat.category,
      subcategory: cat.subcategory,
      author: AUTHORS[i % AUTHORS.length],
      authorBadge: "editor",
      viewCount: 300 + ((i * 137) % 9700), // 300~9999, 다양하게
      isHot: i % 6 === 0,
      isAd: false,
      createdAt: `2026.06.${day}`,
    } satisfies ContentCard;
  });
}
