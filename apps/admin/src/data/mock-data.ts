// ── Verifications (서류 인증 관리) ──

export interface Verification {
  id: string;
  userId: string;
  nickname: string;
  realName: string;
  companyName: string;
  companyType: string;
  docType: "BIZ_REG" | "CARD";
  fileUrl: string;
  submittedAt: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminMemo: string;
}

export const mockVerifications: Verification[] = [
  { id: "doc_001", userId: "usr_003", nickname: "박그린", realName: "박현우", companyName: "그린랩", companyType: "스타트업", docType: "BIZ_REG", fileUrl: "/docs/bizreg_003.pdf", submittedAt: "2026-02-20T10:00:00Z", status: "PENDING", adminMemo: "" },
  { id: "doc_002", userId: "usr_004", nickname: "최데이터", realName: "최소연", companyName: "데이터플라이", companyType: "스타트업", docType: "CARD", fileUrl: "/docs/card_004.jpg", submittedAt: "2026-02-18T14:30:00Z", status: "PENDING", adminMemo: "" },
  { id: "doc_003", userId: "usr_015", nickname: "고코트라", realName: "고하나", companyName: "KOTRA", companyType: "공공기관", docType: "CARD", fileUrl: "/docs/card_015.jpg", submittedAt: "2026-02-22T09:00:00Z", status: "PENDING", adminMemo: "" },
  { id: "doc_004", userId: "usr_001", nickname: "김창업", realName: "김민수", companyName: "테크스타트 주식회사", companyType: "스타트업", docType: "BIZ_REG", fileUrl: "/docs/bizreg_001.pdf", submittedAt: "2026-01-20T11:00:00Z", status: "APPROVED", adminMemo: "사업자등록증 확인 완료" },
  { id: "doc_005", userId: "usr_007", nickname: "오벤처", realName: "오상원", companyName: "코리아인베스트먼트", companyType: "투자사", docType: "BIZ_REG", fileUrl: "/docs/bizreg_007.pdf", submittedAt: "2026-01-10T09:30:00Z", status: "APPROVED", adminMemo: "투자사 등록증 확인" },
  { id: "doc_006", userId: "usr_017", nickname: "문변호사", realName: "문재현", companyName: "법무법인 정의", companyType: "전문직", docType: "CARD", fileUrl: "/docs/card_017.jpg", submittedAt: "2026-01-15T14:00:00Z", status: "APPROVED", adminMemo: "변호사 명함 확인" },
  { id: "doc_007", userId: "usr_020", nickname: "황특허", realName: "황예린", companyName: "특허법인 드림", companyType: "전문직", docType: "CARD", fileUrl: "/docs/card_020.jpg", submittedAt: "2026-02-25T16:00:00Z", status: "PENDING", adminMemo: "" },
  { id: "doc_008", userId: "usr_025", nickname: "배비영리", realName: "배정환", companyName: "사회적기업진흥원", companyType: "기타", docType: "BIZ_REG", fileUrl: "/docs/bizreg_025.pdf", submittedAt: "2026-02-28T10:30:00Z", status: "PENDING", adminMemo: "" },
  { id: "doc_009", userId: "usr_009", nickname: "권시드", realName: "권태훈", companyName: "시드펀드매니지먼트", companyType: "투자사", docType: "BIZ_REG", fileUrl: "/docs/bizreg_009.pdf", submittedAt: "2026-02-05T11:00:00Z", status: "REJECTED", adminMemo: "서류 불선명, 재업로드 요청" },
  { id: "doc_010", userId: "usr_019", nickname: "안컨설", realName: "안찬우", companyName: "맥킨지코리아", companyType: "전문직", docType: "CARD", fileUrl: "/docs/card_019.jpg", submittedAt: "2026-02-10T13:00:00Z", status: "REJECTED", adminMemo: "명함 정보 불일치" },
];

// ── Posts (게시물) ──

export type PostStatus = "PUBLISHED" | "DRAFT" | "SCHEDULED" | "HIDDEN";

