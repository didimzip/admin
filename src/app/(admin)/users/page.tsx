"use client";

import { useState, useMemo } from "react";
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
  Trash2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { mockUsers, COMPANY_TYPES, JOB_CATEGORIES } from "@/data/mock-users";
import type { CompanyType } from "@/types/user";
import { PaginationBar, CountDisplay } from "@/components/ui/pagination-bar";
import { PAGE_SIZE_OPTIONS } from "@/components/ui/pagination-bar";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const companyTypeBadge: Record<
  CompanyType,
  { variant: "default" | "success" | "purple" | "warning" | "secondary"; icon: typeof Building2 }
> = {
  스타트업: { variant: "default", icon: Building2 },
  투자사: { variant: "success", icon: Landmark },
  공공기관: { variant: "purple", icon: Landmark },
  전문직: { variant: "warning", icon: Briefcase },
  기타: { variant: "secondary", icon: CircleDot },
};

const companyTypeColor: Record<CompanyType, string> = {
  스타트업: "bg-blue-50 border-blue-200 text-blue-700",
  투자사: "bg-green-50 border-green-200 text-green-700",
  공공기관: "bg-purple-50 border-purple-200 text-purple-700",
  전문직: "bg-orange-50 border-orange-200 text-orange-700",
  기타: "bg-slate-50 border-slate-200 text-slate-600",
};

/* ------------------------------------------------------------------ */
/*  Filter State                                                       */
/* ------------------------------------------------------------------ */

interface FilterState {
  companyType: CompanyType | "ALL";
  companyName: string;
  position: string;
  jobCategory: string;
  search: string;
}

