"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  Flag,
  RotateCcw,
  X,
  FileText,
  MessageSquare,
  ExternalLink,
  CheckCircle2,
  XCircle,
  BookOpen,
  HelpCircle,
  MoreHorizontal,
} from "lucide-react";
import { useToast } from "@/lib/toast-context";
import { recordLog } from "@/lib/audit-log-store";
import { Input } from "@/components/ui/input";
import { PaginationBar, CountDisplay } from "@/components/ui/pagination-bar";
import { cn } from "@/lib/utils";
import {
  getAllReports,
  updateReport,
  resetReports,
  REPORT_REASON_LABEL,
  REPORT_TARGET_LABEL,
  type UserReport,
  type ReportStatus,
  type ReportTargetType,
} from "@/lib/report-store";
import {
  getAllComments,
  updateCommentStatus,
} from "@/lib/comment-store";
import { getQuestion, upsertQuestion } from "@/lib/mentor-qna-store";
import type { Comment, CommentStatus, MentorQuestion } from "@/data/mock-data";

// ─── 타입 & 설정 ──────────────────────────────────────────────────────────────

type FilterStatus = "ALL" | ReportStatus;
const STATUS_CONFIG: Record<ReportStatus, { label: string; chip: string }> = {
  PENDING:   { label: "검토중",   chip: "bg-amber-100 text-amber-700" },
  RESOLVED:  { label: "조치완료", chip: "bg-green-100 text-green-700" },
  DISMISSED: { label: "기각",     chip: "bg-slate-100 text-slate-500" },
};

const TARGET_ICON: Record<ReportTargetType, typeof MessageSquare> = {
  CONTENT_COMMENT: FileText,
  QNA_QUESTION:    HelpCircle,
  QNA_ANSWER:      HelpCircle,
  STUDY_COMMENT:   BookOpen,
};

// 테이블용 한 줄 라벨
const TARGET_SHORT: Record<ReportTargetType, string> = {
  CONTENT_COMMENT: "콘텐츠 · 댓글",
  QNA_QUESTION:    "Q&A · 질문글",
  QNA_ANSWER:      "Q&A · 답글",
  STUDY_COMMENT:   "스터디 · 댓글",
};

// ─── 메인 페이지 ──────────────────────────────────────────────────────────────