export interface Post {
  id: string;
  title: string;
  authorNickname: string;
  status: PostStatus;
  category: string;
  subCategory?: string;
  viewCount: number;
  virtualViewCount: number;
  todayViewCount: number;
  scrapCount: number;
  commentCount: number;
  isHot: boolean;
  scheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const POST_CATEGORIES = ["전체", "인사이트", "네트워킹", "투자정보", "채용공고", "이벤트", "공지사항"] as const;

export const mockPosts: Post[] = [
  { id: "post_001", title: "2026년 스타트업 투자 트렌드 분석", authorNickname: "오벤처", status: "PUBLISHED", category: "투자정보", viewCount: 1245, virtualViewCount: 200, todayViewCount: 87, scrapCount: 89, commentCount: 23, isHot: true, scheduledAt: null, createdAt: "2026-02-28T09:00:00Z", updatedAt: "2026-02-28T09:00:00Z" },
  { id: "post_002", title: "AI 기반 B2B SaaS 시장 전망", authorNickname: "이지은AI", status: "PUBLISHED", category: "인사이트", viewCount: 987, virtualViewCount: 150, todayViewCount: 52, scrapCount: 67, commentCount: 15, isHot: true, scheduledAt: null, createdAt: "2026-02-25T14:00:00Z", updatedAt: "2026-02-26T10:00:00Z" },
  { id: "post_003", title: "시리즈A 투자 유치 성공기", authorNickname: "김창업", status: "PUBLISHED", category: "인사이트", viewCount: 756, virtualViewCount: 100, todayViewCount: 34, scrapCount: 45, commentCount: 31, isHot: false, scheduledAt: null, createdAt: "2026-02-20T11:00:00Z", updatedAt: "2026-02-20T11:00:00Z" },
  { id: "post_004", title: "3월 네트워킹 데이 안내", authorNickname: "관리자", status: "SCHEDULED", category: "이벤트", viewCount: 0, virtualViewCount: 0, todayViewCount: 0, scrapCount: 0, commentCount: 0, isHot: false, scheduledAt: "2026-03-05T09:00:00Z", createdAt: "2026-03-01T16:00:00Z", updatedAt: "2026-03-01T16:00:00Z" },
  { id: "post_005", title: "법률 자문 서비스 이용 가이드", authorNickname: "문변호사", status: "PUBLISHED", category: "공지사항", viewCount: 432, virtualViewCount: 50, todayViewCount: 18, scrapCount: 28, commentCount: 5, isHot: false, scheduledAt: null, createdAt: "2026-02-15T10:00:00Z", updatedAt: "2026-02-15T10:00:00Z" },
  { id: "post_006", title: "스타트업 세무 관리 체크리스트", authorNickname: "송세무", status: "PUBLISHED", category: "인사이트", viewCount: 621, virtualViewCount: 80, todayViewCount: 29, scrapCount: 52, commentCount: 12, isHot: false, scheduledAt: null, createdAt: "2026-02-10T09:30:00Z", updatedAt: "2026-02-11T14:00:00Z" },
  { id: "post_007", title: "[초안] 정부 지원사업 총정리 2026", authorNickname: "양공공", status: "DRAFT", category: "인사이트", viewCount: 0, virtualViewCount: 0, todayViewCount: 0, scrapCount: 0, commentCount: 0, isHot: false, scheduledAt: null, createdAt: "2026-03-02T11:00:00Z", updatedAt: "2026-03-02T15:00:00Z" },
  { id: "post_008", title: "프리시리즈A 밸류에이션 가이드", authorNickname: "서블루", status: "PUBLISHED", category: "투자정보", viewCount: 534, virtualViewCount: 70, todayViewCount: 21, scrapCount: 41, commentCount: 8, isHot: false, scheduledAt: null, createdAt: "2026-02-08T13:00:00Z", updatedAt: "2026-02-08T13:00:00Z" },
  { id: "post_009", title: "디딤집 서비스 업데이트 안내", authorNickname: "관리자", status: "PUBLISHED", category: "공지사항", viewCount: 1102, virtualViewCount: 300, todayViewCount: 63, scrapCount: 12, commentCount: 3, isHot: false, scheduledAt: null, createdAt: "2026-02-01T09:00:00Z", updatedAt: "2026-02-01T09:00:00Z" },
  { id: "post_010", title: "4월 채용공고 모음", authorNickname: "관리자", status: "DRAFT", category: "채용공고", viewCount: 0, virtualViewCount: 0, todayViewCount: 0, scrapCount: 0, commentCount: 0, isHot: false, scheduledAt: null, createdAt: "2026-03-03T10:00:00Z", updatedAt: "2026-03-03T10:00:00Z" },
  { id: "post_011", title: "ESG 투자 동향과 기업 대응 전략", authorNickname: "신넥스트", status: "PUBLISHED", category: "투자정보", viewCount: 389, virtualViewCount: 60, todayViewCount: 15, scrapCount: 33, commentCount: 7, isHot: false, scheduledAt: null, createdAt: "2026-02-05T10:00:00Z", updatedAt: "2026-02-05T10:00:00Z" },
  { id: "post_012", title: "3월 스타트업 밋업 사전 등록", authorNickname: "관리자", status: "SCHEDULED", category: "네트워킹", viewCount: 0, virtualViewCount: 0, todayViewCount: 0, scrapCount: 0, commentCount: 0, isHot: false, scheduledAt: "2026-03-10T09:00:00Z", createdAt: "2026-03-02T14:00:00Z", updatedAt: "2026-03-02T14:00:00Z" },
  { id: "post_013", title: "해외 진출 지원 프로그램 안내", authorNickname: "고코트라", status: "HIDDEN", category: "공지사항", viewCount: 210, virtualViewCount: 0, todayViewCount: 0, scrapCount: 5, commentCount: 1, isHot: false, scheduledAt: null, createdAt: "2026-01-20T09:00:00Z", updatedAt: "2026-02-28T11:00:00Z" },
];

// ── Comments (댓글) ──

export type CommentStatus = "ACTIVE" | "REPORTED" | "HIDDEN" | "DELETED";

export interface Comment {
  id: string;
  postId: string;
  postTitle: string;
  authorNickname: string;
  content: string;
  status: CommentStatus;
  reportCount: number;
  reportReason: string | null;
  createdAt: string;
}

export const mockComments: Comment[] = [
  { id: "cmt_001", postId: "post_001", postTitle: "2026년 스타트업 투자 트렌드 분석", authorNickname: "김창업", content: "올해 투자 시장이 많이 회복될 것 같습니다. 좋은 글 감사합니다!", status: "ACTIVE", reportCount: 0, reportReason: null, createdAt: "2026-02-28T10:30:00Z" },
  { id: "cmt_002", postId: "post_001", postTitle: "2026년 스타트업 투자 트렌드 분석", authorNickname: "서블루", content: "시리즈B 이상 투자 건도 분석해주시면 좋겠습니다.", status: "ACTIVE", reportCount: 0, reportReason: null, createdAt: "2026-02-28T11:00:00Z" },
  { id: "cmt_003", postId: "post_002", postTitle: "AI 기반 B2B SaaS 시장 전망", authorNickname: "정패스트", content: "AI SaaS 분야에서 한국 기업의 경쟁력이 높아지고 있네요.", status: "ACTIVE", reportCount: 0, reportReason: null, createdAt: "2026-02-25T16:00:00Z" },
  { id: "cmt_004", postId: "post_003", postTitle: "시리즈A 투자 유치 성공기", authorNickname: "권시드", content: "투자 유치 과정이 잘 정리되어 있어서 도움이 됩니다.", status: "ACTIVE", reportCount: 0, reportReason: null, createdAt: "2026-02-21T09:00:00Z" },
  { id: "cmt_005", postId: "post_001", postTitle: "2026년 스타트업 투자 트렌드 분석", authorNickname: "익명유저", content: "광고성 글 아닌가요? 특정 투자사를 홍보하는 것처럼 보입니다.", status: "REPORTED", reportCount: 3, reportReason: "광고/홍보성 콘텐츠", createdAt: "2026-02-28T14:00:00Z" },
  { id: "cmt_006", postId: "post_002", postTitle: "AI 기반 B2B SaaS 시장 전망", authorNickname: "스팸봇", content: "최저가 대출 상담 010-XXXX-XXXX 연락주세요", status: "REPORTED", reportCount: 8, reportReason: "스팸/도배", createdAt: "2026-02-26T03:00:00Z" },
  { id: "cmt_007", postId: "post_006", postTitle: "스타트업 세무 관리 체크리스트", authorNickname: "한에듀", content: "세무 관련 자료 정말 유용합니다. 공유 감사합니다.", status: "ACTIVE", reportCount: 0, reportReason: null, createdAt: "2026-02-12T10:00:00Z" },
  { id: "cmt_008", postId: "post_003", postTitle: "시리즈A 투자 유치 성공기", authorNickname: "임알파", content: "비슷한 경험이 있는데 공감이 많이 됩니다.", status: "ACTIVE", reportCount: 0, reportReason: null, createdAt: "2026-02-22T15:00:00Z" },
  { id: "cmt_009", postId: "post_005", postTitle: "법률 자문 서비스 이용 가이드", authorNickname: "악성유저", content: "이런 서비스는 사기입니다. 절대 이용하지 마세요.", status: "REPORTED", reportCount: 5, reportReason: "허위 정보/비방", createdAt: "2026-02-16T11:00:00Z" },
  { id: "cmt_010", postId: "post_009", postTitle: "디딤집 서비스 업데이트 안내", authorNickname: "조프리", content: "업데이트 내용 잘 확인했습니다!", status: "ACTIVE", reportCount: 0, reportReason: null, createdAt: "2026-02-01T14:00:00Z" },
  { id: "cmt_011", postId: "post_001", postTitle: "2026년 스타트업 투자 트렌드 분석", authorNickname: "차단된유저", content: "[삭제된 댓글입니다]", status: "DELETED", reportCount: 2, reportReason: "욕설/비하", createdAt: "2026-02-28T15:00:00Z" },
  { id: "cmt_012", postId: "post_008", postTitle: "프리시리즈A 밸류에이션 가이드", authorNickname: "박그린", content: "밸류에이션 산정 기준이 명확해서 참고하기 좋습니다.", status: "ACTIVE", reportCount: 0, reportReason: null, createdAt: "2026-02-09T10:00:00Z" },
  { id: "cmt_013", postId: "post_002", postTitle: "AI 기반 B2B SaaS 시장 전망", authorNickname: "숨김유저", content: "경쟁사 비하 내용이 포함되어 숨김 처리되었습니다.", status: "HIDDEN", reportCount: 4, reportReason: "경쟁사 비방", createdAt: "2026-02-26T09:00:00Z" },

  // ── report-store.ts 신고 데이터와 연동된 댓글 ──────────────────────────────
  { id: "cmt_044", postId: "post_003", postTitle: "시리즈A 투자 유치 성공기", authorNickname: "박그린", content: "저도 그 경험 있는데 솔직히 그냥 포기하는 게 나아요. 다들 그러잖아요.", status: "REPORTED", reportCount: 1, reportReason: "욕설/비방", createdAt: "2026-02-27T13:00:00Z" },
  { id: "cmt_082", postId: "post_001", postTitle: "2026년 스타트업 투자 트렌드 분석", authorNickname: "최데이터", content: "지금 바로 카카오 추가하면 특별 상담 드립니다 ㅎㅎ", status: "DELETED", reportCount: 1, reportReason: "스팸/광고", createdAt: "2026-02-13T09:30:00Z" },
  { id: "cmt_091", postId: "post_002", postTitle: "AI 기반 B2B SaaS 시장 전망", authorNickname: "최데이터", content: "이런 질문은 저한테 하세요~ 제 프로필 DM 주세요", status: "DELETED", reportCount: 1, reportReason: "스팸/광고", createdAt: "2026-02-15T07:50:00Z" },
  { id: "cmt_105", postId: "post_008", postTitle: "프리시리즈A 밸류에이션 가이드", authorNickname: "서블루", content: "저 연락처 남겨드릴게요, 꼭 연락주세요 투자 논의해봐요", status: "ACTIVE", reportCount: 1, reportReason: "스팸/광고", createdAt: "2026-02-20T11:20:00Z" },
  { id: "cmt_118", postId: "post_011", postTitle: "ESG 투자 동향과 기업 대응 전략", authorNickname: "양공공", content: "아 진짜 이런 글 올리는 사람들 이해 안 됨 ㅋㅋ 수준 봐라", status: "HIDDEN", reportCount: 1, reportReason: "욕설/비방", createdAt: "2026-03-03T08:45:00Z" },
];

// ── Campaigns (캠페인/알림 발송) ──

export type CampaignStatus = "DRAFT" | "SCHEDULED" | "SENT" | "CANCELLED";
export type CampaignChannel = "EMAIL" | "BRANDMSG" | "SMS" | "PUSH";

export interface Campaign {
  id: string;
  title: string;
  channel: CampaignChannel;
  status: CampaignStatus;
  targetFilter: {
    companyType?: string;
    jobCategory?: string;
    companyName?: string;
  };
  targetCount: number;
  sentCount: number;
  openRate: number;
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
}

export const mockCampaigns: Campaign[] = [
  { id: "camp_001", title: "3월 네트워킹 데이 초대", channel: "EMAIL", status: "SENT", targetFilter: { companyType: "스타트업" }, targetCount: 6, sentCount: 6, openRate: 83.3, scheduledAt: null, sentAt: "2026-02-28T10:00:00Z", createdAt: "2026-02-27T15:00:00Z" },
  { id: "camp_002", title: "투자사 대상 딜소싱 리포트", channel: "EMAIL", status: "SENT", targetFilter: { companyType: "투자사" }, targetCount: 5, sentCount: 5, openRate: 100, scheduledAt: null, sentAt: "2026-02-25T09:00:00Z", createdAt: "2026-02-24T14:00:00Z" },
  { id: "camp_003", title: "정부 지원사업 안내 알림", channel: "BRANDMSG", status: "SENT", targetFilter: { companyType: "스타트업", jobCategory: "IT/소프트웨어" }, targetCount: 4, sentCount: 4, openRate: 75.0, scheduledAt: null, sentAt: "2026-02-20T11:00:00Z", createdAt: "2026-02-19T16:00:00Z" },
  { id: "camp_004", title: "4월 스타트업 밋업 사전 안내", channel: "EMAIL", status: "SCHEDULED", targetFilter: {}, targetCount: 26, sentCount: 0, openRate: 0, scheduledAt: "2026-03-15T09:00:00Z", sentAt: null, createdAt: "2026-03-01T10:00:00Z" },
  { id: "camp_005", title: "전문직 네트워크 뉴스레터 Vol.3", channel: "EMAIL", status: "DRAFT", targetFilter: { companyType: "전문직" }, targetCount: 5, sentCount: 0, openRate: 0, scheduledAt: null, sentAt: null, createdAt: "2026-03-02T14:00:00Z" },
  { id: "camp_006", title: "세무 상담 서비스 오픈 알림", channel: "BRANDMSG", status: "SENT", targetFilter: { jobCategory: "회계/세무" }, targetCount: 2, sentCount: 2, openRate: 50.0, scheduledAt: null, sentAt: "2026-02-15T10:00:00Z", createdAt: "2026-02-14T09:00:00Z" },
  { id: "camp_007", title: "공공기관 협력 프로그램 안내", channel: "EMAIL", status: "CANCELLED", targetFilter: { companyType: "공공기관" }, targetCount: 5, sentCount: 0, openRate: 0, scheduledAt: "2026-02-10T09:00:00Z", sentAt: null, createdAt: "2026-02-08T11:00:00Z" },
  { id: "camp_008", title: "[광고] 3월 투자 설명회 안내", channel: "SMS", status: "SENT", targetFilter: { companyType: "투자사" }, targetCount: 4, sentCount: 4, openRate: 0, scheduledAt: null, sentAt: "2026-03-01T10:00:00Z", createdAt: "2026-02-28T16:00:00Z" },
  { id: "camp_009", title: "[광고] 스타트업 네트워킹 초대 문자", channel: "SMS", status: "DRAFT", targetFilter: { companyType: "스타트업" }, targetCount: 5, sentCount: 0, openRate: 0, scheduledAt: null, sentAt: null, createdAt: "2026-03-05T09:00:00Z" },
];

// ── Banners ──

export type BannerType = "HERO_SLIDE" | "AD";
export type BannerPosition = "HOME_TOP" | "HOME_SIDE" | "POST_BETWEEN" | "POST_BOTTOM" | "LOGIN_PAGE";

export type BannerTextColor = "light" | "dark"; // light = 흰색 텍스트, dark = 검정 텍스트

export interface Banner {
  id: string;
  title: string;
  subtitle: string;   // 상단 소제목 (예: "평생교육이용권")
  subText: string;     // 하단 서브텍스트 (예: "자세히 보기 →")
  textColor: BannerTextColor; // 배경에 따른 텍스트 색상
  bannerType: BannerType;
  imageUrl: string;
  linkUrl: string;
  position: BannerPosition;
  isActive: boolean;
  sortOrder: number;
  startDate: string;
  endDate: string;
  clickCount: number;
  impressionCount: number;
  createdAt: string;
}

export const BANNER_TYPE_LABELS: Record<BannerType, string> = {
  HERO_SLIDE: "히어로 슬라이드",
  AD: "광고 배너",
};

export const BANNER_POSITIONS: Record<BannerPosition, string> = {
  HOME_TOP: "홈 상단 (히어로)",
  HOME_SIDE: "홈 사이드바",
  POST_BETWEEN: "콘텐츠 사이",
  POST_BOTTOM: "게시물 하단",
  LOGIN_PAGE: "로그인 페이지",
};

export const HERO_POSITIONS: BannerPosition[] = ["HOME_TOP"];
export const AD_POSITIONS: BannerPosition[] = ["HOME_SIDE", "POST_BETWEEN", "POST_BOTTOM", "LOGIN_PAGE"];

export const mockBanners: Banner[] = [
  { id: "banner_001", title: "업계 실무 현직자들의 노하우를\n평생교육이용권으로 만나보세요!", subtitle: "평생교육이용권", subText: "자세히 보기 →", textColor: "light", bannerType: "HERO_SLIDE", imageUrl: "/banners/networking.png", linkUrl: "/posts/post_004", position: "HOME_TOP", isActive: true, sortOrder: 1, startDate: "2026-03-01", endDate: "2026-03-10", clickCount: 342, impressionCount: 5120, createdAt: "2026-02-28T09:00:00Z" },
  { id: "banner_002", title: "프리미엄 멤버십 안내", subtitle: "", subText: "", textColor: "light", bannerType: "AD", imageUrl: "/banners/premium.png", linkUrl: "/membership", position: "HOME_SIDE", isActive: true, sortOrder: 1, startDate: "2026-02-01", endDate: "2026-04-30", clickCount: 128, impressionCount: 3200, createdAt: "2026-01-30T14:00:00Z" },
  { id: "banner_003", title: "정부 지원사업 모집", subtitle: "", subText: "", textColor: "light", bannerType: "AD", imageUrl: "/banners/gov.png", linkUrl: "https://example.com/gov", position: "POST_BETWEEN", isActive: true, sortOrder: 1, startDate: "2026-02-15", endDate: "2026-03-15", clickCount: 87, impressionCount: 1890, createdAt: "2026-02-14T10:00:00Z" },
  { id: "banner_004", title: "서비스 가입 유도 배너", subtitle: "", subText: "", textColor: "light", bannerType: "AD", imageUrl: "/banners/signup.png", linkUrl: "/signup", position: "LOGIN_PAGE", isActive: true, sortOrder: 1, startDate: "2026-01-01", endDate: "2026-12-31", clickCount: 521, impressionCount: 8900, createdAt: "2025-12-28T09:00:00Z" },
  { id: "banner_005", title: "설맞이 특별 할인 이벤트\n최대 50% 할인 혜택을 놓치지 마세요!", subtitle: "설 연휴 이벤트", subText: "이벤트 참여하기 →", textColor: "light", bannerType: "HERO_SLIDE", imageUrl: "/banners/newyear.png", linkUrl: "/events/newyear", position: "HOME_TOP", isActive: false, sortOrder: 2, startDate: "2026-01-25", endDate: "2026-02-05", clickCount: 245, impressionCount: 4100, createdAt: "2026-01-20T11:00:00Z" },
  { id: "banner_006", title: "투자 세미나 광고 (종료)", subtitle: "", subText: "", textColor: "light", bannerType: "AD", imageUrl: "/banners/seminar.png", linkUrl: "/events/seminar", position: "HOME_SIDE", isActive: false, sortOrder: 2, startDate: "2026-02-01", endDate: "2026-02-20", clickCount: 67, impressionCount: 1200, createdAt: "2026-01-28T15:00:00Z" },
  { id: "banner_007", title: "디딤집과 함께 성장하는\n스타트업 생태계를 만들어갑니다", subtitle: "신규 서비스 런칭", subText: "더 알아보기 →", textColor: "light", bannerType: "HERO_SLIDE", imageUrl: "/banners/launch.png", linkUrl: "/about", position: "HOME_TOP", isActive: true, sortOrder: 2, startDate: "2026-02-20", endDate: "2026-03-20", clickCount: 198, impressionCount: 3800, createdAt: "2026-02-19T10:00:00Z" },
  { id: "banner_008", title: "스타트업 채용관 오픈", subtitle: "", subText: "", textColor: "light", bannerType: "AD", imageUrl: "/banners/recruit.png", linkUrl: "/jobs", position: "POST_BETWEEN", isActive: true, sortOrder: 2, startDate: "2026-03-01", endDate: "2026-03-31", clickCount: 54, impressionCount: 920, createdAt: "2026-02-28T14:00:00Z" },
];

// ── Audit Logs ──

export type AuditAction = "LOGIN" | "LOGOUT" | "SIGNUP" | "PROFILE_UPDATE" | "DOC_UPLOAD" | "DOC_APPROVE" | "DOC_REJECT" | "POST_CREATE" | "POST_UPDATE" | "POST_DELETE" | "COMMENT_CREATE" | "COMMENT_REPORT" | "COMMENT_DELETE" | "COMMENT_HIDE" | "COMMENT_RESTORE" | "BADGE_GRANT" | "BADGE_REVOKE" | "CAMPAIGN_SEND" | "BANNER_CREATE" | "SETTINGS_UPDATE" | "USER_SUSPEND" | "USER_ACTIVATE" | "USER_WITHDRAW" | "REPORT_RESOLVE" | "REPORT_DISMISS" | "REPORT_REVIEW" | "ADMIN_CREATE" | "ADMIN_ROLE_CHANGE" | "ADMIN_STATUS_CHANGE" | "ADMIN_INFO_UPDATE" | "ADMIN_PW_RESET" | "ADMIN_DELETE" | "CATEGORY_CREATE" | "CATEGORY_UPDATE" | "CATEGORY_DELETE" | "MENTOR_CREATE" | "MENTOR_UPDATE" | "MENTOR_APPROVE" | "MENTOR_REJECT" | "MENTOR_SUSPEND" | "MENTOR_RESUME" | "MENTOR_DELETE" | "MENTOR_QNA_ANSWER" | "MENTOR_QNA_ANSWER_UPDATE" | "MENTOR_QNA_CLOSE" | "MENTOR_QNA_DELETE" | "STUDY_UPDATE" | "STUDY_DELETE";

export interface AuditLog {
  id: string;
  action: AuditAction;
  actorNickname: string;
  actorRole: "MEMBER" | "ADMIN";
  targetType: string;
  targetId: string;
  description: string;
  ip: string;
  createdAt: string;
}

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  LOGIN: "로그인",
  LOGOUT: "로그아웃",
  SIGNUP: "회원가입",
  PROFILE_UPDATE: "프로필 수정",
  DOC_UPLOAD: "서류 업로드",
  DOC_APPROVE: "서류 승인",
  DOC_REJECT: "서류 반려",
  POST_CREATE: "게시물 작성",
  POST_UPDATE: "게시물 수정",
  POST_DELETE: "게시물 삭제",
  COMMENT_CREATE: "댓글 작성",
  COMMENT_REPORT: "댓글 신고",
  COMMENT_DELETE: "댓글 삭제",
  COMMENT_HIDE: "댓글 숨김",
  COMMENT_RESTORE: "댓글 복원",
  BADGE_GRANT: "뱃지 부여",
  BADGE_REVOKE: "뱃지 취소",
  CAMPAIGN_SEND: "캠페인 발송",
  BANNER_CREATE: "배너 등록",
  SETTINGS_UPDATE: "설정 변경",
  USER_SUSPEND: "회원 정지",
  USER_ACTIVATE: "회원 활성화",
  USER_WITHDRAW: "회원 탈퇴 처리",
  REPORT_RESOLVE: "신고 조치완료",
  REPORT_DISMISS: "신고 기각",
  REPORT_REVIEW: "신고 재검토",
  ADMIN_CREATE: "관리자 계정 생성",
  ADMIN_ROLE_CHANGE: "관리자 역할 변경",
  ADMIN_STATUS_CHANGE: "관리자 상태 변경",
  ADMIN_INFO_UPDATE: "관리자 정보 수정",
  ADMIN_PW_RESET: "관리자 비밀번호 초기화",
  ADMIN_DELETE: "관리자 계정 삭제",
  CATEGORY_CREATE: "카테고리 추가",
  CATEGORY_UPDATE: "카테고리 수정",
  CATEGORY_DELETE: "카테고리 삭제",
  MENTOR_CREATE: "멘토 등록",
  MENTOR_UPDATE: "멘토 정보 수정",
  MENTOR_APPROVE: "멘토 승인",
  MENTOR_REJECT: "멘토 반려",
  MENTOR_SUSPEND: "멘토 정지",
  MENTOR_RESUME: "멘토 활동 재개",
  MENTOR_DELETE: "멘토 삭제",
  MENTOR_QNA_ANSWER: "멘토 Q&A 답변 등록",
  MENTOR_QNA_ANSWER_UPDATE: "멘토 Q&A 답변 수정",
  MENTOR_QNA_CLOSE: "멘토 Q&A 질문 종료",
  MENTOR_QNA_DELETE: "멘토 Q&A 삭제",
  STUDY_UPDATE: "스터디 수정",
  STUDY_DELETE: "스터디 삭제",
};

