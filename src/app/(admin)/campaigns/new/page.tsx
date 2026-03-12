"use client";

import { useState, useMemo, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Mail,
  MessageCircle,
  MessageSquare,
  Send,
  Calendar,
  ChevronRight,
  ChevronDown,
  Save,
  Eye,
  X,
  Smartphone,
  CheckCircle2,
  Loader2,
  Lock,
  Info,
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
  getTargetUsersForSms,
  computeTargetCountForSms,
  getCampaign,
  getAllCampaigns,
  deleteCampaign,
  type StoredCampaign,
  type CampaignTargetFilter,
} from "@/lib/campaign-store";
import { getSystemSettings, isBrandMsgEnabled } from "@/lib/system-settings-store";
import { getSession } from "@/lib/auth-store";
import { COMPANY_TYPES, JOB_CATEGORIES } from "@/data/mock-users";
import { useToast } from "@/lib/toast-context";
import { recordLog } from "@/lib/audit-log-store";
import type { AuthStatus } from "@/types/user";
import type { CampaignChannel } from "@/data/mock-data";

// ─── Types ────────────────────────────────────────────────────────────────────

type BrandMsgType = "U_FT" | "U_FI" | "U_FW";
type SmsSubType = "SMS" | "LMS" | "MMS";

type BrandMsgButton = {
  name: string;
  url: string;
};

