"use client";

import { useState } from "react";
import {
  ShieldCheck,
  UserCog,
  Plus,
  KeyRound,
  Power,
  PowerOff,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  X,
  Users,
  Pencil,
} from "lucide-react";
import { useToast } from "@/lib/toast-context";
import { recordLog } from "@/lib/audit-log-store";
import {
  getAllAdmins,
  createAdmin,
  updateAdmin,
  updateAdminInfo,
  resetAdminPassword,
  verifyAdminPassword,
  deleteAdmins,
  getSession,
  type AdminAccount,
  type AdminRole,
} from "@/lib/auth-store";
import { passwordSchema } from "@/lib/validations/auth";
import { CountDisplay } from "@/components/ui/pagination-bar";
import { cn } from "@/lib/utils";

const PROTECTED_EMAIL = "admin@didimzip.com";

// ─── 비밀번호 규칙 체크 ───────────────────────────────────────────────────────

function PasswordRuleCheck({ password }: { password: string }) {
  const rules = [
    { label: "8자 이상", pass: password.length >= 8 },
    { label: "영문 포함", pass: /[a-zA-Z]/.test(password) },
    { label: "숫자 포함", pass: /[0-9]/.test(password) },
    { label: "특수문자 포함", pass: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];

  if (!password) return null;

  return (
    <div className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1">
      {rules.map((rule) => (
        <div
          key={rule.label}
          className={cn(
            "flex items-center gap-1.5 text-xs",
            rule.pass ? "text-green-600" : "text-slate-400"
          )}
        >
          <CheckCircle2 className={cn("h-3 w-3 shrink-0", rule.pass ? "text-green-500" : "text-slate-300")} />
          {rule.label}
        </div>
      ))}
    </div>
  );
}

// ─── 역할 배지 ───────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: AdminRole }) {
  return role === "SUPER_ADMIN" ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700">
      <ShieldCheck className="h-3 w-3" />
      슈퍼관리자
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
      <UserCog className="h-3 w-3" />
      운영관리자
    </span>
  );
}

// ─── 이름/이메일 수정 모달 ────────────────────────────────────────────────────

