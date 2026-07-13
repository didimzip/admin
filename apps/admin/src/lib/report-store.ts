// 신고 내역 — localStorage 기반 CRUD 스토어

export type ReportTargetType = "CONTENT_COMMENT" | "QNA_QUESTION" | "QNA_ANSWER" | "STUDY_COMMENT";
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
  CONTENT_COMMENT: "콘텐츠 > 댓글",
  QNA_QUESTION:    "멘토 Q&A > 질문글",
  QNA_ANSWER:      "멘토 Q&A > 답글",
  STUDY_COMMENT:   "스터디 > 댓글",
};

// ── Mock 신고 데이터 ──────────────────────────────────────────────────────────

export const mockReports: UserReport[] = [
  // ── 콘텐츠 > 댓글 신고 ──────────────────────────────────────────────────────
  {
    id: "rpt_001",
    reportedUserId: "usr_004",
    reportedUserNickname: "최데이터",
    reporterNickname: "박그린",
    targetType: "CONTENT_COMMENT",
    targetId: "cmt_082",
    targetTitle: "지금 바로 카카오 추가하면 특별 상담 드립니다 ㅎㅎ",
    reason: "SPAM",
    status: "RESOLVED",
    reportedAt: "2026-02-13T09:45:00Z",
    resolvedAt: "2026-02-13T15:00:00Z",
    adminNote: "연락처 유도 스팸 댓글, 삭제 조치",
  },
  {
    id: "rpt_002",
    reportedUserId: "usr_004",
    reportedUserNickname: "최데이터",
    reporterNickname: "정패스트",
    targetType: "CONTENT_COMMENT",
    targetId: "cmt_091",
    targetTitle: "이런 질문은 저한테 하세요~ 제 프로필 DM 주세요",
    reason: "SPAM",
    status: "RESOLVED",
    reportedAt: "2026-02-15T08:10:00Z",
    resolvedAt: "2026-02-15T11:00:00Z",
    adminNote: "연락처 유도 스팸 댓글, 삭제 조치",
  },
  {
    id: "rpt_003",
    reportedUserId: "usr_003",
    reportedUserNickname: "박그린",
    reporterNickname: "한에듀",
    targetType: "CONTENT_COMMENT",
    targetId: "cmt_044",
    targetTitle: "저도 그 경험 있는데 솔직히 그냥 포기하는 게 나아요. 다들 그러잖아요.",
    reason: "ABUSIVE",
    status: "PENDING",
    reportedAt: "2026-02-27T13:22:00Z",
  },
  {
    id: "rpt_004",
    reportedUserId: "usr_008",
    reportedUserNickname: "서블루",
    reporterNickname: "박그린",
    targetType: "CONTENT_COMMENT",
    targetId: "cmt_105",
    targetTitle: "저 연락처 남겨드릴게요, 꼭 연락주세요 투자 논의해봐요",
    reason: "SPAM",
    status: "DISMISSED",
    reportedAt: "2026-02-20T11:30:00Z",
    resolvedAt: "2026-02-21T09:00:00Z",
    adminNote: "진성 멘토링 문의로 판단, 신고 기각",
  },
  {
    id: "rpt_005",
    reportedUserId: "usr_012",
    reportedUserNickname: "양공공",
    reporterNickname: "정패스트",
    targetType: "CONTENT_COMMENT",
    targetId: "cmt_118",
    targetTitle: "아 진짜 이런 글 올리는 사람들 이해 안 됨 ㅋㅋ 수준 봐라",
    reason: "ABUSIVE",
    status: "RESOLVED",
    reportedAt: "2026-03-03T08:55:00Z",
    resolvedAt: "2026-03-03T14:00:00Z",
    adminNote: "비방 댓글 확인, 해당 댓글 숨김 처리 및 경고",
  },
  {
    id: "rpt_006",
    reportedUserId: "usr_004",
    reportedUserNickname: "익명유저",
    reporterNickname: "오벤처",
    targetType: "CONTENT_COMMENT",
    targetId: "cmt_005",
    targetTitle: "광고성 글 아닌가요? 특정 투자사를 홍보하는 것처럼 보입니다.",
    reason: "MISLEADING",
    status: "PENDING",
    reportedAt: "2026-03-08T14:30:00Z",
  },

  // ── 멘토 Q&A > 질문글 신고 ─────────────────────────────────────────────────
  {
    id: "rpt_007",
    reportedUserId: "usr_005",
    reportedUserNickname: "정동호",
    reporterNickname: "이지은AI",
    targetType: "QNA_QUESTION",
    targetId: "mq_001",
    targetTitle: "시리즈A IR 덱 구성 관련 질문 — 허위 투자 사례 인용",
    reason: "MISLEADING",
    reasonDetail: "질문 내용에 실제와 다른 투자 사례를 사실인 양 인용",
    status: "PENDING",
    reportedAt: "2026-03-09T16:00:00Z",
  },
  {
    id: "rpt_008",
    reportedUserId: "usr_030",
    reportedUserNickname: "강민준",
    reporterNickname: "김창업",
    targetType: "QNA_QUESTION",
    targetId: "mq_003",
    targetTitle: "AI 모델 서빙 인프라 선택 — 특정 업체 홍보성 질문",
    reason: "SPAM",
    status: "DISMISSED",
    reportedAt: "2026-03-10T18:00:00Z",
    resolvedAt: "2026-03-11T09:00:00Z",
    adminNote: "기술 질문으로 판단, 홍보 의도 없음. 신고 기각",
  },

  // ── 멘토 Q&A > 답글 신고 ───────────────────────────────────────────────────
  {
    id: "rpt_009",
    reportedUserId: "usr_001",
    reportedUserNickname: "김민수",
    reporterNickname: "오벤처",
    targetType: "QNA_ANSWER",
    targetId: "mq_005",
    targetTitle: "VC 미팅 후 후속 조치 방법 — 답변에 특정 업체 홍보 포함",
    reason: "SPAM",
    status: "RESOLVED",
    reportedAt: "2026-03-02T16:30:00Z",
    resolvedAt: "2026-03-03T09:00:00Z",
    adminNote: "답변 내 특정 업체 언급 확인, 비공개 처리",
  },
  {
    id: "rpt_010",
    reportedUserId: "usr_001",
    reportedUserNickname: "김민수",
    reporterNickname: "최데이터",
    targetType: "QNA_ANSWER",
    targetId: "mq_009",
    targetTitle: "투자심사 시 팀 평가 기준 — 답변: \"솔직히 실력도 없으면서 왜 도전해요\"",
    reason: "ABUSIVE",
    status: "PENDING",
    reportedAt: "2026-03-06T10:05:00Z",
  },
  {
    id: "rpt_011",
    reportedUserId: "usr_003",
    reportedUserNickname: "이지은",
    reporterNickname: "한에듀",
    targetType: "QNA_ANSWER",
    targetId: "mq_007",
    targetTitle: "CTO 채용 시 기술 면접 팁 — 답변에 허위 채용 정보 포함",
    reason: "MISLEADING",
    reasonDetail: "답변에 검증되지 않은 채용 시장 통계를 사실처럼 제시",
    status: "PENDING",
    reportedAt: "2026-03-05T14:20:00Z",
  },
  {
    id: "rpt_012",
    reportedUserId: "usr_007",
    reportedUserNickname: "오상원",
    reporterNickname: "정패스트",
    targetType: "QNA_ANSWER",
    targetId: "mq_006",
    targetTitle: "시리즈B 투자사 접근 전략 — 답변에 자사 서비스 홍보",
    reason: "SPAM",
    status: "RESOLVED",
    reportedAt: "2026-02-28T15:00:00Z",
    resolvedAt: "2026-03-01T10:00:00Z",
    adminNote: "확인 결과 일반적 조언으로 판단, 홍보 의도 없음",
  },

  // ── 스터디 > 댓글 신고 ─────────────────────────────────────────────────────
  {
    id: "rpt_013",
    reportedUserId: "usr_012",
    reportedUserNickname: "양공공",
    reporterNickname: "한에듀",
    targetType: "STUDY_COMMENT",
    targetId: "study_cmt_001",
    targetTitle: "왜 이런 것도 모르세요? 기본도 없는 분이 여기 왜 오세요",
    reason: "ABUSIVE",
    status: "PENDING",
    reportedAt: "2026-03-05T10:20:00Z",
  },
  {
    id: "rpt_014",
    reportedUserId: "usr_004",
    reportedUserNickname: "최데이터",
    reporterNickname: "김창업",
    targetType: "STUDY_COMMENT",
    targetId: "study_cmt_002",
    targetTitle: "이 스터디 별로예요, 제가 운영하는 스터디로 오세요~ DM 주세요",
    reason: "SPAM",
    status: "RESOLVED",
    reportedAt: "2026-02-22T11:00:00Z",
    resolvedAt: "2026-02-23T09:00:00Z",
    adminNote: "타 스터디 홍보 스팸 댓글, 삭제 조치",
  },
  {
    id: "rpt_015",
    reportedUserId: "usr_008",
    reportedUserNickname: "서블루",
    reporterNickname: "이지은AI",
    targetType: "STUDY_COMMENT",
    targetId: "study_cmt_003",
    targetTitle: "이 스터디 운영자 실력 없어요. 시간 낭비입니다.",
    reason: "INAPPROPRIATE",
    reasonDetail: "근거 없는 비방으로 스터디 운영에 피해",
    status: "DISMISSED",
    reportedAt: "2026-02-18T16:40:00Z",
    resolvedAt: "2026-02-19T11:00:00Z",
    adminNote: "개인 의견 표현 범위로 판단, 기각",
  },
];

// ── localStorage CRUD ─────────────────────────────────────────────────────────

const STORAGE_KEY = "didimzip_admin_reports";

function loadAll(): UserReport[] {
  if (typeof window === "undefined") return mockReports;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && raw !== "[]") {
      const stored = JSON.parse(raw) as UserReport[];
      const storedIds = new Set(stored.map((r) => r.id));
      const missing = mockReports.filter((r) => !storedIds.has(r.id));
      if (missing.length > 0) {
        const merged = [...stored, ...missing];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        return merged;
      }
      return stored;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockReports));
    return [...mockReports];
  } catch {
    return mockReports;
  }
}

function saveAll(reports: UserReport[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

export function getAllReports(): UserReport[] {
  return loadAll();
}

export function updateReport(id: string, patch: Partial<UserReport>): void {
  const reports = loadAll();
  saveAll(reports.map((r) => (r.id === id ? { ...r, ...patch } : r)));
}

export function getReportsByUserId(userId: string): UserReport[] {
  return loadAll().filter((r) => r.reportedUserId === userId);
}

/** localStorage를 mock 초기값으로 완전 리셋 */
export function resetReports(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
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
