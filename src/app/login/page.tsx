"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import { login, getSession } from "@/lib/auth-store";
import { passwordSchema } from "@/lib/validations/auth";
import { cn } from "@/lib/utils";

// ─── 비밀번호 규칙 체크 ───────────────────────────────────────────────────────

function PasswordRules({ password }: { password: string }) {
  const rules = [
    { label: "8자 이상", pass: password.length >= 8 },
    { label: "영문 포함", pass: /[a-zA-Z]/.test(password) },
    { label: "숫자 포함", pass: /[0-9]/.test(password) },
    { label: "특수문자 포함", pass: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];

  return (
    <div className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1">
      {rules.map((rule) => (
        <div
          key={rule.label}
          className={cn(
            "flex items-center gap-1.5 text-xs transition-colors",
            rule.pass ? "text-green-600" : "text-slate-400"
          )}
        >
          <CheckCircle2
            className={cn(
              "h-3 w-3 shrink-0",
              rule.pass ? "text-green-500" : "text-slate-300"
            )}
          />
          {rule.label}
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 비밀번호 찾기
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  // 이미 로그인된 경우 대시보드로
  useEffect(() => {
    if (getSession()) router.replace("/dashboard");
  }, [router]);

  async function submitLogin() {
    setError(null);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    const result = login(email.trim(), password);
    if (result.ok) {
      router.replace("/dashboard");
    } else if (result.reason === "inactive_account") {
      setError("비활성화된 계정입니다. 관리자에게 문의하세요.");
    } else {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
    }
    setLoading(false);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    await submitLogin();
  }

  async function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault();
    setForgotLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setForgotSent(true);
    setForgotLoading(false);
  }

  return (
    <div className="w-full max-w-[400px]">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 shadow-md">
          <span className="text-lg font-bold text-white">D</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">DidimZip Admin</h1>
        <p className="mt-1 text-sm text-slate-500">관리자 계정으로 로그인하세요</p>
      </div>

      {/* Login Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">이메일</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) void submitLogin(); }}
                placeholder="admin@didimzip.com"
                required
                autoComplete="email"
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-300 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">비밀번호</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) void submitLogin(); }}
                placeholder="비밀번호 입력"
                required
                autoComplete="current-password"
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-10 text-sm text-slate-900 placeholder:text-slate-300 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={cn(
              "flex h-10 w-full items-center justify-center rounded-lg text-sm font-semibold transition-colors",
              loading
                ? "bg-indigo-400 text-white cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            )}
          >
            {loading ? (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              "로그인"
            )}
          </button>
        </form>

        {/* Forgot Password */}
        <div className="mt-5 border-t border-slate-100 pt-4">
          <button
            onClick={() => { setShowForgot((v) => !v); setForgotSent(false); setForgotEmail(""); }}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
          >
            비밀번호를 잊으셨나요?
            {showForgot
              ? <ChevronUp className="h-3.5 w-3.5" />
              : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {showForgot && (
            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              {forgotSent ? (
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                  비밀번호 재설정 이메일을 발송했습니다.
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="flex items-center gap-2">
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="가입한 이메일 주소"
                    required
                    className="h-8 flex-1 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800 placeholder:text-slate-300 focus:border-indigo-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="h-8 shrink-0 rounded-md bg-indigo-600 px-3 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {forgotLoading ? "발송 중..." : "링크 발송"}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Hint (dev only) */}
      <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-white/60 p-3 text-xs text-slate-400">
        <p className="font-medium text-slate-500 mb-1">테스트 계정</p>
        <p>슈퍼관리자: admin@didimzip.com / test123!</p>
        <p>운영관리자: operator@didimzip.com / test123!</p>
      </div>
    </div>
  );
}
