"use client";

import React, { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Plus, X } from "lucide-react";
import {
  RiGroupLine,
  RiCalendarCheckLine,
  RiFileTextLine,
  RiPriceTag3Line,
  RiImageLine,
  RiAlertLine,
  RiCheckboxCircleLine,
} from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/lib/toast-context";
import { recordLog } from "@/lib/audit-log-store";
import { upsertStudy } from "@/lib/study-store";
import {
  STUDY_CATEGORIES,
  type StudyCategory,
  type StudyMethod,
} from "@/data/mock-data";

const METHOD_LABEL: Record<StudyMethod, string> = {
  ONLINE: "온라인",
  OFFLINE: "오프라인",
  HYBRID: "혼합",
};

export default function StudyNewPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "" as StudyCategory | "",
    method: "ONLINE" as StudyMethod,
    location: "",
    maxMembers: 10,
    startDate: "",
    endDate: "",
    recruitEndDate: "",
    schedule: "",
    tags: [] as string[],
    thumbnailUrl: "",
  });
  const [tagInput, setTagInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Track whether form has been modified
  const [isDirty, setIsDirty] = useState(false);

  // Modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  /* ── helpers ── */

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setIsDirty(true);
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "제목을 입력해주세요.";
    if (!form.category) e.category = "분야를 선택해주세요.";
    if (!form.description.trim()) e.description = "본문을 입력해주세요.";
    if (!form.startDate) e.startDate = "시작일을 선택해주세요.";
    if (!form.endDate) e.endDate = "종료일을 선택해주세요.";
    if (!form.recruitEndDate) e.recruitEndDate = "모집 마감일을 선택해주세요.";
    if (form.maxMembers < 2) e.maxMembers = "최대 인원은 2명 이상이어야 합니다.";
    if (form.maxMembers > 50) e.maxMembers = "최대 인원은 50명 이하여야 합니다.";
    if (
      (form.method === "OFFLINE" || form.method === "HYBRID") &&
      !form.location.trim()
    ) {
      e.location = "오프라인/혼합 방식은 장소를 입력해주세요.";
    }

    // Date cross-validation
    if (form.startDate && form.endDate && form.endDate <= form.startDate) {
      e.endDate = "종료일은 시작일 이후여야 합니다";
    }
    if (form.startDate && form.recruitEndDate && form.recruitEndDate > form.startDate) {
      e.recruitEndDate = "모집 마감일은 시작일 이전이어야 합니다";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmitClick = () => {
    if (!validate()) return;
    setShowConfirmModal(true);
  };

  const handleConfirmedSubmit = () => {
    setShowConfirmModal(false);

    const created = upsertStudy({
      title: form.title,
      description: form.description,
      category: form.category as StudyCategory,
      method: form.method,
      location: form.location,
      maxMembers: form.maxMembers,
      startDate: form.startDate,
      endDate: form.endDate,
      recruitEndDate: form.recruitEndDate,
      schedule: form.schedule,
      tags: form.tags,
      authorId: "admin",
      authorNickname: "DidimZip 운영팀",
      currentMembers: 0,
      thumbnailUrl: form.thumbnailUrl,
      status: "RECRUITING",
      viewCount: 0,
      reportCount: 0,
      adminMemo: "",
    });

    recordLog("POST_CREATE", `스터디 등록: ${created.title}`, {
      targetType: "study",
      targetId: created.id,
    });

    showToast("스터디가 등록되었습니다.");
    router.push("/studies");
  };

  const handleCancel = () => {
    if (isDirty) {
      setShowCancelModal(true);
    } else {
      router.push("/studies");
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const tag = tagInput.trim();
    if (!tag) return;
    if (form.tags.includes(tag)) {
      setTagInput("");
      return;
    }
    set("tags", [...form.tags, tag]);
    setTagInput("");
  };

  const removeTag = (tag: string) =>
    set(
      "tags",
      form.tags.filter((t) => t !== tag),
    );

  /* ── render ── */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-lg"
          onClick={handleCancel}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">스터디 등록</h1>
          <p className="text-sm text-slate-500">
            어드민이 직접 스터디 모집글을 등록합니다.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto space-y-6">
        {/* 기본 정보 */}
        <div className="bg-white rounded-xl border shadow-sm p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-slate-800 flex items-center gap-1.5">
              <RiFileTextLine className="h-4 w-4 text-indigo-500" />
              기본 정보
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 ml-5.5">
              스터디의 기본 정보를 입력해주세요
            </p>
          </div>

          {/* 제목 */}
          <div className="space-y-1.5">
            <Label>
              제목 <span className="text-red-500">*</span>
            </Label>
            <Input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="스터디 제목을 입력하세요"
            />
            {errors.title && (
              <p className="text-xs text-red-500">{errors.title}</p>
            )}
          </div>

          {/* 분야 */}
          <div className="space-y-1.5">
            <Label>
              분야 <span className="text-red-500">*</span>
            </Label>
            <Select
              value={form.category}
              onValueChange={(v) => set("category", v as StudyCategory)}
            >
              <SelectTrigger>
                <SelectValue placeholder="분야를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {STUDY_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-xs text-red-500">{errors.category}</p>
            )}
          </div>

          {/* 방식 */}
          <div className="space-y-1.5">
            <Label>
              방식 <span className="text-red-500">*</span>
            </Label>
            <Select
              value={form.method}
              onValueChange={(v) => set("method", v as StudyMethod)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ONLINE">온라인</SelectItem>
                <SelectItem value="OFFLINE">오프라인</SelectItem>
                <SelectItem value="HYBRID">혼합</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 장소 (conditional) */}
          {(form.method === "OFFLINE" || form.method === "HYBRID") && (
            <div className="space-y-1.5">
              <Label>
                장소 <span className="text-red-500">*</span>
              </Label>
              <Input
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder="예: 강남 위워크 선릉점"
              />
              {errors.location && (
                <p className="text-xs text-red-500">{errors.location}</p>
              )}
            </div>
          )}

          {/* 본문 */}
          <div className="space-y-1.5">
            <Label>
              모집글 본문 <span className="text-red-500">*</span>
            </Label>
            <Textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className="min-h-[200px]"
              placeholder="스터디 소개, 진행 방식, 대상 등을 작성해주세요."
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">200자 이상 권장</p>
              <p className="text-xs text-slate-400">{form.description.length}자</p>
            </div>
            {errors.description && (
              <p className="text-xs text-red-500">{errors.description}</p>
            )}
          </div>
        </div>

        {/* 썸네일 */}
        <div className="bg-white rounded-xl border shadow-sm p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-slate-800 flex items-center gap-1.5">
              <RiImageLine className="h-4 w-4 text-indigo-500" />
              썸네일
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 ml-5.5">
              스터디 목록에 표시될 대표 이미지 URL을 입력해주세요
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>썸네일 URL</Label>
            <Input
              value={form.thumbnailUrl}
              onChange={(e) => set("thumbnailUrl", e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
            {form.thumbnailUrl.trim() && (
              <div className="mt-2 rounded-lg border border-slate-200 overflow-hidden inline-block">
                <img
                  src={form.thumbnailUrl}
                  alt="썸네일 미리보기"
                  className="h-32 w-auto object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                  onLoad={(e) => {
                    (e.target as HTMLImageElement).style.display = "block";
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* 일정 및 인원 */}
        <div className="bg-white rounded-xl border shadow-sm p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-slate-800 flex items-center gap-1.5">
              <RiCalendarCheckLine className="h-4 w-4 text-indigo-500" />
              일정 및 인원
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 ml-5.5">
              스터디 운영 기간과 모집 인원을 설정해주세요
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 시작일 */}
            <div className="space-y-1.5">
              <Label>
                스터디 시작일 <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => set("startDate", e.target.value)}
              />
              {errors.startDate && (
                <p className="text-xs text-red-500">{errors.startDate}</p>
              )}
            </div>

            {/* 종료일 */}
            <div className="space-y-1.5">
              <Label>
                스터디 종료일 <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => set("endDate", e.target.value)}
              />
              {errors.endDate && (
                <p className="text-xs text-red-500">{errors.endDate}</p>
              )}
            </div>

            {/* 모집 마감일 */}
            <div className="space-y-1.5">
              <Label>
                모집 마감일 <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={form.recruitEndDate}
                onChange={(e) => set("recruitEndDate", e.target.value)}
              />
              {errors.recruitEndDate && (
                <p className="text-xs text-red-500">{errors.recruitEndDate}</p>
              )}
            </div>

            {/* 진행 일정 */}
            <div className="space-y-1.5">
              <Label>진행 일정</Label>
              <Input
                value={form.schedule}
                onChange={(e) => set("schedule", e.target.value)}
                placeholder="예: 매주 화/목 19:00-21:00"
              />
            </div>
          </div>

          {/* 최대 인원 */}
          <div className="space-y-1.5">
            <Label>
              최대 인원 <span className="text-red-500">*</span>
            </Label>
            <Input
              type="number"
              min={2}
              max={50}
              value={form.maxMembers}
              onChange={(e) => set("maxMembers", Number(e.target.value))}
              className="w-32"
            />
            <p className="text-xs text-slate-400">최소 2명, 최대 50명</p>
            {errors.maxMembers && (
              <p className="text-xs text-red-500">{errors.maxMembers}</p>
            )}
          </div>
        </div>

        {/* 태그 */}
        <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-slate-800 flex items-center gap-1.5">
              <RiPriceTag3Line className="h-4 w-4 text-indigo-500" />
              태그
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 ml-5.5">
              검색과 분류에 활용될 태그를 추가해주세요
            </p>
          </div>

          <div className="space-y-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="태그를 입력하고 Enter를 누르세요"
            />
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-0.5 rounded-full p-0.5 hover:bg-indigo-200 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-3 pb-8">
          <Button variant="outline" onClick={handleCancel}>
            취소
          </Button>
          <Button
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
            onClick={handleSubmitClick}
          >
            <Save className="mr-1.5 h-4 w-4" />
            등록
          </Button>
        </div>
      </div>

      {/* ── Confirmation Modal ── */}
      {showConfirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowConfirmModal(false);
          }}
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center gap-2">
              <RiCheckboxCircleLine className="h-5 w-5 text-indigo-600" />
              <h3 className="text-base font-semibold text-slate-900">등록 확인</h3>
            </div>
            <div className="px-6 py-5 space-y-3 text-sm">
              <p className="text-slate-500 mb-3">아래 내용으로 스터디를 등록합니다.</p>
              <div className="space-y-2 bg-slate-50 rounded-lg p-4">
                <div className="flex justify-between">
                  <span className="text-slate-500">제목</span>
                  <span className="font-medium text-slate-900 text-right max-w-[60%] truncate">
                    {form.title}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">분야</span>
                  <span className="font-medium text-slate-900">{form.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">방식</span>
                  <span className="font-medium text-slate-900">
                    {METHOD_LABEL[form.method]}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">기간</span>
                  <span className="font-medium text-slate-900">
                    {form.startDate} ~ {form.endDate}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">모집 마감</span>
                  <span className="font-medium text-slate-900">
                    {form.recruitEndDate}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">최대 인원</span>
                  <span className="font-medium text-slate-900">{form.maxMembers}명</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">태그</span>
                  <span className="font-medium text-slate-900">
                    {form.tags.length > 0 ? `${form.tags.length}개` : "없음"}
                  </span>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowConfirmModal(false)}>
                수정하기
              </Button>
              <Button
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={handleConfirmedSubmit}
              >
                등록하기
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Cancel / Unsaved Changes Modal ── */}
      {showCancelModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCancelModal(false);
          }}
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center gap-2">
              <RiAlertLine className="h-5 w-5 text-amber-500" />
              <h3 className="text-base font-semibold text-slate-900">나가기 확인</h3>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-slate-600">
                작성 중인 내용이 있습니다. 나가시겠습니까?
              </p>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCancelModal(false)}>
                계속 작성
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => router.push("/studies")}
              >
                나가기
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
