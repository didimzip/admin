"use client";

import React, { useState, useEffect } from "react";
import { getAllPosts, publishScheduledPosts } from "@/lib/post-store";
import { getSession, logout, verifyAdminPassword, resetAdminPassword, updateAdminInfo, type AdminSession } from "@/lib/auth-store";
import { Lock, Eye, EyeOff } from "lucide-react";
import { ToastProvider, useToast } from "@/lib/toast-context";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  RiUserSettingsLine,
  RiDashboardLine,
  RiTeamLine,
  RiShieldCheckLine,
  RiFileTextLine,
  RiMessage2Line,
  RiCustomerService2Line,
  RiMegaphoneLine,
  RiImageLine,
  RiBarChartLine,
  RiFileListLine,
  RiSettings4Line,
  RiMenuLine,
  RiLogoutCircleLine,
  RiArrowDownSLine,
  RiFileEditLine,
  RiArrowLeftDoubleLine,
  RiArrowRightDoubleLine,
  RiApps2Line,
  RiAdminLine,
} from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

// ─── Menu Types ───────────────────────────────────────────────────────────────

type MenuItem = {
  icon: typeof RiDashboardLine;
  label: string;
  href: string;
};

type MenuGroup = {
  label: string;
  superAdminOnly?: boolean;
  items: MenuItem[];
};

const menuGroups: MenuGroup[] = [
  {
    label: "회원 및 승인 관리",
    superAdminOnly: true,
    items: [
      { icon: RiTeamLine, label: "회원 관리", href: "/users" },
      { icon: RiShieldCheckLine, label: "인증 뱃지 관리", href: "/verifications" },
      { icon: RiFileListLine, label: "활동 추적", href: "/audit-logs" },
    ],
  },
  {
    label: "콘텐츠 및 운영 관리",
    items: [
      { icon: RiFileTextLine, label: "콘텐츠 관리", href: "/posts" },
      { icon: RiApps2Line, label: "카테고리 관리", href: "/categories" },
      { icon: RiMessage2Line, label: "댓글/신고 관리", href: "/comments" },
      { icon: RiCustomerService2Line, label: "상담 관리", href: "/consultations" },
    ],
  },
  {
    label: "마케팅 및 알림",
    items: [
      { icon: RiMegaphoneLine, label: "마케팅 발송", href: "/campaigns" },
      { icon: RiImageLine, label: "배너 관리", href: "/banners" },
    ],
  },
  {
    label: "시스템 통계",
    items: [
      { icon: RiBarChartLine, label: "데이터 분석", href: "/analytics" },
    ],
  },
  {
    label: "시스템 설정 및 계정",
    superAdminOnly: true,
    items: [
      { icon: RiSettings4Line, label: "시스템 설정", href: "/settings" },
      { icon: RiAdminLine, label: "관리자 계정 관리", href: "/admin-accounts" },
    ],
  },
];

// ─── SidebarNav ───────────────────────────────────────────────────────────────

