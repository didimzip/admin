"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Eye, EyeOff, Clock, Flame, Pencil, SquarePen, Settings2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockPosts, POST_CATEGORIES, type PostStatus, type Post } from "@/data/mock-data";
import { cn } from "@/lib/utils";
import { getAllPosts, publishScheduledPosts, hideExpiredPosts, deletePost } from "@/lib/post-store";
import { PaginationBar, CountDisplay } from "@/components/ui/pagination-bar";

const statusConfig: Record<PostStatus, { label: string; variant: "success" | "secondary" | "warning" | "destructive" }> = {
  PUBLISHED: { label: "게시중", variant: "success" },
  DRAFT: { label: "임시저장", variant: "secondary" },
  SCHEDULED: { label: "예약", variant: "warning" },
  HIDDEN: { label: "숨김", variant: "destructive" },
};

// ─── HOT Condition Types ──────────────────────────────────────────────────────

type HotOperator = "OR" | "AND";

interface HotConditions {
  viewCount: number;       // 0 = 비활성
  scrapCount: number;
  commentCount: number;
  operator: HotOperator;
}

const HOT_CONDITIONS_KEY = "didimzip_hot_conditions";

const DEFAULT_HOT: HotConditions = {
  viewCount: 1000,
  scrapCount: 0,
  commentCount: 0,
  operator: "OR",
};

function loadHotConditions(): HotConditions {
  if (typeof window === "undefined") return DEFAULT_HOT;
  try {
    const raw = localStorage.getItem(HOT_CONDITIONS_KEY);
    return raw ? { ...DEFAULT_HOT, ...JSON.parse(raw) } : DEFAULT_HOT;
  } catch {
    return DEFAULT_HOT;
  }
}

function saveHotConditions(c: HotConditions) {
  localStorage.setItem(HOT_CONDITIONS_KEY, JSON.stringify(c));
}

function computeIsHot(post: Post, cond: HotConditions): boolean {
  const checks: boolean[] = [];
  if (cond.viewCount > 0) checks.push(post.viewCount + post.virtualViewCount >= cond.viewCount);
  if (cond.scrapCount > 0) checks.push(post.scrapCount >= cond.scrapCount);
  if (cond.commentCount > 0) checks.push(post.commentCount >= cond.commentCount);
  if (checks.length === 0) return false;
  return cond.operator === "OR" ? checks.some(Boolean) : checks.every(Boolean);
}

// ─── HOT Settings Panel ───────────────────────────────────────────────────────

