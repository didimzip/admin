import type { Post } from "@didimzip/api";

// 개발용 초기 시드 데이터. data/db.json 이 없을 때 1회 생성된다.
// 실제 서비스에서는 DB 마이그레이션 seed로 대체된다.

function post(p: Partial<Post> & Pick<Post, "id" | "title" | "category">): Post {
  const now = "2026-06-01T09:00:00.000Z";
  return {
    id: p.id,
    title: p.title,
    body: p.body ?? "<p>본문 내용입니다.</p>",
    category: p.category,
    subCategory: p.subCategory ?? "",
    tags: p.tags ?? [],
    thumbnailUrl: p.thumbnailUrl ?? `https://picsum.photos/seed/${p.id}/480/320`,
    relatedLinks: p.relatedLinks ?? [],
    attachments: p.attachments ?? [],
    status: p.status ?? "PUBLISHED",
    isHot: p.isHot ?? false,
    viewCount: p.viewCount ?? 0,
    showConsultButton: p.showConsultButton ?? false,
    publishStart: p.publishStart ?? "",
    publishEnd: p.publishEnd ?? "",
    isScheduled: p.isScheduled ?? false,
    scheduledAt: p.scheduledAt ?? "",
    authorId: p.authorId,
    authorName: p.authorName ?? "디딤에디터",
    createdAt: p.createdAt ?? now,
    updatedAt: p.updatedAt ?? now,
  };
}

export function seedPosts(): Post[] {
  return [
    post({
      id: "post_seed_1",
      title: "2026년 스타트업 투자 트렌드 분석",
      category: "투자정보",
      subCategory: "투자유치",
      tags: ["투자", "트렌드", "VC"],
      body: "<p>2026년 스타트업 투자 시장의 핵심 흐름을 정리했습니다.</p>",
      isHot: true,
      viewCount: 1245,
      authorName: "오벤처",
    }),
    post({
      id: "post_seed_2",
      title: "시리즈 A 투자 유치, 무엇부터 준비해야 할까?",
      category: "투자정보",
      subCategory: "IR",
      tags: ["시리즈A", "IR", "피칭"],
      body: "<p>현직 심사역이 알려주는 IR 피칭 전략과 투자 유치 실전 가이드.</p>",
      isHot: true,
      viewCount: 987,
      authorName: "김창업",
    }),
    post({
      id: "post_seed_3",
      title: "디지털 마케팅의 중요성과 전략",
      category: "인사이트",
      subCategory: "마케팅",
      tags: ["마케팅", "그로스"],
      body: "<p>성공적인 창업을 위해 필요한 핵심 인사이트를 공유합니다.</p>",
      viewCount: 756,
      authorName: "오프뷰티",
    }),
    post({
      id: "post_seed_4",
      title: "창업가의 심리적 준비: 실패를 두려워하지 않는 법",
      category: "인사이트",
      subCategory: "마인드셋",
      tags: ["창업", "마인드셋"],
      body: "<p>창업 여정에서 마주하는 심리적 도전과 극복 방법.</p>",
      viewCount: 512,
      authorName: "이혁신",
    }),
    post({
      id: "post_seed_5",
      title: "정부지원사업 총정리 — 2026 상반기",
      category: "공지사항",
      subCategory: "지원사업",
      tags: ["정부지원", "지원사업"],
      body: "<p>놓치면 아쉬운 창업 지원 프로그램을 한곳에 모았습니다.</p>",
      isHot: true,
      viewCount: 2103,
      authorName: "디딤에디터",
    }),
    post({
      id: "post_seed_6",
      title: "3월 네트워킹 데이 안내",
      category: "이벤트",
      subCategory: "행사",
      tags: ["네트워킹", "이벤트"],
      body: "<p>창업가와 투자자가 만나는 네트워킹 데이에 초대합니다.</p>",
      viewCount: 340,
      authorName: "디딤에디터",
    }),
  ];
}
