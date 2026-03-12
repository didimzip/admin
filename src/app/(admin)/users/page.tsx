"use client";

import { useState, useMemo, useEffect } from "react";
import { useToast } from "@/lib/toast-context";
import {
  Users,
  Building2,
  Landmark,
  Briefcase,
  CircleDot,
  Search,
  RotateCcw,
  Download,
  ShieldCheck,
  Pencil,
  UserCircle2,
  X,
  FileDown,
  Mail,
  CalendarDays,
  Clock,
  LogIn,
  User,
  ExternalLink,
  FileText,
  AlertTriangle,
  Flag,
  MessageSquare,
  BookOpen,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COMPANY_TYPES, JOB_CATEGORIES } from "@/data/mock-users";
import { getAllUsers, saveUsers, restoreUsers } from "@/lib/user-store";
import { recordLog } from "@/lib/audit-log-store";
import { getReportsByUserId, REPORT_REASON_LABEL, REPORT_TARGET_LABEL, type UserReport } from "@/lib/report-store";
import type { CompanyType, MemberStatus, UserWithProfile } from "@/types/user";
import { PaginationBar, CountDisplay } from "@/components/ui/pagination-bar";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const memberTypeBadge: Record<
  CompanyType,
  { variant: "default" | "success" | "purple" | "warning" | "secondary"; icon: typeof Building2 }
> = {
  스타트업: { variant: "default", icon: Building2 },
  투자사: { variant: "success", icon: Landmark },
  공공기관: { variant: "purple", icon: Landmark },
  전문직: { variant: "warning", icon: Briefcase },
  기타: { variant: "secondary", icon: CircleDot },
  "일반 회원": { variant: "secondary", icon: UserCircle2 },
};

const memberTypeColor: Record<CompanyType, string> = {
  스타트업: "bg-blue-50 border-blue-200 text-blue-700",
  투자사: "bg-green-50 border-green-200 text-green-700",
  공공기관: "bg-purple-50 border-purple-200 text-purple-700",
  전문직: "bg-orange-50 border-orange-200 text-orange-700",
  기타: "bg-slate-50 border-slate-200 text-slate-600",
  "일반 회원": "bg-slate-100 border-slate-300 text-slate-600",
};

const statusConfig: Record<MemberStatus, { label: string; chip: string; badge: string }> = {
  ACTIVE:    { label: "정상",    chip: "bg-green-50 text-green-700 rounded-full px-2 py-0.5 text-xs font-medium",  badge: "bg-green-50 text-green-700 rounded-full px-2 py-0.5 text-xs font-medium" },
  SUSPENDED: { label: "정지",    chip: "bg-red-50 text-red-700 rounded-full px-2 py-0.5 text-xs font-medium",        badge: "bg-red-50 text-red-700 rounded-full px-2 py-0.5 text-xs font-medium" },
  WITHDRAWN: { label: "탈퇴",    chip: "bg-slate-100 text-slate-500 rounded-full px-2 py-0.5 text-xs font-medium", badge: "bg-slate-100 text-slate-500 rounded-full px-2 py-0.5 text-xs font-medium" },
};

const authStatusConfig: Record<string, { label: string; className: string }> = {
  NONE:     { label: "미인증",   className: "text-slate-400" },
  PENDING:  { label: "검토 중",   className: "text-amber-600" },
  VERIFIED: { label: "인증완료", className: "text-green-600" },
};

const providerLabel: Record<string, string> = {
  EMAIL: "이메일", GOOGLE: "Google", KAKAO: "카카오", NAVER: "네이버",
};

const DOC_TYPE_LABEL: Record<string, string> = { BIZ_REG: "사업자등록증", CARD: "명함" };
const DOC_STATUS: Record<string, { label: string; className: string }> = {
  PENDING:  { label: "검토 중", className: "bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5 text-xs font-medium" },
  APPROVED: { label: "승인",   className: "bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-0.5 text-xs font-medium" },
  REJECTED: { label: "반려",   className: "bg-red-50 text-red-700 border border-red-200 rounded-full px-2 py-0.5 text-xs font-medium" },
};

/* ------------------------------------------------------------------ */
/*  Export Fields                                                      */
/* ------------------------------------------------------------------ */

