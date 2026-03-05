"use client";

import { useState, useMemo } from "react";
import { MessageSquare, AlertTriangle, EyeOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { mockComments, type CommentStatus } from "@/data/mock-data";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { cn } from "@/lib/utils";

type FilterStatus = "ALL" | CommentStatus;

const statusConfig: Record<CommentStatus, { label: string; variant: "success" | "warning" | "secondary" | "destructive" }> = {
  ACTIVE: { label: "정상", variant: "success" },
  REPORTED: { label: "신고됨", variant: "warning" },
  HIDDEN: { label: "숨김", variant: "secondary" },
  DELETED: { label: "삭제됨", variant: "destructive" },
};

export default function CommentsPage() {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const filtered = useMemo(() => {
    return mockComments.filter((c) => {
      if (filterStatus !== "ALL" && c.status !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        return c.content.toLowerCase().includes(q) || c.authorNickname.toLowerCase().includes(q) || c.postTitle.toLowerCase().includes(q);
      }
      return true;
    });
  }, [filterStatus, search]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const counts = useMemo(() => ({
    total: mockComments.length,
    reported: mockComments.filter((c) => c.status === "REPORTED").length,
    hidden: mockComments.filter((c) => c.status === "HIDDEN").length,
    deleted: mockComments.filter((c) => c.status === "DELETED").length,
  }), []);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">댓글/신고 관리</h2>
        <p className="mt-0.5 text-sm text-slate-500">댓글 신고를 관리하고 부적절한 댓글을 처리합니다.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "전체 댓글", count: counts.total, icon: MessageSquare, bg: "bg-blue-50 border-blue-200", color: "text-blue-600" },
          { label: "신고됨", count: counts.reported, icon: AlertTriangle, bg: "bg-amber-50 border-amber-200", color: "text-amber-600" },
          { label: "숨김 처리", count: counts.hidden, icon: EyeOff, bg: "bg-slate-50 border-slate-200", color: "text-slate-600" },
          { label: "삭제됨", count: counts.deleted, icon: Trash2, bg: "bg-red-50 border-red-200", color: "text-red-600" },
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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {(["ALL", "ACTIVE", "REPORTED", "HIDDEN", "DELETED"] as FilterStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => { setFilterStatus(s); setPage(1); }}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                filterStatus === s ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-700"
              )}
            >
              {s === "ALL" ? "전체" : statusConfig[s].label}
              {s === "REPORTED" && counts.reported > 0 && (
                <span className="ml-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white">{counts.reported}</span>
              )}
            </button>
          ))}
        </div>
        <Input className="ml-auto h-9 w-64 text-sm" placeholder="내용/작성자/게시물 검색..." value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <h3 className="text-sm font-semibold text-slate-800">댓글 목록</h3>
          <span className="text-xs text-slate-500">총 {filtered.length.toLocaleString()}건</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left">
                <th className="px-5 py-3 text-xs font-semibold text-slate-500">작성자</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 w-[28%]">내용</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">게시물</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">상태</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500">신고 수</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">신고 사유</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">작성일</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginated.length === 0 ? (
                <tr><td colSpan={8} className="py-16 text-center text-sm text-slate-400">검색 결과가 없습니다.</td></tr>
              ) : (
                paginated.map((cmt) => {
                  const sc = statusConfig[cmt.status];
                  return (
                    <tr key={cmt.id} className="transition-colors hover:bg-slate-50/70">
                      <td className="px-5 py-3.5 font-medium text-slate-800">{cmt.authorNickname}</td>
                      <td className="px-4 py-3.5 max-w-[280px] truncate text-slate-600">{cmt.content}</td>
                      <td className="px-4 py-3.5 max-w-[180px] truncate text-xs text-slate-500">{cmt.postTitle}</td>
                      <td className="px-4 py-3.5"><Badge variant={sc.variant}>{sc.label}</Badge></td>
                      <td className="px-4 py-3.5 text-center tabular-nums">
                        {cmt.reportCount > 0 ? <span className="font-semibold text-red-600">{cmt.reportCount}</span> : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-500">{cmt.reportReason || "—"}</td>
                      <td className="px-4 py-3.5 text-xs text-slate-500">{new Date(cmt.createdAt).toLocaleDateString("ko-KR")}</td>
                      <td className="px-4 py-3.5 text-center">
                        {(cmt.status === "ACTIVE" || cmt.status === "REPORTED") && (
                          <div className="flex items-center justify-center gap-1">
                            <button className="rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100">숨김</button>
                            <button className="rounded-md px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50">삭제</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 pb-4">
          <PaginationBar total={filtered.length} page={page} pageSize={pageSize}
            onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
        </div>
      </div>
    </div>
  );
}
