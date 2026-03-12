"use client";

import { useState, useMemo, useEffect } from "react";
import { ShieldCheck, Clock, CheckCircle2, XCircle, FileText, CreditCard, X, ExternalLink, Building2, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getAllVerifications, updateVerificationStatus, type StoredVerification } from "@/lib/verification-store";
import { recordLog } from "@/lib/audit-log-store";
import { PaginationBar, CountDisplay } from "@/components/ui/pagination-bar";
import { cn } from "@/lib/utils";
import { useToast } from "@/lib/toast-context";

type FilterStatus = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

const statusConfig: Record<StoredVerification["status"], { label: string; color: string; badge: string }> = {
  PENDING:  { label: "검토 중", color: "bg-amber-100 text-amber-700", badge: "bg-amber-50 text-amber-700 border border-amber-200" },
  APPROVED: { label: "승인",   color: "bg-green-100 text-green-700", badge: "bg-green-50 text-green-700 border border-green-200" },
  REJECTED: { label: "반려",   color: "bg-red-100 text-red-700",     badge: "bg-red-50 text-red-700 border border-red-200" },
};

const DOC_TYPE_LABEL: Record<string, string> = { BIZ_REG: "사업자등록증", CARD: "명함/재직증명서" };

export default function VerificationsPage() {
  const { showToast } = useToast();
  const [verifications, setVerifications] = useState<StoredVerification[]>([]);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>(() => {
    const all = getAllVerifications();
    return all.some((v) => v.status === "PENDING") ? "PENDING" : "ALL";
  });
  const [search, setSearch] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<StoredVerification | null>(null);
  const [rejectInput, setRejectInput] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    setVerifications(getAllVerifications());
  }, []);

  useEffect(() => {
    if (selectedDoc) {
      setRejectInput(selectedDoc.rejectMessage);
      setShowRejectInput(selectedDoc.status === "REJECTED");
    }
  }, [selectedDoc?.id]);

  function openDoc(v: StoredVerification) {
    setSelectedDoc(v);
    setRejectInput(v.rejectMessage);
    setShowRejectInput(v.status === "REJECTED");
  }

  function handleUpdateStatus(id: string, status: "APPROVED" | "REJECTED" | "PENDING") {
    const msg = status === "REJECTED" ? rejectInput : "";
    const doc = verifications.find((v) => v.id === id);
    updateVerificationStatus(id, status, msg);
    setVerifications((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status, rejectMessage: msg } : v))
    );
    setSelectedDoc((prev) => (prev?.id === id ? { ...prev, status, rejectMessage: msg } : prev));
    if (status !== "REJECTED") { setShowRejectInput(false); setRejectInput(""); }
    if (doc) {
      const docLabel = DOC_TYPE_LABEL[doc.docType] ?? doc.docType;
      if (status === "APPROVED") {
        recordLog("DOC_APPROVE", `${doc.nickname} ${docLabel} 승인`, { targetType: "document", targetId: id });
      } else if (status === "REJECTED") {
        recordLog("DOC_REJECT", `${doc.nickname} ${docLabel} 반려${msg ? `: ${msg}` : ""}`, { targetType: "document", targetId: id });
      }
    }
    showToast(status === "APPROVED" ? "승인 처리되었습니다." : status === "REJECTED" ? "반려 처리되었습니다." : "검토 중으로 변경되었습니다.");
    // 대기 항목이 0이면 전체 탭으로 이동
    if (filterStatus === "PENDING") {
      const remaining = verifications.filter((v) => v.id !== id ? v.status === "PENDING" : status === "PENDING");
      if (remaining.length === 0) setFilterStatus("ALL");
    }
  }

  const filtered = useMemo(() => {
    return verifications.filter((v) => {
      if (filterStatus !== "ALL" && v.status !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          v.nickname.toLowerCase().includes(q) ||
          v.realName.toLowerCase().includes(q) ||
          v.companyName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [filterStatus, search, verifications]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const counts = useMemo(() => ({
    pending:  verifications.filter((v) => v.status === "PENDING").length,
    approved: verifications.filter((v) => v.status === "APPROVED").length,
    rejected: verifications.filter((v) => v.status === "REJECTED").length,
  }), [verifications]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">인증 뱃지 관리</h2>
        <p className="mt-0.5 text-sm text-slate-500">회원 서류를 검토하고 인증 뱃지를 부여합니다.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "검토 중",   count: counts.pending,  icon: Clock,         bg: "bg-amber-50 border-amber-200",  iconColor: "text-amber-600",  status: "PENDING"  as FilterStatus },
          { label: "승인 완료", count: counts.approved, icon: CheckCircle2,  bg: "bg-green-50 border-green-200",  iconColor: "text-green-600",  status: "APPROVED" as FilterStatus },
          { label: "반려",      count: counts.rejected, icon: XCircle,       bg: "bg-red-50 border-red-200",      iconColor: "text-red-600",    status: "REJECTED" as FilterStatus },
        ].map((card) => {
          const Icon = card.icon;
          const isActive = filterStatus === card.status;
          return (
            <button
              key={card.label}
              onClick={() => { setFilterStatus(isActive ? "ALL" : card.status); setPage(1); }}
              className={cn(
                "flex items-center gap-3 rounded-xl border bg-white p-4 text-left transition-all hover:shadow-md",
                isActive ? "border-indigo-400 ring-2 ring-indigo-200" : "border-slate-200"
              )}
            >
              <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border", card.bg)}>
                <Icon className={cn("h-5 w-5", card.iconColor)} />
              </div>
              <div>
                <p className="text-xs text-slate-500">{card.label}</p>
                <p className="text-2xl font-bold text-slate-900">{card.count}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {(["ALL", "PENDING", "APPROVED", "REJECTED"] as FilterStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => { setFilterStatus(s); setPage(1); }}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                filterStatus === s ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-700"
              )}
            >
              {s === "ALL" ? "전체" : statusConfig[s].label}
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <ShieldCheck className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            className="h-9 w-64 pl-8 text-sm"
            placeholder="이름/닉네임/회사명 검색..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <h3 className="text-sm font-semibold text-slate-800">서류 목록</h3>
            <CountDisplay total={filtered.length} />
          </div>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            className="h-7 cursor-pointer rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-600 hover:border-slate-300 focus:outline-none"
          >
            {[10, 20, 30, 40, 50].map((n) => <option key={n} value={n}>{n}개씩</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] table-fixed text-sm">
            <colgroup>
              <col className="w-[120px]" />
              <col className="w-[80px]" />
              <col className="w-[160px]" />
              <col className="w-[100px]" />
              <col className="w-[140px]" />
              <col className="w-[100px]" />
              <col className="w-[100px]" />
              <col className="w-[160px]" />
            </colgroup>
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left">
                <th className="px-5 py-3 text-xs font-semibold text-slate-500">닉네임</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">실명</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">회사명</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">회원유형</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">서류유형</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">제출일</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">상태</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">반려 메시지</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-sm text-slate-400">
                    {verifications.length === 0 ? "서류 제출 내역이 없습니다." : "검색 결과가 없습니다."}
                  </td>
                </tr>
              ) : (
                paginated.map((v) => {
                  const sc = statusConfig[v.status];
                  return (
                    <tr
                      key={v.id}
                      onClick={() => openDoc(v)}
                      className="cursor-pointer transition-colors hover:bg-slate-50"
                    >
                      <td className="overflow-hidden px-5 py-3.5"><div className="truncate font-medium text-slate-800">{v.nickname}</div></td>
                      <td className="overflow-hidden px-4 py-3.5"><div className="truncate text-slate-700">{v.realName}</div></td>
                      <td className="overflow-hidden px-4 py-3.5"><div className="truncate text-slate-700">{v.companyName}</div></td>
                      <td className="overflow-hidden px-4 py-3.5"><div className="truncate text-slate-600">{v.companyType}</div></td>
                      <td className="overflow-hidden px-4 py-3.5">
                        <div className="flex min-w-0 items-center gap-1.5">
                          {v.docType === "BIZ_REG"
                            ? <FileText className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            : <CreditCard className="h-3.5 w-3.5 shrink-0 text-slate-400" />}
                          <span className="truncate text-slate-600">{DOC_TYPE_LABEL[v.docType]}</span>
                        </div>
                      </td>
                      <td className="overflow-hidden px-4 py-3.5"><div className="truncate text-slate-500">{new Date(v.submittedAt).toLocaleDateString("ko-KR")}</div></td>
                      <td className="overflow-hidden px-4 py-3.5">
                        <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium", sc.color)}>
                          {sc.label}
                        </span>
                      </td>
                      <td className="overflow-hidden px-4 py-3.5 text-xs text-slate-500">
                        <div className="truncate" title={v.rejectMessage || undefined}>{v.rejectMessage || "—"}</div>
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

      {/* ── 서류 상세 모달 ───────────────────────────────────────────── */}
      {selectedDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedDoc(null); }}
        >
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">

            {/* Modal Header */}
            <div className="flex items-start gap-4 border-b border-slate-100 px-5 py-4">
              <div className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold",
                selectedDoc.status === "APPROVED" ? "bg-green-100 text-green-600" :
                selectedDoc.status === "REJECTED" ? "bg-red-100 text-red-500" :
                "bg-amber-100 text-amber-600"
              )}>
                {selectedDoc.nickname.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-bold text-slate-900">{selectedDoc.nickname}</span>
                  <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", statusConfig[selectedDoc.status].badge)}>
                    {statusConfig[selectedDoc.status].label}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-slate-500">{selectedDoc.realName}</p>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">

              {/* 기본 정보 */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* 회사명 */}
                <div className="flex gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">회사명</p>
                    <p className="mt-0.5 text-sm font-medium text-slate-800">{selectedDoc.companyName}</p>
                  </div>
                </div>
                {/* 회원유형 */}
                <div className="flex gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">회원유형</p>
                    <p className="mt-0.5 text-sm font-medium text-slate-800">{selectedDoc.companyType}</p>
                  </div>
                </div>
                {/* 제출일 */}
                <div className="flex gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">제출일</p>
                    <p className="mt-0.5 text-sm font-medium text-slate-800">
                      {new Date(selectedDoc.submittedAt).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                  </div>
                </div>
              </div>

              {/* 인증 첨부자료 */}
              <div>
                <h4 className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <FileText className="h-3.5 w-3.5" /> 인증 첨부자료
                </h4>
                <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400">
                    {selectedDoc.docType === "BIZ_REG"
                      ? <FileText className="h-4 w-4" />
                      : <CreditCard className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-slate-800">{DOC_TYPE_LABEL[selectedDoc.docType]}</span>
                      <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border", statusConfig[selectedDoc.status].badge)}>
                        {statusConfig[selectedDoc.status].label}
                      </span>
                    </div>
                    <a
                      href={selectedDoc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 block truncate text-xs text-indigo-500 hover:underline"
                    >
                      {selectedDoc.fileUrl}
                    </a>
                    <p className="mt-0.5 text-xs text-slate-400">
                      업로드: {new Date(selectedDoc.submittedAt).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                  </div>
                  <a
                    href={selectedDoc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 shrink-0 text-slate-400 hover:text-indigo-500 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>

                {/* 파일 미리보기 영역 */}
                <div className="mt-2 flex h-28 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
                  서류 미리보기 영역 (파일 뷰어 연동 시 표시)
                </div>
              </div>

              {/* 심사 처리 */}
              <div>
                <h4 className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <ShieldCheck className="h-3.5 w-3.5" /> 심사 처리
                </h4>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">

                  {/* 반려 메시지 입력 (반려 버튼 클릭 후 또는 이미 반려 상태) */}
                  {showRejectInput && (
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-slate-600">
                        반려 메시지 <span className="text-slate-400 font-normal">(회원에게 표시됩니다)</span>
                      </label>
                      <textarea
                        value={rejectInput}
                        onChange={(e) => setRejectInput(e.target.value)}
                        placeholder="반려 사유를 회원에게 안내할 메시지를 입력하세요..."
                        rows={3}
                        autoFocus
                        className="w-full resize-none rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-200"
                      />
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    {/* 승인 */}
                    {selectedDoc.status !== "APPROVED" && !showRejectInput && (
                      <button
                        onClick={() => handleUpdateStatus(selectedDoc.id, "APPROVED")}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                      >
                        승인
                      </button>
                    )}

                    {/* 반려 버튼 → 메시지 입력 모드 진입 */}
                    {selectedDoc.status !== "REJECTED" && !showRejectInput && (
                      <button
                        onClick={() => { setShowRejectInput(true); setRejectInput(""); }}
                        className="rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-200 transition-colors"
                      >
                        반려
                      </button>
                    )}

                    {/* 반려 확인 (메시지 입력 후) */}
                    {showRejectInput && selectedDoc.status !== "REJECTED" && (
                      <button
                        onClick={() => handleUpdateStatus(selectedDoc.id, "REJECTED")}
                        className="rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-200 transition-colors"
                      >
                        반려 확인
                      </button>
                    )}

                    {/* 반려 메시지 수정 저장 (이미 반려 상태) */}
                    {showRejectInput && selectedDoc.status === "REJECTED" && (
                      <button
                        onClick={() => handleUpdateStatus(selectedDoc.id, "REJECTED")}
                        disabled={rejectInput === selectedDoc.rejectMessage}
                        className={cn(
                          "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                          rejectInput === selectedDoc.rejectMessage
                            ? "cursor-not-allowed bg-slate-100 text-slate-400"
                            : "bg-indigo-600 text-white hover:bg-indigo-700"
                        )}
                      >
                        저장
                      </button>
                    )}

                    {/* 검토 중으로 변경 */}
                    {selectedDoc.status !== "PENDING" && (
                      <button
                        onClick={() => handleUpdateStatus(selectedDoc.id, "PENDING")}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        검토 중으로 변경
                      </button>
                    )}

                    {/* 반려 입력 취소 */}
                    {showRejectInput && selectedDoc.status !== "REJECTED" && (
                      <button
                        onClick={() => { setShowRejectInput(false); setRejectInput(""); }}
                        className="ml-auto text-xs text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        취소
                      </button>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
