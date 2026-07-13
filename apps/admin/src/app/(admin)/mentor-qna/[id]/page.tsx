"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Send, Lock, User, Building2, Calendar } from "lucide-react";
import {
  RiQuestionAnswerLine,
  RiTimeLine,
  RiCheckLine,
  RiCloseLine,
  RiAlertLine,
  RiArrowRightSLine,
  RiUserLine,
  RiGroupLine,
} from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useToast } from "@/lib/toast-context";
import { recordLog } from "@/lib/audit-log-store";
import { getQuestion, upsertQuestion, answerQuestion, closeQuestion } from "@/lib/mentor-qna-store";
import { type MentorQuestion } from "@/data/mock-data";

const ANSWER_MAX_LENGTH = 2000;

const STATUS_MAP: Record<
  string,
  { label: string; variant: "warning" | "success" | "secondary"; icon: React.ReactNode }
> = {
  WAITING: {
    label: "답변 대기",
    variant: "warning",
    icon: <RiTimeLine className="h-3.5 w-3.5" />,
  },
  ANSWERED: {
    label: "답변 완료",
    variant: "success",
    icon: <RiCheckLine className="h-3.5 w-3.5" />,
  },
  CLOSED: {
    label: "종료",
    variant: "secondary",
    icon: <RiCloseLine className="h-3.5 w-3.5" />,
  },
};

function formatDate(str: string) {
  if (!str) return "-";
  const d = new Date(str);
  return d.toLocaleDateString("ko-KR");
}

function formatDateTime(str: string) {
  if (!str) return "-";
  const d = new Date(str);
  return (
    d.toLocaleDateString("ko-KR") +
    " " +
    d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
  );
}

function calcResponseTime(createdAt: string, answeredAt: string): string | null {
  if (!createdAt || !answeredAt) return null;
  const diff = new Date(answeredAt).getTime() - new Date(createdAt).getTime();
  if (diff < 0) return null;
  const totalHours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  if (days === 0 && hours === 0) return "1시간 미만";
  if (days === 0) return `${hours}시간`;
  return `${days}일 ${hours}시간`;
}