export default function CommentsPage() {
  const { showToast } = useToast();

  // ── 신고 데이터 ──
  const [reports, setReports] = useState<UserReport[]>(() => getAllReports());
  const [filterStatus, setFilterStatus] = useState<FilterStatus>(() => {
    const all = getAllReports();
    return all.some((r) => r.status === "PENDING") ? "PENDING" : "ALL";
  });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // ── 슬라이드 패널 ──
  const [selectedReport, setSelectedReport] = useState<UserReport | null>(null);
  const [linkedComment, setLinkedComment] = useState<Comment | null>(null);
  const [linkedQuestion, setLinkedQuestion] = useState<MentorQuestion | null>(null);
  const [memoDraft, setMemoDraft] = useState("");
  // 숨김/비공개 임시 상태 (조치완료 시 실제 저장)
  const [pendingHideComment, setPendingHideComment] = useState(false);
  const [pendingHideQna, setPendingHideQna] = useState(false);
  const [memoError, setMemoError] = useState(false);

  // ── 설정 드롭다운 ──
  const [showMenu, setShowMenu] = useState(false);

  const reload = useCallback(() => {
    const updated = getAllReports();
    setReports(updated);
    if (filterStatus === "PENDING" && !updated.some((r) => r.status === "PENDING")) {
      setFilterStatus("ALL");
    }
  }, [filterStatus]);

  const reloadLinkedComment = useCallback((targetId: string) => {
    const all = getAllComments();
    setLinkedComment(all.find((c) => c.id === targetId) ?? null);
  }, []);

  const reloadLinkedQuestion = useCallback((targetId: string) => {
    setLinkedQuestion(getQuestion(targetId) ?? null);
  }, []);

  // Escape 키로 패널 닫기
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedReport) setSelectedReport(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedReport]);

  // ── 액션 핸들러 ──────────────────────────────────────────────────────────────

  function handleOpenReport(report: UserReport) {
    setSelectedReport(report);
    setMemoDraft(report.adminNote ?? "");
    setPendingHideComment(false);
    setPendingHideQna(false);
    setMemoError(false);

    // 유형별 연동 콘텐츠 조회
    if (report.targetType === "CONTENT_COMMENT") {
      reloadLinkedComment(report.targetId);
      setLinkedQuestion(null);
    } else if (report.targetType === "QNA_QUESTION" || report.targetType === "QNA_ANSWER") {
      reloadLinkedQuestion(report.targetId);
      setLinkedComment(null);
    } else {
      setLinkedComment(null);
      setLinkedQuestion(null);
    }
  }

  function advanceToNextPending(currentId: string) {
    const pendingReports = getAllReports().filter((r) => r.status === "PENDING" && r.id !== currentId);
    if (pendingReports.length > 0) {
      handleOpenReport(pendingReports[0]);
      showToast("다음 검토 대기 건으로 이동합니다.");
    } else {
      setSelectedReport(null);
      showToast("모든 신고가 처리되었습니다.");
    }
  }

  function handleChangeStatus(id: string, status: ReportStatus) {
    const report = reports.find((r) => r.id === id);
    if (!report) return;

    const patch: Partial<UserReport> = { status };
    if (status !== "PENDING") {
      patch.resolvedAt = new Date().toISOString();
    }

    updateReport(id, patch);
    reload();

    const updated = { ...report, ...patch };
    if (selectedReport?.id === id) setSelectedReport(updated);

    const targetLabel = REPORT_TARGET_LABEL[report.targetType];
    if (status === "RESOLVED") {
      recordLog("REPORT_RESOLVE", `${report.reportedUserNickname} 신고 조치완료 (${targetLabel}: ${report.targetTitle.slice(0, 20)}...)`, { targetType: report.targetType.toLowerCase(), targetId: report.targetId });
    } else if (status === "DISMISSED") {
      recordLog("REPORT_DISMISS", `${report.reportedUserNickname} 신고 기각 (${REPORT_REASON_LABEL[report.reason]})`, { targetType: report.targetType.toLowerCase(), targetId: report.targetId });
    } else if (status === "PENDING") {
      recordLog("REPORT_REVIEW", `${report.reportedUserNickname} 신고 재검토`, { targetType: report.targetType.toLowerCase(), targetId: report.targetId });
    }

    const msgs: Record<ReportStatus, string> = {
      PENDING:   "신고가 재검토 상태로 변경되었습니다.",
      RESOLVED:  "신고가 조치 완료 처리되었습니다.",
      DISMISSED: "신고가 기각 처리되었습니다.",
    };
    showToast(msgs[status]);

    if (status === "RESOLVED" || status === "DISMISSED") {
      // 조치완료/기각 후 다음 PENDING 건으로 자동 이동
      setTimeout(() => advanceToNextPending(id), 600);
    } else if (status === "PENDING") {
      // 재검토: 임시 상태 초기화 + linked 데이터 리로드
      setPendingHideComment(false);
      setPendingHideQna(false);
      setMemoError(false);
      setMemoDraft(updated.adminNote ?? "");
      if (report.targetType === "CONTENT_COMMENT") {
        reloadLinkedComment(report.targetId);
      } else if (report.targetType === "QNA_QUESTION" || report.targetType === "QNA_ANSWER") {
        reloadLinkedQuestion(report.targetId);
      }
    }
  }

  function handleUpdateNote(id: string, note: string) {
    updateReport(id, { adminNote: note });
    reload();
    const updated = reports.find((r) => r.id === id);
    if (updated && selectedReport?.id === id) {
      setSelectedReport({ ...updated, adminNote: note });
    }
  }

  function handleCommentAction(commentId: string, status: CommentStatus) {
    updateCommentStatus(commentId, status);
    reloadLinkedComment(commentId);
    if (status === "HIDDEN") {
      showToast("댓글이 숨김 처리되었습니다.");
      recordLog("COMMENT_HIDE", `댓글 숨김 처리: ${commentId}`, { targetType: "comment", targetId: commentId });
    } else if (status === "ACTIVE") {
      showToast("댓글이 복원되었습니다.");
      recordLog("COMMENT_RESTORE", `댓글 복원: ${commentId}`, { targetType: "comment", targetId: commentId });
    }
  }

  function handleQnaPublicToggle(question: MentorQuestion) {
    const newIsPublic = !question.isPublic;
    upsertQuestion({ ...question, isPublic: newIsPublic });
    reloadLinkedQuestion(question.id);
    if (newIsPublic) {
      showToast("Q&A가 공개 처리되었습니다.");
      recordLog("REPORT_RESOLVE", `Q&A 공개 복원: ${question.title.slice(0, 20)}...`, { targetType: "qna", targetId: question.id });
    } else {
      showToast("Q&A가 비공개 처리되었습니다.");
      recordLog("REPORT_RESOLVE", `Q&A 비공개 처리: ${question.title.slice(0, 20)}...`, { targetType: "qna", targetId: question.id });
    }
  }

  // ── 집계 & 필터 ──────────────────────────────────────────────────────────────

  const counts = useMemo(() => ({
    total:     reports.length,
    pending:   reports.filter((r) => r.status === "PENDING").length,
    resolved:  reports.filter((r) => r.status === "RESOLVED").length,
    dismissed: reports.filter((r) => r.status === "DISMISSED").length,
  }), [reports]);

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      if (filterStatus !== "ALL" && r.status !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          r.targetTitle.toLowerCase().includes(q) ||
          r.reporterNickname.toLowerCase().includes(q) ||
          r.reportedUserNickname.toLowerCase().includes(q) ||
          REPORT_REASON_LABEL[r.reason].toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [reports, filterStatus, search]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  // ── 렌더 ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* ── 페이지 헤더 ── */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">신고 관리</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            접수된 신고를 처리하고 콘텐츠를 관리합니다.
          </p>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                <button
                  onClick={() => {
                    resetReports();
                    reload();
                    setShowMenu(false);
                    showToast("데이터가 초기화되었습니다.");
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> 데이터 초기화
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── 요약 카드 3개 ── */}
      <div className="grid grid-cols-3 gap-3">
        {([
          { key: "PENDING" as const,   label: "검토중",   icon: Flag,         color: "amber",  count: counts.pending },
          { key: "RESOLVED" as const,  label: "조치완료", icon: CheckCircle2, color: "green",  count: counts.resolved },
          { key: "DISMISSED" as const, label: "기각",     icon: XCircle,      color: "slate",  count: counts.dismissed },
        ]).map(({ key, label, icon: Icon, color, count }) => (
          <button
            key={key}
            onClick={() => { setFilterStatus(filterStatus === key ? "ALL" : key); setPage(1); }}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl border bg-white px-4 py-3.5 text-left transition-all hover:shadow-md",
              filterStatus === key
                ? "border-indigo-400 ring-2 ring-indigo-200"
                : "border-slate-200 hover:border-slate-300"
            )}
          >
            <div className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              color === "amber" ? "bg-amber-100" : color === "green" ? "bg-green-100" : "bg-slate-100"
            )}>
              <Icon className={cn(
                "h-5 w-5",
                color === "amber" ? "text-amber-600" : color === "green" ? "text-green-600" : "text-slate-400"
              )} />
            </div>
            <div>
              <p className="text-xs text-slate-500">{label}</p>
              <p className="text-lg font-bold text-slate-900 tabular-nums">{count}</p>
            </div>
            {key === "PENDING" && count > 0 && (
              <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-red-500" />
            )}
          </button>
        ))}
      </div>

      {/* ── 필터 바 ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {(["ALL", "PENDING", "RESOLVED", "DISMISSED"] as FilterStatus[]).map((s) => {
            const countMap: Record<string, number> = { ALL: counts.total, PENDING: counts.pending, RESOLVED: counts.resolved, DISMISSED: counts.dismissed };
            const labelMap: Record<string, string> = { ALL: "전체", PENDING: "검토중", RESOLVED: "조치완료", DISMISSED: "기각" };
            return (
              <button
                key={s}
                onClick={() => { setFilterStatus(s); setPage(1); }}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  filterStatus === s ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-700"
                )}
              >
                {labelMap[s]}
                {s === "PENDING" && countMap.PENDING > 0 ? (
                  <span className="ml-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white">
                    {countMap.PENDING}
                  </span>
                ) : (
                  <span className={cn("ml-1 tabular-nums", filterStatus === s ? "text-indigo-200" : "text-slate-400")}>
                    {countMap[s]}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <Input
          className="ml-auto h-9 w-64 text-sm"
          placeholder="내용/신고자/피신고자 검색..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {/* ── 신고 테이블 ── */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <h3 className="text-sm font-semibold text-slate-800">신고 목록</h3>
            <CountDisplay total={filtered.length} />
          </div>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            className="h-7 cursor-pointer rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-600 hover:border-slate-300 focus:outline-none"
          >
            <option value={10}>10개씩</option>
            <option value={20}>20개씩</option>
            <option value={50}>50개씩</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[740px] table-fixed text-sm">
            <colgroup>
              <col className="w-[80px]" />
              <col className="w-[90px]" />
              <col />
              <col className="w-[90px]" />
              <col className="w-[110px]" />
              <col className="w-[110px]" />
            </colgroup>
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">상태</th>
                <th className="px-3 py-3 text-xs font-semibold text-slate-500">유형</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">신고 대상</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">피신고자</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">신고 사유</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">신고일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-sm text-slate-400">
                    <Flag className="mx-auto mb-3 h-10 w-10 opacity-20" />
                    {filterStatus === "PENDING" ? "처리 대기 중인 신고가 없습니다." : "검색 결과가 없습니다."}
                  </td>
                </tr>
              ) : (
                paginated.map((report) => {
                  const sc = STATUS_CONFIG[report.status];
                  const ts = TARGET_SHORT[report.targetType] ?? "기타";
                  const isSelected = selectedReport?.id === report.id;
                  return (
                    <tr
                      key={report.id}
                      onClick={() => handleOpenReport(report)}
                      className={cn(
                        "cursor-pointer transition-colors",
                        isSelected ? "bg-indigo-50" : "hover:bg-slate-50"
                      )}
                    >
                      <td className="px-4 py-3.5">
                        <span className={cn("inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium", sc.chip)}>
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                        {ts}
                      </td>
                      <td className="overflow-hidden px-4 py-3.5">
                        <p className="line-clamp-1 text-sm text-slate-700">{report.targetTitle}</p>
                      </td>
                      <td className="overflow-hidden px-4 py-3.5">
                        <span className="truncate text-sm font-medium text-slate-800">{report.reportedUserNickname}</span>
                      </td>
                      <td className="overflow-hidden px-4 py-3.5">
                        <span className="truncate text-xs text-slate-600">{REPORT_REASON_LABEL[report.reason]}</span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-500 tabular-nums">
                        {new Date(report.reportedAt).toLocaleDateString("ko-KR")}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 pb-4">
          <PaginationBar total={filtered.length} page={page} pageSize={pageSize} onPageChange={setPage} />
        </div>
      </div>

      {/* ── 우측 슬라이드 패널 ── */}
      {selectedReport && (() => {
        const TypeIcon = TARGET_ICON[selectedReport.targetType] ?? Flag;
        const contentAuthor =
          selectedReport.targetType === "CONTENT_COMMENT" && linkedComment
            ? linkedComment.authorNickname
            : selectedReport.targetType === "QNA_QUESTION" && linkedQuestion
              ? linkedQuestion.askerNickname
              : selectedReport.targetType === "QNA_ANSWER" && linkedQuestion
                ? linkedQuestion.mentorName
                : selectedReport.reportedUserNickname;

        const reportedContent =
          selectedReport.targetType === "QNA_ANSWER" && linkedQuestion
            ? (linkedQuestion.answer || "(답변 없음)")
            : selectedReport.targetType === "QNA_QUESTION" && linkedQuestion
              ? linkedQuestion.content
              : selectedReport.targetTitle;

        return (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/20 transition-opacity"
              onClick={() => setSelectedReport(null)}
            />

            <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[480px] flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-200">
              {/* ── 헤더 ── */}
              <div className="flex items-center justify-between px-6 py-5">
                <h2 className="text-lg font-bold text-slate-900">신고 상세</h2>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* ── 바디 ── */}
              <div className="flex-1 overflow-y-auto px-6 pb-6">

                {/* ━━ 속성 행 (라벨 : 값) ━━ */}
                <div className="space-y-4">

                  {/* 상태 */}
                  <div className="flex items-center">
                    <div className="flex w-28 shrink-0 items-center gap-2 text-sm text-slate-500">
                      <Flag className="h-4 w-4 text-slate-400" />
                      <span>상태</span>
                    </div>
                    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", STATUS_CONFIG[selectedReport.status].chip)}>
                      {STATUS_CONFIG[selectedReport.status].label}
                    </span>
                  </div>

                  {/* 신고일 */}
                  <div className="flex items-center">
                    <div className="flex w-28 shrink-0 items-center gap-2 text-sm text-slate-500">
                      <FileText className="h-4 w-4 text-slate-400" />
                      <span>신고일</span>
                    </div>
                    <span className="text-sm font-medium text-slate-900">
                      {new Date(selectedReport.reportedAt).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
                    </span>
                  </div>

                  {/* 처리일 */}
                  <div className="flex items-center">
                    <div className="flex w-28 shrink-0 items-center gap-2 text-sm text-slate-500">
                      <CheckCircle2 className="h-4 w-4 text-slate-400" />
                      <span>처리일</span>
                    </div>
                    <span className={cn("text-sm font-medium", selectedReport.resolvedAt ? "text-slate-900" : "text-slate-300")}>
                      {selectedReport.resolvedAt
                        ? new Date(selectedReport.resolvedAt).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })
                        : "—"}
                    </span>
                  </div>

                  {/* 신고자 */}
                  <div className="flex items-center">
                    <div className="flex w-28 shrink-0 items-center gap-2 text-sm text-slate-500">
                      <MessageSquare className="h-4 w-4 text-slate-400" />
                      <span>신고자</span>
                    </div>
                    <span className="text-sm font-medium text-slate-900">{selectedReport.reporterNickname}</span>
                  </div>

                  {/* 피신고자 */}
                  <div className="flex items-center">
                    <div className="flex w-28 shrink-0 items-center gap-2 text-sm text-slate-500">
                      <MessageSquare className="h-4 w-4 text-slate-400" />
                      <span>피신고자</span>
                    </div>
                    <span className="text-sm font-medium text-slate-900">{contentAuthor}</span>
                  </div>

                  {/* 유형 */}
                  <div className="flex items-center">
                    <div className="flex w-28 shrink-0 items-center gap-2 text-sm text-slate-500">
                      <TypeIcon className="h-4 w-4 text-slate-400" />
                      <span>유형</span>
                    </div>
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                      {REPORT_TARGET_LABEL[selectedReport.targetType]}
                    </span>
                  </div>

                  {/* 신고 사유 */}
                  <div className="flex items-start">
                    <div className="flex w-28 shrink-0 items-center gap-2 pt-0.5 text-sm text-slate-500">
                      <Flag className="h-4 w-4 text-slate-400" />
                      <span>신고 사유</span>
                    </div>
                    <div>
                      <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                        {REPORT_REASON_LABEL[selectedReport.reason]}
                      </span>
                      {selectedReport.reasonDetail && (
                        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{selectedReport.reasonDetail}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* ━━ 구분선 ━━ */}
                <div className="my-6 h-px bg-slate-200" />

                {/* ━━ 신고된 콘텐츠 (Description 스타일) ━━ */}
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-slate-900">
                    {selectedReport.targetType === "QNA_ANSWER" ? "신고된 답변" : selectedReport.targetType === "QNA_QUESTION" ? "신고된 질문" : "신고된 댓글"}
                  </h3>

                  {/* Q&A 제목 (Q&A일 때만) */}
                  {(selectedReport.targetType === "QNA_QUESTION" || selectedReport.targetType === "QNA_ANSWER") && linkedQuestion && (
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs text-slate-400">질문: {linkedQuestion.title}</p>
                      <a href="/mentor-qna" target="_blank" rel="noopener noreferrer" className="flex shrink-0 items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 transition-colors">
                        원본 보기 <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}

                  {/* CONTENT_COMMENT: 원본 게시글 */}
                  {selectedReport.targetType === "CONTENT_COMMENT" && linkedComment && (
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs text-slate-400">게시글: {linkedComment.postTitle}</p>
                      <a href={`/posts/${linkedComment.postId}`} target="_blank" rel="noopener noreferrer" className="flex shrink-0 items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 transition-colors">
                        원본 보기 <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}

                  {/* STUDY_COMMENT: 원본 스터디 */}
                  {selectedReport.targetType === "STUDY_COMMENT" && (
                    <div className="mb-2 flex items-center justify-end">
                      <a href="/studies" target="_blank" rel="noopener noreferrer" className="flex shrink-0 items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 transition-colors">
                        원본 보기 <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm leading-relaxed text-slate-700">{reportedContent}</p>
                  </div>

                  {/* ── 콘텐츠 조치 (카드 아래) ── */}
                  {selectedReport.targetType === "CONTENT_COMMENT" && linkedComment && (() => {
                    if (linkedComment.status === "DELETED") {
                      return (
                        <div className="mt-3 flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                          <span className="text-sm text-slate-500">노출 상태</span>
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">삭제됨</span>
                          <span className="text-xs text-slate-400">조치 불가</span>
                        </div>
                      );
                    }
                    const isCurrentlyHidden = linkedComment.status === "HIDDEN";
                    const displayHidden = pendingHideComment ? !isCurrentlyHidden : isCurrentlyHidden;
                    return (
                      <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-500">노출 상태</span>
                          <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", displayHidden ? "bg-slate-200 text-slate-500" : "bg-green-100 text-green-700")}>
                            {displayHidden ? "비공개" : "공개"}
                          </span>
                          {pendingHideComment && <span className="text-[11px] text-amber-500">변경 예정</span>}
                        </div>
                        {selectedReport.status === "PENDING" && (
                          <select
                            value={displayHidden ? "HIDDEN" : "ACTIVE"}
                            onChange={(e) => {
                              const wantHidden = e.target.value === "HIDDEN";
                              setPendingHideComment(wantHidden !== isCurrentlyHidden);
                            }}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-200"
                          >
                            <option value="ACTIVE">공개</option>
                            <option value="HIDDEN">비공개</option>
                          </select>
                        )}
                      </div>
                    );
                  })()}

                  {selectedReport.targetType === "STUDY_COMMENT" && (() => {
                    const displayHidden = pendingHideComment;
                    return (
                      <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-500">노출 상태</span>
                          <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", displayHidden ? "bg-slate-200 text-slate-500" : "bg-green-100 text-green-700")}>
                            {displayHidden ? "비공개" : "공개"}
                          </span>
                          {pendingHideComment && <span className="text-[11px] text-amber-500">변경 예정</span>}
                        </div>
                        {selectedReport.status === "PENDING" && (
                          <select
                            value={displayHidden ? "HIDDEN" : "ACTIVE"}
                            onChange={(e) => setPendingHideComment(e.target.value === "HIDDEN")}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-200"
                          >
                            <option value="ACTIVE">공개</option>
                            <option value="HIDDEN">비공개</option>
                          </select>
                        )}
                      </div>
                    );
                  })()}

                  {(selectedReport.targetType === "QNA_QUESTION" || selectedReport.targetType === "QNA_ANSWER") && linkedQuestion && (() => {
                    const isCurrentlyPublic = linkedQuestion.isPublic;
                    const displayPublic = pendingHideQna ? !isCurrentlyPublic : isCurrentlyPublic;
                    return (
                      <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-500">노출 상태</span>
                          <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", displayPublic ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-500")}>
                            {displayPublic ? "공개" : "비공개"}
                          </span>
                          {pendingHideQna && <span className="text-[11px] text-amber-500">변경 예정</span>}
                        </div>
                        {selectedReport.status === "PENDING" && (
                          <select
                            value={displayPublic ? "PUBLIC" : "PRIVATE"}
                            onChange={(e) => {
                              const wantPublic = e.target.value === "PUBLIC";
                              setPendingHideQna(wantPublic !== isCurrentlyPublic);
                            }}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-200"
                          >
                            <option value="PUBLIC">공개</option>
                            <option value="PRIVATE">비공개</option>
                          </select>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* ━━ 구분선 ━━ */}
                <div className="my-6 h-px bg-slate-200" />

                {/* ━━ 관리자 메모 (Comments 스타일) ━━ */}
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-slate-900">처리 사유</h3>
                  <textarea
                    id="report-memo"
                    value={memoDraft}
                    onChange={(e) => { setMemoDraft(e.target.value); if (memoError) setMemoError(false); }}
                    placeholder="신고 처리 사유를 입력하세요..."
                    rows={3}
                    className={cn(
                      "w-full rounded-xl border bg-slate-50 px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 transition-colors resize-none",
                      memoError
                        ? "border-red-400 focus:border-red-400 focus:ring-red-200"
                        : "border-slate-200 focus:border-indigo-300 focus:ring-indigo-200"
                    )}
                  />
                  {memoError && (
                    <p className="mt-1.5 text-xs text-red-500">처리 사유를 입력해주세요.</p>
                  )}
                </div>

              </div>

              {/* ── 푸터 ── */}
              <div className="flex items-center gap-2 border-t border-slate-200 px-6 py-4">
                {selectedReport.status !== "RESOLVED" && (
                  <button
                    onClick={() => {
                      if (!memoDraft.trim()) {
                        setMemoError(true);
                        document.getElementById("report-memo")?.scrollIntoView({ behavior: "smooth", block: "center" });
                        setTimeout(() => document.getElementById("report-memo")?.focus(), 300);
                        return;
                      }
                      // 임시 상태 적용
                      if (pendingHideComment && selectedReport.targetType === "CONTENT_COMMENT" && linkedComment && linkedComment.status !== "DELETED") {
                        const newStatus = linkedComment.status === "HIDDEN" ? "ACTIVE" : "HIDDEN";
                        handleCommentAction(linkedComment.id, newStatus as CommentStatus);
                      }
                      if (pendingHideQna && (selectedReport.targetType === "QNA_QUESTION" || selectedReport.targetType === "QNA_ANSWER") && linkedQuestion) {
                        handleQnaPublicToggle(linkedQuestion);
                      }
                      // 처리 사유 저장
                      handleUpdateNote(selectedReport.id, memoDraft);
                      handleChangeStatus(selectedReport.id, "RESOLVED");
                    }}
                    className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
                  >
                    조치완료
                  </button>
                )}
                {selectedReport.status !== "DISMISSED" && (
                  <button
                    onClick={() => {
                      if (!memoDraft.trim()) {
                        setMemoError(true);
                        document.getElementById("report-memo")?.scrollIntoView({ behavior: "smooth", block: "center" });
                        setTimeout(() => document.getElementById("report-memo")?.focus(), 300);
                        return;
                      }
                      handleUpdateNote(selectedReport.id, memoDraft);
                      handleChangeStatus(selectedReport.id, "DISMISSED");
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    기각
                  </button>
                )}
                {selectedReport.status !== "PENDING" && (
                  <button
                    onClick={() => handleChangeStatus(selectedReport.id, "PENDING")}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> 재검토
                  </button>
                )}
              </div>
            </div>
          </>
        );
      })()}
    </div>
  );
}
