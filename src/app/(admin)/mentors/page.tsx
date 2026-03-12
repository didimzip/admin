"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus, Search, SquarePen } from "lucide-react";
import {
  RiUserStarLine,
  RiTimeLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiGroupLine,
} from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useToast } from "@/lib/toast-context";
import { PaginationBar, CountDisplay } from "@/components/ui/pagination-bar";
import { recordLog } from "@/lib/audit-log-store";
import { getSession } from "@/lib/auth-store";
import { getAllMentors, updateMentorStatus, deleteMentors, restoreMentors } from "@/lib/mentor-store";
import { getAllQuestions } from "@/lib/mentor-qna-store";
import { MENTOR_CATEGORIES, type Mentor, type MentorStatus, type MentorCategory } from "@/data/mock-data";

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_PAGE_SIZE = 20;

type TabKey = "ALL" | "PENDING" | "APPROVED" | "REJECTED_SUSPENDED";

const statusConfig: Record<MentorStatus, { label: string; variant: "warning" | "success" | "destructive" | "secondary" }> = {
  PENDING:   { label: "심사 대기", variant: "warning" },
  APPROVED:  { label: "활동중",   variant: "success" },
  REJECTED:  { label: "반려",     variant: "destructive" },
  SUSPENDED: { label: "정지",     variant: "secondary" },
};