export const mockAuditLogs: AuditLog[] = [
  { id: "log_001", action: "LOGIN", actorNickname: "관리자", actorRole: "ADMIN", targetType: "session", targetId: "sess_001", description: "관리자 로그인", ip: "211.234.xx.xx", createdAt: "2026-03-04T09:00:00Z" },
  { id: "log_002", action: "DOC_APPROVE", actorNickname: "관리자", actorRole: "ADMIN", targetType: "document", targetId: "doc_004", description: "김창업 사업자등록증 승인", ip: "211.234.xx.xx", createdAt: "2026-03-04T09:15:00Z" },
  { id: "log_003", action: "BADGE_GRANT", actorNickname: "관리자", actorRole: "ADMIN", targetType: "profile", targetId: "usr_001", description: "김창업 인증 뱃지 부여", ip: "211.234.xx.xx", createdAt: "2026-03-04T09:16:00Z" },
  { id: "log_004", action: "SIGNUP", actorNickname: "임스튜디오", actorRole: "MEMBER", targetType: "user", targetId: "usr_026", description: "신규 회원가입 (기타/크리에이티브 스튜디오)", ip: "121.165.xx.xx", createdAt: "2026-03-01T10:00:00Z" },
  { id: "log_005", action: "POST_CREATE", actorNickname: "오벤처", actorRole: "MEMBER", targetType: "post", targetId: "post_001", description: "게시물 작성: 2026년 스타트업 투자 트렌드 분석", ip: "175.123.xx.xx", createdAt: "2026-02-28T09:00:00Z" },
  { id: "log_006", action: "COMMENT_REPORT", actorNickname: "김창업", actorRole: "MEMBER", targetType: "comment", targetId: "cmt_006", description: "스팸 댓글 신고", ip: "210.178.xx.xx", createdAt: "2026-02-26T10:00:00Z" },
  { id: "log_007", action: "COMMENT_DELETE", actorNickname: "관리자", actorRole: "ADMIN", targetType: "comment", targetId: "cmt_011", description: "욕설 댓글 삭제 처리", ip: "211.234.xx.xx", createdAt: "2026-02-28T16:00:00Z" },
  { id: "log_008", action: "CAMPAIGN_SEND", actorNickname: "관리자", actorRole: "ADMIN", targetType: "campaign", targetId: "camp_001", description: "캠페인 발송: 3월 네트워킹 데이 초대 (대상: 6명)", ip: "211.234.xx.xx", createdAt: "2026-02-28T10:00:00Z" },
  { id: "log_009", action: "DOC_UPLOAD", actorNickname: "박그린", actorRole: "MEMBER", targetType: "document", targetId: "doc_001", description: "사업자등록증 업로드", ip: "59.12.xx.xx", createdAt: "2026-02-20T10:00:00Z" },
  { id: "log_010", action: "DOC_REJECT", actorNickname: "관리자", actorRole: "ADMIN", targetType: "document", targetId: "doc_009", description: "권시드 사업자등록증 반려 (서류 불선명)", ip: "211.234.xx.xx", createdAt: "2026-02-06T14:00:00Z" },
  { id: "log_011", action: "LOGIN", actorNickname: "이지은AI", actorRole: "MEMBER", targetType: "session", targetId: "sess_105", description: "구글 로그인", ip: "118.235.xx.xx", createdAt: "2026-03-03T08:30:00Z" },
  { id: "log_012", action: "PROFILE_UPDATE", actorNickname: "조프리", actorRole: "MEMBER", targetType: "profile", targetId: "usr_022", description: "프로필 수정: 직책 변경", ip: "222.107.xx.xx", createdAt: "2026-03-02T11:00:00Z" },
  { id: "log_013", action: "BANNER_CREATE", actorNickname: "관리자", actorRole: "ADMIN", targetType: "banner", targetId: "banner_001", description: "배너 등록: 3월 네트워킹 데이 홍보", ip: "211.234.xx.xx", createdAt: "2026-02-28T09:00:00Z" },
  { id: "log_014", action: "SETTINGS_UPDATE", actorNickname: "관리자", actorRole: "ADMIN", targetType: "settings", targetId: "sys_001", description: "서류 자동 파기 기간 변경: 30일 → 60일", ip: "211.234.xx.xx", createdAt: "2026-02-15T10:00:00Z" },
  { id: "log_015", action: "POST_DELETE", actorNickname: "관리자", actorRole: "ADMIN", targetType: "post", targetId: "post_099", description: "스팸 게시물 삭제", ip: "211.234.xx.xx", createdAt: "2026-02-10T09:00:00Z" },
];

