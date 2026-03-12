"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, SquarePen } from "lucide-react";
import { RiGroupLine, RiTimeLine, RiCheckDoubleLine, RiRadarLine, RiHourglassLine } from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useToast } from "@/lib/toast-context";
import { PaginationBar, CountDisplay } from "@/components/ui/pagination-bar";
import { recordLog } from "@/lib/audit-log-store";
import { getAllStudies, deleteStudies, restoreStudies } from "@/lib/study-store";
import {
  type Study,
  type StudyStatus,
  type StudyMethod,
} from "@/data/mock-data";

// ─── Config ──────────────────────────────────────────────────────────────────

const tabStatuses: Record<string, StudyStatus[]> = {
  ALL: ["PENDING", "RECRUITING", "IN_PROGRESS", "COMPLETED", "CANCELLED", "HIDDEN"],
  PENDING: ["PENDING"],
  RECRUITING: ["RECRUITING"],
  IN_PROGRESS: ["IN_PROGRESS"],
  COMPLETED: ["COMPLETED"],
  CANCELLED_HIDDEN: ["CANCELLED", "HIDDEN"],
};

const tabLabels: { key: string; label: string }[] = [
  { key: "ALL", label: "전체" },
  { key: "PENDING", label: "승인대기" },
  { key: "RECRUITING", label: "모집중" },
  { key: "IN_PROGRESS", label: "진행중" },
  { key: "COMPLETED", label: "완료" },
  { key: "CANCELLED_HIDDEN", label: "취소·숨김" },
];

const methodConfig: Record<
  StudyMethod,
  { label: string; variant: "default" | "warning" | "secondary" }
> = {
  ONLINE: { label: "온라인", variant: "default" },
  OFFLINE: { label: "오프라인", variant: "warning" },
  HYBRID: { label: "혼합", variant: "secondary" },
};

const statusConfig: Record<
  StudyStatus,
  { label: string; variant: "default" | "success" | "secondary" | "destructive" | "warning" }
> = {
  PENDING: { label: "승인대기", variant: "warning" },
  RECRUITING: { label: "모집중", variant: "default" },
  IN_PROGRESS: { label: "진행중", variant: "success" },
  COMPLETED: { label: "완료", variant: "secondary" },
  CANCELLED: { label: "취소", variant: "destructive" },
  HIDDEN: { label: "숨김", variant: "secondary" },
};

// ─── Delete Confirmation Modal ──────────────────────────────────────────────

