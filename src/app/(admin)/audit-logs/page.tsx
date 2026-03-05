"use client";

import { useState, useMemo } from "react";
import { ScrollText, Shield, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockAuditLogs, AUDIT_ACTION_LABELS, type AuditAction } from "@/data/mock-data";
import { PaginationBar, CountDisplay } from "@/components/ui/pagination-bar";
import { cn } from "@/lib/utils";

export default function AuditLogsPage() {
  const [roleFilter, setRoleFilter] = useState<"ALL" | "ADMIN" | "MEMBER">("ALL");
  const [actionFilter, setActionFilter] = useState<AuditAction | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const filtered = useMemo(() => {
    return mockAuditLogs.filter((log) => {
      if (roleFilter !== "ALL" && log.actorRole !== roleFilter) return false;
      if (actionFilter !== "ALL" && log.action !== actionFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return log.actorNickname.toLowerCase().includes(q) || log.description.toLowerCase().includes(q);
      }
      return true;
    });
  }, [roleFilter, actionFilter, search]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const actionCategories = Array.from(new Set(mockAuditLogs.map((l) => l.action)));
  const adminCount = mockAuditLogs.filter((l) => l.actorRole === "ADMIN").length;
  const memberCount = mockAuditLogs.filter((l) => l.actorRole === "MEMBER").length;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">활동 추적</h2>
        <p className="mt-0.5 text-sm text-slate-500">시스템 활동 이력을 추적하고 보안 이벤트를 모니터링합니다.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "전체 로그", count: mockAuditLogs.length, icon: ScrollText, bg: "bg-blue-50 border-blue-200", iconColor: "text-blue-600" },
          { label: "관리자 액션", count: adminCount, icon: Shield, bg: "bg-purple-50 border-purple-200", iconColor: "text-purple-600" },
          { label: "회원 액션", count: memberCount, icon: User, bg: "bg-green-50 border-green-200", iconColor: "text-green-600" },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={cn("flex items-center gap-3 rounded-xl border bg-white p-4", "border-slate-200")}>
              <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border", card.bg)}>
                <Icon className={cn("h-5 w-5", card.iconColor)} />
              </div>
              <div>
                <p className="text-xs text-slate-500">{card.label}</p>
                <p className="text-2xl font-bold text-slate-900">{card.count.toLocaleString()}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 p-1">
          {(["ALL", "ADMIN", "MEMBER"] as const).map((r) => (
            <button
              key={r}
              onClick={() => { setRoleFilter(r); setPage(1); }}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                roleFilter === r ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-700"
              )}
            >
              {r === "ALL" ? "전체" : r === "ADMIN" ? "관리자" : "회원"}
            </button>
          ))}
        </div>
        <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v as AuditAction | "ALL"); setPage(1); }}>
          <SelectTrigger className="h-9 w-40 text-xs"><SelectValue placeholder="액션 유형" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">전체 액션</SelectItem>
            {actionCategories.map((a) => <SelectItem key={a} value={a}>{AUDIT_ACTION_LABELS[a]}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input className="h-9 w-64 text-sm" placeholder="수행자/설명 검색..." value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <h3 className="text-sm font-semibold text-slate-800">활동 로그</h3>
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
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left">
                <th className="px-5 py-3 text-xs font-semibold text-slate-500">일시</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">수행자</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">역할</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">액션</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 w-[35%]">설명</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginated.length === 0 ? (
                <tr><td colSpan={6} className="py-16 text-center text-sm text-slate-400">검색 결과가 없습니다.</td></tr>
              ) : (
                paginated.map((log) => (
                  <tr key={log.id} className="transition-colors hover:bg-slate-50/70">
                    <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-500">
                      {new Date(log.createdAt).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-800">{log.actorNickname}</td>
                    <td className="px-4 py-3.5">
                      {log.actorRole === "ADMIN"
                        ? <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-medium text-purple-700">관리자</span>
                        : <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">회원</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600">
                        {AUDIT_ACTION_LABELS[log.action]}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">{log.description}</td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-400">{log.ip}</td>
                  </tr>
                ))
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
