"use client";

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "./utils";

type ToastContextValue = {
  showToast: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMessage(msg);
    setVisible(true);
    timerRef.current = setTimeout(() => setVisible(false), 3000);
  }, []);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className={cn(
          "fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 transition-all duration-300",
          visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"
        )}
      >
        <div className="flex items-center gap-2.5 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-xl whitespace-nowrap">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400" />
          {message}
        </div>
      </div>
    </ToastContext.Provider>
  );
}