function EditInfoModal({
  target,
  onClose,
  onConfirm,
}: {
  target: AdminAccount;
  onClose: () => void;
  onConfirm: (patch: { name: string; email: string }) => void;
}) {
  const isProtected = target.email === PROTECTED_EMAIL;
  const [name, setName] = useState(target.name);
  const [email, setEmail] = useState(target.email);
  const [error, setError] = useState("");

  const noChanges =
    name.trim() === target.name.trim() &&
    email.trim() === target.email.trim();

  const handleSubmit = () => {
    if (noChanges) return;
    if (!name.trim()) { setError("이름을 입력해주세요."); return; }
    if (!email.trim() || !email.includes("@")) { setError("올바른 이메일을 입력해주세요."); return; }
    onConfirm({ name: name.trim(), email: email.trim() });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">계정 정보 수정</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3 px-5 py-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              onKeyDown={handleKeyDown}
              autoFocus
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-indigo-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              onKeyDown={handleKeyDown}
              disabled={isProtected}
              className={cn(
                "h-9 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-indigo-400 focus:outline-none",
                isProtected ? "bg-slate-50 text-slate-400 cursor-not-allowed" : "bg-white"
              )}
            />
            {isProtected && <p className="mt-1 text-[11px] text-slate-400">보호된 계정은 이메일을 변경할 수 없습니다.</p>}
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">취소</button>
            <button
              onClick={handleSubmit}
              disabled={noChanges || !name.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed"
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 비밀번호 변경/초기화 통합 모달 ──────────────────────────────────────────

const DEFAULT_RESET_PASSWORD = "a123456789!";

function ResetPasswordModal({
  target,
  isSelf,
  onClose,
  onConfirm,
  onForceReset,
}: {
  target: AdminAccount;
  isSelf: boolean;
  onClose: () => void;
  onConfirm: (newPassword: string) => void;
  onForceReset: () => void;
}) {
  const [currentPw, setCurrentPw] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);
  const [confirmPw, setConfirmPw] = useState("");
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [error, setError] = useState("");

  const isNewPwValid = passwordSchema.safeParse(newPw).success;
  const isMatch = newPw === confirmPw;
  const canSubmit = !!currentPw && isNewPwValid && isMatch;

  function submitChange() {
    if (!verifyAdminPassword(target.id, currentPw)) {
      setError("현재 비밀번호가 올바르지 않습니다.");
      return;
    }
    if (currentPw === newPw) {
      setError("현재 비밀번호와 동일합니다. 다른 비밀번호를 입력하세요.");
      return;
    }
    if (!isNewPwValid) {
      setError("새 비밀번호 규칙을 모두 충족해야 합니다.");
      return;
    }
    if (!isMatch) {
      setError("새 비밀번호가 일치하지 않습니다.");
      return;
    }
    onConfirm(newPw);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submitChange();
  }

  const handleEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) submitChange();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-indigo-600" />
            <h3 className="text-sm font-semibold text-slate-900">비밀번호 변경</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-4 text-xs text-slate-500">
          <span className="font-medium text-slate-700">{target.name}</span>
          <span className="text-slate-400"> ({target.email})</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* 현재 비밀번호 */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">현재 비밀번호</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type={showCurrentPw ? "text" : "password"}
                value={currentPw}
                onChange={(e) => { setCurrentPw(e.target.value); setError(""); }}
                onKeyDown={handleEnter}
                placeholder="현재 비밀번호 입력"
                autoFocus
                className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-9 text-sm focus:border-indigo-400 focus:outline-none"
              />
              <button type="button" onClick={() => setShowCurrentPw((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showCurrentPw ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* 새 비밀번호 */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">새 비밀번호</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type={showNewPw ? "text" : "password"}
                value={newPw}
                onChange={(e) => { setNewPw(e.target.value); setError(""); }}
                onKeyDown={handleEnter}
                placeholder="새 비밀번호 입력"
                className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-9 text-sm focus:border-indigo-400 focus:outline-none"
              />
              <button type="button" onClick={() => setShowNewPw((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showNewPw ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              </button>
            </div>
            <PasswordRuleCheck password={newPw} />
          </div>

          {/* 새 비밀번호 확인 */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">새 비밀번호 확인</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type={showConfirmPw ? "text" : "password"}
                value={confirmPw}
                onChange={(e) => { setConfirmPw(e.target.value); setError(""); }}
                onKeyDown={handleEnter}
                placeholder="새 비밀번호 재입력"
                className={cn(
                  "h-9 w-full rounded-lg border bg-white pl-8 pr-9 text-sm focus:outline-none",
                  confirmPw && !isMatch
                    ? "border-red-300 focus:border-red-400"
                    : "border-slate-200 focus:border-indigo-400"
                )}
              />
              <button type="button" onClick={() => setShowConfirmPw((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showConfirmPw ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              </button>
            </div>
            {confirmPw && !isMatch && (
              <p className="mt-1 text-xs text-red-500">비밀번호가 일치하지 않습니다.</p>
            )}
            {confirmPw && isMatch && newPw && (
              <p className="mt-1 flex items-center gap-1 text-xs text-green-600">
                <CheckCircle2 className="h-3 w-3" /> 비밀번호가 일치합니다.
              </p>
            )}
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          {/* 초기화 안내 (타인 계정만) */}
          {!isSelf && (
            <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
              <p className="text-[11px] text-slate-500">
                또는 기본값(<span className="font-mono font-semibold text-slate-700">{DEFAULT_RESET_PASSWORD}</span>)으로 초기화할 수 있습니다.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            {/* 초기화 버튼 (타인 계정만) */}
            {!isSelf ? (
              <button
                type="button"
                onClick={onForceReset}
                className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100"
              >
                기본값으로 초기화
              </button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                취소
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className={cn(
                  "rounded-lg px-4 py-1.5 text-xs font-medium text-white transition-colors",
                  canSubmit ? "bg-indigo-600 hover:bg-indigo-700" : "bg-indigo-300 cursor-not-allowed"
                )}
              >
                변경
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── 관리자 추가 패널 ─────────────────────────────────────────────────────────

function AddAdminPanel({
  currentAdminId,
  onAdded,
  onClose,
}: {
  currentAdminId: string;
  onAdded: () => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AdminRole>("OPERATOR");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");

  const DEFAULT_PASSWORD = "a123456789!";
  const isPasswordValid = !password.trim() || passwordSchema.safeParse(password).success;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError("이름과 이메일을 입력하세요.");
      return;
    }
    if (password.trim() && !passwordSchema.safeParse(password).success) {
      setError("비밀번호 규칙을 모두 충족해야 합니다.");
      return;
    }

    const existing = getAllAdmins().find((a) => a.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      setError("이미 등록된 이메일입니다.");
      return;
    }

    const passwordToUse = password.trim() || DEFAULT_PASSWORD;
    const newAdmin = createAdmin({ name: name.trim(), email: email.trim(), role, password: passwordToUse }, currentAdminId);
    recordLog("ADMIN_CREATE", `관리자 계정 생성: ${newAdmin.name} (${newAdmin.email}, ${role === "SUPER_ADMIN" ? "슈퍼관리자" : "운영관리자"})`, { targetType: "admin", targetId: newAdmin.id });
    onAdded();
    onClose();
  }

  return (
    <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Plus className="h-4 w-4 text-indigo-600" />
          <span className="text-sm font-semibold text-slate-800">새 관리자 추가</span>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
        {/* Name */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">이름</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="홍길동"
            className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-indigo-400 focus:outline-none"
          />
        </div>

        {/* Email */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">이메일</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-indigo-400 focus:outline-none"
          />
        </div>

        {/* Role */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">권한</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as AdminRole)}
            className="h-9 w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-indigo-400 focus:outline-none"
          >
            <option value="OPERATOR">운영관리자</option>
            <option value="SUPER_ADMIN">슈퍼관리자</option>
          </select>
        </div>

        {/* Password */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">
            초기 비밀번호
            <span className="ml-1 font-normal text-slate-400">(미입력 시 a123456789! 적용)</span>
          </label>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              placeholder="비워두면 기본값 적용"
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 pr-8 text-sm focus:border-indigo-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPw ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            </button>
          </div>
          <PasswordRuleCheck password={password} />
        </div>

        {/* Error + Submit */}
        <div className="sm:col-span-2">
          {error && <p className="mb-2 text-xs text-red-500">{error}</p>}
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              취소
            </button>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
            >
              추가
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminAccountsPage() {
  const session = getSession();
  const { showToast } = useToast();
  const [admins, setAdmins] = useState<AdminAccount[]>(() => getAllAdmins());
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [resetTarget, setResetTarget] = useState<AdminAccount | null>(null);
  const [editTarget, setEditTarget] = useState<AdminAccount | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const refresh = () => setAdmins(getAllAdmins());

  const isDeletable = (admin: AdminAccount) =>
    admin.email !== PROTECTED_EMAIL && admin.id !== session?.adminId;

  const handleToggleSelectAll = () => {
    const deletableIds = admins.filter(isDeletable).map((a) => a.id);
    const allSelected = deletableIds.every((id) => selectedIds.has(id));
    setSelectedIds(() => {
      const next = new Set<string>();
      if (!allSelected) deletableIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDeleteSelected = () => {
    const count = selectedIds.size;
    const deletedNames = admins.filter((a) => selectedIds.has(a.id)).map((a) => a.name).join(", ");
    deleteAdmins([...selectedIds]);
    recordLog("ADMIN_DELETE", `관리자 계정 삭제 (${count}명): ${deletedNames}`, { targetType: "admin" });
    setSelectedIds(new Set());
    setIsEditing(false);
    refresh();
    showToast(`${count}개 계정이 삭제되었습니다.`);
  };

  const handleDeleteAll = () => {
    const deletable = admins.filter(isDeletable);
    const ids = deletable.map((a) => a.id);
    const count = ids.length;
    if (!window.confirm(`삭제 가능한 계정 ${count}개를 모두 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;
    const deletedNames = deletable.map((a) => a.name).join(", ");
    deleteAdmins(ids);
    recordLog("ADMIN_DELETE", `관리자 계정 전체 삭제 (${count}명): ${deletedNames}`, { targetType: "admin" });
    setSelectedIds(new Set());
    setIsEditing(false);
    refresh();
    showToast(`전체 ${count}개 계정이 삭제되었습니다.`);
  };

  const deletableAdmins = admins.filter(isDeletable);
  const allDeletableSelected =
    deletableAdmins.length > 0 && deletableAdmins.every((a) => selectedIds.has(a.id));

  // SUPER_ADMIN 아닌 경우 접근 차단
  if (!session || session.role !== "SUPER_ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <ShieldCheck className="mb-4 h-12 w-12 text-slate-200" />
        <h2 className="text-lg font-semibold text-slate-700">접근 권한이 없습니다</h2>
        <p className="mt-1 text-sm text-slate-400">
          슈퍼 관리자만 이 페이지에 접근할 수 있습니다.
        </p>
      </div>
    );
  }

  const activeCount = admins.filter((a) => a.status === "ACTIVE").length;
  const superCount = admins.filter((a) => a.role === "SUPER_ADMIN").length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">관리자 계정 관리</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            관리자 계정의 권한과 상태를 관리합니다.
          </p>
        </div>
        <button
          onClick={() => setShowAddPanel((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          관리자 추가
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "전체 관리자", value: admins.length, icon: Users, bg: "bg-blue-50 border-blue-200", color: "text-blue-600" },
          { label: "활성 계정", value: activeCount, icon: Power, bg: "bg-green-50 border-green-200", color: "text-green-600" },
          { label: "슈퍼관리자", value: superCount, icon: ShieldCheck, bg: "bg-indigo-50 border-indigo-200", color: "text-indigo-600" },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border", card.bg)}>
                <Icon className={cn("h-5 w-5", card.color)} />
              </div>
              <div>
                <p className="text-xs text-slate-500">{card.label}</p>
                <p className="text-2xl font-bold text-slate-900">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Admin Panel */}
      {showAddPanel && (
        <AddAdminPanel
          currentAdminId={session.adminId}
          onAdded={() => { refresh(); showToast("관리자가 추가되었습니다."); }}
          onClose={() => setShowAddPanel(false)}
        />
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <h3 className="text-sm font-semibold text-slate-800">관리자 목록</h3>
            <CountDisplay total={admins.length} unit="명" />
          </div>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleDeleteSelected}
                disabled={selectedIds.size === 0}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  selectedIds.size > 0
                    ? "bg-red-50 text-red-600 hover:bg-red-100"
                    : "cursor-not-allowed text-slate-300"
                )}
              >
                선택삭제{selectedIds.size > 0 && ` (${selectedIds.size})`}
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={deletableAdmins.length === 0}
                className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:bg-red-300"
              >
                전체삭제
              </button>
              <button
                onClick={() => { setIsEditing(false); setSelectedIds(new Set()); }}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                완료
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              편집
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] table-fixed text-sm">
            <colgroup>
              {isEditing && <col className="w-10" />}
              <col className="w-[160px]" />
              <col className="w-[170px]" />
              <col className="w-[110px]" />
              <col className="w-[80px]" />
              <col className="w-[130px]" />
              <col className="w-[100px]" />
              {!isEditing && <col className="w-[150px]" />}
            </colgroup>
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left">
                {isEditing && (
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allDeletableSelected}
                      onChange={handleToggleSelectAll}
                      className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-indigo-600"
                    />
                  </th>
                )}
                <th className="px-5 py-3 text-xs font-semibold text-slate-500">이름</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">이메일</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">권한</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">상태</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">마지막 로그인</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">등록일</th>
                {!isEditing && <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500">액션</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {admins.map((admin) => {
                const isSelf = admin.id === session.adminId;
                const canDelete = isDeletable(admin);
                const isSelected = selectedIds.has(admin.id);
                return (
                  <tr
                    key={admin.id}
                    onClick={() => isEditing && canDelete && handleToggleSelectRow(admin.id)}
                    className={cn(
                      "transition-colors hover:bg-slate-50/60",
                      isSelf && "bg-indigo-50/30",
                      isEditing && canDelete && "cursor-pointer",
                      isSelected && "bg-indigo-50/60"
                    )}
                  >
                    {isEditing && (
                      <td className="px-4 py-3.5">
                        {canDelete ? (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectRow(admin.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-indigo-600"
                          />
                        ) : (
                          <span className="block h-4 w-4" />
                        )}
                      </td>
                    )}
                    <td className="px-5 py-3.5 overflow-hidden">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <span className="min-w-0 truncate font-medium text-slate-800">{admin.name}</span>
                        {isSelf && (
                          <span className="shrink-0 rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-medium text-indigo-600">
                            나
                          </span>
                        )}
                        {admin.email === PROTECTED_EMAIL && (
                          <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                            보호됨
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 overflow-hidden text-slate-600"><div className="truncate">{admin.email}</div></td>
                    <td className="px-4 py-3.5">
                      <RoleBadge role={admin.role} />
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                          admin.status === "ACTIVE"
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-500"
                        )}
                      >
                        {admin.status === "ACTIVE" ? "활성" : "비활성"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">
                      {admin.lastLoginAt
                        ? new Date(admin.lastLoginAt).toLocaleString("ko-KR", {
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">
                      {new Date(admin.createdAt).toLocaleDateString("ko-KR")}
                    </td>
                    {!isEditing && <td className="px-4 py-3.5">
                      <div className="flex items-center justify-center gap-1">
                        {/* 역할 전환 */}
                        {!isSelf && (
                          <button
                            onClick={() => {
                              const newRole: AdminRole =
                                admin.role === "SUPER_ADMIN" ? "OPERATOR" : "SUPER_ADMIN";
                              updateAdmin(admin.id, { role: newRole });
                              recordLog("ADMIN_ROLE_CHANGE", `${admin.name} 역할 변경: ${admin.role === "SUPER_ADMIN" ? "슈퍼관리자 → 운영관리자" : "운영관리자 → 슈퍼관리자"}`, { targetType: "admin", targetId: admin.id });
                              refresh();
                              showToast(newRole === "SUPER_ADMIN" ? `${admin.name}을(를) 슈퍼관리자로 변경했습니다.` : `${admin.name}을(를) 운영관리자로 변경했습니다.`);
                            }}
                            title="역할 전환"
                            className="rounded-md px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
                          >
                            {admin.role === "SUPER_ADMIN" ? "→ 운영" : "→ 슈퍼"}
                          </button>
                        )}

                        {/* 활성화/비활성화 */}
                        {!isSelf && (
                          <button
                            onClick={() => {
                              const newStatus = admin.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
                              updateAdmin(admin.id, { status: newStatus });
                              recordLog("ADMIN_STATUS_CHANGE", `${admin.name} 계정 ${newStatus === "ACTIVE" ? "활성화" : "비활성화"}`, { targetType: "admin", targetId: admin.id });
                              refresh();
                              showToast(newStatus === "ACTIVE" ? `${admin.name} 계정을 활성화했습니다.` : `${admin.name} 계정을 비활성화했습니다.`);
                            }}
                            title={admin.status === "ACTIVE" ? "비활성화" : "활성화"}
                            className={cn(
                              "rounded-md p-1.5 transition-colors",
                              admin.status === "ACTIVE"
                                ? "text-slate-400 hover:bg-red-50 hover:text-red-500"
                                : "text-slate-400 hover:bg-green-50 hover:text-green-600"
                            )}
                          >
                            {admin.status === "ACTIVE"
                              ? <PowerOff className="h-3.5 w-3.5" />
                              : <Power className="h-3.5 w-3.5" />}
                          </button>
                        )}

                        {/* 정보 수정 */}
                        <button
                          onClick={() => setEditTarget(admin)}
                          title="이름/이메일 수정"
                          className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>

                        {/* 비밀번호 변경 */}
                        <button
                          onClick={() => setResetTarget(admin)}
                          title="비밀번호 변경"
                          className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-600"
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 이름/이메일 수정 모달 */}
      {editTarget && (
        <EditInfoModal
          target={editTarget}
          onClose={() => setEditTarget(null)}
          onConfirm={(patch) => {
            const isSelf = editTarget.id === session?.adminId;
            updateAdminInfo(editTarget.id, patch);
            recordLog("ADMIN_INFO_UPDATE", `${editTarget.name} 계정 정보 수정${patch.name !== editTarget.name ? ` (이름: ${editTarget.name} → ${patch.name})` : ""}${patch.email !== editTarget.email ? ` (이메일: ${editTarget.email} → ${patch.email})` : ""}`, { targetType: "admin", targetId: editTarget.id });
            setEditTarget(null);
            refresh();
            showToast("계정 정보가 수정되었습니다.");
            if (isSelf) setTimeout(() => window.location.reload(), 1500);
          }}
        />
      )}

      {/* 비밀번호 변경/초기화 모달 */}
      {resetTarget && (
        <ResetPasswordModal
          target={resetTarget}
          isSelf={resetTarget.id === session.adminId}
          onClose={() => setResetTarget(null)}
          onConfirm={(newPw) => {
            resetAdminPassword(resetTarget.id, newPw);
            const isSelf = resetTarget.id === session.adminId;
            recordLog("ADMIN_PW_RESET", `${resetTarget.name} 비밀번호 변경${isSelf ? " (본인)" : ""}`, { targetType: "admin", targetId: resetTarget.id });
            setResetTarget(null);
            refresh();
            showToast("비밀번호가 변경되었습니다.");
          }}
          onForceReset={() => {
            resetAdminPassword(resetTarget.id, DEFAULT_RESET_PASSWORD);
            recordLog("ADMIN_PW_RESET", `${resetTarget.name} 비밀번호 기본값 초기화`, { targetType: "admin", targetId: resetTarget.id });
            setResetTarget(null);
            refresh();
            showToast(`${resetTarget.name} 계정의 비밀번호를 초기화했습니다.`);
          }}
        />
      )}

    </div>
  );
}