// ── Analytics summary data ──

export const monthlyStats = [
  { month: "2025-10", signups: 28, posts: 15, comments: 45, pageViews: 12400 },
  { month: "2025-11", signups: 35, posts: 22, comments: 67, pageViews: 15800 },
  { month: "2025-12", signups: 22, posts: 12, comments: 38, pageViews: 10200 },
  { month: "2026-01", signups: 41, posts: 28, comments: 82, pageViews: 19500 },
  { month: "2026-02", signups: 38, posts: 25, comments: 71, pageViews: 18200 },
  { month: "2026-03", signups: 34, posts: 18, comments: 53, pageViews: 14800 },
];

export const contentPerformance = [
  { category: "인사이트", views: 8420, scraps: 512, ratio: 6.1 },
  { category: "투자정보", views: 5230, scraps: 389, ratio: 7.4 },
  { category: "네트워킹", views: 3100, scraps: 145, ratio: 4.7 },
  { category: "채용공고", views: 2800, scraps: 210, ratio: 7.5 },
  { category: "이벤트", views: 2100, scraps: 98, ratio: 4.7 },
  { category: "공지사항", views: 4500, scraps: 120, ratio: 2.7 },
];

// ── Mentor (멘토 관리) ──

export type MentorStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
export type MentorCategory = "투자/IR" | "경영/전략" | "마케팅/그로스" | "기술/개발" | "법률/세무" | "HR/조직" | "해외진출" | "기타";