/* ── Close-question confirmation modal ── */
function CloseModal({
  onConfirm,
  onClose,
}: {
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-amber-600">
          <RiAlertLine className="h-5 w-5" />
          <h3 className="text-base font-semibold">질문 종료</h3>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">
          이 질문을 종료하시겠습니까? 종료 후에는 답변을 수정할 수 없습니다.
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            취소
          </Button>
          <Button variant="destructive" size="sm" onClick={onConfirm}>
            종료
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function MentorQnaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();

  const id = params.id as string;

  const [question, setQuestion] = useState<MentorQuestion | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [adminMemo, setAdminMemo] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);

  useEffect(() => {
    const q = getQuestion(id);
    if (!q) {
      setNotFound(true);
      return;
    }
    setQuestion(q);
    setAnswerText(q.answer || "");
    setAdminMemo(q.adminMemo || "");
  }, [id]);

  /* ---------- actions ---------- */

  const handleSubmitAnswer = () => {
    if (!question || !answerText.trim()) return;
    answerQuestion(question.id, answerText.trim());
    recordLog(
      question.answer ? "MENTOR_QNA_ANSWER_UPDATE" : "MENTOR_QNA_ANSWER",
      `멘토 Q&A 답변 ${question.answer ? "수정" : "등록"}: "${question.title}"`,
      { targetType: "MENTOR_QNA", targetId: question.id }
    );
    showToast(question.answer ? "답변이 수정되었습니다." : "답변이 등록되었습니다.");
    setTimeout(() => window.location.reload(), 1500);
  };

  const handleTogglePublic = () => {
    if (!question) return;
    const updated = upsertQuestion({
      ...question,
      isPublic: !question.isPublic,
    });
    showToast(updated.isPublic ? "공개로 전환되었습니다." : "비공개로 전환되었습니다.");
    setTimeout(() => window.location.reload(), 1500);
  };

  const handleClose = () => {
    if (!question) return;
    closeQuestion(question.id);
    recordLog("MENTOR_QNA_CLOSE", `멘토 Q&A 질문 종료: "${question.title}"`, {
      targetType: "MENTOR_QNA",
      targetId: question.id,
    });
    showToast("질문이 종료되었습니다.");
    setShowCloseModal(false);
    setTimeout(() => window.location.reload(), 1500);
  };

  const handleSaveMemo = () => {
    if (!question) return;
    upsertQuestion({ ...question, adminMemo });
    showToast("관리자 메모가 저장되었습니다.");
  };

  /* ---------- not found ---------- */

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-32">
        <p className="text-muted-foreground">질문을 찾을 수 없습니다.</p>
        <Button variant="outline" onClick={() => router.push("/mentor-qna")}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          목록으로
        </Button>
      </div>
    );
  }

  if (!question) {
    return null; // loading
  }

  const statusInfo = STATUS_MAP[question.status] ?? STATUS_MAP.WAITING;
  const isAnswered = !!question.answer;
  const responseTime =
    isAnswered && question.answeredAt
      ? calcResponseTime(question.createdAt, question.answeredAt)
      : null;
  const answerWasUpdated =
    isAnswered &&
    question.answeredAt &&
    question.updatedAt &&
    question.answeredAt !== question.updatedAt &&
    new Date(question.updatedAt).getTime() > new Date(question.answeredAt).getTime();

  return (
    <div className="space-y-6">
      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/mentor-qna" className="hover:text-foreground transition-colors">
          멘토 Q&amp;A
        </Link>
        <RiArrowRightSLine className="h-4 w-4" />
        <span className="truncate max-w-[300px] text-foreground font-medium">
          {question.title}
        </span>
      </nav>

      {/* ── Report Warning Banner ── */}
      {question.reportCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <RiAlertLine className="h-5 w-5 shrink-0" />
          <span className="font-medium">
            이 질문은 {question.reportCount}건의 신고가 접수되었습니다
          </span>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-lg"
          onClick={() => router.push("/mentor-qna")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-slate-900">{question.title}</h1>
        <Badge variant={statusInfo.variant}>
          <span className="flex items-center gap-1">
            {statusInfo.icon}
            {statusInfo.label}
          </span>
        </Badge>
        <Badge variant={question.isPublic ? "default" : "outline"}>
          {question.isPublic ? (
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" /> 공개
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <EyeOff className="h-3 w-3" /> 비공개
            </span>
          )}
        </Badge>
      </div>

      {/* ── Metadata Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* 질문자 정보 */}
        <div className="rounded-xl border bg-white shadow-sm p-5 space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <RiUserLine className="h-4 w-4" />
            질문자 정보
          </h3>
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{question.askerNickname}</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span>{question.askerCompany}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>ID: {question.askerId}</span>
            </div>
          </div>
        </div>

        {/* 대상 멘토 */}
        <div className="rounded-xl border bg-white shadow-sm p-5 space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <RiGroupLine className="h-4 w-4" />
            대상 멘토
          </h3>
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium">{question.mentorName}</span>
              <Badge variant="purple">{question.mentorCategory}</Badge>
            </div>
            <Link
              href={`/mentors/${question.mentorId}`}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              멘토 상세 보기
              <RiArrowRightSLine className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Body grid ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: question + answer (col-span-2) */}
        <div className="space-y-6 lg:col-span-2">
          {/* ── 질문 카드 ── */}
          <div className="rounded-xl border bg-white shadow-sm p-6 space-y-4">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {question.askerNickname}
              </span>
              <span className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                {question.askerCompany}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDateTime(question.createdAt)}
              </span>
            </div>

            <hr />

            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {question.content}
            </div>
          </div>

          {/* ── 답변 카드 ── */}
          <div className="rounded-xl border bg-white shadow-sm p-6 space-y-4">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <RiQuestionAnswerLine className="h-5 w-5 text-primary" />
              답변
            </h2>

            {isAnswered && question.status !== "WAITING" && (
              <div className="space-y-3">
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {question.answer}
                  </p>
                </div>

                {/* Answer history section */}
                <div className="space-y-1 text-xs text-muted-foreground">
                  {question.answeredAt && (
                    <p>
                      {answerWasUpdated ? "최초 답변" : "답변일"}:{" "}
                      {formatDateTime(question.answeredAt)}
                    </p>
                  )}
                  {answerWasUpdated && (
                    <p>마지막 수정: {formatDateTime(question.updatedAt)}</p>
                  )}
                </div>

                {/* Response time */}
                {responseTime && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <RiTimeLine className="h-3.5 w-3.5" />
                    <span>응답 소요 시간: {responseTime}</span>
                  </div>
                )}
              </div>
            )}

            {question.status !== "CLOSED" && (
              <div className="space-y-3 pt-2">
                <Label htmlFor="answer-input">
                  {isAnswered ? "답변 수정" : "답변 작성"}
                </Label>
                <div className="space-y-1">
                  <Textarea
                    id="answer-input"
                    className="min-h-[240px]"
                    rows={6}
                    placeholder="답변 내용을 입력하세요..."
                    value={answerText}
                    maxLength={ANSWER_MAX_LENGTH}
                    onChange={(e) => setAnswerText(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <span
                      className={cn(
                        "text-xs",
                        answerText.length >= ANSWER_MAX_LENGTH
                          ? "text-red-500 font-medium"
                          : "text-muted-foreground"
                      )}
                    >
                      {answerText.length.toLocaleString()} / {ANSWER_MAX_LENGTH.toLocaleString()}자
                    </span>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSubmitAnswer} disabled={!answerText.trim()}>
                    <Send className="mr-1.5 h-4 w-4" />
                    {isAnswered ? "답변 수정" : "답변 등록"}
                  </Button>
                </div>
              </div>
            )}

            {question.status === "CLOSED" && !isAnswered && (
              <p className="text-sm text-muted-foreground">
                종료된 질문이며 답변이 등록되지 않았습니다.
              </p>
            )}
          </div>
        </div>

        {/* Right: management card (col-span-1) */}
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-xl border bg-white shadow-sm p-6 space-y-5">
            <h2 className="text-base font-semibold">관리</h2>

            {/* 상태 */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">상태</p>
              <Badge variant={statusInfo.variant}>
                <span className="flex items-center gap-1">
                  {statusInfo.icon}
                  {statusInfo.label}
                </span>
              </Badge>
            </div>

            {/* 공개 여부 */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                공개 여부
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={handleTogglePublic}
              >
                {question.isPublic ? (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    공개 &rarr; 비공개로 전환
                  </>
                ) : (
                  <>
                    <EyeOff className="mr-2 h-4 w-4" />
                    비공개 &rarr; 공개로 전환
                  </>
                )}
              </Button>
            </div>

            {/* 질문 종료 */}
            {(question.status === "WAITING" || question.status === "ANSWERED") && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  질문 종료
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => setShowCloseModal(true)}
                >
                  <Lock className="mr-1.5 h-4 w-4" />
                  질문 종료
                </Button>
              </div>
            )}

            <hr />

            {/* 관리자 메모 */}
            <div className="space-y-2">
              <Label htmlFor="admin-memo" className="text-xs font-medium text-muted-foreground">
                관리자 메모
              </Label>
              <Textarea
                id="admin-memo"
                className="min-h-[100px] text-sm"
                placeholder="관리자 메모를 입력하세요..."
                value={adminMemo}
                onChange={(e) => setAdminMemo(e.target.value)}
              />
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleSaveMemo}
              >
                메모 저장
              </Button>
            </div>

            <hr />

            {/* 신고 횟수 */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                신고 횟수
              </p>
              <p
                className={cn(
                  "text-lg font-semibold",
                  question.reportCount > 0 ? "text-red-600" : "text-muted-foreground"
                )}
              >
                {question.reportCount}건
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Close Question Modal ── */}
      {showCloseModal && (
        <CloseModal
          onConfirm={handleClose}
          onClose={() => setShowCloseModal(false)}
        />
      )}
    </div>
  );
}
