"use client";

import { cn } from "@/lib/utils";

export const PAGE_SIZE_OPTIONS = [20, 30, 40, 50] as const;

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 1) return total === 1 ? [1] : [];
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "...")[] = [1];

  if (current - 2 > 2) pages.push("...");
  for (let i = Math.max(2, current - 2); i <= Math.min(total - 1, current + 2); i++) {
    pages.push(i);
  }
  if (current + 2 < total - 1) pages.push("...");

  pages.push(total);
  return pages;
}

export interface PaginationBarProps {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function PaginationBar({
  total,
  page,
  pageSize,
  onPageChange,
}: PaginationBarProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const pageNumbers = getPageNumbers(page, totalPages);

  return (
    <div className="border-t border-slate-200 pt-4">
      {/* Pagination centered */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {/* Prev */}
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className={cn(
              "text-sm font-medium transition-colors",
              page === 1
                ? "cursor-not-allowed text-slate-300"
                : "text-slate-500 hover:text-slate-900"
            )}
          >
            ← 이전
          </button>

          {/* Page numbers */}
          <div className="flex items-center gap-1">
            {pageNumbers.map((p, idx) =>
              p === "..." ? (
                <span
                  key={`el-${idx}`}
                  className="px-1 text-sm text-slate-400"
                >
                  ···
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => onPageChange(p as number)}
                  className={cn(
                    "min-w-8 px-2 py-1 text-sm font-medium transition-colors",
                    page === p
                      ? "text-slate-900 font-bold"
                      : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  {p}
                </button>
              )
            )}
          </div>

          {/* Next */}
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className={cn(
              "text-sm font-medium transition-colors",
              page === totalPages
                ? "cursor-not-allowed text-slate-300"
                : "text-slate-500 hover:text-slate-900"
            )}
          >
            다음 →
          </button>
        </div>
      )}
    </div>
  );
}

/** 테이블 헤더 우측 카운트 표시 */
export function CountDisplay({ total, unit = "건" }: { total: number; unit?: string }) {
  return (
    <span className="text-sm text-slate-600">
      총 <span className="font-semibold text-slate-900">{total.toLocaleString()}</span>{unit}
    </span>
  );
}