function DeleteConfirmModal({
  count,
  onConfirm,
  onCancel,
}: {
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
        <div className="px-5 pt-5 pb-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-900">스터디 삭제</h3>
          <p className="text-sm text-slate-600">선택한 {count}개의 스터디를 삭제하시겠습니까?</p>
          <p className="rounded-lg bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-600">
            삭제 후 하단 토스트에서 실행취소할 수 있습니다.
          </p>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3.5">
          <button
            onClick={onCancel}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function StudiesPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [studies, setStudies] = useState<Study[]>([]);
  const [tab, setTab] = useState<string>(() => {
    const all = getAllStudies();
    return all.some((s) => s.status === "PENDING") ? "PENDING" : "ALL";
  });
  const [search, setSearch] = useState("");
  const [categoryFilter] = useState("전체");
  const [methodFilter] = useState("전체");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [editMode, setEditMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // ── Load ──

  useEffect(() => {
    setStudies(getAllStudies());
  }, []);

  function reload() {
    setStudies(getAllStudies());
  }

  // ── Summary counts ──

  const summaryCounts = useMemo(() => {
    const total = studies.length;
    const pending = studies.filter((s) => s.status === "PENDING").length;
    const recruiting = studies.filter((s) => s.status === "RECRUITING").length;
    const inProgress = studies.filter((s) => s.status === "IN_PROGRESS").length;
    const completed = studies.filter((s) => s.status === "COMPLETED").length;
    return { total, pending, recruiting, inProgress, completed };
  }, [studies]);

  // ── Filtering ──

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of tabLabels) {
      const statuses = tabStatuses[t.key];
      counts[t.key] = studies.filter((s) => statuses.includes(s.status)).length;
    }
    return counts;
  }, [studies]);

  const filtered = useMemo(() => {
    const statuses = tabStatuses[tab];
    return studies.filter((s) => {
      if (!statuses.includes(s.status)) return false;
      if (categoryFilter !== "전체" && s.category !== categoryFilter) return false;
      if (methodFilter !== "전체") {
        const mKey =
          methodFilter === "온라인"
            ? "ONLINE"
            : methodFilter === "오프라인"
            ? "OFFLINE"
            : "HYBRID";
        if (s.method !== mKey) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        return (
          s.title.toLowerCase().includes(q) ||
          s.authorNickname.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [studies, tab, categoryFilter, methodFilter, search]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  // ── Selection ──

  const allPageSelected =
    paginated.length > 0 && paginated.every((s) => selected.has(s.id));

  function handleToggleSelectAll() {
    if (allPageSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        paginated.forEach((s) => next.delete(s.id));
        return next;
      });
    } else {
      setSelected(
        (prev) => new Set([...prev, ...paginated.map((s) => s.id)])
      );
    }
  }

  function handleToggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // ── Delete ──

  function handleDeleteSelected() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setShowDeleteModal(true);
  }

  function confirmDelete() {
    const ids = Array.from(selected);
    const deleted = studies.filter((s) => ids.includes(s.id));
    const titles = deleted.map((s) => s.title).join(", ");

    deleteStudies(ids);
    recordLog(
      "STUDY_DELETE",
      `스터디 삭제 (${ids.length}개): ${titles.slice(0, 80)}${titles.length > 80 ? "..." : ""}`,
      { targetType: "STUDY" }
    );
    setSelected(new Set());
    setShowDeleteModal(false);
    reload();
    showToast(`${ids.length}개 스터디가 삭제되었습니다.`, {
      onUndo: () => { restoreStudies(deleted); reload(); },
    });
  }

  // ── Helpers ──

  function getDday(dateStr: string): { label: string; variant: "default" | "warning" | "destructive" | "secondary" } {
    const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
    if (diff < 0) return { label: "마감", variant: "secondary" };
    if (diff === 0) return { label: "D-0", variant: "destructive" };
    if (diff <= 3) return { label: `D-${diff}`, variant: "warning" };
    return { label: `D-${diff}`, variant: "default" };
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("ko-KR");
  }


  // ── Render ──

  return (
    <div className="space-y-5">
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <DeleteConfirmModal
          count={selected.size}
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">스터디 관리</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            스터디 모집글을 관리하고 진행 상태를 확인합니다.
          </p>
        </div>
        <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-700">
          <Link href="/studies/new">
            <Plus className="mr-1.5 h-4 w-4" /> 스터디 등록
          </Link>
        </Button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid gap-3 sm:grid-cols-5">
        {[
          { label: "전체 스터디", count: summaryCounts.total, icon: RiGroupLine, bg: "bg-blue-50 border-blue-200", color: "text-blue-600" },
          { label: "승인대기", count: summaryCounts.pending, icon: RiHourglassLine, bg: "bg-amber-50 border-amber-200", color: "text-amber-600" },
          { label: "모집중", count: summaryCounts.recruiting, icon: RiRadarLine, bg: "bg-indigo-50 border-indigo-200", color: "text-indigo-600" },
          { label: "진행중", count: summaryCounts.inProgress, icon: RiTimeLine, bg: "bg-green-50 border-green-200", color: "text-green-600" },
          { label: "완료", count: summaryCounts.completed, icon: RiCheckDoubleLine, bg: "bg-slate-50 border-slate-200", color: "text-slate-600" },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="flex items-center gap-3 rounded-xl border bg-white p-4 text-left"
            >
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

      {/* Filters: Tab + Search */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {tabLabels.map((t) => {
            const isActive = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => {
                  setTab(t.key);
                  setPage(1);
                  setEditMode(false);
                  setSelected(new Set());
                }}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  isActive ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-700"
                )}
              >
                {t.label}
                {t.key === "PENDING" && tabCounts.PENDING > 0 && (
                  <span className="ml-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white">
                    {tabCounts.PENDING}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <Input
          placeholder="제목, 작성자로 검색..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="ml-auto h-9 w-64 text-sm"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Table header bar */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <h3 className="text-sm font-semibold text-slate-800">
              스터디 목록
            </h3>
            <CountDisplay total={filtered.length} />
          </div>
          {editMode ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelected(new Set(filtered.map((s) => s.id)))}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                전체선택
              </button>
              <button
                onClick={handleDeleteSelected}
                disabled={selected.size === 0}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  selected.size > 0
                    ? "bg-red-50 text-red-600 hover:bg-red-100"
                    : "cursor-not-allowed text-slate-300"
                )}
              >
                삭제 {selected.size > 0 && `(${selected.size})`}
              </button>
              <button
                onClick={() => {
                  setEditMode(false);
                  setSelected(new Set());
                }}
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
                onClick={() => {
                  setEditMode(true);
                  setSelected(new Set());
                }}
                className="flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <SquarePen className="h-3 w-3" />
                편집
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left">
                {editMode && (
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allPageSelected}
                      onChange={handleToggleSelectAll}
                      className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-indigo-600"
                    />
                  </th>
                )}
                <th className="px-5 py-3 text-xs font-semibold text-slate-500">제목</th>
                <th className="whitespace-nowrap px-3 py-3 text-xs font-semibold text-slate-500">작성자</th>
                <th className="whitespace-nowrap px-3 py-3 text-xs font-semibold text-slate-500">분야</th>
                <th className="whitespace-nowrap px-3 py-3 text-xs font-semibold text-slate-500">방식</th>
                <th className="whitespace-nowrap px-3 py-3 text-xs font-semibold text-slate-500">인원</th>
                <th className="whitespace-nowrap px-3 py-3 text-xs font-semibold text-slate-500">모집마감</th>
                <th className="whitespace-nowrap px-3 py-3 text-xs font-semibold text-slate-500">상태</th>
                <th className="whitespace-nowrap px-3 py-3 text-right text-xs font-semibold text-slate-500">조회</th>
                <th className="whitespace-nowrap px-3 py-3 text-xs font-semibold text-slate-500">등록일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginated.length === 0 ? (
                <tr>
                  <td
                    colSpan={editMode ? 10 : 9}
                    className="py-20 text-center"
                  >
                    <RiGroupLine className="mx-auto mb-3 h-14 w-14 text-slate-900/20" />
                    <p className="text-sm font-medium text-slate-400">
                      스터디가 없습니다.
                    </p>
                    <p className="mt-1 text-xs text-slate-300">
                      조건을 변경하거나 새 스터디를 등록해 주세요.
                    </p>
                  </td>
                </tr>
              ) : (
                paginated.map((study) => {
                  const sc = statusConfig[study.status];
                  const mc = methodConfig[study.method];
                  const isFull =
                    study.currentMembers >= study.maxMembers;
                  const dday = getDday(study.recruitEndDate);
                  const isSelected = selected.has(study.id);

                  return (
                    <tr
                      key={study.id}
                      onClick={() => { if (editMode) handleToggleRow(study.id); else router.push(`/studies/${study.id}`); }}
                      className={cn(
                        "transition-colors hover:bg-slate-50/70",
                        !editMode && "cursor-pointer",
                        isSelected && "bg-indigo-50/50"
                      )}
                    >
                      {editMode && (
                        <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleRow(study.id)}
                            className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-indigo-600"
                          />
                        </td>
                      )}
                      {/* 제목 */}
                      <td className="px-5 py-3.5 font-medium text-slate-800">
                        <div className="line-clamp-1">{study.title}</div>
                      </td>
                      {/* 작성자 */}
                      <td className="whitespace-nowrap px-3 py-3.5 text-slate-600">
                        {study.authorNickname}
                      </td>
                      {/* 분야 */}
                      <td className="whitespace-nowrap px-3 py-3.5">
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600">
                          {study.category}
                        </span>
                      </td>
                      {/* 방식 */}
                      <td className="whitespace-nowrap px-3 py-3.5">
                        <Badge variant={mc.variant}>{mc.label}</Badge>
                      </td>
                      {/* 인원 */}
                      <td className="whitespace-nowrap px-3 py-3.5">
                        <span
                          className={cn(
                            "text-sm tabular-nums",
                            isFull
                              ? "font-semibold text-red-600"
                              : "text-slate-600"
                          )}
                        >
                          {study.currentMembers}/{study.maxMembers}
                        </span>
                      </td>
                      {/* 모집마감 + D-day */}
                      <td className="whitespace-nowrap px-3 py-3.5">
                        <div className="text-sm text-slate-600">
                          {formatDate(study.recruitEndDate)}
                        </div>
                        {study.status === "RECRUITING" && (
                          <Badge variant={dday.variant} className="mt-0.5 text-[10px] px-1.5 py-0">
                            {dday.label}
                          </Badge>
                        )}
                      </td>
                      {/* 상태 */}
                      <td className="whitespace-nowrap px-3 py-3.5">
                        <Badge variant={sc.variant}>{sc.label}</Badge>
                      </td>
                      {/* 조회수 */}
                      <td className="whitespace-nowrap px-3 py-3.5 text-right tabular-nums text-slate-500">
                        {study.viewCount.toLocaleString()}
                      </td>
                      {/* 등록일 */}
                      <td className="whitespace-nowrap px-3 py-3.5 text-slate-500">
                        {formatDate(study.createdAt)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-5 pb-4">
          <PaginationBar
            total={filtered.length}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  );
}
