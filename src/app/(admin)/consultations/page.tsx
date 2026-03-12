"use client";

import React, { useState, useMemo } from "react";
import {
  RiCustomerService2Line,
  RiCloseLine,
  RiTimeLine,
  RiCheckboxCircleLine,
  RiRefreshLine,
  RiMailLine,
  RiPhoneLine,
  RiUserLine,
  RiFileTextLine,
  RiMessageLine,
  RiBriefcaseLine,
  RiHistoryLine,
} from "react-icons/ri";
import { X, Download, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PaginationBar, CountDisplay } from "@/components/ui/pagination-bar";
import { useToast } from "@/lib/toast-context";
import { cn } from "@/lib/utils";
import { getAllConsultations, updateConsultation, type Consultation, type ConsultStatus } from "@/lib/consultation-store";

// ─── Export Fields ────────────────────────────────────────────────────────────

const EXPORT_FIELDS = [
  { key: "name",         label: "신청자명" },
  { key: "email",        label: "이메일" },
  { key: "phone",        label: "전화번호" },
  { key: "company",      label: "회사" },
  { key: "jobTitle",     label: "직책" },
  { key: "postTitle",    label: "관련 콘텐츠" },
  { key: "postCategory", label: "카테고리" },
  { key: "status",       label: "상태" },
  { key: "adminMemo",    label: "관리자 메모" },
  { key: "createdAt",    label: "신청일" },
] as const;
type ExportFieldKey = (typeof EXPORT_FIELDS)[number]["key"];
const ALL_EXPORT_KEYS = EXPORT_FIELDS.map((f) => f.key) as ExportFieldKey[];

// Types re-exported from store
// (ConsultStatus, Consultation imported from @/lib/consultation-store)

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ConsultStatus, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING:     { label: "대기중", color: "bg-amber-100 text-amber-700",  icon: <RiTimeLine className="h-3 w-3" /> },
  IN_PROGRESS: { label: "처리중", color: "bg-blue-100 text-blue-700",    icon: <RiRefreshLine className="h-3 w-3" /> },
  COMPLETED:   { label: "완료",   color: "bg-green-100 text-green-700",  icon: <RiCheckboxCircleLine className="h-3 w-3" /> },
  CANCELLED:   { label: "취소",   color: "bg-slate-100 text-slate-500",  icon: <RiCloseLine className="h-3 w-3" /> },
};

function StatusBadge({ status }: { status: ConsultStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", cfg.color)}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric", month: "long", day: "numeric",
  });
}

// ─── Consultation Timeline (이력 탭용) ────────────────────────────────────────

