"use client";

import { useState, useMemo, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Mail,
  MessageCircle,
  Send,
  Calendar,
  ChevronRight,
  ChevronDown,
  Save,
  Eye,
  X,
} from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TiptapLink from "@tiptap/extension-link";
import TiptapImage from "@tiptap/extension-image";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import {
  RiBold, RiItalic, RiStrikethrough, RiCodeLine, RiCodeBoxLine,
  RiListUnordered, RiListOrdered, RiDoubleQuotesL, RiSeparator,
  RiLinksLine, RiImageAddLine, RiH2, RiH3,
  RiDeleteBinLine, RiFileTextLine,
} from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  upsertCampaign,
  computeTargetCount,
  getTargetUsers,
  getCampaign,
  getAllCampaigns,
  deleteCampaign,
  type StoredCampaign,
  type CampaignTargetFilter,
} from "@/lib/campaign-store";
import { getSession } from "@/lib/auth-store";
import { COMPANY_TYPES, JOB_CATEGORIES } from "@/data/mock-users";
import { useToast } from "@/lib/toast-context";
import { recordLog } from "@/lib/audit-log-store";
import type { AuthStatus } from "@/types/user";
import type { CampaignChannel } from "@/data/mock-data";

// ─── Types ────────────────────────────────────────────────────────────────────

type FormData = {
  title: string;
  channel: CampaignChannel;
  description: string;
  targetFilter: CampaignTargetFilter;
  message: StoredCampaign["message"];
  sendType: "IMMEDIATE" | "SCHEDULED";
  scheduledDate: string;
  scheduledTime: string;
};

const INITIAL_FORM: FormData = {
  title: "",
  channel: "EMAIL",
  description: "",
  targetFilter: { companyTypes: [], jobCategories: [], authStatus: "", hasBadge: null },
  message: { senderName: "DidimZip 운영팀", subject: "", body: "" },
  sendType: "IMMEDIATE",
  scheduledDate: "",
  scheduledTime: "09:00",
};

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  { num: 1, label: "기본 정보" },
  { num: 2, label: "타겟 설정" },
  { num: 3, label: "메시지 작성" },
  { num: 4, label: "발송 설정" },
] as const;

const CHANNEL_OPTIONS: {
  value: CampaignChannel;
  label: string;
  icon: typeof Mail;
  desc: string;
}[] = [
  { value: "EMAIL", label: "이메일", icon: Mail, desc: "HTML/텍스트 뉴스레터" },
  { value: "ALIMTALK", label: "알림톡", icon: MessageCircle, desc: "카카오 알림톡" },
  { value: "PUSH", label: "푸시", icon: Send, desc: "앱 푸시 알림" },
];

const AUTH_STATUS_OPTIONS: { value: AuthStatus | ""; label: string }[] = [
  { value: "", label: "전체" },
  { value: "NONE", label: "미인증" },
  { value: "PENDING", label: "심사중" },
  { value: "VERIFIED", label: "인증완료" },
];

const BADGE_OPTIONS: { value: boolean | null; label: string }[] = [
  { value: null, label: "전체" },
  { value: true, label: "뱃지 있음" },
  { value: false, label: "뱃지 없음" },
];

// ─── Validation ───────────────────────────────────────────────────────────────

function validateStep(step: number, form: FormData): Record<string, string> {
  const errors: Record<string, string> = {};
  if (step === 1) {
    if (!form.title.trim()) errors.title = "마케팅명을 입력해주세요.";
  }
  if (step === 3) {
    if (form.channel === "EMAIL") {
      if (!form.message.subject.trim()) errors.subject = "이메일 제목을 입력해주세요.";
      if (!form.message.body.trim()) errors.body = "이메일 본문을 입력해주세요.";
    } else if (form.channel === "ALIMTALK") {
      if (!form.message.body.trim()) errors.body = "알림톡 내용을 입력해주세요.";
      if (form.message.body.length > 1000) errors.body = "1000자 이내로 작성해주세요.";
    } else if (form.channel === "PUSH") {
      if (!form.message.subject.trim()) errors.subject = "알림 제목을 입력해주세요.";
      if (form.message.subject.length > 50) errors.subject = "제목은 50자 이내여야 합니다.";
      if (!form.message.body.trim()) errors.body = "알림 내용을 입력해주세요.";
      if (form.message.body.length > 200) errors.body = "내용은 200자 이내여야 합니다.";
    }
  }
  if (step === 4 && form.sendType === "SCHEDULED") {
    if (!form.scheduledDate) {
      errors.scheduledDate = "발송 날짜를 선택해주세요.";
    } else {
      const dt = new Date(`${form.scheduledDate}T${form.scheduledTime || "09:00"}`);
      if (dt <= new Date()) errors.scheduledDate = "예약 시간은 현재 시간 이후여야 합니다.";
    }
  }
  return errors;
}

// ─── Email Rich Editor ────────────────────────────────────────────────────────

function ToolbarBtn({
  onClick, active, title, children,
}: {
  onClick: () => void; active?: boolean; title: string; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded text-slate-600 transition-colors hover:bg-slate-100",
        active && "bg-slate-200 text-slate-900"
      )}
    >
      {children}
    </button>
  );
}

