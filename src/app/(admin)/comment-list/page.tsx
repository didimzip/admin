"use client";

import { useState, useMemo } from "react";
import {
  Eye,
  EyeOff,
  Search,
  RotateCcw,
  MoreHorizontal,
} from "lucide-react";
import { useToast } from "@/lib/toast-context";
import { recordLog } from "@/lib/audit-log-store";
import { Input } from "@/components/ui/input";
import { PaginationBar, CountDisplay } from "@/components/ui/pagination-bar";
import { cn } from "@/lib/utils";
import {
  getAllComments,
  updateCommentStatus,
  resetComments,
} from "@/lib/comment-store";
import type { Comment, CommentStatus } from "@/data/mock-data";

// ─── 타입 & 설정 ──────────────────────────────────────────────────────────────

type CommentFilterStatus = "ALL" | Exclude<CommentStatus, "DELETED">;

const COMMENT_STATUS_CONFIG: Record<Exclude<CommentStatus, "DELETED">, { label: string; chip: string }> = {
  ACTIVE:   { label: "정상",   chip: "bg-green-100 text-green-700" },
  REPORTED: { label: "신고됨", chip: "bg-amber-100 text-amber-700" },
  HIDDEN:   { label: "숨김",   chip: "bg-slate-100 text-slate-500" },
};

// ─── 메인 페이지 ──────────────────────────────────────────────────────────────

export default function CommentListPage() {
  const { showToast } = useToast();
  const [comments, setComments] = useState<Comment[]>(() => getAllComments());
  const [filterStatus, setFilterStatus] = useState<CommentFilterStatus>("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showMenu, setShowMenu] = useState(false);

  const reload = () => setComments(getAllComments());

  const visibleComments = useMemo(() => comments.filter((c) => c.status !== "DELETED"), [comments]);

  const counts = useMemo(() => ({
    total:    visibleComments.length,
    active:   visibleComments.filter((c) => c.status === "ACTIVE").length,
    reported: visibleComments.filter((c) => c.status === "REPORTED").length,
    hidden:   visibleComments.filter((c) => c.status === "HIDDEN").length,
  }), [visibleComments]);

  const filtered = useMemo(() => {
    return visibleComments.filter((c) => {
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
  }, [visibleComments, filterStatus, search]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const handleStatusChange = (id: string, status: CommentStatus) => {
    updateCommentStatus(id, status);
    reload();
    if (status === "HIDDEN") {
      showToast("댓글이 숨김 처리되었습니다.");
      recordLog("COMMENT_HIDE", `댓글 숨김 처리: ${id}`, { targetType: "comment", targetId: id });
    } else if (status === "ACTIVE") {
      showToast("댓글이 복원되었습니다.");
      recordLog("COMMENT_RESTORE", `댓글 복원: ${id}`, { targetType: "comment", targetId: id });
    }
  };

  return (
    <div className="space-y-5">
      {/* ── 페이지 헤더 ── */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">댓글 관리</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            전체 댓글을 조회하고 관리합니다.
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
                    resetComments();
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

      {/* ── 필터 ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {(["ALL", "ACTIVE", "REPORTED", "HIDDEN"] as CommentFilterStatus[]).map((s) => {
            const countMap: Record<string, number> = { ALL: counts.total, ACTIVE: counts.active, REPORTED: counts.reported, HIDDEN: counts.hidden };
            const labelMap: Record<string, string> = { ALL: "전체", ACTIVE: "정상", REPORTED: "신고됨", HIDDEN: "숨김" };
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
                <span className={cn("ml-1 tabular-nums", filterStatus === s ? "text-indigo-200" : "text-slate-400")}>
                  {countMap[s]}
                </span>
                {s === "REPORTED" && counts.reported > 0 && filterStatus !== s && (
                  <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-red-500" />
                )}
              </button>
            );
          })}
        </div>
        <Input
          className="ml-auto h-9 w-64 text-sm"
          placeholder="댓글 내용/작성자/게시글 검색..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {/* ── 테이블 ── */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <div className="flex items-center gap-2.5">
            <h3 className="text-sm font-semibold text-slate-800">댓글 목록</h3>
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
          <table className="w-full min-w-[800px] table-fixed text-sm">
            <colgroup>
              <col className="w-[90px]" />
              <col className="w-[90px]" />
              <col className="w-[200px]" />
              <col className="w-[280px]" />
              <col className="w-[80px]" />
              <col className="w-[80px]" />
              <col className="w-[100px]" />
            </colgroup>
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">작성일</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">작성자</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">원본 게시글</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">댓글 내용</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">신고</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">상태</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-sm text-slate-400">
                    <Search className="mx-auto mb-3 h-10 w-10 opacity-20" />
                    검색 결과가 없습니다.
                  </td>
                </tr>
              ) : (
                paginated.map((comment) => {
                  const status = comment.status as Exclude<CommentStatus, "DELETED">;
                  const sc = COMMENT_STATUS_CONFIG[status];
                  return (
                    <tr key={comment.id} className="transition-colors hover:bg-slate-50">
                      <td className="px-4 py-3.5 text-xs text-slate-500 tabular-nums">
                        {new Date(comment.createdAt).toLocaleDateString("ko-KR")}
                      </td>
                      <td className="overflow-hidden px-4 py-3.5">
                        <span className="truncate text-sm font-medium text-slate-800">{comment.authorNickname}</span>
                      </td>
                      <td className="overflow-hidden px-4 py-3.5">
                        <a href={`/posts/${comment.postId}`} target="_blank" rel="noopener noreferrer" className="line-clamp-1 text-sm text-indigo-600 hover:underline">
                          {comment.postTitle}
                        </a>
                      </td>
                      <td className="overflow-hidden px-4 py-3.5">
                        <p className="line-clamp-1 text-sm text-slate-700">{comment.content}</p>
                        {comment.reportReason && (
                          <p className="mt-0.5 text-[10px] text-amber-600">사유: {comment.reportReason}</p>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {comment.reportCount > 0 ? (
                          <span className="text-xs font-medium text-red-500">{comment.reportCount}건</span>
                        ) : (
                          <span className="text-xs text-slate-300">&mdash;</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={cn("inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium", sc.chip)}>
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {comment.status === "HIDDEN" ? (
                          <button onClick={() => handleStatusChange(comment.id, "ACTIVE")} title="복원" className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors">
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <button onClick={() => handleStatusChange(comment.id, "HIDDEN")} title="숨김" className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors">
                            <EyeOff className="h-3.5 w-3.5" />
                          </button>
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
          <PaginationBar total={filtered.length} page={page} pageSize={pageSize} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
}
