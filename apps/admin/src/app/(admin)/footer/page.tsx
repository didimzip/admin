"use client";

import { useEffect, useState } from "react";
import {
  RiLayoutBottom2Line,
  RiSave3Line,
  RiAddLine,
  RiDeleteBinLine,
  RiArrowUpLine,
  RiArrowDownLine,
  RiArrowDownSLine,
  RiInformationLine,
  RiLinksLine,
} from "react-icons/ri";
import { useToast } from "@/lib/toast-context";
import {
  getFooterSettings,
  saveFooterSettings,
  getFamilySites,
  saveFamilySites,
  type FooterSettings,
  type FamilySite,
} from "@/lib/footer-store";

// ─── Footer 설정 (통합 관리 페이지) ────────────────────────────────────────────
// Footer 관련 모든 데이터를 한 페이지의 섹션(Accordion)으로 관리한다.
// 향후 SNS·약관·개인정보처리방침 등은 <Section>을 추가하기만 하면 확장된다.

type SettingsForm = Omit<FooterSettings, "updatedAt">;

const EMPTY_SETTINGS: SettingsForm = {
  companyName: "",
  ceo: "",
  bizNumber: "",
  address: "",
  customerEmail: "",
  operatingHours: "",
  copyright: "",
};

const SETTINGS_FIELDS: Array<{
  key: keyof SettingsForm;
  label: string;
  hint?: string;
  multiline?: boolean;
}> = [
  { key: "companyName", label: "회사명" },
  { key: "ceo", label: "대표자" },
  { key: "bizNumber", label: "사업자등록번호" },
  { key: "address", label: "주소" },
  { key: "customerEmail", label: "고객지원 문의(이메일)" },
  { key: "operatingHours", label: "운영시간 안내", hint: "고객지원 문구 전체", multiline: true },
  { key: "copyright", label: "Copyright" },
];

type SiteRow = {
  id?: string;
  name: string;
  url: string;
  newTab: boolean;
  isVisible: boolean;
};