function EmailEditorToolbar({ editor }: { editor: ReturnType<typeof useEditor> | null }) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  if (!editor) return null;

  const addLink = () => {
    const url = window.prompt("링크 URL을 입력하세요");
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  const addImage = () => imageInputRef.current?.click();

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      editor.chain().focus().setImage({ src: reader.result as string }).run();
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 rounded-t-lg border-b border-slate-200 bg-slate-50 px-2 py-1.5">
      <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="제목 2"><RiH2 className="h-4 w-4" /></ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="제목 3"><RiH3 className="h-4 w-4" /></ToolbarBtn>
      <div className="mx-1 h-4 w-px bg-slate-300" />
      <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="굵게"><RiBold className="h-4 w-4" /></ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="기울임"><RiItalic className="h-4 w-4" /></ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="취소선"><RiStrikethrough className="h-4 w-4" /></ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="인라인 코드"><RiCodeLine className="h-4 w-4" /></ToolbarBtn>
      <div className="mx-1 h-4 w-px bg-slate-300" />
      <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="글머리기호 목록"><RiListUnordered className="h-4 w-4" /></ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="번호 목록"><RiListOrdered className="h-4 w-4" /></ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="인용구"><RiDoubleQuotesL className="h-4 w-4" /></ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="코드 블록"><RiCodeBoxLine className="h-4 w-4" /></ToolbarBtn>
      <div className="mx-1 h-4 w-px bg-slate-300" />
      <ToolbarBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="구분선"><RiSeparator className="h-4 w-4" /></ToolbarBtn>
      <ToolbarBtn onClick={addLink} active={editor.isActive("link")} title="링크 삽입"><RiLinksLine className="h-4 w-4" /></ToolbarBtn>
      <ToolbarBtn onClick={addImage} title="이미지 삽입"><RiImageAddLine className="h-4 w-4" /></ToolbarBtn>
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageFile} />
      <div className="mx-1 h-4 w-px bg-slate-300" />
      {/* 텍스트 색상 */}
      <label title="텍스트 색상" className="relative flex h-7 w-7 cursor-pointer items-center justify-center rounded hover:bg-slate-200">
        <span className="text-xs font-bold leading-none" style={{ color: editor.getAttributes("textStyle").color ?? "#334155" }}>A</span>
        <span
          className="absolute bottom-1 left-1/2 h-1 w-4 -translate-x-1/2 rounded-sm"
          style={{ background: editor.getAttributes("textStyle").color ?? "#334155" }}
        />
        <input
          type="color"
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          value={editor.getAttributes("textStyle").color ?? "#334155"}
          onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
        />
      </label>
      <ToolbarBtn onClick={() => editor.chain().focus().unsetColor().run()} title="색상 초기화">
        <span className="text-xs font-bold line-through text-slate-400">A</span>
      </ToolbarBtn>
    </div>
  );
}

