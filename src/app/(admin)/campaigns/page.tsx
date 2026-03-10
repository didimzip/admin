"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Send, FileText, Mail, MessageCircle, Plus, Search, SquarePen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAllCampaigns, deleteCampaign, type StoredCampaign } from "@/lib/campaign-store";
import { getAllAdmins, getSession } from "@/lib/auth-store";
import { type CampaignStatus, type CampaignChannel } from "@/data/mock-data";
import { PaginationBar, CountDisplay } from "@/components/ui/pagination-bar";
import { useToast } from "@/lib/toast-context";
import { cn } from "@/lib/utils";

const statusConfig: Record<CampaignStatus, { label: string; variant: "success" | "warning" | "secondary" | "destructive" }> = {
  SENT: { label: "발송 완료", variant: "success" },
  SCHEDULED: { label: "발송 예정", variant: "warning" },
  DRAFT: { label: "작성 중", variant: "secondary" },
  CANCELLED: { label: "취소됨", variant: "destructive" },
};

const channelConfig: Record<CampaignChannel, { label: string; icon: typeof Mail }> = {
  EMAIL: { label: "이메일", icon: Mail },
  ALIMTALK: { label: "알림톡", icon: MessageCircle },
  PUSH: { label: "푸시", icon: Send },
};

function getFilterDisplayParts(filter: StoredCampaign["targetFilter"]): string[] {
  const parts: string[] = [];
  if (filter.companyTypes?.length > 0) parts.push(...filter.companyTypes);
  if (filter.jobCategories?.length > 0) parts.push(...filter.jobCategories);
  if (filter.authStatus) {
    const labels: Record<string, string> = { NONE: "미인증", PENDING: "심사중", VERIFIED: "인증완료" };
    parts.push(labels[filter.authStatus] ?? filter.authStatus);
  }
  if (filter.hasBadge === true) parts.push("뱃지 있음");
  if (filter.hasBadge === false) parts.push("뱃지 없음");
  return parts;
}