const tabs: { key: TabKey; label: string; statuses: MentorStatus[] }[] = [
  { key: "ALL",                  label: "전체",      statuses: ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"] },
  { key: "PENDING",              label: "신청 대기",  statuses: ["PENDING"] },
  { key: "APPROVED",             label: "등록 멘토",  statuses: ["APPROVED"] },
  { key: "REJECTED_SUSPENDED",   label: "반려·정지",  statuses: ["REJECTED", "SUSPENDED"] },
];

// ─── Confirmation Modal Types ───────────────────────────────────────────────

type ModalType = "approve" | "reject" | "suspend" | "delete" | null;

function ConfirmModal({
  type,
  count,
  onClose,
  onConfirm,
}: {
  type: ModalType;
  count: number;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState(false);

  if (!type) return null;

  const config: Record<Exclude<ModalType, null>, { title: string; desc: string; confirmLabel: string; confirmClass: string; showTextarea: boolean; warning?: string }> = {
    approve: {
      title: "멘토 승인",
      desc: `선택한 ${count}명의 멘토를 승인하시겠습니까?`,
      confirmLabel: "승인",
      confirmClass: "bg-green-600 text-white hover:bg-green-700",
      showTextarea: false,
    },
    reject: {
      title: "멘토 반려",
      desc: `선택한 ${count}명의 멘토를 반려합니다.`,
      confirmLabel: "반려",
      confirmClass: "bg-red-600 text-white hover:bg-red-700",
      showTextarea: true,
    },
    suspend: {
      title: "멘토 정지",
      desc: `선택한 ${count}명의 멘토를 정지하시겠습니까?`,
      confirmLabel: "정지",
      confirmClass: "bg-slate-700 text-white hover:bg-slate-800",
      showTextarea: false,
    },
    delete: {
      title: "멘토 삭제",
      desc: `선택한 ${count}명의 멘토를 삭제하시겠습니까?`,
      confirmLabel: "삭제",
      confirmClass: "bg-red-600 text-white hover:bg-red-700",
      showTextarea: false,
      warning: "삭제 후 하단 토스트에서 실행취소할 수 있습니다.",
    },
  };

  const cfg = config[type];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
        <div className="px-5 pt-5 pb-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-900">{cfg.title}</h3>
          <p className="text-sm text-slate-600">{cfg.desc}</p>
          {cfg.warning && (
            <p className="rounded-lg bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-600">
              {cfg.warning}
            </p>
          )}
          {cfg.showTextarea && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">반려 사유 <span className="text-red-500">*</span></label>
              <textarea
                value={reason}
                onChange={(e) => { setReason(e.target.value); setReasonError(false); }}
                rows={3}
                placeholder="반려 사유를 입력하세요..."
                className={cn(
                  "w-full resize-none rounded-lg border px-3 py-2 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-1",
                  reasonError
                    ? "border-red-400 focus:border-red-400 focus:ring-red-400"
                    : "border-slate-200 focus:border-indigo-400 focus:ring-indigo-400"
                )}
              />
              {reasonError && (
                <p className="mt-1 text-xs text-red-500">반려 사유를 입력해주세요.</p>
              )}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3.5">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={() => {
              if (cfg.showTextarea && !reason.trim()) { setReasonError(true); return; }
              onConfirm(cfg.showTextarea ? reason : undefined);
            }}
            className={cn("rounded-lg px-4 py-2 text-sm font-medium transition-colors", cfg.confirmClass)}
          >
            {cfg.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ExpertiseCell (hover tooltip escapes overflow) ──────────────────────────

function ExpertiseCell({ expertise }: { expertise: string[] }) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const cellRef = React.useRef<HTMLDivElement>(null);

  function handleEnter() {
    if (expertise.length <= 2) return;
    const rect = cellRef.current?.getBoundingClientRect();
    if (rect) setPos({ x: rect.left, y: rect.bottom + 4 });
    setShow(true);
  }

  return (
    <div
      ref={cellRef}
      onMouseEnter={handleEnter}
      onMouseLeave={() => setShow(false)}
      className="flex items-center gap-1"
    >
      {expertise.slice(0, 2).map((tag) => (
        <span key={tag} className="inline-flex shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600 whitespace-nowrap">
          {tag}
        </span>
      ))}
      {expertise.length > 2 && (
        <span className="inline-flex shrink-0 rounded bg-indigo-50 px-1.5 py-0.5 text-[11px] font-medium text-indigo-500 whitespace-nowrap">
          +{expertise.length - 2}
        </span>
      )}
      {show && (
        <div
          className="pointer-events-none fixed z-50 w-max max-w-[240px] rounded-lg border border-slate-200 bg-white p-2 shadow-lg"
          style={{ left: pos.x, top: pos.y }}
        >
          <div className="flex flex-wrap gap-1">
            {expertise.map((tag) => (
              <span key={tag} className="inline-flex rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function MentorsPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [tab, setTab] = useState<TabKey>(() => {
    const all = getAllMentors();
    return all.some((m) => m.status === "PENDING") ? "PENDING" : "ALL";
  });
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("전체");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [editMode, setEditMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [modalType, setModalType] = useState<ModalType>(null);

  useEffect(() => {
    setMentors(getAllMentors());
  }, []);

  // Q&A 답변 수 계산 (멘토별)
  const qnaCountMap = useMemo(() => {
    const questions = getAllQuestions();
    const map: Record<string, number> = {};
    questions.forEach((q) => {
      if (q.status === "ANSWERED" && q.mentorId) {
        map[q.mentorId] = (map[q.mentorId] || 0) + 1;
      }
    });
    return map;
  }, [mentors]); // re-compute when mentors reload

  // 마지막 활동일 계산 (멘토별 - 가장 최근 답변일)
  const lastActivityMap = useMemo(() => {
    const questions = getAllQuestions();
    const map: Record<string, string> = {};
    questions.forEach((q) => {
      if (q.status === "ANSWERED" && q.mentorId && q.answeredAt) {
        if (!map[q.mentorId] || q.answeredAt > map[q.mentorId]) {
          map[q.mentorId] = q.answeredAt;
        }
      }
    });
    return map;
  }, [mentors]);

  function reload() {
    setMentors(getAllMentors());
  }

  // ── Filtering ──

  const activeTab = tabs.find((t) => t.key === tab)!;

  const filtered = useMemo(() => {
    return mentors.filter((m) => {
      // tab status filter
      if (!activeTab.statuses.includes(m.status)) return false;
      // search
      if (search) {
        const q = search.toLowerCase();
        if (!m.name.toLowerCase().includes(q) && !m.companyName.toLowerCase().includes(q)) return false;
      }
      // category
      if (categoryFilter !== "전체" && m.category !== categoryFilter) return false;
      return true;
    });
  }, [mentors, tab, search, categoryFilter]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  // ── Stat counts ──

  const statCounts = useMemo(() => {
    let total = 0, pending = 0, approved = 0, rejectedSuspended = 0;
    mentors.forEach((m) => {
      total++;
      if (m.status === "PENDING") pending++;
      else if (m.status === "APPROVED") approved++;
      else rejectedSuspended++;
    });
    return { total, pending, approved, rejectedSuspended };
  }, [mentors]);

  const tabCounts = useMemo(() => {
    const counts: Record<TabKey, number> = { ALL: 0, PENDING: 0, APPROVED: 0, REJECTED_SUSPENDED: 0 };
    mentors.forEach((m) => {
      counts.ALL++;
      if (m.status === "PENDING") counts.PENDING++;
      else if (m.status === "APPROVED") counts.APPROVED++;
      else counts.REJECTED_SUSPENDED++;
    });
    return counts;
  }, [mentors]);

  // ── Selection helpers ──

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === paginated.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paginated.map((m) => m.id)));
    }
  }

  // ── Actions (called from modal confirm) ──

  function handleApprove() {
    const ids = Array.from(selected);
    ids.forEach((id) => {
      updateMentorStatus(id, "APPROVED");
      const m = mentors.find((mt) => mt.id === id);
      if (m) recordLog("MENTOR_APPROVE", `${m.name} 멘토 승인`, { targetType: "MENTOR", targetId: id });
    });
    reload();
    setSelected(new Set());
    showToast(`${ids.length}명의 멘토를 승인했습니다.`);
  }

  function handleReject(reason?: string) {
    const ids = Array.from(selected);
    ids.forEach((id) => {
      updateMentorStatus(id, "REJECTED", reason);
      const m = mentors.find((mt) => mt.id === id);
      if (m) recordLog("MENTOR_REJECT", `${m.name} 멘토 반려${reason ? `: ${reason}` : ""}`, { targetType: "MENTOR", targetId: id });
    });
    reload();
    setSelected(new Set());
    showToast(`${ids.length}명의 멘토를 반려했습니다.`);
  }

  function handleSuspend() {
    const ids = Array.from(selected);
    ids.forEach((id) => {
      updateMentorStatus(id, "SUSPENDED");
      const m = mentors.find((mt) => mt.id === id);
      if (m) recordLog("MENTOR_SUSPEND", `${m.name} 멘토 정지`, { targetType: "MENTOR", targetId: id });
    });
    reload();
    setSelected(new Set());
    showToast(`${ids.length}명의 멘토를 정지했습니다.`);
  }

  function handleDelete() {
    const ids = Array.from(selected);
    const deleted = mentors.filter((m) => ids.includes(m.id));
    ids.forEach((id) => {
      const m = mentors.find((mt) => mt.id === id);
      if (m) recordLog("MENTOR_DELETE", `${m.name} 멘토 삭제`, { targetType: "MENTOR", targetId: id });
    });
    deleteMentors(ids);
    reload();
    setSelected(new Set());
    showToast(`${ids.length}명의 멘토를 삭제했습니다.`, {
      onUndo: () => { restoreMentors(deleted); reload(); },
    });
  }

  function handleModalConfirm(reason?: string) {
    if (modalType === "approve") handleApprove();
    else if (modalType === "reject") handleReject(reason);
    else if (modalType === "suspend") handleSuspend();
    else if (modalType === "delete") handleDelete();
    setModalType(null);
  }

  // ── Edit mode toggle ──

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [tab, search, categoryFilter, pageSize]);
  // Reset edit mode when tab changes
  useEffect(() => { setEditMode(false); setSelected(new Set()); }, [tab]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">멘토 관리</h2>
          <p className="mt-0.5 text-sm text-slate-500">멘토 신청을 심사하고 등록된 멘토를 관리합니다.</p>
        </div>
        <Link href="/mentors/new">
          <Button size="sm" className="gap-1.5">
            <UserPlus className="h-4 w-4" />
            멘토 등록
          </Button>
        </Link>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "전체 멘토", value: statCounts.total,             icon: RiGroupLine,            bg: "bg-blue-50 border-blue-200",   color: "text-blue-600" },
          { label: "신청 대기", value: statCounts.pending,           icon: RiTimeLine,              bg: "bg-amber-50 border-amber-200", color: "text-amber-600" },
          { label: "등록 멘토", value: statCounts.approved,          icon: RiCheckboxCircleLine,    bg: "bg-green-50 border-green-200", color: "text-green-600" },
          { label: "반려·정지", value: statCounts.rejectedSuspended, icon: RiCloseCircleLine,       bg: "bg-red-50 border-red-200",     color: "text-red-600" },
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
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                tab === t.key ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-700"
              )}
            >
              {t.label}
              {t.key === "PENDING" && tabCounts.PENDING > 0 && (
                <span className="ml-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white">
                  {tabCounts.PENDING}
                </span>
              )}
            </button>
          ))}
        </div>
        <Input
          placeholder="이름, 소속으로 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ml-auto h-9 w-64 text-sm"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Table header bar */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <h3 className="text-sm font-semibold text-slate-800">멘토 목록</h3>
            <CountDisplay total={filtered.length} unit="명" />
          </div>
          {editMode ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelected(new Set(filtered.map((m) => m.id)))}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                전체선택
              </button>
              <button
                onClick={() => setModalType("delete")}
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
              {selected.size > 0 && tab === "PENDING" && (
                <>
                  <button
                    onClick={() => setModalType("approve")}
                    className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors"
                  >
                    승인
                  </button>
                  <button
                    onClick={() => setModalType("reject")}
                    className="rounded-md bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors"
                  >
                    반려
                  </button>
                </>
              )}
              {selected.size > 0 && tab === "APPROVED" && (
                <button
                  onClick={() => setModalType("suspend")}
                  className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  정지
                </button>
              )}
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
                onChange={(e) => { setPageSize(Number(e.target.value)); }}
                className="h-7 cursor-pointer rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-600 hover:border-slate-300 focus:outline-none"
              >
                <option value={10}>10개씩</option>
                <option value={20}>20개씩</option>
                <option value={30}>30개씩</option>
                <option value={40}>40개씩</option>
                <option value={50}>50개씩</option>
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

        {/* Table body */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] table-fixed text-sm">
            <colgroup>{editMode && <col className="w-[40px]" />}<col className="w-[110px]" /><col className="w-[130px]" /><col className="w-[90px]" /><col className="w-[80px]" /><col className="w-[160px]" /><col className="w-[70px]" /><col className="w-[100px]" /><col className="w-[100px]" /><col className="w-[100px]" /></colgroup>
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left">
                {editMode && (
                  <th className="px-3 py-3">
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 accent-indigo-600"
                      checked={paginated.length > 0 && selected.size === paginated.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                )}
                <th className="px-5 py-3 text-xs font-semibold text-slate-500">이름</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">소속</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">직책</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">분야</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">전문 키워드</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500">Q&A 답변</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">상태</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">마지막 활동일</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">신청일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={editMode ? 11 : 10} className="py-16 text-center">
                    <RiUserStarLine className="mx-auto mb-3 h-10 w-10 text-slate-200 opacity-20" />
                    <p className="text-sm text-slate-400">해당 조건에 맞는 멘토가 없습니다.</p>
                    <p className="mt-1 text-xs text-slate-300">검색 조건이나 필터를 변경해 보세요.</p>
                  </td>
                </tr>
              ) : (
                paginated.map((m) => {
                  const sc = statusConfig[m.status];
                  return (
                    <tr
                      key={m.id}
                      onClick={() => { if (editMode) toggleSelect(m.id); else router.push(`/mentors/${m.id}`); }}
                      className={cn(
                        "transition-colors hover:bg-slate-50",
                        !editMode && "cursor-pointer",
                        selected.has(m.id) && "bg-indigo-50/60"
                      )}
                    >
                      {/* Checkbox */}
                      {editMode && (
                        <td className="px-3 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="h-3.5 w-3.5 accent-indigo-600"
                            checked={selected.has(m.id)}
                            onChange={() => toggleSelect(m.id)}
                          />
                        </td>
                      )}
                      {/* 이름 */}
                      <td className="overflow-hidden px-5 py-3.5">
                        <div className="truncate font-medium text-slate-800">{m.name}</div>
                      </td>
                      {/* 소속 */}
                      <td className="overflow-hidden px-4 py-3.5">
                        <div className="truncate text-slate-700">{m.companyName}</div>
                      </td>
                      {/* 직책 */}
                      <td className="overflow-hidden px-4 py-3.5">
                        <div className="truncate text-slate-600">{m.position}</div>
                      </td>
                      {/* 분야 */}
                      <td className="overflow-hidden px-4 py-3.5">
                        <div className="truncate text-slate-600">{m.category}</div>
                      </td>
                      {/* 전문 키워드 */}
                      <td className="overflow-hidden px-4 py-3.5">
                        <ExpertiseCell expertise={m.expertise} />
                      </td>
                      {/* Q&A 답변 */}
                      <td className="overflow-hidden px-4 py-3.5 text-center">
                        <span className="text-sm text-slate-600">{qnaCountMap[m.id] ?? 0}</span>
                      </td>
                      {/* 상태 */}
                      <td className="overflow-hidden px-4 py-3.5">
                        <Badge variant={sc.variant}>{sc.label}</Badge>
                      </td>
                      {/* 마지막 활동일 */}
                      <td className="overflow-hidden px-4 py-3.5 text-xs text-slate-500">
                        {lastActivityMap[m.id] ? new Date(lastActivityMap[m.id]).toLocaleDateString("ko-KR") : "—"}
                      </td>
                      {/* 신청일 */}
                      <td className="overflow-hidden px-4 py-3.5 text-xs text-slate-500">
                        {new Date(m.appliedAt).toLocaleDateString("ko-KR")}
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
          <PaginationBar total={filtered.length} page={page} pageSize={pageSize} onPageChange={setPage} />
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        type={modalType}
        count={selected.size}
        onClose={() => setModalType(null)}
        onConfirm={handleModalConfirm}
      />
    </div>
  );
}
