"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Eye, EyeOff, Clock, Flame, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockPosts, POST_CATEGORIES, type PostStatus, type Post } from "@/data/mock-data";
import { cn } from "@/lib/utils";
import { getAllPosts, publishScheduledPosts } from "@/lib/post-store";
import { PaginationBar } from "@/components/ui/pagination-bar";

const statusConfig: Record<PostStatus, { label: string; variant: "success" | "secondary" | "warning" | "destructive" }> = {
  PUBLISHED: { label: "게시중", variant: "success" },
  DRAFT: { label: "임시저장", variant: "secondary" },
  SCHEDULED: { label: "예약", variant: "warning" },
  HIDDEN: { label: "숨김", variant: "destructive" },
};

export default function PostsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<PostStatus | "ALL">("ALL");
  const [categoryFilter, setCategoryFilter] = useState("전체");
  const [search, setSearch] = useState("");
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    const loadPosts = () => {
      publishScheduledPosts();
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
          scrapCount: 0,
          commentCount: 0,
          isHot: false,
          scheduledAt: s.scheduledAt || null,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
        }))
      );
    };

    // 최초 로드 (이미 지난 예약 즉시 처리)
    loadPosts();

    // 남은 예약 게시물마다 정확한 시각에 setTimeout 하나씩 등록
    const timers: ReturnType<typeof setTimeout>[] = [];
    const now = Date.now();
    getAllPosts().forEach((p) => {
      if (p.status === "SCHEDULED" && p.scheduledAt) {
        const delay = new Date(p.scheduledAt).getTime() - now;
        if (delay > 0) timers.push(setTimeout(loadPosts, delay));
      }
    });

    return () => timers.forEach(clearTimeout);
  }, []);

  const allPosts = useMemo(() => [...userPosts, ...mockPosts], [userPosts]);

  const filtered = useMemo(() => {
    return allPosts.filter((p) => {
      if (statusFilter !== "ALL" && p.status !== statusFilter) return false;
      if (categoryFilter !== "전체" && p.category !== categoryFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return p.title.toLowerCase().includes(q) || p.authorNickname.toLowerCase().includes(q);
      }
      return true;
    });
  }, [allPosts, statusFilter, categoryFilter, search]);

  const counts = useMemo(() => ({
    published: allPosts.filter((p) => p.status === "PUBLISHED").length,
    draft: allPosts.filter((p) => p.status === "DRAFT").length,
    scheduled: allPosts.filter((p) => p.status === "SCHEDULED").length,
    hidden: allPosts.filter((p) => p.status === "HIDDEN").length,
  }), [allPosts]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">게시물 관리</h2>
          <p className="mt-0.5 text-sm text-slate-500">게시물을 관리하고 예약 게시, HOT 지정 등을 설정합니다.</p>
        </div>
        <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-700">
          <Link href="/posts/new"><Pencil className="mr-1.5 h-4 w-4" /> 콘텐츠 등록</Link>
        </Button>
      </div>

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
          <h3 className="text-sm font-semibold text-slate-800">게시물 목록</h3>
          <span className="text-xs text-slate-500">총 {filtered.length.toLocaleString()}건</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left">
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
                  <td colSpan={8} className="py-16 text-center">
                    <FileText className="mx-auto mb-3 h-10 w-10 text-slate-200" />
                    <p className="text-sm text-slate-400">게시물이 없습니다.</p>
                  </td>
                </tr>
              ) : (
                paginated.map((post) => {
                  const sc = statusConfig[post.status];
                  return (
                    <tr
                      key={post.id}
                      className="cursor-pointer transition-colors hover:bg-slate-50/70"
                      onClick={() => router.push(`/posts/${post.id}`)}
                    >
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
                        <Badge variant={sc.variant}>{sc.label}</Badge>
                      </td>
                      <td className="px-4 py-3.5 text-right tabular-nums text-slate-600">
                        {(post.viewCount + post.virtualViewCount).toLocaleString()}
                        {post.virtualViewCount > 0 && <span className="ml-1 text-xs text-slate-400">(+{post.virtualViewCount})</span>}
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
            onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
        </div>
      </div>
    </div>
  );
}