export const MENTOR_CATEGORIES: MentorCategory[] = ["투자/IR", "경영/전략", "마케팅/그로스", "기술/개발", "법률/세무", "HR/조직", "해외진출", "기타"];

export interface Mentor {
  id: string;
  userId: string;
  name: string;
  nickname: string;
  email: string;
  phone: string;
  profileImageUrl: string;
  companyName: string;
  companyType: string;
  position: string;
  category: MentorCategory;
  introduction: string;
  career: string;
  expertise: string[];
  availableTime: string;
  lastActiveAt: string;
  status: MentorStatus;
  rejectReason: string;
  adminMemo: string;
  appliedAt: string;
  approvedAt: string;
  createdAt: string;
  updatedAt: string;
}

export const mockMentors: Mentor[] = [
  // APPROVED (4)
  { id: "mentor_001", userId: "usr_001", name: "김민수", nickname: "김창업", email: "minsu.kim@techstart.kr", phone: "010-2345-0001", profileImageUrl: "", companyName: "테크스타트 주식회사", companyType: "스타트업", position: "대표이사", category: "투자/IR", introduction: "시리즈B까지 완료한 스타트업 대표입니다. IR 피칭과 투자유치 전반에 대해 멘토링합니다.", career: "테크스타트 창업 3년, 시리즈B 80억 유치, 전 삼성전자 사업기획", expertise: ["시리즈A", "시리즈B", "IR피칭", "사업계획서"], availableTime: "평일 오후 2-5시", lastActiveAt: "2026-03-10T14:30:00Z", status: "APPROVED", rejectReason: "", adminMemo: "", appliedAt: "2026-01-20T09:00:00Z", approvedAt: "2026-01-22T10:00:00Z", createdAt: "2026-01-20T09:00:00Z", updatedAt: "2026-03-01T09:00:00Z" },
  { id: "mentor_002", userId: "usr_007", name: "오상원", nickname: "오벤처", email: "sangwon.oh@koreainvest.kr", phone: "010-1234-0007", profileImageUrl: "", companyName: "코리아인베스트", companyType: "투자사", position: "파트너", category: "투자/IR", introduction: "VC 10년차 파트너입니다. 초기 스타트업 투자심사와 밸류에이션에 대해 조언합니다.", career: "코리아인베스트 파트너 5년, 전 KB인베스트먼트 심사역", expertise: ["VC투자", "밸류에이션", "초기투자", "딜소싱"], availableTime: "화/목 오전 10-12시", lastActiveAt: "2026-03-08T11:00:00Z", status: "APPROVED", rejectReason: "", adminMemo: "", appliedAt: "2026-01-18T09:00:00Z", approvedAt: "2026-01-19T14:00:00Z", createdAt: "2026-01-18T09:00:00Z", updatedAt: "2026-03-05T09:00:00Z" },
  { id: "mentor_003", userId: "usr_002", name: "이지은", nickname: "이지은AI", email: "jieun.lee@aicore.io", phone: "010-8765-0002", profileImageUrl: "", companyName: "에이아이코어", companyType: "스타트업", position: "CTO", category: "기술/개발", introduction: "AI/ML 기반 스타트업 기술 리딩 경험을 바탕으로 기술 전략과 팀빌딩을 멘토링합니다.", career: "에이아이코어 CTO 2년, 전 네이버 AI Lab 선임연구원", expertise: ["AI/ML", "기술전략", "CTO역할", "팀빌딩"], availableTime: "수/금 오후 3-6시", lastActiveAt: "2026-03-11T16:00:00Z", status: "APPROVED", rejectReason: "", adminMemo: "", appliedAt: "2026-02-01T09:00:00Z", approvedAt: "2026-02-03T11:00:00Z", createdAt: "2026-02-01T09:00:00Z", updatedAt: "2026-03-02T09:00:00Z" },
  { id: "mentor_004", userId: "usr_017", name: "문재현", nickname: "문변호사", email: "jaehyun.moon@lawfirm.kr", phone: "010-5555-0017", profileImageUrl: "", companyName: "법무법인 정의", companyType: "전문직", position: "변호사", category: "법률/세무", introduction: "스타트업 법률 자문 전문 변호사입니다. 주주간계약, 투자계약, 지적재산권 등을 다룹니다.", career: "법무법인 정의 파트너 7년, 스타트업 법률자문 200건+", expertise: ["투자계약", "주주간계약", "지적재산권", "스톡옵션"], availableTime: "월/수 오전 9-11시", lastActiveAt: "2026-02-25T10:00:00Z", status: "APPROVED", rejectReason: "", adminMemo: "", appliedAt: "2026-01-25T09:00:00Z", approvedAt: "2026-01-27T10:00:00Z", createdAt: "2026-01-25T09:00:00Z", updatedAt: "2026-02-28T09:00:00Z" },
  // PENDING (8)
  { id: "mentor_005", userId: "usr_003", name: "박현우", nickname: "박그린", email: "hyunwoo.park@greenlab.kr", phone: "", profileImageUrl: "", companyName: "그린랩", companyType: "스타트업", position: "CMO", category: "마케팅/그로스", introduction: "그로스해킹과 디지털 마케팅 전문가입니다. B2C 스타트업 마케팅 전략을 조언합니다.", career: "그린랩 CMO, 전 쿠팡 마케팅팀", expertise: ["그로스해킹", "퍼포먼스마케팅", "B2C"], availableTime: "평일 오후", lastActiveAt: "", status: "PENDING", rejectReason: "", adminMemo: "마케팅 경력 확인 필요", appliedAt: "2026-03-05T09:00:00Z", approvedAt: "", createdAt: "2026-03-05T09:00:00Z", updatedAt: "2026-03-05T09:00:00Z" },
  { id: "mentor_006", userId: "usr_011", name: "신준혁", nickname: "신넥스트", email: "joonhyuk.shin@nextcap.kr", phone: "010-3333-0011", profileImageUrl: "", companyName: "넥스트캐피탈", companyType: "투자사", position: "대표", category: "경영/전략", introduction: "스타트업 경영 전략과 조직 관리에 대해 멘토링합니다.", career: "넥스트캐피탈 대표 3년, 전 맥킨지 컨설턴트", expertise: ["경영전략", "조직관리", "스케일업"], availableTime: "월/금 오후 2-4시", lastActiveAt: "", status: "PENDING", rejectReason: "", adminMemo: "", appliedAt: "2026-03-08T09:00:00Z", approvedAt: "", createdAt: "2026-03-08T09:00:00Z", updatedAt: "2026-03-08T09:00:00Z" },
  { id: "mentor_007", userId: "usr_015", name: "고하나", nickname: "고코트라", email: "hana.go@kotra.or.kr", phone: "010-7777-0015", profileImageUrl: "", companyName: "KOTRA", companyType: "공공기관", position: "과장", category: "해외진출", introduction: "해외 시장 진출 전략과 수출 지원 제도에 대해 안내합니다.", career: "KOTRA 10년, 해외진출 지원 담당", expertise: ["해외진출", "수출지원", "글로벌전략"], availableTime: "평일 오전", lastActiveAt: "", status: "PENDING", rejectReason: "", adminMemo: "공공기관 소속 확인 필요", appliedAt: "2026-03-10T09:00:00Z", approvedAt: "", createdAt: "2026-03-10T09:00:00Z", updatedAt: "2026-03-10T09:00:00Z" },
  { id: "mentor_009", userId: "usr_020", name: "장서연", nickname: "장세무사", email: "seoyeon.jang@taxpartners.kr", phone: "010-4444-0020", profileImageUrl: "", companyName: "세무법인 파트너스", companyType: "전문직", position: "세무사", category: "법률/세무", introduction: "스타트업 세무·회계 전문 세무사입니다. 법인 설립부터 R&D 세액공제, 스톡옵션 과세까지 상담합니다.", career: "세무법인 파트너스 대표 5년, 전 삼일회계법인", expertise: ["법인세무", "R&D세액공제", "스톡옵션과세", "벤처인증"], availableTime: "화/목 오후 1-4시", lastActiveAt: "", status: "PENDING", rejectReason: "", adminMemo: "세무사 자격증 확인 완료", appliedAt: "2026-03-10T14:00:00Z", approvedAt: "", createdAt: "2026-03-10T14:00:00Z", updatedAt: "2026-03-10T14:00:00Z" },
  { id: "mentor_010", userId: "usr_021", name: "최영진", nickname: "최프로덕트", email: "youngjin.choi@prodlab.io", phone: "010-6666-0021", profileImageUrl: "", companyName: "프로드랩", companyType: "스타트업", position: "CPO", category: "기술/개발", introduction: "B2B SaaS 프로덕트 매니지먼트 7년차입니다. PMF 찾기부터 프로덕트 로드맵 수립까지 멘토링합니다.", career: "프로드랩 CPO 3년, 전 토스 PM, 전 LINE PM", expertise: ["프로덕트전략", "PMF", "B2B SaaS", "로드맵"], availableTime: "수/금 오전 10-12시", lastActiveAt: "", status: "PENDING", rejectReason: "", adminMemo: "", appliedAt: "2026-03-11T09:00:00Z", approvedAt: "", createdAt: "2026-03-11T09:00:00Z", updatedAt: "2026-03-11T09:00:00Z" },
  { id: "mentor_011", userId: "usr_022", name: "윤수빈", nickname: "윤HR", email: "subin.yoon@peopleworks.kr", phone: "010-8888-0022", profileImageUrl: "", companyName: "피플웍스", companyType: "스타트업", position: "CHRO", category: "HR/조직", introduction: "스타트업 초기 조직 설계와 채용 전략 전문가입니다. 50명 이하 조직의 HR 체계 구축을 도와드립니다.", career: "피플웍스 CHRO, 전 우아한형제들 HR팀 리드", expertise: ["채용전략", "조직설계", "HR체계", "보상설계"], availableTime: "월/수 오후 2-5시", lastActiveAt: "", status: "PENDING", rejectReason: "", adminMemo: "경력 레퍼런스 체크 필요", appliedAt: "2026-03-11T11:00:00Z", approvedAt: "", createdAt: "2026-03-11T11:00:00Z", updatedAt: "2026-03-11T11:00:00Z" },
  { id: "mentor_012", userId: "usr_023", name: "임도현", nickname: "임디자인", email: "dohyun.lim@uxcraft.kr", phone: "010-9999-0023", profileImageUrl: "", companyName: "UX크래프트", companyType: "스타트업", position: "디자인 리드", category: "기술/개발", introduction: "UX/UI 디자인 리드 경력 8년입니다. 스타트업 제품 디자인 시스템 구축과 사용자 리서치를 멘토링합니다.", career: "UX크래프트 디자인리드, 전 카카오 UX팀, 전 네이버 디자인센터", expertise: ["UX디자인", "디자인시스템", "사용자리서치", "프로토타이핑"], availableTime: "평일 오후 3-6시", lastActiveAt: "", status: "PENDING", rejectReason: "", adminMemo: "", appliedAt: "2026-03-12T09:00:00Z", approvedAt: "", createdAt: "2026-03-12T09:00:00Z", updatedAt: "2026-03-12T09:00:00Z" },
  { id: "mentor_013", userId: "usr_024", name: "배준호", nickname: "배엔젤", email: "junho.bae@angelbridge.kr", phone: "010-1111-0024", profileImageUrl: "", companyName: "엔젤브릿지", companyType: "투자사", position: "이사", category: "투자/IR", introduction: "엔젤 투자 및 초기 스타트업 투자 심사를 담당하고 있습니다. 시드~프리A 단계 투자유치 전략을 멘토링합니다.", career: "엔젤브릿지 이사 4년, 전 스파크랩 매니저, 개인 엔젤투자 20건+", expertise: ["엔젤투자", "시드라운드", "투자심사", "스타트업밸류에이션"], availableTime: "금요일 오전", lastActiveAt: "", status: "PENDING", rejectReason: "", adminMemo: "투자 이력 검증 중", appliedAt: "2026-03-12T10:30:00Z", approvedAt: "", createdAt: "2026-03-12T10:30:00Z", updatedAt: "2026-03-12T10:30:00Z" },
  // REJECTED (1)
  { id: "mentor_008", userId: "usr_009", name: "권태훈", nickname: "권시드", email: "taehoon.kwon@seedfund.kr", phone: "", profileImageUrl: "", companyName: "시드펀드", companyType: "투자사", position: "심사역", category: "투자/IR", introduction: "초기 투자 심사에 대해 멘토링하고 싶습니다.", career: "시드펀드 심사역 1년", expertise: ["초기투자"], availableTime: "주말", lastActiveAt: "", status: "REJECTED", rejectReason: "탈퇴한 회원으로 멘토 등록이 불가합니다.", adminMemo: "usr_009 탈퇴 회원", appliedAt: "2026-02-15T09:00:00Z", approvedAt: "", createdAt: "2026-02-15T09:00:00Z", updatedAt: "2026-02-17T09:00:00Z" },
];