function ConsultationTimeline({
  items,
  currentId,
  onSelect,
}: {
  items: Consultation[];
  currentId: string;
  onSelect: (item: Consultation) => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {items.map((item, idx) => {
        const isExpanded = expandedId === item.id;
        return (
          <div key={item.id} className="flex gap-3">
            {/* 타임라인 세로선 */}
            <div className="flex flex-col items-center pt-1">
              <div className={cn(
                "h-2.5 w-2.5 shrink-0 rounded-full border-2",
                item.status === "COMPLETED"  ? "border-green-400 bg-green-100" :
                item.status === "IN_PROGRESS" ? "border-blue-400 bg-blue-100" :
                item.status === "PENDING"    ? "border-amber-400 bg-amber-100" :
                "border-slate-300 bg-slate-100"
              )} />
              {idx < items.length - 1 && (
                <div className="mt-1 w-px flex-1 bg-slate-200" />
              )}
            </div>

            {/* 카드 */}
            <div className="mb-3 flex-1">
              <button
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                className="w-full text-left"
              >
                <div className={cn(
                  "rounded-xl border px-3.5 py-3 transition-colors",
                  "border-slate-100 bg-slate-50 hover:bg-slate-100"
                )}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-1 text-xs font-medium text-slate-700">{item.postTitle}</p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <StatusBadge status={item.status} />
                      {isExpanded ? <ChevronUp className="h-3 w-3 text-slate-400" /> : <ChevronDown className="h-3 w-3 text-slate-400" />}
                    </div>
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-400">{formatDateShort(item.createdAt)}</p>
                </div>
              </button>

              {isExpanded && (
                <div className="mt-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-3 space-y-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">상담 내용</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">{item.message}</p>
                  </div>
                  {item.adminMemo && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">관리자 메모</p>
                      <p className="mt-1 text-xs text-slate-500">{item.adminMemo}</p>
                    </div>
                  )}
                  <button
                    onClick={() => onSelect(item)}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    이 상담으로 전환 →
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────

function DetailDrawer({
  item,
  customerHistory,
  onClose,
  onStatusChange,
  onMemoChange,
  onSelectItem,
}: {
  item: Consultation | null;
  customerHistory: Consultation[];
  onClose: () => void;
  onStatusChange: (id: string, status: ConsultStatus) => void;
  onMemoChange: (id: string, memo: string) => void;
  onSelectItem: (item: Consultation) => void;
}) {
  const [memo, setMemo] = useState("");
  const [activeTab, setActiveTab] = useState<"current" | "history">("current");

  React.useEffect(() => {
    if (item) {
      setMemo(item.adminMemo);
      setActiveTab("current");
    }
  }, [item?.id]);

  React.useEffect(() => {
    if (item) setMemo(item.adminMemo);
  }, [item?.adminMemo]);

  const saveMemo = () => {
    if (!item) return;
    onMemoChange(item.id, memo);
  };

  const isOpen = !!item;
  const historyCount = customerHistory.length;
  const firstConsult = customerHistory.length > 0
    ? customerHistory[customerHistory.length - 1]
    : item;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-black/20 transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      />

      {/* Drawer panel */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-[540px] flex-col bg-white shadow-[-8px_0_40px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {item && (
          <>
            {/* ── 드로어 헤더 ── */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <RiMessageLine className="h-4 w-4 text-indigo-600" />
                <span className="text-sm font-semibold text-slate-900">상담 상세</span>
              </div>
              <button
                onClick={onClose}
                className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* ── 고객 컨텍스트 헤더 (항상 표시) ── */}
            <div className="shrink-0 border-b border-slate-100 bg-slate-50 px-6 py-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">
                  {item.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-900">{item.name}</span>
                    {(historyCount + 1) > 1 && (
                      <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-600">
                        총 {historyCount + 1}회 상담
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <RiFileTextLine className="h-3 w-3 shrink-0 text-slate-400" />
                      {item.company}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <RiBriefcaseLine className="h-3 w-3 shrink-0 text-slate-400" />
                      {item.jobTitle}
                    </span>
                    <span className="flex items-center gap-1.5 col-span-2 truncate">
                      <RiMailLine className="h-3 w-3 shrink-0 text-slate-400" />
                      {item.email}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <RiPhoneLine className="h-3 w-3 shrink-0 text-slate-400" />
                      {item.phone}
                    </span>
                    {firstConsult && historyCount > 0 && (
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <RiHistoryLine className="h-3 w-3 shrink-0" />
                        최초 {formatDateShort(firstConsult.createdAt)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── 탭 바 ── */}
            <div className="flex shrink-0 border-b border-slate-100 px-6">
              <button
                onClick={() => setActiveTab("current")}
                className={cn(
                  "pb-3 pt-3.5 text-xs font-semibold transition-colors border-b-2 mr-5",
                  activeTab === "current"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                )}
              >
                현재 상담
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={cn(
                  "pb-3 pt-3.5 text-xs font-semibold transition-colors border-b-2",
                  activeTab === "history"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                )}
              >
                이전 이력
                {historyCount > 0 && (
                  <span className={cn(
                    "ml-1.5 rounded-full px-1.5 py-0.5 text-[10px]",
                    activeTab === "history" ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-500"
                  )}>
                    {historyCount}
                  </span>
                )}
              </button>
            </div>

            {/* ── 탭 콘텐츠 (스크롤) ── */}
            <div className="flex-1 overflow-y-auto">

              {/* 현재 상담 탭 */}
              {activeTab === "current" && (
                <div className="px-6 py-5 space-y-5">
                  {/* 상태 변경 */}
                  <div className="flex items-center justify-between">
                    <StatusBadge status={item.status} />
                    <select
                      value={item.status}
                      onChange={(e) => onStatusChange(item.id, e.target.value as ConsultStatus)}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    >
                      <option value="PENDING">대기중</option>
                      <option value="IN_PROGRESS">처리중</option>
                      <option value="COMPLETED">완료</option>
                      <option value="CANCELLED">취소</option>
                    </select>
                  </div>

                  {/* 관련 콘텐츠 */}
                  <div>
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">관련 콘텐츠</p>
                    <p className="text-sm font-medium leading-snug text-slate-800">{item.postTitle}</p>
                    <span className="mt-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500">
                      {item.postCategory}
                    </span>
                  </div>

                  {/* 상담 내용 */}
                  <div>
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">상담 내용</p>
                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-3 text-xs leading-relaxed text-slate-700">
                      {item.message}
                    </div>
                  </div>

                  {/* 관리자 메모 */}
                  <div>
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">관리자 메모</p>
                    <textarea
                      value={memo}
                      onChange={(e) => setMemo(e.target.value)}
                      rows={3}
                      placeholder="내부용 메모를 입력하세요..."
                      className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-300 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    />
                    <div className="mt-1.5 flex justify-end gap-2">
                      <button
                        onClick={() => setMemo(item.adminMemo)}
                        className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-500 hover:bg-slate-50 transition-colors"
                      >
                        취소
                      </button>
                      <button
                        onClick={saveMemo}
                        disabled={memo === item.adminMemo}
                        className={cn(
                          "rounded-lg px-3 py-1 text-xs font-medium transition-colors",
                          memo !== item.adminMemo
                            ? "bg-indigo-600 text-white hover:bg-indigo-700"
                            : "cursor-not-allowed bg-slate-100 text-slate-400"
                        )}
                      >
                        저장
                      </button>
                    </div>
                  </div>

                  {/* 타임스탬프 */}
                  <div className="space-y-1 border-t border-slate-100 pt-3">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>신청일</span><span>{formatDate(item.createdAt)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>최종 수정</span><span>{formatDate(item.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 이전 이력 탭 */}
              {activeTab === "history" && (
                <div className="px-6 py-5">
                  {historyCount === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <RiHistoryLine className="mb-3 h-10 w-10 text-slate-200" />
                      <p className="text-sm text-slate-400">이전 상담 이력이 없습니다.</p>
                      <p className="mt-1 text-xs text-slate-300">이 고객의 첫 번째 상담입니다.</p>
                    </div>
                  ) : (
                    <>
                      <p className="mb-4 text-xs text-slate-400">
                        현재 상담을 제외한 <span className="font-semibold text-slate-600">{historyCount}건</span>의 이전 상담 이력입니다.
                      </p>
                      <ConsultationTimeline
                        items={customerHistory}
                        currentId={item.id}
                        onSelect={(prev) => {
                          onSelectItem(prev);
                        }}
                      />
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ConsultationsPage() {
  const { showToast } = useToast();
  const [data, setData] = useState<Consultation[]>(() => getAllConsultations());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ConsultStatus | "ALL">(() => {
    const all = getAllConsultations();
    return all.some((c) => c.status === "PENDING") ? "PENDING" : "ALL";
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedItem, setSelectedItem] = useState<Consultation | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStatusSet, setExportStatusSet] = useState<Set<ConsultStatus>>(
    new Set(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"])
  );
  const [selectedExportFields, setSelectedExportFields] = useState<Set<ExportFieldKey>>(new Set(ALL_EXPORT_KEYS));

  // 이메일 기준 고객 그룹 맵 (이력 조회용)
  const customerMap = useMemo(() => {
    const map = new Map<string, Consultation[]>();
    data.forEach((c) => {
      const list = map.get(c.email) ?? [];
      list.push(c);
      map.set(c.email, list);
    });
    map.forEach((list) =>
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    );
    return map;
  }, [data]);

  const filtered = useMemo(() => {
    return data.filter((c) => {
      const matchStatus = statusFilter === "ALL" || c.status === statusFilter;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.postTitle.toLowerCase().includes(q) ||
        c.message.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [data, search, statusFilter]);

  const pagedItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  const counts = useMemo(() => ({
    all:        data.length,
    pending:    data.filter((c) => c.status === "PENDING").length,
    inProgress: data.filter((c) => c.status === "IN_PROGRESS").length,
    completed:  data.filter((c) => c.status === "COMPLETED").length,
  }), [data]);

  const exportData = data.filter((c) => exportStatusSet.has(c.status));

  const handleStatusChange = (id: string, status: ConsultStatus) => {
    updateConsultation(id, { status });
    setData(getAllConsultations());
    setSelectedItem((prev) => (prev?.id === id ? { ...prev, status, updatedAt: new Date().toISOString() } : prev));
    showToast(`상태가 "${STATUS_CONFIG[status].label}"(으)로 변경되었습니다.`);
  };

  const handleMemoChange = (id: string, adminMemo: string) => {
    updateConsultation(id, { adminMemo });
    setData(getAllConsultations());
    setSelectedItem((prev) => (prev?.id === id ? { ...prev, adminMemo, updatedAt: new Date().toISOString() } : prev));
    showToast("메모가 저장되었습니다.");
  };

  const handleConfirmExport = () => {
    if (selectedExportFields.size === 0) return;
    const orderedFields = ALL_EXPORT_KEYS.filter((k) => selectedExportFields.has(k));
    const headers = orderedFields.map((k) => EXPORT_FIELDS.find((f) => f.key === k)!.label);
    const rows = exportData.map((c) => orderedFields.map((k) => {
      if (k === "status") return STATUS_CONFIG[c.status].label;
      if (k === "createdAt") return formatDate(c.createdAt);
      const v = String(c[k as keyof Consultation] ?? "");
      return v.includes(",") || v.includes('"') || v.includes("\n") ? `"${v.replace(/"/g, '""')}"` : v;
    }));
    const csv = "\uFEFF" + [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `consultations_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportModal(false);
    showToast(`${exportData.length}개 상담 데이터를 내보냈습니다.`);
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">상담 관리</h2>
          <p className="mt-0.5 text-sm text-slate-500">콘텐츠를 통해 접수된 상담 신청을 관리합니다.</p>
        </div>
        <button
          onClick={() => setShowExportModal(true)}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          CSV 내보내기
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "전체 상담", value: counts.all,        icon: RiCustomerService2Line, bg: "bg-blue-50 border-blue-200",     color: "text-blue-600" },
          { label: "대기중",    value: counts.pending,    icon: RiTimeLine,             bg: "bg-amber-50 border-amber-200",   color: "text-amber-600" },
          { label: "처리중",    value: counts.inProgress, icon: RiRefreshLine,          bg: "bg-indigo-50 border-indigo-200", color: "text-indigo-600" },
          { label: "완료",      value: counts.completed,  icon: RiCheckboxCircleLine,   bg: "bg-green-50 border-green-200",   color: "text-green-600" },
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
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {(["ALL", "PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const).map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                statusFilter === s ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-700"
              )}
            >
              {s === "ALL" ? "전체" : STATUS_CONFIG[s].label}
              {s === "PENDING" && counts.pending > 0 && (
                <span className="ml-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white">
                  {counts.pending}
                </span>
              )}
            </button>
          ))}
        </div>
        <Input
          placeholder="이름, 이메일, 회사, 내용 검색..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="ml-auto h-9 w-64 text-sm"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <h3 className="text-sm font-semibold text-slate-800">상담 목록</h3>
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
          <table className="w-full min-w-[760px] table-fixed text-sm">
            <colgroup>
              <col className="w-[160px]" />
              <col className="w-[150px]" />
              <col className="w-[220px]" />
              <col className="w-[90px]" />
              <col className="w-[120px]" />
            </colgroup>
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left">
                <th className="px-5 py-3 text-xs font-semibold text-slate-500">신청자</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">회사 / 직책</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">관련 콘텐츠</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">상태</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">신청일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pagedItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-sm text-slate-400">
                    <RiCustomerService2Line className="mx-auto mb-3 h-10 w-10 opacity-20" />
                    검색 결과가 없습니다.
                  </td>
                </tr>
              ) : (
                pagedItems.map((c) => {
                  const isCancelled = c.status === "CANCELLED";
                  const consultCount = customerMap.get(c.email)?.length ?? 1;
                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedItem(selectedItem?.id === c.id ? null : c)}
                      className={cn(
                        "cursor-pointer transition-colors hover:bg-slate-50",
                        selectedItem?.id === c.id && "bg-indigo-50/60 hover:bg-indigo-50",
                        isCancelled && "opacity-60"
                      )}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className={cn("font-medium", isCancelled ? "text-slate-400" : "text-slate-800")}>
                            {c.name}
                          </span>
                          {consultCount > 1 && (
                            <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600">
                              {consultCount}회
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400">{c.email}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className={cn(isCancelled ? "text-slate-400" : "text-slate-700")}>{c.company}</div>
                        <div className="text-xs text-slate-400">{c.jobTitle}</div>
                      </td>
                      <td className="overflow-hidden px-4 py-3.5">
                        <p className={cn("line-clamp-1", isCancelled ? "text-slate-400" : "text-slate-700")}>{c.postTitle}</p>
                        <span className="mt-0.5 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500">
                          {c.postCategory}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-500">
                        {new Date(c.createdAt).toLocaleDateString("ko-KR")}
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

      {/* Detail Drawer */}
      <DetailDrawer
        item={selectedItem}
        customerHistory={
          selectedItem
            ? (customerMap.get(selectedItem.email) ?? []).filter((c) => c.id !== selectedItem.id)
            : []
        }
        onClose={() => setSelectedItem(null)}
        onStatusChange={handleStatusChange}
        onMemoChange={handleMemoChange}
        onSelectItem={(prev) => setSelectedItem(prev)}
      />

      {/* CSV 내보내기 모달 */}
      {showExportModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowExportModal(false); }}
        >
          <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
                  <Download className="h-4 w-4 text-indigo-600" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900">CSV 내보내기 설정</h3>
              </div>
              <button onClick={() => setShowExportModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto px-5 py-4 space-y-4">
              {/* 내보낼 대상 */}
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input type="checkbox" className="h-3.5 w-3.5 accent-indigo-600"
                      checked={exportStatusSet.size === 4}
                      onChange={(e) => setExportStatusSet(
                        e.target.checked ? new Set(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]) : new Set()
                      )}
                    />
                    내보낼 대상 (전체 선택)
                  </label>
                  <span className="text-xs text-slate-400">{exportStatusSet.size}/4</span>
                </div>
                <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2.5">
                  {(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as ConsultStatus[]).map((s) => (
                    <label key={s} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="h-3.5 w-3.5 accent-indigo-600"
                        checked={exportStatusSet.has(s)}
                        onChange={() => setExportStatusSet((prev) => {
                          const next = new Set(prev);
                          next.has(s) ? next.delete(s) : next.add(s);
                          return next;
                        })}
                      />
                      <span className="text-xs text-slate-700">{STATUS_CONFIG[s].label}</span>
                      <span className="text-xs text-slate-400">({data.filter((c) => c.status === s).length})</span>
                    </label>
                  ))}
                </div>
              </div>
              <p className="text-xs text-slate-500">
                총 <span className="font-semibold text-indigo-600">{exportData.length}건</span>을 내보냅니다.
              </p>
              {/* 내보낼 필드 */}
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input type="checkbox" className="h-3.5 w-3.5 accent-indigo-600"
                      checked={selectedExportFields.size === ALL_EXPORT_KEYS.length}
                      onChange={(e) => setSelectedExportFields(e.target.checked ? new Set(ALL_EXPORT_KEYS) : new Set())}
                    />
                    전체 선택
                  </label>
                  <span className="text-xs text-slate-400">{selectedExportFields.size}/{ALL_EXPORT_KEYS.length}</span>
                </div>
                <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2.5">
                  {EXPORT_FIELDS.map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="h-3.5 w-3.5 accent-indigo-600"
                        checked={selectedExportFields.has(key)}
                        onChange={() => setSelectedExportFields((prev) => {
                          const next = new Set(prev);
                          next.has(key) ? next.delete(key) : next.add(key);
                          return next;
                        })}
                      />
                      <span className="text-xs text-slate-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3.5">
              <button onClick={() => setShowExportModal(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                취소
              </button>
              <button onClick={handleConfirmExport}
                disabled={selectedExportFields.size === 0 || exportStatusSet.size === 0}
                className={cn(
                  "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  selectedExportFields.size > 0 && exportStatusSet.size > 0
                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                    : "cursor-not-allowed bg-slate-100 text-slate-400"
                )}
              >
                내보내기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
