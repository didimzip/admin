"use client";

import React, { useState, useEffect, useRef, use, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Trash2,
  Users,
  Monitor,
  MapPin,
  Calendar,
  Clock,
  Tag,
  Eye,
  AlertTriangle,
  XCircle,
  Image,
  ArrowRight,
} from "lucide-react";
import { RiGroupLine, RiAlarmWarningLine, RiTimerLine } from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";
import { useToast } from "@/lib/toast-context";
import { recordLog } from "@/lib/audit-log-store";
import {
  getStudy,
  upsertStudy,
  deleteStudies,
  updateStudyStatus,
} from "@/lib/study-store";
import {
  STUDY_CATEGORIES,
  type Study,
  type StudyStatus,
  type StudyCategory,
  type StudyMethod,
} from "@/data/mock-data";

/* ── Status badge config ── */
const statusConfig: Record<
  StudyStatus,
  { label: string; variant: "success" | "default" | "secondary" | "destructive" | "warning" }
> = {
  PENDING: { label: "승인대기", variant: "warning" },
  RECRUITING: { label: "모집중", variant: "success" },
  IN_PROGRESS: { label: "진행중", variant: "default" },
  COMPLETED: { label: "완료", variant: "secondary" },
  CANCELLED: { label: "취소", variant: "destructive" },
  HIDDEN: { label: "숨김", variant: "warning" },
};

/* ── Method display ── */
const methodLabel: Record<StudyMethod, string> = {
  ONLINE: "온라인",
  OFFLINE: "오프라인",
  HYBRID: "혼합",
};

/* ── Status transitions ── */
const statusTransitions: Record<StudyStatus, StudyStatus[]> = {
  PENDING: ["RECRUITING", "CANCELLED"],
  RECRUITING: ["IN_PROGRESS", "CANCELLED", "HIDDEN"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: ["RECRUITING"],
  HIDDEN: ["RECRUITING"],
};

/* ── D-day helper ── */
function getDday(dateStr: string | undefined | null): { text: string; isPast: boolean; days: number } | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff > 0) return { text: `모집 마감까지 D-${diff}`, isPast: false, days: diff };
  if (diff === 0) return { text: "모집 마감 D-Day", isPast: false, days: 0 };
  return { text: `모집 마감 D+${Math.abs(diff)}`, isPast: true, days: Math.abs(diff) };
}

