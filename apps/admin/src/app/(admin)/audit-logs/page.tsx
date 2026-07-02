"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { ScrollText, Shield, User, RefreshCw, X, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AUDIT_ACTION_LABELS, type AuditAction, type AuditLog } from "@/data/mock-data";
import { getAllLogs } from "@/lib/audit-log-store";
import { PaginationBar, CountDisplay } from "@/components/ui/pagination-bar";
import { cn } from "@/lib/utils";

const EXPORT_FIELDS = [
  { key: "createdAt", label: "일시" },
  { key: "actorNickname", label: "수행자" },
  { key: "actorRole", label: "역할" },
  { key: "action", label: "액션" },
  { key: "description", label: "설명" },
  { key: "targetType", label: "대상 유형" },
  { key: "targetId", label: "대상 ID" },
  { key: "ip", label: "IP 주소" },
] as const;
type ExportFieldKey = (typeof EXPORT_FIELDS)[number]["key"];
const ALL_EXPORT_KEYS = EXPORT_FIELDS.map((f) => f.key) as ExportFieldKey[];

function getLogFieldValue(log: AuditLog, key: ExportFieldKey): string {
  if (key === "createdAt") return new Date(log.createdAt).toLocaleString("ko-KR");
  if (key === "actorRole") return log.actorRole === "ADMIN" ? "관리자" : "회원";
  if (key === "action") return AUDIT_ACTION_LABELS[log.action];
  return (log[key as keyof AuditLog] ?? "") as string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [roleFilter, setRoleFilter] = useState<"ALL" | "ADMIN" | "MEMBER">("ALL");
  const [actionFilter, setActionFilter] = useState<AuditAction | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedExportFields, setSelectedExportFields] = useState<Set<ExportFieldKey>>(new Set(ALL_EXPORT_KEYS));
  const [exportRoleSet, setExportRoleSet] = useState<Set<"ADMIN" | "MEMBER">>(new Set(["ADMIN", "MEMBER"]));

  const loadLogs = useCallback(() => {
    setLogs(getAllLogs());
  }, []);

  useEffect(() => {
    loadLogs();
    // 탭 포커스 시 자동 새로고침
    const onFocus = () => loadLogs();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadLogs]);

  const exportData = logs.filter((l) => exportRoleSet.has(l.actorRole as "ADMIN" | "MEMBER"));

  function handleConfirmExport() {
    if (selectedExportFields.size === 0) return;
    const orderedFields = ALL_EXPORT_KEYS.filter((k) => selectedExportFields.has(k));
    const headers = orderedFields.map((k) => EXPORT_FIELDS.find((f) => f.key === k)!.label);
    const rows = exportData.map((log) => orderedFields.map((k) => {
      const val = getLogFieldValue(log, k);
      return val.includes(",") || val.includes('"') || val.includes("\n") ? `"${val.replace(/"/g, '""')}"` : val;
    }));
    const csv = "\uFEFF" + [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    setShowExportModal(false);
  }

  function handleRefresh() {
    setRefreshing(true);
    loadLogs();
    setPage(1);
    setTimeout(() => setRefreshing(false), 600);
  }

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      if (roleFilter !== "ALL" && log.actorRole !== roleFilter) return false;
      if (actionFilter !== "ALL" && log.action !== actionFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return log.actorNickname.toLowerCase().includes(q) || log.description.toLowerCase().includes(q);
      }
      return true;
    });
  }, [logs, roleFilter, actionFilter, search]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const actionCategories = Object.keys(AUDIT_ACTION_LABELS) as AuditAction[];
  const adminCount = logs.filter((l) => l.actorRole === "ADMIN").length;
  const memberCount = logs.filter((l) => l.actorRole === "MEMBER").length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">활동 추적</h2>
          <p className="mt-0.5 text-sm text-slate-500">시스템 활동 이력을 추적하고 보안 이벤트를 모니터링합니다.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            CSV 내보내기
          </button>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
            새로고침
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "전체 로그", count: logs.length, icon: ScrollText, bg: "bg-blue-50 border-blue-200", iconColor: "text-blue-600", role: "ALL" as const },
          { label: "관리자 액션", count: adminCount, icon: Shield, bg: "bg-purple-50 border-purple-200", iconColor: "text-purple-600", role: "ADMIN" as const },
          { label: "회원 액션", count: memberCount, icon: User, bg: "bg-green-50 border-green-200", iconColor: "text-green-600", role: "MEMBER" as const },
        ].map((card) => {
          const Icon = card.icon;
          const isActive = roleFilter === card.role;
          return (
            <button
              key={card.label}
              onClick={() => { setRoleFilter(isActive ? "ALL" : card.role); setPage(1); }}
              className={cn(
                "flex items-center gap-3 rounded-xl border bg-white p-4 text-left transition-all hover:shadow-md",
                isActive ? "border-indigo-400 ring-2 ring-indigo-200" : "border-slate-200"
              )}
            >
              <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border", card.bg)}>
                <Icon className={cn("h-5 w-5", card.iconColor)} />
              </div>
              <div>
                <p className="text-xs text-slate-500">{card.label}</p>
                <p className="text-2xl font-bold text-slate-900">{card.count.toLocaleString()}</p>
              </div>
            </button>
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
          <table className="w-full min-w-[800px] table-fixed text-sm">
            <colgroup>
              <col className="w-[130px]" />
              <col className="w-[110px]" />
              <col className="w-[80px]" />
              <col className="w-[130px]" />
              <col className="w-[240px]" />
              <col className="w-[110px]" />
            </colgroup>
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left">
                <th className="px-5 py-3 text-xs font-semibold text-slate-500">일시</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">수행자</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">역할</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">액션</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">설명</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginated.length === 0 ? (
                <tr><td colSpan={6} className="py-16 text-center text-sm text-slate-400">검색 결과가 없습니다.</td></tr>
              ) : (
                paginated.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="cursor-pointer transition-colors hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-3.5 overflow-hidden text-xs text-slate-500">
                      {new Date(log.createdAt).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-4 py-3.5 overflow-hidden font-medium text-slate-800"><div className="truncate">{log.actorNickname}</div></td>
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
                    <td className="px-4 py-3.5 overflow-hidden text-slate-600"><div className="truncate">{log.description}</div></td>
                    <td className="px-4 py-3.5 overflow-hidden font-mono text-xs text-slate-400"><div className="truncate">{log.ip}</div></td>
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

      {/* CSV Export Modal */}
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
            <div className="px-5 py-4 space-y-4">
              {/* 역할 선택 */}
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={exportRoleSet.size === 2}
                      onChange={(e) => setExportRoleSet(e.target.checked ? new Set(["ADMIN", "MEMBER"]) : new Set())}
                      className="h-3.5 w-3.5 accent-indigo-600"
                    />
                    내보낼 대상 (전체 선택)
                  </label>
                  <span className="text-xs text-slate-400">{exportRoleSet.size}/2</span>
                </div>
                <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2.5">
                  {([
                    { role: "ADMIN" as const, label: "관리자 액션", count: logs.filter((l) => l.actorRole === "ADMIN").length },
                    { role: "MEMBER" as const, label: "회원 액션",  count: logs.filter((l) => l.actorRole === "MEMBER").length },
                  ]).map(({ role, label, count }) => (
                    <label key={role} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={exportRoleSet.has(role)}
                        onChange={() => setExportRoleSet((prev) => {
                          const next = new Set(prev);
                          next.has(role) ? next.delete(role) : next.add(role);
                          return next;
                        })}
                        className="h-3.5 w-3.5 accent-indigo-600"
                      />
                      <span className="text-xs text-slate-700">{label}</span>
                      <span className="text-xs text-slate-400">({count})</span>
                    </label>
                  ))}
                </div>
              </div>
              <p className="text-xs text-slate-500">
                총 <span className="font-semibold text-indigo-600">{exportData.length.toLocaleString()}건</span>을 내보냅니다.
              </p>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={selectedExportFields.size === ALL_EXPORT_KEYS.length}
                    onChange={(e) => setSelectedExportFields(e.target.checked ? new Set(ALL_EXPORT_KEYS) : new Set())}
                    className="h-3.5 w-3.5 accent-indigo-600"
                  />
                  전체 선택
                </label>
                <span className="text-xs text-slate-400">{selectedExportFields.size}/{ALL_EXPORT_KEYS.length}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                {EXPORT_FIELDS.map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedExportFields.has(key)}
                      onChange={() => setSelectedExportFields((prev) => {
                        const next = new Set(prev);
                        next.has(key) ? next.delete(key) : next.add(key);
                        return next;
                      })}
                      className="h-3.5 w-3.5 accent-indigo-600"
                    />
                    <span className="text-xs text-slate-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3.5">
              <button
                onClick={() => setShowExportModal(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                취소
              </button>
              <button
                onClick={handleConfirmExport}
                disabled={selectedExportFields.size === 0}
                className={cn(
                  "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  selectedExportFields.size > 0 ? "bg-indigo-600 text-white hover:bg-indigo-700" : "cursor-not-allowed bg-slate-100 text-slate-400"
                )}
              >
                내보내기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Detail Modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedLog(null); }}
        >
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                  selectedLog.actorRole === "ADMIN" ? "bg-purple-100" : "bg-slate-100"
                )}>
                  {selectedLog.actorRole === "ADMIN"
                    ? <Shield className="h-4 w-4 text-purple-600" />
                    : <User className="h-4 w-4 text-slate-500" />}
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">로그 상세</h2>
                  <p className="text-[11px] text-slate-400 font-mono">{selectedLog.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="divide-y divide-slate-50 px-5 py-2">
              {[
                { label: "일시", value: new Date(selectedLog.createdAt).toLocaleString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }) },
                { label: "수행자", value: selectedLog.actorNickname },
                { label: "역할", value: selectedLog.actorRole === "ADMIN" ? "관리자" : "회원", badge: true, badgeClass: selectedLog.actorRole === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-600" },
                { label: "액션", value: AUDIT_ACTION_LABELS[selectedLog.action], badge: true, badgeClass: "border border-slate-200 bg-white text-slate-600" },
                { label: "설명", value: selectedLog.description },
                ...(selectedLog.targetType ? [{ label: "대상 유형", value: selectedLog.targetType }] : []),
                ...(selectedLog.targetId ? [{ label: "대상 ID", value: selectedLog.targetId, mono: true }] : []),
                { label: "IP 주소", value: selectedLog.ip, mono: true },
              ].map((row) => (
                <div key={row.label} className="flex items-start gap-4 py-3">
                  <span className="w-20 shrink-0 text-xs font-medium text-slate-400">{row.label}</span>
                  {"badge" in row && row.badge ? (
                    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium", row.badgeClass)}>
                      {row.value}
                    </span>
                  ) : (
                    <span className={cn("text-sm text-slate-800 break-all", "mono" in row && row.mono && "font-mono text-xs text-slate-500")}>
                      {row.value}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 px-5 py-3.5 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