export default function CampaignsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [campaigns, setCampaigns] = useState<StoredCampaign[]>([]);
  const [filterStatus, setFilterStatus] = useState<CampaignStatus | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const session = getSession();
  const myAdminId = session?.adminId ?? null;

  useEffect(() => {
    setCampaigns(getAllCampaigns());
    const handleUpdate = () => setCampaigns(getAllCampaigns());
    window.addEventListener("campaign-saved", handleUpdate);
    return () => window.removeEventListener("campaign-saved", handleUpdate);
  }, []);

  // 다른 관리자의 DRAFT는 숨기기
  const visibleCampaigns = useMemo(() =>
    campaigns.filter((c) => c.status !== "DRAFT" || c.createdBy === myAdminId),
    [campaigns, myAdminId]
  );

  const filtered = useMemo(() => {
    let result = visibleCampaigns;
    if (filterStatus !== "ALL") result = result.filter((c) => c.status === filterStatus);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((c) => c.title.toLowerCase().includes(q));
    }
    return result;
  }, [visibleCampaigns, filterStatus, searchQuery]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const adminMap = useMemo(() => Object.fromEntries(getAllAdmins().map((a) => [a.id, a.name])), []);

  const totalSent = visibleCampaigns.filter((c) => c.status === "SENT").reduce((acc, c) => acc + c.sentCount, 0);
  const sentWithOpenRate = visibleCampaigns.filter((c) => c.status === "SENT" && c.openRate > 0);
  const avgRate = sentWithOpenRate.length > 0
    ? (sentWithOpenRate.reduce((acc, c) => acc + c.openRate, 0) / sentWithOpenRate.length).toFixed(1)
    : "0";

  function handleToggleSelectRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const allPageSelected = paginated.length > 0 && paginated.every((c) => selectedIds.has(c.id));

  function handleToggleSelectAll() {
    if (allPageSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginated.forEach((c) => next.delete(c.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => new Set([...prev, ...paginated.map((c) => c.id)]));
    }
  }

  function handleDeleteSelected() {
    const count = selectedIds.size;
    selectedIds.forEach((id) => deleteCampaign(id));
    setCampaigns(getAllCampaigns());
    setSelectedIds(new Set());
    showToast(`${count}개 마케팅이 삭제되었습니다.`);
  }

  function handleDeleteAll() {
    const count = filtered.length;
    if (!window.confirm(`현재 목록의 마케팅 ${count}개를 모두 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;
    filtered.forEach((c) => deleteCampaign(c.id));
    setCampaigns(getAllCampaigns());
    setSelectedIds(new Set());
    setIsEditing(false);
    showToast(`${count}개 마케팅이 삭제되었습니다.`);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">마케팅 발송</h2>
          <p className="mt-0.5 text-sm text-slate-500">타겟 회원에게 이메일·알림톡·푸시를 발송하고 성과를 분석합니다.</p>
        </div>
        <Button
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-700"
          onClick={() => router.push("/campaigns/new")}
        >
          <Plus className="mr-1.5 h-4 w-4" /> 새 마케팅
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "총 수신자 수", value: `${totalSent}`, icon: Send, bg: "bg-blue-50 border-blue-200", color: "text-blue-600" },
          { label: "평균 오픈율", value: `${avgRate}%`, icon: Mail, bg: "bg-green-50 border-green-200", color: "text-green-600" },
          { label: "마케팅 수", value: `${visibleCampaigns.length}`, icon: FileText, bg: "bg-purple-50 border-purple-200", color: "text-purple-600" },
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

      {/* Filters + Search */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {(["ALL", "SENT", "SCHEDULED", "DRAFT", "CANCELLED"] as (CampaignStatus | "ALL")[]).map((s) => (
            <button
              key={s}
              onClick={() => { setFilterStatus(s); setPage(1); }}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                filterStatus === s ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-700"
              )}
            >
              {s === "ALL" ? "전체" : statusConfig[s].label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            placeholder="마케팅명 검색"
            className="h-8 w-52 rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <h3 className="text-sm font-semibold text-slate-800">마케팅 목록</h3>
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
            <div className="flex items-center gap-2">
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
                className="flex h-7 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <SquarePen className="h-3.5 w-3.5" />
                편집
              </button>
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1060px] table-fixed text-sm">
            <colgroup>
              {isEditing && <col className="w-[44px]" />}
              <col className="w-[200px]" />
              <col className="w-[80px]" />
              <col className="w-[150px]" />
              <col className="w-[75px]" />
              <col className="w-[75px]" />
              <col className="w-[65px]" />
              <col className="w-[90px]" />
              <col className="w-[110px]" />
              <col className="w-[100px]" />
            </colgroup>
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left">
                {isEditing && (
                  <th className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={allPageSelected}
                      onChange={handleToggleSelectAll}
                      className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-indigo-600"
                    />
                  </th>
                )}
                <th className="px-5 py-3 text-xs font-semibold text-slate-500">마케팅명</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">채널</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">타겟 필터</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">대상</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">발송</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">오픈율</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">상태</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">발송/예정일</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">작성자</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={isEditing ? 10 : 9} className="py-16 text-center text-sm text-slate-400">마케팅 발송 내역이 없습니다.</td>
                </tr>
              ) : (
                paginated.map((camp) => {
                  const sc = statusConfig[camp.status];
                  const ch = channelConfig[camp.channel];
                  const ChIcon = ch.icon;
                  const filterParts = getFilterDisplayParts(camp.targetFilter);
                  const isSelected = selectedIds.has(camp.id);
                  return (
                    <tr
                      key={camp.id}
                      className={cn(
                        "cursor-pointer transition-colors hover:bg-slate-50/70",
                        isSelected && "bg-indigo-50/50"
                      )}
                      onClick={() => isEditing ? handleToggleSelectRow(camp.id) : router.push(`/campaigns/${camp.id}`)}
                    >
                      {isEditing && (
                        <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectRow(camp.id)}
                            className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-indigo-600"
                          />
                        </td>
                      )}
                      <td className="px-5 py-3.5 overflow-hidden font-medium text-slate-800"><div className="truncate">{camp.title}</div></td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1 text-slate-600">
                          <ChIcon className="h-4 w-4 text-slate-400" />
                          {ch.label}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 overflow-hidden text-slate-600">
                        <div className="truncate">{filterParts.length > 0 ? filterParts.join(", ") : <span className="text-slate-400">전체 회원</span>}</div>
                      </td>
                      <td className="px-4 py-3.5 text-right tabular-nums text-slate-600">{camp.targetCount}명</td>
                      <td className="px-4 py-3.5 text-right tabular-nums text-slate-600">{camp.sentCount}명</td>
                      <td className="px-4 py-3.5 text-right tabular-nums text-slate-600">{camp.openRate > 0 ? `${camp.openRate}%` : "—"}</td>
                      <td className="px-4 py-3.5"><Badge variant={sc.variant}>{sc.label}</Badge></td>
                      <td className="px-4 py-3.5 text-slate-500">
                        {camp.sentAt ? new Date(camp.sentAt).toLocaleDateString("ko-KR") : camp.scheduledAt ? new Date(camp.scheduledAt).toLocaleDateString("ko-KR") : "—"}
                      </td>
                      <td className="px-4 py-3.5 overflow-hidden text-slate-500">
                        <div className="truncate">{camp.createdBy ? (adminMap[camp.createdBy] ?? "—") : "—"}</div>
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
            onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
}
