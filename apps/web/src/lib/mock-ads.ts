import type { ContentCard } from "./mock-data";

// ⚠️ 디자인 확인용 더미 광고 콘텐츠 (1개). 실제 Admin 광고 콘텐츠 등록 기능 연동 시 제거.
// 광고도 일반 콘텐츠와 "동일한 ContentCard 모델"을 사용(isAd/company 필드)하므로,
// 추후 Admin 데이터로 그대로 교체 가능(별도 광고 카드 타입 없음).
export const dummyAdCard: ContentCard = {
  id: "ad-dummy-1",
  title: "'신청해'로 경제적 부담 덜고 취뽀!",
  summary: "신한금융희망재단이 함께하는 청년 취업 지원 프로그램을 확인해보세요.",
  thumbnail: "https://picsum.photos/seed/didim-ad-shinhan/480/320",
  category: "광고",
  subcategory: "",
  author: "신한금융희망재단",
  company: "신한금융희망재단", // 광고주명 — 작성자(닉네임) 위치에 표시
  viewCount: 0,
  isHot: false,
  isAd: true,
  createdAt: "2026.07.10",
};