const EXPORT_FIELDS = [
  { key: "nickname",       label: "닉네임" },
  { key: "realName",       label: "실명" },
  { key: "email",          label: "이메일" },
  { key: "provider",       label: "가입 경로" },
  { key: "companyType",    label: "회원유형" },
  { key: "status",         label: "상태" },
  { key: "authStatus",     label: "인증 상태" },
  { key: "companyName",    label: "회사명" },
  { key: "position",       label: "직책" },
  { key: "jobCategory",    label: "직종" },
  { key: "documents",      label: "인증 첨부자료" },
  { key: "createdAt",      label: "가입일" },
  { key: "lastActivityAt", label: "마지막 활동" },
] as const;

type ExportFieldKey = (typeof EXPORT_FIELDS)[number]["key"];
const ALL_EXPORT_KEYS = EXPORT_FIELDS.map((f) => f.key) as ExportFieldKey[];

function getFieldValue(user: UserWithProfile, key: ExportFieldKey): string {
  switch (key) {
    case "nickname":       return user.nickname;
    case "realName":       return user.realName;
    case "email":          return user.email;
    case "provider":       return providerLabel[user.provider] ?? user.provider;
    case "companyType":    return user.companyType;
    case "status":         return statusConfig[user.status].label;
    case "authStatus":     return authStatusConfig[user.authStatus]?.label ?? user.authStatus;
    case "companyName":    return user.companyName;
    case "position":       return user.position;
    case "jobCategory":    return user.jobCategory;
    case "documents": {
      if (!user.documents || user.documents.length === 0) return "";
      return user.documents.map((d) => `${DOC_TYPE_LABEL[d.docType] ?? d.docType}(${DOC_STATUS[d.status]?.label ?? d.status})`).join("; ");
    }
    case "createdAt":      return new Date(user.createdAt).toLocaleDateString("ko-KR");
    case "lastActivityAt": return new Date(user.lastActivityAt).toLocaleDateString("ko-KR");
  }
}

/* ------------------------------------------------------------------ */
/*  Filter State                                                       */
/* ------------------------------------------------------------------ */

type SortType = "LATEST" | "ACTIVITY" | "NAME";

interface FilterState {
  memberType: CompanyType | "ALL";
  memberStatus: MemberStatus | "ALL";
  companyName: string;
  position: string;
  jobCategory: string;
  search: string;
  sort: SortType;
}

