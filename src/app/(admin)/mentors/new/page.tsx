"use client";

import React, { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Plus, X } from "lucide-react";
import {
  RiUserStarLine,
  RiImageLine,
  RiMailLine,
  RiPhoneLine,
  RiEyeLine,
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
import { upsertMentor } from "@/lib/mentor-store";
import { MENTOR_CATEGORIES, type MentorCategory } from "@/data/mock-data";

const COMPANY_TYPES = ["스타트업", "투자사", "공공기관", "전문직", "기타"];

const REQUIRED_FIELDS: { key: string; label: string }[] = [
  { key: "name", label: "이름" },
  { key: "nickname", label: "닉네임" },
  { key: "email", label: "이메일" },
  { key: "companyName", label: "소속 회사" },
  { key: "position", label: "직책" },
  { key: "category", label: "멘토링 분야" },
  { key: "introduction", label: "자기소개" },
  { key: "career", label: "경력 요약" },
];

const INTRO_MAX_LENGTH = 200;

/* ── phone number formatting helper ── */
function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

/* ── email validation helper ── */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ── initial form state (for dirty check) ── */
const INITIAL_FORM = {
  name: "",
  nickname: "",
  email: "",
  phone: "",
  profileImageUrl: "",
  companyName: "",
  companyType: "스타트업",
  position: "",
  category: "" as MentorCategory | "",
  introduction: "",
  career: "",
  expertise: [] as string[],
  availableTime: "",
};

export default function MentorNewPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [tagInput, setTagInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const pendingNavigationRef = useRef<string | null>(null);

  /* ── dirty check ── */
  const isDirty = useCallback(() => {
    return (
      form.name !== "" ||
      form.nickname !== "" ||
      form.email !== "" ||
      form.phone !== "" ||
      form.profileImageUrl !== "" ||
      form.companyName !== "" ||
      form.companyType !== "스타트업" ||
      form.position !== "" ||
      form.category !== "" ||
      form.introduction !== "" ||
      form.career !== "" ||
      form.expertise.length > 0 ||
      form.availableTime !== ""
    );
  }, [form]);

  /* ── helpers ── */
  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    updateField("phone", formatted);
  };

  const handleEmailBlur = () => {
    const email = form.email.trim();
    if (email && !isValidEmail(email)) {
      setErrors((prev) => ({
        ...prev,
        email: "올바른 이메일 형식을 입력해주세요.",
      }));
    }
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (!tag) return;
    if (form.expertise.includes(tag)) {
      setTagInput("");
      return;
    }
    setForm((prev) => ({ ...prev, expertise: [...prev.expertise, tag] }));
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setForm((prev) => ({
      ...prev,
      expertise: prev.expertise.filter((t) => t !== tag),
    }));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  /* ── navigation with unsaved changes warning ── */
  const navigateAway = (path: string) => {
    if (isDirty()) {
      pendingNavigationRef.current = path;
      setShowLeaveModal(true);
    } else {
      router.push(path);
    }
  };

  const confirmLeave = () => {
    setShowLeaveModal(false);
    if (pendingNavigationRef.current) {
      router.push(pendingNavigationRef.current);
    }
  };

  /* ── validation ── */
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    for (const { key, label } of REQUIRED_FIELDS) {
      const val = form[key as keyof typeof form];
      if (typeof val === "string" && !val.trim()) {
        newErrors[key] = `${label}을(를) 입력해주세요.`;
      }
    }
    // email format
    const email = form.email.trim();
    if (email && !isValidEmail(email)) {
      newErrors.email = "올바른 이메일 형식을 입력해주세요.";
    }
    // introduction length
    if (form.introduction.length > INTRO_MAX_LENGTH) {
      newErrors.introduction = `자기소개는 ${INTRO_MAX_LENGTH}자 이내로 작성해주세요.`;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ── submit flow ── */
  const handlePreSubmit = () => {
    if (!validate()) return;
    setShowPreviewModal(true);
  };

  const handleSubmit = () => {
    setShowPreviewModal(false);

    const now = new Date().toISOString();

    upsertMentor({
      userId: `admin_${Date.now()}`, // 관리자 직접등록 (회원 연동 시 실제 userId로 교체)
      name: form.name.trim(),
      nickname: form.nickname.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      profileImageUrl: form.profileImageUrl.trim(),
      companyName: form.companyName.trim(),
      companyType: form.companyType,
      position: form.position.trim(),
      category: form.category as MentorCategory,
      introduction: form.introduction.trim(),
      career: form.career.trim(),
      expertise: form.expertise,
      availableTime: form.availableTime.trim(),
      lastActiveAt: "",
      status: "APPROVED",
      rejectReason: "",
      adminMemo: "",
      appliedAt: now,
      approvedAt: now,
    });

    recordLog("MENTOR_CREATE", `멘토 "${form.name.trim()}" 직접 등록`, {
      targetType: "mentor",
    });

    showToast("멘토가 등록되었습니다.");
    router.push("/mentors");
  };

  /* ── field error style helper ── */
  const fieldError = (key: string) =>
    errors[key] ? "border-red-400 focus-visible:ring-red-400" : "";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-lg"
          onClick={() => navigateAway("/mentors")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">멘토 등록</h1>
          <p className="text-sm text-slate-500">
            어드민이 직접 멘토를 등록합니다. 등록 시 바로 &apos;활동중&apos;
            상태가 됩니다.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto space-y-6">
        {/* 기본 정보 */}
        <div className="bg-white rounded-xl border shadow-sm p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-slate-800">
              기본 정보
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              멘토의 이름, 연락처 등 기본 인적 사항을 입력합니다.
            </p>
          </div>

          {/* 프로필 이미지 URL */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <RiImageLine className="h-4 w-4 text-slate-400" />
              프로필 이미지 URL
            </Label>
            <Input
              value={form.profileImageUrl}
              onChange={(e) => updateField("profileImageUrl", e.target.value)}
              placeholder="https://example.com/photo.jpg"
            />
            {form.profileImageUrl.trim() && (
              <div className="flex items-center gap-3 pt-1">
                <div className="h-14 w-14 rounded-full border-2 border-slate-200 overflow-hidden flex-shrink-0 bg-slate-50 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.profileImageUrl.trim()}
                    alt="프로필 미리보기"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
                <span className="text-xs text-slate-400">미리보기</span>
              </div>
            )}
          </div>

          {/* 이름 */}
          <div className="space-y-1.5">
            <Label>
              이름 <span className="text-red-500">*</span>
            </Label>
            <Input
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="멘토 이름"
              className={fieldError("name")}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name}</p>
            )}
          </div>

          {/* 닉네임 */}
          <div className="space-y-1.5">
            <Label>
              닉네임 <span className="text-red-500">*</span>
            </Label>
            <Input
              value={form.nickname}
              onChange={(e) => updateField("nickname", e.target.value)}
              placeholder="닉네임"
              className={fieldError("nickname")}
            />
            {errors.nickname && (
              <p className="text-xs text-red-500">{errors.nickname}</p>
            )}
          </div>

          {/* 이메일 */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <RiMailLine className="h-4 w-4 text-slate-400" />
              이메일 <span className="text-red-500">*</span>
            </Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              onBlur={handleEmailBlur}
              placeholder="email@example.com"
              className={fieldError("email")}
            />
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email}</p>
            )}
          </div>

          {/* 연락처 */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <RiPhoneLine className="h-4 w-4 text-slate-400" />
              연락처
            </Label>
            <Input
              value={form.phone}
              onChange={handlePhoneChange}
              placeholder="010-0000-0000"
              maxLength={13}
            />
          </div>

          {/* 소속 회사 */}
          <div className="space-y-1.5">
            <Label>
              소속 회사 <span className="text-red-500">*</span>
            </Label>
            <Input
              value={form.companyName}
              onChange={(e) => updateField("companyName", e.target.value)}
              placeholder="회사명"
              className={fieldError("companyName")}
            />
            {errors.companyName && (
              <p className="text-xs text-red-500">{errors.companyName}</p>
            )}
          </div>

          {/* 회사 유형 */}
          <div className="space-y-1.5">
            <Label>회사 유형</Label>
            <Select
              value={form.companyType}
              onValueChange={(v) => updateField("companyType", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMPANY_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 직책 */}
          <div className="space-y-1.5">
            <Label>
              직책 <span className="text-red-500">*</span>
            </Label>
            <Input
              value={form.position}
              onChange={(e) => updateField("position", e.target.value)}
              placeholder="직책"
              className={fieldError("position")}
            />
            {errors.position && (
              <p className="text-xs text-red-500">{errors.position}</p>
            )}
          </div>
        </div>

        {/* 멘토링 정보 */}
        <div className="bg-white rounded-xl border shadow-sm p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-slate-800">
              멘토링 정보
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              멘토링 분야, 소개, 경력 등 멘토 활동에 필요한 정보를 입력합니다.
            </p>
          </div>

          {/* 멘토링 분야 */}
          <div className="space-y-1.5">
            <Label>
              멘토링 분야 <span className="text-red-500">*</span>
            </Label>
            <Select
              value={form.category}
              onValueChange={(v) => updateField("category", v)}
            >
              <SelectTrigger className={fieldError("category")}>
                <SelectValue placeholder="분야를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {MENTOR_CATEGORIES.map((c) => (
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

          {/* 자기소개 */}
          <div className="space-y-1.5">
            <Label>
              자기소개 <span className="text-red-500">*</span>
            </Label>
            <Textarea
              value={form.introduction}
              onChange={(e) => updateField("introduction", e.target.value)}
              placeholder="200자 이내로 자기소개를 작성해주세요."
              rows={4}
              className={fieldError("introduction")}
            />
            <div className="flex items-center justify-between">
              {errors.introduction ? (
                <p className="text-xs text-red-500">{errors.introduction}</p>
              ) : (
                <span />
              )}
              <p
                className={`text-xs ${
                  form.introduction.length > INTRO_MAX_LENGTH
                    ? "text-red-500 font-medium"
                    : "text-slate-400"
                }`}
              >
                {form.introduction.length}/{INTRO_MAX_LENGTH}자
              </p>
            </div>
          </div>

          {/* 경력 요약 */}
          <div className="space-y-1.5">
            <Label>
              경력 요약 <span className="text-red-500">*</span>
            </Label>
            <Textarea
              value={form.career}
              onChange={(e) => updateField("career", e.target.value)}
              placeholder="주요 경력을 요약해주세요."
              rows={4}
              className={fieldError("career")}
            />
            {errors.career && (
              <p className="text-xs text-red-500">{errors.career}</p>
            )}
          </div>

          {/* 전문 키워드 */}
          <div className="space-y-1.5">
            <Label>전문 키워드</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="키워드 입력 후 Enter"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={addTag}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {form.expertise.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {form.expertise.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-sm text-indigo-700"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-indigo-900"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 가능 시간대 */}
          <div className="space-y-1.5">
            <Label>가능 시간대</Label>
            <Input
              value={form.availableTime}
              onChange={(e) => updateField("availableTime", e.target.value)}
              placeholder="예: 평일 오후 2-5시"
            />
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex justify-end gap-3 pb-6">
          <Button
            variant="outline"
            onClick={() => navigateAway("/mentors")}
          >
            취소
          </Button>
          <Button
            onClick={handlePreSubmit}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <RiEyeLine className="h-4 w-4 mr-1.5" />
            미리보기 및 등록
          </Button>
        </div>
      </div>

      {/* ── Preview / Confirmation Modal ── */}
      {showPreviewModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPreviewModal(false);
          }}
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b flex items-center gap-2">
              <RiEyeLine className="h-5 w-5 text-indigo-600" />
              <h3 className="text-lg font-semibold text-slate-900">
                등록 정보 확인
              </h3>
            </div>
            <div className="px-6 py-4 overflow-y-auto space-y-4 text-sm">
              {/* profile image preview in modal */}
              {form.profileImageUrl.trim() && (
                <div className="flex justify-center">
                  <div className="h-20 w-20 rounded-full border-2 border-slate-200 overflow-hidden bg-slate-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={form.profileImageUrl.trim()}
                      alt="프로필"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="border-b pb-3">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  기본 정보
                </h4>
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
                  <SummaryRow label="이름" value={form.name} />
                  <SummaryRow label="닉네임" value={form.nickname} />
                  <SummaryRow label="이메일" value={form.email} />
                  {form.phone && (
                    <SummaryRow label="연락처" value={form.phone} />
                  )}
                  {form.profileImageUrl.trim() && (
                    <SummaryRow
                      label="프로필 URL"
                      value={form.profileImageUrl.trim()}
                    />
                  )}
                  <SummaryRow label="소속 회사" value={form.companyName} />
                  <SummaryRow label="회사 유형" value={form.companyType} />
                  <SummaryRow label="직책" value={form.position} />
                </dl>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  멘토링 정보
                </h4>
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
                  <SummaryRow
                    label="멘토링 분야"
                    value={form.category || "-"}
                  />
                  <SummaryRow label="자기소개" value={form.introduction} />
                  <SummaryRow label="경력 요약" value={form.career} />
                  {form.expertise.length > 0 && (
                    <SummaryRow
                      label="전문 키워드"
                      value={form.expertise.join(", ")}
                    />
                  )}
                  {form.availableTime && (
                    <SummaryRow
                      label="가능 시간대"
                      value={form.availableTime}
                    />
                  )}
                </dl>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowPreviewModal(false)}
              >
                수정하기
              </Button>
              <Button
                onClick={handleSubmit}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Save className="h-4 w-4 mr-1.5" />
                등록하기
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Unsaved Changes Warning Modal ── */}
      {showLeaveModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowLeaveModal(false);
          }}
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">
              페이지를 나가시겠습니까?
            </h3>
            <p className="text-sm text-slate-500">
              작성 중인 내용이 있습니다. 나가시겠습니까?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowLeaveModal(false)}
              >
                계속 작성
              </Button>
              <Button
                onClick={confirmLeave}
                className="bg-red-600 hover:bg-red-700 text-white"
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

/* ── Summary row component for preview modal ── */
function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-slate-400 font-medium whitespace-nowrap">{label}</dt>
      <dd className="text-slate-800 break-all">{value || "-"}</dd>
    </>
  );
}
