"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, ExternalLink, Eye, EyeOff, Clock, SquarePen,
  Layers, MonitorPlay,
  Search, GripVertical, BarChart3,
} from "lucide-react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useToast } from "@/lib/toast-context";
import { Button } from "@/components/ui/button";
import {
  BANNER_POSITIONS,
} from "@/data/mock-data";
import { PaginationBar, CountDisplay } from "@/components/ui/pagination-bar";
import {
  getAllBanners, deleteBanners, toggleBannerActive,
  reorderHeroSlides, type StoredBanner,
} from "@/lib/banner-store";
import { cn } from "@/lib/utils";

// ─── Helpers ────────────────────────────────────────────────────────────────

function isFutureDate(dateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return target > today;
}

function BannerStatusBadge({ banner }: { banner: StoredBanner }) {
  if (banner.isActive && isFutureDate(banner.startDate)) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
        <Clock className="h-3 w-3" /> 노출 예정
      </span>
    );
  }
  if (banner.isActive) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700">
        <Eye className="h-3 w-3" /> 노출 중
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
      <EyeOff className="h-3 w-3" /> 종료
    </span>
  );
}

// ─── Sortable Hero Item ─────────────────────────────────────────────────────

function SortableHeroItem({
  slide,
  index,
  heroEditing,
  isHeroSelected,
  onToggleSelect,
  onToggleActive,
}: {
  slide: StoredBanner;
  index: number;
  heroEditing: boolean;
  isHeroSelected: boolean;
  onToggleSelect: (id: string) => void;
  onToggleActive: (id: string) => void;
}) {
  const router = useRouter();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slide.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const ctr = slide.impressionCount > 0
    ? ((slide.clickCount / slide.impressionCount) * 100).toFixed(1)
    : "0";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group transition-all cursor-pointer",
        heroEditing && isHeroSelected && "bg-indigo-50/40",
      )}
      onClick={() => heroEditing ? onToggleSelect(slide.id) : router.push(`/banners/${slide.id}`)}
    >
      <div className="flex gap-4 px-5 py-4">
        {/* Left: drag handle (always) + checkbox (edit mode only) */}
        <div className="flex items-center gap-2">
          <span
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing touch-none text-slate-300 hover:text-slate-400"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4" />
          </span>
          {heroEditing && (
            <input
              type="checkbox"
              checked={isHeroSelected}
              onChange={() => onToggleSelect(slide.id)}
              onClick={(e) => e.stopPropagation()}
              className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-indigo-600"
            />
          )}
        </div>

        {/* Thumbnail */}
        <div
          className="relative shrink-0 w-[280px] aspect-[4.8/1] rounded-lg bg-slate-200 overflow-hidden"
        >
          {(slide.imageData || slide.imageUrl) && (
            <img
              src={slide.imageData || slide.imageUrl}
              alt={slide.title}
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          {/* Overlay text on thumbnail */}
          <div className="absolute inset-0 flex flex-col justify-center" style={{ maxWidth: "55%", paddingLeft: "6%" }}>
            {slide.subtitle && (
              <span className={cn(
                "mb-0.5 w-fit rounded-full px-1 py-px text-[5px] font-medium",
                slide.textColor === "dark" ? "bg-black/8 text-black/60" : "bg-white/15 text-white/80"
              )}>
                {slide.subtitle}
              </span>
            )}
            <h4 className={cn(
              "whitespace-pre-line text-[9px] font-bold leading-tight",
              slide.textColor === "dark" ? "text-black/90" : "text-white"
            )}>
              {slide.title}
            </h4>
            {slide.subText && (
              <span className={cn(
                "mt-0.5 whitespace-pre-line text-[5px] leading-relaxed",
                slide.textColor === "dark" ? "text-black/45" : "text-white/60"
              )}>
                {slide.subText}
              </span>
            )}
          </div>
          {/* Order badge */}
          <div className="absolute top-1.5 left-1.5 rounded bg-black/50 px-1.5 py-0.5 text-[9px] font-medium text-white backdrop-blur-sm">
            {index + 1}
          </div>
        </div>

        {/* Info */}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">{slide.startDate} ~ {slide.endDate || "상시 노출"}</span>
          </div>
          <h4
            className="truncate text-sm font-semibold text-slate-800"
          >
            {slide.title.replace(/\n/g, " ")}
          </h4>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>노출 <span className="font-medium text-slate-600">{slide.impressionCount.toLocaleString()}</span></span>
            <span>클릭 <span className="font-medium text-slate-600">{slide.clickCount.toLocaleString()}</span></span>
            <span>CTR <span className={cn("font-semibold", Number(ctr) > 0 ? "text-indigo-600" : "text-slate-600")}>{ctr}%</span></span>
          </div>
        </div>

        {/* Toggle active + status */}
        {!heroEditing && (
          <div className="flex flex-col items-end justify-center gap-1.5">
            <button
              onClick={(e) => { e.stopPropagation(); onToggleActive(slide.id); }}
              title={slide.isActive ? "노출 중지" : "노출 시작"}
              className={cn(
                "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
                slide.isActive ? "bg-indigo-600" : "bg-slate-300"
              )}
            >
              <span className={cn(
                "inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform",
                slide.isActive ? "translate-x-[18px]" : "translate-x-[3px]"
              )} />
            </button>
            <span className={cn(
              "text-[10px] font-medium",
              slide.isActive && isFutureDate(slide.startDate)
                ? "text-amber-500"
                : slide.isActive
                  ? "text-indigo-600"
                  : "text-slate-400"
            )}>
              {slide.isActive && isFutureDate(slide.startDate) ? "노출 예정" : slide.isActive ? "노출 중" : "종료"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function BannersPage() {
  const router = useRouter();
  const { showToast } = useToast();

  // data
  const [banners, setBanners] = useState<StoredBanner[]>(() => getAllBanners());
  const reload = () => setBanners(getAllBanners());

  // tab
  const [activeTab, setActiveTab] = useState<"HERO_SLIDE" | "AD">("HERO_SLIDE");

  // search
  const [searchQuery, setSearchQuery] = useState("");

  // shared status filter
  const [heroStatusFilter, setHeroStatusFilter] = useState<"ALL" | "ACTIVE" | "SCHEDULED" | "INACTIVE">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "SCHEDULED" | "INACTIVE">("ALL");

  // ad table state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());


  // ─── Derived data ──────────────────────────────────────────────────────────

  const allHeroSlides = useMemo(
    () => banners.filter((b) => b.bannerType === "HERO_SLIDE").sort((a, b) => a.sortOrder - b.sortOrder),
    [banners]
  );

  const heroSlides = useMemo(() => {
    let list = allHeroSlides;
    if (heroStatusFilter === "ACTIVE") list = list.filter((b) => b.isActive && !isFutureDate(b.startDate));
    else if (heroStatusFilter === "SCHEDULED") list = list.filter((b) => b.isActive && isFutureDate(b.startDate));
    else if (heroStatusFilter === "INACTIVE") list = list.filter((b) => !b.isActive);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((b) => b.title.toLowerCase().includes(q) || b.subtitle.toLowerCase().includes(q) || b.subText.toLowerCase().includes(q));
    }
    return list;
  }, [allHeroSlides, heroStatusFilter, searchQuery]);

  const adBanners = useMemo(() => {
    return banners.filter((b) => {
      if (b.bannerType !== "AD") return false;
      if (statusFilter === "ACTIVE" && (!b.isActive || isFutureDate(b.startDate))) return false;
      if (statusFilter === "SCHEDULED" && (!b.isActive || !isFutureDate(b.startDate))) return false;
      if (statusFilter === "INACTIVE" && b.isActive) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        if (!b.title.toLowerCase().includes(q) && !b.description.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [banners, statusFilter, searchQuery]);

  const adPaginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return adBanners.slice(start, start + pageSize);
  }, [adBanners, page, pageSize]);

  // ─── Stats ─────────────────────────────────────────────────────────────────

  const heroCount = banners.filter((b) => b.bannerType === "HERO_SLIDE").length;
  const adCount = banners.filter((b) => b.bannerType === "AD").length;

  // Tab-specific stats
  const currentTabBanners = banners.filter((b) => b.bannerType === activeTab);
  const tabActiveCount = currentTabBanners.filter((b) => b.isActive && !isFutureDate(b.startDate)).length;
  const tabScheduledCount = currentTabBanners.filter((b) => b.isActive && isFutureDate(b.startDate)).length;
  const tabTotalImpressions = currentTabBanners.reduce((a, b) => a + b.impressionCount, 0);
  const tabTotalClicks = currentTabBanners.reduce((a, b) => a + b.clickCount, 0);
  const tabAvgCtr = tabTotalImpressions > 0 ? ((tabTotalClicks / tabTotalImpressions) * 100).toFixed(1) : "0";

  // ─── Select helpers (ad table) ─────────────────────────────────────────────

  const allPageSelected = adPaginated.length > 0 && adPaginated.every((b) => selectedIds.has(b.id));

  const handleToggleSelectAll = () => {
    const pageIds = adPaginated.map((b) => b.id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ─── Actions ───────────────────────────────────────────────────────────────

  const handleDeleteSelected = () => {
    const count = selectedIds.size;
    if (!window.confirm(`선택된 배너 ${count}개를 삭제하시겠습니까?`)) return;
    deleteBanners(Array.from(selectedIds));
    setSelectedIds(new Set());
    reload();
    showToast(`${count}개 배너가 삭제되었습니다.`);
  };

  const handleDeleteAdAll = () => {
    const ids = adBanners.map((b) => b.id);
    if (!ids.length) return;
    if (!window.confirm(`전체 광고 배너 ${ids.length}개를 삭제하시겠습니까?`)) return;
    deleteBanners(ids);
    setSelectedIds(new Set());
    setIsEditing(false);
    reload();
    showToast(`${ids.length}개 배너가 삭제되었습니다.`);
  };

  const handleToggleActive = (id: string) => {
    toggleBannerActive(id);
    reload();
  };

  // ─── Hero edit mode ──────────────────────────────────────────────────────────

  const [heroEditing, setHeroEditing] = useState(false);
  const [heroSelectedIds, setHeroSelectedIds] = useState<Set<string>>(new Set());

  const heroAllSelected = heroSlides.length > 0 && heroSlides.every((s) => heroSelectedIds.has(s.id));

  const handleHeroToggleSelectAll = () => {
    if (heroAllSelected) setHeroSelectedIds(new Set());
    else setHeroSelectedIds(new Set(heroSlides.map((s) => s.id)));
  };

  const handleHeroToggleSelect = (id: string) => {
    setHeroSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleDeleteHeroSelected = () => {
    const count = heroSelectedIds.size;
    if (!count) return;
    if (!window.confirm(`선택된 슬라이드 ${count}개를 삭제하시겠습니까?`)) return;
    deleteBanners(Array.from(heroSelectedIds));
    setHeroSelectedIds(new Set());
    reload();
    showToast(`${count}개 슬라이드가 삭제되었습니다.`);
  };

  const handleDeleteHeroAll = () => {
    const ids = allHeroSlides.map((s) => s.id);
    if (!ids.length) return;
    if (!window.confirm(`전체 슬라이드 ${ids.length}개를 삭제하시겠습니까?`)) return;
    deleteBanners(ids);
    setHeroSelectedIds(new Set());
    setHeroEditing(false);
    reload();
    showToast(`${ids.length}개 슬라이드가 삭제되었습니다.`);
  };

  // ─── Hero drag-and-drop reorder (@dnd-kit) ────────────────────────────────

  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDndDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDndDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    if (!over || active.id === over.id) return;
    const ids = allHeroSlides.map((s) => s.id);
    const oldIndex = ids.indexOf(active.id as string);
    const newIndex = ids.indexOf(over.id as string);
    if (oldIndex !== -1 && newIndex !== -1) {
      const newIds = arrayMove(ids, oldIndex, newIndex);
      reorderHeroSlides(newIds);
      reload();
    }
  };

  const activeDragSlide = activeDragId ? allHeroSlides.find((s) => s.id === activeDragId) : null;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">배너 관리</h2>
          <p className="mt-0.5 text-sm text-slate-500">히어로 슬라이드와 광고 배너를 등록하고 성과를 확인합니다.</p>
        </div>
        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={() => router.push(`/banners/new?type=${activeTab}`)}>
          <Plus className="mr-1.5 h-4 w-4" /> 배너 등록
        </Button>
      </div>

      {/* Summary Cards — tab-aware */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          {
            label: activeTab === "HERO_SLIDE" ? "전체 슬라이드" : "전체 배너",
            value: activeTab === "HERO_SLIDE" ? heroCount : adCount,
            icon: activeTab === "HERO_SLIDE" ? MonitorPlay : Layers,
            bg: "bg-indigo-50 border-indigo-200", color: "text-indigo-600",
          },
          {
            label: "노출 중",
            value: tabActiveCount,
            sub: tabScheduledCount > 0 ? `예정 ${tabScheduledCount}` : undefined,
            icon: Eye,
            bg: "bg-green-50 border-green-200", color: "text-green-600",
          },
          {
            label: "총 클릭 수",
            value: tabTotalClicks.toLocaleString(),
            sub: `노출 ${tabTotalImpressions.toLocaleString()}`,
            icon: ExternalLink,
            bg: "bg-purple-50 border-purple-200", color: "text-purple-600",
          },
          {
            label: "평균 CTR",
            value: `${tabAvgCtr}%`,
            icon: BarChart3,
            bg: Number(tabAvgCtr) > 0 ? "bg-indigo-50 border-indigo-200" : "bg-slate-50 border-slate-200",
            color: Number(tabAvgCtr) > 0 ? "text-indigo-600" : "text-slate-400",
            highlight: Number(tabAvgCtr) > 0,
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border", card.bg)}>
                <Icon className={cn("h-5 w-5", card.color)} />
              </div>
              <div>
                <p className="text-xs text-slate-500">{card.label}</p>
                <div className="flex items-baseline gap-1.5">
                  <p className={cn("text-2xl font-bold", (card as { highlight?: boolean }).highlight ? "text-indigo-600" : "text-slate-900")}>{card.value}</p>
                  {(card as { sub?: string }).sub && (
                    <span className="text-[11px] text-slate-400">{(card as { sub?: string }).sub}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 w-fit">
        <button
          onClick={() => { setActiveTab("HERO_SLIDE"); setPage(1); setIsEditing(false); setSelectedIds(new Set()); }}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "HERO_SLIDE" ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <MonitorPlay className="h-4 w-4" /> 히어로 슬라이드
        </button>
        <button
          onClick={() => { setActiveTab("AD"); setPage(1); setIsEditing(false); setSelectedIds(new Set()); }}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "AD" ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <Layers className="h-4 w-4" /> 광고 배너
        </button>
      </div>

      {/* Filters + Search (campaigns style) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {activeTab === "HERO_SLIDE" ? (
            <>
              {([
                { key: "ALL" as const, label: "전체" },
                { key: "ACTIVE" as const, label: "노출 중" },
                { key: "SCHEDULED" as const, label: "노출 예정" },
                { key: "INACTIVE" as const, label: "종료" },
              ]).map((f) => (
                <button
                  key={f.key}
                  onClick={() => { setHeroStatusFilter(f.key); setPage(1); }}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    heroStatusFilter === f.key ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </>
          ) : (
            <>
              {([
                { key: "ALL" as const, label: "전체" },
                { key: "ACTIVE" as const, label: "노출 중" },
                { key: "SCHEDULED" as const, label: "노출 예정" },
                { key: "INACTIVE" as const, label: "종료" },
              ]).map((f) => (
                <button
                  key={f.key}
                  onClick={() => { setStatusFilter(f.key); setPage(1); }}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    statusFilter === f.key ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            placeholder="배너명, 소제목, 서브텍스트 검색"
            className="h-8 w-52 rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none"
          />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* HERO SLIDE TAB — Card Layout                                          */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "HERO_SLIDE" && (
        <div className="space-y-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {/* Hero header bar */}
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <h3 className="text-sm font-semibold text-slate-800">슬라이드 목록</h3>
              <CountDisplay total={allHeroSlides.length} />
            </div>
            {heroEditing ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDeleteHeroSelected}
                  disabled={heroSelectedIds.size === 0}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    heroSelectedIds.size > 0
                      ? "bg-red-50 text-red-600 hover:bg-red-100"
                      : "cursor-not-allowed text-slate-300"
                  )}
                >
                  선택삭제{heroSelectedIds.size > 0 && ` (${heroSelectedIds.size})`}
                </button>
                <button
                  onClick={handleDeleteHeroAll}
                  className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition-colors"
                >
                  전체삭제
                </button>
                <button
                  onClick={() => { setHeroEditing(false); setHeroSelectedIds(new Set()); }}
                  className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  완료
                </button>
              </div>
            ) : (
              <button
                onClick={() => setHeroEditing(true)}
                className="flex h-7 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <SquarePen className="h-3.5 w-3.5" /> 편집
              </button>
            )}
          </div>

          {heroSlides.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50">
                <MonitorPlay className="h-8 w-8 text-slate-300" />
              </div>
              {allHeroSlides.length === 0 ? (
                <>
                  <p className="text-sm font-medium text-slate-500">등록된 히어로 슬라이드가 없습니다</p>
                  <p className="mt-1 text-xs text-slate-400">첫 슬라이드를 등록하고 메인 화면을 꾸며보세요.</p>
                  <button onClick={() => router.push(`/banners/new?type=${activeTab}`)} className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
                    + 슬라이드 추가하기
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-slate-500">조건에 맞는 슬라이드가 없습니다</p>
                  <p className="mt-1 text-xs text-slate-400">필터 또는 검색어를 변경해 보세요.</p>
                </>
              )}
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDndDragStart}
              onDragEnd={handleDndDragEnd}
            >
              <SortableContext
                items={heroSlides.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="divide-y divide-slate-100">
                  {/* Select all (edit mode) */}
                  {heroEditing && (
                    <div className="flex items-center gap-3 bg-slate-50/50 px-5 py-2.5">
                      <input
                        type="checkbox"
                        checked={heroAllSelected}
                        onChange={handleHeroToggleSelectAll}
                        className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-indigo-600"
                      />
                      <span className="text-xs text-slate-500">전체 선택</span>
                    </div>
                  )}

                  {heroSlides.map((slide, idx) => (
                    <SortableHeroItem
                      key={slide.id}
                      slide={slide}
                      index={idx}
                      heroEditing={heroEditing}
                      isHeroSelected={heroSelectedIds.has(slide.id)}
                      onToggleSelect={handleHeroToggleSelect}
                      onToggleActive={handleToggleActive}
                    />
                  ))}
                </div>
              </SortableContext>

              {/* Drag overlay — floating card while dragging */}
              <DragOverlay>
                {activeDragSlide ? (
                  <div className="rounded-lg border border-indigo-200 bg-white shadow-lg opacity-90">
                    <div className="flex gap-4 px-5 py-4">
                      <div className="relative shrink-0 w-[280px] aspect-[4.8/1] rounded-lg bg-slate-200 overflow-hidden">
                        {(activeDragSlide.imageData || activeDragSlide.imageUrl) && (
                          <img
                            src={activeDragSlide.imageData || activeDragSlide.imageUrl}
                            alt={activeDragSlide.title}
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
                        <h4 className="truncate text-sm font-semibold text-slate-800">
                          {activeDragSlide.title.replace(/\n/g, " ")}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <BannerStatusBadge banner={activeDragSlide} />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* AD BANNER TAB — Table Layout                                          */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "AD" && (
        <>
          {/* Table */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
              <div className="flex items-center gap-2.5">
                <h3 className="text-sm font-semibold text-slate-800">광고 배너 목록</h3>
                <CountDisplay total={adBanners.length} />
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
                    onClick={handleDeleteAdAll}
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
                    <option value={50}>50개씩</option>
                  </select>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex h-7 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <SquarePen className="h-3.5 w-3.5" /> 편집
                  </button>
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] table-fixed text-sm">
                <colgroup>
                  {isEditing && <col className="w-10" />}
                  <col className="w-[200px]" />
                  <col className="w-[110px]" />
                  <col className="w-[80px]" />
                  <col className="w-[180px]" />
                  <col className="w-[80px]" />
                  <col className="w-[70px]" />
                  <col className="w-[60px]" />
                  <col className="w-[70px]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left">
                    {isEditing && (
                      <th className="w-10 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={allPageSelected}
                          onChange={handleToggleSelectAll}
                          className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-indigo-600"
                        />
                      </th>
                    )}
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500">배너명</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500">위치</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500">상태</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500">노출 기간</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">노출 수</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">클릭 수</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">CTR</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {adPaginated.length === 0 ? (
                    <tr>
                      <td colSpan={isEditing ? 10 : 9} className="py-16 text-center">
                        <div className="flex flex-col items-center">
                          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50">
                            <Layers className="h-8 w-8 text-slate-300" />
                          </div>
                          <p className="text-sm font-medium text-slate-500">
                            {adBanners.length === 0 && !searchQuery.trim() && statusFilter === "ALL"
                              ? "등록된 광고 배너가 없습니다"
                              : "조건에 맞는 광고 배너가 없습니다"}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {adBanners.length === 0 && !searchQuery.trim() && statusFilter === "ALL"
                              ? "첫 광고 배너를 등록해 보세요."
                              : "필터 또는 검색어를 변경해 보세요."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    adPaginated.map((banner) => {
                      const ctr = banner.impressionCount > 0 ? ((banner.clickCount / banner.impressionCount) * 100).toFixed(1) : "0";
                      const isSelected = selectedIds.has(banner.id);
                      return (
                        <tr
                          key={banner.id}
                          onClick={() => isEditing ? handleToggleSelectRow(banner.id) : router.push(`/banners/${banner.id}`)}
                          className={cn(
                            "cursor-pointer transition-colors hover:bg-slate-50/70",
                            isSelected && "bg-indigo-50/60"
                          )}
                        >
                          {isEditing && (
                            <td className="px-4 py-3.5">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelectRow(banner.id)}
                                onClick={(e) => e.stopPropagation()}
                                className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-indigo-600"
                              />
                            </td>
                          )}
                          <td className="px-5 py-3.5 overflow-hidden">
                            <div className="truncate font-medium text-slate-800">{banner.title}</div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600">
                              {BANNER_POSITIONS[banner.position]}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <BannerStatusBadge banner={banner} />
                          </td>
                          <td className="px-4 py-3.5 text-xs text-slate-500">{banner.startDate} ~ {banner.endDate || "상시 노출"}</td>
                          <td className="px-4 py-3.5 text-right tabular-nums text-slate-600">{banner.impressionCount.toLocaleString()}</td>
                          <td className="px-4 py-3.5 text-right tabular-nums text-slate-600">{banner.clickCount.toLocaleString()}</td>
                          <td className={cn("px-4 py-3.5 text-right tabular-nums font-semibold", Number(ctr) > 0 ? "text-indigo-600" : "text-slate-400")}>{ctr}%</td>
                          <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleToggleActive(banner.id)}
                              title={banner.isActive ? "노출 중지" : "노출 시작"}
                              className={cn(
                                "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
                                banner.isActive ? "bg-indigo-600" : "bg-slate-300"
                              )}
                            >
                              <span className={cn(
                                "inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform",
                                banner.isActive ? "translate-x-[18px]" : "translate-x-[3px]"
                              )} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-5 pb-4">
              <PaginationBar total={adBanners.length} page={page} pageSize={pageSize} onPageChange={setPage} />
            </div>
          </div>
        </>
      )}

    </div>
  );
}