function EmailBodyEditor({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (html: string) => void;
  error?: string;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "이메일 본문 내용을 작성해주세요." }),
      TiptapLink.configure({ openOnClick: false }),
      TiptapImage.configure({ allowBase64: true }),
      TextStyle,
      Color,
    ],
    content: value || "",
    editorProps: {
      handlePaste(view, event) {
        const imageItem = Array.from(event.clipboardData?.items ?? []).find((item) =>
          item.type.startsWith("image/")
        );
        if (!imageItem) return false;
        event.preventDefault();
        const file = imageItem.getAsFile();
        if (!file) return false;
        const reader = new FileReader();
        reader.onloadend = () => {
          const node = view.state.schema.nodes.image.create({ src: reader.result as string });
          view.dispatch(view.state.tr.replaceSelectionWith(node));
        };
        reader.readAsDataURL(file);
        return true;
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // 외부에서 value가 "" 로 리셋될 때 에디터도 클리어 (임시저장 후 신규 등)
  useEffect(() => {
    if (!value && editor && !editor.isDestroyed) {
      const isEmpty = editor.isEmpty;
      if (!isEmpty) editor.commands.clearContent();
    }
  }, [value, editor]);

  return (
    <div className={cn("overflow-hidden rounded-lg border", error ? "border-red-400" : "border-slate-200 focus-within:border-indigo-400")}>
      <EmailEditorToolbar editor={editor} />
      <EditorContent
        editor={editor}
        className="min-h-[280px] px-4 py-3 text-sm"
      />
    </div>
  );
}

// ─── StepIndicator ────────────────────────────────────────────────────────────

function StepIndicator({ current, onStepClick }: { current: number; onStepClick?: (step: number) => void }) {
  return (
    <div className="flex items-center justify-center py-1">
      {STEPS.map((step, i) => (
        <div key={step.num} className="flex items-center">
          <div className="flex flex-col items-center gap-1.5">
            <button
              type="button"
              onClick={() => onStepClick?.(step.num)}
              disabled={!onStepClick}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                current === step.num
                  ? "bg-indigo-600 text-white"
                  : current > step.num
                  ? "cursor-pointer bg-indigo-100 text-indigo-600 hover:bg-indigo-200"
                  : "cursor-pointer bg-slate-100 text-slate-400 hover:bg-slate-200"
              )}
            >
              {current > step.num ? <Check className="h-4 w-4" /> : step.num}
            </button>
            <span
              className={cn(
                "text-xs font-medium",
                current >= step.num ? "text-slate-700" : "text-slate-400"
              )}
            >
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={cn(
                "mb-5 mx-3 h-0.5 w-14",
                current > step.num ? "bg-indigo-300" : "bg-slate-200"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── SectionCard ──────────────────────────────────────────────────────────────

function SectionCard({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white p-5 shadow-sm", className)}>
      {title && <h3 className="mb-4 text-sm font-semibold text-slate-800">{title}</h3>}
      {children}
    </div>
  );
}

// ─── Message Previews ─────────────────────────────────────────────────────────

function EmailPreview({
  senderName,
  senderEmail,
  subject,
  body,
  recipients,
}: {
  senderName: string;
  senderEmail?: string;
  subject: string;
  body: string;
  recipients?: Array<{ nickname: string; email: string }>;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [showAllRecipients, setShowAllRecipients] = useState(false);
  const isEmpty = !body || body === "<p></p>" || body.trim() === "";
  const initials = senderName ? senderName.charAt(0).toUpperCase() : "D";
  const timeStr = new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });

  const recipientSummary = recipients?.length
    ? recipients.slice(0, 2).map((r) => r.nickname).join(", ") +
      (recipients.length > 2 ? ` 외 ${recipients.length - 2}명` : "")
    : null;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      {/* 발신자 정보 */}
      <div className="flex items-start justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
            {initials}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{senderName || "DidimZip 운영팀"}</p>
            <p className="text-xs text-slate-400">{senderEmail || "marketing@didimzip.com"}</p>
            {recipientSummary && (
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="mt-0.5 flex items-center gap-0.5 text-xs text-slate-500 hover:text-slate-700"
              >
                {recipientSummary}에게
                <ChevronDown
                  className={cn("h-3 w-3 transition-transform", showDetails && "rotate-180")}
                />
              </button>
            )}
          </div>
        </div>
        <p className="shrink-0 text-xs text-slate-400">{timeStr}</p>
      </div>

      {/* 수신자 상세 펼침 */}
      {showDetails && recipients && recipients.length > 0 && (
        <div className="mx-5 mb-3 overflow-hidden rounded-lg border border-slate-200 shadow-sm">
          <table className="w-full text-xs">
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="w-24 px-3 py-2 text-right font-medium text-slate-500">보낸사람</td>
                <td className="px-3 py-2 text-slate-800">
                  {senderName || "DidimZip 운영팀"} &lt;{senderEmail || "marketing@didimzip.com"}&gt;
                </td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="px-3 py-2 text-right align-top font-medium text-slate-500">받는 사람</td>
                <td className="px-3 py-2 text-slate-800">
                  {showAllRecipients ? (
                    <div className="leading-relaxed">
                      {recipients.map((r) => r.email).join(", ")}
                      <button
                        type="button"
                        onClick={() => setShowAllRecipients(false)}
                        className="ml-2 text-indigo-500 hover:text-indigo-700"
                      >
                        접기
                      </button>
                    </div>
                  ) : (
                    <div>
                      {recipients.slice(0, 3).map((r) => r.email).join(", ")}
                      {recipients.length > 3 && (
                        <button
                          type="button"
                          onClick={() => setShowAllRecipients(true)}
                          className="ml-1 text-indigo-500 hover:text-indigo-700"
                        >
                          +{recipients.length - 3}명 더
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="px-3 py-2 text-right font-medium text-slate-500">날짜</td>
                <td className="px-3 py-2 text-slate-800">{new Date().toLocaleString("ko-KR")}</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="px-3 py-2 text-right font-medium text-slate-500">제목</td>
                <td className="px-3 py-2 text-slate-800">{subject || "(이메일 제목)"}</td>
              </tr>
              <tr>
                <td className="px-3 py-2 text-right font-medium text-slate-500">발송 도메인</td>
                <td className="px-3 py-2 text-slate-800">didimzip.com</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* 제목 */}
      <div className="border-t border-slate-100 px-5 py-4">
        <h2 className="text-xl font-bold text-slate-900">{subject || "(이메일 제목)"}</h2>
      </div>

      {/* 본문 */}
      <div className="border-t border-slate-100 px-5 py-4">
        {isEmpty ? (
          <p className="text-sm text-slate-300">이메일 본문이 여기에 표시됩니다.</p>
        ) : (
          <div className="ProseMirror text-sm" dangerouslySetInnerHTML={{ __html: body }} />
        )}
      </div>
    </div>
  );
}

function AlimtalkPreview({ body }: { body: string }) {
  return (
    <div className="mx-auto w-48">
      <div className="overflow-hidden rounded-3xl border-4 border-slate-700 bg-slate-800 shadow-xl">
        <div className="bg-slate-100 p-2">
          <div className="mb-1.5 flex justify-between px-1 text-[8px] text-slate-400">
            <span>9:41</span>
            <span>●●●</span>
          </div>
          <div className="rounded-xl bg-[#FEE500] px-2 py-1">
            <p className="text-[9px] font-bold text-slate-800">카카오 알림톡</p>
          </div>
          <div className="mt-1.5 rounded-xl bg-white p-2.5 shadow-sm">
            <p className="mb-1 text-[9px] font-semibold text-slate-700">DidimZip</p>
            <p className="whitespace-pre-wrap text-[9px] leading-relaxed text-slate-600">
              {body || "(알림톡 내용이 여기에\n표시됩니다)"}
            </p>
          </div>
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-slate-400">카카오 알림톡 미리보기</p>
    </div>
  );
}

function PushPreview({ subject, body }: { subject: string; body: string }) {
  return (
    <div className="mx-auto w-48">
      <div className="overflow-hidden rounded-3xl border-4 border-slate-700 bg-slate-800 shadow-xl">
        <div className="bg-slate-100 p-2">
          <div className="mb-1.5 flex justify-between px-1 text-[8px] text-slate-400">
            <span>9:41</span>
            <span>●●●</span>
          </div>
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <div className="flex items-start gap-2 p-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600">
                <span className="text-[10px] font-bold text-white">D</span>
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-semibold leading-tight text-slate-800">
                  {subject || "(푸시 제목)"}
                </p>
                <p className="mt-0.5 whitespace-pre-wrap text-[9px] leading-relaxed text-slate-500">
                  {body || "(푸시 내용)"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-slate-400">앱 푸시 알림 미리보기</p>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function CampaignSidebar({
  step,
  form,
  targetCount,
}: {
  step: number;
  form: FormData;
  targetCount: number;
}) {
  const channelOption = CHANNEL_OPTIONS.find((c) => c.value === form.channel);
  const ChIcon = channelOption?.icon ?? Mail;

  // 발송 요약 + 타겟 수
  const filterParts: string[] = [];
  if (form.targetFilter.companyTypes.length > 0) filterParts.push(...form.targetFilter.companyTypes);
  if (form.targetFilter.jobCategories.length > 0) filterParts.push(...form.targetFilter.jobCategories);
  if (form.targetFilter.authStatus) {
    filterParts.push(AUTH_STATUS_OPTIONS.find((o) => o.value === form.targetFilter.authStatus)?.label ?? "");
  }
  if (form.targetFilter.hasBadge === true) filterParts.push("뱃지 있음");
  if (form.targetFilter.hasBadge === false) filterParts.push("뱃지 없음");

  return (
    <div className="space-y-4">
      <SectionCard title="발송 요약">
        <div className="mb-3 flex items-center gap-2 text-sm text-slate-600">
          <ChIcon className="h-4 w-4 text-slate-400" />
          <span>{channelOption?.label ?? "—"}</span>
        </div>
        <div
          className={cn(
            "rounded-lg border p-3",
            targetCount === 0 ? "border-amber-200 bg-amber-50" : "border-indigo-100 bg-indigo-50"
          )}
        >
          <p
            className={cn(
              "mb-0.5 text-xs font-medium",
              targetCount === 0 ? "text-amber-600" : "text-indigo-600"
            )}
          >
            예상 수신자
          </p>
          <p
            className={cn(
              "text-2xl font-bold",
              targetCount === 0 ? "text-amber-700" : "text-indigo-700"
            )}
          >
            {targetCount}명
          </p>
          {filterParts.length === 0 && (
            <p className="mt-0.5 text-xs text-slate-400">전체 활성 회원 대상</p>
          )}
        </div>
        {filterParts.length > 0 && (
          <div className="mt-3">
            <p className="mb-1.5 text-xs font-medium text-slate-500">적용된 필터</p>
            <div className="flex flex-wrap gap-1">
              {filterParts.map((p) => (
                <span key={p} className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700">
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}
      </SectionCard>

      {form.title && (
        <SectionCard>
          <p className="mb-1 text-xs font-medium text-slate-400">마케팅명</p>
          <p className="text-sm font-medium text-slate-800">{form.title}</p>
        </SectionCard>
      )}
    </div>
  );
}

// ─── Step 1: 기본 정보 ────────────────────────────────────────────────────────

function Step1BasicInfo({
  form,
  errors,
  onChange,
}: {
  form: FormData;
  errors: Record<string, string>;
  onChange: (patch: Partial<FormData>) => void;
}) {
  return (
    <SectionCard title="기본 정보">
      <div className="mb-5">
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          마케팅명 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="예: 3월 네트워킹 데이 초대"
          className={cn(
            "h-9 w-full rounded-lg border bg-white px-3 text-sm focus:outline-none focus:border-indigo-400",
            errors.title ? "border-red-400" : "border-slate-200"
          )}
        />
        {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
      </div>

      <div className="mb-5">
        <label className="mb-2 block text-sm font-medium text-slate-700">
          발송 채널 <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-3 gap-3">
          {CHANNEL_OPTIONS.map((ch) => {
            const Icon = ch.icon;
            return (
              <button
                key={ch.value}
                type="button"
                onClick={() => onChange({ channel: ch.value })}
                className={cn(
                  "flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
                  form.channel === ch.value
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-slate-200 bg-white hover:border-indigo-200"
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    form.channel === ch.value ? "bg-indigo-100" : "bg-slate-100"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5",
                      form.channel === ch.value ? "text-indigo-600" : "text-slate-400"
                    )}
                  />
                </div>
                <div className="text-center">
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      form.channel === ch.value ? "text-indigo-700" : "text-slate-700"
                    )}
                  >
                    {ch.label}
                  </p>
                  <p className="text-xs text-slate-400">{ch.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          설명{" "}
          <span className="ml-1 text-xs font-normal text-slate-400">(선택)</span>
        </label>
        <textarea
          value={form.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="이 마케팅의 목적이나 참고 사항을 입력하세요."
          rows={3}
          className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
        />
      </div>
    </SectionCard>
  );
}

// ─── Step 2: 타겟 설정 ────────────────────────────────────────────────────────

function Step2Target({
  form,
  onChange,
}: {
  form: FormData;
  onChange: (patch: Partial<FormData>) => void;
}) {
  const updateFilter = (patch: Partial<CampaignTargetFilter>) =>
    onChange({ targetFilter: { ...form.targetFilter, ...patch } });

  const toggleCompanyType = (type: string) => {
    const next = form.targetFilter.companyTypes.includes(type)
      ? form.targetFilter.companyTypes.filter((t) => t !== type)
      : [...form.targetFilter.companyTypes, type];
    updateFilter({ companyTypes: next });
  };

  const toggleJobCategory = (cat: string) => {
    const next = form.targetFilter.jobCategories.includes(cat)
      ? form.targetFilter.jobCategories.filter((c) => c !== cat)
      : [...form.targetFilter.jobCategories, cat];
    updateFilter({ jobCategories: next });
  };

  return (
    <div className="space-y-4">
      <SectionCard title="회원 유형">
        <p className="mb-3 text-xs text-slate-400">여러 개 선택 가능. 선택하지 않으면 전체 대상입니다.</p>
        <div className="flex flex-wrap gap-2">
          {COMPANY_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => toggleCompanyType(type)}
              className={cn(
                "cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                form.targetFilter.companyTypes.includes(type)
                  ? "border-indigo-500 bg-indigo-100 text-indigo-700"
                  : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300"
              )}
            >
              {type}
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="직무 카테고리">
        <p className="mb-3 text-xs text-slate-400">여러 개 선택 가능. 선택하지 않으면 전체 대상입니다.</p>
        <div className="flex flex-wrap gap-2">
          {JOB_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => toggleJobCategory(cat)}
              className={cn(
                "cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                form.targetFilter.jobCategories.includes(cat)
                  ? "border-indigo-500 bg-indigo-100 text-indigo-700"
                  : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="인증 상태">
        <div className="flex flex-wrap gap-2">
          {AUTH_STATUS_OPTIONS.map((opt) => (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => updateFilter({ authStatus: opt.value })}
              className={cn(
                "cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                form.targetFilter.authStatus === opt.value
                  ? "border-indigo-500 bg-indigo-100 text-indigo-700"
                  : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="인증 뱃지">
        <div className="flex flex-wrap gap-2">
          {BADGE_OPTIONS.map((opt) => (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => updateFilter({ hasBadge: opt.value })}
              className={cn(
                "cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                form.targetFilter.hasBadge === opt.value
                  ? "border-indigo-500 bg-indigo-100 text-indigo-700"
                  : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Step 3: 메시지 작성 ──────────────────────────────────────────────────────

function Step3Message({
  form,
  errors,
  onChange,
}: {
  form: FormData;
  errors: Record<string, string>;
  onChange: (patch: Partial<FormData>) => void;
}) {
  const updateMsg = (patch: Partial<StoredCampaign["message"]>) =>
    onChange({ message: { ...form.message, ...patch } });

  return (
    <div className="space-y-4">
      {form.channel === "EMAIL" && (
        <SectionCard title="이메일 작성">
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">발신자명</label>
            <input
              type="text"
              value={form.message.senderName}
              onChange={(e) => updateMsg({ senderName: e.target.value })}
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-indigo-400 focus:outline-none"
            />
          </div>
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              이메일 제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.message.subject}
              onChange={(e) => updateMsg({ subject: e.target.value })}
              placeholder="예: [DidimZip] 3월 네트워킹 데이에 초대합니다"
              className={cn(
                "h-9 w-full rounded-lg border bg-white px-3 text-sm focus:border-indigo-400 focus:outline-none",
                errors.subject ? "border-red-400" : "border-slate-200"
              )}
            />
            {errors.subject && <p className="mt-1 text-xs text-red-500">{errors.subject}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              이메일 본문 <span className="text-red-500">*</span>
            </label>
            <EmailBodyEditor
              value={form.message.body}
              onChange={(html) => updateMsg({ body: html })}
              error={errors.body}
            />
            {errors.body && <p className="mt-1 text-xs text-red-500">{errors.body}</p>}
          </div>
        </SectionCard>
      )}

      {form.channel === "ALIMTALK" && (
        <SectionCard title="알림톡 작성">
          <div className="mb-3 rounded-lg border border-amber-100 bg-amber-50 p-3 text-xs text-amber-700">
            <strong>안내:</strong> 카카오 알림톡은 사전 심사된 템플릿만 발송 가능합니다.
            실제 발송 시 카카오 비즈니스 채널 등록 및 템플릿 심사가 필요합니다.
          </div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            알림톡 내용 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={form.message.body}
            onChange={(e) => updateMsg({ body: e.target.value })}
            placeholder="알림톡 내용을 작성해주세요. (최대 1000자)"
            rows={10}
            maxLength={1000}
            className={cn(
              "w-full resize-none rounded-lg border bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none",
              errors.body ? "border-red-400" : "border-slate-200"
            )}
          />
          <div className="mt-1 flex items-center justify-between">
            {errors.body ? <p className="text-xs text-red-500">{errors.body}</p> : <span />}
            <span
              className={cn(
                "text-xs",
                form.message.body.length > 900 ? "text-amber-500" : "text-slate-400"
              )}
            >
              {form.message.body.length} / 1000
            </span>
          </div>
        </SectionCard>
      )}

      {form.channel === "PUSH" && (
        <SectionCard title="푸시 알림 작성">
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              알림 제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.message.subject}
              onChange={(e) => updateMsg({ subject: e.target.value })}
              placeholder="예: 3월 네트워킹 데이 초대"
              maxLength={50}
              className={cn(
                "h-9 w-full rounded-lg border bg-white px-3 text-sm focus:border-indigo-400 focus:outline-none",
                errors.subject ? "border-red-400" : "border-slate-200"
              )}
            />
            <div className="mt-1 flex items-center justify-between">
              {errors.subject ? <p className="text-xs text-red-500">{errors.subject}</p> : <span />}
              <span
                className={cn(
                  "text-xs",
                  form.message.subject.length > 40 ? "text-amber-500" : "text-slate-400"
                )}
              >
                {form.message.subject.length} / 50
              </span>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              알림 내용 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.message.body}
              onChange={(e) => updateMsg({ body: e.target.value })}
              placeholder="푸시 알림 내용을 입력해주세요."
              rows={5}
              maxLength={200}
              className={cn(
                "w-full resize-none rounded-lg border bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none",
                errors.body ? "border-red-400" : "border-slate-200"
              )}
            />
            <div className="mt-1 flex items-center justify-between">
              {errors.body ? <p className="text-xs text-red-500">{errors.body}</p> : <span />}
              <span
                className={cn(
                  "text-xs",
                  form.message.body.length > 160 ? "text-amber-500" : "text-slate-400"
                )}
              >
                {form.message.body.length} / 200
              </span>
            </div>
          </div>
        </SectionCard>
      )}
    </div>
  );
}

// ─── Step 4: 발송 설정 ────────────────────────────────────────────────────────

function Step4Send({
  form,
  errors,
  onChange,
  targetCount,
}: {
  form: FormData;
  errors: Record<string, string>;
  onChange: (patch: Partial<FormData>) => void;
  targetCount: number;
}) {
  const channelLabel = CHANNEL_OPTIONS.find((c) => c.value === form.channel)?.label ?? "";
  const todayStr = new Date().toISOString().split("T")[0];
  const scheduledDt =
    form.scheduledDate && form.scheduledTime
      ? new Date(`${form.scheduledDate}T${form.scheduledTime}`)
      : null;

  return (
    <div className="space-y-4">
      <SectionCard title="발송 방식">
        <div className="grid grid-cols-2 gap-3">
          {(["IMMEDIATE", "SCHEDULED"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onChange({ sendType: type })}
              className={cn(
                "flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 p-4 transition-all",
                form.sendType === type
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-slate-200 bg-white hover:border-indigo-200"
              )}
            >
              {type === "IMMEDIATE" ? (
                <Send
                  className={cn(
                    "h-6 w-6",
                    form.sendType === type ? "text-indigo-600" : "text-slate-400"
                  )}
                />
              ) : (
                <Calendar
                  className={cn(
                    "h-6 w-6",
                    form.sendType === type ? "text-indigo-600" : "text-slate-400"
                  )}
                />
              )}
              <span
                className={cn(
                  "text-sm font-semibold",
                  form.sendType === type ? "text-indigo-700" : "text-slate-700"
                )}
              >
                {type === "IMMEDIATE" ? "즉시 발송" : "예약 발송"}
              </span>
              <span className="text-xs text-slate-400">
                {type === "IMMEDIATE" ? "확정 즉시 발송" : "날짜/시간 지정 발송"}
              </span>
            </button>
          ))}
        </div>

        {form.sendType === "SCHEDULED" && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">발송 날짜</label>
              <input
                type="date"
                min={todayStr}
                value={form.scheduledDate}
                onChange={(e) => onChange({ scheduledDate: e.target.value })}
                className={cn(
                  "h-9 w-full rounded-lg border bg-white px-3 text-sm focus:border-indigo-400 focus:outline-none",
                  errors.scheduledDate ? "border-red-400" : "border-slate-200"
                )}
              />
              {errors.scheduledDate && (
                <p className="mt-1 text-xs text-red-500">{errors.scheduledDate}</p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">발송 시간</label>
              <input
                type="time"
                value={form.scheduledTime}
                onChange={(e) => onChange({ scheduledTime: e.target.value })}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-indigo-400 focus:outline-none"
              />
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard title="발송 내용 최종 확인">
        <div className="divide-y divide-slate-100">
          {[
            { label: "마케팅명", value: form.title },
            {
              label: "발송 채널",
              value: (
                <Badge variant="secondary" className="text-xs">
                  {channelLabel}
                </Badge>
              ),
            },
            ...(form.channel === "EMAIL"
              ? [{ label: "이메일 제목", value: form.message.subject || "—" }]
              : []),
            {
              label: "예상 수신자",
              value: (
                <span className="font-bold text-indigo-600">{targetCount}명</span>
              ),
            },
            {
              label: "발송 시점",
              value:
                form.sendType === "IMMEDIATE"
                  ? "즉시 발송"
                  : scheduledDt
                  ? `${scheduledDt.toLocaleDateString("ko-KR")} ${scheduledDt.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}`
                  : "—",
            },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2.5 text-sm">
              <span className="text-slate-400">{label}</span>
              <span className="max-w-[60%] truncate text-right font-medium text-slate-800">
                {value}
              </span>
            </div>
          ))}
        </div>

        {targetCount === 0 && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            수신자가 0명입니다. 타겟 설정 단계로 돌아가 필터를 조정해주세요.
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function buildInitialState(
  editId: string | null,
  copyId: string | null
): { form: FormData; draftId: string | null } {
  const sourceId = editId ?? copyId;
  if (sourceId) {
    const c = getCampaign(sourceId);
    if (c) {
      const scheduledDt = c.scheduledAt ? new Date(c.scheduledAt) : null;
      return {
        form: {
          title: copyId ? `(복사) ${c.title}` : c.title,
          channel: c.channel,
          description: c.description,
          targetFilter: { ...c.targetFilter },
          message: { ...c.message },
          sendType: c.sendType,
          scheduledDate: scheduledDt ? scheduledDt.toISOString().split("T")[0] : "",
          scheduledTime: scheduledDt
            ? `${String(scheduledDt.getHours()).padStart(2, "0")}:${String(scheduledDt.getMinutes()).padStart(2, "0")}`
            : "09:00",
        },
        draftId: editId,
      };
    }
  }
  return { form: INITIAL_FORM, draftId: null };
}

function NewCampaignContent() {
  const router = useRouter();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const copyId = searchParams.get("copy");
  const isEditMode = !!editId;

  const [session] = useState(() => getSession());

  const [step, setStep] = useState(1);
  const [{ form: initForm, draftId: initDraftId }] = useState(() => buildInitialState(editId, copyId));
  const [form, setForm] = useState<FormData>(initForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [draftId, setDraftId] = useState<string | null>(initDraftId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentCampaignId, setSentCampaignId] = useState<string | null>(null);
  const [showDraftList, setShowDraftList] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [myDrafts, setMyDrafts] = useState<StoredCampaign[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [pendingNavTarget, setPendingNavTarget] = useState<string | null>(null);
  const isDirtyRef = useRef(false);
  isDirtyRef.current = isDirty;

  const refreshMyDrafts = () => {
    const adminId = session?.adminId ?? null;
    setMyDrafts(
      getAllCampaigns().filter(
        (c) => c.status === "DRAFT" && (c.createdBy === null || c.createdBy === adminId)
      )
    );
  };

  useEffect(() => {
    refreshMyDrafts();
  }, []);

  const updateForm = (patch: Partial<FormData>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setErrors({});
    setIsDirty(true);
  };

  const targetCount = useMemo(() => computeTargetCount(form.targetFilter), [form.targetFilter]);
  const previewUsers = useMemo(() => getTargetUsers(form.targetFilter), [form.targetFilter]);

  const handleNext = () => {
    const errs = validateStep(step, form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setStep((s) => Math.min(s + 1, 4));
  };

  const handleBack = () => {
    setErrors({});
    setStep((s) => Math.max(s - 1, 1));
  };

  const buildPayload = (status: StoredCampaign["status"]) => {
    const now = new Date().toISOString();
    const scheduledAt =
      form.sendType === "SCHEDULED" && form.scheduledDate
        ? new Date(`${form.scheduledDate}T${form.scheduledTime || "09:00"}`).toISOString()
        : null;
    return {
      id: draftId,
      title: form.title,
      description: form.description,
      channel: form.channel,
      status,
      targetFilter: form.targetFilter,
      targetCount,
      sentCount: status === "SENT" ? targetCount : 0,
      failedCount: 0,
      failedEmails: [],
      openRate: 0,
      message: form.message,
      sendType: form.sendType,
      scheduledAt,
      sentAt: status === "SENT" ? now : null,
      createdBy: session?.adminId ?? null,
    };
  };

  const handleSaveDraft = () => {
    const saved = upsertCampaign(buildPayload("DRAFT"));
    setDraftId(saved.id);
    setIsDirty(false);
    showToast("임시저장되었습니다.", "success");
    refreshMyDrafts();
  };

  function handleLoadDraft(draft: StoredCampaign) {
    const scheduledDt = draft.scheduledAt ? new Date(draft.scheduledAt) : null;
    setForm({
      title: draft.title,
      channel: draft.channel,
      description: draft.description,
      targetFilter: { ...draft.targetFilter },
      message: { ...draft.message },
      sendType: draft.sendType,
      scheduledDate: scheduledDt ? scheduledDt.toISOString().split("T")[0] : "",
      scheduledTime: scheduledDt
        ? `${String(scheduledDt.getHours()).padStart(2, "0")}:${String(scheduledDt.getMinutes()).padStart(2, "0")}`
        : "09:00",
    });
    setDraftId(draft.id);
    setStep(1);
    setErrors({});
    setIsDirty(false);
    setShowDraftList(false);
    showToast("임시저장 항목을 불러왔습니다.", "success");
  }

  function handleDeleteDraft(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    deleteCampaign(id);
    if (draftId === id) setDraftId(null);
    refreshMyDrafts();
  }

  const handleConfirm = async () => {
    const errs = validateStep(4, form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    if (targetCount === 0) {
      showToast("수신자가 없습니다. 타겟 필터를 확인해주세요.", "error");
      return;
    }
    setIsSubmitting(true);

    try {
      if (form.channel === "EMAIL" && form.sendType === "IMMEDIATE") {
        // 이메일 즉시 발송: API Route를 통해 실제 발송
        const recipients = getTargetUsers(form.targetFilter).map((u) => u.email);
        const res = await fetch("/api/campaigns/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipients,
            senderName: form.message.senderName,
            subject: form.message.subject,
            html: form.message.body,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast(data.error ?? "이메일 발송에 실패했습니다.", "error");
          setIsSubmitting(false);
          return;
        }
        const { sent, failed, failedEmails } = data as { sent: number; failed: number; failedEmails: string[] };
        const saved = upsertCampaign({ ...buildPayload("SENT"), sentCount: sent, failedCount: failed, failedEmails: failedEmails ?? [] });
        recordLog("CAMPAIGN_SEND", `마케팅 발송: ${form.title} (성공: ${sent}명${failed > 0 ? `, 실패: ${failed}명` : ""})`, {
          targetType: "campaign",
          targetId: saved.id,
        });
        showToast(`이메일을 ${sent}명에게 발송했습니다.${failed > 0 ? ` (${failed}명 실패)` : ""}`, "success");
        setIsDirty(false);
        setSentCampaignId(saved.id);
      } else {
        // 이메일 외 채널 or 예약 발송: 저장만
        const isSent = form.sendType === "IMMEDIATE";
        const saved = upsertCampaign(buildPayload(isSent ? "SENT" : "SCHEDULED"));
        recordLog("CAMPAIGN_SEND", `마케팅 발송: ${form.title} (대상: ${targetCount}명)`, {
          targetType: "campaign",
          targetId: saved.id,
        });
        showToast(
          isSent ? "마케팅을 발송했습니다." : "마케팅 발송이 예약되었습니다.",
          "success"
        );
        setIsDirty(false);
        setSentCampaignId(saved.id);
      }
    } catch {
      showToast("발송 중 오류가 발생했습니다.", "error");
      setIsSubmitting(false);
    }
  };

  const handleNavigate = (url: string) => {
    if (isDirtyRef.current) {
      setPendingNavTarget(url);
    } else {
      router.push(url);
    }
  };

  // 사이드바 <Link> 등 모든 앵커 클릭을 캡처 단계에서 가로채기
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

  // 브라우저 탭 닫기/새로고침 경고
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  if (sentCampaignId) {
    const sentCampaign = getCampaign(sentCampaignId);
    const isSent = sentCampaign?.status === "SENT";
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${isSent ? "bg-green-100" : "bg-indigo-100"}`}>
            {isSent ? (
              <Check className="h-8 w-8 text-green-600" />
            ) : (
              <Calendar className="h-8 w-8 text-indigo-600" />
            )}
          </div>
          <h2 className="mb-2 text-xl font-bold text-slate-900">
            {isSent ? "발송 완료!" : "발송이 예약되었습니다!"}
          </h2>
          <p className="mb-1 text-sm text-slate-500">
            <span className="font-medium text-slate-700">{sentCampaign?.title}</span>
          </p>
          {isSent && sentCampaign && (
            <p className="mb-6 text-sm text-slate-400">
              {sentCampaign.sentCount}명에게 발송
              {(sentCampaign.failedCount ?? 0) > 0 && (
                <span className="ml-1 text-red-400">({sentCampaign.failedCount}명 실패)</span>
              )}
            </p>
          )}
          {!isSent && sentCampaign?.scheduledAt && (
            <p className="mb-6 text-sm text-slate-400">
              {new Date(sentCampaign.scheduledAt).toLocaleString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })} 발송 예정
            </p>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/campaigns")}
              className="flex-1 rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              목록으로
            </button>
            <button
              onClick={() => router.push(`/campaigns/${sentCampaignId}`)}
              className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
            >
              상세 보기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleNavigate("/campaigns")}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4 text-slate-500" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {isEditMode ? "마케팅 편집" : copyId ? "마케팅 복제" : "새 마케팅"}
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              4단계를 완료하면 마케팅을 발송할 수 있습니다.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { refreshMyDrafts(); setShowDraftList(true); }}
          >
            <RiFileTextLine className="mr-1.5 h-4 w-4" />
            임시저장 목록
            {myDrafts.length > 0 && (
              <span className="ml-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white">
                {myDrafts.length}
              </span>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={handleSaveDraft}>
            <Save className="mr-1.5 h-4 w-4" />
            임시저장
          </Button>
        </div>
      </div>

      {/* 스텝 인디케이터 */}
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
        <StepIndicator current={step} onStepClick={(s) => {
          if (s <= step) {
            // 뒤로 이동은 자유롭게
            setErrors({});
            setStep(s);
          } else {
            // 앞으로 이동: 현재 스텝부터 목표 직전까지 순서대로 검증
            for (let i = step; i < s; i++) {
              const errs = validateStep(i, form);
              if (Object.keys(errs).length > 0) {
                setErrors(errs);
                setStep(i);
                return;
              }
            }
            setErrors({});
            setStep(s);
          }
        }} />
      </div>

      {/* 콘텐츠 + 사이드바 */}
      <div className="flex gap-5">
        <div className="min-w-0 flex-1">
          {step === 1 && (
            <Step1BasicInfo form={form} errors={errors} onChange={updateForm} />
          )}
          {step === 2 && (
            <Step2Target form={form} onChange={updateForm} />
          )}
          {step === 3 && (
            <Step3Message form={form} errors={errors} onChange={updateForm} />
          )}
          {step === 4 && (
            <Step4Send
              form={form}
              errors={errors}
              onChange={updateForm}
              targetCount={targetCount}
            />
          )}
        </div>
        <div className="w-72 shrink-0">
          <CampaignSidebar step={step} form={form} targetCount={targetCount} />
        </div>
      </div>

      {/* 하단 네비게이션 */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-3.5 shadow-sm">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={step === 1}
          className={cn(step === 1 && "invisible")}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          이전
        </Button>
        <div className="flex items-center gap-2">
          {(step === 3 || step === 4) && (
            <Button variant="outline" onClick={() => setShowPreview(true)} className="gap-1.5">
              <Eye className="h-4 w-4" />
              미리보기
            </Button>
          )}
          {step === 4 ? (
            <Button
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Send className="mr-1.5 h-4 w-4" />
              {form.sendType === "IMMEDIATE" ? "즉시 발송" : "예약 발송 확정"}
            </Button>
          ) : (
            <Button onClick={handleNext} className="bg-indigo-600 hover:bg-indigo-700">
              다음
              <ChevronRight className="ml-1.5 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      {/* 임시저장 목록 사이드 패널 */}
      <Sheet open={showDraftList} onOpenChange={setShowDraftList}>
        <SheetContent side="right" className="flex w-[360px] flex-col p-0">
          <SheetHeader className="border-b px-5 py-4">
            <SheetTitle className="text-base">임시저장 목록</SheetTitle>
            <SheetDescription>
              {myDrafts.length > 0
                ? `저장된 임시 캠페인 ${myDrafts.length}개`
                : "임시저장된 캠페인이 없습니다"}
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto">
            {myDrafts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <RiFileTextLine className="mb-3 h-10 w-10 opacity-30" />
                <p className="text-sm">아직 임시저장된 캠페인이 없어요</p>
                <p className="mt-1 text-xs text-slate-300">
                  작성 중에 &apos;임시저장&apos; 버튼을 눌러보세요
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {myDrafts.map((draft) => (
                  <div key={draft.id} className="px-5 py-4 transition-colors hover:bg-slate-50">
                    <div className="mb-1.5 flex items-start justify-between gap-2">
                      <p className="line-clamp-2 flex-1 text-sm font-medium text-slate-800">
                        {draft.title || "(제목 없음)"}
                      </p>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteDraft(e, draft.id)}
                        className="mt-0.5 shrink-0 text-slate-300 transition-colors hover:text-red-400"
                        title="삭제"
                      >
                        <RiDeleteBinLine className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="mb-3 text-[11px] text-slate-400">
                      {new Date(draft.updatedAt).toLocaleString("ko-KR", {
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 w-full text-xs"
                      onClick={() => { handleLoadDraft(draft); setShowDraftList(false); }}
                    >
                      불러오기
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* 메시지 미리보기 모달 */}
      {showPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowPreview(false); }}
        >
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h3 className="text-base font-semibold text-slate-900">발송 미리보기</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
              {/* 채널별 메시지 미리보기 */}
              {form.channel === "EMAIL" && (
                <EmailPreview
                  senderName={form.message.senderName}
                  senderEmail={session?.email}
                  subject={form.message.subject}
                  body={form.message.body}
                  recipients={previewUsers}
                />
              )}
              {form.channel === "ALIMTALK" && <AlimtalkPreview body={form.message.body} />}
              {form.channel === "PUSH" && (
                <PushPreview subject={form.message.subject} body={form.message.body} />
              )}
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
            <p className="mt-1.5 text-sm text-slate-500">작성 중인 내용을 임시저장하고 이동하시겠어요?</p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                onClick={() => {
                  handleSaveDraft();
                  isDirtyRef.current = false;
                  router.push(pendingNavTarget);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
              >
                <Save className="h-4 w-4" />
                임시저장 후 이동
              </button>
              <button
                onClick={() => {
                  setIsDirty(false);
                  isDirtyRef.current = false;
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
              계속 작성하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewCampaignPage() {
  return (
    <Suspense fallback={null}>
      <NewCampaignContent />
    </Suspense>
  );
}
