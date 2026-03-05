"use client";

import { useState, useMemo } from "react";
import { ShieldCheck, Clock, CheckCircle2, XCircle, FileText, CreditCard, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { mockVerifications, type Verification } from "@/data/mock-data";
import { PaginationBar, CountDisplay } from "@/components/ui/pagination-bar";
import { cn } from "@/lib/utils";

type FilterStatus = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

const statusConfig: Record<Verification["status"], { label: string; color: string }> = {
  PENDING: { label: "검토 대기", color: "bg-amber-100 text-amber-700" },
  APPROVED: { label: "승인", color: "bg-green-100 text-green-700" },
  REJECTED: { label: "반려", color: "bg-red-100 text-red-700" },
};

export default function VerificationsPage() {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL");
  const [search, setSearch] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<Verification | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const filtered = useMemo(() => {
    return mockVerifications.filter((v) => {
      if (filterStatus !== "ALL" && v.status !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        return v.nickname.toLowerCase().includes(q) || v.realName.toLowerCase().includes(q) || v.companyName.toLowerCase().includes(q);
      }
      return true;
    });
  }, [filterStatus, search]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const counts = useMemo(() => ({
    pending: mockVerifications.filter((v) => v.status === "PENDING").length,
    approved: mockVerifications.filter((v) => v.status === "APPROVED").length,
    rejected: mockVerifications.filter((v) => v.status === "REJECTED").length,
  }), []);

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
          { label: "검토 대기", count: counts.pending, icon: Clock, bg: "bg-amber-50 border-amber-200", iconColor: "text-amber-600", status: "PENDING" as FilterStatus },
          { label: "승인 완료", count: counts.approved, icon: CheckCircle2, bg: "bg-green-50 border-green-200", iconColor: "text-green-600", status: "APPROVED" as FilterStatus },
          { label: "반려", count: counts.rejected, icon: XCircle, bg: "bg-red-50 border-red-200", iconColor: "text-red-600", status: "REJECTED" as FilterStatus },
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
          <Input className="h-9 w-64 pl-8 text-sm" placeholder="이름/닉네임/회사명 검색..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
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
            <option value={10}>10개씩</option>
            <option value={20}>20개씩</option>
            <option value={30}>30개씩</option>
            <option value={40}>40개씩</option>
            <option value={50}>50개씩</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left">
                <th className="px-5 py-3 text-xs font-semibold text-slate-500">닉네임</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">실명</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">회사명</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">기업유형</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">서류유형</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">제출일</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">상태</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">관리자 메모</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-sm text-slate-400">검색 결과가 없습니다.</td>
                </tr>
              ) : (
                paginated.map((v) => {
                  const sc = statusConfig[v.status];
                  return (
                    <tr key={v.id} className={cn("transition-colors hover:bg-slate-50/70", selectedDoc?.id === v.id && "bg-indigo-50/50")}>
                      <td className="px-5 py-3.5 font-medium text-slate-800">{v.nickname}</td>
                      <td className="px-4 py-3.5 text-slate-700">{v.realName}</td>
                      <td className="px-4 py-3.5 text-slate-700">{v.companyName}</td>
                      <td className="px-4 py-3.5 text-slate-600">{v.companyType}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {v.docType === "BIZ_REG"
                            ? <FileText className="h-3.5 w-3.5 text-slate-400" />
                            : <CreditCard className="h-3.5 w-3.5 text-slate-400" />}
                          <span className="text-slate-600">{v.docType === "BIZ_REG" ? "사업자등록증" : "명함/재직증명"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500">{new Date(v.submittedAt).toLocaleDateString("ko-KR")}</td>
                      <td className="px-4 py-3.5">
                        <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium", sc.color)}>
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 max-w-[180px] truncate text-xs text-slate-500">{v.adminMemo || "—"}</td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedDoc(selectedDoc?.id === v.id ? null : v)}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          {v.status === "PENDING" && (
                            <>
                              <button className="rounded-md px-2 py-1 text-xs font-medium text-green-600 hover:bg-green-50">승인</button>
                              <button className="rounded-md px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50">반려</button>
                            </>
                          )}
                        </div>
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

      {/* Detail Panel */}
      {selectedDoc && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-slate-800">
            서류 상세 — {selectedDoc.realName} ({selectedDoc.nickname})
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            <div className="flex gap-2"><span className="text-slate-500">회사명:</span><span className="font-medium text-slate-800">{selectedDoc.companyName}</span></div>
            <div className="flex gap-2"><span className="text-slate-500">기업유형:</span><span className="font-medium text-slate-800">{selectedDoc.companyType}</span></div>
            <div className="flex gap-2"><span className="text-slate-500">서류유형:</span><span className="font-medium text-slate-800">{selectedDoc.docType === "BIZ_REG" ? "사업자등록증" : "명함/재직증명서"}</span></div>
            <div className="flex gap-2"><span className="text-slate-500">파일:</span><span className="font-medium text-indigo-600">{selectedDoc.fileUrl}</span></div>
          </div>
          <div className="mt-4 flex h-32 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
            서류 미리보기 영역 (파일 뷰어 연동 시 표시)
          </div>
        </div>
      )}
    </div>
  );
}