export default function StudyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { showToast } = useToast();

  const [study, setStudy] = useState<Study | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<Partial<Study>>({});
  const [newStatus, setNewStatus] = useState<StudyStatus | "">("");
  const [adminMemo, setAdminMemo] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [showCancelEditConfirm, setShowCancelEditConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  /* track original form snapshot for dirty check */
  const originalFormRef = useRef<string>("");

  /* ── Load study ── */
  useEffect(() => {
    const s = getStudy(id);
    setStudy(s ?? null);
    if (s) {
      setAdminMemo(s.adminMemo ?? "");
    }
    setLoading(false);
  }, [id]);

  /* ── Helpers ── */
  function reload() {
    const s = getStudy(id);
    setStudy(s ?? null);
    if (s) {
      setAdminMemo(s.adminMemo ?? "");
    }
  }

  function fmtDate(str: string | undefined | null) {
    if (!str) return "—";
    return new Date(str).toLocaleDateString("ko-KR");
  }

  function fmtDateTime(str: string | undefined | null) {
    if (!str) return "—";
    return new Date(str).toLocaleString("ko-KR");
  }

  function isFormDirty(): boolean {
    return JSON.stringify(form) !== originalFormRef.current;
  }

  /* ── Edit ── */
  function startEdit() {
    if (!study) return;
    const formData: Partial<Study> = {
      title: study.title,
      description: study.description,
      category: study.category,
      method: study.method,
      location: study.location,
      maxMembers: study.maxMembers,
      startDate: study.startDate,
      endDate: study.endDate,
      recruitEndDate: study.recruitEndDate,
      schedule: study.schedule,
      tags: [...study.tags],
    };
    setForm(formData);
    originalFormRef.current = JSON.stringify(formData);
    setEditMode(true);
  }

  function cancelEdit() {
    if (isFormDirty()) {
      setShowCancelEditConfirm(true);
      return;
    }
    doCancel();
  }

  function doCancel() {
    setEditMode(false);
    setForm({});
    setTagInput("");
    setShowCancelEditConfirm(false);
  }

  function handleSave() {
    if (!study) return;
    upsertStudy({
      ...study,
      ...form,
      id: study.id,
    } as Omit<Study, "id" | "createdAt" | "updatedAt"> & { id: string });
    recordLog("STUDY_UPDATE", `스터디 "${form.title ?? study.title}" 정보 수정`, {
      targetType: "STUDY",
      targetId: study.id,
    });
    showToast("스터디 정보가 저장되었습니다.");
    setEditMode(false);
    setForm({});
    setTagInput("");
    reload();
  }

  /* ── Status change ── */
  function handleStatusChange() {
    if (!study || !newStatus) return;
    updateStudyStatus(study.id, newStatus as StudyStatus);
    const reasonPart = cancelReason.trim()
      ? ` (사유: ${cancelReason.trim()})`
      : "";
    recordLog(
      "STUDY_UPDATE",
      `스터디 상태 변경: ${statusConfig[study.status].label} → ${statusConfig[newStatus as StudyStatus].label}${reasonPart}`,
      { targetType: "STUDY", targetId: study.id }
    );
    showToast("상태가 변경되었습니다.");
    setNewStatus("");
    setCancelReason("");
    setShowStatusConfirm(false);
    reload();
  }

  /* ── Delete ── */
  function handleDelete() {
    if (!study) return;
    deleteStudies([study.id]);
    recordLog("STUDY_DELETE", `스터디 "${study.title}" 삭제`, {
      targetType: "STUDY",
      targetId: study.id,
    });
    showToast("스터디가 삭제되었습니다.");
    setTimeout(() => router.push("/studies"), 1500);
  }

  /* ── Admin memo ── */
  function handleSaveMemo() {
    if (!study) return;
    upsertStudy({
      ...study,
      adminMemo,
      id: study.id,
    } as Omit<Study, "id" | "createdAt" | "updatedAt"> & { id: string });
    recordLog("STUDY_UPDATE", `스터디 "${study.title}" 관리자 메모 수정`, {
      targetType: "STUDY",
      targetId: study.id,
    });
    showToast("메모가 저장되었습니다.");
    reload();
  }

  /* ── Tag helpers ── */
  function addTag(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const tag = tagInput.trim();
    if (!tag) return;
    const current = (form.tags as string[]) ?? [];
    if (current.includes(tag)) {
      setTagInput("");
      return;
    }
    setForm({ ...form, tags: [...current, tag] });
    setTagInput("");
  }

  function removeTag(tag: string) {
    const current = (form.tags as string[]) ?? [];
    setForm({ ...form, tags: current.filter((t) => t !== tag) });
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600" />
      </div>
    );
  }

  /* ── Not found ── */
  if (!study) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-slate-500 text-lg">스터디를 찾을 수 없습니다.</p>
        <Button variant="outline" onClick={() => router.push("/studies")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          목록으로 돌아가기
        </Button>
      </div>
    );
  }

  const sc = statusConfig[study.status];
  const allowedTransitions = statusTransitions[study.status] ?? [];
  const dday = getDday(study.recruitEndDate);
  const recruitPercent = study.maxMembers > 0
    ? Math.min(Math.round((study.currentMembers / study.maxMembers) * 100), 100)
    : 0;
  const showLocation = editMode
    ? (form.method as StudyMethod) !== "ONLINE"
    : study.method !== "ONLINE";

  return (
    <div className="space-y-6">
      {/* ── Report warning banner ── */}
      {study.reportCount > 0 && (
        <div
          className={cn(
            "flex items-center gap-3 rounded-xl border px-5 py-3.5",
            study.reportCount >= 5
              ? "border-red-300 bg-red-50 text-red-800"
              : "border-amber-300 bg-amber-50 text-amber-800"
          )}
        >
          <RiAlarmWarningLine className="h-5 w-5 shrink-0" />
          <span className="text-sm font-medium">
            이 스터디는 {study.reportCount}건의 신고가 접수되었습니다.
            {study.reportCount >= 5 && " 즉시 확인이 필요합니다."}
          </span>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-lg"
            onClick={() => router.push("/studies")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-slate-900">{study.title}</h1>
          <Badge variant={sc.variant}>{sc.label}</Badge>
        </div>

        <div className="flex items-center gap-2">
          {!editMode ? (
            <>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                삭제
              </Button>
              <Button variant="outline" onClick={startEdit}>
                수정
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={cancelEdit}>
                취소
              </Button>
              <Button onClick={handleSave}>
                <Save className="mr-1.5 h-4 w-4" />
                저장
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── D-day banner ── */}
      {dday && study.status === "RECRUITING" && (
        <div
          className={cn(
            "flex items-center gap-3 rounded-xl border px-5 py-3",
            dday.isPast
              ? "border-red-200 bg-red-50 text-red-700"
              : dday.days <= 3
              ? "border-amber-200 bg-amber-50 text-amber-700"
              : "border-indigo-200 bg-indigo-50 text-indigo-700"
          )}
        >
          <RiTimerLine className="h-5 w-5 shrink-0" />
          <span className="text-sm font-semibold">{dday.text}</span>
          <span className="text-xs opacity-70">
            ({fmtDate(study.recruitEndDate)})
          </span>
        </div>
      )}

      {/* ── Two-column layout ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Left column ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* 기본 정보 */}
          <div className="bg-white rounded-xl border shadow-sm p-6 space-y-5">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <RiGroupLine className="h-4 w-4 text-slate-500" />
              기본 정보
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* 제목 */}
              <div className="sm:col-span-2">
                <Label className="text-xs text-slate-500">제목</Label>
                {editMode ? (
                  <Input
                    value={(form.title as string) ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                  />
                ) : (
                  <p className="mt-1 text-sm font-medium">{study.title}</p>
                )}
              </div>

              {/* 카테고리 */}
              <div>
                <Label className="text-xs text-slate-500">카테고리</Label>
                {editMode ? (
                  <Select
                    value={(form.category as string) ?? ""}
                    onValueChange={(v) =>
                      setForm({ ...form, category: v as StudyCategory })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="카테고리 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {STUDY_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="mt-1 text-sm">
                    <Badge variant="outline">{study.category}</Badge>
                  </div>
                )}
              </div>

              {/* 진행 방식 */}
              <div>
                <Label className="text-xs text-slate-500 flex items-center gap-1">
                  <Monitor className="h-3 w-3" /> 진행 방식
                </Label>
                {editMode ? (
                  <Select
                    value={(form.method as string) ?? ""}
                    onValueChange={(v) =>
                      setForm({ ...form, method: v as StudyMethod, ...(v === "ONLINE" ? { location: "" } : {}) })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="진행 방식 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ONLINE">온라인</SelectItem>
                      <SelectItem value="OFFLINE">오프라인</SelectItem>
                      <SelectItem value="HYBRID">혼합</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="mt-1 text-sm">{methodLabel[study.method]}</p>
                )}
              </div>

              {/* 장소 — hidden when ONLINE */}
              {showLocation && (
                <div className="sm:col-span-2">
                  <Label className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> 장소
                  </Label>
                  {editMode ? (
                    <Input
                      className="mt-1"
                      value={(form.location as string) ?? ""}
                      onChange={(e) =>
                        setForm({ ...form, location: e.target.value })
                      }
                    />
                  ) : (
                    <p className="mt-1 text-sm">
                      {study.location || "—"}
                    </p>
                  )}
                </div>
              )}

              {/* 작성자 */}
              <div>
                <Label className="text-xs text-slate-500">작성자</Label>
                <p className="mt-1 text-sm">{study.authorNickname}</p>
              </div>

              {/* 작성자 ID */}
              <div>
                <Label className="text-xs text-slate-500">작성자 ID</Label>
                <p className="mt-1 text-sm text-slate-400">{study.authorId}</p>
              </div>
            </div>
          </div>

          {/* 설명 */}
          <div className="bg-white rounded-xl border shadow-sm p-6 space-y-5">
            <h2 className="text-base font-semibold">설명</h2>
            {editMode ? (
              <div className="space-y-1">
                <Textarea
                  rows={8}
                  value={(form.description as string) ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
                <p className="text-xs text-slate-400 text-right">
                  {((form.description as string) ?? "").length}자
                </p>
              </div>
            ) : (
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: study.description }}
              />
            )}
          </div>

          {/* 일정 및 인원 */}
          <div className="bg-white rounded-xl border shadow-sm p-6 space-y-5">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-500" />
              일정 및 인원
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* 시작일 */}
              <div>
                <Label className="text-xs text-slate-500">시작일</Label>
                {editMode ? (
                  <Input
                    type="date"
                    className="mt-1"
                    value={(form.startDate as string)?.split("T")[0] ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, startDate: e.target.value })
                    }
                  />
                ) : (
                  <p className="mt-1 text-sm">{fmtDate(study.startDate)}</p>
                )}
              </div>

              {/* 종료일 */}
              <div>
                <Label className="text-xs text-slate-500">종료일</Label>
                {editMode ? (
                  <Input
                    type="date"
                    className="mt-1"
                    value={(form.endDate as string)?.split("T")[0] ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, endDate: e.target.value })
                    }
                  />
                ) : (
                  <p className="mt-1 text-sm">{fmtDate(study.endDate)}</p>
                )}
              </div>

              {/* 모집 마감일 */}
              <div>
                <Label className="text-xs text-slate-500">모집 마감일</Label>
                {editMode ? (
                  <Input
                    type="date"
                    className="mt-1"
                    value={
                      (form.recruitEndDate as string)?.split("T")[0] ?? ""
                    }
                    onChange={(e) =>
                      setForm({ ...form, recruitEndDate: e.target.value })
                    }
                  />
                ) : (
                  <p className="mt-1 text-sm">
                    {fmtDate(study.recruitEndDate)}
                  </p>
                )}
              </div>

              {/* 일정 */}
              <div>
                <Label className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> 일정
                </Label>
                {editMode ? (
                  <Input
                    className="mt-1"
                    value={(form.schedule as string) ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, schedule: e.target.value })
                    }
                  />
                ) : (
                  <p className="mt-1 text-sm">{study.schedule || "—"}</p>
                )}
              </div>

              {/* 최대 인원 */}
              <div>
                <Label className="text-xs text-slate-500 flex items-center gap-1">
                  <Users className="h-3 w-3" /> 최대 인원
                </Label>
                {editMode ? (
                  <Input
                    type="number"
                    min={1}
                    className="mt-1"
                    value={form.maxMembers ?? 0}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        maxMembers: Number(e.target.value),
                      })
                    }
                  />
                ) : (
                  <p className="mt-1 text-sm">{study.maxMembers}명</p>
                )}
              </div>

              {/* 현재 인원 */}
              <div>
                <Label className="text-xs text-slate-500">현재 인원</Label>
                <p className="mt-1 text-sm">
                  {study.currentMembers} / {study.maxMembers}명
                </p>
              </div>
            </div>
          </div>

          {/* 태그 */}
          <div className="bg-white rounded-xl border shadow-sm p-6 space-y-5">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Tag className="h-4 w-4 text-slate-500" /> 태그
            </h2>

            {editMode ? (
              <div className="space-y-2">
                <Input
                  placeholder="태그 입력 후 Enter"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={addTag}
                />
                <div className="flex flex-wrap gap-1.5">
                  {((form.tags as string[]) ?? []).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-0.5 text-indigo-400 hover:text-indigo-700"
                      >
                        <XCircle className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {study.tags.length > 0 ? (
                  study.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 border border-indigo-200"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-400">—</span>
                )}
              </div>
            )}
          </div>

          {/* 썸네일 */}
          {study.thumbnailUrl && (
            <div className="bg-white rounded-xl border shadow-sm p-6 space-y-5">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <Image className="h-4 w-4 text-slate-500" /> 썸네일
              </h2>
              <img
                src={study.thumbnailUrl}
                alt="썸네일"
                className="max-w-sm rounded-lg border"
              />
            </div>
          )}
        </div>

        {/* ── Right column ── */}
        <div className="space-y-6">
          {/* 상태 관리 */}
          <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
            <h2 className="text-base font-semibold">상태 관리</h2>

            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">현재 상태:</span>
              <Badge variant={sc.variant}>{sc.label}</Badge>
            </div>

            {allowedTransitions.length > 0 ? (
              <div className="space-y-3">
                <Select
                  value={newStatus}
                  onValueChange={(v) => setNewStatus(v as StudyStatus)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="상태 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {allowedTransitions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {statusConfig[s].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  className="w-full"
                  disabled={!newStatus}
                  onClick={() => {
                    setCancelReason("");
                    setShowStatusConfirm(true);
                  }}
                >
                  상태 변경
                </Button>
              </div>
            ) : (
              <p className="text-sm text-slate-400">
                변경 가능한 상태가 없습니다.
              </p>
            )}
          </div>

          {/* 통계 */}
          <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
            <h2 className="text-base font-semibold">통계</h2>

            <div className="grid gap-4 sm:grid-cols-1">
              <div className="rounded-lg border p-4 text-center">
                <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
                  <Eye className="h-3 w-3" /> 조회수
                </p>
                <p className="mt-1 text-2xl font-bold text-indigo-600">
                  {study.viewCount.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg border p-4 space-y-2">
                <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
                  <Users className="h-3 w-3" /> 모집 현황
                </p>
                <p className="text-2xl font-bold text-indigo-600 text-center">
                  {study.currentMembers} / {study.maxMembers}
                </p>
                {/* Progress bar */}
                <div className="relative w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "absolute left-0 top-0 h-full rounded-full transition-all",
                      recruitPercent >= 100
                        ? "bg-red-500"
                        : recruitPercent >= 80
                        ? "bg-amber-500"
                        : "bg-indigo-500"
                    )}
                    style={{ width: `${recruitPercent}%` }}
                  />
                </div>
                <p className="text-xs text-center text-slate-500">
                  {recruitPercent}% 모집 완료
                </p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> 신고 횟수
                </p>
                <p
                  className={cn(
                    "mt-1 text-2xl font-bold",
                    study.reportCount > 0
                      ? "text-red-500"
                      : "text-indigo-600"
                  )}
                >
                  {study.reportCount}
                </p>
              </div>
            </div>
          </div>

          {/* 날짜 정보 */}
          <div className="bg-white rounded-xl border shadow-sm p-6 space-y-3">
            <h2 className="text-base font-semibold">날짜 정보</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">등록일</span>
                <span>{fmtDateTime(study.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">수정일</span>
                <span>{fmtDateTime(study.updatedAt)}</span>
              </div>
            </div>
          </div>

          {/* 관리자 메모 */}
          <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
            <h2 className="text-base font-semibold">관리자 메모</h2>
            <Textarea
              rows={4}
              placeholder="관리자 메모를 입력하세요"
              value={adminMemo}
              onChange={(e) => setAdminMemo(e.target.value)}
            />
            <Button
              className="w-full"
              variant="outline"
              onClick={handleSaveMemo}
            >
              <Save className="mr-1.5 h-4 w-4" />
              메모 저장
            </Button>
          </div>
        </div>
      </div>

      {/* ── Delete confirmation modal ── */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDeleteConfirm(false);
          }}
        >
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm space-y-4">
            <h3 className="text-lg font-semibold">스터디 삭제</h3>
            <p className="text-sm text-slate-600">
              &ldquo;{study.title}&rdquo; 스터디를 삭제하시겠습니까?
              <br />
              이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                onClick={() => setShowDeleteConfirm(false)}
              >
                취소
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="mr-1.5 h-4 w-4" />
                삭제
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Status change confirmation modal ── */}
      {showStatusConfirm && newStatus && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowStatusConfirm(false);
          }}
        >
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm space-y-4">
            <h3 className="text-lg font-semibold">상태 변경</h3>
            <div className="flex items-center justify-center gap-3 py-2">
              <Badge variant={sc.variant} className="text-sm px-3 py-1">
                {sc.label}
              </Badge>
              <ArrowRight className="h-4 w-4 text-slate-400" />
              <Badge
                variant={statusConfig[newStatus as StudyStatus].variant}
                className="text-sm px-3 py-1"
              >
                {statusConfig[newStatus as StudyStatus].label}
              </Badge>
            </div>
            <p className="text-sm text-slate-600 text-center">
              상태를 변경하시겠습니까?
            </p>
            {/* Cancel reason textarea */}
            {newStatus === "CANCELLED" && (
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500">취소 사유</Label>
                <Textarea
                  rows={3}
                  placeholder="취소 사유를 입력하세요"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                onClick={() => setShowStatusConfirm(false)}
              >
                취소
              </Button>
              <Button
                onClick={handleStatusChange}
                disabled={newStatus === "CANCELLED" && !cancelReason.trim()}
              >
                확인
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Cancel edit confirmation modal ── */}
      {showCancelEditConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCancelEditConfirm(false);
          }}
        >
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm space-y-4">
            <h3 className="text-lg font-semibold">수정 취소</h3>
            <p className="text-sm text-slate-600">
              수정 중인 내용이 있습니다. 취소하시겠습니까?
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                onClick={() => setShowCancelEditConfirm(false)}
              >
                계속 수정
              </Button>
              <Button variant="destructive" onClick={doCancel}>
                수정 취소
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
