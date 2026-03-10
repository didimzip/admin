// 신고 내역 목(Mock) 데이터 및 조회 스토어

export type ReportTargetType = "COMMENT" | "POST" | "QNA";
export type ReportStatus = "PENDING" | "RESOLVED" | "DISMISSED";
export type ReportReason = "SPAM" | "ABUSIVE" | "INAPPROPRIATE" | "MISLEADING" | "OTHER";

export interface UserReport {
  id: string;
  reportedUserId: string;           // 신고 당한 회원 id
  reportedUserNickname: string;     // 신고 당한 회원 닉네임 (표시용)
  reporterNickname: string;         // 신고한 회원 닉네임
  targetType: ReportTargetType;     // 신고 대상 유형
  targetId: string;                 // 신고 대상 콘텐츠 id
  targetTitle: string;              // 신고 대상 내용 요약 (표시용)
  reason: ReportReason;
  reasonDetail?: string;            // 기타 사유 상세
  status: ReportStatus;
  reportedAt: string;
  resolvedAt?: string;
  adminNote?: string;
}

export const REPORT_REASON_LABEL: Record<ReportReason, string> = {
  SPAM:          "스팸/광고",
  ABUSIVE:       "욕설/비방",
  INAPPROPRIATE: "부적절한 콘텐츠",
  MISLEADING:    "허위/오해 유발",
  OTHER:         "기타",
};

export const REPORT_TARGET_LABEL: Record<ReportTargetType, string> = {
  COMMENT: "댓글",
  POST:    "멘토링 게시글",
  QNA:     "Q&A 질문",
};

// ── Mock 신고 데이터 ──────────────────────────────────────────────────────────

