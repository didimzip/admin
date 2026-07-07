"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/lib/toast-context";
import {
  GripVertical, Plus, ChevronRight, FolderOpen, Tag,
  Save, RotateCcw, TriangleAlert, Eye, EyeOff, X, Search,
} from "lucide-react";
import { CategoryIcon, loadAllRiIconNames } from "@/lib/category-icons";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import {
  getCategories,
  saveCategories,
  type Category,
  type SubCategory,
} from "@/lib/category-store";
import { recordLog } from "@/lib/audit-log-store";
import { getAllPosts } from "@/lib/post-store";
import { mockPosts } from "@/data/mock-data";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Sortable row components                                             */
/* ------------------------------------------------------------------ */

function SortableCatItem({
  cat,
  isSelected,
  editingCatId,
  editingName,
  onSelect,
  onEditNameChange,
  onCommit,
  onCancelEdit,
  onStartEdit,
  onDelete,
  onOpenIconPicker,
  onToggleVisible,
}: {
  cat: Category;
  isSelected: boolean;
  editingCatId: string | null;
  editingName: string;
  onSelect: () => void;
  onEditNameChange: (v: string) => void;
  onCommit: (id: string) => void;
  onCancelEdit: () => void;
  onStartEdit: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onOpenIconPicker: (id: string) => void;
  onToggleVisible: (id: string) => void;
}) {
  const isEditing = editingCatId === cat.id;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: cat.id, disabled: isEditing });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => !isEditing && onSelect()}
      className={cn(
        "group flex items-center gap-2 border-b border-slate-50 px-4 py-2.5 cursor-pointer transition-colors select-none",
        isSelected
          ? "bg-indigo-50 border-l-[3px] border-l-indigo-500"
          : "border-l-[3px] border-l-transparent hover:bg-slate-50",
      )}
    >
      <span
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none text-slate-300 hover:text-slate-400"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-4 w-4 shrink-0" />
      </span>

      {/* 아이콘 (클릭 시 아이콘 선택기) */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onOpenIconPicker(cat.id); }}
        title="아이콘 변경"
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition-colors",
          isSelected
            ? "border-indigo-200 bg-white text-indigo-600 hover:border-indigo-300"
            : "border-slate-200 bg-white text-slate-500 hover:border-indigo-300 hover:text-indigo-600",
          !cat.isVisible && "opacity-40",
        )}
      >
        <CategoryIcon iconName={cat.iconName} size={16} />
      </button>

      {isEditing ? (
        <input
          autoFocus
          value={editingName}
          onChange={(e) => onEditNameChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) onCommit(cat.id);
            if (e.key === "Escape") onCancelEdit();
          }}
          onBlur={() => onCommit(cat.id)}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 rounded border border-indigo-300 bg-white px-2 py-0.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />
      ) : (
        <span
          onDoubleClick={(e) => { e.stopPropagation(); onStartEdit(cat.id, cat.name); }}
          className={cn(
            "flex-1 text-sm font-medium",
            isSelected ? "text-indigo-700" : "text-slate-700",
            !cat.isVisible && "text-slate-400 line-through decoration-slate-300",
          )}
        >
          {cat.name}
        </span>
      )}

      {/* 노출 토글 */}
      {!isEditing && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleVisible(cat.id); }}
          title={cat.isVisible ? "노출 중 (클릭 시 숨김)" : "숨김 (클릭 시 노출)"}
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded transition-colors",
            cat.isVisible
              ? "text-indigo-500 hover:bg-indigo-50"
              : "text-slate-300 hover:bg-slate-100",
          )}
        >
          {cat.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
      )}

      {!isEditing && cat.subCategories.length > 0 && (
        <span className="text-[11px] text-slate-400 tabular-nums">
          {cat.subCategories.length}개
        </span>
      )}
      {!isEditing && (
        <ChevronRight
          className={cn(
            "h-4 w-4 shrink-0 transition-colors",
            isSelected ? "text-indigo-400" : "text-slate-300 group-hover:text-slate-400",
          )}
        />
      )}

      {/* 수정 / 삭제 버튼 */}
      <div
        className="flex items-center gap-1 overflow-hidden max-w-0 opacity-0 group-hover:max-w-[84px] group-hover:opacity-100 transition-all duration-200 shrink-0 whitespace-nowrap"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => onStartEdit(cat.id, cat.name)}
          className="rounded px-2 py-1 text-xs font-medium text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
        >
          수정
        </button>
        <button
          onClick={() => onDelete(cat.id)}
          className="rounded px-2 py-1 text-xs font-medium text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
        >
          삭제
        </button>
      </div>
    </div>
  );
}

