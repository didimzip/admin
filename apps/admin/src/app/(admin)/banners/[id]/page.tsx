"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft, Eye, EyeOff, Clock, Upload, ExternalLink,
  Layers, MonitorPlay, Trash2, CalendarDays, MapPin, ArrowUpDown, Link2, BarChart3, Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BANNER_POSITIONS, BANNER_TYPE_LABELS, HERO_POSITIONS, AD_POSITIONS,
  type BannerPosition, type BannerTextColor,
} from "@/data/mock-data";
import {
  getBanner, upsertBanner, deleteBanner,
  compressBannerImage, detectTextColor, type StoredBanner,
} from "@/lib/banner-store";
import { getSession } from "@/lib/auth-store";
import { useToast } from "@/lib/toast-context";
import { cn } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isFutureDate(dateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return target > today;
}

export default function BannerDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const session = getSession();

  const [banner, setBanner] = useState<StoredBanner | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // form state (for edit mode)
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    subText: "",
    textColor: "light" as BannerTextColor,
    description: "",
    position: "HOME_TOP" as BannerPosition,
    linkUrl: "",
    sortOrder: 1,
    isActive: true,
    startDate: "",
    endDate: "",
    imageData: "",
  });
  const [imagePreview, setImagePreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // ─── Dirty tracking (edit mode) ───────────────────────────────────────────
  const [isDirty, setIsDirty] = useState(false);
  const [pendingNavTarget, setPendingNavTarget] = useState<string | null>(null);
  const isDirtyRef = useRef(false);
  isDirtyRef.current = isDirty;

  // ─── Load banner ────────────────────────────────────────────────────────────

  useEffect(() => {
    const b = getBanner(id);
    if (!b) {
      router.replace("/banners");
      return;
    }
    setBanner(b);
  }, [id, router]);

  // ─── Populate form when entering edit mode ────────────────────────────────

  const enterEditMode = () => {
    if (!banner) return;
    setForm({
      title: banner.title,
      subtitle: banner.subtitle ?? "",
      subText: banner.subText ?? "",
      textColor: banner.textColor ?? "light",
      description: banner.description,
      position: banner.position,
      linkUrl: banner.linkUrl,
      sortOrder: banner.sortOrder,
      isActive: banner.isActive,
      startDate: banner.startDate,
      endDate: banner.endDate,
      imageData: banner.imageData,
    });
    setImagePreview(banner.imageData || banner.imageUrl);
    setIsEditMode(true);
    setIsDirty(false);
  };

  const updateForm = (patch: Partial<typeof form>) => {
    setForm((f) => ({ ...f, ...patch }));
    setIsDirty(true);
  };

  const handleNavigate = (url: string) => {
    if (isDirtyRef.current) {
      setPendingNavTarget(url);
    } else {
      router.push(url);
    }
  };

  // ─── Unsaved changes: anchor click intercept ──────────────────────────────
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!isDirtyRef.current) return;
      const anchor = (e.target as Element).closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute("href") ?? "";
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return;
        if (url.pathname === window.location.pathname) return;
      } catch { return; }
      e.preventDefault();
      e.stopPropagation();
      setTimeout(() => setPendingNavTarget(href), 0);
    };
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  // ─── Unsaved changes: browser tab close / refresh ─────────────────────────
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // ─── Image upload ─────────────────────────────────────────────────────────

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const compressed = await compressBannerImage(base64);
      const color = await detectTextColor(compressed);
      setImagePreview(compressed);
      setForm((f) => ({ ...f, imageData: compressed, textColor: color }));
      setIsDirty(true);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleImageChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  // ─── Save ─────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!banner) return;
    if (!form.title.trim()) { showToast("배너명을 입력해주세요."); return; }
    if (!form.startDate) { showToast("시작일을 입력해주세요."); return; }

    setSaving(true);
    try {
      const updated = upsertBanner({
        id: banner.id,
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        subText: form.subText.trim(),
        textColor: form.textColor,
        description: form.description.trim(),
        bannerType: banner.bannerType,
        imageUrl: banner.imageUrl,
        imageData: form.imageData || banner.imageData,
        linkUrl: form.linkUrl.trim(),
        position: form.position,
        isActive: form.isActive,
        sortOrder: form.sortOrder,
        startDate: form.startDate,
        endDate: form.endDate,
        createdBy: banner.createdBy ?? session?.adminId ?? null,
      });
      setBanner(updated);
      setIsEditMode(false);
      setIsDirty(false);
      showToast("배너가 수정되었습니다.");
    } finally {
      setSaving(false);
    }
  };

  // ─── Delete ───────────────────────────────────────────────────────────────

  const handleDelete = () => {
    if (!banner) return;
    deleteBanner(banner.id);
    showToast("배너가 삭제되었습니다.");
    router.push("/banners");
  };

  // ─── Toggle active (from detail view) ─────────────────────────────────────

  if (!banner) return null;

  const isHero = banner.bannerType === "HERO_SLIDE";
  const positionOptions = isHero ? HERO_POSITIONS : AD_POSITIONS;
  const ctr = banner.impressionCount > 0
    ? ((banner.clickCount / banner.impressionCount) * 100).toFixed(1)
    : "0.0";

  // Status
  const isScheduled = banner.isActive && isFutureDate(banner.startDate);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleNavigate("/banners")}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">
                {isEditMode ? "배너 수정" : banner.title.replace(/\n/g, " ")}
              </h1>
              {!isEditMode && (
                <>
                  {isScheduled ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                      <Clock className="h-3 w-3" /> 노출 예정
                    </span>
                  ) : banner.isActive ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                      <Eye className="h-3 w-3" /> 노출 중
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                      <EyeOff className="h-3 w-3" /> 종료
                    </span>
                  )}
                </>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600">
                {isHero ? <MonitorPlay className="h-3 w-3" /> : <Layers className="h-3 w-3" />}
                {BANNER_TYPE_LABELS[banner.bannerType]}
              </span>
              <span className="text-xs text-slate-400">등록일 {banner.createdAt.split("T")[0]}</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        {!isEditMode ? (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={enterEditMode}>수정</Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" /> 삭제
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => { setIsEditMode(false); setIsDirty(false); }}>취소</Button>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={handleSave} disabled={saving}>
              {saving ? "저장 중..." : "저장"}
            </Button>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* VIEW MODE                                                              */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {!isEditMode && (
        <div className="space-y-5">
          {/* Image preview */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className={cn(
              "relative bg-slate-100",
              isHero ? "aspect-[4.8/1]" : "aspect-[3/1]"
            )}>
              {(banner.imageData || banner.imageUrl) && (
                <img
                  src={banner.imageData || banner.imageUrl}
                  alt={banner.title}
                  className="h-full w-full object-cover"
                />
              )}
              {/* Hero overlay */}
              {isHero && (banner.subtitle || banner.title || banner.subText) && (
                <div className="pointer-events-none absolute inset-0">
                  <div className="flex h-full flex-col justify-center px-[6%]" style={{ maxWidth: "55%" }}>
                    {banner.subtitle && (
                      <span className={cn(
                        "mb-2 w-fit rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                        banner.textColor === "dark" ? "bg-black/8 text-black/60" : "bg-white/15 text-white/80"
                      )}>
                        {banner.subtitle}
                      </span>
                    )}
                    <h2 className={cn(
                      "whitespace-pre-line text-2xl font-bold leading-tight",
                      banner.textColor === "dark" ? "text-black/90" : "text-white"
                    )}>
                      {banner.title}
                    </h2>
                    {banner.subText && (
                      <span className={cn(
                        "mt-2 whitespace-pre-line text-xs leading-relaxed",
                        banner.textColor === "dark" ? "text-black/45" : "text-white/60"
                      )}>
                        {banner.subText}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-3 gap-5">
            {/* Left column (2/3) — Content + Performance */}
            <div className="col-span-2 space-y-5">
              {/* Performance */}
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3">
                  <BarChart3 className="h-4 w-4 text-slate-400" />
                  <h3 className="text-sm font-semibold text-slate-800">성과</h3>
                </div>
                <div className="grid grid-cols-3 divide-x divide-slate-100">
                  <div className="px-5 py-4 text-center">
                    <p className="text-[11px] font-medium text-slate-400">노출</p>
                    <p className="mt-1 text-xl font-bold text-slate-900">{banner.impressionCount.toLocaleString()}</p>
                  </div>
                  <div className="px-5 py-4 text-center">
                    <p className="text-[11px] font-medium text-slate-400">클릭</p>
                    <p className="mt-1 text-xl font-bold text-slate-900">{banner.clickCount.toLocaleString()}</p>
                  </div>
                  <div className="px-5 py-4 text-center">
                    <p className="text-[11px] font-medium text-slate-400">CTR</p>
                    <p className="mt-1 text-xl font-bold text-indigo-600">{ctr}%</p>
                  </div>
                </div>
              </div>

              {/* Content — Hero: subtitle/title/subtext, AD: title/description */}
              {isHero ? (
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="px-5 py-3 border-b border-slate-100">
                    <h3 className="text-sm font-semibold text-slate-800">콘텐츠</h3>
                  </div>
                  <div className="px-5 py-4 space-y-4">
                    {banner.subtitle && (
                      <div>
                        <p className="text-[11px] font-medium text-slate-400 mb-1">소제목</p>
                        <span className="inline-flex rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-600">
                          {banner.subtitle}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="text-[11px] font-medium text-slate-400 mb-1">타이틀</p>
                      <p className="text-base font-bold text-slate-900 whitespace-pre-line leading-snug">{banner.title}</p>
                    </div>
                    {banner.subText && (
                      <div>
                        <p className="text-[11px] font-medium text-slate-400 mb-1">서브텍스트</p>
                        <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">{banner.subText}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                (banner.description) && (
                  <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="px-5 py-3 border-b border-slate-100">
                      <h3 className="text-sm font-semibold text-slate-800">설명</h3>
                    </div>
                    <div className="px-5 py-4">
                      <p className="text-sm text-slate-600 leading-relaxed">{banner.description}</p>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Right column (1/3) — Metadata */}
            <div className="space-y-5">
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="px-5 py-3 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-800">정보</h3>
                </div>
                <div className="px-5 py-4 space-y-4">
                  {/* Period */}
                  <div className="flex items-start gap-3">
                    <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <div>
                      <p className="text-[11px] font-medium text-slate-400">노출 기간</p>
                      <p className="mt-0.5 text-sm text-slate-800">{banner.startDate}</p>
                      <p className="text-sm text-slate-800">~ {banner.endDate || "상시 노출"}</p>
                    </div>
                  </div>

                  {/* Position */}
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <div>
                      <p className="text-[11px] font-medium text-slate-400">노출 위치</p>
                      <p className="mt-0.5 text-sm text-slate-800">{BANNER_POSITIONS[banner.position]}</p>
                    </div>
                  </div>

                  {/* Sort order */}
                  <div className="flex items-start gap-3">
                    <ArrowUpDown className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <div>
                      <p className="text-[11px] font-medium text-slate-400">{isHero ? "슬라이드 순서" : "정렬 순서"}</p>
                      <p className="mt-0.5 text-sm text-slate-800">{banner.sortOrder}번</p>
                    </div>
                  </div>

                  {/* Link */}
                  {banner.linkUrl && (
                    <div className="flex items-start gap-3">
                      <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium text-slate-400">링크</p>
                        <a
                          href={banner.linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-0.5 flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 truncate"
                        >
                          <span className="truncate">{banner.linkUrl}</span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Dates card */}
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm px-5 py-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">등록일</span>
                  <span className="text-slate-600">{banner.createdAt.split("T")[0]}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-400">최종 수정일</span>
                  <span className="text-slate-600">{banner.updatedAt.split("T")[0]}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* EDIT MODE                                                              */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {isEditMode && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <h3 className="text-sm font-semibold text-slate-800">배너 수정</h3>
          </div>
          <div className="px-6 py-5 space-y-5">
            {/* Image upload */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                배너 이미지 <span className="text-red-500">*</span>
                <span className="ml-2 font-normal text-slate-400">
                  {isHero ? "권장: 1920x400px" : "권장: 가로형 이미지"}
                </span>
              </label>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              {imagePreview ? (
                <div className="relative group" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
                  <div className={cn(
                    "overflow-hidden rounded-xl border border-slate-200",
                    isHero ? "aspect-[4.8/1]" : "aspect-[3/1]"
                  )}>
                    <img src={imagePreview} alt="미리보기" className="h-full w-full object-cover" />
                  </div>
                  {/* Hero overlay preview */}
                  {isHero && (form.subtitle || form.title || form.subText) && (
                    <div className="pointer-events-none absolute inset-0 rounded-xl">
                      <div className="flex h-full flex-col justify-center px-[6%]" style={{ maxWidth: "55%" }}>
                        {form.subtitle && (
                          <span className={cn(
                            "mb-2 w-fit rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                            form.textColor === "dark" ? "bg-black/8 text-black/60" : "bg-white/15 text-white/80"
                          )}>
                            {form.subtitle}
                          </span>
                        )}
                        {form.title && (
                          <h4 className={cn(
                            "whitespace-pre-line text-2xl font-bold leading-tight",
                            form.textColor === "dark" ? "text-black/90" : "text-white"
                          )}>
                            {form.title}
                          </h4>
                        )}
                        {form.subText && (
                          <span className={cn(
                            "mt-2 whitespace-pre-line text-xs leading-relaxed",
                            form.textColor === "dark" ? "text-black/45" : "text-white/60"
                          )}>
                            {form.subText}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {isDragging && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-indigo-500 bg-indigo-900/60">
                      <Upload className="h-8 w-8 text-white" />
                      <span className="text-sm font-medium text-white">여기에 이미지를 놓으세요</span>
                    </div>
                  )}
                  {!isDragging && (
                    <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-xl bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <button onClick={() => fileRef.current?.click()} className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100">
                        이미지 변경
                      </button>
                      <button onClick={() => { setImagePreview(""); updateForm({ imageData: "" }); }} className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600">
                        삭제
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={cn(
                    "flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-colors",
                    isDragging ? "border-indigo-500 bg-indigo-50/50" : "border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/30",
                    isHero ? "aspect-[4.8/1]" : "py-12"
                  )}
                >
                  <Upload className={cn("h-8 w-8", isDragging ? "text-indigo-500" : "text-slate-400")} />
                  <span className={cn("text-sm font-medium", isDragging ? "text-indigo-600" : "text-slate-500")}>
                    {isDragging ? "여기에 놓으세요" : "클릭 또는 이미지를 드래그하세요"}
                  </span>
                  <span className="text-xs text-slate-400">JPG, PNG, GIF (최대 5MB)</span>
                </button>
              )}
            </div>

            {/* Subtitle (hero only) */}
            {isHero && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">소제목</label>
                <textarea
                  value={form.subtitle}
                  onChange={(e) => updateForm({ subtitle: e.target.value })}
                  placeholder="배너 위에 작게 표시될 카테고리/라벨&#10;줄바꿈 가능"
                  rows={2}
                  className="w-full resize-none rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            )}

            {/* Title */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                {isHero ? "타이틀" : "배너명"} <span className="text-red-500">*</span>
              </label>
              {isHero ? (
                <textarea
                  value={form.title}
                  onChange={(e) => updateForm({ title: e.target.value })}
                  placeholder="메인 타이틀&#10;줄바꿈 가능"
                  rows={2}
                  className="w-full resize-none rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              ) : (
                <input
                  value={form.title}
                  onChange={(e) => updateForm({ title: e.target.value })}
                  placeholder="배너 이름을 입력하세요"
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              )}
            </div>

            {/* SubText (hero only) */}
            {isHero && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">하단 서브텍스트</label>
                <textarea
                  value={form.subText}
                  onChange={(e) => updateForm({ subText: e.target.value })}
                  placeholder="타이틀 아래 표시될 텍스트&#10;줄바꿈 가능"
                  rows={2}
                  className="w-full resize-none rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            )}

            {/* Text color (hero only) */}
            {isHero && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  텍스트 색상
                  <span className="ml-2 font-normal text-slate-400">이미지 업로드 시 자동 감지됩니다</span>
                </label>
                <div className="flex gap-2">
                  {(["light", "dark"] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => updateForm({ textColor: c })}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
                        form.textColor === c
                          ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 text-slate-600 hover:border-slate-300"
                      )}
                    >
                      <span className={cn("inline-block h-4 w-4 rounded-full border", c === "light" ? "bg-white border-slate-300" : "bg-slate-900 border-slate-900")} />
                      {c === "light" ? "밝은 텍스트 (어두운 배경)" : "어두운 텍스트 (밝은 배경)"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Description (ad only) */}
            {!isHero && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">설명</label>
                <input
                  value={form.description}
                  onChange={(e) => updateForm({ description: e.target.value })}
                  placeholder="배너에 대한 간단한 설명 (선택)"
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            )}

            {/* Link URL */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">링크 URL</label>
              <input
                value={form.linkUrl}
                onChange={(e) => updateForm({ linkUrl: e.target.value })}
                placeholder="https:// 또는 /path"
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {/* Position & Sort Order */}
            <div className="grid grid-cols-2 gap-4">
              {!isHero ? (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">노출 위치</label>
                  <select
                    value={form.position}
                    onChange={(e) => updateForm({ position: e.target.value as BannerPosition })}
                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  >
                    {positionOptions.map((pos) => (
                      <option key={pos} value={pos}>{BANNER_POSITIONS[pos]}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">노출 위치</label>
                  <div className="flex h-[42px] items-center rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-500">
                    {BANNER_POSITIONS["HOME_TOP"]}
                  </div>
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  {isHero ? "슬라이드 순서" : "정렬 순서"}
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.sortOrder}
                  onChange={(e) => updateForm({ sortOrder: Number(e.target.value) || 1 })}
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
                <p className="mt-1 text-xs text-slate-400">숫자가 낮을수록 먼저 표시됩니다</p>
              </div>
            </div>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">시작일 <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => updateForm({ startDate: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">종료일 <span className="ml-1 font-normal text-slate-400">미설정 시 상시 노출</span></label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => updateForm({ endDate: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-700">노출 상태</p>
                <p className="text-xs text-slate-400">활성화하면 설정된 기간 동안 배너가 노출됩니다</p>
              </div>
              <button
                onClick={() => updateForm({ isActive: !form.isActive })}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  form.isActive ? "bg-indigo-600" : "bg-slate-300"
                )}
              >
                <span className={cn(
                  "inline-block h-4 w-4 rounded-full bg-white transition-transform",
                  form.isActive ? "translate-x-6" : "translate-x-1"
                )} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteConfirm(false); }}
        >
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">배너 삭제</h3>
            <p className="mt-2 text-sm text-slate-600">이 배너를 삭제하시겠습니까? 삭제된 배너는 복구할 수 없습니다.</p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)}>취소</Button>
              <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDelete}>삭제</Button>
            </div>
          </div>
        </div>
      )}

      {/* 저장하지 않은 내용 경고 모달 */}
      {pendingNavTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => { if (e.target === e.currentTarget) setPendingNavTarget(null); }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-full bg-amber-100">
              <Save className="h-5 w-5 text-amber-600" />
            </div>
            <h3 className="mt-3 text-base font-bold text-slate-900">저장하지 않은 내용이 있어요</h3>
            <p className="mt-1.5 text-sm text-slate-500">수정 중인 내용을 저장하지 않고 이동하시겠어요?</p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                onClick={() => {
                  handleSave();
                  isDirtyRef.current = false;
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
              >
                <Save className="h-4 w-4" />
                저장 후 이동
              </button>
              <button
                onClick={() => {
                  setIsDirty(false);
                  isDirtyRef.current = false;
                  setIsEditMode(false);
                  router.push(pendingNavTarget);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                저장하지 않고 이동
              </button>
            </div>
            <button
              onClick={() => setPendingNavTarget(null)}
              className="mt-3 w-full text-center text-sm text-slate-400 hover:text-slate-600 transition-colors"
            >
              계속 수정하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
