"use client";

import React, { useState, useRef, useCallback, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import NextLink from "next/link";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Youtube from "@tiptap/extension-youtube";
import Image from "@tiptap/extension-image";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import {
  RiBold,
  RiFileTextLine,
  RiItalic,
  RiStrikethrough,
  RiListUnordered,
  RiListOrdered,
  RiDoubleQuotesL,
  RiCodeLine,
  RiCodeBoxLine,
  RiSeparator,
  RiLinksLine,
  RiImageAddLine,
  RiImageLine,
  RiYoutubeLine,
  RiH2,
  RiH3,
  RiCloseLine,
  RiAddLine,
  RiAttachmentLine,
  RiUploadLine,
  RiDeleteBinLine,
  RiArrowDownSLine,
  RiSave3Line,
  RiSendPlaneLine,
  RiCalendarLine,
  RiFolderLine,
  RiCustomerService2Line,
} from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  upsertPost,
  getDrafts,
  getPost,
  deletePost,
  getAllTags,
  compressImageForStorage,
  type StoredPost,
} from "@/lib/post-store";
import { getCategories } from "@/lib/category-store";
import { getSession, type AdminSession } from "@/lib/auth-store";
import { useToast } from "@/lib/toast-context";
import { recordLog } from "@/lib/audit-log-store";

// ─── Data ────────────────────────────────────────────────────────────────────

const EXISTING_TAGS = [
  "스타트업", "VC", "투자", "네트워킹", "멘토링", "인사이트",
  "AI", "핀테크", "ESG", "글로벌", "시리즈A", "엑셀러레이터",
  "IPO", "B2B", "SaaS", "데모데이", "피칭", "헬스케어", "스케일업", "트렌드",
];

// ─── Editor Toolbar ───────────────────────────────────────────────────────────

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900",
        active && "bg-slate-200 text-slate-900"
      )}
    >
      {children}
    </button>
  );
}

function EditorToolbar({ editor }: { editor: ReturnType<typeof useEditor> | null }) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  if (!editor) return null;

  const addLink = () => {
    const url = window.prompt("링크 URL을 입력하세요");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
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

  const addYoutube = () => {
    const url = window.prompt("YouTube 또는 Vimeo URL을 입력하세요");
    if (url) {
      editor.commands.setYoutubeVideo({ src: url, width: 640, height: 360 });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-slate-50 px-3 py-2 rounded-t-lg">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
        title="제목 2"
      >
        <RiH2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive("heading", { level: 3 })}
        title="제목 3"
      >
        <RiH3 className="h-4 w-4" />
      </ToolbarButton>

      <div className="mx-1 h-5 w-px bg-slate-300" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        title="굵게"
      >
        <RiBold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        title="기울임"
      >
        <RiItalic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive("strike")}
        title="취소선"
      >
        <RiStrikethrough className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        active={editor.isActive("code")}
        title="인라인 코드"
      >
        <RiCodeLine className="h-4 w-4" />
      </ToolbarButton>

      <div className="mx-1 h-5 w-px bg-slate-300" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        title="글머리기호 목록"
      >
        <RiListUnordered className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        title="번호 목록"
      >
        <RiListOrdered className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
        title="인용구"
      >
        <RiDoubleQuotesL className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        active={editor.isActive("codeBlock")}
        title="코드 블록"
      >
        <RiCodeBoxLine className="h-4 w-4" />
      </ToolbarButton>

      <div className="mx-1 h-5 w-px bg-slate-300" />

      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="구분선"
      >
        <RiSeparator className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={addLink} active={editor.isActive("link")} title="링크 삽입">
        <RiLinksLine className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton onClick={addImage} title="이미지 삽입">
        <RiImageAddLine className="h-4 w-4" />
      </ToolbarButton>
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageFile} />
      <ToolbarButton onClick={addYoutube} title="YouTube/Vimeo 영상 삽입">
        <RiYoutubeLine className="h-4 w-4" />
      </ToolbarButton>
      <div className="mx-1 h-5 w-px bg-slate-300" />
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
      <ToolbarButton onClick={() => editor.chain().focus().unsetColor().run()} title="색상 초기화">
        <span className="text-xs font-bold line-through text-slate-400">A</span>
      </ToolbarButton>
    </div>
  );
}

// ─── Tag Input ────────────────────────────────────────────────────────────────