// ── Mentor Q&A (멘토 질문 관리) ──

export type QuestionStatus = "WAITING" | "ANSWERED" | "CLOSED";

export interface MentorQuestion {
  id: string;
  mentorId: string;
  mentorName: string;
  mentorCategory: MentorCategory;
  askerId: string;
  askerNickname: string;
  askerCompany: string;
  title: string;
  content: string;
  isPublic: boolean;
  answer: string;
  answeredAt: string;
  status: QuestionStatus;
  reportCount: number;
  adminMemo: string;
  createdAt: string;
  updatedAt: string;
}

export const mockMentorQuestions: MentorQuestion[] = [
  // WAITING (4)
  { id: "mq_001", mentorId: "mentor_001", mentorName: "김민수", mentorCategory: "투자/IR", askerId: "usr_005", askerNickname: "정동호", askerCompany: "패스트데브", title: "시리즈A IR 덱 구성 관련 질문", content: "시리즈A 투자유치를 위한 IR 덱 구성에서 가장 중요한 슬라이드 순서와 핵심 포인트가 궁금합니다. 현재 팀/문제/솔루션/시장/비즈니스모델/재무 순서로 구성했는데 피드백 부탁드립니다.", isPublic: true, answer: "", answeredAt: "", status: "WAITING", reportCount: 0, adminMemo: "", createdAt: "2026-03-09T10:00:00Z", updatedAt: "2026-03-09T10:00:00Z" },
  { id: "mq_002", mentorId: "mentor_002", mentorName: "오상원", mentorCategory: "투자/IR", askerId: "usr_006", askerNickname: "한유나", askerCompany: "에듀스파크", title: "Pre-A 밸류에이션 산정 기준", content: "Pre-A 라운드 밸류에이션을 산정할 때 어떤 기준을 주로 보시나요? MAU 5천, MRR 1천만원 수준인데 적정 밸류가 궁금합니다.", isPublic: true, answer: "", answeredAt: "", status: "WAITING", reportCount: 0, adminMemo: "", createdAt: "2026-03-10T09:00:00Z", updatedAt: "2026-03-10T09:00:00Z" },
  { id: "mq_003", mentorId: "mentor_003", mentorName: "이지은", mentorCategory: "기술/개발", askerId: "usr_030", askerNickname: "강민준", askerCompany: "넥스트웨이브", title: "AI 모델 서빙 인프라 선택", content: "현재 PyTorch 모델을 서빙하려고 하는데 TorchServe vs Triton vs 직접 FastAPI로 감싸는 것 중 어떤 걸 추천하시나요? 트래픽은 일 1만 요청 정도입니다.", isPublic: false, answer: "", answeredAt: "", status: "WAITING", reportCount: 0, adminMemo: "", createdAt: "2026-03-10T14:00:00Z", updatedAt: "2026-03-10T14:00:00Z" },
  { id: "mq_004", mentorId: "mentor_004", mentorName: "문재현", mentorCategory: "법률/세무", askerId: "usr_005", askerNickname: "정동호", askerCompany: "패스트데브", title: "공동창업자 간 주주간계약 핵심 조항", content: "3인 공동창업 팀인데 주주간계약서 작성 시 꼭 들어가야 할 핵심 조항이 뭔지 궁금합니다. 특히 베스팅 조건과 퇴사 시 주식 처리에 대해 알고 싶습니다.", isPublic: true, answer: "", answeredAt: "", status: "WAITING", reportCount: 0, adminMemo: "", createdAt: "2026-03-11T09:00:00Z", updatedAt: "2026-03-11T09:00:00Z" },
  // ANSWERED (5)
  { id: "mq_005", mentorId: "mentor_001", mentorName: "김민수", mentorCategory: "투자/IR", askerId: "usr_030", askerNickname: "강민준", askerCompany: "넥스트웨이브", title: "VC 미팅 후 후속 조치 방법", content: "VC 미팅을 가졌는데 긍정적인 반응이었습니다. 후속으로 어떤 자료를 준비하고 어떤 타이밍에 연락하는 게 좋을까요?", isPublic: true, answer: "미팅 후 24시간 이내에 감사 이메일을 보내시고, 미팅에서 논의된 추가 자료(재무 모델, 고객 데이터 등)를 1주 이내에 보내세요. 2주 후에 한 번 팔로업하시고, 그래도 답이 없으면 3주 후 마지막 팔로업을 권장합니다.", answeredAt: "2026-03-02T14:00:00Z", status: "ANSWERED", reportCount: 0, adminMemo: "", createdAt: "2026-03-01T10:00:00Z", updatedAt: "2026-03-02T14:00:00Z" },
  { id: "mq_006", mentorId: "mentor_002", mentorName: "오상원", mentorCategory: "투자/IR", askerId: "usr_001", askerNickname: "김창업", askerCompany: "테크스타트 주식회사", title: "시리즈B 투자사 접근 전략", content: "시리즈A 이후 시리즈B를 준비 중인데, 리드 투자사를 어떻게 접근하는 게 효과적인지 조언 부탁드립니다.", isPublic: true, answer: "시리즈B는 기존 투자사의 소개가 가장 강력합니다. A 라운드 리드 투자사에게 B 라운드 타겟 리스트를 공유하고 인트로를 요청하세요. 동시에 업계 컨퍼런스와 데모데이를 활용하여 자연스러운 접점을 만드세요.", answeredAt: "2026-02-28T11:00:00Z", status: "ANSWERED", reportCount: 0, adminMemo: "", createdAt: "2026-02-25T09:00:00Z", updatedAt: "2026-02-28T11:00:00Z" },
  { id: "mq_007", mentorId: "mentor_003", mentorName: "이지은", mentorCategory: "기술/개발", askerId: "usr_005", askerNickname: "정동호", askerCompany: "패스트데브", title: "CTO 채용 시 기술 면접 팁", content: "스타트업에서 CTO를 뽑으려고 합니다. 기술 면접에서 어떤 질문을 해야 적합한 사람을 찾을 수 있을까요?", isPublic: true, answer: "CTO 면접에서는 코딩 능력보다 아키텍처 설계 능력, 기술 의사결정 경험, 팀 리딩 경험을 중점적으로 봐야 합니다. '이전 프로젝트에서 가장 어려웠던 기술 의사결정은?', '팀 규모가 2배 늘었을 때 개발 프로세스를 어떻게 바꾸셨나요?' 같은 질문을 추천합니다.", answeredAt: "2026-03-04T15:00:00Z", status: "ANSWERED", reportCount: 0, adminMemo: "", createdAt: "2026-03-03T10:00:00Z", updatedAt: "2026-03-04T15:00:00Z" },
  { id: "mq_008", mentorId: "mentor_004", mentorName: "문재현", mentorCategory: "법률/세무", askerId: "usr_006", askerNickname: "한유나", askerCompany: "에듀스파크", title: "스톡옵션 부여 시 주의사항", content: "직원 5명인 스타트업에서 스톡옵션을 부여하려고 합니다. 법적으로 주의해야 할 점과 일반적인 비율이 궁금합니다.", isPublic: true, answer: "상법상 스톡옵션은 주주총회 특별결의가 필요하며, 발행주식총수의 10% 이내여야 합니다. 벤처기업 확인을 받으면 50%까지 가능합니다. 초기 직원에게는 보통 0.5~2% 정도를 부여하며, 4년 베스팅 / 1년 클리프가 일반적입니다.", answeredAt: "2026-02-20T10:00:00Z", status: "ANSWERED", reportCount: 0, adminMemo: "", createdAt: "2026-02-18T09:00:00Z", updatedAt: "2026-02-20T10:00:00Z" },
  { id: "mq_009", mentorId: "mentor_001", mentorName: "김민수", mentorCategory: "투자/IR", askerId: "usr_011", askerNickname: "신넥스트", askerCompany: "넥스트캐피탈", title: "투자심사 시 팀 평가 기준", content: "투자심사를 받을 때 팀 구성에 대한 평가 기준이 궁금합니다. 기술 창업자만으로 이루어진 팀의 약점을 어떻게 보완할 수 있을까요?", isPublic: false, answer: "기술 창업팀은 비즈니스/영업 역량이 약점입니다. 풀타임 합류가 어렵다면 어드바이저 구성, 액셀러레이터 프로그램 참여 등으로 보완 가능합니다. 투자사에게는 '이 약점을 인지하고 있으며 이렇게 해결할 계획'이라고 선제적으로 말씀하시는 게 좋습니다.", answeredAt: "2026-03-06T10:00:00Z", status: "ANSWERED", reportCount: 0, adminMemo: "", createdAt: "2026-03-05T09:00:00Z", updatedAt: "2026-03-06T10:00:00Z" },
  // CLOSED (1)
  { id: "mq_010", mentorId: "mentor_002", mentorName: "오상원", mentorCategory: "투자/IR", askerId: "usr_003", askerNickname: "박그린", askerCompany: "그린랩", title: "투자 유치 실패 후 재도전 시기", content: "투자 유치에 실패했습니다. 얼마나 지나서 다시 도전하는 게 좋을까요?", isPublic: true, answer: "보통 6개월 정도 후에 유의미한 지표 변화(매출 2배, 사용자 3배 등)를 만들고 재도전하시는 걸 권합니다.", answeredAt: "2026-02-10T10:00:00Z", status: "CLOSED", reportCount: 0, adminMemo: "질문자 요청으로 종료", createdAt: "2026-02-05T09:00:00Z", updatedAt: "2026-02-12T09:00:00Z" },
];