const initialFilters: FilterState = {
  companyType: "ALL",
  companyName: "",
  position: "",
  jobCategory: "",
  search: "",
};

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function UsersPage() {
  const [localUsers, setLocalUsers] = useState(mockUsers);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filtering
  const filteredUsers = useMemo(() => {
    return localUsers.filter((user) => {
      if (filters.companyType !== "ALL" && user.companyType !== filters.companyType) return false;
      if (filters.companyName && !user.companyName.toLowerCase().includes(filters.companyName.toLowerCase())) return false;
      if (filters.position && !user.position.toLowerCase().includes(filters.position.toLowerCase())) return false;
      if (filters.jobCategory && user.jobCategory !== filters.jobCategory) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        return user.nickname.toLowerCase().includes(q) || user.email.toLowerCase().includes(q) || user.realName.toLowerCase().includes(q);
      }
      return true;
    });
  }, [localUsers, filters]);

  // Pagination
  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, page, pageSize]);

  // Summary counts
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const type of COMPANY_TYPES) {
      counts[type] = localUsers.filter((u) => u.companyType === type).length;
    }
    return counts;
  }, [localUsers]);

  function handleFilterChange(key: keyof FilterState, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }

  function handleReset() {
    setFilters(initialFilters);
    setPage(1);
  }

  function handleExportCsv() {
    const headers = ["닉네임", "실명", "이메일", "기업유형", "회사명", "직책", "직종", "인증뱃지", "가입일"];
    const rows = filteredUsers.map((u) => [
      u.nickname, u.realName, u.email, u.companyType, u.companyName,
      u.position, u.jobCategory, u.hasBadge ? "O" : "X",
      new Date(u.createdAt).toLocaleDateString("ko-KR"),
    ]);
    const csv = "\uFEFF" + [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `members_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleToggleEdit() {
    setIsEditing(true);
    setSelectedIds(new Set());
  }

  function handleDeleteSelected() {
    setLocalUsers((prev) => prev.filter((u) => !selectedIds.has(u.id)));
    setSelectedIds(new Set());
  }

  function handleDeleteAll() {
    setLocalUsers([]);
    setSelectedIds(new Set());
    setIsEditing(false);
  }

  function handleToggleSelectRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const allPageSelected = paginatedUsers.length > 0 && paginatedUsers.every((u) => selectedIds.has(u.id));

  function handleToggleSelectAll() {
    if (allPageSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginatedUsers.forEach((u) => next.delete(u.id));
        return next;
      });
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
          <p className="mt-0.5 text-sm text-slate-500">회원 목록을 조회하고 기업 유형별로 필터링할 수 있습니다.</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportCsv}>
          <Download className="mr-1.5 h-4 w-4" />
          CSV 내보내기
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {COMPANY_TYPES.map((type) => {
          const config = companyTypeBadge[type];
          const Icon = config.icon;
          const isActive = filters.companyType === type;
          return (
            <button
              key={type}
              onClick={() => handleFilterChange("companyType", isActive ? "ALL" : type)}
              className={cn(
                "flex items-center gap-3 rounded-xl border bg-white p-4 text-left transition-all hover:shadow-md",
                isActive ? "border-indigo-400 ring-2 ring-indigo-200" : "border-slate-200"
              )}
            >
              <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border", companyTypeColor[type])}>
                <Icon className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-xs text-slate-500">{type}</p>
                <p className="text-xl font-bold text-slate-900">{typeCounts[type]}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {/* Company Type */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-600">기업 유형</Label>
            <Select value={filters.companyType} onValueChange={(v) => handleFilterChange("companyType", v)}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체</SelectItem>
                {COMPANY_TYPES.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Company Name */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-600">회사명</Label>
            <Input className="h-9 text-sm" placeholder="회사명 검색..." value={filters.companyName}
              onChange={(e) => handleFilterChange("companyName", e.target.value)} />
          </div>

          {/* Position */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-600">직책</Label>
            <Input className="h-9 text-sm" placeholder="직책 검색..." value={filters.position}
              onChange={(e) => handleFilterChange("position", e.target.value)} />
          </div>

          {/* Job Category */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-600">직종</Label>
            <Select value={filters.jobCategory || "ALL"} onValueChange={(v) => handleFilterChange("jobCategory", v === "ALL" ? "" : v)}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체</SelectItem>
                {JOB_CATEGORIES.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Search */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-600">통합 검색</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <Input className="h-9 pl-8 text-sm" placeholder="닉네임, 이메일, 실명..." value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-end gap-2">
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
                onClick={handleDeleteSelected}
                disabled={selectedIds.size === 0}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  selectedIds.size > 0
                    ? "bg-red-50 text-red-600 hover:bg-red-100"
                    : "cursor-not-allowed text-slate-300"
                )}
              >
                선택삭제 {selectedIds.size > 0 && `(${selectedIds.size})`}
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
                onClick={handleToggleEdit}
                className="flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Pencil className="h-3 w-3" /> 편집
              </button>
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left">
                {isEditing && (
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allPageSelected}
                      onChange={handleToggleSelectAll}
                      className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-indigo-600"
                    />
                  </th>
                )}
                <th className="px-5 py-3 text-xs font-semibold text-slate-500">닉네임</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">실명</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">이메일</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">기업유형</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">회사명</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">직책</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">직종</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500">뱃지</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">가입일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={isEditing ? 10 : 9} className="py-16 text-center">
                    <Users className="mx-auto mb-3 h-10 w-10 text-slate-200" />
                    <p className="text-sm text-slate-400">검색 결과가 없습니다.</p>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => {
                  const typeConfig = companyTypeBadge[user.companyType];
                  const isSelected = selectedIds.has(user.id);
                  return (
                    <tr
                      key={user.id}
                      className={cn(
                        "transition-colors hover:bg-slate-50/70",
                        isSelected && "bg-indigo-50/50"
                      )}
                    >
                      {isEditing && (
                        <td className="px-4 py-3.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectRow(user.id)}
                            className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-indigo-600"
                          />
                        </td>
                      )}
                      <td className="px-5 py-3.5 font-medium text-slate-800">{user.nickname}</td>
                      <td className="px-4 py-3.5 text-slate-700">{user.realName}</td>
                      <td className="px-4 py-3.5 text-slate-500">{user.email}</td>
                      <td className="px-4 py-3.5">
                        <Badge variant={typeConfig.variant}>{user.companyType}</Badge>
                      </td>
                      <td className="px-4 py-3.5 text-slate-700">{user.companyName}</td>
                      <td className="px-4 py-3.5 text-slate-700">{user.position}</td>
                      <td className="px-4 py-3.5 text-slate-500">{user.jobCategory}</td>
                      <td className="px-4 py-3.5 text-center">
                        {user.hasBadge ? (
                          <ShieldCheck className="mx-auto h-4.5 w-4.5 text-green-500" />
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500">
                        {new Date(user.createdAt).toLocaleDateString("ko-KR")}
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
            total={filteredUsers.length}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  );
}