function TagInput({
  tags,
  onChange,
  availableTags = EXISTING_TAGS,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  availableTags?: string[];
}) {
  const [input, setInput] = useState("");
  const [tagError, setTagError] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeItemRef = useRef<HTMLButtonElement | null>(null);
  const isComposing = useRef(false);
  const pendingTagFromSpaceRef = useRef(false);

  // Scroll active suggestion into view when keyboard navigating
  useEffect(() => {
    if (activeIndex >= 0 && activeItemRef.current) {
      activeItemRef.current.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  const updateSuggestions = (value: string) => {
    if (!value.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      setActiveIndex(-1);
      return;
    }
    const filtered = availableTags.filter(
      (t) =>
        t.toLowerCase().includes(value.toLowerCase()) && !tags.includes(t)
    );
    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
    setActiveIndex(-1);
  };

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed) {
      setInput("");
      setSuggestions([]);
      setShowSuggestions(false);
      setActiveIndex(-1);
      return;
    }
    if (tags.includes(trimmed)) {
      setTagError("이미 등록된 태그입니다.");
      setSuggestions([]);
      setShowSuggestions(false);
      setActiveIndex(-1);
      return;
    }
    onChange([...tags, trimmed]);
    setInput("");
    setTagError("");
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const removeTag = (tag: string) => onChange(tags.filter((t) => t !== tag));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter" && !isComposing.current) {
      e.preventDefault();
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        addTag(suggestions[activeIndex]);
      } else {
        addTag(input);
      }
    } else if (e.key === " ") {
      if (e.nativeEvent.isComposing) {
        // Korean IME: space commits the composition then fires onChange.
        // Set flag so onChange can add the tag from the committed text.
        pendingTagFromSpaceRef.current = true;
      } else {
        const trimmed = input.trim();
        if (trimmed) {
          e.preventDefault();
          if (activeIndex >= 0 && suggestions[activeIndex]) {
            addTag(suggestions[activeIndex]);
          } else {
            addTag(trimmed);
          }
        }
      }
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div className="relative">
      <div
        className="flex min-h-[42px] flex-wrap gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-400 cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag) => (
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
              <RiCloseLine className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => {
            // Korean IME: space ends composition then fires this onChange with
            // the committed text + a trailing space. Detect and add as tag.
            if (pendingTagFromSpaceRef.current) {
              pendingTagFromSpaceRef.current = false;
              const committed = e.target.value.trimEnd();
              if (committed) {
                addTag(committed);
              } else {
                setInput("");
                setTagError("");
                updateSuggestions("");
              }
              return;
            }
            setInput(e.target.value);
            setTagError("");
            updateSuggestions(e.target.value);
          }}
          onCompositionStart={() => { isComposing.current = true; }}
          onCompositionEnd={() => { isComposing.current = false; }}
          onKeyDown={handleKeyDown}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder={tags.length === 0 ? "태그 입력 후 Enter 또는 Space" : ""}
          className="min-w-[120px] flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
      </div>
      {tagError && (
        <p className="mt-1 text-xs text-red-500">{tagError}</p>
      )}

      {showSuggestions && (
        <div className="absolute left-0 top-full z-20 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg max-h-[180px] overflow-y-auto">
          {suggestions.map((s, i) => (
            <button
              key={s}
              ref={i === activeIndex ? activeItemRef : null}
              type="button"
              onMouseDown={() => addTag(s)}
              onMouseEnter={() => setActiveIndex(i)}
              className={cn(
                "flex w-full items-center px-3 py-2 text-sm first:rounded-t-lg last:rounded-b-lg",
                i === activeIndex
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Thumbnail Upload ─────────────────────────────────────────────────────────

function ThumbnailUpload({
  preview,
  onUpload,
  onRemove,
}: {
  preview: string;
  onUpload: (file: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File) => {
    if (file.type.startsWith("image/")) onUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  if (preview) {
    return (
      <div className="relative overflow-hidden rounded-lg border border-slate-200">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={preview} alt="썸네일 미리보기" className="w-full object-cover" style={{ maxHeight: 200 }} />
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow hover:bg-red-50 hover:text-red-600"
        >
          <RiDeleteBinLine className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "flex h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors",
        isDragging
          ? "border-indigo-400 bg-indigo-50"
          : "border-slate-300 bg-slate-50 hover:border-indigo-300 hover:bg-slate-100"
      )}
    >
      <RiUploadLine className="h-6 w-6 text-slate-400" />
      <p className="text-xs text-slate-500">
        이미지 드래그 또는 <span className="text-indigo-600 font-medium">클릭</span>
      </p>
      <p className="text-[11px] text-slate-400">JPG, PNG, WebP (최대 5MB)</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}

// ─── File Drop Zone ────────────────────────────────────────────────────────────

function FileDropZone({
  files,
  onAdd,
  onRemove,
}: {
  files: File[];
  onAdd: (files: File[]) => void;
  onRemove: (index: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    onAdd(Array.from(e.dataTransfer.files));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex h-24 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed transition-colors",
          isDragging
            ? "border-indigo-400 bg-indigo-50"
            : "border-slate-300 bg-slate-50 hover:border-indigo-300 hover:bg-slate-100"
        )}
      >
        <RiAttachmentLine className="h-5 w-5 text-slate-400" />
        <p className="text-xs text-slate-500">
          파일 드래그 또는 <span className="text-indigo-600 font-medium">클릭</span>하여 선택
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) onAdd(Array.from(e.target.files));
          }}
        />
      </div>

      {files.length > 0 && (
        <ul className="space-y-1">
          {files.map((file, i) => (
            <li key={i} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <RiAttachmentLine className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="truncate text-slate-700">{file.name}</span>
                <span className="shrink-0 text-slate-400">{formatSize(file.size)}</span>
              </div>
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="ml-2 shrink-0 text-slate-400 hover:text-red-500"
              >
                <RiCloseLine className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Related Links ────────────────────────────────────────────────────────────

type LinkItem = { label: string; url: string };

function RelatedLinks({
  links,
  onChange,
}: {
  links: LinkItem[];
  onChange: (links: LinkItem[]) => void;
}) {
  const update = (index: number, field: keyof LinkItem, value: string) => {
    const updated = links.map((l, i) =>
      i === index ? { ...l, [field]: value } : l
    );
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      {links.map((link, i) => (
        <div key={i} className="flex gap-2">
          <Input
            placeholder="링크 이름"
            value={link.label}
            onChange={(e) => update(i, "label", e.target.value)}
            className="w-28 shrink-0 h-8 text-xs"
          />
          <Input
            placeholder="https://..."
            value={link.url}
            onChange={(e) => update(i, "url", e.target.value)}
            className="flex-1 h-8 text-xs"
          />
          <button
            type="button"
            onClick={() => onChange(links.filter((_, idx) => idx !== i))}
            className="shrink-0 text-slate-400 hover:text-red-500"
          >
            <RiCloseLine className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...links, { label: "", url: "" }])}
        className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
      >
        <RiAddLine className="h-3.5 w-3.5" />
        링크 추가
      </button>
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({
  icon,
  title,
  children,
}: {
  icon?: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 flex items-center gap-1.5 text-[13px] font-semibold text-slate-700">
        {icon}
        {title}
      </h3>
      {children}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function NewPostContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  // Form state
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [relatedLinks, setRelatedLinks] = useState<LinkItem[]>([{ label: "", url: "" }]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [publishStart, setPublishStart] = useState("");
  const [publishEnd, setPublishEnd] = useState("");
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>(EXISTING_TAGS);
  const [showConsultButton, setShowConsultButton] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [showDraftList, setShowDraftList] = useState(false);
  const [draftList, setDraftList] = useState<StoredPost[]>([]);
  const [currentSession] = useState<AdminSession | null>(() => getSession());
  const skipSubCategoryReset = useRef(false);
  const loadedFromUrl = useRef(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [pendingNavHref, setPendingNavHref] = useState("");
  const skipDirtyRef = useRef(false);
  const dirtyTrackingEnabled = useRef(false);

  const [categoryMap, setCategoryMap] = useState<Record<string, string[]>>({});

  // Load categories from category store
  useEffect(() => {
    const cats = getCategories();
    const map: Record<string, string[]> = {};
    cats.forEach((c) => { map[c.name] = c.subCategories.map((s) => s.name); });
    setCategoryMap(map);
  }, []);

  const subCategories = category ? categoryMap[category] ?? [] : [];

  // Load all tags (hardcoded + previously saved posts) for autocomplete
  useEffect(() => {
    const saved = getAllTags();
    const merged = Array.from(new Set([...EXISTING_TAGS, ...saved]));
    setAvailableTags(merged);
  }, []);

  // Reset subCategory when category changes (skip when loading a draft)
  useEffect(() => {
    if (skipSubCategoryReset.current) {
      skipSubCategoryReset.current = false;
      return;
    }
    setSubCategory("");
  }, [category]);

  // TipTap editor — immediatelyRender:false prevents SSR hydration mismatch
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "본문 내용을 입력하세요..." }),
      Link.configure({ openOnClick: false }),
      Youtube.configure({ controls: true, nocookie: true }),
      Image.configure({ inline: false, allowBase64: true }),
      TextStyle,
      Color,
    ],
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[400px] px-4 py-3 focus:outline-none",
      },
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
    onUpdate: () => {
      if (!skipDirtyRef.current && dirtyTrackingEnabled.current) setIsDirty(true);
    },
  });

  // Thumbnail handlers
  const handleThumbnailUpload = useCallback((file: File) => {
    setThumbnail(file);
    const reader = new FileReader();
    reader.onloadend = () => setThumbnailPreview(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleThumbnailRemove = useCallback(() => {
    setThumbnail(null);
    setThumbnailPreview("");
  }, []);

  // File handlers
  const handleFilesAdd = useCallback((newFiles: File[]) => {
    setAttachments((prev) => [...prev, ...newFiles]);
  }, []);

  const handleFileRemove = useCallback((index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const refreshDraftList = useCallback(() => {
    const session = getSession();
    setDraftList(getDrafts().filter((d) => d.authorId === session?.adminId));
  }, []);

  const readFilesAsDataUrl = async (files: File[]) =>
    Promise.all(
      files.map(
        (f) =>
          new Promise<{ name: string; size: number; dataUrl: string }>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () =>
              resolve({ name: f.name, size: f.size, dataUrl: reader.result as string });
            reader.onerror = () =>
              resolve({ name: f.name, size: f.size, dataUrl: "" });
            reader.readAsDataURL(f);
          })
      )
    );

  const loadPostIntoForm = useCallback(
    (post: StoredPost) => {
      skipDirtyRef.current = true;
      skipSubCategoryReset.current = true;
      setTitle(post.title);
      setCategory(post.category);
      setSubCategory(post.subCategory);
      setThumbnailPreview(post.thumbnailPreview);
      setRelatedLinks(
        post.relatedLinks.length > 0 ? post.relatedLinks : [{ label: "", url: "" }]
      );
      setTags(post.tags);
      setShowConsultButton(post.showConsultButton ?? false);
      setPublishStart(post.publishStart);
      setPublishEnd(post.publishEnd);
      setIsScheduled(post.isScheduled);
      setScheduledAt(post.scheduledAt);
      setScheduledTime(post.scheduledAt?.includes("T") ? post.scheduledAt.split("T")[1].substring(0, 5) : "");
      setCurrentDraftId(post.id);
      if (editor) editor.commands.setContent(post.body || "");
      setIsDirty(false);
      setShowDraftList(false);
    },
    [editor]
  );

  // Load draft list on mount
  useEffect(() => {
    refreshDraftList();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load post from URL ?id= when editor is ready
  useEffect(() => {
    if (editor && !loadedFromUrl.current) {
      loadedFromUrl.current = true;
      const postId = searchParams.get("id");
      if (postId) {
        const post = getPost(postId);
        if (post) loadPostIntoForm(post);
      }
    }
  }, [editor]); // eslint-disable-line react-hooks/exhaustive-deps

  // Enable dirty tracking after editor is ready.
  // Using setTimeout(0) so it fires after the current render cycle,
  // which correctly handles React Strict Mode double-mount.
  useEffect(() => {
    if (!editor) return;
    const t = setTimeout(() => {
      skipDirtyRef.current = false;
      dirtyTrackingEnabled.current = true;
    }, 0);
    return () => {
      clearTimeout(t);
      dirtyTrackingEnabled.current = false;
    };
  }, [editor]);

  // Dirty tracking: only fires after dirtyTrackingEnabled is set
  useEffect(() => {
    if (!dirtyTrackingEnabled.current) return;
    if (skipDirtyRef.current) {
      skipDirtyRef.current = false;
      return;
    }
    setIsDirty(true);
  }, [title, category, subCategory, thumbnailPreview, relatedLinks, attachments, publishStart, publishEnd, isScheduled, scheduledAt, scheduledTime, tags, showConsultButton]); // eslint-disable-line react-hooks/exhaustive-deps

  // publishStart가 오늘보다 1일 이상 미래이면 업로드 예약 토글 자동 활성화
  useEffect(() => {
    if (!publishStart) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(publishStart + "T00:00:00");
    const diffDays = Math.floor((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays >= 1) {
      setIsScheduled(true);
    }
  }, [publishStart]);

  // Warn on browser close/refresh when dirty
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // Intercept in-app link clicks when dirty
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!isDirty) return;
      const anchor = (e.target as Element).closest("a[href]");
      if (!anchor) return;
      const href = anchor.getAttribute("href") ?? "";
      if (!href || href.startsWith("#") || href.startsWith("http://") || href.startsWith("https://")) return;
      e.preventDefault();
      e.stopPropagation();
      setPendingNavHref(href);
      setShowLeaveModal(true);
    };
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [isDirty]);

  // Validation
  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "제목을 입력해주세요.";
    if (!editor?.getText().trim()) errs.body = "본문 내용을 입력해주세요.";
    if (!category) errs.category = "카테고리를 선택해주세요.";
    if (subCategories.length > 0 && !subCategory) errs.subCategory = "세부카테고리를 선택해주세요.";
    if (!thumbnail && !thumbnailPreview) errs.thumbnail = "썸네일 이미지를 등록해주세요.";
    if (!publishStart) errs.publishPeriod = "시작일을 설정해주세요.";
    if (isScheduled && !scheduledTime) errs.scheduledAt = "예약 시간을 입력해주세요.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleDraft = async () => {
    try {
      const [compressedThumbnail, attachmentsData] = await Promise.all([
        compressImageForStorage(thumbnailPreview),
        readFilesAsDataUrl(attachments),
      ]);
      const _session = getSession();
      const finalScheduledAt = isScheduled && publishStart && scheduledTime ? `${publishStart}T${scheduledTime}` : "";
      const saved = upsertPost({
        id: currentDraftId,
        title: title || "제목 없음",
        body: editor?.getHTML() ?? "",
        category,
        subCategory,
        thumbnailPreview: compressedThumbnail,
        relatedLinks,
        attachments: attachmentsData,
        tags,
        showConsultButton,
        publishStart,
        publishEnd,
        isScheduled,
        scheduledAt: finalScheduledAt,
        status: "DRAFT",
        authorId: _session?.adminId,
        authorName: _session?.name,
      });
      setCurrentDraftId(saved.id);
      if (compressedThumbnail !== thumbnailPreview) setThumbnailPreview(compressedThumbnail);
      refreshDraftList();
      setIsDirty(false);
      showToast("임시저장되었습니다.");
    } catch {
      alert("저장 공간이 부족합니다. 다른 임시저장 항목을 삭제한 후 다시 시도해주세요.");
    }
  };

  const handlePublish = async () => {
    if (!validate()) return;
    try {
      const [compressedThumbnail, attachmentsData] = await Promise.all([
        compressImageForStorage(thumbnailPreview),
        readFilesAsDataUrl(attachments),
      ]);
      const _session = getSession();
      const finalScheduledAt = isScheduled && publishStart && scheduledTime ? `${publishStart}T${scheduledTime}` : "";
      const saved = upsertPost({
        id: currentDraftId,
        title,
        body: editor?.getHTML() ?? "",
        category,
        subCategory,
        thumbnailPreview: compressedThumbnail,
        relatedLinks,
        attachments: attachmentsData,
        tags,
        showConsultButton,
        publishStart,
        publishEnd,
        isScheduled,
        scheduledAt: finalScheduledAt,
        status: isScheduled ? "SCHEDULED" : "PUBLISHED",
        authorId: _session?.adminId,
        authorName: _session?.name,
      });
      const isNew = !currentDraftId;
      recordLog(isNew ? "POST_CREATE" : "POST_UPDATE", `게시물 ${isScheduled ? "예약" : isNew ? "게시" : "수정"}: ${title}`, { targetType: "post", targetId: saved.id });
      setIsDirty(false);
      showToast(isScheduled ? "콘텐츠가 예약되었습니다." : "콘텐츠가 게시되었습니다.");
      router.push(`/posts/${saved.id}`);
    } catch {
      alert("저장 공간이 부족합니다. 다른 임시저장 항목을 삭제한 후 다시 시도해주세요.");
    }
  };

  const handleSaveAndLeave = async () => {
    setShowLeaveModal(false);
    await handleDraft();
    router.push(pendingNavHref);
  };

  const handleLeaveWithoutSave = () => {
    setShowLeaveModal(false);
    setIsDirty(false);
    router.push(pendingNavHref);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Page Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">콘텐츠 작성</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            콘텐츠를 작성하고 공개 일정을 설정합니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { refreshDraftList(); setShowDraftList(true); }}
          >
            <RiFileTextLine className="mr-1.5 h-4 w-4" />
            임시저장 목록
            {draftList.length > 0 && (
              <span className="ml-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white">
                {draftList.length}
              </span>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDraft}>
            <RiSave3Line className="mr-1.5 h-4 w-4" />
            임시저장
          </Button>
          <Button size="sm" onClick={handlePublish} className="bg-indigo-600 hover:bg-indigo-700">
            <RiSendPlaneLine className="mr-1.5 h-4 w-4" />
            게시하기
          </Button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-1 gap-5 min-h-0">
        {/* Left: Main content */}
        <div className="flex flex-1 flex-col gap-4 min-w-0">
          {/* Title */}
          <div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요 *"
              className={cn(
                "w-full rounded-xl border bg-white px-4 py-3 text-[18px] font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 shadow-sm transition-colors",
                errors.title
                  ? "border-red-400 focus:ring-red-400"
                  : "border-slate-200 focus:border-indigo-400 focus:ring-indigo-400"
              )}
            />
            {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
          </div>

          {/* Rich Text Editor */}
          <div className="flex-1">
            <div
              className={cn(
                "rounded-xl border bg-white shadow-sm overflow-hidden",
                errors.body ? "border-red-400" : "border-slate-200"
              )}
            >
              <EditorToolbar editor={editor} />
              <EditorContent editor={editor} className="min-h-[400px]" />
            </div>
            {errors.body && <p className="mt-1 text-xs text-red-500">{errors.body}</p>}
          </div>

          {/* Tags */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <Label className="mb-2 block text-[13px] font-semibold text-slate-700">
              태그 <span className="font-normal text-slate-400">(선택)</span>
            </Label>
            <TagInput tags={tags} onChange={setTags} availableTags={availableTags} />
            <p className="mt-1.5 text-[11px] text-slate-400">
              Enter 또는 Space로 태그를 추가합니다. 기존 태그는 자동완성으로 표시됩니다.
            </p>
          </div>
        </div>

        {/* Right: Settings panel */}
        <div className="w-[320px] shrink-0 flex flex-col gap-4 overflow-y-auto pb-4">
          {/* 공개 설정 */}
          <SectionCard icon={<RiCalendarLine className="h-4 w-4 text-slate-400" />} title="공개 설정">
            <div className="space-y-3">
              <div>
                <Label className="mb-1.5 block text-xs text-slate-600">
                  업로드 기간 <span className="text-red-500">*</span>
                </Label>
                {/* 시작일 */}
                <div className="mb-1.5">
                  <input
                    type="date"
                    value={publishStart}
                    onChange={(e) => setPublishStart(e.target.value)}
                    className={cn(
                      "w-full rounded-lg border px-2 py-1.5 text-xs focus:outline-none focus:ring-1",
                      errors.publishPeriod
                        ? "border-red-400 focus:ring-red-400"
                        : "border-slate-200 focus:border-indigo-400 focus:ring-indigo-400"
                    )}
                  />
                </div>
                {/* 종료일 */}
                <div className="flex items-center gap-1.5">
                  <span className="shrink-0 text-xs text-slate-400">~</span>
                  <input
                    type="date"
                    value={publishEnd}
                    onChange={(e) => setPublishEnd(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  />
                  {publishEnd && (
                    <button
                      type="button"
                      onClick={() => setPublishEnd("")}
                      className="shrink-0 text-slate-400 hover:text-slate-600"
                      title="종료일 삭제"
                    >
                      <RiCloseLine className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                {/* 안내 문구 */}
                <p className="mt-1.5 text-[11px] text-slate-400">
                  {publishEnd
                    ? `종료일(${publishEnd}) 00:00까지 게시됩니다.`
                    : "종료일 미설정 시 계속 게시됩니다."}
                </p>
                {errors.publishPeriod && (
                  <p className="mt-1 text-xs text-red-500">{errors.publishPeriod}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-slate-600">
                    업로드 예약 <span className="text-slate-400">(선택)</span>
                  </Label>
                  <button
                    type="button"
                    onClick={() => setIsScheduled(!isScheduled)}
                    className={cn(
                      "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                      isScheduled ? "bg-indigo-600" : "bg-slate-200"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                        isScheduled ? "translate-x-4" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>
                {isScheduled && (
                  <div className="mt-2 space-y-1.5">
                    {/* 날짜: publishStart에서 자동 설정 (읽기 전용) */}
                    <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-1.5 text-xs text-slate-500">
                      <span className="shrink-0">날짜</span>
                      <span className="font-medium text-slate-700">
                        {publishStart || "시작일을 먼저 입력해주세요"}
                      </span>
                    </div>
                    {/* 시간: 직접 입력 */}
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => { setScheduledTime(e.target.value); setErrors((p) => ({ ...p, scheduledAt: "" })); }}
                      className={cn(
                        "w-full rounded-lg border px-2 py-1.5 text-xs focus:outline-none focus:ring-1",
                        errors.scheduledAt
                          ? "border-red-400 focus:ring-red-400"
                          : "border-slate-200 focus:border-indigo-400 focus:ring-indigo-400"
                      )}
                    />
                    {errors.scheduledAt && (
                      <p className="mt-1 text-xs text-red-500">{errors.scheduledAt}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </SectionCard>

          {/* 분류 */}
          <SectionCard icon={<RiFolderLine className="h-4 w-4 text-slate-400" />} title="분류">
            <div className="space-y-2">
              <div>
                <Label className="mb-1.5 block text-xs text-slate-600">
                  카테고리 <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={cn(
                      "w-full appearance-none rounded-lg border bg-white px-3 py-1.5 pr-8 text-sm focus:outline-none focus:ring-1",
                      errors.category
                        ? "border-red-400 focus:ring-red-400 text-slate-900"
                        : "border-slate-200 focus:border-indigo-400 focus:ring-indigo-400 text-slate-900",
                      !category && "text-slate-400"
                    )}
                  >
                    <option value="" className="text-slate-400">카테고리 선택</option>
                    {Object.keys(categoryMap).map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <RiArrowDownSLine className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
                {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category}</p>}
              </div>

              <div>
                <Label className="mb-1.5 block text-xs text-slate-600">
                  세부카테고리 <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <select
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    disabled={!category}
                    className={cn(
                      "w-full appearance-none rounded-lg border bg-white px-3 py-1.5 pr-8 text-sm focus:outline-none focus:ring-1 disabled:cursor-not-allowed disabled:opacity-50",
                      errors.subCategory
                        ? "border-red-400 focus:ring-red-400"
                        : "border-slate-200 focus:border-indigo-400 focus:ring-indigo-400",
                      !subCategory && "text-slate-400"
                    )}
                  >
                    <option value="">{category ? "세부카테고리 선택" : "카테고리를 먼저 선택"}</option>
                    {subCategories.map((sub) => (
                      <option key={sub} value={sub} className="text-slate-900">{sub}</option>
                    ))}
                  </select>
                  <RiArrowDownSLine className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
                {errors.subCategory && <p className="mt-1 text-xs text-red-500">{errors.subCategory}</p>}
              </div>
            </div>
          </SectionCard>

          {/* 미디어 */}
          <SectionCard icon={<RiImageLine className="h-4 w-4 text-slate-400" />} title="미디어">
            <div>
              <Label className="mb-1.5 block text-xs text-slate-600">
                썸네일 <span className="text-red-500">*</span>
              </Label>
              <ThumbnailUpload
                preview={thumbnailPreview}
                onUpload={handleThumbnailUpload}
                onRemove={handleThumbnailRemove}
              />
              {errors.thumbnail && (
                <p className="mt-1 text-xs text-red-500">{errors.thumbnail}</p>
              )}
            </div>
          </SectionCard>

          {/* 상담 설정 */}
          <SectionCard icon={<RiCustomerService2Line className="h-4 w-4 text-slate-400" />} title="상담 설정">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-700">상담 문의 버튼 노출</p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  사용자에게 '상담 문의하기' 버튼을 표시합니다.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowConsultButton(!showConsultButton)}
                className={cn(
                  "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                  showConsultButton ? "bg-indigo-600" : "bg-slate-200"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                    showConsultButton ? "translate-x-4" : "translate-x-0"
                  )}
                />
              </button>
            </div>
          </SectionCard>

          {/* 첨부 */}
          <SectionCard icon={<RiAttachmentLine className="h-4 w-4 text-slate-400" />} title="첨부 (선택)">
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block text-xs text-slate-600">관련 링크</Label>
                <RelatedLinks links={relatedLinks} onChange={setRelatedLinks} />
              </div>
              <div>
                <Label className="mb-2 block text-xs text-slate-600">파일 첨부</Label>
                <FileDropZone
                  files={attachments}
                  onAdd={handleFilesAdd}
                  onRemove={handleFileRemove}
                />
              </div>
            </div>
          </SectionCard>
        </div>
      </div>

      {/* Leave Confirmation Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100">
                <RiSave3Line className="h-4 w-4 text-amber-600" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">
                저장하지 않은 내용이 있어요
              </h3>
            </div>
            <p className="mb-5 pl-12 text-sm text-slate-500">
              작성 중인 내용을 임시저장하고 이동하시겠어요?
            </p>
            <div className="flex flex-col gap-2">
              <Button
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                onClick={handleSaveAndLeave}
              >
                <RiSave3Line className="mr-2 h-4 w-4" />
                임시저장 후 이동
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleLeaveWithoutSave}
              >
                저장하지 않고 이동
              </Button>
              <button
                type="button"
                onClick={() => setShowLeaveModal(false)}
                className="py-1 text-sm text-slate-400 hover:text-slate-600"
              >
                계속 작성하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Draft List Sheet */}
      <Sheet open={showDraftList} onOpenChange={setShowDraftList}>
        <SheetContent side="right" className="flex w-[360px] flex-col p-0">
          <SheetHeader className="border-b px-5 py-4">
            <SheetTitle className="text-base">임시저장 목록</SheetTitle>
            <SheetDescription>
              {draftList.length > 0
                ? `저장된 임시 콘텐츠 ${draftList.length}개`
                : "임시저장된 콘텐츠가 없습니다"}
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto">
            {draftList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <RiFileTextLine className="mb-3 h-10 w-10 opacity-30" />
                <p className="text-sm">아직 임시저장된 콘텐츠가 없어요</p>
                <p className="mt-1 text-xs text-slate-300">
                  작성 중에 &apos;임시저장&apos; 버튼을 눌러보세요
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {draftList.map((draft) => (
                  <div
                    key={draft.id}
                    className="px-5 py-4 transition-colors hover:bg-slate-50"
                  >
                    <div className="mb-1.5 flex items-start justify-between gap-2">
                      <p className="line-clamp-2 flex-1 text-sm font-medium text-slate-800">
                        {draft.title}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          recordLog("POST_DELETE", `임시저장 삭제: ${draft.title}`, { targetType: "post", targetId: draft.id });
                          deletePost(draft.id);
                          if (currentDraftId === draft.id) setCurrentDraftId(null);
                          refreshDraftList();
                        }}
                        className="mt-0.5 shrink-0 text-slate-300 transition-colors hover:text-red-400"
                        title="삭제"
                      >
                        <RiDeleteBinLine className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="mb-3 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                      {draft.category && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">
                          {draft.category}
                          {draft.subCategory ? ` · ${draft.subCategory}` : ""}
                        </span>
                      )}
                      <span>
                        {new Date(draft.updatedAt).toLocaleString("ko-KR", {
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 w-full text-xs"
                      onClick={() => loadPostIntoForm(draft)}
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
    </div>
  );
}

function NewPostWithKey() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "new";
  // key가 바뀌면 NewPostContent 전체를 재마운트 → 이전 수정 내용이 남지 않음
  return <NewPostContent key={id} />;
}

export default function NewPostPage() {
  return (
    <Suspense>
      <NewPostWithKey />
    </Suspense>
  );
}
