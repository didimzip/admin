"use client";

import { useState, useMemo } from "react";
import { MessageSquare, AlertTriangle, EyeOff, Trash2, RotateCcw, ChevronDown, ChevronUp, X } from "lucide-react";
import { useToast } from "@/lib/toast-context";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { mockComments, type CommentStatus } from "@/data/mock-data";
import { PaginationBar, CountDisplay } from "@/components/ui/pagination-bar";
import { cn } from "@/lib/utils";

type FilterStatus = "ALL" | CommentStatus;

const statusConfig: Record<CommentStatus, { label: string; variant: "success" | "warning" | "secondary" | "destructive" }> = {
  ACTIVE:   { label: "정상",   variant: "success" },
  REPORTED: { label: "신고됨", variant: "warning" },
  HIDDEN:   { label: "숨김",   variant: "secondary" },
  DELETED:  { label: "삭제됨", variant: "destructive" },
};

const rowBg: Record<CommentStatus, string> = {
  ACTIVE:   "hover:bg-slate-50/70",
  REPORTED: "bg-amber-50/50 hover:bg-amber-50/80",
  HIDDEN:   "opacity-55 hover:bg-slate-50/70",
  DELETED:  "opacity-35",
};

export default function CommentsPage() {
  const { showToast } = useToast();
  const [localComments, setLocalComments] = useState(mockComments);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ── 액션 핸들러 ────────────────────────────────────────────────────────────

  function handleHide(id: string) {
    setLocalComments((prev) => prev.map((c) => c.id === id ? { ...c, status: "HIDDEN" as const } : c));
    showToast("댓글이 숨김 처리되었습니다.");
  }

  function handleRestore(id: string) {
    setLocalComments((prev) => prev.map((c) => c.id === id ? { ...c, status: "ACTIVE" as const } : c));
    showToast("댓글이 복원되었습니다.");
  }

  function handleDelete(id: string) {
    setLocalComments((prev) => prev.map((c) => c.id === id ? { ...c, status: "DELETED" as const } : c));
    if (expandedId === id) setExpandedId(null);
    showToast("댓글이 삭제되었습니다.");
  }

  // ── 필터/페이지네이션 ───────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    return localComments.filter((c) => {
      if (filterStatus !== "ALL" && c.status !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          c.content.toLowerCase().includes(q) ||
          c.authorNickname.toLowerCase().includes(q) ||
          c.postTitle.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [localComments, filterStatus, search]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const counts = useMemo(() => ({
    total:    localComments.length,
    reported: localComments.filter((c) => c.status === "REPORTED").length,
    hidden:   localComments.filter((c) => c.status === "HIDDEN").length,
    deleted:  localComments.filter((c) => c.status === "DELETED").length,
  }), [localComments]);

  // ── 렌더 ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">댓글/신고 관리</h2>
        <p className="mt-0.5 text-sm text-slate-500">댓글 신고를 관리하고 부적절한 댓글을 처리합니다.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "전체 댓글",  count: counts.total,    icon: MessageSquare, bg: "bg-blue-50 border-blue-200",   color: "text-blue-600" },
          { label: "신고됨",     count: counts.reported, icon: AlertTriangle,  bg: "bg-amber-50 border-amber-200", color: "text-amber-600" },
          { label: "숨김 처리",  count: counts.hidden,   icon: EyeOff,         bg: "bg-slate-50 border-slate-200", color: "text-slate-600" },
          { label: "삭제됨",     count: counts.deleted,  icon: Trash2,         bg: "bg-red-50 border-red-200",     color: "text-red-600" },
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
              onClick={() => { setFilterStatus(s); setPage(1); setExpandedId(null); }}
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
        <Input
          className="ml-auto h-9 w-64 text-sm"
          placeholder="내용/작성자/콘텐츠 검색..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); setExpandedId(null); }}
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <h3 className="text-sm font-semibold text-slate-800">댓글 목록</h3>
            <CountDisplay total={filtered.length} />
          </div>
          <div className="flex items-center gap-2">
            {/* 범례 */}
            <div className="hidden sm:flex items-center gap-3 mr-2 text-[11px] text-slate-400">
              <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-100 border border-amber-300" />신고</span>
              <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-slate-100 border border-slate-300 opacity-50" />숨김/삭제</span>
            </div>
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
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left">
                <th className="px-5 py-3 text-xs font-semibold text-slate-500">작성자</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 w-[30%]">댓글 내용</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">관련 콘텐츠</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">상태</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500">신고</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">작성일</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-sm text-slate-400">
                    <MessageSquare className="mx-auto mb-3 h-10 w-10 opacity-20" />
                    검색 결과가 없습니다.
                  </td>
                </tr>
              ) : (
                paginated.flatMap((cmt) => {
                  const sc = statusConfig[cmt.status];
                  const isExpanded = expandedId === cmt.id;
                  const isDeleted = cmt.status === "DELETED";

                  return [
                    // ── 메인 행 ──────────────────────────────────────────────
                    <tr
                      key={cmt.id}
                      onClick={() => setExpandedId(isExpanded ? null : cmt.id)}
                      className={cn(
                        "cursor-pointer transition-colors",
                        rowBg[cmt.status],
                        isExpanded && "bg-indigo-50/50"
                      )}
                    >
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-slate-800">{cmt.authorNickname}</div>
                        {cmt.reportCount > 0 && (
                          <div className="mt-0.5 text-[11px] text-red-500 font-medium">신고 {cmt.reportCount}건</div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 max-w-0 w-[30%]">
                        <p className={cn(
                          "line-clamp-2 text-sm leading-snug",
                          isDeleted ? "text-slate-400 line-through" : "text-slate-700"
                        )}>
                          {cmt.content}
                        </p>
                        {cmt.reportReason && (
                          <p className="mt-1 text-[11px] text-amber-600 truncate">
                            사유: {cmt.reportReason}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 max-w-[160px]">
                        <p className="truncate text-xs text-slate-500">{cmt.postTitle}</p>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <Badge variant={sc.variant}>{sc.label}</Badge>
                      </td>
                      <td className="px-4 py-3.5 text-center tabular-nums">
                        {cmt.reportCount > 0
                          ? <span className="font-semibold text-red-600">{cmt.reportCount}</span>
                          : <span className="text-slate-300">—</span>
                        }
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(cmt.createdAt).toLocaleDateString("ko-KR")}
                      </td>
                      <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          {(cmt.status === "ACTIVE" || cmt.status === "REPORTED") && (
                            <>
                              <button
                                onClick={() => handleHide(cmt.id)}
                                className="flex items-center gap-0.5 rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                              >
                                <EyeOff className="h-3 w-3" /> 숨김
                              </button>
                              <button
                                onClick={() => handleDelete(cmt.id)}
                                className="flex items-center gap-0.5 rounded-md px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="h-3 w-3" /> 삭제
                              </button>
                            </>
                          )}
                          {cmt.status === "HIDDEN" && (
                            <>
                              <button
                                onClick={() => handleRestore(cmt.id)}
                                className="flex items-center gap-0.5 rounded-md px-2 py-1 text-xs font-medium text-green-600 hover:bg-green-50 transition-colors"
                              >
                                <RotateCcw className="h-3 w-3" /> 복원
                              </button>
                              <button
                                onClick={() => handleDelete(cmt.id)}
                                className="flex items-center gap-0.5 rounded-md px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="h-3 w-3" /> 삭제
                              </button>
                            </>
                          )}
                          {cmt.status === "DELETED" && (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                          {/* 펼치기/접기 */}
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : cmt.id)}
                            className="ml-1 rounded-md p-1 text-slate-300 hover:bg-slate-100 hover:text-slate-500 transition-colors"
                          >
                            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>,

                    // ── 확장 상세 행 ─────────────────────────────────────────
                    isExpanded && (
                      <tr key={`${cmt.id}-detail`} className="bg-indigo-50/30">
                        <td colSpan={7} className="px-5 py-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">전체 댓글 내용</p>
                              <p className={cn(
                                "text-sm leading-relaxed rounded-lg border border-slate-100 bg-white px-4 py-3",
                                isDeleted ? "text-slate-400 line-through" : "text-slate-700"
                              )}>
                                {cmt.content}
                              </p>
                              {cmt.reportReason && (
                                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                                  <span className="text-xs font-medium text-amber-700">신고 사유: </span>
                                  <span className="text-xs text-amber-700">{cmt.reportReason}</span>
                                </div>
                              )}
                              <p className="text-[11px] text-slate-400">
                                작성일: {new Date(cmt.createdAt).toLocaleString("ko-KR")} · 관련 콘텐츠: {cmt.postTitle}
                              </p>
                            </div>
                            <button
                              onClick={() => setExpandedId(null)}
                              className="shrink-0 rounded-md p-1 text-slate-300 hover:bg-slate-200 hover:text-slate-500"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ),
                  ].filter(Boolean);
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 pb-4">
          <PaginationBar total={filtered.length} page={page} pageSize={pageSize} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
}