function HotSettingsPanel({
  conditions,
  onChange,
  onClose,
}: {
  conditions: HotConditions;
  onChange: (c: HotConditions) => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState<HotConditions>(conditions);

  const update = (key: keyof HotConditions, value: number | HotOperator) => {
    setLocal((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onChange(local);
    saveHotConditions(local);
    onClose();
  };

  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-red-500" />
          <span className="text-sm font-semibold text-slate-800">HOT 표시 조건 설정</span>
          <span className="text-xs text-slate-500">아래 조건을 충족하면 제목에 🔥 HOT 표시됩니다</span>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Operator */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">조건 결합 방식</label>
          <select
            value={local.operator}
            onChange={(e) => update("operator", e.target.value as HotOperator)}
            className="h-8 w-full cursor-pointer rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:outline-none"
          >
            <option value="OR">OR (하나라도 충족)</option>
            <option value="AND">AND (모두 충족)</option>
          </select>
        </div>

        {/* View Count */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">
            조회수 기준 <span className="text-slate-400">(0 = 비활성)</span>
          </label>
          <input
            type="number"
            min={0}
            value={local.viewCount}
            onChange={(e) => update("viewCount", Number(e.target.value))}
            className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
        </div>

        {/* Scrap Count */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">
            스크랩 기준 <span className="text-slate-400">(0 = 비활성)</span>
          </label>
          <input
            type="number"
            min={0}
            value={local.scrapCount}
            onChange={(e) => update("scrapCount", Number(e.target.value))}
            className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
        </div>

        {/* Comment Count */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">
            댓글 기준 <span className="text-slate-400">(0 = 비활성)</span>
          </label>
          <input
            type="number"
            min={0}
            value={local.commentCount}
            onChange={(e) => update("commentCount", Number(e.target.value))}
            className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs text-slate-500">
          현재: 조회수 {local.viewCount > 0 ? `≥ ${local.viewCount.toLocaleString()}` : "—"}
          {local.scrapCount > 0 && ` · 스크랩 ≥ ${local.scrapCount}`}
          {local.commentCount > 0 && ` · 댓글 ≥ ${local.commentCount}`}
          {" "}중 {local.operator === "OR" ? "하나라도" : "모두"} 충족 시 HOT
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-white"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PostsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<PostStatus | "ALL">("ALL");
  const [categoryFilter, setCategoryFilter] = useState("전체");
  const [search, setSearch] = useState("");
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deletedMockIds, setDeletedMockIds] = useState<Set<string>>(new Set());
  const [hotConditions, setHotConditions] = useState<HotConditions>(DEFAULT_HOT);
  const [showHotSettings, setShowHotSettings] = useState(false);

  const loadPosts = useCallback(() => {
    publishScheduledPosts();
    hideExpiredPosts();
    const stored = getAllPosts();
    setUserPosts(
      stored.map((s) => ({
        id: s.id,
        title: s.title,
        authorNickname: "관리자",
        status: s.status as PostStatus,
        category: s.category || "기타",
        viewCount: 0,
        virtualViewCount: 0,
        todayViewCount: 0,
        scrapCount: 0,
        commentCount: 0,
        isHot: false,
        scheduledAt: s.scheduledAt || null,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      }))
    );
  }, []);

  useEffect(() => {
    setHotConditions(loadHotConditions());
    loadPosts();

    const timers: ReturnType<typeof setTimeout>[] = [];
    const now = Date.now();
    getAllPosts().forEach((p) => {
      if (p.status === "SCHEDULED" && p.scheduledAt) {
        const delay = new Date(p.scheduledAt).getTime() - now;
        if (delay > 0) timers.push(setTimeout(loadPosts, delay));
      }
    });

    return () => timers.forEach(clearTimeout);
  }, [loadPosts]);

  const allPosts = useMemo(
    () => [...userPosts, ...mockPosts.filter((p) => !deletedMockIds.has(p.id))],
    [userPosts, deletedMockIds]
  );

  // Apply HOT conditions dynamically
  const allPostsWithHot = useMemo(
    () => allPosts.map((p) => ({ ...p, isHot: computeIsHot(p, hotConditions) })),
    [allPosts, hotConditions]
  );

  const filtered = useMemo(() => {
    return allPostsWithHot.filter((p) => {
      if (statusFilter !== "ALL" && p.status !== statusFilter) return false;
      if (categoryFilter !== "전체" && p.category !== categoryFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return p.title.toLowerCase().includes(q) || p.authorNickname.toLowerCase().includes(q);
      }
      return true;
    });
  }, [allPostsWithHot, statusFilter, categoryFilter, search]);

  const counts = useMemo(() => ({
    published: allPostsWithHot.filter((p) => p.status === "PUBLISHED").length,
    draft: allPostsWithHot.filter((p) => p.status === "DRAFT").length,
    scheduled: allPostsWithHot.filter((p) => p.status === "SCHEDULED").length,
    hidden: allPostsWithHot.filter((p) => p.status === "HIDDEN").length,
  }), [allPostsWithHot]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  function handleDeleteSelected() {
    selectedIds.forEach((id) => {
      if (id.startsWith("post_")) deletePost(id);
    });
    setUserPosts((prev) => prev.filter((p) => !selectedIds.has(p.id)));
    setDeletedMockIds((prev) => new Set([...prev, ...Array.from(selectedIds).filter((id) => !id.startsWith("post_"))]));
    setSelectedIds(new Set());
  }

  function handleDeleteAll() {
    allPosts.forEach((p) => { if (p.id.startsWith("post_")) deletePost(p.id); });
    setUserPosts([]);
    setDeletedMockIds(new Set(allPosts.filter((p) => !p.id.startsWith("post_")).map((p) => p.id)));
    setSelectedIds(new Set());
    setIsEditing(false);
  }

  function handleToggleSelectRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const allPageSelected = paginated.length > 0 && paginated.every((p) => selectedIds.has(p.id));

  function handleToggleSelectAll() {
    if (allPageSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginated.forEach((p) => next.delete(p.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => new Set([...prev, ...paginated.map((p) => p.id)]));
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">콘텐츠 관리</h2>
          <p className="mt-0.5 text-sm text-slate-500">콘텐츠를 관리하고 예약 게시, HOT 지정 등을 설정합니다.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHotSettings((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium transition-colors",
              showHotSettings
                ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            )}
          >
            <Settings2 className="h-3.5 w-3.5" /> HOT 조건
          </button>
          <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-700">
            <Link href="/posts/new"><Pencil className="mr-1.5 h-4 w-4" /> 콘텐츠 등록</Link>
          </Button>
        </div>
      </div>

      {/* HOT Settings Panel */}
      {showHotSettings && (
        <HotSettingsPanel
          conditions={hotConditions}
          onChange={setHotConditions}
          onClose={() => setShowHotSettings(false)}
        />
      )}

      {/* Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "게시중", count: counts.published, icon: Eye, bg: "bg-green-50 border-green-200", color: "text-green-600", status: "PUBLISHED" as const },
          { label: "임시저장", count: counts.draft, icon: FileText, bg: "bg-slate-50 border-slate-200", color: "text-slate-600", status: "DRAFT" as const },
          { label: "예약", count: counts.scheduled, icon: Clock, bg: "bg-amber-50 border-amber-200", color: "text-amber-600", status: "SCHEDULED" as const },
          { label: "숨김", count: counts.hidden, icon: EyeOff, bg: "bg-red-50 border-red-200", color: "text-red-600", status: "HIDDEN" as const },
        ].map((card) => {
          const Icon = card.icon;
          const isActive = statusFilter === card.status;
          return (
            <button
              key={card.label}
              onClick={() => { setStatusFilter(isActive ? "ALL" : card.status); setPage(1); }}
              className={cn(
                "flex items-center gap-3 rounded-xl border bg-white p-4 text-left transition-all hover:shadow-md",
                isActive ? "border-indigo-400 ring-2 ring-indigo-200" : "border-slate-200"
              )}
            >
              <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border", card.bg)}>
                <Icon className={cn("h-5 w-5", card.color)} />
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
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as PostStatus | "ALL"); setPage(1); }}>
          <SelectTrigger className="h-9 w-36 text-sm"><SelectValue placeholder="상태" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">전체 상태</SelectItem>
            <SelectItem value="PUBLISHED">게시중</SelectItem>
            <SelectItem value="DRAFT">임시저장</SelectItem>
            <SelectItem value="SCHEDULED">예약</SelectItem>
            <SelectItem value="HIDDEN">숨김</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
          <SelectTrigger className="h-9 w-36 text-sm"><SelectValue placeholder="카테고리" /></SelectTrigger>
          <SelectContent>
            {POST_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input className="h-9 w-64 text-sm" placeholder="제목 또는 작성자 검색..." value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <h3 className="text-sm font-semibold text-slate-800">콘텐츠 목록</h3>
            <CountDisplay total={filtered.length} />
          </div>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleDeleteSelected}
                disabled={selectedIds.size === 0}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  selectedIds.size > 0
                    ? "bg-red-50 text-red-600 hover:bg-red-100"
                    : "cursor-not-allowed text-slate-300"
                )}
              >
                선택삭제 {selectedIds.size > 0 && `(${selectedIds.size})`}
              </button>
              <button
                onClick={handleDeleteAll}
                className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition-colors"
              >
                전체삭제
              </button>
              <button
                onClick={() => { setIsEditing(false); setSelectedIds(new Set()); }}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                완료
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
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
              <button
                onClick={() => { setIsEditing(true); setSelectedIds(new Set()); }}
                className="flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <SquarePen className="h-3 w-3" /> 편집
              </button>
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left">
                {isEditing && (
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allPageSelected}
                      onChange={handleToggleSelectAll}
                      className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-indigo-600"
                    />
                  </th>
                )}
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 w-[38%]">제목</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">작성자</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">카테고리</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">상태</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">조회수</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">스크랩</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">댓글</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">작성일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={isEditing ? 9 : 8} className="py-16 text-center">
                    <FileText className="mx-auto mb-3 h-10 w-10 text-slate-200" />
                    <p className="text-sm text-slate-400">콘텐츠가 없습니다.</p>
                  </td>
                </tr>
              ) : (
                paginated.map((post) => {
                  const sc = statusConfig[post.status];
                  const isSelected = selectedIds.has(post.id);
                  return (
                    <tr
                      key={post.id}
                      className={cn(
                        "transition-colors hover:bg-slate-50/70",
                        isEditing ? "cursor-default" : "cursor-pointer",
                        isSelected && "bg-indigo-50/50"
                      )}
                      onClick={() => isEditing ? handleToggleSelectRow(post.id) : router.push(`/posts/${post.id}`)}
                    >
                      {isEditing && (
                        <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectRow(post.id)}
                            className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-indigo-600"
                          />
                        </td>
                      )}
                      <td className="px-5 py-3.5 font-medium text-slate-800">
                        <div className="flex items-center gap-2">
                          {post.isHot && <Flame className="h-3.5 w-3.5 shrink-0 text-red-500" />}
                          <span className="line-clamp-1">{post.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">{post.authorNickname}</td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600">
                          {post.category}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {post.status === "SCHEDULED" && post.scheduledAt ? (() => {
                          const diff = Math.ceil((new Date(post.scheduledAt).getTime() - Date.now()) / 86400000);
                          const dLabel = diff <= 0 ? "D-0" : `D-${diff}`;
                          return <Badge variant="warning">예약 {dLabel}</Badge>;
                        })() : (
                          <Badge variant={sc.variant}>{sc.label}</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right tabular-nums text-slate-600">
                        {(post.viewCount + post.virtualViewCount).toLocaleString()}
                        {post.todayViewCount > 0 && (
                          <span className="ml-1 text-xs text-emerald-600 font-medium">(+{post.todayViewCount})</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right tabular-nums text-slate-600">{post.scrapCount}</td>
                      <td className="px-4 py-3.5 text-right tabular-nums text-slate-600">{post.commentCount}</td>
                      <td className="px-4 py-3.5 text-slate-500">{new Date(post.createdAt).toLocaleDateString("ko-KR")}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 pb-4">
          <PaginationBar total={filtered.length} page={page} pageSize={pageSize}
            onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
}