const initialFilters: FilterState = {
  memberType: "ALL",
  memberStatus: "ALL",
  companyName: "",
  position: "",
  jobCategory: "",
  search: "",
  sort: "LATEST",
};

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function UsersPage() {
  const { showToast } = useToast();
  const [localUsers, setLocalUsers] = useState<UserWithProfile[]>(() => getAllUsers());
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());


  // Detail modal
  const [selectedUser, setSelectedUser] = useState<UserWithProfile | null>(null);

  // Export modal
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedExportFields, setSelectedExportFields] = useState<Set<ExportFieldKey>>(new Set(ALL_EXPORT_KEYS));
  const [exportTypeSet, setExportTypeSet] = useState<Set<CompanyType>>(new Set(COMPANY_TYPES));

  // Detail modal — status edit state
  const [editStatus, setEditStatus] = useState<MemberStatus>("ACTIVE");
  const [editReason, setEditReason] = useState("");
  const [editReasonError, setEditReasonError] = useState(false);

  // Report history
  const [showAllReports, setShowAllReports] = useState(false);
  const userReports = useMemo(
    () => selectedUser ? getReportsByUserId(selectedUser.id) : [],
    [selectedUser?.id]
  );

  // localUsers 변경 시 localStorage에 저장
  useEffect(() => {
    saveUsers(localUsers);
  }, [localUsers]);

  useEffect(() => {
    if (selectedUser) {
      setEditStatus(selectedUser.status);
      setEditReason(selectedUser.suspendedReason ?? "");
      setShowAllReports(false);
    }
  }, [selectedUser?.id]);

  // Filtering + Sorting
  const filteredUsers = useMemo(() => {
    let result = localUsers.filter((user) => {
      if (filters.memberType !== "ALL" && user.companyType !== filters.memberType) return false;
      if (filters.memberStatus !== "ALL" && user.status !== filters.memberStatus) return false;
      if (filters.companyName && !user.companyName.toLowerCase().includes(filters.companyName.toLowerCase())) return false;
      if (filters.position && !user.position.toLowerCase().includes(filters.position.toLowerCase())) return false;
      if (filters.jobCategory && user.jobCategory !== filters.jobCategory) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        return user.nickname.toLowerCase().includes(q) || user.email.toLowerCase().includes(q) || user.realName.toLowerCase().includes(q);
      }
      return true;
    });
    if (filters.sort === "LATEST")   result = [...result].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (filters.sort === "ACTIVITY") result = [...result].sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt));
    if (filters.sort === "NAME")     result = [...result].sort((a, b) => a.realName.localeCompare(b.realName, "ko"));
    return result;
  }, [localUsers, filters]);

  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, page, pageSize]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const type of COMPANY_TYPES) counts[type] = localUsers.filter((u) => u.companyType === type).length;
    return counts;
  }, [localUsers]);

  function handleFilterChange<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }

  function handleReset() { setFilters(initialFilters); setPage(1); }

  function handleToggleExportField(key: ExportFieldKey) {
    setSelectedExportFields((prev) => { const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next; });
  }

  function handleToggleSelectAllFields(checked: boolean) {
    setSelectedExportFields(checked ? new Set(ALL_EXPORT_KEYS) : new Set());
  }

  const exportUsers = localUsers.filter((u) => exportTypeSet.has(u.companyType));

  function handleConfirmExport() {
    if (selectedExportFields.size === 0) { showToast("내보낼 항목을 하나 이상 선택해주세요."); return; }
    if (exportTypeSet.size === 0) { showToast("내보낼 회원유형을 하나 이상 선택해주세요."); return; }
    const orderedFields = ALL_EXPORT_KEYS.filter((k) => selectedExportFields.has(k));
    const headers = orderedFields.map((k) => EXPORT_FIELDS.find((f) => f.key === k)!.label);
    const rows = exportUsers.map((u) => orderedFields.map((k) => getFieldValue(u, k)));
    const csv = "\uFEFF" + [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `members_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportModal(false);
    showToast(`${exportUsers.length}명의 데이터를 내보냈습니다.`);
  }

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  function confirmDeleteSelected() {
    const deleted = localUsers.filter((u) => selectedIds.has(u.id));
    const count = deleted.length;
    setLocalUsers((prev) => prev.filter((u) => !selectedIds.has(u.id)));
    setSelectedIds(new Set());
    setIsEditing(false);
    setShowDeleteModal(false);
    showToast(`${count}명의 회원이 삭제되었습니다.`, {
      onUndo: () => {
        restoreUsers(deleted);
        setLocalUsers((prev) => [...deleted, ...prev]);
      },
    });
  }


  function handleToggleSelectRow(id: string) {
    setSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }

  const allPageSelected = paginatedUsers.length > 0 && paginatedUsers.every((u) => selectedIds.has(u.id));

  function handleSaveStatus() {
    if (!selectedUser) return;
    if (editStatus === "SUSPENDED" && !editReason.trim()) {
      setEditReasonError(true);
      return;
    }
    setEditReasonError(false);
    const updated: UserWithProfile = {
      ...selectedUser,
      status: editStatus,
      suspendedReason: editStatus === "SUSPENDED" ? editReason.trim() : undefined,
    };
    setLocalUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? updated : u)));
    setSelectedUser(updated);
    if (editStatus === "SUSPENDED") {
      recordLog("USER_SUSPEND", `${selectedUser.nickname} 회원 정지: ${editReason.trim()}`, { targetType: "user", targetId: selectedUser.id });
    } else if (editStatus === "ACTIVE") {
      recordLog("USER_ACTIVATE", `${selectedUser.nickname} 회원 활성화`, { targetType: "user", targetId: selectedUser.id });
    } else if (editStatus === "WITHDRAWN") {
      recordLog("USER_WITHDRAW", `${selectedUser.nickname} 탈퇴 처리`, { targetType: "user", targetId: selectedUser.id });
    }
    showToast("회원 상태가 저장되었습니다.");
  }

  function handleToggleSelectAll() {
    if (allPageSelected) {
      setSelectedIds((prev) => { const next = new Set(prev); paginatedUsers.forEach((u) => next.delete(u.id)); return next; });
    } else {
      setSelectedIds((prev) => new Set([...prev, ...paginatedUsers.map((u) => u.id)]));
    }
  }

  return (
    <div className="space-y-5">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">회원 관리</h2>
          <p className="mt-0.5 text-sm text-slate-500">회원 목록을 조회하고 유형·상태별로 필터링할 수 있습니다.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowExportModal(true)}>
          <Download className="mr-1.5 h-4 w-4" /> CSV 내보내기
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {COMPANY_TYPES.map((type) => {
          const config = memberTypeBadge[type];
          const Icon = config.icon;
          const isActive = filters.memberType === type;
          return (
            <button
              key={type}
              onClick={() => handleFilterChange("memberType", isActive ? "ALL" : type)}
              className={cn(
                "flex items-center gap-3 rounded-xl border bg-white p-4 text-left transition-all hover:shadow-md",
                isActive ? "border-indigo-400 ring-2 ring-indigo-200" : "border-slate-200"
              )}
            >
              <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border", memberTypeColor[type])}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-slate-500">{type}</p>
                <p className="text-xl font-bold text-slate-900">{typeCounts[type] ?? 0}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-600">회원유형</Label>
            <Select value={filters.memberType} onValueChange={(v) => handleFilterChange("memberType", v as CompanyType | "ALL")}>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="전체" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체</SelectItem>
                {COMPANY_TYPES.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-600">회원 상태</Label>
            <Select value={filters.memberStatus} onValueChange={(v) => handleFilterChange("memberStatus", v as MemberStatus | "ALL")}>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="전체" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체</SelectItem>
                <SelectItem value="ACTIVE">정상</SelectItem>
                <SelectItem value="SUSPENDED">정지</SelectItem>
                <SelectItem value="WITHDRAWN">탈퇴</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-600">정렬</Label>
            <Select value={filters.sort} onValueChange={(v) => handleFilterChange("sort", v as SortType)}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="LATEST">최신 가입순</SelectItem>
                <SelectItem value="ACTIVITY">활동순</SelectItem>
                <SelectItem value="NAME">이름순</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-600">직종</Label>
            <Select value={filters.jobCategory || "ALL"} onValueChange={(v) => handleFilterChange("jobCategory", v === "ALL" ? "" : v)}>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="전체" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체</SelectItem>
                {JOB_CATEGORIES.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-600">회사명</Label>
            <Input className="h-9 text-sm" placeholder="회사명 검색..." value={filters.companyName}
              onChange={(e) => handleFilterChange("companyName", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-600">직책</Label>
            <Input className="h-9 text-sm" placeholder="직책 검색..." value={filters.position}
              onChange={(e) => handleFilterChange("position", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-600">통합 검색</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <Input className="h-9 pl-8 text-sm" placeholder="닉네임, 이메일, 실명..." value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)} />
            </div>
          </div>
          <div className="flex items-end">
            <Button variant="outline" size="sm" className="h-9" onClick={handleReset}>
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> 초기화
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <h3 className="text-sm font-semibold text-slate-800">회원 목록</h3>
            <CountDisplay total={filteredUsers.length} unit="명" />
          </div>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedIds(new Set(paginatedUsers.map((u) => u.id)))}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                전체선택
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                disabled={selectedIds.size === 0}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  selectedIds.size > 0 ? "bg-red-50 text-red-600 hover:bg-red-100" : "cursor-not-allowed text-slate-300"
                )}
              >
                삭제 {selectedIds.size > 0 && `(${selectedIds.size})`}
              </button>
              <button onClick={() => { setIsEditing(false); setSelectedIds(new Set()); }}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                완료
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="h-7 cursor-pointer rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-600 hover:border-slate-300 focus:outline-none">
                <option value={10}>10개씩</option>
                <option value={20}>20개씩</option>
                <option value={30}>30개씩</option>
                <option value={40}>40개씩</option>
                <option value={50}>50개씩</option>
              </select>
              <button onClick={() => { setIsEditing(true); setSelectedIds(new Set()); }}
                className="flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                <Pencil className="h-3 w-3" /> 편집
              </button>
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] table-fixed text-sm">
            <colgroup>
              {isEditing && <col className="w-10" />}
              <col className="w-[120px]" />
              <col className="w-[80px]" />
              <col className="w-[180px]" />
              <col className="w-[70px]" />
              <col className="w-[100px]" />
              <col className="w-[60px]" />
              <col className="w-[130px]" />
              <col className="w-[80px]" />
              <col className="w-[80px]" />
              <col className="w-[100px]" />
            </colgroup>
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left">
                {isEditing && (
                  <th className="px-4 py-3">
                    <input type="checkbox" checked={allPageSelected} onChange={handleToggleSelectAll}
                      className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-indigo-600" />
                  </th>
                )}
                <th className="px-5 py-3 text-xs font-semibold text-slate-500">닉네임</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">실명</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">이메일</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">상태</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">회원유형</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500">뱃지</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">회사명</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">직책</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">직종</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">가입일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={isEditing ? 11 : 10} className="py-16 text-center">
                    <Users className="mx-auto mb-3 h-10 w-10 text-slate-200" />
                    <p className="text-sm text-slate-400">검색 결과가 없습니다.</p>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => {
                  const typeConfig = memberTypeBadge[user.companyType];
                  const isSelected = selectedIds.has(user.id);
                  return (
                    <tr
                      key={user.id}
                      onClick={() => { if (isEditing) handleToggleSelectRow(user.id); else setSelectedUser(user); }}
                      className={cn(
                        "transition-colors",
                        isEditing
                          ? isSelected ? "bg-indigo-50/50" : "hover:bg-slate-50/70"
                          : "cursor-pointer hover:bg-slate-50"
                      )}
                    >
                      {isEditing && (
                        <td className="px-4 py-3.5" onClick={(e) => { e.stopPropagation(); handleToggleSelectRow(user.id); }}>
                          <input type="checkbox" checked={isSelected} onChange={() => handleToggleSelectRow(user.id)}
                            className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-indigo-600" />
                        </td>
                      )}
                      <td className="overflow-hidden px-5 py-3.5"><div className="truncate font-medium text-slate-800">{user.nickname}</div></td>
                      <td className="overflow-hidden px-4 py-3.5"><div className="truncate text-slate-700">{user.realName}</div></td>
                      <td className="overflow-hidden px-4 py-3.5"><div className="truncate text-slate-500">{user.email}</div></td>
                      <td className="overflow-hidden px-4 py-3.5">
                        <span className={statusConfig[user.status].chip}>{statusConfig[user.status].label}</span>
                      </td>
                      <td className="overflow-hidden px-4 py-3.5">
                        <Badge variant={typeConfig.variant}>{user.companyType}</Badge>
                      </td>
                      <td className="overflow-hidden px-4 py-3.5 text-center">
                        {user.hasBadge
                          ? <ShieldCheck className="mx-auto h-4.5 w-4.5 text-green-500" />
                          : <ShieldCheck className="mx-auto h-4.5 w-4.5 text-slate-200" />}
                      </td>
                      <td className="overflow-hidden px-4 py-3.5"><div className="truncate text-slate-700">{user.companyName || <span className="text-slate-300">—</span>}</div></td>
                      <td className="overflow-hidden px-4 py-3.5"><div className="truncate text-slate-700">{user.position || <span className="text-slate-300">—</span>}</div></td>
                      <td className="overflow-hidden px-4 py-3.5"><div className="truncate text-slate-500">{user.jobCategory}</div></td>
                      <td className="overflow-hidden px-4 py-3.5"><div className="truncate text-slate-500">{new Date(user.createdAt).toLocaleDateString("ko-KR")}</div></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 pb-4">
          <PaginationBar total={filteredUsers.length} page={page} pageSize={pageSize} onPageChange={setPage} />
        </div>
      </div>

      {/* ── 회원 상세 모달 ──────────────────────────────────────────── */}
      {selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedUser(null); }}
        >
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            {/* Modal Header — avatar + name + close */}
            <div className="flex items-start gap-4 border-b border-slate-100 px-5 py-4">
              <div className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold",
                selectedUser.status === "ACTIVE"    ? "bg-indigo-100 text-indigo-600" :
                selectedUser.status === "SUSPENDED" ? "bg-red-100 text-red-500" :
                "bg-slate-100 text-slate-400"
              )}>
                {selectedUser.nickname.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-bold text-slate-900">{selectedUser.nickname}</span>
                  <span className={statusConfig[selectedUser.status].badge}>{statusConfig[selectedUser.status].label}</span>
                </div>
                <p className="mt-0.5 text-sm text-slate-500">{selectedUser.realName} · {selectedUser.email}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge variant={memberTypeBadge[selectedUser.companyType].variant}>{selectedUser.companyType}</Badge>
                  {selectedUser.hasBadge && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                      <ShieldCheck className="h-3 w-3" /> 인증 뱃지
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)}
                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* 기본 정보 그리드 */}
              <div className="grid gap-4 sm:grid-cols-2">
                <DetailRow icon={Mail}        label="이메일"     value={selectedUser.email} />
                <DetailRow icon={LogIn}       label="가입 경로"  value={providerLabel[selectedUser.provider] ?? selectedUser.provider} />
                <DetailRow icon={Building2}   label="회원유형"  value={selectedUser.companyType} />
                <div className="flex gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">인증 상태</p>
                    <p className={cn("mt-0.5 text-sm font-medium", authStatusConfig[selectedUser.authStatus]?.className)}>
                      {authStatusConfig[selectedUser.authStatus]?.label ?? selectedUser.authStatus}
                    </p>
                  </div>
                </div>
                {selectedUser.companyName && <DetailRow icon={Building2} label="회사명" value={selectedUser.companyName} />}
                {selectedUser.position    && <DetailRow icon={User}      label="직책"   value={selectedUser.position} />}
                <DetailRow icon={Briefcase}   label="직종"       value={selectedUser.jobCategory} />
                <DetailRow icon={CalendarDays} label="가입일"    value={new Date(selectedUser.createdAt).toLocaleString("ko-KR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })} />
                <DetailRow icon={Clock}       label="마지막 활동" value={new Date(selectedUser.lastActivityAt).toLocaleString("ko-KR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })} />
                {selectedUser.status === "SUSPENDED" && selectedUser.suspendedReason && (
                  <div className="sm:col-span-2 flex gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-400">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">정지 사유</p>
                      <p className="mt-0.5 text-sm font-medium text-red-700">{selectedUser.suspendedReason}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* 인증 첨부자료 */}
              <div>
                <h4 className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <FileText className="h-3.5 w-3.5" /> 인증 첨부자료
                </h4>
                {selectedUser.documents && selectedUser.documents.length > 0 ? (
                  <div className="space-y-2">
                    {selectedUser.documents.map((doc, i) => (
                      <div key={i} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-3">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-slate-800">{DOC_TYPE_LABEL[doc.docType] ?? doc.docType}</span>
                            <span className={DOC_STATUS[doc.status]?.className ?? ""}>{DOC_STATUS[doc.status]?.label ?? doc.status}</span>
                          </div>
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="mt-0.5 block truncate text-xs text-indigo-500 hover:underline"
                          >
                            {doc.fileUrl}
                          </a>
                          <p className="mt-0.5 text-xs text-slate-400">
                            업로드: {new Date(doc.uploadedAt).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
                          </p>
                        </div>
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="mt-1 shrink-0 text-slate-400 hover:text-indigo-500 transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed border-slate-200 py-4 text-center text-sm text-slate-400">
                    첨부된 자료가 없습니다.
                  </p>
                )}
              </div>

              {/* 신고 내역 */}
              <div>
                <h4 className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <Flag className="h-3.5 w-3.5" /> 신고 내역
                </h4>
                {userReports.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-200 py-4 text-center text-sm text-slate-400">
                    접수된 신고가 없습니다.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {/* 요약 카운터 */}
                    <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5">
                      <span className="text-sm font-semibold text-slate-700">총 {userReports.length}건</span>
                      <span className="text-slate-300">|</span>
                      {userReports.filter((r) => r.status === "PENDING").length > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                          검토중 {userReports.filter((r) => r.status === "PENDING").length}
                        </span>
                      )}
                      {userReports.filter((r) => r.status === "RESOLVED").length > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                          조치완료 {userReports.filter((r) => r.status === "RESOLVED").length}
                        </span>
                      )}
                      {userReports.filter((r) => r.status === "DISMISSED").length > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-500">
                          기각 {userReports.filter((r) => r.status === "DISMISSED").length}
                        </span>
                      )}
                    </div>
                    {/* 신고 목록 */}
                    {(showAllReports ? userReports : userReports.slice(0, 3)).map((report) => (
                      <div
                        key={report.id}
                        className={cn(
                          "rounded-xl border px-3.5 py-3 text-xs space-y-1.5",
                          report.status === "PENDING"
                            ? "border-amber-200 bg-amber-50/60"
                            : report.status === "RESOLVED"
                            ? "border-red-100 bg-red-50/40"
                            : "border-slate-100 bg-slate-50 opacity-70"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {report.targetType === "CONTENT_COMMENT" && <MessageSquare className="h-3 w-3 shrink-0 text-slate-400" />}
                            {(report.targetType === "QNA_QUESTION" || report.targetType === "QNA_ANSWER") && <HelpCircle className="h-3 w-3 shrink-0 text-slate-400" />}
                            {report.targetType === "STUDY_COMMENT" && <BookOpen className="h-3 w-3 shrink-0 text-slate-400" />}
                            <span className="shrink-0 font-medium text-slate-500">
                              {REPORT_TARGET_LABEL[report.targetType]}
                            </span>
                            <span className="truncate text-slate-600">{report.targetTitle}</span>
                          </div>
                          <span className={cn(
                            "shrink-0 rounded-full px-2 py-0.5 font-medium",
                            report.status === "PENDING"   && "bg-amber-100 text-amber-700",
                            report.status === "RESOLVED"  && "bg-red-100 text-red-700",
                            report.status === "DISMISSED" && "bg-slate-200 text-slate-500"
                          )}>
                            {report.status === "PENDING" ? "검토중" : report.status === "RESOLVED" ? "조치완료" : "기각"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-400">
                          <span>사유: <span className="text-slate-600">{REPORT_REASON_LABEL[report.reason]}{report.reasonDetail ? ` — ${report.reasonDetail}` : ""}</span></span>
                          <span className="shrink-0">{new Date(report.reportedAt).toLocaleDateString("ko-KR")}</span>
                        </div>
                        {report.adminNote && (
                          <p className="text-slate-500">관리자 메모: {report.adminNote}</p>
                        )}
                      </div>
                    ))}
                    {userReports.length > 3 && (
                      <button
                        onClick={() => setShowAllReports((v) => !v)}
                        className="flex w-full items-center justify-center gap-1 rounded-lg border border-slate-200 py-1.5 text-xs text-slate-500 hover:bg-slate-50 transition-colors"
                      >
                        {showAllReports
                          ? <><ChevronUp className="h-3 w-3" /> 접기</>
                          : <><ChevronDown className="h-3 w-3" /> {userReports.length - 3}건 더 보기</>
                        }
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* 상태 변경 */}
              <div>
                <h4 className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <User className="h-3.5 w-3.5" /> 상태 변경
                </h4>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">
                  {(() => {
                    const hasChanges =
                      editStatus !== selectedUser.status ||
                      (editStatus === "SUSPENDED" && editReason.trim() !== (selectedUser.suspendedReason ?? "").trim());
                    const saveBtn = (
                      <button
                        onClick={handleSaveStatus}
                        disabled={!hasChanges}
                        className={cn(
                          "shrink-0 h-9 rounded-lg px-4 text-sm font-medium transition-colors",
                          hasChanges
                            ? "bg-indigo-600 text-white hover:bg-indigo-700"
                            : "cursor-not-allowed bg-slate-100 text-slate-400"
                        )}
                      >
                        저장
                      </button>
                    );
                    return editStatus === "SUSPENDED" ? (
                      <>
                        <Select value={editStatus} onValueChange={(v) => setEditStatus(v as MemberStatus)}>
                          <SelectTrigger className="h-9 text-sm bg-white"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ACTIVE">정상</SelectItem>
                            <SelectItem value="SUSPENDED">정지</SelectItem>
                            <SelectItem value="WITHDRAWN">탈퇴</SelectItem>
                          </SelectContent>
                        </Select>
                        <textarea
                          value={editReason}
                          onChange={(e) => { setEditReason(e.target.value); if (editReasonError) setEditReasonError(false); }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                              e.preventDefault();
                              handleSaveStatus();
                            }
                          }}
                          placeholder="정지 사유를 입력해주세요..."
                          rows={3}
                          className={cn(
                            "w-full resize-none rounded-lg border bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1",
                            editReasonError
                              ? "border-red-400 focus:border-red-400 focus:ring-red-200"
                              : "border-slate-200 focus:border-indigo-400 focus:ring-indigo-200"
                          )}
                        />
                        {editReasonError && (
                          <p className="text-xs text-red-500">정지 사유를 입력해주세요.</p>
                        )}
                        <div className="flex justify-end">{saveBtn}</div>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Select value={editStatus} onValueChange={(v) => setEditStatus(v as MemberStatus)}>
                          <SelectTrigger className="h-9 flex-1 text-sm bg-white"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ACTIVE">정상</SelectItem>
                            <SelectItem value="SUSPENDED">정지</SelectItem>
                            <SelectItem value="WITHDRAWN">탈퇴</SelectItem>
                          </SelectContent>
                        </Select>
                        {saveBtn}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end border-t border-slate-100 px-5 py-3.5">
              <button
                onClick={() => setSelectedUser(null)}
                className="rounded-lg border border-slate-200 px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CSV 내보내기 모달 ─────────────────────────────────────────── */}
      {showExportModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowExportModal(false); }}
        >
          <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
            {/* Header */}
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
            {/* Body */}
            <div className="max-h-[60vh] overflow-y-auto px-5 py-4 space-y-4">
              {/* 회원유형 선택 */}
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input type="checkbox"
                      className="h-3.5 w-3.5 accent-indigo-600"
                      checked={exportTypeSet.size === COMPANY_TYPES.length}
                      onChange={(e) => setExportTypeSet(e.target.checked ? new Set(COMPANY_TYPES) : new Set())} />
                    내보낼 대상 (전체 선택)
                  </label>
                  <span className="text-xs text-slate-400">{exportTypeSet.size}/{COMPANY_TYPES.length}</span>
                </div>
                <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2.5">
                  {COMPANY_TYPES.map((type) => {
                    const count = localUsers.filter((u) => u.companyType === type).length;
                    return (
                      <label key={type} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={exportTypeSet.has(type)}
                          onChange={() => setExportTypeSet((prev) => {
                            const next = new Set(prev);
                            next.has(type) ? next.delete(type) : next.add(type);
                            return next;
                          })}
                          className="h-3.5 w-3.5 accent-indigo-600" />
                        <span className="text-xs text-slate-700">{type}</span>
                        <span className="text-xs text-slate-400">({count})</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <p className="text-xs text-slate-500">
                총 <span className="font-semibold text-indigo-600">{exportUsers.length.toLocaleString()}명</span>을 내보냅니다.
              </p>
              {/* 내보낼 항목 */}
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input type="checkbox"
                      className="h-3.5 w-3.5 accent-indigo-600"
                      checked={selectedExportFields.size === ALL_EXPORT_KEYS.length}
                      onChange={(e) => handleToggleSelectAllFields(e.target.checked)} />
                    전체 선택
                  </label>
                  <span className="text-xs text-slate-400">{selectedExportFields.size}/{ALL_EXPORT_KEYS.length}</span>
                </div>
                <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2.5">
                  {EXPORT_FIELDS.map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={selectedExportFields.has(key)}
                        onChange={() => handleToggleExportField(key)}
                        className="h-3.5 w-3.5 accent-indigo-600" />
                      <span className="text-xs text-slate-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            {/* Footer */}
            <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3.5">
              <button onClick={() => setShowExportModal(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                취소
              </button>
              <button onClick={handleConfirmExport}
                disabled={selectedExportFields.size === 0 || exportTypeSet.size === 0}
                className={cn(
                  "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  selectedExportFields.size > 0 && exportTypeSet.size > 0
                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                    : "cursor-not-allowed bg-slate-100 text-slate-400"
                )}>
                내보내기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteModal(false); }}>
          <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
            <div className="px-5 pt-5 pb-4 space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">회원 삭제</h3>
              <p className="text-sm text-slate-600">선택한 {selectedIds.size}명의 회원을 삭제하시겠습니까?</p>
              <p className="rounded-lg bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-600">삭제 후 하단 토스트에서 실행취소할 수 있습니다.</p>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3.5">
              <button onClick={() => setShowDeleteModal(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">취소</button>
              <button onClick={confirmDeleteSelected} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors">삭제</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub Component                                                      */
/* ------------------------------------------------------------------ */

function DetailRow({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="mt-0.5 text-sm font-medium text-slate-800">{value}</p>
      </div>
    </div>
  );
}