function SidebarNav({
  onItemClick,
  collapsed,
  role,
}: {
  onItemClick?: () => void;
  collapsed?: boolean;
  role: "SUPER_ADMIN" | "OPERATOR" | null;
}) {
  const pathname = usePathname();

  const visibleGroups = menuGroups.filter(
    (g) => !g.superAdminOnly || role === "SUPER_ADMIN"
  );

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    menuGroups.forEach((g) => { initial[g.label] = true; });
    return initial;
  });

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="flex flex-col gap-0.5">
      {/* Top CTA */}
      <div className="px-3 mb-3">
        <Link
          href="/posts/new"
          onClick={onItemClick}
          className={cn(
            "flex items-center justify-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
            isActive("/posts/new")
              ? "bg-indigo-600 text-white"
              : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
          )}
        >
          <RiFileEditLine className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>콘텐츠 작성</span>}
        </Link>
      </div>

      {/* Dashboard */}
      <div className="px-3 mb-1">
        <Link
          href="/dashboard"
          onClick={onItemClick}
          title={collapsed ? "대시보드" : undefined}
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            collapsed && "justify-center",
            isActive("/dashboard")
              ? "bg-slate-100 text-slate-900 font-semibold"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          )}
        >
          <RiDashboardLine className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>대시보드</span>}
        </Link>
      </div>

      <div className="mx-4 my-2 border-t border-slate-200" />

      {/* Menu Groups */}
      {visibleGroups.map((group, index) => {
        const isOpen = openGroups[group.label] ?? true;
        const hasActiveChild = group.items.some((item) => isActive(item.href));

        return (
          <div key={group.label} className="px-3">
            {collapsed ? (
              <>
                {index > 0 && <div className="mx-2 my-1.5 border-t border-slate-100" />}
                <div className="flex flex-col gap-0.5 py-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onItemClick}
                      title={item.label}
                      className={cn(
                        "flex items-center justify-center rounded-lg py-2 transition-colors",
                        active
                          ? "bg-slate-100 text-slate-900"
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </Link>
                  );
                })}
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => toggleGroup(group.label)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors",
                    hasActiveChild
                      ? "text-slate-900"
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  <span>{group.label}</span>
                  <RiArrowDownSLine
                    className={cn(
                      "h-4 w-4 text-slate-400 transition-transform duration-200",
                      isOpen && "rotate-180"
                    )}
                  />
                </button>

                {isOpen && (
                  <div className="ml-1 flex flex-col gap-0.5 pb-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={onItemClick}
                          className={cn(
                            "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                            active
                              ? "bg-slate-100 text-slate-900 font-medium"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          )}
                        >
                          <Icon className="h-[18px] w-[18px] shrink-0" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}
    </nav>
  );
}

// ─── Admin Layout ─────────────────────────────────────────────────────────────

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </ToastProvider>
  );
}

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [session, setSession] = useState<AdminSession | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showEditInfo, setShowEditInfo] = useState(false);
  const [eiName, setEiName] = useState("");
  const [eiEmail, setEiEmail] = useState("");
  const [eiCurrent, setEiCurrent] = useState("");
  const [eiNew, setEiNew] = useState("");
  const [eiConfirm, setEiConfirm] = useState("");
  const [eiShowCurrent, setEiShowCurrent] = useState(false);
  const [eiShowNew, setEiShowNew] = useState(false);
  const [eiShowConfirm, setEiShowConfirm] = useState(false);
  const [eiError, setEiError] = useState("");

  // 인증 가드
  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.replace("/login");
    } else {
      setSession(s);
      setAuthChecked(true);
    }
  }, [router]);

  // 예약 게시물 자동 처리
  useEffect(() => {
    if (!authChecked) return;

    publishScheduledPosts();

    const timers = new Map<string, ReturnType<typeof setTimeout>>();

    function registerTimer(id: string, scheduledAt: string) {
      const delay = new Date(scheduledAt).getTime() - Date.now();
      if (delay <= 0) return;
      if (timers.has(id)) clearTimeout(timers.get(id)!);
      timers.set(id, setTimeout(() => {
        publishScheduledPosts();
        timers.delete(id);
      }, delay));
    }

    getAllPosts().forEach((p) => {
      if (p.status === "SCHEDULED" && p.scheduledAt) {
        registerTimer(p.id, p.scheduledAt);
      }
    });

    const onScheduledSaved = (e: Event) => {
      const { id, scheduledAt } = (e as CustomEvent<{ id: string; scheduledAt: string }>).detail;
      registerTimer(id, scheduledAt);
    };

    window.addEventListener("scheduled-post-saved", onScheduledSaved);
    return () => {
      window.removeEventListener("scheduled-post-saved", onScheduledSaved);
      timers.forEach((t) => clearTimeout(t));
    };
  }, [authChecked]);

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  const eiPwRules = {
    length: eiNew.length >= 8,
    letter: /[a-zA-Z]/.test(eiNew),
    number: /[0-9]/.test(eiNew),
    special: /[^a-zA-Z0-9]/.test(eiNew),
  };
  const eiPwValid = Object.values(eiPwRules).every(Boolean);
  const eiPwMatch = eiNew === eiConfirm;
  const eiChangingPw = !!(eiCurrent || eiNew || eiConfirm);

  function openEditInfo() {
    setEiName(session?.name ?? "");
    setEiEmail(session?.email ?? "");
    setEiCurrent(""); setEiNew(""); setEiConfirm("");
    setEiShowCurrent(false); setEiShowNew(false); setEiShowConfirm(false);
    setEiError("");
    setShowEditInfo(true);
  }

  function handleSaveInfo() {
    if (!session) return;
    const noChanges = eiName.trim() === (session.name ?? "").trim() && !eiCurrent && !eiNew && !eiConfirm;
    if (noChanges) return;
    setEiError("");
    if (!eiName.trim()) { setEiError("이름을 입력해주세요."); return; }
    if (eiChangingPw) {
      if (!verifyAdminPassword(session.adminId, eiCurrent)) {
        setEiError("현재 비밀번호가 올바르지 않습니다."); return;
      }
      if (!eiPwValid) { setEiError("새 비밀번호가 규칙을 충족하지 않습니다."); return; }
      if (!eiPwMatch) { setEiError("비밀번호가 일치하지 않습니다."); return; }
      resetAdminPassword(session.adminId, eiNew);
    }
    updateAdminInfo(session.adminId, { name: eiName.trim() });
    setSession(getSession());
    window.dispatchEvent(new Event("posts-updated"));
    closeEditInfo();
    showToast("정보가 수정되었습니다.");
  }

  function closeEditInfo() {
    setShowEditInfo(false);
    setEiName(""); setEiEmail("");
    setEiCurrent(""); setEiNew(""); setEiConfirm("");
    setEiShowCurrent(false); setEiShowNew(false); setEiShowConfirm(false);
    setEiError("");
  }

  // 인증 확인 전 로딩 스크린
  if (!authChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <svg className="h-8 w-8 animate-spin text-indigo-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-slate-400">인증 확인 중...</p>
        </div>
      </div>
    );
  }

  const sidebarWidth = collapsed ? 68 : 260;
  const role = session?.role ?? null;
  const initials = session?.name ? session.name[0] : "관";

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 z-50 transition-all duration-200"
        style={{ width: sidebarWidth }}
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-[28px] top-0 z-10 flex h-8 w-7 items-center justify-center border border-l-0 border-slate-200 bg-white text-slate-400 hover:text-indigo-600 transition-colors rounded-br-md"
        >
          {collapsed ? (
            <RiArrowRightDoubleLine className="h-4 w-4" />
          ) : (
            <RiArrowLeftDoubleLine className="h-4 w-4" />
          )}
        </button>

        <div className="flex h-full flex-col bg-white border-r border-slate-200">
          {/* Sidebar Header */}
          <div className="flex h-14 items-center px-4 border-b border-slate-200">
            {!collapsed ? (
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 shrink-0">
                  <span className="text-sm font-bold text-white">D</span>
                </div>
                <span className="text-[15px] font-bold text-slate-900">DidimZip</span>
              </Link>
            ) : (
              <Link href="/dashboard" className="mx-auto">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
                  <span className="text-sm font-bold text-white">D</span>
                </div>
              </Link>
            )}
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto scrollbar-hide py-3">
            <SidebarNav collapsed={collapsed} role={role} />
          </div>

          {/* Sidebar Footer */}
          <div className="border-t border-slate-200 p-3 space-y-0.5">
            {role !== "SUPER_ADMIN" && (
              <button
                onClick={openEditInfo}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700",
                  collapsed && "justify-center"
                )}
              >
                <RiUserSettingsLine className="h-[18px] w-[18px] shrink-0" />
                {!collapsed && <span>내 정보 수정</span>}
              </button>
            )}
            <button
              onClick={handleLogout}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700",
                collapsed && "justify-center"
              )}
            >
              <RiLogoutCircleLine className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && <span>로그아웃</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[280px] bg-white p-0 border-slate-200">
          <SheetHeader className="px-5 pt-5 pb-3 border-b border-slate-200">
            <SheetTitle className="flex items-center gap-2 text-slate-900">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
                <span className="text-sm font-bold text-white">D</span>
              </div>
              DidimZip
            </SheetTitle>
            <SheetDescription className="text-slate-500">관리자 메뉴</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto scrollbar-hide py-3">
            <SidebarNav onItemClick={() => setMobileOpen(false)} role={role} />
          </div>
          <div className="border-t border-slate-200 p-3 space-y-0.5">
            {role !== "SUPER_ADMIN" && (
              <button
                onClick={() => { setMobileOpen(false); openEditInfo(); }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
              >
                <RiUserSettingsLine className="h-[18px] w-[18px] shrink-0" />
                <span>내 정보 수정</span>
              </button>
            )}
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
            >
              <RiLogoutCircleLine className="h-[18px] w-[18px] shrink-0" />
              <span>로그아웃</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* 내 정보 수정 모달 (이름/이메일 + 선택적 비밀번호 변경) */}
      {showEditInfo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeEditInfo(); }}>
          <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-slate-900">내 정보 수정</h2>
            </div>
            <div className="space-y-3 px-5 py-4">
                {/* 이름 */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">이름</label>
                  <input type="text" value={eiName} onChange={(e) => { setEiName(e.target.value); setEiError(""); }} autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleSaveInfo()}
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-indigo-400 focus:outline-none" />
                </div>
                {/* 이메일 (읽기 전용) */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">이메일</label>
                  <input type="email" value={eiEmail} readOnly
                    className="h-9 w-full rounded-lg border border-slate-100 bg-slate-50 px-3 text-sm text-slate-400 cursor-not-allowed" />
                  <p className="mt-1 text-[11px] text-slate-400">이메일은 관리자 페이지에서만 변경할 수 있습니다.</p>
                </div>
                {/* 비밀번호 변경 구분선 */}
                <div className="border-t border-slate-100 pt-3">
                  <p className="mb-2 text-xs font-medium text-slate-500">비밀번호 변경 <span className="font-normal text-slate-400">(변경하지 않을 경우 비워두세요)</span></p>
                  {/* 현재 비밀번호 */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      <input type={eiShowCurrent ? "text" : "password"} value={eiCurrent}
                        onChange={(e) => { setEiCurrent(e.target.value); setEiError(""); }}
                        onKeyDown={(e) => e.key === "Enter" && handleSaveInfo()}
                        placeholder="현재 비밀번호"
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-9 text-sm focus:border-indigo-400 focus:outline-none" />
                      <button type="button" onClick={() => setEiShowCurrent((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {eiShowCurrent ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    {/* 새 비밀번호 */}
                    <div>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        <input type={eiShowNew ? "text" : "password"} value={eiNew}
                          onChange={(e) => { setEiNew(e.target.value); setEiError(""); }}
                          onKeyDown={(e) => e.key === "Enter" && handleSaveInfo()}
                          placeholder="새 비밀번호"
                          className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-9 text-sm focus:border-indigo-400 focus:outline-none" />
                        <button type="button" onClick={() => setEiShowNew((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          {eiShowNew ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                      {eiNew && (
                        <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-0.5">
                          {([["length","8자 이상"],["letter","영문 포함"],["number","숫자 포함"],["special","특수문자 포함"]] as const).map(([k, label]) => (
                            <span key={k} className={cn("flex items-center gap-1 text-[11px]", eiPwRules[k] ? "text-emerald-600" : "text-slate-400")}>
                              <svg viewBox="0 0 16 16" className="h-3 w-3 shrink-0" fill="none">
                                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                                {eiPwRules[k] && <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />}
                              </svg>
                              {label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* 새 비밀번호 확인 */}
                    <div>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        <input type={eiShowConfirm ? "text" : "password"} value={eiConfirm}
                          onChange={(e) => { setEiConfirm(e.target.value); setEiError(""); }}
                          onKeyDown={(e) => e.key === "Enter" && handleSaveInfo()}
                          placeholder="새 비밀번호 확인"
                          className={cn("h-9 w-full rounded-lg border bg-white pl-8 pr-9 text-sm focus:outline-none",
                            eiConfirm && !eiPwMatch ? "border-red-300 focus:border-red-400" : "border-slate-200 focus:border-indigo-400")} />
                        <button type="button" onClick={() => setEiShowConfirm((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          {eiShowConfirm ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                      {eiConfirm && !eiPwMatch && <p className="mt-1 text-xs text-red-500">비밀번호가 일치하지 않습니다.</p>}
                    </div>
                  </div>
                </div>
                {eiError && <p className="text-xs text-red-500">{eiError}</p>}
                <div className="flex justify-end gap-2 pt-1">
                  <button onClick={closeEditInfo} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">취소</button>
                  <button
                    onClick={handleSaveInfo}
                    disabled={!eiName.trim() || (eiName.trim() === (session?.name ?? "").trim() && !eiCurrent && !eiNew && !eiConfirm)}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300">
                    저장
                  </button>
                </div>
              </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div
        className="flex flex-1 flex-col transition-all duration-200"
        style={{ paddingLeft: collapsed ? 68 : 260 }}
      >
        {/* Top Header */}
        <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-white px-4 sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <RiMenuLine className="h-5 w-5" />
            <span className="sr-only">메뉴 열기</span>
          </Button>

          <div className="ml-auto flex items-center gap-3">
            {session && (
              <>
                <div className="hidden sm:flex sm:flex-col sm:items-end sm:text-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-slate-900">{session.name}</span>
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                        session.role === "SUPER_ADMIN"
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-slate-100 text-slate-600"
                      )}
                    >
                      {session.role === "SUPER_ADMIN" ? "슈퍼관리자" : "운영관리자"}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">{session.email}</span>
                </div>
                <Avatar className="h-9 w-9">
                  <AvatarImage src="" alt={session.name} />
                  <AvatarFallback className="bg-indigo-100 text-indigo-700 text-sm font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 [scrollbar-gutter:stable]">
          {children}
        </main>
      </div>
    </div>
  );
}