function SortableSubItem({
  sub,
  editingSubId,
  editingName,
  onEditNameChange,
  onCommit,
  onCancelEdit,
  onStartEdit,
  onDelete,
}: {
  sub: SubCategory;
  editingSubId: string | null;
  editingName: string;
  onEditNameChange: (v: string) => void;
  onCommit: (id: string) => void;
  onCancelEdit: () => void;
  onStartEdit: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}) {
  const isEditing = editingSubId === sub.id;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: sub.id, disabled: isEditing });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex items-center gap-2 border-b border-slate-50 px-4 py-2.5 transition-colors select-none hover:bg-slate-50"
    >
      <span
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none text-slate-300 hover:text-slate-400"
      >
        <GripVertical className="h-4 w-4 shrink-0" />
      </span>

      {isEditing ? (
        <input
          autoFocus
          value={editingName}
          onChange={(e) => onEditNameChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) onCommit(sub.id);
            if (e.key === "Escape") onCancelEdit();
          }}
          onBlur={() => onCommit(sub.id)}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 rounded border border-indigo-300 bg-white px-2 py-0.5 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />
      ) : (
        <span
          onDoubleClick={() => onStartEdit(sub.id, sub.name)}
          className="flex-1 text-sm text-slate-700"
        >
          {sub.name}
        </span>
      )}

      <div className="flex items-center gap-1 overflow-hidden max-w-0 opacity-0 group-hover:max-w-[84px] group-hover:opacity-100 transition-all duration-200 shrink-0 whitespace-nowrap">
        <button
          onClick={() => onStartEdit(sub.id, sub.name)}
          className="rounded px-2 py-1 text-xs font-medium text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
        >
          수정
        </button>
        <button
          onClick={() => onDelete(sub.id)}
          className="rounded px-2 py-1 text-xs font-medium text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
        >
          삭제
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default function CategoriesPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const savedRef = useRef<Category[]>([]);

  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [newCatName, setNewCatName] = useState("");
  const [newSubName, setNewSubName] = useState("");
  const [iconPickerCatId, setIconPickerCatId] = useState<string | null>(null);
  const [iconQuery, setIconQuery] = useState("");
  const [allIconNames, setAllIconNames] = useState<string[]>([]);

  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  // active drag id for overlay
  const [activeCatId, setActiveCatId] = useState<string | null>(null);
  const [activeSubId, setActiveSubId] = useState<string | null>(null);

  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [pendingNavHref, setPendingNavHref] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    let alive = true;
    getCategories().then((loaded) => {
      if (!alive) return;
      setCategories(loaded);
      savedRef.current = loaded;
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

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

  const update = (cats: Category[]) => { setCategories(cats); setIsDirty(true); };

  const toggleVisible = (id: string) => {
    update(categories.map((c) => (c.id === id ? { ...c, isVisible: !c.isVisible } : c)));
  };
  const changeIcon = (id: string, iconName: string) => {
    update(categories.map((c) => (c.id === id ? { ...c, iconName } : c)));
    setIconPickerCatId(null);
  };
  const iconPickerCat = iconPickerCatId ? categories.find((c) => c.id === iconPickerCatId) : null;

  // 피커 열릴 때 전체 아이콘 이름 lazy 로드(1회) + 검색어 초기화
  useEffect(() => {
    if (!iconPickerCatId) return;
    setIconQuery("");
    if (allIconNames.length === 0) {
      loadAllRiIconNames().then(setAllIconNames);
    }
  }, [iconPickerCatId, allIconNames.length]);

  const ICON_RESULT_LIMIT = 120;
  const filteredIconNames = useMemo(() => {
    const q = iconQuery.trim().toLowerCase();
    const base = q ? allIconNames.filter((n) => n.toLowerCase().includes(q)) : allIconNames;
    return base;
  }, [iconQuery, allIconNames]);

  const handleSave = async () => {
    const saved = await saveCategories(categories);
    setCategories(saved);
    savedRef.current = saved;
    setIsDirty(false);
    setSavedAt(new Date());
    showToast("카테고리가 저장되었습니다.");
  };

  const handleReset = () => {
    if (!confirm("저장하지 않은 변경 사항을 모두 취소하시겠습니까?")) return;
    setCategories(savedRef.current);
    setIsDirty(false);
    setSelectedCatId(null);
    showToast("변경 사항이 취소되었습니다.");
  };

  const handleSaveAndLeave = () => { handleSave(); setShowLeaveModal(false); router.push(pendingNavHref); };
  const handleLeaveWithoutSave = () => { setIsDirty(false); setShowLeaveModal(false); router.push(pendingNavHref); };

  const selectedCat = categories.find((c) => c.id === selectedCatId) ?? null;

  /* ── DnD handlers — categories ── */
  const handleCatDragStart = (e: DragStartEvent) => setActiveCatId(String(e.active.id));
  const handleCatDragEnd = (e: DragEndEvent) => {
    setActiveCatId(null);
    const { active, over } = e;
    if (over && active.id !== over.id) {
      const oldIdx = categories.findIndex((c) => c.id === active.id);
      const newIdx = categories.findIndex((c) => c.id === over.id);
      const name = categories[oldIdx]?.name ?? String(active.id);
      update(arrayMove(categories, oldIdx, newIdx));
      recordLog("CATEGORY_UPDATE", `카테고리 순서 변경: "${name}" (${oldIdx + 1}번 → ${newIdx + 1}번)`, { targetType: "category", targetId: String(active.id) });
    }
  };

  /* ── DnD handlers — subcategories ── */
  const handleSubDragStart = (e: DragStartEvent) => setActiveSubId(String(e.active.id));
  const handleSubDragEnd = (e: DragEndEvent) => {
    setActiveSubId(null);
    if (!selectedCatId) return;
    const { active, over } = e;
    if (over && active.id !== over.id) {
      const subs = selectedCat!.subCategories;
      const oldIdx = subs.findIndex((s) => s.id === active.id);
      const newIdx = subs.findIndex((s) => s.id === over.id);
      const parentName = categories.find((c) => c.id === selectedCatId)?.name ?? selectedCatId;
      const subName = subs[oldIdx]?.name ?? String(active.id);
      update(categories.map((c) =>
        c.id === selectedCatId ? { ...c, subCategories: arrayMove(subs, oldIdx, newIdx) } : c,
      ));
      recordLog("CATEGORY_UPDATE", `세부 카테고리 순서 변경: ${parentName} > "${subName}" (${oldIdx + 1}번 → ${newIdx + 1}번)`, { targetType: "subCategory", targetId: String(active.id) });
    }
  };

  /* ── Category actions ── */
  const addCategory = () => {
    const name = newCatName.trim();
    if (!name) return;
    if (categories.some((c) => c.name === name)) {
      showToast(`"${name}" 카테고리가 이미 존재합니다.`, "error");
      return;
    }
    const newCat: Category = {
      id: `cat_${Date.now()}`,
      name,
      slug: "",
      iconName: "RiFolderLine",
      isVisible: true,
      subCategories: [],
    };
    update([...categories, newCat]);
    setNewCatName("");
    setSelectedCatId(newCat.id);
    recordLog("CATEGORY_CREATE", `카테고리 추가: ${name}`, { targetType: "category", targetId: newCat.id });
  };

  const deleteCategory = async (id: string) => {
    const name = categories.find((c) => c.id === id)?.name ?? id;
    // 해당 카테고리를 사용 중인 게시물이 있는지 확인
    const storePosts = await getAllPosts();
    const storeCount = storePosts.filter((p) => p.category === name).length;
    const mockCount = mockPosts.filter((p) => p.category === name).length;
    const totalCount = storeCount + mockCount;
    if (totalCount > 0) {
      showToast(`"${name}" 카테고리에 ${totalCount}개의 콘텐츠가 있어 삭제할 수 없습니다. 먼저 해당 콘텐츠의 카테고리를 변경해주세요.`, "error");
      return;
    }
    if (!confirm("카테고리를 삭제하면 세부 카테고리도 함께 삭제됩니다. 삭제하시겠습니까?")) return;
    update(categories.filter((c) => c.id !== id));
    if (selectedCatId === id) setSelectedCatId(null);
    recordLog("CATEGORY_DELETE", `카테고리 삭제: ${name}`, { targetType: "category", targetId: id });
  };

  /* ── Subcategory actions ── */
  const addSubCategory = () => {
    const name = newSubName.trim();
    if (!name || !selectedCatId) return;
    const newSub: SubCategory = { id: `sub_${Date.now()}`, name, slug: "" };
    const parentName = categories.find((c) => c.id === selectedCatId)?.name ?? selectedCatId;
    update(categories.map((c) =>
      c.id === selectedCatId ? { ...c, subCategories: [...c.subCategories, newSub] } : c,
    ));
    setNewSubName("");
    recordLog("CATEGORY_CREATE", `세부 카테고리 추가: ${parentName} > ${name}`, { targetType: "subCategory", targetId: newSub.id });
  };

  const deleteSubCategory = (subId: string) => {
    if (!selectedCatId) return;
    const parentName = categories.find((c) => c.id === selectedCatId)?.name ?? selectedCatId;
    const subName = selectedCat?.subCategories.find((s) => s.id === subId)?.name ?? subId;
    update(categories.map((c) =>
      c.id === selectedCatId
        ? { ...c, subCategories: c.subCategories.filter((s) => s.id !== subId) }
        : c,
    ));
    recordLog("CATEGORY_DELETE", `세부 카테고리 삭제: ${parentName} > ${subName}`, { targetType: "subCategory", targetId: subId });
  };

  /* ── Inline rename ── */
  const startCatEdit = (id: string, name: string) => { setEditingCatId(id); setEditingName(name); };
  const commitCatRename = (id: string) => {
    const name = editingName.trim();
    const original = categories.find((c) => c.id === id)?.name ?? "";
    if (name && name !== original) {
      if (categories.some((c) => c.id !== id && c.name === name)) {
        showToast(`"${name}" 카테고리가 이미 존재합니다.`, "error");
        setEditingCatId(null); setEditingName("");
        return;
      }
      update(categories.map((c) => (c.id === id ? { ...c, name } : c)));
      recordLog("CATEGORY_UPDATE", `카테고리 이름 변경: "${original}" → "${name}"`, { targetType: "category", targetId: id });
    }
    setEditingCatId(null); setEditingName("");
  };

  const startSubEdit = (id: string, name: string) => { setEditingSubId(id); setEditingName(name); };
  const commitSubRename = (subId: string) => {
    const name = editingName.trim();
    const original = selectedCat?.subCategories.find((s) => s.id === subId)?.name ?? "";
    if (name && name !== original && selectedCatId) {
      const parentName = categories.find((c) => c.id === selectedCatId)?.name ?? selectedCatId;
      update(categories.map((c) =>
        c.id === selectedCatId
          ? { ...c, subCategories: c.subCategories.map((s) => (s.id === subId ? { ...s, name } : s)) }
          : c,
      ));
      recordLog("CATEGORY_UPDATE", `세부 카테고리 이름 변경: ${parentName} > "${original}" → "${name}"`, { targetType: "subCategory", targetId: subId });
    }
    setEditingSubId(null); setEditingName("");
  };

  const cancelEdit = () => { setEditingCatId(null); setEditingSubId(null); setEditingName(""); };

  const activeCat = activeCatId ? categories.find((c) => c.id === activeCatId) : null;
  const activeSub = activeSubId ? selectedCat?.subCategories.find((s) => s.id === activeSubId) : null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">카테고리 관리</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            콘텐츠 카테고리와 세부 카테고리를 관리합니다. 드래그하여 순서를 변경할 수 있습니다.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {savedAt && !isDirty && (
            <span className="text-xs text-slate-400">
              {savedAt.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })} 저장됨
            </span>
          )}
          {isDirty && <span className="text-xs text-amber-500 font-medium">저장되지 않은 변경사항</span>}
          <Button variant="outline" size="sm" onClick={handleReset} disabled={!isDirty} className="text-slate-500">
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> 취소
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!isDirty} className="bg-indigo-600 hover:bg-indigo-700">
            <Save className="mr-1.5 h-3.5 w-3.5" /> 저장
          </Button>
        </div>
      </div>

      {/* Two-column panels */}
      <div className="grid grid-cols-2 gap-5">

        {/* ── Left: Categories ── */}
        <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3.5">
            <FolderOpen className="h-4 w-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-800">카테고리</h3>
            <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{categories.length}</span>
            <span className="ml-auto text-xs text-slate-400">클릭하여 세부 카테고리 편집</span>
          </div>

          <div className="flex-1 min-h-[240px]">
            {categories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-slate-400">
                <FolderOpen className="mb-2 h-7 w-7 opacity-25" />
                <p className="text-sm">카테고리가 없습니다.</p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleCatDragStart}
                onDragEnd={handleCatDragEnd}
              >
                <SortableContext items={categories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                  {categories.map((cat) => (
                    <SortableCatItem
                      key={cat.id}
                      cat={cat}
                      isSelected={selectedCatId === cat.id}
                      editingCatId={editingCatId}
                      editingName={editingName}
                      onSelect={() => setSelectedCatId(selectedCatId === cat.id ? null : cat.id)}
                      onEditNameChange={setEditingName}
                      onCommit={commitCatRename}
                      onCancelEdit={cancelEdit}
                      onStartEdit={startCatEdit}
                      onDelete={deleteCategory}
                      onOpenIconPicker={setIconPickerCatId}
                      onToggleVisible={toggleVisible}
                    />
                  ))}
                </SortableContext>
                <DragOverlay>
                  {activeCat && (
                    <div className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-white px-4 py-2.5 shadow-lg">
                      <GripVertical className="h-4 w-4 text-slate-300" />
                      <span className="flex-1 text-sm font-medium text-slate-700">{activeCat.name}</span>
                    </div>
                  )}
                </DragOverlay>
              </DndContext>
            )}
          </div>

          <div className="border-t border-slate-100 p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && addCategory()}
                placeholder="새 카테고리 이름 입력 후 Enter"
                className="flex-1 h-9 rounded-lg border border-slate-200 px-3 text-sm placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-200"
              />
              <Button onClick={addCategory} disabled={!newCatName.trim()} className="bg-indigo-600 hover:bg-indigo-700 shrink-0">
                <Plus className="mr-1 h-4 w-4" /> 추가
              </Button>
            </div>
          </div>
        </div>

        {/* ── Right: Subcategories ── */}
        <div className={cn(
          "flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-opacity",
          !selectedCat && "opacity-60 pointer-events-none",
        )}>
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3.5">
            <Tag className="h-4 w-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-800">
              세부 카테고리
              {selectedCat && <span className="ml-1.5 font-normal text-indigo-600">— {selectedCat.name}</span>}
            </h3>
            {selectedCat && (
              <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                {selectedCat.subCategories.length}
              </span>
            )}
          </div>

          <div className="flex-1 min-h-[240px]">
            {!selectedCat ? (
              <div className="flex flex-col items-center justify-center py-14 text-slate-400">
                <ChevronRight className="mb-2 h-7 w-7 opacity-25" />
                <p className="text-sm">왼쪽에서 카테고리를 선택하세요.</p>
              </div>
            ) : selectedCat.subCategories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-slate-400">
                <Tag className="mb-2 h-7 w-7 opacity-25" />
                <p className="text-sm">세부 카테고리가 없습니다.</p>
                <p className="mt-0.5 text-xs text-slate-300">아래에서 추가하세요.</p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleSubDragStart}
                onDragEnd={handleSubDragEnd}
              >
                <SortableContext
                  items={selectedCat.subCategories.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {selectedCat.subCategories.map((sub) => (
                    <SortableSubItem
                      key={sub.id}
                      sub={sub}
                      editingSubId={editingSubId}
                      editingName={editingName}
                      onEditNameChange={setEditingName}
                      onCommit={commitSubRename}
                      onCancelEdit={cancelEdit}
                      onStartEdit={startSubEdit}
                      onDelete={deleteSubCategory}
                    />
                  ))}
                </SortableContext>
                <DragOverlay>
                  {activeSub && (
                    <div className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-white px-4 py-2.5 shadow-lg">
                      <GripVertical className="h-4 w-4 text-slate-300" />
                      <span className="flex-1 text-sm text-slate-700">{activeSub.name}</span>
                    </div>
                  )}
                </DragOverlay>
              </DndContext>
            )}
          </div>

          <div className="border-t border-slate-100 p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubName}
                onChange={(e) => setNewSubName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && addSubCategory()}
                placeholder={
                  selectedCat
                    ? `${selectedCat.name}의 세부 카테고리 이름 입력 후 Enter`
                    : "카테고리를 먼저 선택하세요"
                }
                className="flex-1 h-9 rounded-lg border border-slate-200 px-3 text-sm placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-200"
              />
              <Button
                onClick={addSubCategory}
                disabled={!newSubName.trim() || !selectedCatId}
                className="bg-indigo-600 hover:bg-indigo-700 shrink-0"
              >
                <Plus className="mr-1 h-4 w-4" /> 추가
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Guide */}
      <div className="rounded-lg border border-slate-100 bg-slate-50 px-5 py-4">
        <ul className="space-y-1 text-xs text-slate-500">
          <li>• 카테고리를 클릭하면 우측에서 세부 카테고리를 관리할 수 있습니다.</li>
          <li>• <span className="font-medium">수정</span> 버튼 또는 이름을 더블클릭하면 이름을 변경할 수 있습니다. (Enter 저장 / Esc 취소)</li>
          <li>• <span className="font-medium">≡ 핸들</span>을 드래그하여 순서를 변경할 수 있습니다.</li>
          <li>• 카테고리를 삭제하면 해당 세부 카테고리도 함께 삭제됩니다.</li>
          <li>• 변경 사항은 우측 상단의 <span className="font-medium">저장</span> 버튼을 눌러야 반영됩니다.</li>
        </ul>
      </div>

      {/* Leave Confirmation Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100">
                <TriangleAlert className="h-4 w-4 text-amber-600" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">저장하지 않은 내용이 있어요</h3>
            </div>
            <p className="mb-5 pl-12 text-sm text-slate-500">변경 사항을 저장하고 이동하시겠어요?</p>
            <div className="flex flex-col gap-2">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={handleSaveAndLeave}>
                <Save className="mr-2 h-4 w-4" /> 저장 후 이동
              </Button>
              <Button variant="outline" className="w-full" onClick={handleLeaveWithoutSave}>
                저장하지 않고 이동
              </Button>
              <button
                type="button"
                onClick={() => setShowLeaveModal(false)}
                className="py-1 text-sm text-slate-400 hover:text-slate-600"
              >
                계속 편집하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 아이콘 선택기 모달 */}
      {iconPickerCat && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
          onClick={() => setIconPickerCatId(null)}
        >
          <div
            className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="text-sm font-semibold text-slate-900">
                아이콘 선택 — <span className="text-indigo-600">{iconPickerCat.name}</span>
              </h3>
              <button
                onClick={() => setIconPickerCatId(null)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* 검색 */}
            <div className="border-b border-slate-100 px-5 py-3">
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-100">
                <Search className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  autoFocus
                  value={iconQuery}
                  onChange={(e) => setIconQuery(e.target.value)}
                  placeholder="아이콘 검색 (예: book, money, rocket)"
                  className="h-9 flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
                />
                {iconQuery && (
                  <button onClick={() => setIconQuery("")} className="text-slate-300 hover:text-slate-500">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              {/* 현재 선택 표시 */}
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                <span>현재:</span>
                <span className="flex h-6 w-6 items-center justify-center rounded border border-slate-200 text-indigo-600">
                  <CategoryIcon iconName={iconPickerCat.iconName} size={15} />
                </span>
                <code className="text-[11px] text-slate-600">{iconPickerCat.iconName || "(없음)"}</code>
              </div>
            </div>

            {/* 결과 그리드 */}
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {allIconNames.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-400">아이콘 불러오는 중…</p>
              ) : filteredIconNames.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-400">
                  &quot;{iconQuery}&quot; 검색 결과가 없습니다.
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-8 gap-2">
                    {filteredIconNames.slice(0, ICON_RESULT_LIMIT).map((name) => {
                      const active = iconPickerCat.iconName === name;
                      return (
                        <button
                          key={name}
                          type="button"
                          title={name}
                          onClick={() => changeIcon(iconPickerCat.id, name)}
                          className={cn(
                            "flex aspect-square items-center justify-center rounded-lg border transition-colors",
                            active
                              ? "border-indigo-400 bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200"
                              : "border-slate-200 text-slate-500 hover:border-indigo-300 hover:bg-slate-50 hover:text-indigo-600",
                          )}
                        >
                          <CategoryIcon iconName={name} size={20} />
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-3 text-center text-[11px] text-slate-400">
                    {filteredIconNames.length > ICON_RESULT_LIMIT
                      ? `${filteredIconNames.length.toLocaleString()}개 중 상위 ${ICON_RESULT_LIMIT}개 표시 — 검색어를 좁혀보세요`
                      : `${filteredIconNames.length.toLocaleString()}개`}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
