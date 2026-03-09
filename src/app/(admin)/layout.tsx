"use client";

import React, { useState, useEffect } from "react";
import { getAllPosts, publishScheduledPosts } from "@/lib/post-store";
import { getSession, logout, type AdminSession } from "@/lib/auth-store";
import { ToastProvider } from "@/lib/toast-context";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
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
      { icon: RiTeamLine, label: "회원 목록", href: "/users" },
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
    superAdminOnly: true,
    items: [
      { icon: RiMegaphoneLine, label: "타겟팅 발송", href: "/campaigns" },
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

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [session, setSession] = useState<AdminSession | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

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
          <div className="border-t border-slate-200 p-3">
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
          <div className="border-t border-slate-200 p-3">
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
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6">
          <ToastProvider>
            {children}
          </ToastProvider>
        </main>
      </div>
    </div>
  );
}