export const mockReports: UserReport[] = [
  // ── usr_004 (최데이터) — 스팸 다수 ─────────────────────────────────────────
  {
    id: "rpt_001",
    reportedUserId: "usr_004",
    reportedUserNickname: "최데이터",
    reporterNickname: "김창업",
    targetType: "POST",
    targetId: "post_031",
    targetTitle: "투자 확정! 지금 바로 연락주세요 — 수익 보장 멘토링 모집",
    reason: "SPAM",
    status: "RESOLVED",
    reportedAt: "2026-02-10T11:20:00Z",
    resolvedAt: "2026-02-11T09:00:00Z",
    adminNote: "스팸성 게시글 확인, 해당 게시글 삭제 조치",
  },
  {
    id: "rpt_002",
    reportedUserId: "usr_004",
    reportedUserNickname: "최데이터",
    reporterNickname: "이지은AI",
    targetType: "POST",
    targetId: "post_035",
    targetTitle: "무조건 투자 받는 법! 비법 공유합니다 (링크 클릭)",
    reason: "SPAM",
    status: "RESOLVED",
    reportedAt: "2026-02-12T14:05:00Z",
    resolvedAt: "2026-02-13T10:30:00Z",
    adminNote: "외부 링크 유도 스팸 게시글, 삭제 및 경고",
  },
  {
    id: "rpt_003",
    reportedUserId: "usr_004",
    reportedUserNickname: "최데이터",
    reporterNickname: "박그린",
    targetType: "COMMENT",
    targetId: "cmt_082",
    targetTitle: "지금 바로 카카오 추가하면 특별 상담 드립니다 ㅎㅎ",
    reason: "SPAM",
    status: "RESOLVED",
    reportedAt: "2026-02-13T09:45:00Z",
    resolvedAt: "2026-02-13T15:00:00Z",
    adminNote: "연락처 유도 스팸 댓글, 삭제 조치",
  },
  {
    id: "rpt_004",
    reportedUserId: "usr_004",
    reportedUserNickname: "최데이터",
    reporterNickname: "오벤처",
    targetType: "QNA",
    targetId: "qna_019",
    targetTitle: "스타트업 IR 자료 어디서 구하나요? (전문 업체 소개해드려요)",
    reason: "SPAM",
    status: "RESOLVED",
    reportedAt: "2026-02-14T16:30:00Z",
    resolvedAt: "2026-02-15T09:00:00Z",
    adminNote: "Q&A를 광고 채널로 악용, 계정 정지 처리",
  },
  {
    id: "rpt_005",
    reportedUserId: "usr_004",
    reportedUserNickname: "최데이터",
    reporterNickname: "정패스트",
    targetType: "COMMENT",
    targetId: "cmt_091",
    targetTitle: "이런 질문은 저한테 하세요~ 제 프로필 DM 주세요",
    reason: "SPAM",
    status: "RESOLVED",
    reportedAt: "2026-02-15T08:10:00Z",
    resolvedAt: "2026-02-15T11:00:00Z",
    adminNote: "연락처 유도 스팸 댓글, 삭제 조치",
  },

  // ── usr_003 (박그린) — 신고 접수 중 ──────────────────────────────────────
  {
    id: "rpt_006",
    reportedUserId: "usr_003",
    reportedUserNickname: "박그린",
    reporterNickname: "한에듀",
    targetType: "COMMENT",
    targetId: "cmt_044",
    targetTitle: "저도 그 경험 있는데 솔직히 그냥 포기하는 게 나아요. 다들 그러잖아요.",
    reason: "ABUSIVE",
    status: "PENDING",
    reportedAt: "2026-02-27T13:22:00Z",
  },
  {
    id: "rpt_007",
    reportedUserId: "usr_003",
    reportedUserNickname: "박그린",
    reporterNickname: "최데이터",
    targetType: "QNA",
    targetId: "qna_033",
    targetTitle: "이 분야 진출 고민인데요 — 답변: \"솔직히 실력도 없으면서 왜 도전해요\"",
    reason: "ABUSIVE",
    status: "PENDING",
    reportedAt: "2026-02-28T10:05:00Z",
  },
  {
    id: "rpt_008",
    reportedUserId: "usr_003",
    reportedUserNickname: "박그린",
    reporterNickname: "김창업",
    targetType: "POST",
    targetId: "post_058",
    targetTitle: "AI 스타트업 실패 사례 분석 (특정 회사 이름 거론)",
    reason: "INAPPROPRIATE",
    reasonDetail: "실명 및 회사명을 허락 없이 거론하여 명예훼손 우려",
    status: "DISMISSED",
    reportedAt: "2026-02-25T09:40:00Z",
    resolvedAt: "2026-02-26T11:00:00Z",
    adminNote: "공개된 정보 기반 분석으로 판단, 신고 기각",
  },

  // ── usr_008 (서블루) — 허위 정보 신고 ────────────────────────────────────
  {
    id: "rpt_009",
    reportedUserId: "usr_008",
    reportedUserNickname: "서블루",
    reporterNickname: "이지은AI",
    targetType: "POST",
    targetId: "post_072",
    targetTitle: "Series A 투자 받는 팁 — 저희 심사 기준 공개합니다",
    reason: "MISLEADING",
    reasonDetail: "실제 심사 기준과 다른 허위 정보를 마치 사실인 양 게재",
    status: "PENDING",
    reportedAt: "2026-03-01T15:10:00Z",
  },
  {
    id: "rpt_010",
    reportedUserId: "usr_008",
    reportedUserNickname: "서블루",
    reporterNickname: "박그린",
    targetType: "COMMENT",
    targetId: "cmt_105",
    targetTitle: "저 연락처 남겨드릴게요, 꼭 연락주세요 투자 논의해봐요",
    reason: "SPAM",
    status: "DISMISSED",
    reportedAt: "2026-02-20T11:30:00Z",
    resolvedAt: "2026-02-21T09:00:00Z",
    adminNote: "진성 멘토링 문의로 판단, 신고 기각",
  },

  // ── usr_012 (양공공) — 욕설 신고 ──────────────────────────────────────────
  {
    id: "rpt_011",
    reportedUserId: "usr_012",
    reportedUserNickname: "양공공",
    reporterNickname: "정패스트",
    targetType: "COMMENT",
    targetId: "cmt_118",
    targetTitle: "아 진짜 이런 글 올리는 사람들 이해 안 됨 ㅋㅋ 수준 봐라",
    reason: "ABUSIVE",
    status: "RESOLVED",
    reportedAt: "2026-03-03T08:55:00Z",
    resolvedAt: "2026-03-03T14:00:00Z",
    adminNote: "비방 댓글 확인, 해당 댓글 숨김 처리 및 경고",
  },
  {
    id: "rpt_012",
    reportedUserId: "usr_012",
    reportedUserNickname: "양공공",
    reporterNickname: "한에듀",
    targetType: "QNA",
    targetId: "qna_041",
    targetTitle: "왜 이런 것도 모르세요? 기본도 없는 분이 여기 왜 오세요",
    reason: "ABUSIVE",
    status: "PENDING",
    reportedAt: "2026-03-05T10:20:00Z",
  },
];

// ── 공개 API ──────────────────────────────────────────────────────────────────

export function getReportsByUserId(userId: string): UserReport[] {
  return mockReports.filter((r) => r.reportedUserId === userId);
}

export function getReportSummary(userId: string): {
  total: number;
  pending: number;
  resolved: number;
  dismissed: number;
} {
  const reports = getReportsByUserId(userId);
  return {
    total:     reports.length,
    pending:   reports.filter((r) => r.status === "PENDING").length,
    resolved:  reports.filter((r) => r.status === "RESOLVED").length,
    dismissed: reports.filter((r) => r.status === "DISMISSED").length,
  };
}