// ── Study (스터디 모집 관리) ──

export type StudyStatus = "PENDING" | "RECRUITING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "HIDDEN";
export type StudyCategory = "투자/IR" | "경영/전략" | "마케팅/그로스" | "기술/개발" | "법률/세무" | "창업/사업계획" | "기타";
export type StudyMethod = "ONLINE" | "OFFLINE" | "HYBRID";

export const STUDY_CATEGORIES: StudyCategory[] = ["투자/IR", "경영/전략", "마케팅/그로스", "기술/개발", "법률/세무", "창업/사업계획", "기타"];

export interface Study {
  id: string;
  authorId: string;
  authorNickname: string;
  title: string;
  description: string;
  category: StudyCategory;
  method: StudyMethod;
  location: string;
  maxMembers: number;
  currentMembers: number;
  startDate: string;
  endDate: string;
  recruitEndDate: string;
  schedule: string;
  tags: string[];
  thumbnailUrl: string;
  status: StudyStatus;
  viewCount: number;
  reportCount: number;
  adminMemo: string;
  createdAt: string;
  updatedAt: string;
}

export const mockStudies: Study[] = [
  // PENDING (3) — 고객이 신청한 스터디, 관리자 승인 대기
  { id: "study_p01", authorId: "usr_008", authorNickname: "조은빛", title: "초기 스타트업 세무 실무 스터디", description: "<p>초기 스타트업이 알아야 할 세무 실무(부가세, 법인세, 4대보험 등)를 함께 학습합니다.</p>", category: "법률/세무", method: "ONLINE", location: "", maxMembers: 10, currentMembers: 1, startDate: "2026-04-07", endDate: "2026-05-26", recruitEndDate: "2026-04-04", schedule: "매주 월 20:00-21:30 (Zoom)", tags: ["세무", "법인세", "스타트업"], thumbnailUrl: "", status: "PENDING", viewCount: 0, reportCount: 0, adminMemo: "", createdAt: "2026-03-11T14:00:00Z", updatedAt: "2026-03-11T14:00:00Z" },
  { id: "study_p02", authorId: "usr_014", authorNickname: "백시연", title: "SaaS 프로덕트 그로스 스터디", description: "<p>SaaS 제품의 온보딩, 리텐션, 업셀 전략을 사례 기반으로 분석하는 스터디입니다.</p>", category: "마케팅/그로스", method: "HYBRID", location: "판교 스타트업캠퍼스 / Zoom 병행", maxMembers: 8, currentMembers: 1, startDate: "2026-04-10", endDate: "2026-05-29", recruitEndDate: "2026-04-08", schedule: "매주 목 19:00-21:00", tags: ["SaaS", "그로스", "리텐션"], thumbnailUrl: "", status: "PENDING", viewCount: 0, reportCount: 0, adminMemo: "", createdAt: "2026-03-10T11:30:00Z", updatedAt: "2026-03-10T11:30:00Z" },
  { id: "study_p03", authorId: "usr_022", authorNickname: "임하늘", title: "딥테크 스타트업 투자유치 전략", description: "<p>딥테크(바이오, 소재, 로보틱스 등) 스타트업의 투자유치 전략과 기술 IR 작성법을 다룹니다.</p>", category: "투자/IR", method: "OFFLINE", location: "역삼 팁스타운", maxMembers: 6, currentMembers: 1, startDate: "2026-04-14", endDate: "2026-06-02", recruitEndDate: "2026-04-11", schedule: "격주 월 18:30-20:30", tags: ["딥테크", "투자유치", "기술IR"], thumbnailUrl: "", status: "PENDING", viewCount: 0, reportCount: 0, adminMemo: "", createdAt: "2026-03-09T09:15:00Z", updatedAt: "2026-03-09T09:15:00Z" },
  // RECRUITING (3)
  { id: "study_001", authorId: "usr_005", authorNickname: "정동호", title: "IR 피칭 실전 스터디", description: "<p>시리즈A를 준비하는 스타트업 대표/CFO를 위한 IR 피칭 실전 스터디입니다. 매주 1명씩 IR 덱을 발표하고 피드백을 주고받습니다.</p>", category: "투자/IR", method: "OFFLINE", location: "강남 위워크 선릉점", maxMembers: 8, currentMembers: 5, startDate: "2026-03-17", endDate: "2026-05-05", recruitEndDate: "2026-03-15", schedule: "매주 월 19:00-21:00", tags: ["IR", "투자유치", "피칭"], thumbnailUrl: "", status: "RECRUITING", viewCount: 234, reportCount: 0, adminMemo: "", createdAt: "2026-03-01T09:00:00Z", updatedAt: "2026-03-10T09:00:00Z" },
  { id: "study_002", authorId: "usr_030", authorNickname: "강민준", title: "AI 서비스 기획부터 출시까지", description: "<p>AI 기반 서비스를 기획하고 MVP를 만들어 출시하는 과정을 함께 합니다. 기획자와 개발자 모두 환영합니다.</p>", category: "기술/개발", method: "ONLINE", location: "", maxMembers: 12, currentMembers: 7, startDate: "2026-03-20", endDate: "2026-06-11", recruitEndDate: "2026-03-18", schedule: "매주 목 20:00-22:00 (Zoom)", tags: ["AI", "MVP", "서비스기획"], thumbnailUrl: "", status: "RECRUITING", viewCount: 189, reportCount: 0, adminMemo: "", createdAt: "2026-03-03T09:00:00Z", updatedAt: "2026-03-09T09:00:00Z" },
  { id: "study_003", authorId: "admin", authorNickname: "DidimZip 운영팀", title: "[공식] 스타트업 법률 기초 스터디", description: "<p>DidimZip에서 운영하는 공식 스터디입니다. 스타트업 운영에 필요한 법률 기초 지식을 8주간 학습합니다.</p>", category: "법률/세무", method: "HYBRID", location: "서초 DidimZip 오피스 / Zoom 병행", maxMembers: 20, currentMembers: 12, startDate: "2026-04-01", endDate: "2026-05-27", recruitEndDate: "2026-03-25", schedule: "매주 수 19:00-21:00", tags: ["법률", "스타트업법", "계약서"], thumbnailUrl: "", status: "RECRUITING", viewCount: 412, reportCount: 0, adminMemo: "공식 스터디 — 배너 연동 예정", createdAt: "2026-03-05T09:00:00Z", updatedAt: "2026-03-11T09:00:00Z" },
  // IN_PROGRESS (2)
  { id: "study_004", authorId: "usr_006", authorNickname: "한유나", title: "에듀테크 창업 네트워킹 스터디", description: "<p>교육 분야 스타트업 창업자들의 네트워킹 스터디입니다. 사업 현황 공유와 협업 가능성을 탐색합니다.</p>", category: "창업/사업계획", method: "OFFLINE", location: "성수 카페 스터디룸", maxMembers: 6, currentMembers: 6, startDate: "2026-02-24", endDate: "2026-04-14", recruitEndDate: "2026-02-22", schedule: "격주 월 18:30-20:30", tags: ["에듀테크", "네트워킹", "창업"], thumbnailUrl: "", status: "IN_PROGRESS", viewCount: 156, reportCount: 0, adminMemo: "", createdAt: "2026-02-10T09:00:00Z", updatedAt: "2026-03-03T09:00:00Z" },
  { id: "study_005", authorId: "usr_011", authorNickname: "신넥스트", title: "스타트업 재무모델링 워크숍", description: "<p>재무모델을 처음부터 만들어보는 실습형 스터디입니다. 엑셀 기반으로 매출 예측, 비용 구조, 밸류에이션 모델을 직접 구축합니다.</p>", category: "경영/전략", method: "ONLINE", location: "", maxMembers: 10, currentMembers: 9, startDate: "2026-03-03", endDate: "2026-04-21", recruitEndDate: "2026-03-01", schedule: "매주 월 20:00-22:00 (Zoom)", tags: ["재무모델", "밸류에이션", "엑셀"], thumbnailUrl: "", status: "IN_PROGRESS", viewCount: 298, reportCount: 0, adminMemo: "", createdAt: "2026-02-15T09:00:00Z", updatedAt: "2026-03-07T09:00:00Z" },
  // COMPLETED (2)
  { id: "study_006", authorId: "usr_023", authorNickname: "노시환", title: "마케팅 데이터 분석 스터디", description: "<p>Google Analytics, Amplitude 등 마케팅 분석 도구 활용법을 함께 학습했습니다.</p>", category: "마케팅/그로스", method: "ONLINE", location: "", maxMembers: 15, currentMembers: 13, startDate: "2026-01-06", endDate: "2026-02-24", recruitEndDate: "2026-01-04", schedule: "매주 화 19:00-21:00 (Zoom)", tags: ["GA", "마케팅분석", "데이터"], thumbnailUrl: "", status: "COMPLETED", viewCount: 567, reportCount: 0, adminMemo: "", createdAt: "2025-12-20T09:00:00Z", updatedAt: "2026-02-24T21:00:00Z" },
  { id: "study_007", authorId: "usr_001", authorNickname: "김창업", title: "투자유치 성공사례 분석 스터디", description: "<p>성공적으로 투자를 유치한 스타트업의 사례를 분석하고 시사점을 도출하는 스터디입니다.</p>", category: "투자/IR", method: "HYBRID", location: "강남 스터디카페 / Zoom", maxMembers: 10, currentMembers: 10, startDate: "2025-12-01", endDate: "2026-01-31", recruitEndDate: "2025-11-28", schedule: "격주 금 18:00-20:00", tags: ["투자유치", "사례분석"], thumbnailUrl: "", status: "COMPLETED", viewCount: 423, reportCount: 0, adminMemo: "", createdAt: "2025-11-15T09:00:00Z", updatedAt: "2026-01-31T20:00:00Z" },
  // CANCELLED (1)
  { id: "study_008", authorId: "usr_024", authorNickname: "유보람", title: "콘텐츠 마케팅 실전 스터디", description: "<p>블로그, SNS, 뉴스레터 등 콘텐츠 마케팅 채널을 운영하는 실전 스터디입니다.</p>", category: "마케팅/그로스", method: "ONLINE", location: "", maxMembers: 8, currentMembers: 2, startDate: "2026-03-10", endDate: "2026-04-28", recruitEndDate: "2026-03-08", schedule: "매주 화 20:00-21:30 (Zoom)", tags: ["콘텐츠마케팅", "SNS"], thumbnailUrl: "", status: "CANCELLED", viewCount: 78, reportCount: 0, adminMemo: "최소 인원 미달로 취소", createdAt: "2026-02-20T09:00:00Z", updatedAt: "2026-03-09T09:00:00Z" },
];
