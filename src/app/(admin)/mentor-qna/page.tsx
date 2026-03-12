"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Eye, EyeOff, SquarePen } from "lucide-react";
import {
  RiQuestionAnswerLine,
  RiTimeLine,
  RiCheckLine,
  RiCloseCircleLine,
  RiAlertLine,
} from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useToast } from "@/lib/toast-context";
import { PaginationBar, CountDisplay } from "@/components/ui/pagination-bar";
import { recordLog } from "@/lib/audit-log-store";
import { getAllQuestions, deleteQuestions, restoreQuestions } from "@/lib/mentor-qna-store";
import {
  MENTOR_CATEGORIES,
  type MentorQuestion,
  type QuestionStatus,
} from "@/data/mock-data";

// ─── Constants ───────────────────────────────────────────────────────────────

const PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50];

type TabValue = "ALL" | QuestionStatus;

const TABS: { label: string; value: TabValue }[] = [
  { label: "전체", value: "ALL" },
  { label: "답변 대기", value: "WAITING" },
  { label: "답변 완료", value: "ANSWERED" },
  { label: "종료", value: "CLOSED" },
];

const STATUS_BADGE: Record<
  QuestionStatus,
  { label: string; variant: "warning" | "success" | "secondary" }
> = {
  WAITING: { label: "답변 대기", variant: "warning" },
  ANSWERED: { label: "답변 완료", variant: "success" },
  CLOSED: { label: "종료", variant: "secondary" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatResponseTime(createdAt: string, answeredAt: string): string {
  const created = new Date(createdAt).getTime();
  const answered = new Date(answeredAt).getTime();
  const diffMs = answered - created;
  if (diffMs < 0) return "";
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 60) return `${diffMinutes}분 소요`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}시간 소요`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}일 소요`;
}

// ─── Confirmation Modal ─────────────────────────────────────────────────────

