"use client";

import { useState, useMemo } from "react";
import { ImageIcon, Plus, ExternalLink, Eye, EyeOff, SquarePen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mockBanners, BANNER_POSITIONS } from "@/data/mock-data";
import { PaginationBar, CountDisplay } from "@/components/ui/pagination-bar";
import { cn } from "@/lib/utils";

export default function BannersPage() {
  const [localBanners, setLocalBanners] = useState(mockBanners);
  const [showActive, setShowActive] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    if (showActive === "ACTIVE") return localBanners.filter((b) => b.isActive);
    if (showActive === "INACTIVE") return localBanners.filter((b) => !b.isActive);
    return localBanners;
  }, [localBanners, showActive]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const activeCount = localBanners.filter((b) => b.isActive).length;
  const totalClicks = localBanners.reduce((a, b) => a + b.clickCount, 0);

  const handleToggleSelectAll = () => {
    const pageIds = paginated.map((b) => b.id);
    const allSelected = pageIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDeleteSelected = () => {
    setLocalBanners((prev) => prev.filter((b) => !selectedIds.has(b.id)));
    setSelectedIds(new Set());
    setPage(1);
  };

  const handleDeleteAll = () => {
    setLocalBanners([]);
    setSelectedIds(new Set());
    setPage(1);
  };

  const allPageSelected = paginated.length > 0 && paginated.every((b) => selectedIds.has(b.id));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">배너 관리</h2>
          <p className="mt-0.5 text-sm text-slate-500">배너 노출 위치와 기간을 설정하고 성과를 확인합니다.</p>
        </div>
        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="mr-1.5 h-4 w-4" /> 배너 등록
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "전체 배너", value: localBanners.length, icon: ImageIcon, bg: "bg-blue-50 border-blue-200", color: "text-blue-600" },
          { label: "노출 중", value: activeCount, icon: Eye, bg: "bg-green-50 border-green-200", color: "text-green-600" },
          { label: "총 클릭 수", value: totalClicks.toLocaleString(), icon: ExternalLink, bg: "bg-purple-50 border-purple-200", color: "text-purple-600" },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border", card.bg)}>
                <Icon className={cn("h-5 w-5", card.color)} />
              </div>
              <div>
                <p className="text-xs text-slate-500">{card.label}</p>
                <p className="text-2xl font-bold text-slate-900">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 w-fit">
        {(["ALL", "ACTIVE", "INACTIVE"] as const).map((s) => (
          <button
            key={s}
            onClick={() => { setShowActive(s); setPage(1); }}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              showActive === s ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-700"
            )}
          >
            {s === "ALL" ? "전체" : s === "ACTIVE" ? "노출 중" : "종료"}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <h3 className="text-sm font-semibold text-slate-800">배너 목록</h3>
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
                선택삭제{selectedIds.size > 0 && ` (${selectedIds.size})`}
              </button>
              <button
                onClick={handleDeleteAll}
                className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
              >
                전체삭제
              </button>
              <button
                onClick={() => { setIsEditing(false); setSelectedIds(new Set()); }}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
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
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                <SquarePen className="h-3.5 w-3.5" /> 편집
              </button>
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left">
                {isEditing && (
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allPageSelected}
                      onChange={handleToggleSelectAll}
                      className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-indigo-600"
                    />
                  </th>
                )}
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 w-[25%]">배너명</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">위치</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">상태</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">노출 기간</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">노출 수</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">클릭 수</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">CTR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={isEditing ? 8 : 7} className="py-16 text-center text-sm text-slate-400">배너가 없습니다.</td>
                </tr>
              ) : (
                paginated.map((banner) => {
                  const ctr = banner.impressionCount > 0 ? ((banner.clickCount / banner.impressionCount) * 100).toFixed(1) : "0";
                  const isSelected = selectedIds.has(banner.id);
                  return (
                    <tr
                      key={banner.id}
                      onClick={() => isEditing && handleToggleSelectRow(banner.id)}
                      className={cn(
                        "transition-colors hover:bg-slate-50/70",
                        isEditing && "cursor-pointer",
                        isSelected && "bg-indigo-50/60"
                      )}
                    >
                      {isEditing && (
                        <td className="px-4 py-3.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectRow(banner.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-indigo-600"
                          />
                        </td>
                      )}
                      <td className="px-5 py-3.5 font-medium text-slate-800">{banner.title}</td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600">
                          {BANNER_POSITIONS[banner.position]}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {banner.isActive ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700">
                            <Eye className="h-3 w-3" /> 노출 중
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                            <EyeOff className="h-3 w-3" /> 종료
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-500">{banner.startDate} ~ {banner.endDate}</td>
                      <td className="px-4 py-3.5 text-right tabular-nums text-slate-600">{banner.impressionCount.toLocaleString()}</td>
                      <td className="px-4 py-3.5 text-right tabular-nums text-slate-600">{banner.clickCount.toLocaleString()}</td>
                      <td className="px-4 py-3.5 text-right tabular-nums font-medium text-slate-700">{ctr}%</td>
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