export default function FooterSettingsPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);

  // ── 기본 정보 ──
  const [form, setForm] = useState<SettingsForm>(EMPTY_SETTINGS);
  const [savingSettings, setSavingSettings] = useState(false);

  // ── 관련 사이트 ──
  const [rows, setRows] = useState<SiteRow[]>([]);
  const [savingSites, setSavingSites] = useState(false);

  useEffect(() => {
    let alive = true;
    Promise.all([getFooterSettings(), getFamilySites()])
      .then(([s, sites]) => {
        if (!alive) return;
        const { updatedAt: _u, ...rest } = s;
        void _u;
        setForm(rest);
        setRows(
          sites.map((x) => ({
            id: x.id,
            name: x.name,
            url: x.url,
            newTab: x.newTab,
            isVisible: x.isVisible,
          })),
        );
      })
      .catch(() => showToast("Footer 설정을 불러오지 못했습니다.", "error"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [showToast]);

  // ── 기본 정보 핸들러 ──
  const updateField = (key: keyof SettingsForm, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSaveSettings = async () => {
    if (!form.companyName.trim()) {
      showToast("회사명을 입력해주세요.", "error");
      return;
    }
    setSavingSettings(true);
    try {
      await saveFooterSettings(form);
      showToast("Footer 기본 정보가 저장되었습니다.");
    } catch {
      showToast("저장에 실패했습니다.", "error");
    } finally {
      setSavingSettings(false);
    }
  };

  // ── 관련 사이트 핸들러 ──
  const updateRow = (i: number, patch: Partial<SiteRow>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const addRow = () =>
    setRows((rs) => [...rs, { name: "", url: "", newTab: true, isVisible: true }]);
  const removeRow = (i: number) => setRows((rs) => rs.filter((_, idx) => idx !== i));
  const moveRow = (i: number, dir: -1 | 1) =>
    setRows((rs) => {
      const j = i + dir;
      if (j < 0 || j >= rs.length) return rs;
      const next = [...rs];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const handleSaveSites = async () => {
    if (rows.some((r) => !r.name.trim())) {
      showToast("사이트명을 모두 입력해주세요.", "error");
      return;
    }
    if (rows.some((r) => !r.url.trim())) {
      showToast("URL을 모두 입력해주세요.", "error");
      return;
    }
    setSavingSites(true);
    try {
      const saved = await saveFamilySites(
        rows.map((r) => ({
          id: r.id,
          name: r.name.trim(),
          url: r.url.trim(),
          newTab: r.newTab,
          isVisible: r.isVisible,
        })),
      );
      setRows(
        saved.map((x) => ({
          id: x.id,
          name: x.name,
          url: x.url,
          newTab: x.newTab,
          isVisible: x.isVisible,
        })),
      );
      showToast("관련 사이트가 저장되었습니다.");
    } catch {
      showToast("저장에 실패했습니다.", "error");
    } finally {
      setSavingSites(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center gap-2">
        <RiLayoutBottom2Line className="h-6 w-6 text-indigo-600" />
        <div>
          <h1 className="text-xl font-bold text-slate-900">Footer 설정</h1>
          <p className="text-sm text-slate-500">
            Web 하단 Footer의 모든 정보를 한 곳에서 관리합니다. 저장 시 즉시 반영됩니다.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-400 shadow-sm">
          불러오는 중…
        </div>
      ) : (
        <div className="space-y-4">
          {/* ── 섹션 1: 기본 정보 ── */}
          <Section title="기본 정보" icon={<RiInformationLine className="h-4 w-4 text-slate-400" />} defaultOpen>
            {/* 로고 (SVG 컴포넌트로 관리) */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">로고</label>
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <LogoPreview />
                <p className="text-xs text-slate-400">
                  로고는 코드의 Logo 컴포넌트(SVG)로 관리됩니다. 전달받은 SVG로 교체 예정.
                </p>
              </div>
            </div>

            {SETTINGS_FIELDS.map((field) => (
              <div key={field.key}>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  {field.label}
                  {field.hint && (
                    <span className="ml-2 font-normal text-slate-400">{field.hint}</span>
                  )}
                </label>
                {field.multiline ? (
                  <textarea
                    value={form[field.key]}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    rows={2}
                    className="w-full resize-none rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                ) : (
                  <input
                    value={form[field.key]}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                )}
              </div>
            ))}

            <div className="flex justify-end pt-1">
              <button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
              >
                <RiSave3Line className="h-4 w-4" />
                기본 정보 저장
              </button>
            </div>
          </Section>

          {/* ── 섹션 2: 관련 사이트 ── */}
          <Section
            title="관련 사이트 (Family Site)"
            icon={<RiLinksLine className="h-4 w-4 text-slate-400" />}
            defaultOpen
            headerRight={
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addRow();
                }}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-slate-300"
              >
                <RiAddLine className="h-4 w-4" />
                사이트 추가
              </button>
            }
          >
            {rows.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">
                등록된 관련 사이트가 없습니다. &lsquo;사이트 추가&rsquo;를 눌러 추가하세요.
              </p>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-[28px_1.2fr_1.8fr_auto_auto_auto] items-center gap-3 px-1 text-[11px] font-medium text-slate-400">
                  <span>#</span>
                  <span>사이트명</span>
                  <span>URL</span>
                  <span className="text-center">새 창</span>
                  <span className="text-center">노출</span>
                  <span className="text-center">관리</span>
                </div>
                {rows.map((r, i) => (
                  <div
                    key={r.id ?? `new-${i}`}
                    className="grid grid-cols-[28px_1.2fr_1.8fr_auto_auto_auto] items-center gap-3"
                  >
                    <span className="text-center text-sm font-medium text-slate-400">{i + 1}</span>
                    <input
                      value={r.name}
                      onChange={(e) => updateRow(i, { name: e.target.value })}
                      placeholder="사이트명"
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                    <input
                      value={r.url}
                      onChange={(e) => updateRow(i, { url: e.target.value })}
                      placeholder="https:// 또는 /path"
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                    <button
                      onClick={() => updateRow(i, { newTab: !r.newTab })}
                      title="새 창으로 열기"
                      className={toggleCls(r.newTab)}
                    >
                      <span className={knobCls(r.newTab)} />
                    </button>
                    <button
                      onClick={() => updateRow(i, { isVisible: !r.isVisible })}
                      title={r.isVisible ? "노출 중" : "숨김"}
                      className={toggleCls(r.isVisible)}
                    >
                      <span className={knobCls(r.isVisible)} />
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveRow(i, -1)}
                        disabled={i === 0}
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-30"
                        title="위로"
                      >
                        <RiArrowUpLine className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => moveRow(i, 1)}
                        disabled={i === rows.length - 1}
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-30"
                        title="아래로"
                      >
                        <RiArrowDownLine className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => removeRow(i)}
                        className="rounded p-1 text-red-400 hover:bg-red-50"
                        title="삭제"
                      >
                        <RiDeleteBinLine className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={handleSaveSites}
                disabled={savingSites}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
              >
                <RiSave3Line className="h-4 w-4" />
                관련 사이트 저장
              </button>
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}

// ─── 확장 가능한 섹션(Accordion) ───────────────────────────────────────────────
function Section({
  title,
  icon,
  defaultOpen = false,
  headerRight,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex flex-1 items-center gap-2 text-left"
        >
          <RiArrowDownSLine
            className={`h-4 w-4 text-slate-400 transition-transform ${open ? "" : "-rotate-90"}`}
          />
          {icon}
          <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
        </button>
        {headerRight}
      </div>
      {open && <div className="space-y-5 px-6 py-5">{children}</div>}
    </div>
  );
}

function LogoPreview() {
  // 실제 브랜드 로고(Logo.svg) — currentColor 상속
  return (
    <svg
      className="text-slate-800"
      width={(153 / 40) * 26}
      height={26}
      viewBox="0 0 153 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="DidimZip"
    >
      <g clipPath="url(#didimzip_admin_logo_clip)">
        <path d="M43.3848 15.6367H49.0993C55.0993 15.6367 59.0634 19.2145 59.0378 24.6316C59.0634 30.0487 55.0993 33.6265 49.0993 33.6265H43.3848V15.6367ZM49.0993 29.7C52.7266 29.7 54.8634 27.8248 54.8634 24.6316C54.8634 21.4384 52.7266 19.5632 49.0993 19.5632H47.5591V29.7017H49.0993V29.7Z" fill="currentColor" />
        <path d="M61.0654 16.8989C61.0654 15.5827 62.0723 14.5997 63.4005 14.6134C64.7304 14.6015 65.7355 15.5827 65.7355 16.8989C65.7355 18.2151 64.7287 19.1724 63.4005 19.1844C62.0706 19.1724 61.0654 18.2032 61.0654 16.8989ZM61.3885 20.7997H65.4141V33.6203H61.3885V20.7997Z" fill="currentColor" />
        <path d="M77.3659 33.6204V31.9554H77.2668C76.4719 33.3229 75.2292 33.9674 73.5899 33.9674C70.0993 33.9674 67.6394 31.0597 67.6514 27.2084C67.6394 23.3571 70.0993 20.4494 73.5899 20.4494C75.2292 20.4494 76.4719 21.0956 77.2668 22.4614H77.3659V15.6289H81.3916V33.6186H77.3659V33.6204ZM77.4651 27.2101C77.4651 25.3845 76.26 24.0922 74.5574 24.1041C72.8685 24.0922 71.6634 25.3845 71.6753 27.2101C71.6634 29.0357 72.8685 30.3281 74.5574 30.3161C76.26 30.3281 77.4651 29.0357 77.4651 27.2101Z" fill="currentColor" />
        <path d="M83.9385 16.8989C83.9385 15.5827 84.9453 14.5997 86.2735 14.6134C87.6034 14.6015 88.6086 15.5827 88.6086 16.8989C88.6086 18.2151 87.6017 19.1724 86.2735 19.1844C84.9436 19.1724 83.9385 18.2032 83.9385 16.8989ZM84.2616 20.7997H88.2872V33.6203H84.2616V20.7997Z" fill="currentColor" />
        <path d="M91.1699 20.8018H95.1956V22.7147H95.2708C95.9545 21.3112 97.2964 20.4531 98.9973 20.4531C100.861 20.4531 102.228 21.4959 102.898 23.2856H102.973C103.532 21.5591 105.049 20.4531 107.023 20.4531C109.794 20.4531 111.471 22.6155 111.471 26.0941V33.6224H107.471V26.7899C107.459 25.101 106.725 24.0942 105.483 24.1061C104.278 24.0942 103.334 25.0993 103.32 27.46V33.6224H99.3203V26.7899C99.3203 25.101 98.587 24.0942 97.3579 24.1061C96.1409 24.0942 95.2092 25.0753 95.1956 27.3608V33.6224H91.1699V20.8018Z" fill="currentColor" />
        <path d="M114.737 29.6939L122.862 19.6802V19.5554H114.836V15.6289H128.602V19.4306L120.329 29.593V29.6922H128.802V33.6186H114.739V29.6922L114.737 29.6939Z" fill="currentColor" />
        <path d="M131.337 16.8989C131.337 15.5827 132.344 14.5997 133.672 14.6134C135.002 14.6015 136.007 15.5827 136.007 16.8989C136.007 18.2151 135 19.1724 133.672 19.1844C132.342 19.1724 131.337 18.2032 131.337 16.8989ZM131.66 20.7997H135.686V33.6203H131.66V20.7997Z" fill="currentColor" />
        <path d="M138.568 20.8001H142.594V22.4651H142.693C143.476 21.0993 144.731 20.4531 146.37 20.4531C149.849 20.4531 152.309 23.3608 152.309 27.2121C152.309 31.0634 149.849 33.9711 146.37 33.9711C144.731 33.9711 143.476 33.3249 142.693 31.9591H142.594V38.9916H138.568V20.8036V20.8001ZM148.283 27.2121C148.283 25.3865 147.078 24.0942 145.401 24.1061C143.686 24.0942 142.481 25.3865 142.493 27.2121C142.481 29.0377 143.686 30.33 145.401 30.3181C147.078 30.33 148.283 29.0377 148.283 27.2121Z" fill="currentColor" />
        <path d="M16.9265 0H0V40H36.9231V18.0034L16.9265 0ZM33.0769 36.1538H3.84615V14.6154H12.6581L16.9231 18.4547L16.9299 18.4615H33.0769V36.1538Z" fill="currentColor" />
      </g>
      <defs>
        <clipPath id="didimzip_admin_logo_clip">
          <rect width="152.308" height="40" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

function toggleCls(on: boolean): string {
  return [
    "relative inline-flex h-5 w-9 shrink-0 items-center justify-self-center rounded-full transition-colors",
    on ? "bg-indigo-600" : "bg-slate-300",
  ].join(" ");
}
function knobCls(on: boolean): string {
  return [
    "inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform",
    on ? "translate-x-[18px]" : "translate-x-[3px]",
  ].join(" ");
}
