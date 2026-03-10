"use client";

import { useState, useMemo } from "react";
import {
  Flag,
  CheckCircle2,
  XCircle,
  RotateCcw,
  AlertTriangle,
  X,
  FileText,
} from "lucide-react";
import { useToast } from "@/lib/toast-context";
import { recordLog } from "@/lib/audit-log-store";
import { Input } from "@/components/ui/input";
import { PaginationBar, CountDisplay } from "@/components/ui/pagination-bar";
import { cn } from "@/lib/utils";
import {
  mockReports,
  REPORT_REASON_LABEL,
  REPORT_TARGET_LABEL,
  type UserReport,
  type ReportStatus,
  type ReportTargetType,
} from "@/lib/report-store";

type FilterStatus = "ALL" | ReportStatus;
type FilterTarget = "ALL" | ReportTargetType;

const STATUS_CONFIG: Record<ReportStatus, { label: string; chip: string }> = {
  PENDING:   { label: "검토중",   chip: "bg-amber-100 text-amber-700" },
  RESOLVED:  { label: "조치완료", chip: "bg-red-100 text-red-700" },
  DISMISSED: { label: "기각",     chip: "bg-slate-100 text-slate-500" },
};

export default function CommentsPage() {
  const { showToast } = useToast();
  const [reports, setReports] = useState<UserReport[]>(mockReports);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL");
  const [filterTarget, setFilterTarget] = useState<FilterTarget>("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedReport, setSelectedReport] = useState<UserReport | null>(null);
  const [memoDraft, setMemoDraft] = useState("");

  // ── 액션 핸들러 ──────────────────────────────────────────────────────────────

  function handleChangeStatus(id: string, status: ReportStatus) {
    const report = reports.find((r) => r.id === id);
    const updated = { ...report!, status, resolvedAt: status !== "PENDING" ? new Date().toISOString() : undefined };
    setReports((prev) => prev.map((r) => (r.id === id ? updated : r)));
    if (selectedReport?.id === id) setSelectedReport(updated);
    if (report) {
      const targetLabel = REPORT_TARGET_LABEL[report.targetType];
      if (status === "RESOLVED") {
        recordLog("REPORT_RESOLVE", `${report.reportedUserNickname} 신고 조치완료 (${targetLabel}: ${report.targetTitle.slice(0, 20)}...)`, { targetType: report.targetType.toLowerCase(), targetId: report.targetId });
      } else if (status === "DISMISSED") {
        recordLog("REPORT_DISMISS", `${report.reportedUserNickname} 신고 기각 (${REPORT_REASON_LABEL[report.reason]})`, { targetType: report.targetType.toLowerCase(), targetId: report.targetId });
      } else if (status === "PENDING") {
        recordLog("REPORT_REVIEW", `${report.reportedUserNickname} 신고 재검토`, { targetType: report.targetType.toLowerCase(), targetId: report.targetId });
      }
    }
    const msgs: Record<ReportStatus, string> = {
      PENDING:   "신고가 재검토 상태로 변경되었습니다.",
      RESOLVED:  "신고가 조치 완료 처리되었습니다.",
      DISMISSED: "신고가 기각 처리되었습니다.",
    };
    showToast(msgs[status]);
  }

  function handleUpdateNote(id: string, note: string) {
    const updated = reports.find((r) => r.id === id);
    if (!updated) return;
    const next = { ...updated, adminNote: note };
    setReports((prev) => prev.map((r) => (r.id === id ? next : r)));
    if (selectedReport?.id === id) setSelectedReport(next);
  }

  function handleOpenReport(report: UserReport) {
    setSelectedReport(report);
    setMemoDraft(report.adminNote ?? "");
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
      if (filterTarget !== "ALL" && r.targetType !== filterTarget) return false;
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
  }, [reports, filterStatus, filterTarget, search]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  // ── 렌더 ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* 페이지 제목 */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">댓글/신고 관리</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          회원이 신고한 댓글·게시글·Q&A를 검토하고 처리합니다.
        </p>
      </div>

      {/* 요약 카드 */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "전체 신고", count: counts.total,     icon: Flag,          bg: "bg-blue-50 border-blue-200",   color: "text-blue-600" },
          { label: "검토중",    count: counts.pending,   icon: AlertTriangle, bg: "bg-amber-50 border-amber-200", color: "text-amber-600" },
          { label: "조치완료",  count: counts.resolved,  icon: CheckCircle2,  bg: "bg-red-50 border-red-200",     color: "text-red-600" },
          { label: "기각",      count: counts.dismissed, icon: XCircle,       bg: "bg-slate-50 border-slate-200", color: "text-slate-500" },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border", card.bg)}>
                <Icon className={cn("h-5 w-5", card.color)} />
              </div>
              <div>
                <p className="text-xs text-slate-500">{card.label}</p>
                <p className="text-2xl font-bold text-slate-900">{card.count}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 필터 */}
      <div className="flex flex-wrap items-center gap-2">
        {/* 처리 상태 필터 */}
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {(["ALL", "PENDING", "RESOLVED", "DISMISSED"] as FilterStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => { setFilterStatus(s); setPage(1); }}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                filterStatus === s ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-700"
              )}
            >
              {s === "ALL" ? "전체" : STATUS_CONFIG[s].label}
              {s === "PENDING" && counts.pending > 0 && (
                <span className="ml-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white">
                  {counts.pending}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 유형 필터 */}
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {(["ALL", "COMMENT", "POST", "QNA"] as FilterTarget[]).map((t) => (
            <button
              key={t}
              onClick={() => { setFilterTarget(t); setPage(1); }}
              className={cn(
                "flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                filterTarget === t ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-700"
              )}
            >
              {t === "ALL" ? "유형 전체" : REPORT_TARGET_LABEL[t]}
            </button>
          ))}
        </div>

        <Input
          className="ml-auto h-9 w-64 text-sm"
          placeholder="내용/신고자/피신고자 검색..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {/* 테이블 */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <h3 className="text-sm font-semibold text-slate-800">신고 목록</h3>
            <CountDisplay total={filtered.length} />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="h-7 cursor-pointer rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-600 hover:border-slate-300 focus:outline-none"
            >
              <option value={10}>10개씩</option>
              <option value={20}>20개씩</option>
              <option value={30}>30개씩</option>
              <option value={50}>50개씩</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] table-fixed text-sm">
            <colgroup>
              <col className="w-[100px]" />
              <col className="w-[80px]" />
              <col className="w-[260px]" />
              <col className="w-[100px]" />
              <col className="w-[100px]" />
              <col className="w-[130px]" />
              <col className="w-[90px]" />
            </colgroup>
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">신고일</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">유형</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">신고 내용</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">피신고자</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">신고자</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">신고 사유</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">처리 상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-sm text-slate-400">
                    <Flag className="mx-auto mb-3 h-10 w-10 opacity-20" />
                    검색 결과가 없습니다.
                  </td>
                </tr>
              ) : (
                paginated.map((report) => {
                  const sc = STATUS_CONFIG[report.status];
                  return (
                    <tr
                      key={report.id}
                      onClick={() => handleOpenReport(report)}
                      className="cursor-pointer transition-colors hover:bg-slate-50"
                    >
                      <td className="px-4 py-3.5 text-xs text-slate-500 tabular-nums">
                        {new Date(report.reportedAt).toLocaleDateString("ko-KR")}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs text-slate-600">
                          {REPORT_TARGET_LABEL[report.targetType]}
                        </span>
                      </td>
                      <td className="overflow-hidden px-4 py-3.5">
                        <p className="line-clamp-1 text-sm text-slate-700">{report.targetTitle}</p>
                      </td>
                      <td className="overflow-hidden px-4 py-3.5">
                        <span className="truncate text-sm font-medium text-slate-800">
                          {report.reportedUserNickname}
                        </span>
                      </td>
                      <td className="overflow-hidden px-4 py-3.5">
                        <div className="truncate text-sm text-slate-500">{report.reporterNickname}</div>
                      </td>
                      <td className="overflow-hidden px-4 py-3.5">
                        <span className="truncate text-xs text-slate-600">
                          {REPORT_REASON_LABEL[report.reason]}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={cn(
                          "inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium",
                          sc.chip
                        )}>
                          {sc.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 pb-4">
          <PaginationBar
            total={filtered.length}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </div>
      </div>

      {/* ── 신고 상세 모달 ─────────────────────────────────────────────────── */}
      {selectedReport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedReport(null); }}
        >
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            {/* 모달 헤더 */}
            <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4">
              <div className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                selectedReport.status === "PENDING"   ? "bg-amber-100" :
                selectedReport.status === "RESOLVED"  ? "bg-red-100" : "bg-slate-100"
              )}>
                <Flag className={cn(
                  "h-5 w-5",
                  selectedReport.status === "PENDING"   ? "text-amber-600" :
                  selectedReport.status === "RESOLVED"  ? "text-red-500" : "text-slate-400"
                )} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-bold text-slate-900">
                    {selectedReport.reportedUserNickname}
                  </span>
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    STATUS_CONFIG[selectedReport.status].chip
                  )}>
                    {STATUS_CONFIG[selectedReport.status].label}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                    {REPORT_TARGET_LABEL[selectedReport.targetType]}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-slate-500">
                  신고자: {selectedReport.reporterNickname}
                </p>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* 모달 바디 */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* 기본 정보 */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "신고 유형",  value: REPORT_TARGET_LABEL[selectedReport.targetType] },
                  { label: "신고 사유",  value: REPORT_REASON_LABEL[selectedReport.reason] },
                  { label: "신고일",     value: new Date(selectedReport.reportedAt).toLocaleString("ko-KR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }) },
                  { label: "처리일",     value: selectedReport.resolvedAt ? new Date(selectedReport.resolvedAt).toLocaleString("ko-KR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-3">
                    <p className="text-xs text-slate-400">{label}</p>
                    <p className="mt-0.5 text-sm font-medium text-slate-700">{value}</p>
                  </div>
                ))}
              </div>

              {/* 신고 콘텐츠 */}
              <div>
                <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <FileText className="h-3.5 w-3.5" /> 신고 콘텐츠
                </h4>
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <p className="text-sm leading-relaxed text-slate-700">{selectedReport.targetTitle}</p>
                </div>
              </div>

              {/* 신고 상세 사유 */}
              {selectedReport.reasonDetail && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-xs font-semibold text-amber-700">신고 상세 사유</p>
                  <p className="mt-1 text-sm text-amber-800">{selectedReport.reasonDetail}</p>
                </div>
              )}

              {/* 관리자 메모 */}
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  관리자 메모
                </h4>
                <textarea
                  value={memoDraft}
                  onChange={(e) => setMemoDraft(e.target.value)}
                  placeholder="처리 내용, 메모를 입력하세요..."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-200"
                />
                <div className="mt-2 flex justify-end gap-2">
                  <button
                    onClick={() => setMemoDraft(selectedReport.adminNote ?? "")}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => {
                      handleUpdateNote(selectedReport.id, memoDraft);
                      showToast("메모가 저장되었습니다.");
                    }}
                    disabled={memoDraft === (selectedReport.adminNote ?? "")}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                      memoDraft !== (selectedReport.adminNote ?? "")
                        ? "bg-indigo-600 text-white hover:bg-indigo-700"
                        : "cursor-not-allowed bg-slate-100 text-slate-400"
                    )}
                  >
                    저장
                  </button>
                </div>
              </div>
            </div>

            {/* 모달 푸터 — 액션 버튼 */}
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3.5">
              <div className="flex gap-2">
                {selectedReport.status !== "RESOLVED" && (
                  <button
                    onClick={() => handleChangeStatus(selectedReport.id, "RESOLVED")}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                  >
                    조치완료
                  </button>
                )}
                {selectedReport.status !== "DISMISSED" && (
                  <button
                    onClick={() => handleChangeStatus(selectedReport.id, "DISMISSED")}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    기각
                  </button>
                )}
                {selectedReport.status !== "PENDING" && (
                  <button
                    onClick={() => handleChangeStatus(selectedReport.id, "PENDING")}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> 재검토
                  </button>
                )}
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
