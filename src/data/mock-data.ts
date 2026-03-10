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
export type CampaignChannel = "EMAIL" | "ALIMTALK" | "PUSH";

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
  { id: "camp_003", title: "정부 지원사업 안내 알림", channel: "ALIMTALK", status: "SENT", targetFilter: { companyType: "스타트업", jobCategory: "IT/소프트웨어" }, targetCount: 4, sentCount: 4, openRate: 75.0, scheduledAt: null, sentAt: "2026-02-20T11:00:00Z", createdAt: "2026-02-19T16:00:00Z" },
  { id: "camp_004", title: "4월 스타트업 밋업 사전 안내", channel: "EMAIL", status: "SCHEDULED", targetFilter: {}, targetCount: 26, sentCount: 0, openRate: 0, scheduledAt: "2026-03-15T09:00:00Z", sentAt: null, createdAt: "2026-03-01T10:00:00Z" },
  { id: "camp_005", title: "전문직 네트워크 뉴스레터 Vol.3", channel: "EMAIL", status: "DRAFT", targetFilter: { companyType: "전문직" }, targetCount: 5, sentCount: 0, openRate: 0, scheduledAt: null, sentAt: null, createdAt: "2026-03-02T14:00:00Z" },
  { id: "camp_006", title: "세무 상담 서비스 오픈 알림", channel: "ALIMTALK", status: "SENT", targetFilter: { jobCategory: "회계/세무" }, targetCount: 2, sentCount: 2, openRate: 50.0, scheduledAt: null, sentAt: "2026-02-15T10:00:00Z", createdAt: "2026-02-14T09:00:00Z" },
  { id: "camp_007", title: "공공기관 협력 프로그램 안내", channel: "EMAIL", status: "CANCELLED", targetFilter: { companyType: "공공기관" }, targetCount: 5, sentCount: 0, openRate: 0, scheduledAt: "2026-02-10T09:00:00Z", sentAt: null, createdAt: "2026-02-08T11:00:00Z" },
];

// ── Banners ──

export type BannerPosition = "HOME_TOP" | "HOME_SIDE" | "POST_BOTTOM" | "LOGIN_PAGE";

export interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  position: BannerPosition;
  isActive: boolean;
  startDate: string;
  endDate: string;
  clickCount: number;
  impressionCount: number;
  createdAt: string;
}

export const BANNER_POSITIONS: Record<BannerPosition, string> = {
  HOME_TOP: "홈 상단",
  HOME_SIDE: "홈 사이드바",
  POST_BOTTOM: "게시물 하단",
  LOGIN_PAGE: "로그인 페이지",
};

export const mockBanners: Banner[] = [
  { id: "banner_001", title: "3월 네트워킹 데이 홍보", imageUrl: "/banners/networking.png", linkUrl: "/posts/post_004", position: "HOME_TOP", isActive: true, startDate: "2026-03-01", endDate: "2026-03-10", clickCount: 342, impressionCount: 5120, createdAt: "2026-02-28T09:00:00Z" },
  { id: "banner_002", title: "프리미엄 멤버십 안내", imageUrl: "/banners/premium.png", linkUrl: "/membership", position: "HOME_SIDE", isActive: true, startDate: "2026-02-01", endDate: "2026-04-30", clickCount: 128, impressionCount: 3200, createdAt: "2026-01-30T14:00:00Z" },
  { id: "banner_003", title: "정부 지원사업 모집", imageUrl: "/banners/gov.png", linkUrl: "https://example.com/gov", position: "POST_BOTTOM", isActive: true, startDate: "2026-02-15", endDate: "2026-03-15", clickCount: 87, impressionCount: 1890, createdAt: "2026-02-14T10:00:00Z" },
  { id: "banner_004", title: "서비스 가입 유도 배너", imageUrl: "/banners/signup.png", linkUrl: "/signup", position: "LOGIN_PAGE", isActive: true, startDate: "2026-01-01", endDate: "2026-12-31", clickCount: 521, impressionCount: 8900, createdAt: "2025-12-28T09:00:00Z" },
  { id: "banner_005", title: "설 연휴 이벤트 (종료)", imageUrl: "/banners/newyear.png", linkUrl: "/events/newyear", position: "HOME_TOP", isActive: false, startDate: "2026-01-25", endDate: "2026-02-05", clickCount: 245, impressionCount: 4100, createdAt: "2026-01-20T11:00:00Z" },
  { id: "banner_006", title: "투자 세미나 광고 (종료)", imageUrl: "/banners/seminar.png", linkUrl: "/events/seminar", position: "HOME_SIDE", isActive: false, startDate: "2026-02-01", endDate: "2026-02-20", clickCount: 67, impressionCount: 1200, createdAt: "2026-01-28T15:00:00Z" },
];

// ── Audit Logs ──

export type AuditAction = "LOGIN" | "LOGOUT" | "SIGNUP" | "PROFILE_UPDATE" | "DOC_UPLOAD" | "DOC_APPROVE" | "DOC_REJECT" | "POST_CREATE" | "POST_UPDATE" | "POST_DELETE" | "COMMENT_CREATE" | "COMMENT_REPORT" | "COMMENT_DELETE" | "BADGE_GRANT" | "BADGE_REVOKE" | "CAMPAIGN_SEND" | "BANNER_CREATE" | "SETTINGS_UPDATE" | "USER_SUSPEND" | "USER_ACTIVATE" | "USER_WITHDRAW" | "REPORT_RESOLVE" | "REPORT_DISMISS" | "REPORT_REVIEW" | "ADMIN_CREATE" | "ADMIN_ROLE_CHANGE" | "ADMIN_STATUS_CHANGE" | "ADMIN_INFO_UPDATE" | "ADMIN_PW_RESET" | "ADMIN_DELETE" | "CATEGORY_CREATE" | "CATEGORY_UPDATE" | "CATEGORY_DELETE";

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
