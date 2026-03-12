"use client";

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, X } from "lucide-react";
import { cn } from "./utils";

type ToastType = "success" | "error" | "warning";

type ToastOptions = {
  type?: ToastType;
  onUndo?: () => void;
  duration?: number;
};

type ToastContextValue = {
  showToast: (message: string, typeOrOptions?: ToastType | ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState<ToastType>("success");
  const [onUndo, setOnUndo] = useState<(() => void) | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => setVisible(false), []);

  const showToast = useCallback((msg: string, typeOrOptions?: ToastType | ToastOptions) => {
    if (timerRef.current) clearTimeout(timerRef.current);

    let t: ToastType = "success";
    let undoFn: (() => void) | null = null;
    let duration = 3000;

    if (typeof typeOrOptions === "string") {
      t = typeOrOptions;
    } else if (typeOrOptions) {
      t = typeOrOptions.type ?? "success";
      undoFn = typeOrOptions.onUndo ?? null;
      duration = typeOrOptions.duration ?? (undoFn ? 5000 : 3000);
    }

    setMessage(msg);
    setType(t);
    setOnUndo(() => undoFn);
    setVisible(true);
    timerRef.current = setTimeout(() => setVisible(false), duration);
  }, []);

  const handleUndo = useCallback(() => {
    if (onUndo) onUndo();
    setVisible(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, [onUndo]);

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
        <div className="flex items-center gap-3 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-xl whitespace-nowrap">
          {!onUndo && (
            type === "error"
              ? <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              : type === "warning"
                ? <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                : <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400" />
          )}
          {message}
          {onUndo && (
            <button
              onClick={handleUndo}
              className="ml-1 text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              실행취소
            </button>
          )}
          <button
            onClick={dismiss}
            className="ml-1 text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </ToastContext.Provider>
  );
}