function ConfirmDeleteModal({
  count,
  onConfirm,
  onClose,
}: {
  count: number;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
        <div className="px-5 pt-5 pb-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-900">질문 삭제</h3>
          <p className="text-sm text-slate-600">선택한 {count}개의 질문을 삭제하시겠습니까?</p>
          <p className="rounded-lg bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-600">
            삭제 후 하단 토스트에서 실행취소할 수 있습니다.
          </p>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3.5">
          <button
            onClick={onClose}
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

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function MentorQnaPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [questions, setQuestions] = useState<MentorQuestion[]>([]);
  const [tab, setTab] = useState<TabValue>("ALL");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("전체");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [editMode, setEditMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Load data
  useEffect(() => {
    setQuestions(getAllQuestions());
  }, []);

  // Tab counts
  const counts = useMemo(() => {
    const map: Record<QuestionStatus, number> = {
      WAITING: 0,
      ANSWERED: 0,
      CLOSED: 0,
    };
    questions.forEach((q) => {
      map[q.status]++;
    });
    return map;
  }, [questions]);

  const totalCount = questions.length;

  // Filtered list
  const filtered = useMemo(() => {
    return questions.filter((q) => {
      if (tab !== "ALL" && q.status !== tab) return false;

      if (categoryFilter !== "전체" && q.mentorCategory !== categoryFilter)
        return false;

      if (search) {
        const s = search.toLowerCase();
        if (
          !q.title.toLowerCase().includes(s) &&
          !q.askerNickname.toLowerCase().includes(s) &&
          !q.mentorName.toLowerCase().includes(s)
        )
          return false;
      }

      return true;
    });
  }, [questions, tab, search, categoryFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [tab, search, categoryFilter, pageSize]);

  // Exit edit mode on tab change
  useEffect(() => {
    setEditMode(false);
    setSelected(new Set());
  }, [tab]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === paged.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paged.map((q) => q.id)));
    }
  };

  const handleDelete = () => {
    if (selected.size === 0) return;
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    const ids = Array.from(selected);
    const deleted = questions.filter((q) => ids.includes(q.id));
    deleteQuestions(ids);
    recordLog("MENTOR_QNA_DELETE", `멘토 Q&A ${ids.length}건 삭제`, {
      targetType: "mentor-qna",
    });
    setQuestions(getAllQuestions());
    setSelected(new Set());
    setEditMode(false);
    setShowDeleteModal(false);
    showToast(`${ids.length}개의 질문이 삭제되었습니다.`, {
      onUndo: () => { restoreQuestions(deleted); setQuestions(getAllQuestions()); },
    });
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">멘토 Q&A</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          멘토에게 들어온 질문을 관리하고 답변 상태를 확인합니다.
        </p>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "전체 질문", value: totalCount, icon: RiQuestionAnswerLine, bg: "bg-blue-50 border-blue-200", color: "text-blue-600" },
          { label: "답변 대기", value: counts.WAITING, icon: RiTimeLine, bg: "bg-amber-50 border-amber-200", color: "text-amber-600" },
          { label: "답변 완료", value: counts.ANSWERED, icon: RiCheckLine, bg: "bg-green-50 border-green-200", color: "text-green-600" },
          { label: "종료", value: counts.CLOSED, icon: RiCloseCircleLine, bg: "bg-slate-50 border-slate-200", color: "text-slate-500" },
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

      {/* Filters: Tab + Search */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => { setTab(t.value); setPage(1); }}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                tab === t.value ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-700"
              )}
            >
              {t.label}
              {t.value === "WAITING" && counts.WAITING > 0 && (
                <span className="ml-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white">
                  {counts.WAITING}
                </span>
              )}
            </button>
          ))}
        </div>
        <Input
          placeholder="질문 제목, 질문자, 멘토로 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ml-auto h-9 w-64 text-sm"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <h3 className="text-sm font-semibold text-slate-800">질문 목록</h3>
            <CountDisplay total={filtered.length} />
          </div>
          {editMode ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelected(new Set(filtered.map((q) => q.id)))}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                전체선택
              </button>
              <button
                onClick={handleDelete}
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
                onClick={() => { setEditMode(false); setSelected(new Set()); }}
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
                {PAGE_SIZE_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}개씩</option>
                ))}
              </select>
              <button
                onClick={() => { setEditMode(true); setSelected(new Set()); }}
                className="flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <SquarePen className="h-3 w-3" />
                편집
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] table-fixed text-sm">
            <colgroup>{editMode && <col className="w-[40px]" />}<col /><col className="w-[120px]" /><col className="w-[120px]" /><col className="w-[110px]" /><col className="w-[55px]" /><col className="w-[100px]" /><col className="w-[100px]" /></colgroup>
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left">
                {editMode && (
                  <th className="px-3 py-3">
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 accent-indigo-600"
                      checked={
                        paged.length > 0 && selected.size === paged.length
                      }
                      onChange={toggleSelectAll}
                    />
                  </th>
                )}
                <th className="px-5 py-3 text-xs font-semibold text-slate-500">
                  질문 제목
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">
                  질문자
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">
                  대상 멘토
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">
                  분야
                </th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500">
                  공개
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">
                  상태
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">
                  등록일
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paged.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-16 text-center text-sm text-slate-400"
                  >
                    <RiQuestionAnswerLine className="mx-auto mb-3 h-12 w-12 opacity-20" />
                    <p className="font-medium">
                      {tab === "WAITING"
                        ? "답변 대기 중인 질문이 없습니다"
                        : tab === "ANSWERED"
                          ? "답변 완료된 질문이 없습니다"
                          : "종료된 질문이 없습니다"}
                    </p>
                    <p className="mt-1 text-xs text-slate-300">
                      {search || categoryFilter !== "전체"
                        ? "검색 조건을 변경해 보세요."
                        : "새로운 질문이 들어오면 여기에 표시됩니다."}
                    </p>
                  </td>
                </tr>
              ) : (
                paged.map((q) => {
                  const contentPreview =
                    q.content.length > 30
                      ? q.content.slice(0, 30) + "..."
                      : q.content;
                  const responseTime =
                    q.status === "ANSWERED" && q.answeredAt
                      ? formatResponseTime(q.createdAt, q.answeredAt)
                      : null;

                  return (
                    <tr
                      key={q.id}
                      onClick={() => { if (editMode) toggleSelect(q.id); else router.push(`/mentor-qna/${q.id}`); }}
                      className={cn(
                        "transition-colors hover:bg-slate-50",
                        !editMode && "cursor-pointer",
                        selected.has(q.id) && "bg-indigo-50/60"
                      )}
                    >
                      {/* Checkbox */}
                      {editMode && (
                        <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="h-3.5 w-3.5 accent-indigo-600"
                            checked={selected.has(q.id)}
                            onChange={() => toggleSelect(q.id)}
                          />
                        </td>
                      )}

                      {/* 질문 제목 + content preview + report badge */}
                      <td className="overflow-hidden px-5 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className="truncate font-medium text-slate-800">
                            {q.title}
                          </div>
                          {q.reportCount > 0 && (
                            <span className="shrink-0 inline-flex items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                              {q.reportCount}
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 truncate text-xs text-slate-400">
                          {contentPreview}
                        </div>
                      </td>

                      {/* 질문자 */}
                      <td className="overflow-hidden px-4 py-3">
                        <div className="truncate text-slate-700">
                          {q.askerNickname}
                        </div>
                      </td>

                      {/* 대상 멘토 */}
                      <td className="overflow-hidden px-4 py-3">
                        <div className="truncate text-slate-700">
                          {q.mentorName}
                        </div>
                      </td>

                      {/* 분야 */}
                      <td className="overflow-hidden px-4 py-3">
                        <span className="inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">
                          {q.mentorCategory}
                        </span>
                      </td>

                      {/* 공개 */}
                      <td className="px-3 py-3 text-center">
                        {q.isPublic ? (
                          <Eye className="mx-auto h-4 w-4 text-green-500" />
                        ) : (
                          <EyeOff className="mx-auto h-4 w-4 text-slate-300" />
                        )}
                      </td>

                      {/* 상태 + response time */}
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_BADGE[q.status].variant}>
                          {STATUS_BADGE[q.status].label}
                        </Badge>
                        {responseTime && (
                          <div className="mt-0.5 text-[11px] text-slate-400">
                            {responseTime}
                          </div>
                        )}
                      </td>

                      {/* 등록일 */}
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {formatDate(q.createdAt)}
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <ConfirmDeleteModal
          count={selected.size}
          onConfirm={confirmDelete}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}
