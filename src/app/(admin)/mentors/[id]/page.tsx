"use client";

import React, { useState, useEffect, type KeyboardEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Trash2,
  CheckCircle2,
  XCircle,
  Ban,
  Star,
  Building2,
  Briefcase,
  Clock,
  Mail,
  Phone,
  Tag,
  User,
} from "lucide-react";
import { RiUserStarLine, RiHistoryLine, RiChat3Line } from "react-icons/ri";
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
  getMentor,
  upsertMentor,
  updateMentorStatus,
  deleteMentors,
} from "@/lib/mentor-store";
import {
  MENTOR_CATEGORIES,
  type Mentor,
  type MentorStatus,
  type MentorCategory,
} from "@/data/mock-data";

/* ── Status badge config ── */
const statusConfig: Record<
  MentorStatus,
  { label: string; variant: "warning" | "success" | "destructive" | "secondary" }
> = {
  PENDING: { label: "대기", variant: "warning" },
  APPROVED: { label: "승인", variant: "success" },
  REJECTED: { label: "반려", variant: "destructive" },
  SUSPENDED: { label: "정지", variant: "secondary" },
};

/* ── Modal types ── */
type ModalType = "reject" | "suspend" | "resume" | "delete" | null;

export default function MentorDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();

  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<Partial<Mentor>>({});
  const [adminMemo, setAdminMemo] = useState("");
  const [expertiseInput, setExpertiseInput] = useState("");

  /* ── Modal state ── */
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [modalRejectReason, setModalRejectReason] = useState("");
  const [modalSuspendReason, setModalSuspendReason] = useState("");

  /* ── Load mentor ── */
  useEffect(() => {
    const m = getMentor(id);
    setMentor(m ?? null);
    if (m) {
      setAdminMemo(m.adminMemo ?? "");
    }
    setLoading(false);
  }, [id]);

  /* ── Helpers ── */
  function reload() {
    const m = getMentor(id);
    setMentor(m ?? null);
    if (m) {
      setAdminMemo(m.adminMemo ?? "");
    }
  }

  function startEdit() {
    if (!mentor) return;
    setForm({
      name: mentor.name,
      nickname: mentor.nickname,
      email: mentor.email,
      phone: mentor.phone,
      companyName: mentor.companyName,
      companyType: mentor.companyType,
      position: mentor.position,
      category: mentor.category,
      introduction: mentor.introduction,
      career: mentor.career,
      expertise: [...mentor.expertise],
      availableTime: mentor.availableTime,
    });
    setEditMode(true);
  }

  function cancelEdit() {
    setEditMode(false);
    setForm({});
    setExpertiseInput("");
  }

  function handleSave() {
    if (!mentor) return;
    upsertMentor({
      ...mentor,
      ...form,
      id: mentor.id,
    } as Omit<Mentor, "id" | "createdAt" | "updatedAt"> & { id: string });
    recordLog("MENTOR_UPDATE", `멘토 "${form.name ?? mentor.name}" 정보 수정`, {
      targetType: "MENTOR",
      targetId: mentor.id,
    });
    showToast("멘토 정보가 저장되었습니다.");
    setEditMode(false);
    setForm({});
    setExpertiseInput("");
    reload();
  }

  /* ── Status actions ── */
  function handleApprove() {
    if (!mentor) return;
    updateMentorStatus(mentor.id, "APPROVED");
    recordLog("MENTOR_APPROVE", `멘토 "${mentor.name}" 승인`, {
      targetType: "MENTOR",
      targetId: mentor.id,
    });
    showToast("멘토가 승인되었습니다.");
    reload();
  }

  function handleReject() {
    if (!mentor) return;
    if (!modalRejectReason.trim()) {
      showToast("반려 사유를 입력해주세요.");
      return;
    }
    updateMentorStatus(mentor.id, "REJECTED", modalRejectReason);
    recordLog("MENTOR_REJECT", `멘토 "${mentor.name}" 반려: ${modalRejectReason}`, {
      targetType: "MENTOR",
      targetId: mentor.id,
    });
    showToast("멘토가 반려되었습니다.");
    setActiveModal(null);
    setModalRejectReason("");
    reload();
  }

  function handleSuspend() {
    if (!mentor) return;
    updateMentorStatus(mentor.id, "SUSPENDED", modalSuspendReason || undefined);
    recordLog("MENTOR_SUSPEND", `멘토 "${mentor.name}" 정지${modalSuspendReason ? `: ${modalSuspendReason}` : ""}`, {
      targetType: "MENTOR",
      targetId: mentor.id,
    });
    showToast("멘토가 정지되었습니다.");
    setActiveModal(null);
    setModalSuspendReason("");
    reload();
  }

  function handleResume() {
    if (!mentor) return;
    updateMentorStatus(mentor.id, "APPROVED");
    recordLog("MENTOR_RESUME", `멘토 "${mentor.name}" 활동 재개`, {
      targetType: "MENTOR",
      targetId: mentor.id,
    });
    showToast("멘토 활동이 재개되었습니다.");
    setActiveModal(null);
    reload();
  }

  function handleDelete() {
    if (!mentor) return;
    deleteMentors([mentor.id]);
    recordLog("MENTOR_DELETE", `멘토 "${mentor.name}" 삭제`, {
      targetType: "MENTOR",
      targetId: mentor.id,
    });
    showToast("멘토가 삭제되었습니다.");
    setTimeout(() => router.push("/mentors"), 1500);
  }

  function handleSaveMemo() {
    if (!mentor) return;
    upsertMentor({
      ...mentor,
      adminMemo,
      id: mentor.id,
    } as Omit<Mentor, "id" | "createdAt" | "updatedAt"> & { id: string });
    recordLog("MENTOR_UPDATE", `멘토 "${mentor.name}" 관리자 메모 수정`, {
      targetType: "MENTOR",
      targetId: mentor.id,
    });
    showToast("메모가 저장되었습니다.");
    reload();
  }

  /* ── Expertise tag helpers ── */
  function addExpertise(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const tag = expertiseInput.trim();
    if (!tag) return;
    const current = (form.expertise as string[]) ?? [];
    if (current.includes(tag)) {
      setExpertiseInput("");
      return;
    }
    setForm({ ...form, expertise: [...current, tag] });
    setExpertiseInput("");
  }

  function removeExpertise(tag: string) {
    const current = (form.expertise as string[]) ?? [];
    setForm({ ...form, expertise: current.filter((t) => t !== tag) });
  }

  /* ── Date formatting ── */
  function fmtDate(str: string | undefined | null) {
    if (!str) return "—";
    return new Date(str).toLocaleDateString("ko-KR");
  }

  /* ── Star rendering ── */
  function renderStars(rating: number) {
    const full = Math.floor(rating);
    const hasHalf = rating - full >= 0.5;
    const empty = 5 - full - (hasHalf ? 1 : 0);
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: full }).map((_, i) => (
          <Star key={`f${i}`} className="h-4 w-4 fill-amber-400 text-amber-400" />
        ))}
        {hasHalf && (
          <div className="relative h-4 w-4">
            <Star className="absolute h-4 w-4 text-slate-200" />
            <div className="absolute overflow-hidden w-[50%]">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            </div>
          </div>
        )}
        {Array.from({ length: empty }).map((_, i) => (
          <Star key={`e${i}`} className="h-4 w-4 text-slate-200" />
        ))}
      </div>
    );
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
      </div>
    );
  }

  /* ── Not found ── */
  if (!mentor) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-slate-500 text-lg">멘토를 찾을 수 없습니다.</p>
        <Button variant="outline" onClick={() => router.push("/mentors")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          목록으로 돌아가기
        </Button>
      </div>
    );
  }

  const sc = statusConfig[mentor.status];

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-lg"
            onClick={() => router.push("/mentors")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-slate-900">{mentor.name}</h1>
          <Badge variant={sc.variant}>{sc.label}</Badge>
        </div>

        <div className="flex items-center gap-2">
          {!editMode ? (
            <>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setActiveModal("delete")}
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

      {/* ── Rejection reason prominent display ── */}
      {mentor.status === "REJECTED" && mentor.rejectReason && (
        <div className="rounded-xl border-2 border-red-300 bg-red-50 p-5">
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-700 mb-1">반려 사유</p>
              <p className="text-sm text-red-800 whitespace-pre-wrap">{mentor.rejectReason}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Two-column layout ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Left: Profile ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* 기본 정보 */}
          <div className="bg-white rounded-xl border shadow-sm p-6 space-y-5">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-slate-500" />
              기본 정보
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* 이름 */}
              <div>
                <Label className="text-xs text-slate-500">이름</Label>
                {editMode ? (
                  <Input
                    value={(form.name as string) ?? ""}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                ) : (
                  <p className="mt-1 text-sm font-medium">{mentor.name}</p>
                )}
              </div>

              {/* 닉네임 */}
              <div>
                <Label className="text-xs text-slate-500">닉네임</Label>
                {editMode ? (
                  <Input
                    value={(form.nickname as string) ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, nickname: e.target.value })
                    }
                  />
                ) : (
                  <p className="mt-1 text-sm font-medium">{mentor.nickname}</p>
                )}
              </div>

              {/* 이메일 */}
              <div>
                <Label className="text-xs text-slate-500 flex items-center gap-1">
                  <Mail className="h-3 w-3" /> 이메일
                </Label>
                {editMode ? (
                  <Input
                    value={(form.email as string) ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                  />
                ) : (
                  <p className="mt-1 text-sm">{mentor.email}</p>
                )}
              </div>

              {/* 전화번호 */}
              <div>
                <Label className="text-xs text-slate-500 flex items-center gap-1">
                  <Phone className="h-3 w-3" /> 전화번호
                </Label>
                {editMode ? (
                  <Input
                    value={(form.phone as string) ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                  />
                ) : (
                  <p className="mt-1 text-sm">{mentor.phone}</p>
                )}
              </div>

              {/* 회사명 */}
              <div>
                <Label className="text-xs text-slate-500 flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> 회사명
                </Label>
                {editMode ? (
                  <Input
                    value={(form.companyName as string) ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, companyName: e.target.value })
                    }
                  />
                ) : (
                  <p className="mt-1 text-sm">{mentor.companyName}</p>
                )}
              </div>

              {/* 회사 유형 */}
              <div>
                <Label className="text-xs text-slate-500">회사 유형</Label>
                {editMode ? (
                  <Input
                    value={(form.companyType as string) ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, companyType: e.target.value })
                    }
                  />
                ) : (
                  <p className="mt-1 text-sm">{mentor.companyType}</p>
                )}
              </div>

              {/* 직책 */}
              <div className="sm:col-span-2">
                <Label className="text-xs text-slate-500">직책</Label>
                {editMode ? (
                  <Input
                    value={(form.position as string) ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, position: e.target.value })
                    }
                  />
                ) : (
                  <p className="mt-1 text-sm">{mentor.position}</p>
                )}
              </div>
            </div>
          </div>

          {/* 멘토링 정보 */}
          <div className="bg-white rounded-xl border shadow-sm p-6 space-y-5">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <RiUserStarLine className="h-4 w-4 text-slate-500" />
              멘토링 정보
            </h2>

            {/* 카테고리 */}
            <div>
              <Label className="text-xs text-slate-500">카테고리</Label>
              {editMode ? (
                <Select
                  value={(form.category as string) ?? ""}
                  onValueChange={(v) =>
                    setForm({ ...form, category: v as MentorCategory })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="카테고리 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {MENTOR_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="mt-1 text-sm">
                  <Badge variant="outline">{mentor.category}</Badge>
                </p>
              )}
            </div>

            {/* 소개 */}
            <div>
              <Label className="text-xs text-slate-500">소개</Label>
              {editMode ? (
                <Textarea
                  className="mt-1"
                  rows={3}
                  value={(form.introduction as string) ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, introduction: e.target.value })
                  }
                />
              ) : (
                <p className="mt-1 text-sm whitespace-pre-wrap">
                  {mentor.introduction || "—"}
                </p>
              )}
            </div>

            {/* 경력 */}
            <div>
              <Label className="text-xs text-slate-500">경력</Label>
              {editMode ? (
                <Textarea
                  className="mt-1"
                  rows={3}
                  value={(form.career as string) ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, career: e.target.value })
                  }
                />
              ) : (
                <p className="mt-1 text-sm whitespace-pre-wrap">
                  {mentor.career || "—"}
                </p>
              )}
            </div>

            {/* 전문 분야 (태그) */}
            <div>
              <Label className="text-xs text-slate-500 flex items-center gap-1">
                <Tag className="h-3 w-3" /> 전문 분야
              </Label>
              {editMode ? (
                <div className="mt-1 space-y-2">
                  <Input
                    placeholder="태그 입력 후 Enter"
                    value={expertiseInput}
                    onChange={(e) => setExpertiseInput(e.target.value)}
                    onKeyDown={addExpertise}
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {((form.expertise as string[]) ?? []).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeExpertise(tag)}
                          className="ml-0.5 text-indigo-400 hover:text-indigo-700"
                        >
                          <XCircle className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {mentor.expertise.length > 0 ? (
                    mentor.expertise.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700"
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

            {/* 가능 시간 */}
            <div>
              <Label className="text-xs text-slate-500 flex items-center gap-1">
                <Clock className="h-3 w-3" /> 가능 시간
              </Label>
              {editMode ? (
                <Input
                  className="mt-1"
                  value={(form.availableTime as string) ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, availableTime: e.target.value })
                  }
                />
              ) : (
                <p className="mt-1 text-sm">{mentor.availableTime || "—"}</p>
              )}
            </div>
          </div>

          {/* 활동 통계 */}
          <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Star className="h-4 w-4 text-slate-500" />
              활동 통계
            </h2>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border p-4 text-center">
                <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
                  <RiChat3Line className="h-3 w-3" /> 멘토링 횟수
                </p>
                <p className="mt-1 text-2xl font-bold text-indigo-600">
                  {mentor.mentoringCount}
                </p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="text-xs text-slate-500">평점</p>
                <div className="mt-1 flex flex-col items-center gap-1">
                  {renderStars(mentor.rating)}
                  <p className="text-lg font-bold text-amber-500">
                    {mentor.rating.toFixed(1)}
                  </p>
                </div>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="text-xs text-slate-500">신청일</p>
                <p className="mt-1 text-sm font-medium">
                  {fmtDate(mentor.appliedAt)}
                </p>
                {mentor.approvedAt && (
                  <p className="mt-0.5 text-xs text-slate-400">
                    승인일: {fmtDate(mentor.approvedAt)}
                  </p>
                )}
              </div>
            </div>
          </div>
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

            {/* PENDING actions */}
            {mentor.status === "PENDING" && (
              <div className="space-y-3">
                <Button
                  className="w-full"
                  variant="default"
                  onClick={handleApprove}
                >
                  <CheckCircle2 className="mr-1.5 h-4 w-4" />
                  승인
                </Button>
                <Button
                  className="w-full"
                  variant="destructive"
                  onClick={() => {
                    setModalRejectReason("");
                    setActiveModal("reject");
                  }}
                >
                  <XCircle className="mr-1.5 h-4 w-4" />
                  반려
                </Button>
              </div>
            )}

            {/* APPROVED actions */}
            {mentor.status === "APPROVED" && (
              <Button
                className="w-full"
                variant="outline"
                onClick={() => {
                  setModalSuspendReason("");
                  setActiveModal("suspend");
                }}
              >
                <Ban className="mr-1.5 h-4 w-4" />
                정지
              </Button>
            )}

            {/* REJECTED: short notice in sidebar */}
            {mentor.status === "REJECTED" && mentor.rejectReason && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-xs font-medium text-red-600 mb-1">
                  반려 사유
                </p>
                <p className="text-sm text-red-800">{mentor.rejectReason}</p>
              </div>
            )}

            {/* SUSPENDED actions */}
            {mentor.status === "SUSPENDED" && (
              <Button
                className="w-full"
                variant="outline"
                onClick={() => setActiveModal("resume")}
              >
                <CheckCircle2 className="mr-1.5 h-4 w-4" />
                활동 재개
              </Button>
            )}
          </div>

          {/* 상태 변경 이력 */}
          <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <RiHistoryLine className="h-4 w-4 text-slate-500" />
              상태 변경 이력
            </h2>

            <div className="relative pl-4 border-l-2 border-slate-200 space-y-4">
              {/* 신청 */}
              {mentor.appliedAt && (
                <div className="relative">
                  <div className="absolute -left-[calc(0.5rem+1px)] top-1.5 h-2.5 w-2.5 rounded-full bg-indigo-500 border-2 border-white" />
                  <p className="text-xs text-slate-400">{fmtDate(mentor.appliedAt)}</p>
                  <p className="text-sm font-medium">멘토 신청</p>
                </div>
              )}

              {/* 승인 */}
              {mentor.approvedAt && (
                <div className="relative">
                  <div className="absolute -left-[calc(0.5rem+1px)] top-1.5 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-white" />
                  <p className="text-xs text-slate-400">{fmtDate(mentor.approvedAt)}</p>
                  <p className="text-sm font-medium">승인 완료</p>
                </div>
              )}

              {/* 현재 상태 */}
              <div className="relative">
                <div className={cn(
                  "absolute -left-[calc(0.5rem+1px)] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white",
                  mentor.status === "APPROVED" && "bg-green-500",
                  mentor.status === "PENDING" && "bg-amber-500",
                  mentor.status === "REJECTED" && "bg-red-500",
                  mentor.status === "SUSPENDED" && "bg-gray-500",
                )} />
                <p className="text-xs text-slate-400">현재</p>
                <p className="text-sm font-medium">
                  <Badge variant={sc.variant} className="text-xs">{sc.label}</Badge>
                </p>
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
            <Button className="w-full" variant="outline" onClick={handleSaveMemo}>
              <Save className="mr-1.5 h-4 w-4" />
              메모 저장
            </Button>
          </div>
        </div>
      </div>

      {/* ── Reject modal ── */}
      {activeModal === "reject" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={(e) => { if (e.target === e.currentTarget) setActiveModal(null); }}>
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm space-y-4">
            <h3 className="text-lg font-semibold">멘토 반려</h3>
            <div className="space-y-2">
              <Label className="text-sm text-slate-600">반려 사유 <span className="text-red-500">*</span></Label>
              <Textarea
                rows={4}
                placeholder="반려 사유를 입력해주세요"
                value={modalRejectReason}
                onChange={(e) => setModalRejectReason(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setActiveModal(null)}>취소</Button>
              <Button variant="destructive" onClick={handleReject}>반려</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Suspend modal ── */}
      {activeModal === "suspend" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={(e) => { if (e.target === e.currentTarget) setActiveModal(null); }}>
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm space-y-4">
            <h3 className="text-lg font-semibold">멘토 정지</h3>
            <div className="space-y-2">
              <Label className="text-sm text-slate-600">정지 사유 (선택)</Label>
              <Textarea
                rows={3}
                placeholder="정지 사유를 입력해주세요 (선택)"
                value={modalSuspendReason}
                onChange={(e) => setModalSuspendReason(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setActiveModal(null)}>취소</Button>
              <Button variant="destructive" onClick={handleSuspend}>
                <Ban className="mr-1.5 h-4 w-4" />
                정지
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Resume modal ── */}
      {activeModal === "resume" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={(e) => { if (e.target === e.currentTarget) setActiveModal(null); }}>
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm space-y-4">
            <h3 className="text-lg font-semibold">활동 재개</h3>
            <p className="text-sm text-slate-600">활동을 재개하시겠습니까?</p>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setActiveModal(null)}>취소</Button>
              <Button onClick={handleResume}>
                <CheckCircle2 className="mr-1.5 h-4 w-4" />
                확인
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete modal ── */}
      {activeModal === "delete" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={(e) => { if (e.target === e.currentTarget) setActiveModal(null); }}>
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm space-y-4">
            <h3 className="text-lg font-semibold">멘토 삭제</h3>
            <p className="text-sm text-slate-600">
              &ldquo;{mentor.name}&rdquo; 멘토를 삭제하시겠습니까?
              <br />
              이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setActiveModal(null)}>취소</Button>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="mr-1.5 h-4 w-4" />
                삭제
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
