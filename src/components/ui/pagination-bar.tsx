"use client";

import { cn } from "@/lib/utils";
import { RiArrowLeftSLine, RiArrowRightSLine } from "react-icons/ri";

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
  onPageSizeChange: (size: number) => void;
}

export function PaginationBar({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: PaginationBarProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const pageNumbers = getPageNumbers(page, totalPages);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Count info */}
      <p className="text-xs text-slate-500">
        총{" "}
        <span className="font-semibold text-slate-700">{total.toLocaleString()}</span>건
        {total > 0 && (
          <>
            {" "}
            · {start}–{end}건 표시
          </>
        )}
      </p>

      <div className="flex items-center gap-2">
        {/* Page buttons */}
        {totalPages > 1 && (
          <div className="flex items-center gap-0.5">
            {/* Prev */}
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <RiArrowLeftSLine className="h-4 w-4" />
            </button>

            {pageNumbers.map((p, idx) =>
              p === "..." ? (
                <span
                  key={`el-${idx}`}
                  className="flex h-8 w-8 items-center justify-center text-xs text-slate-400"
                >
                  ···
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => onPageChange(p as number)}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-colors",
                    page === p
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  {p}
                </button>
              )
            )}

            {/* Next */}
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <RiArrowRightSLine className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Page size selector */}
        <select
          value={pageSize}
          onChange={(e) => {
            onPageSizeChange(Number(e.target.value));
            onPageChange(1);
          }}
          className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-600 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        >
          {PAGE_SIZE_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}개씩 보기
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
