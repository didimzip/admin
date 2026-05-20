"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft, Upload, Layers, MonitorPlay,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BANNER_POSITIONS, BANNER_TYPE_LABELS, HERO_POSITIONS, AD_POSITIONS,
  type BannerType, type BannerPosition, type BannerTextColor,
} from "@/data/mock-data";
import {
  upsertBanner, compressBannerImage, detectTextColor,
} from "@/lib/banner-store";
import { getSession } from "@/lib/auth-store";
import { useToast } from "@/lib/toast-context";
import { cn } from "@/lib/utils";

export default function BannerNewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const session = getSession();
  const fileRef = useRef<HTMLInputElement>(null);

  const initialType = (searchParams.get("type") === "AD" ? "AD" : "HERO_SLIDE") as BannerType;

  const [bannerType, setBannerType] = useState<BannerType>(initialType);
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    subText: "",
    textColor: "light" as BannerTextColor,
    description: "",
    position: (initialType === "HERO_SLIDE" ? "HOME_TOP" : "POST_BETWEEN") as BannerPosition,
    linkUrl: "",
    sortOrder: 1,
    isActive: true,
    startDate: "",
    endDate: "",
    imageData: "",
  });
  const [imagePreview, setImagePreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const isHero = bannerType === "HERO_SLIDE";
  const positionOptions = isHero ? HERO_POSITIONS : AD_POSITIONS;

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
    if (!form.title.trim()) { showToast("배너명을 입력해주세요."); return; }
    if (!form.startDate) { showToast("시작일을 입력해주세요."); return; }
    if (!form.imageData) { showToast("배너 이미지를 업로드해주세요."); return; }

    setSaving(true);
    try {
      const created = upsertBanner({
        id: null,
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        subText: form.subText.trim(),
        textColor: form.textColor,
        description: form.description.trim(),
        bannerType,
        imageUrl: "",
        imageData: form.imageData,
        linkUrl: form.linkUrl.trim(),
        position: form.position,
        isActive: form.isActive,
        sortOrder: form.sortOrder,
        startDate: form.startDate,
        endDate: form.endDate,
        createdBy: session?.adminId ?? null,
      });
      showToast("배너가 등록되었습니다.");
      router.push(`/banners/${created.id}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/banners")}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold text-slate-900">배너 등록</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push("/banners")}>취소</Button>
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={handleSave} disabled={saving}>
            {saving ? "저장 중..." : "등록"}
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="text-sm font-semibold text-slate-800">배너 정보</h3>
        </div>
        <div className="px-6 py-5 space-y-5">
          {/* Banner type */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">배너 유형</label>
            <div className="flex gap-2">
              {(["HERO_SLIDE", "AD"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    const positions = t === "HERO_SLIDE" ? HERO_POSITIONS : AD_POSITIONS;
                    setBannerType(t);
                    setForm((f) => ({ ...f, position: positions[0] }));
                  }}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
                    bannerType === t
                      ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  )}
                >
                  {t === "HERO_SLIDE" ? <MonitorPlay className="h-4 w-4" /> : <Layers className="h-4 w-4" />}
                  {BANNER_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

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
                {isHero && (form.subtitle || form.title || form.subText) && (
                  <div className="pointer-events-none absolute inset-0 rounded-xl">
                    <div className="flex h-full flex-col justify-center px-[6%]" style={{ maxWidth: "55%" }}>
                      {form.subtitle && (
                        <span className={cn(
                          "mb-2 w-fit rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                          form.textColor === "dark" ? "bg-black/8 text-black/60" : "bg-white/15 text-white/80"
                        )}>{form.subtitle}</span>
                      )}
                      {form.title && (
                        <h4 className={cn(
                          "whitespace-pre-line text-2xl font-bold leading-tight",
                          form.textColor === "dark" ? "text-black/90" : "text-white"
                        )}>{form.title}</h4>
                      )}
                      {form.subText && (
                        <span className={cn(
                          "mt-2 whitespace-pre-line text-xs leading-relaxed",
                          form.textColor === "dark" ? "text-black/45" : "text-white/60"
                        )}>{form.subText}</span>
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
                    <button onClick={() => { setImagePreview(""); setForm((f) => ({ ...f, imageData: "" })); }} className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600">
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
                onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
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
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="메인 타이틀&#10;줄바꿈 가능"
                rows={2}
                className="w-full resize-none rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            ) : (
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
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
                onChange={(e) => setForm((f) => ({ ...f, subText: e.target.value }))}
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
                    onClick={() => setForm((f) => ({ ...f, textColor: c }))}
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
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
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
              onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
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
                  onChange={(e) => setForm((f) => ({ ...f, position: e.target.value as BannerPosition }))}
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
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) || 1 }))}
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
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">종료일 <span className="ml-1 font-normal text-slate-400">미설정 시 상시 노출</span></label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
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
              onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
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
    </div>
  );
}
