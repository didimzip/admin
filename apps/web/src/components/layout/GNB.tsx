"use client";

import { Search, Bookmark, Bell } from "lucide-react";

export default function GNB() {
  return (
    <header className="fixed top-0 left-[60px] right-0 h-14 bg-white border-b border-border flex items-center justify-between px-6 z-30">
      {/* Search */}
      <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 w-80">
        <Search size={16} className="text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          검색하려면 / 를 누르세요.
        </span>
        <kbd className="ml-auto text-xs text-muted-foreground bg-white border border-border rounded px-1.5 py-0.5">
          /
        </kbd>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        <button className="p-2 rounded-lg hover:bg-muted transition-colors">
          <Bookmark size={20} className="text-muted-foreground" />
        </button>
        <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
          <Bell size={20} className="text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <button className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-semibold ml-1">
          조
        </button>
      </div>
    </header>
  );
}
