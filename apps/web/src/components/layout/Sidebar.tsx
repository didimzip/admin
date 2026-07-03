"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Home,
  FileText,
  TrendingUp,
  MapPin,
  Briefcase,
  BookOpen,
  Users,
  Palette,
  Cpu,
  HelpCircle,
  MessageSquare,
  ChevronDown,
} from "lucide-react";
import { categories } from "@/lib/mock-data";
import clsx from "clsx";

const COLLAPSED_W = 60;
const EXPANDED_W = 220;

const iconMap: Record<string, React.ReactNode> = {
  funding: <TrendingUp size={22} strokeWidth={1.5} />,
  marketing: <Briefcase size={22} strokeWidth={1.5} />,
  strategy: <MapPin size={22} strokeWidth={1.5} />,
  knowledge: <BookOpen size={22} strokeWidth={1.5} />,
  culture: <Users size={22} strokeWidth={1.5} />,
  design: <Palette size={22} strokeWidth={1.5} />,
  ai: <Cpu size={22} strokeWidth={1.5} />,
};

export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab");
  const [hovered, setHovered] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const isOpen = hovered;

  // Auto-expand only the current category, collapse others
  useEffect(() => {
    const match = categories.find((cat) => pathname.startsWith(`/contents/${cat.slug}`));
    if (match) {
      setExpanded(new Set([match.slug]));
    } else {
      setExpanded(new Set());
    }
  }, [pathname]);

  const toggleExpand = useCallback((slug: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }, []);

  return (
    <>
      <div className="shrink-0" style={{ width: COLLAPSED_W }} />

      {/* Overlay */}
      <div
        className={clsx(
          "fixed inset-0 z-30 transition-opacity duration-200",
          isOpen ? "bg-black/5 pointer-events-auto" : "bg-transparent pointer-events-none"
        )}
        onMouseEnter={() => setHovered(false)}
      />

      <aside
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => {
          setHovered(false);
          // Reset to only the current category
          const match = categories.find((cat) => pathname.startsWith(`/contents/${cat.slug}`));
          setExpanded(match ? new Set([match.slug]) : new Set());
        }}
        className={clsx(
          "fixed top-0 left-0 h-screen bg-white flex flex-col z-40",
          "transition-[width,box-shadow] duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]",
          isOpen ? "shadow-xl" : "border-r border-border"
        )}
        style={{ width: isOpen ? EXPANDED_W : COLLAPSED_W }}
      >
        {/* Logo */}
        <Link
          href="/"
          className={clsx(
            "flex items-center h-14 shrink-0 overflow-hidden",
            isOpen ? "px-4 gap-2.5" : "justify-center"
          )}
        >
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
            <FileText size={16} className="text-white" strokeWidth={2} />
          </div>
          <span
            className={clsx(
              "font-bold text-[15px] tracking-tight whitespace-nowrap transition-opacity duration-200",
              isOpen ? "opacity-100" : "opacity-0 w-0"
            )}
          >
            DidimZip
          </span>
        </Link>

        {/* Nav - clip submenu overflow only when collapsed */}
        <nav
          className={clsx(
            "flex-1 overflow-x-hidden py-1 flex flex-col",
            isOpen ? "overflow-y-auto" : "overflow-y-hidden"
          )}
        >
          <NavItem
            href="/"
            icon={<Home size={22} strokeWidth={1.5} />}
            label="홈"
            isActive={pathname === "/"}
            isOpen={isOpen}
          />

          <Divider />

          {categories.map((cat) => {
            const isExp = expanded.has(cat.slug);
            const isActive = pathname.startsWith(`/contents/${cat.slug}`);
            const hasSubs = cat.subcategories.length > 0;

            return (
              <div key={cat.id}>
                <div
                  className={clsx(
                    "flex items-center my-[1px] rounded-xl transition-colors duration-150",
                    isOpen ? "h-11 mx-2" : "h-11 w-11 mx-auto",
                    isActive
                      ? "bg-[#f0f0f0] text-foreground"
                      : "text-[#707070] hover:bg-[#f5f5f5] hover:text-foreground"
                  )}
                >
                  <Link
                    href={`/contents/${cat.slug}`}
                    className={clsx(
                      "flex items-center h-full flex-1 min-w-0",
                      isActive ? "font-semibold" : "",
                      !isOpen && "justify-center"
                    )}
                  >
                    <span
                      className={clsx(
                        "shrink-0 flex items-center justify-center",
                        isOpen ? "w-10 ml-2" : "w-full"
                      )}
                    >
                      {iconMap[cat.slug] ?? (
                        <FileText size={22} strokeWidth={1.5} />
                      )}
                    </span>
                    {isOpen && (
                      <span className="text-[13px] whitespace-nowrap truncate">
                        {cat.name}
                      </span>
                    )}
                  </Link>
                  {isOpen && hasSubs && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        toggleExpand(cat.slug);
                      }}
                      className="p-1.5 mr-1 rounded-lg text-[#aaa] hover:text-foreground transition-colors shrink-0"
                    >
                      <ChevronDown
                        size={14}
                        className={clsx(
                          "transition-transform duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]",
                          isExp && "rotate-180"
                        )}
                      />
                    </button>
                  )}
                </div>

                {/* Animated sub-menu: always rendered, height controlled via grid trick */}
                {hasSubs && (
                  <SubMenu isExpanded={isOpen && isExp}>
                    {cat.subcategories.map((sub) => {
                      const isSubActive = isActive && currentTab === sub.slug;
                      return (
                        <Link
                          key={sub.id}
                          href={`/contents/${cat.slug}?tab=${sub.slug}`}
                          className={clsx(
                            "block py-2 px-2.5 text-[13px] rounded-lg transition-colors",
                            isSubActive
                              ? "bg-[#f0f0f0] text-foreground font-semibold"
                              : "text-muted-foreground hover:text-foreground hover:bg-[#f5f5f5]"
                          )}
                        >
                          {sub.name}
                        </Link>
                      );
                    })}
                  </SubMenu>
                )}
              </div>
            );
          })}

          <Divider />

          <NavItem
            href="/mentor"
            icon={<HelpCircle size={22} strokeWidth={1.5} />}
            label="멘토 Q&A/매칭"
            isActive={pathname.startsWith("/mentor")}
            isOpen={isOpen}
          />
          <NavItem
            href="/commune"
            icon={<MessageSquare size={22} strokeWidth={1.5} />}
            label="꼬뮨 라운지"
            isActive={pathname.startsWith("/commune")}
            isOpen={isOpen}
          />
        </nav>
      </aside>
    </>
  );
}

