"use client";

import { useState, useMemo } from "react";
import { Send, FileText, Mail, MessageCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockCampaigns, type CampaignStatus, type CampaignChannel } from "@/data/mock-data";
import { PaginationBar } from "@/components/ui/pagination-bar";
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

export default function CampaignsPage() {
  const [filterStatus, setFilterStatus] = useState<CampaignStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const filtered = useMemo(() => {
    if (filterStatus === "ALL") return mockCampaigns;
    return mockCampaigns.filter((c) => c.status === filterStatus);
  }, [filterStatus]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const totalSent = mockCampaigns.filter((c) => c.status === "SENT").reduce((acc, c) => acc + c.sentCount, 0);
  const avgOpenRate = mockCampaigns.filter((c) => c.status === "SENT" && c.openRate > 0);
  const avgRate = avgOpenRate.length > 0 ? (avgOpenRate.reduce((acc, c) => acc + c.openRate, 0) / avgOpenRate.length).toFixed(1) : "0";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">캠페인</h2>
          <p className="mt-0.5 text-sm text-slate-500">타겟팅 알림톡/뉴스레터를 발송하고 성과를 분석합니다.</p>
        </div>
        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="mr-1.5 h-4 w-4" /> 새 캠페인
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "총 발송 건수", value: `${totalSent}건`, icon: Send, bg: "bg-blue-50 border-blue-200", color: "text-blue-600" },
          { label: "평균 오픈율", value: `${avgRate}%`, icon: Mail, bg: "bg-green-50 border-green-200", color: "text-green-600" },
          { label: "캠페인 수", value: `${mockCampaigns.length}`, icon: FileText, bg: "bg-purple-50 border-purple-200", color: "text-purple-600" },
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

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <h3 className="text-sm font-semibold text-slate-800">캠페인 목록</h3>
          <span className="text-xs text-slate-500">총 {filtered.length.toLocaleString()}건</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left">
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 w-[30%]">캠페인명</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">채널</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">타겟 필터</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">대상</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">발송</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">오픈율</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">상태</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">발송/예정일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-sm text-slate-400">캠페인이 없습니다.</td>
                </tr>
              ) : (
                paginated.map((camp) => {
                  const sc = statusConfig[camp.status];
                  const ch = channelConfig[camp.channel];
                  const ChIcon = ch.icon;
                  const filterParts = Object.entries(camp.targetFilter).filter(([, v]) => v).map(([, v]) => v);
                  return (
                    <tr key={camp.id} className="transition-colors hover:bg-slate-50/70">
                      <td className="px-5 py-3.5 font-medium text-slate-800">{camp.title}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1 text-slate-600">
                          <ChIcon className="h-4 w-4 text-slate-400" />
                          {ch.label}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {filterParts.length > 0 ? filterParts.join(", ") : <span className="text-slate-400">전체 회원</span>}
                      </td>
                      <td className="px-4 py-3.5 text-right tabular-nums text-slate-600">{camp.targetCount}명</td>
                      <td className="px-4 py-3.5 text-right tabular-nums text-slate-600">{camp.sentCount}명</td>
                      <td className="px-4 py-3.5 text-right tabular-nums text-slate-600">{camp.openRate > 0 ? `${camp.openRate}%` : "—"}</td>
                      <td className="px-4 py-3.5"><Badge variant={sc.variant}>{sc.label}</Badge></td>
                      <td className="px-4 py-3.5 text-slate-500">
                        {camp.sentAt ? new Date(camp.sentAt).toLocaleDateString("ko-KR") : camp.scheduledAt ? new Date(camp.scheduledAt).toLocaleDateString("ko-KR") : "—"}
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
            onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
        </div>
      </div>
    </div>
  );
}
