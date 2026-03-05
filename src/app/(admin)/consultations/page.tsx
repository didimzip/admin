"use client";

import React, { useState, useMemo } from "react";
import {
  RiCustomerService2Line,
  RiSearchLine,
  RiCloseLine,
  RiDownloadLine,
  RiTimeLine,
  RiCheckboxCircleLine,
  RiRefreshLine,
  RiMailLine,
  RiPhoneLine,
  RiUserLine,
  RiFileTextLine,
  RiMessageLine,
} from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type ConsultStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

type Consultation = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  jobTitle: string;
  postTitle: string;
  postCategory: string;
  message: string;
  status: ConsultStatus;
  adminMemo: string;
  createdAt: string;
  updatedAt: string;
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_CONSULTATIONS: Consultation[] = [
  { id: "c001", name: "김민준", email: "minjun.kim@startup.io", phone: "010-1234-5678", company: "넥스트벤처스", jobTitle: "대표이사", postTitle: "2025 스타트업 VC 투자 트렌드 분석", postCategory: "인사이트", message: "안녕하세요. 저희 스타트업이 시리즈A 투자를 준비 중인데, 현재 시장 트렌드와 VC 미팅 전략에 대해 상담을 받고 싶습니다. 가능하면 이번 주 중으로 미팅을 진행하고 싶습니다.", status: "PENDING", adminMemo: "", createdAt: "2026-03-05T09:14:00Z", updatedAt: "2026-03-05T09:14:00Z" },
  { id: "c002", name: "이수연", email: "suyeon.lee@fintech.co.kr", phone: "010-2345-6789", company: "핀테크솔루션", jobTitle: "CFO", postTitle: "글로벌 핀테크 규제 변화와 대응 전략", postCategory: "인사이트", message: "규제 샌드박스 신청 절차와 해외 진출 시 필요한 인허가 관련하여 전문가 조언을 구하고 싶습니다. 구체적인 사례 기반으로 상담해주시면 감사하겠습니다.", status: "IN_PROGRESS", adminMemo: "3/6 오후 2시 화상 미팅 예정. 자료 준비 중.", createdAt: "2026-03-04T14:22:00Z", updatedAt: "2026-03-05T10:00:00Z" },
  { id: "c003", name: "박준혁", email: "junhyuk.park@healthtech.kr", phone: "010-3456-7890", company: "헬스케어이노베이션", jobTitle: "CTO", postTitle: "헬스케어 스타트업 엑셀러레이터 프로그램 가이드", postCategory: "투자정보", message: "저희 회사가 헬스케어 AI 솔루션을 개발 중인데, 엑셀러레이터 프로그램 지원 자격 요건과 선발 과정에 대해 더 자세히 알고 싶습니다.", status: "COMPLETED", adminMemo: "3/3 전화 상담 완료. 프로그램 지원서 안내 이메일 발송 완료.", createdAt: "2026-03-03T11:05:00Z", updatedAt: "2026-03-03T16:30:00Z" },
  { id: "c004", name: "최지은", email: "jieun.choi@esginvest.com", phone: "010-4567-8901", company: "ESG인베스트먼트", jobTitle: "투자팀장", postTitle: "ESG 경영 도입 사례와 투자자 설득 전략", postCategory: "인사이트", message: "ESG 평가 기준과 실제 투자 심사 시 중점적으로 보는 항목이 무엇인지 궁금합니다. 포트폴리오 기업들에게 ESG 가이드라인을 제시하려고 합니다.", status: "PENDING", adminMemo: "", createdAt: "2026-03-05T08:30:00Z", updatedAt: "2026-03-05T08:30:00Z" },
  { id: "c005", name: "정승우", email: "seungwoo.jung@saas.io", phone: "010-5678-9012", company: "클라우드SaaS", jobTitle: "세일즈 디렉터", postTitle: "B2B SaaS 기업의 ARR 성장 전략", postCategory: "인사이트", message: "현재 ARR 5억 수준에서 다음 단계로 성장하기 위한 영업 전략과 파트너십 구축 방법에 대해 실질적인 조언을 원합니다.", status: "IN_PROGRESS", adminMemo: "담당자 배정 완료. 초기 자료 수집 중.", createdAt: "2026-03-04T16:45:00Z", updatedAt: "2026-03-05T09:00:00Z" },
  { id: "c006", name: "한나영", email: "nayoung.han@ailab.kr", phone: "010-6789-0123", company: "AI연구소", jobTitle: "연구원", postTitle: "2025 AI 스타트업 투자 현황과 전망", postCategory: "투자정보", message: "AI 분야 스타트업으로서 투자 유치 시 기술 평가 기준과 데모데이 발표 팁에 대해 알고 싶습니다.", status: "COMPLETED", adminMemo: "이메일로 자료 전달 완료. 후속 상담 불필요.", createdAt: "2026-03-02T13:20:00Z", updatedAt: "2026-03-02T17:00:00Z" },
  { id: "c007", name: "오재현", email: "jaehyun.oh@globalvc.com", phone: "010-7890-1234", company: "글로벌벤처캐피탈", jobTitle: "심사역", postTitle: "글로벌 스타트업 네트워킹 이벤트 안내", postCategory: "이벤트", message: "이벤트 참가 기업 선발 기준과 VC와의 1:1 매칭 방식에 대해 상세히 알고 싶습니다. 저희 포트폴리오 기업들도 참여시키고 싶습니다.", status: "PENDING", adminMemo: "", createdAt: "2026-03-05T07:55:00Z", updatedAt: "2026-03-05T07:55:00Z" },
  { id: "c008", name: "임서현", email: "seohyun.lim@accel.kr", phone: "010-8901-2345", company: "어클레러레이터K", jobTitle: "프로그램 매니저", postTitle: "스타트업 엑셀러레이터 선발 기준 공개", postCategory: "공지사항", message: "프로그램 지원 서류 양식과 심사 일정 관련하여 추가 문의드립니다. 공고에 나와있는 내용 외에 더 준비해야 할 사항이 있는지 궁금합니다.", status: "CANCELLED", adminMemo: "문의자가 직접 취소 요청.", createdAt: "2026-03-01T10:10:00Z", updatedAt: "2026-03-01T11:00:00Z" },
  { id: "c009", name: "강민서", email: "minseo.kang@gov.kr", phone: "010-9012-3456", company: "중소벤처기업부", jobTitle: "사무관", postTitle: "2025 스타트업 정부 지원 정책 총정리", postCategory: "인사이트", message: "정책 내용 중 일부 해석에 대한 공식 입장이 필요합니다. 자료 인용 허가 관련해서도 문의드립니다.", status: "IN_PROGRESS", adminMemo: "법무팀 검토 의뢰 중.", createdAt: "2026-03-04T09:30:00Z", updatedAt: "2026-03-04T15:00:00Z" },
  { id: "c010", name: "윤지호", email: "jiho.yoon@demo.io", phone: "010-0123-4567", company: "데모데이랩", jobTitle: "대표", postTitle: "IR 피칭 완벽 가이드: 투자자를 설득하는 법", postCategory: "인사이트", message: "IR 자료 첨삭 및 피칭 연습 프로그램이 있는지 궁금합니다. 다음 달 데모데이를 앞두고 준비 중입니다.", status: "COMPLETED", adminMemo: "피칭 클리닉 일정 안내 완료. 3/10 참가 확정.", createdAt: "2026-03-01T14:00:00Z", updatedAt: "2026-03-02T10:00:00Z" },
  { id: "c011", name: "송예린", email: "yerin.song@scaleup.kr", phone: "010-1111-2222", company: "스케일업파트너스", jobTitle: "파트너", postTitle: "해외 진출 스타트업의 글로벌 네트워킹 전략", postCategory: "네트워킹", message: "동남아 시장 진출을 위한 현지 파트너 연결 서비스가 있는지 문의합니다.", status: "PENDING", adminMemo: "", createdAt: "2026-03-05T11:00:00Z", updatedAt: "2026-03-05T11:00:00Z" },
  { id: "c012", name: "황태양", email: "taeyang.hwang@crypto.io", phone: "010-2222-3333", company: "크립토벤처", jobTitle: "COO", postTitle: "블록체인 스타트업 규제 대응 가이드", postCategory: "인사이트", message: "가상자산 관련 라이선스 취득 절차와 관련 법인 설립 시 주의사항에 대해 전문가 상담을 원합니다.", status: "PENDING", adminMemo: "", createdAt: "2026-03-05T10:45:00Z", updatedAt: "2026-03-05T10:45:00Z" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ConsultStatus, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING: { label: "대기중", color: "bg-amber-100 text-amber-700", icon: <RiTimeLine className="h-3 w-3" /> },
  IN_PROGRESS: { label: "처리중", color: "bg-blue-100 text-blue-700", icon: <RiRefreshLine className="h-3 w-3" /> },
  COMPLETED: { label: "완료", color: "bg-green-100 text-green-700", icon: <RiCheckboxCircleLine className="h-3 w-3" /> },
  CANCELLED: { label: "취소", color: "bg-slate-100 text-slate-500", icon: <RiCloseLine className="h-3 w-3" /> },
};

function StatusBadge({ status }: { status: ConsultStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", cfg.color)}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

// ─── Detail Drawer (fixed, slides in from right) ─────────────────────────────

function DetailDrawer({
  item,
  onClose,
  onStatusChange,
  onMemoChange,
}: {
  item: Consultation | null;
  onClose: () => void;
  onStatusChange: (id: string, status: ConsultStatus) => void;
  onMemoChange: (id: string, memo: string) => void;
}) {
  const [memo, setMemo] = useState("");
  const [memoSaved, setMemoSaved] = useState(false);

  React.useEffect(() => {
    if (item) { setMemo(item.adminMemo); setMemoSaved(false); }
  }, [item?.id, item?.adminMemo]);

  const saveMemo = () => {
    if (!item) return;
    onMemoChange(item.id, memo);
    setMemoSaved(true);
    setTimeout(() => setMemoSaved(false), 2000);
  };

  const isOpen = !!item;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-black/20 transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      />

      {/* Drawer panel */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-[400px] flex-col bg-white shadow-[-8px_0_40px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {item && (
          <>
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <RiMessageLine className="h-4 w-4 text-indigo-600" />
                <span className="text-sm font-semibold text-slate-900">상담 상세</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <RiCloseLine className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* Status row */}
              <div className="flex items-center justify-between">
                <StatusBadge status={item.status} />
                <select
                  value={item.status}
                  onChange={(e) => onStatusChange(item.id, e.target.value as ConsultStatus)}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                >
                  <option value="PENDING">대기중</option>
                  <option value="IN_PROGRESS">처리중</option>
                  <option value="COMPLETED">완료</option>
                  <option value="CANCELLED">취소</option>
                </select>
              </div>

              {/* Requester info */}
              <div className="rounded-xl bg-slate-50 p-4 space-y-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">신청자 정보</p>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 text-slate-700">
                    <RiUserLine className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="font-medium">{item.name}</span>
                    <span className="text-slate-400">· {item.jobTitle}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <RiFileTextLine className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    {item.company}
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <RiMailLine className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    {item.email}
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <RiPhoneLine className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    {item.phone}
                  </div>
                </div>
              </div>

              {/* Related post */}
              <div>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">관련 게시물</p>
                <p className="text-sm font-medium leading-snug text-slate-800">{item.postTitle}</p>
                <span className="mt-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500">
                  {item.postCategory}
                </span>
              </div>

              {/* Message */}
              <div>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">상담 내용</p>
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-3 text-xs leading-relaxed text-slate-700">
                  {item.message}
                </div>
              </div>

              {/* Admin memo */}
              <div>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">관리자 메모</p>
                <textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  rows={3}
                  placeholder="내부용 메모를 입력하세요..."
                  className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-300 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                />
                <div className="mt-1.5 flex items-center justify-between">
                  {memoSaved
                    ? <span className="text-[11px] text-green-600">저장되었습니다.</span>
                    : <span />}
                  <button
                    onClick={saveMemo}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
                  >
                    메모 저장
                  </button>
                </div>
              </div>

              {/* Timestamps */}
              <div className="space-y-1 border-t border-slate-100 pt-3">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>신청일</span><span>{formatDate(item.createdAt)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>최종 수정</span><span>{formatDate(item.updatedAt)}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ConsultationsPage() {
  const [data, setData] = useState<Consultation[]>(MOCK_CONSULTATIONS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ConsultStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedItem, setSelectedItem] = useState<Consultation | null>(null);

  const filtered = useMemo(() => {
    return data.filter((c) => {
      const matchStatus = statusFilter === "ALL" || c.status === statusFilter;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.postTitle.toLowerCase().includes(q) ||
        c.message.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [data, search, statusFilter]);

  const pagedItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  const counts = useMemo(() => ({
    all: data.length,
    pending: data.filter((c) => c.status === "PENDING").length,
    inProgress: data.filter((c) => c.status === "IN_PROGRESS").length,
    completed: data.filter((c) => c.status === "COMPLETED").length,
  }), [data]);

  const handleStatusChange = (id: string, status: ConsultStatus) => {
    const now = new Date().toISOString();
    setData((prev) => prev.map((c) => (c.id === id ? { ...c, status, updatedAt: now } : c)));
    setSelectedItem((prev) => (prev?.id === id ? { ...prev, status, updatedAt: now } : prev));
  };

  const handleMemoChange = (id: string, adminMemo: string) => {
    const now = new Date().toISOString();
    setData((prev) => prev.map((c) => (c.id === id ? { ...c, adminMemo, updatedAt: now } : c)));
    setSelectedItem((prev) => (prev?.id === id ? { ...prev, adminMemo, updatedAt: now } : prev));
  };

  const handleExport = () => {
    const headers = ["ID", "이름", "이메일", "전화번호", "회사", "직책", "관련게시물", "카테고리", "상태", "메모", "신청일"];
    const rows = filtered.map((c) => [
      c.id, c.name, c.email, c.phone, c.company, c.jobTitle,
      c.postTitle, c.postCategory, STATUS_CONFIG[c.status].label,
      c.adminMemo, formatDate(c.createdAt),
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `consultations_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">상담 관리</h2>
          <p className="mt-0.5 text-sm text-slate-500">콘텐츠를 통해 접수된 상담 신청을 관리합니다.</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <RiDownloadLine className="mr-1.5 h-4 w-4" />
          CSV 내보내기
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "전체", value: counts.all, color: "text-slate-700", bg: "bg-slate-50 border-slate-200" },
          { label: "대기중", value: counts.pending, color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
          { label: "처리중", value: counts.inProgress, color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
          { label: "완료", value: counts.completed, color: "text-green-700", bg: "bg-green-50 border-green-200" },
        ].map((card) => (
          <div key={card.label} className={cn("rounded-xl border p-4", card.bg)}>
            <p className="text-xs text-slate-500">{card.label}</p>
            <p className={cn("mt-1 text-2xl font-bold", card.color)}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {(["ALL", "PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const).map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                statusFilter === s ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-700"
              )}
            >
              {s === "ALL" ? "전체" : STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <RiSearchLine className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="이름, 이메일, 회사, 내용 검색"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="h-9 w-64 pl-8 text-sm"
          />
        </div>
        {(search || statusFilter !== "ALL") && (
          <button
            onClick={() => { setSearch(""); setStatusFilter("ALL"); setPage(1); }}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-slate-400 transition-colors hover:text-slate-600"
          >
            <RiCloseLine className="h-3.5 w-3.5" /> 초기화
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <h3 className="text-sm font-semibold text-slate-800">상담 목록</h3>
          <span className="text-xs text-slate-500">총 {filtered.length.toLocaleString()}건</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left">
                <th className="px-5 py-3 text-xs font-semibold text-slate-500">신청자</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">회사 / 직책</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">관련 게시물</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">상태</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">신청일</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">처리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pagedItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-sm text-slate-400">
                    <RiCustomerService2Line className="mx-auto mb-3 h-10 w-10 opacity-20" />
                    검색 결과가 없습니다.
                  </td>
                </tr>
              ) : (
                pagedItems.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedItem(selectedItem?.id === c.id ? null : c)}
                    className={cn(
                      "cursor-pointer transition-colors hover:bg-slate-50",
                      selectedItem?.id === c.id && "bg-indigo-50/60 hover:bg-indigo-50"
                    )}
                  >
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-slate-800">{c.name}</div>
                      <div className="text-xs text-slate-400">{c.email}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-slate-700">{c.company}</div>
                      <div className="text-xs text-slate-400">{c.jobTitle}</div>
                    </td>
                    <td className="px-4 py-3.5 max-w-[200px]">
                      <p className="line-clamp-1 text-slate-700">{c.postTitle}</p>
                      <span className="inline-block mt-0.5 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500">
                        {c.postCategory}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                      {formatDate(c.createdAt)}
                    </td>
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={c.status}
                        onChange={(e) => handleStatusChange(c.id, e.target.value as ConsultStatus)}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      >
                        <option value="PENDING">대기중</option>
                        <option value="IN_PROGRESS">처리중</option>
                        <option value="COMPLETED">완료</option>
                        <option value="CANCELLED">취소</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 pb-4">
          <PaginationBar total={filtered.length} page={page} pageSize={pageSize}
            onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
        </div>
      </div>

      {/* Slide-in drawer from right */}
      <DetailDrawer
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onStatusChange={handleStatusChange}
        onMemoChange={handleMemoChange}
      />
    </div>
  );
}