/* ── SubMenu: CSS grid row animation (no JS measurement needed) ── */
function SubMenu({
  isExpanded,
  children,
}: {
  isExpanded: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className="ml-[52px] mr-2 grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
      style={{
        gridTemplateRows: isExpanded ? "1fr" : "0fr",
        opacity: isExpanded ? 1 : 0,
      }}
    >
      <div className="overflow-hidden">
        <div className="pb-1 pt-0.5 flex flex-col gap-1">{children}</div>
      </div>
    </div>
  );
}

/* ── Nav Item ── */
function NavItem({
  href,
  icon,
  label,
  isActive,
  isOpen,
  className,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  isOpen: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "flex items-center my-[1px] rounded-xl transition-colors duration-150",
        isOpen ? "h-11 mx-2" : "h-11 w-11 mx-auto",
        isActive
          ? "bg-[#f0f0f0] text-foreground font-semibold"
          : "text-[#707070] hover:bg-[#f5f5f5] hover:text-foreground",
        !isOpen && "justify-center",
        className
      )}
    >
      <span
        className={clsx(
          "shrink-0 flex items-center justify-center",
          isOpen ? "w-10 ml-2" : "w-full"
        )}
      >
        {icon}
      </span>
      {isOpen && (
        <span className="text-[13px] whitespace-nowrap truncate">{label}</span>
      )}
    </Link>
  );
}

/* ── Divider ── */
function Divider() {
  return <div className="mx-4 my-2 border-t border-[#eee]" />;
}