type FormData = {
  title: string;
  channel: CampaignChannel;
  description: string;
  targetFilter: CampaignTargetFilter;
  message: StoredCampaign["message"];
  sendType: "IMMEDIATE" | "SCHEDULED";
  scheduledDate: string;
  scheduledTime: string;
  brandMsgType: BrandMsgType;
  brandMsgImageData: string;
  brandMsgButtons: BrandMsgButton[];
  smsSubType: SmsSubType;
  smsImageData: string;
  smsTestOnly: boolean;
  smsTestPhone: string;
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
  brandMsgType: "U_FT",
  brandMsgImageData: "",
  brandMsgButtons: [],
  smsSubType: "SMS",
  smsImageData: "",
  smsTestOnly: false,
  smsTestPhone: "",
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
  disabled?: boolean;
  disabledReason?: string;
}[] = [
  { value: "EMAIL", label: "이메일", icon: Mail, desc: "HTML/텍스트 뉴스레터" },
  { value: "BRANDMSG", label: "브랜드 메시지", icon: MessageCircle, desc: "카카오톡 채널 마케팅 메시지", disabled: true, disabledReason: "카카오톡 채널 친구 5만 이상 시 사용 가능" },
  { value: "SMS", label: "문자", icon: MessageSquare, desc: "SMS/LMS/MMS 문자 발송" },
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

// ─── SMS Helpers ──────────────────────────────────────────────────────────────

function getByteLength(str: string): number {
  let bytes = 0;
  for (let i = 0; i < str.length; i++) {
    bytes += str.charCodeAt(i) > 127 ? 2 : 1;
  }
  return bytes;
}

function getAutoSmsType(msg: string, hasImage: boolean): SmsSubType {
  if (hasImage) return "MMS";
  return getByteLength(msg) > 90 ? "LMS" : "SMS";
}

function getSmsCost(type: SmsSubType): number {
  switch (type) {
    case "SMS": return 13;
    case "LMS": return 29;
    case "MMS": return 60;
  }
}

function formatPhone(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateStep(step: number, form: FormData): Record<string, string> {
  const errors: Record<string, string> = {};
  if (step === 1) {
    if (!form.title.trim()) errors.title = "마케팅명을 입력해주세요.";
  }
  if (step === 3) {
    if (form.channel === "EMAIL") {
      if (!form.message.subject.trim()) errors.subject = "이메일 제목을 입력해주세요.";
      const hasImage = form.message.body.includes("<img");
      const bodyText = form.message.body.replace(/<[^>]*>/g, "").trim();
      if (!bodyText && !hasImage) errors.body = "이메일 본문을 입력해주세요.";
    } else if (form.channel === "BRANDMSG") {
      if (!form.message.body.trim()) errors.body = "브랜드 메시지 내용을 입력해주세요.";
      const maxLen = form.brandMsgType === "U_FT" ? 400 : 76;
      if (form.message.body.length > maxLen) errors.body = `${maxLen}자 이내로 작성해주세요.`;
    } else if (form.channel === "SMS") {
      if (!form.message.body.trim()) errors.body = "문자 메시지 내용을 입력해주세요.";
      if (form.smsSubType === "MMS" && !form.smsImageData) errors.smsImage = "MMS 이미지를 업로드해주세요.";
      if ((form.smsSubType === "LMS" || form.smsSubType === "MMS") && !form.message.subject.trim()) {
        errors.subject = "LMS/MMS 제목을 입력해주세요.";
      }
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

/** 현재 스텝의 필수 항목이 모두 채워졌는지 실시간 체크 (버튼 비활성화 용) */
function isStepComplete(step: number, form: FormData, targetCount?: number): boolean {
  if (step === 1) {
    return !!form.title.trim();
  }
  if (step === 2) {
    // 타겟 설정: 필수 없음, 항상 통과
    return true;
  }
  if (step === 3) {
    if (form.channel === "EMAIL") {
      const hasImage = form.message.body.includes("<img");
      const bodyText = form.message.body.replace(/<[^>]*>/g, "").trim();
      return !!form.message.subject.trim() && (!!bodyText || hasImage);
    }
    if (form.channel === "BRANDMSG") {
      const maxLen = form.brandMsgType === "U_FT" ? 400 : 76;
      return !!form.message.body.trim() && form.message.body.length <= maxLen;
    }
    if (form.channel === "SMS") {
      if (!form.message.body.trim()) return false;
      if (form.smsSubType === "MMS" && !form.smsImageData) return false;
      if ((form.smsSubType === "LMS" || form.smsSubType === "MMS") && !form.message.subject.trim()) return false;
      return true;
    }
    if (form.channel === "PUSH") {
      return (
        !!form.message.subject.trim() &&
        form.message.subject.length <= 50 &&
        !!form.message.body.trim() &&
        form.message.body.length <= 200
      );
    }
  }
  if (step === 4) {
    if ((targetCount ?? 0) === 0) return false;
    if (form.sendType === "SCHEDULED") {
      if (!form.scheduledDate) return false;
      const dt = new Date(`${form.scheduledDate}T${form.scheduledTime || "09:00"}`);
      if (dt <= new Date()) return false;
    }
    return true;
  }
  return true;
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
      handleDOMEvents: {
        dragenter(_view, event) { event.preventDefault(); return true; },
        dragover(_view, event) { event.preventDefault(); if (event.dataTransfer) event.dataTransfer.dropEffect = "copy"; return true; },
        drop(view, event) {
          const files = event.dataTransfer?.files;
          if (!files?.length) return false;
          const file = Array.from(files).find((f) => f.type.startsWith("image/"));
          if (!file) return false;
          event.preventDefault();
          event.stopPropagation();
          const reader = new FileReader();
          reader.onloadend = () => {
            const node = view.state.schema.nodes.image.create({ src: reader.result as string });
            const dropPos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos ?? view.state.selection.to;
            view.dispatch(view.state.tr.insert(dropPos, node));
          };
          reader.readAsDataURL(file);
          return true;
        },
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
      <div
        className="min-h-[280px] cursor-text px-4 py-3 text-sm [&_.tiptap]:min-h-[256px] [&_.tiptap]:outline-none"
        onClick={() => editor?.commands.focus()}
      >
        <EditorContent editor={editor} />
      </div>
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

function BrandMsgPreview({
  body,
  msgType,
  imageData,
  buttons,
}: {
  body: string;
  msgType: BrandMsgType;
  imageData?: string;
  buttons?: BrandMsgButton[];
}) {
  return (
    <div className="mx-auto w-48">
      <div className="overflow-hidden rounded-3xl border-4 border-slate-700 bg-slate-800 shadow-xl">
        <div className="bg-slate-100 p-2">
          <div className="mb-1.5 flex justify-between px-1 text-[8px] text-slate-400">
            <span>9:41</span>
            <span>●●●</span>
          </div>
          {/* 채널 헤더 */}
          <div className="mb-1.5 flex items-center gap-1.5 px-0.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FEE500]">
              <span className="text-[7px] font-bold text-slate-800">D</span>
            </div>
            <span className="text-[9px] font-semibold text-slate-700">DidimZip</span>
          </div>
          {/* 메시지 카드 */}
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            {/* 광고 표기 */}
            <div className="bg-slate-50 px-2.5 py-1">
              <p className="text-[7px] text-slate-400">(광고) DidimZip</p>
            </div>
            {/* 와이드 이미지 상단 */}
            {(msgType === "U_FW" || msgType === "U_FI") && imageData && (
              <div className={cn("w-full bg-slate-200", msgType === "U_FW" ? "aspect-[2/1]" : "aspect-square")}>
                <img src={imageData} alt="" className="h-full w-full object-cover" />
              </div>
            )}
            {/* 본문 */}
            <div className="px-2.5 py-2">
              <p className="whitespace-pre-wrap text-[9px] leading-relaxed text-slate-600">
                {body || "(브랜드 메시지 내용이 여기에\n표시됩니다)"}
              </p>
            </div>
            {/* 버튼 */}
            {buttons && buttons.length > 0 && (
              <div className="border-t border-slate-100 px-2.5 py-1.5 space-y-1">
                {buttons.map((btn, i) => (
                  <div key={i} className="rounded-md bg-slate-50 py-1 text-center text-[8px] font-medium text-slate-600">
                    {btn.name || "버튼"}
                  </div>
                ))}
              </div>
            )}
            {/* 수신 거부 */}
            <div className="border-t border-slate-100 px-2.5 py-1">
              <p className="text-[6px] text-slate-300">채널 차단 | 수신거부 0808-XXX-XXXX</p>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-slate-400">카카오 브랜드 메시지 미리보기</p>
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

function SmsPreview({
  body,
  smsType,
  subject,
  imageData,
}: {
  body: string;
  smsType: SmsSubType;
  subject?: string;
  imageData?: string;
}) {
  const byteLen = getByteLength(body);
  return (
    <div className="mx-auto w-48">
      <div className="overflow-hidden rounded-3xl border-4 border-slate-700 bg-slate-800 shadow-xl">
        <div className="bg-slate-100 p-2">
          <div className="mb-1.5 flex justify-between px-1 text-[8px] text-slate-400">
            <span>9:41</span>
            <span>●●●</span>
          </div>
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            {/* 발신 정보 */}
            <div className="flex items-center gap-1.5 border-b border-slate-100 px-2.5 py-1.5">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500">
                <MessageSquare className="h-3 w-3 text-white" />
              </div>
              <span className="text-[9px] font-semibold text-slate-700">DidimZip</span>
              <span className="ml-auto rounded bg-slate-100 px-1 py-0.5 text-[7px] text-slate-400">{smsType}</span>
            </div>
            {/* MMS 이미지 */}
            {smsType === "MMS" && imageData && (
              <div className="aspect-[4/3] w-full bg-slate-200">
                <img src={imageData} alt="" className="h-full w-full object-cover" />
              </div>
            )}
            {/* 제목 (LMS/MMS) */}
            {(smsType === "LMS" || smsType === "MMS") && subject && (
              <div className="px-2.5 pt-2">
                <p className="text-[9px] font-bold text-slate-800">{subject}</p>
              </div>
            )}
            {/* 본문 */}
            <div className="px-2.5 py-2">
              <p className="whitespace-pre-wrap text-[9px] leading-relaxed text-slate-600">
                {body || "(문자 메시지 내용이 여기에\n표시됩니다)"}
              </p>
            </div>
            {/* 바이트 정보 */}
            <div className="border-t border-slate-100 px-2.5 py-1">
              <p className="text-[6px] text-slate-300">{byteLen}바이트 | 수신거부 080-XXX-XXXX</p>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-slate-400">문자 메시지 미리보기</p>
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
        <div className="grid grid-cols-4 gap-3">
          {CHANNEL_OPTIONS.map((ch) => {
            const Icon = ch.icon;
            const isDisabled = ch.disabled && !isBrandMsgEnabled();
            const isSelected = form.channel === ch.value;
            return (
              <button
                key={ch.value}
                type="button"
                onClick={() => !isDisabled && onChange({ channel: ch.value })}
                disabled={!!isDisabled}
                className={cn(
                  "relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
                  isDisabled
                    ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60"
                    : isSelected
                    ? "cursor-pointer border-indigo-500 bg-indigo-50"
                    : "cursor-pointer border-slate-200 bg-white hover:border-indigo-200"
                )}
              >
                {isDisabled && (
                  <Lock className="absolute right-2 top-2 h-3.5 w-3.5 text-slate-400" />
                )}
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    isDisabled ? "bg-slate-100" : isSelected ? "bg-indigo-100" : "bg-slate-100"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5",
                      isDisabled ? "text-slate-300" : isSelected ? "text-indigo-600" : "text-slate-400"
                    )}
                  />
                </div>
                <div className="text-center">
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      isDisabled ? "text-slate-400" : isSelected ? "text-indigo-700" : "text-slate-700"
                    )}
                  >
                    {ch.label}
                  </p>
                  <p className={cn("text-xs", isDisabled ? "text-slate-300" : "text-slate-400")}>{ch.desc}</p>
                  {isDisabled && ch.disabledReason && (
                    <p className="mt-1 text-[10px] leading-tight text-amber-500">{ch.disabledReason}</p>
                  )}
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
      {form.channel === "SMS" && (
        <div className="space-y-3">
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-700 flex items-start gap-2">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>전화번호가 등록된 활성 회원에게만 발송됩니다. 전화번호 미등록 회원은 발송 대상에서 자동 제외됩니다.</span>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.smsTestOnly ?? false}
                  onChange={(e) => onChange({ smsTestOnly: e.target.checked, smsTestPhone: e.target.checked ? (form.smsTestPhone || "") : "" })}
                  className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-sm font-medium text-amber-800">테스트 발송 모드</span>
              </label>
            </div>
            {form.smsTestOnly && (
              <div className="mt-3">
                <p className="mb-2 text-xs text-amber-700">아래 번호로만 발송됩니다. 회원 필터는 무시됩니다.</p>
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-amber-600 shrink-0" />
                  <input
                    type="text"
                    value={form.smsTestPhone || ""}
                    onChange={(e) => onChange({ smsTestPhone: formatPhone(e.target.value) })}
                    placeholder="010-0000-0000"
                    className="w-48 rounded-md border border-amber-300 bg-white px-3 py-1.5 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  {(form.smsTestPhone || "").replace(/-/g, "").length >= 10 && (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
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
  onTestSend,
}: {
  form: FormData;
  errors: Record<string, string>;
  onChange: (patch: Partial<FormData>) => void;
  onTestSend?: () => void;
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

      {form.channel === "BRANDMSG" && (
        <SectionCard title="브랜드 메시지 작성">
          {/* 안내 배너 */}
          <div className="mb-4 space-y-2">
            <div className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-xs text-amber-700">
              <strong>채널 친구 전용:</strong> 카카오톡 채널을 친구 추가한 회원에게만 발송됩니다.
              발송 시 <code className="rounded bg-amber-100 px-1">(광고)</code> 표기와 수신거부 안내가 자동 포함됩니다.
            </div>
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-700">
              <strong>발송 가능 시간:</strong> 오전 8시 ~ 오후 9시 (심야 시간 발송 불가)
            </div>
          </div>

          {/* 메시지 유형 선택 */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-slate-700">메시지 유형</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: "U_FT" as BrandMsgType, label: "텍스트", desc: "최대 400자" },
                { value: "U_FI" as BrandMsgType, label: "이미지", desc: "이미지 + 400자" },
                { value: "U_FW" as BrandMsgType, label: "와이드 이미지", desc: "와이드 이미지 + 76자" },
              ]).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange({ brandMsgType: opt.value });
                    if (opt.value === "U_FW" && form.message.body.length > 76) {
                      updateMsg({ body: form.message.body.slice(0, 76) });
                    }
                  }}
                  className={cn(
                    "rounded-lg border-2 p-3 text-left transition-all",
                    form.brandMsgType === opt.value
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-slate-200 hover:border-indigo-200"
                  )}
                >
                  <p className={cn("text-sm font-medium", form.brandMsgType === opt.value ? "text-indigo-700" : "text-slate-700")}>{opt.label}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 이미지 업로드 (IMAGE / WIDE 유형) */}
          {(form.brandMsgType === "U_FI" || form.brandMsgType === "U_FW") && (
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                이미지 <span className="text-red-500">*</span>
              </label>
              {form.brandMsgImageData ? (
                <div className="relative">
                  <div className={cn(
                    "overflow-hidden rounded-lg border border-slate-200 bg-slate-100",
                    form.brandMsgType === "U_FW" ? "aspect-[2/1]" : "aspect-square max-w-[200px]"
                  )}>
                    <img src={form.brandMsgImageData} alt="" className="h-full w-full object-cover" />
                  </div>
                  <button
                    type="button"
                    onClick={() => onChange({ brandMsgImageData: "" })}
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-sm hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label
                  className={cn(
                    "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-slate-50 py-8 transition-colors",
                    form.brandMsgType === "U_FW" ? "aspect-[2/1]" : "",
                    "border-slate-300 hover:border-indigo-300 hover:bg-indigo-50/30",
                  )}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-indigo-400", "bg-indigo-50/50"); }}
                  onDragLeave={(e) => { e.currentTarget.classList.remove("border-indigo-400", "bg-indigo-50/50"); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove("border-indigo-400", "bg-indigo-50/50");
                    const file = e.dataTransfer.files?.[0];
                    if (!file || !file.type.startsWith("image/")) return;
                    const reader = new FileReader();
                    reader.onload = () => onChange({ brandMsgImageData: reader.result as string });
                    reader.readAsDataURL(file);
                  }}
                >
                  <RiImageAddLine className="mb-2 h-8 w-8 text-slate-300" />
                  <p className="text-sm text-slate-500">클릭하거나 이미지를 드래그하세요</p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {form.brandMsgType === "U_FW" ? "권장: 가로형 2:1 비율" : "권장: 정사각형 1:1 비율"}
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => onChange({ brandMsgImageData: reader.result as string });
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
              )}
            </div>
          )}

          {/* 본문 */}
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              메시지 내용 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.message.body}
              onChange={(e) => updateMsg({ body: e.target.value })}
              placeholder="브랜드 메시지 내용을 작성해주세요."
              rows={form.brandMsgType === "U_FW" ? 3 : 8}
              maxLength={form.brandMsgType === "U_FW" ? 76 : 400}
              className={cn(
                "w-full resize-none rounded-lg border bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none",
                errors.body ? "border-red-400" : "border-slate-200"
              )}
            />
            <div className="mt-1 flex items-center justify-between">
              {errors.body ? <p className="text-xs text-red-500">{errors.body}</p> : <span />}
              {(() => {
                const maxLen = form.brandMsgType === "U_FW" ? 76 : 400;
                const warnAt = Math.floor(maxLen * 0.9);
                return (
                  <span className={cn("text-xs", form.message.body.length > warnAt ? "text-amber-500" : "text-slate-400")}>
                    {form.message.body.length} / {maxLen}
                  </span>
                );
              })()}
            </div>
          </div>

          {/* 버튼 설정 (최대 2개) */}
          <div className="mb-4">
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">버튼 (선택, 최대 2개)</label>
              {form.brandMsgButtons.length < 2 && (
                <button
                  type="button"
                  onClick={() => onChange({ brandMsgButtons: [...form.brandMsgButtons, { name: "", url: "" }] })}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                >
                  + 버튼 추가
                </button>
              )}
            </div>
            {form.brandMsgButtons.length === 0 && (
              <p className="text-xs text-slate-400">버튼을 추가하면 메시지 하단에 링크 버튼이 표시됩니다.</p>
            )}
            <div className="space-y-2">
              {form.brandMsgButtons.map((btn, idx) => (
                <div key={idx} className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={btn.name}
                      onChange={(e) => {
                        const updated = [...form.brandMsgButtons];
                        updated[idx] = { ...updated[idx], name: e.target.value };
                        onChange({ brandMsgButtons: updated });
                      }}
                      placeholder="버튼 텍스트 (예: 자세히 보기)"
                      className="h-8 w-full rounded border border-slate-200 bg-white px-2.5 text-sm focus:border-indigo-400 focus:outline-none"
                    />
                    <input
                      type="url"
                      value={btn.url}
                      onChange={(e) => {
                        const updated = [...form.brandMsgButtons];
                        updated[idx] = { ...updated[idx], url: e.target.value };
                        onChange({ brandMsgButtons: updated });
                      }}
                      placeholder="https://..."
                      className="h-8 w-full rounded border border-slate-200 bg-white px-2.5 text-sm focus:border-indigo-400 focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => onChange({ brandMsgButtons: form.brandMsgButtons.filter((_, i) => i !== idx) })}
                    className="mt-1 text-slate-300 hover:text-red-400"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 테스트 발송 버튼 */}
          <div className="border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onTestSend}
              disabled={!form.message.body.trim()}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 py-2.5 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-100",
                !form.message.body.trim() && "cursor-not-allowed opacity-40"
              )}
            >
              <Smartphone className="h-4 w-4" />
              테스트 발송
            </button>
            <p className="mt-1.5 text-center text-[11px] text-slate-400">
              입력한 번호로 브랜드 메시지 발송을 시뮬레이션합니다
            </p>
          </div>
        </SectionCard>
      )}

      {form.channel === "SMS" && (
        <SectionCard title="문자 메시지 작성">
          {/* 안내 배너 */}
          <div className="mb-4 space-y-2">
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-700">
              <strong>자동 전환:</strong> 90바이트 이하 SMS, 초과 시 LMS 자동 전환. 이미지 첨부 시 MMS.
            </div>
            <div className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-xs text-amber-700">
              <strong>(광고)</strong> 표기 + 수신거부 080 번호가 자동 포함됩니다.
              정보통신망법에 따라 21:00~08:00 광고 문자 발송이 금지됩니다.
            </div>
          </div>

          {/* 발신번호 */}
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">발신번호</label>
            <div className="flex h-9 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
              {getSystemSettings().solapiSender || "(시스템 설정에서 발신번호를 등록하세요)"}
            </div>
          </div>

          {/* 문자 종류 선택 */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-slate-700">문자 종류</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: "SMS" as SmsSubType, label: "SMS", desc: "90바이트 이하" },
                { value: "LMS" as SmsSubType, label: "LMS", desc: "2,000바이트 이하" },
                { value: "MMS" as SmsSubType, label: "MMS", desc: "이미지 + 2,000바이트" },
              ]).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onChange({ smsSubType: opt.value })}
                  className={cn(
                    "rounded-lg border-2 p-3 text-left transition-all",
                    form.smsSubType === opt.value
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-slate-200 hover:border-indigo-200"
                  )}
                >
                  <p className={cn("text-sm font-medium", form.smsSubType === opt.value ? "text-indigo-700" : "text-slate-700")}>{opt.label}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">{opt.desc}</p>
                  <p className="mt-0.5 text-[11px] font-medium text-emerald-600">{getSmsCost(opt.value)}원/건</p>
                </button>
              ))}
            </div>
          </div>

          {/* LMS/MMS 제목 */}
          {(form.smsSubType === "LMS" || form.smsSubType === "MMS") && (
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                제목 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.message.subject}
                onChange={(e) => updateMsg({ subject: e.target.value })}
                placeholder="LMS/MMS 제목을 입력하세요"
                maxLength={44}
                className={cn(
                  "h-9 w-full rounded-lg border bg-white px-3 text-sm focus:border-indigo-400 focus:outline-none",
                  errors.subject ? "border-red-400" : "border-slate-200"
                )}
              />
              {errors.subject && <p className="mt-1 text-xs text-red-500">{errors.subject}</p>}
            </div>
          )}

          {/* MMS 이미지 업로드 */}
          {form.smsSubType === "MMS" && (
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                이미지 <span className="text-red-500">*</span>
              </label>
              {form.smsImageData ? (
                <div className="relative">
                  <div className="aspect-[4/3] max-w-[240px] overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                    <img src={form.smsImageData} alt="" className="h-full w-full object-cover" />
                  </div>
                  <button
                    type="button"
                    onClick={() => onChange({ smsImageData: "" })}
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-sm hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label
                  className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 py-8 transition-colors hover:border-indigo-300 hover:bg-indigo-50/30"
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-indigo-400", "bg-indigo-50/50"); }}
                  onDragLeave={(e) => { e.currentTarget.classList.remove("border-indigo-400", "bg-indigo-50/50"); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove("border-indigo-400", "bg-indigo-50/50");
                    const file = e.dataTransfer.files?.[0];
                    if (!file || !file.type.startsWith("image/")) return;
                    const reader = new FileReader();
                    reader.onload = () => onChange({ smsImageData: reader.result as string });
                    reader.readAsDataURL(file);
                  }}
                >
                  <RiImageAddLine className="mb-2 h-8 w-8 text-slate-300" />
                  <p className="text-sm text-slate-500">클릭하거나 이미지를 드래그하세요</p>
                  <p className="mt-1 text-[11px] text-slate-400">최대 300KB, JPG/PNG</p>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => onChange({ smsImageData: reader.result as string });
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
              )}
              {errors.smsImage && <p className="mt-1 text-xs text-red-500">{errors.smsImage}</p>}
            </div>
          )}

          {/* 메시지 본문 */}
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              메시지 내용 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.message.body}
              onChange={(e) => {
                updateMsg({ body: e.target.value });
                // 자동 SMS/LMS 전환
                const autoType = getAutoSmsType(e.target.value, !!form.smsImageData);
                if (autoType !== form.smsSubType && form.smsSubType !== "MMS") {
                  onChange({ smsSubType: autoType });
                }
              }}
              placeholder="문자 메시지 내용을 입력해주세요."
              rows={6}
              className={cn(
                "w-full resize-none rounded-lg border bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none",
                errors.body ? "border-red-400" : "border-slate-200"
              )}
            />
            <div className="mt-1 flex items-center justify-between">
              {errors.body ? <p className="text-xs text-red-500">{errors.body}</p> : <span />}
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-xs",
                  getByteLength(form.message.body) > 90 ? "text-amber-500" : "text-slate-400"
                )}>
                  {getByteLength(form.message.body)}바이트
                </span>
                <Badge variant="secondary" className="text-[10px]">
                  {getAutoSmsType(form.message.body, !!form.smsImageData)}
                </Badge>
              </div>
            </div>
          </div>

          {/* 테스트 발송 */}
          <div className="border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onTestSend}
              disabled={!form.message.body.trim()}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 py-2.5 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-100",
                !form.message.body.trim() && "cursor-not-allowed opacity-40"
              )}
            >
              <Smartphone className="h-4 w-4" />
              테스트 발송
            </button>
            <p className="mt-1.5 text-center text-[11px] text-slate-400">
              솔라피를 통해 테스트 발송
            </p>
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
            ...(form.channel === "SMS"
              ? [
                  { label: "문자 종류", value: form.smsSubType },
                  { label: "건당 비용", value: `${getSmsCost(form.smsSubType)}원` },
                  {
                    label: "예상 총 비용",
                    value: (
                      <span className="font-bold text-emerald-600">
                        {(getSmsCost(form.smsSubType) * targetCount).toLocaleString()}원
                      </span>
                    ),
                  },
                ]
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
        {form.channel === "SMS" && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            정보통신망법에 따라 21:00~08:00 광고 문자 발송이 금지됩니다.
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
          brandMsgType: "U_FT",
          brandMsgImageData: "",
          brandMsgButtons: [],
          smsSubType: (c as unknown as { smsType?: SmsSubType }).smsType ?? "SMS",
          smsImageData: (c as unknown as { smsImageData?: string }).smsImageData ?? "",
          smsTestOnly: false,
          smsTestPhone: "",
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
  const [showTestSend, setShowTestSend] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [testSendPhase, setTestSendPhase] = useState<"input" | "sending" | "done">("input");
  const [testSendResult, setTestSendResult] = useState<string>("");
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

  const targetCount = useMemo(() => {
    if (form.channel === "SMS" && form.smsTestOnly) {
      return (form.smsTestPhone || "").replace(/-/g, "").length >= 10 ? 1 : 0;
    }
    return form.channel === "SMS" ? computeTargetCountForSms(form.targetFilter) : computeTargetCount(form.targetFilter);
  }, [form.targetFilter, form.channel, form.smsTestOnly, form.smsTestPhone]);
  const previewUsers = useMemo(() => getTargetUsers(form.targetFilter), [form.targetFilter]);
  const canProceed = isStepComplete(step, form, targetCount);

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
      ...(form.channel === "SMS" ? {
        smsType: form.smsSubType,
        smsSender: getSystemSettings().solapiSender,
        smsImageData: form.smsImageData || undefined,
        smsByteCount: getByteLength(form.message.body),
        smsUnitCost: getSmsCost(form.smsSubType),
        smsTotalCost: getSmsCost(form.smsSubType) * targetCount,
        failedPhones: [],
      } : {}),
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
      brandMsgType: "U_FT",
      brandMsgImageData: "",
      brandMsgButtons: [],
      smsSubType: draft.smsType ?? "SMS",
      smsImageData: draft.smsImageData ?? "",
      smsTestOnly: false,
      smsTestPhone: "",
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
        const emailTargetUsers = getTargetUsers(form.targetFilter);
        const recipients = emailTargetUsers.map((u) => u.email);
        const emailRecipients = emailTargetUsers.map((u) => ({ nickname: u.nickname ?? "—", email: u.email, companyName: u.companyName ?? "—", jobCategory: u.jobCategory ?? "—" }));
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
        const saved = upsertCampaign({ ...buildPayload("SENT"), sentCount: sent, failedCount: failed, failedEmails: failedEmails ?? [], sentRecipients: emailRecipients });
        recordLog("CAMPAIGN_SEND", `마케팅 발송: ${form.title} (성공: ${sent}명${failed > 0 ? `, 실패: ${failed}명` : ""})`, {
          targetType: "campaign",
          targetId: saved.id,
        });
        showToast(`이메일을 ${sent}명에게 발송했습니다.${failed > 0 ? ` (${failed}명 실패)` : ""}`, "success");
        setIsDirty(false);
        setSentCampaignId(saved.id);
      } else if (form.channel === "SMS" && form.sendType === "IMMEDIATE") {
        // SMS 즉시 발송: 솔라피 API Route를 통해 실제 발송
        const smsTargetUsers = form.smsTestOnly
          ? []
          : getTargetUsersForSms(form.targetFilter);
        const phones = form.smsTestOnly
          ? [(form.smsTestPhone || "").replace(/-/g, "")]
          : smsTargetUsers.map((u) => u.phone!);
        const smsRecipients = form.smsTestOnly
          ? [{ nickname: "테스트", email: form.smsTestPhone || "", companyName: "—", jobCategory: "—" }]
          : smsTargetUsers.map((u) => ({ nickname: u.nickname ?? "—", email: u.phone ?? "—", companyName: u.companyName ?? "—", jobCategory: u.jobCategory ?? "—" }));
        const settings = getSystemSettings();
        const res = await fetch("/api/sms/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            apiKey: settings.solapiApiKey,
            apiSecret: settings.solapiApiSecret,
            sender: settings.solapiSender,
            receivers: phones,
            msg: form.message.body,
            subject: form.message.subject || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast(data.error ?? "SMS 발송에 실패했습니다.", "error");
          setIsSubmitting(false);
          return;
        }
        const { sent, failed, failedPhones, failedReasons, groupId } = data as { sent: number; failed: number; failedPhones: string[]; failedReasons?: string[]; groupId?: string };
        const saved = upsertCampaign({
          ...buildPayload("SENT"),
          sentCount: sent,
          failedCount: failed,
          failedPhones: failedPhones ?? [],
          failedReasons: failedReasons ?? [],
          smsGroupId: groupId ?? "",
          sentRecipients: smsRecipients,
        });
        recordLog("CAMPAIGN_SEND", `문자 발송: ${form.title} (성공: ${sent}명${failed > 0 ? `, 실패: ${failed}명` : ""})`, {
          targetType: "campaign",
          targetId: saved.id,
        });
        if (sent === 0 && failed > 0) {
          showToast("문자 발송에 실패했습니다. 상세 페이지에서 원인을 확인하세요.", "error");
        } else {
          showToast(`문자를 ${sent}명에게 발송했습니다.${failed > 0 ? ` (${failed}명 실패)` : ""}`, "success");
        }
        setIsDirty(false);
        setSentCampaignId(saved.id);
      } else {
        // 기타 채널 or 예약 발송: 저장만
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
              if (!isStepComplete(i, form, targetCount)) {
                setStep(i);
                return;
              }
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
            <Step3Message
              form={form}
              errors={errors}
              onChange={updateForm}
              onTestSend={() => {
                setTestPhone("");
                setTestSendPhase("input");
                setShowTestSend(true);
              }}
            />
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
              disabled={isSubmitting || !canProceed}
              className={cn(
                "bg-indigo-600 hover:bg-indigo-700",
                !canProceed && "cursor-not-allowed opacity-50"
              )}
            >
              <Send className="mr-1.5 h-4 w-4" />
              {form.sendType === "IMMEDIATE" ? "즉시 발송" : "예약 발송 확정"}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!canProceed}
              className={cn(
                "bg-indigo-600 hover:bg-indigo-700",
                !canProceed && "cursor-not-allowed opacity-50"
              )}
            >
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
              {form.channel === "BRANDMSG" && (
                <BrandMsgPreview
                  body={form.message.body}
                  msgType={form.brandMsgType}
                  imageData={form.brandMsgImageData}
                  buttons={form.brandMsgButtons}
                />
              )}
              {form.channel === "SMS" && (
                <SmsPreview
                  body={form.message.body}
                  smsType={form.smsSubType}
                  subject={form.message.subject}
                  imageData={form.smsImageData}
                />
              )}
              {form.channel === "PUSH" && (
                <PushPreview subject={form.message.subject} body={form.message.body} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* 브랜드 메시지 테스트 발송 모달 */}
      {showTestSend && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget && testSendPhase !== "sending") setShowTestSend(false); }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            {/* 헤더 */}
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div className="flex items-center gap-2">
                {form.channel === "SMS" ? (
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
                    <MessageSquare className="h-4 w-4 text-green-600" />
                  </div>
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FEE500]">
                    <MessageCircle className="h-4 w-4 text-slate-800" />
                  </div>
                )}
                <h3 className="text-base font-semibold text-slate-900">
                  {form.channel === "SMS" ? "문자 테스트 발송" : "브랜드 메시지 테스트 발송"}
                </h3>
              </div>
              {testSendPhase !== "sending" && (
                <button
                  onClick={() => setShowTestSend(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* 입력 단계 */}
            {testSendPhase === "input" && (
              <div className="p-5">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">수신 번호</label>
                <input
                  type="tel"
                  value={testPhone}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^0-9]/g, "");
                    if (v.length <= 11) {
                      const formatted = v.length > 7
                        ? `${v.slice(0, 3)}-${v.slice(3, 7)}-${v.slice(7)}`
                        : v.length > 3
                        ? `${v.slice(0, 3)}-${v.slice(3)}`
                        : v;
                      setTestPhone(formatted);
                    }
                  }}
                  placeholder="010-1234-5678"
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-indigo-400 focus:outline-none"
                />
                <p className="mt-1.5 text-[11px] text-slate-400">
                  실제 발송은 되지 않으며, 발송 프로세스를 시뮬레이션합니다
                </p>

                {/* 미리보기 */}
                <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="mb-3 text-center text-xs font-medium text-slate-500">발송될 내용</p>
                  {form.channel === "SMS" ? (
                    <SmsPreview
                      body={form.message.body}
                      smsType={form.smsSubType}
                      subject={form.message.subject}
                      imageData={form.smsImageData}
                    />
                  ) : (
                    <BrandMsgPreview
                      body={form.message.body}
                      msgType={form.brandMsgType}
                      imageData={form.brandMsgImageData}
                      buttons={form.brandMsgButtons}
                    />
                  )}
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    setTestSendPhase("sending");
                    if (form.channel === "SMS") {
                      try {
                        const settings = getSystemSettings();
                        const res = await fetch("/api/sms/test", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            apiKey: settings.solapiApiKey,
                            apiSecret: settings.solapiApiSecret,
                            sender: settings.solapiSender,
                            receiver: testPhone,
                            msg: form.message.body,
                            subject: form.message.subject || undefined,
                          }),
                        });
                        const data = await res.json();
                        if (data.success) {
                          setTestSendResult(data.simulated ? "시뮬레이션" : "테스트모드");
                        }
                      } catch {
                        // fallback
                      }
                      setTestSendPhase("done");
                    } else {
                      setTimeout(() => setTestSendPhase("done"), 2000);
                    }
                  }}
                  disabled={testPhone.replace(/-/g, "").length < 10}
                  className={cn(
                    "mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-colors",
                    form.channel === "SMS"
                      ? "bg-green-500 text-white hover:bg-green-600"
                      : "bg-[#FEE500] text-slate-800 hover:bg-[#F5DB00]",
                    testPhone.replace(/-/g, "").length < 10 && "cursor-not-allowed opacity-40"
                  )}
                >
                  <Send className="h-4 w-4" />
                  테스트 발송하기
                </button>
              </div>
            )}

            {/* 발송 중 */}
            {testSendPhase === "sending" && (
              <div className="flex flex-col items-center justify-center py-16 px-5">
                <div className="relative">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FEE500]/20">
                    <Loader2 className="h-8 w-8 animate-spin text-[#C4A900]" />
                  </div>
                </div>
                <p className="mt-5 text-sm font-semibold text-slate-800">
                  {form.channel === "SMS" ? "문자 메시지를 발송하고 있습니다..." : "브랜드 메시지를 발송하고 있습니다..."}
                </p>
                <p className="mt-1.5 text-xs text-slate-400">{testPhone} 으로 전송 중</p>
              </div>
            )}

            {/* 발송 완료 */}
            {testSendPhase === "done" && (
              <div className="p-5">
                <div className="flex flex-col items-center py-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                    <CheckCircle2 className="h-7 w-7 text-emerald-600" />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-slate-800">테스트 발송이 완료되었습니다</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {testPhone} 으로 발송됨 ({testSendResult || "시뮬레이션"})
                  </p>
                </div>

                {/* 발송 결과 요약 */}
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-lg font-bold text-emerald-600">1</p>
                      <p className="text-[11px] text-slate-500">발송 성공</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-slate-300">0</p>
                      <p className="text-[11px] text-slate-500">발송 실패</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-slate-800">{form.message.body.length}자</p>
                      <p className="text-[11px] text-slate-500">메시지 길이</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTestSendPhase("input")}
                    className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    다시 발송
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTestSend(false)}
                    className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
                  >
                    확인
                  </button>
                </div>
              </div>
            )}
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
