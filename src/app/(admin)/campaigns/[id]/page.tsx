"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Mail, MessageCircle, MessageSquare, Send, Pencil, Copy, Ban, Trash2, Users, CheckCircle2, XCircle, BarChart2, ChevronUp, ChevronDown, ChevronsUpDown, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCampaign, getAllCampaigns, upsertCampaign, deleteCampaign, getTargetUsers, getTargetUsersForSms, type StoredCampaign } from "@/lib/campaign-store";
import { getAllAdmins } from "@/lib/auth-store";
import { type CampaignStatus, type CampaignChannel } from "@/data/mock-data";
import { useToast } from "@/lib/toast-context";
import { cn } from "@/lib/utils";

const statusConfig: Record<CampaignStatus, { label: string; variant: "success" | "warning" | "secondary" | "destructive" }> = {
  SENT: { label: "발송 완료", variant: "success" },
  SCHEDULED: { label: "발송 예정", variant: "warning" },
  DRAFT: { label: "작성 중", variant: "secondary" },
  CANCELLED: { label: "취소됨", variant: "destructive" },
};

const channelConfig: Record<CampaignChannel, { label: string; icon: typeof Mail }> = {
  EMAIL: { label: "이메일", icon: Mail },
  BRANDMSG: { label: "브랜드 메시지", icon: MessageCircle },
  SMS: { label: "문자", icon: MessageSquare },
  PUSH: { label: "푸시", icon: Send },
};

export default function CampaignDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const [campaign, setCampaign] = useState<StoredCampaign | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<"content" | "history">("content");
  const [historySort, setHistorySort] = useState<{ key: "nickname" | "email" | "companyName" | "jobCategory" | "failed"; dir: "asc" | "desc" }>({ key: "failed", dir: "asc" });
  const [historyFilter, setHistoryFilter] = useState<"all" | "success" | "failed">("all");
  const allCampaigns = getAllCampaigns().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  useEffect(() => {
    const c = getCampaign(id);
    if (!c) { router.replace("/campaigns"); return; }
    setCampaign(c);
    setActiveTab("content");
  }, [id, router]);

  if (!campaign) return null;

  const sc = statusConfig[campaign.status];
  const ch = channelConfig[campaign.channel] ?? channelConfig.EMAIL;
  const ChIcon = ch.icon;

  const admins = getAllAdmins();
  const creatorName = campaign.createdBy
    ? (admins.find((a) => a.id === campaign.createdBy)?.name ?? null)
    : null;

  const filterParts: string[] = [];
  if (campaign.targetFilter.companyTypes?.length > 0) filterParts.push(...campaign.targetFilter.companyTypes);
  if (campaign.targetFilter.jobCategories?.length > 0) filterParts.push(...campaign.targetFilter.jobCategories);
  if (campaign.targetFilter.authStatus) {
    const labels: Record<string, string> = { NONE: "미인증", PENDING: "심사중", VERIFIED: "인증완료" };
    filterParts.push(labels[campaign.targetFilter.authStatus] ?? campaign.targetFilter.authStatus);
  }
  if (campaign.targetFilter.hasBadge === true) filterParts.push("뱃지 있음");
  if (campaign.targetFilter.hasBadge === false) filterParts.push("뱃지 없음");

  const dateStr = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";

  const hasFailed = (campaign.failedCount ?? 0) > 0;

  function handleCancelScheduled() {
    const updated = upsertCampaign({ ...campaign!, status: "CANCELLED" });
    setCampaign(updated);
    showToast("예약 발송이 취소되었습니다.", "success");
  }

  function handleDuplicate() {
    const copy = upsertCampaign({
      ...campaign!,
      id: null,
      title: `(복사) ${campaign!.title}`,
      status: "DRAFT",
      sentCount: 0,
      openRate: 0,
      sentAt: null,
    });
    router.push(`/campaigns/new?edit=${copy.id}`);
  }

  function handleDelete() {
    deleteCampaign(campaign!.id);
    showToast("마케팅이 삭제되었습니다.", "success");
    router.push("/campaigns");
  }

  return (
    <>
      <div className="flex gap-5 items-start">

        {/* 본문 */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* 상단 통합 카드 */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            {/* 헤더 행 */}
            <div className="flex items-start gap-3 p-5">
              <Button variant="ghost" size="sm" className="mt-0.5 h-8 w-8 p-0 shrink-0" onClick={() => router.push("/campaigns")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-slate-900 truncate">{campaign.title}</h2>
                  <Badge variant={sc.variant}>{sc.label}</Badge>
                </div>
                {campaign.description && (
                  <p className="mt-0.5 text-sm text-slate-500">{campaign.description}</p>
                )}
                {/* 메타 행 */}
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <ChIcon className="h-3.5 w-3.5 text-slate-400" />
                    {ch.label}
                  </span>
                  <span>{campaign.sendType === "IMMEDIATE" ? "즉시 발송" : "예약 발송"}</span>
                  <span>{campaign.sentAt ? dateStr(campaign.sentAt) : dateStr(campaign.scheduledAt)}</span>
                  {creatorName && (
                    <>
                      <span className="text-slate-300">|</span>
                      <span>작성자: <span className="font-medium text-slate-700">{creatorName}</span></span>
                    </>
                  )}
                  <span className="text-slate-300">|</span>
                  <span className="flex flex-wrap gap-1">
                    {filterParts.length === 0 ? (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-500">전체 회원</span>
                    ) : (
                      filterParts.map((p) => (
                        <span key={p} className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-500">{p}</span>
                      ))
                    )}
                  </span>
                </div>
              </div>
              {/* 액션 버튼 */}
              <div className="flex items-center gap-2 shrink-0">
                {campaign.status === "DRAFT" && (
                  <Button variant="outline" size="sm" onClick={() => router.push(`/campaigns/new?edit=${campaign.id}`)} className="gap-1.5">
                    <Pencil className="h-3.5 w-3.5" />편집
                  </Button>
                )}
                {campaign.status === "SCHEDULED" && (
                  <Button variant="outline" size="sm" onClick={handleCancelScheduled} className="gap-1.5 border-amber-300 text-amber-600 hover:bg-amber-50">
                    <Ban className="h-3.5 w-3.5" />예약 취소
                  </Button>
                )}
                {(campaign.status === "SENT" || campaign.status === "CANCELLED") && (
                  <Button variant="outline" size="sm" onClick={handleDuplicate} className="gap-1.5">
                    <Copy className="h-3.5 w-3.5" />복제
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(true)} className="gap-1.5 border-red-200 text-red-500 hover:bg-red-50">
                  <Trash2 className="h-3.5 w-3.5" />삭제
                </Button>
              </div>
            </div>

            {/* 스탯 행 (발송 완료일 때만) */}
            {campaign.status === "SENT" && (
              <div className="grid grid-cols-4 divide-x divide-slate-100 border-t border-slate-100">
                {[
                  { icon: Users, label: "타겟 대상", value: `${campaign.targetCount}명`, color: "text-slate-700" },
                  { icon: CheckCircle2, label: "발송 완료", value: `${campaign.sentCount}명`, color: "text-green-600" },
                  { icon: XCircle, label: "발송 실패", value: hasFailed ? `${campaign.failedCount}명` : "—", color: hasFailed ? "text-red-500" : "text-slate-400" },
                  { icon: BarChart2, label: "오픈율", value: campaign.openRate > 0 ? `${campaign.openRate}%` : "—", color: campaign.openRate > 0 ? "text-indigo-600" : "text-slate-400" },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="flex items-center gap-3 px-5 py-3.5">
                    <Icon className={cn("h-4 w-4 shrink-0", color)} />
                    <div>
                      <p className="text-[11px] text-slate-400">{label}</p>
                      <p className={cn("text-base font-semibold leading-tight", color)}>{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 실패 사유 배너 */}
          {campaign.status === "SENT" && (campaign.failedReasons?.length ?? 0) > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 shadow-sm p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-red-800">발송 실패 원인</p>
                  <ul className="mt-1.5 space-y-1">
                    {campaign.failedReasons!.map((reason, i) => (
                      <li key={i} className="text-sm text-red-700">
                        {reason}
                      </li>
                    ))}
                  </ul>
                  {campaign.failedPhones && campaign.failedPhones.length > 0 && (
                    <p className="mt-2 text-xs text-red-600">
                      실패 번호: {campaign.failedPhones.join(", ")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 탭 영역 */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {/* 탭 헤더 */}
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setActiveTab("content")}
                className={cn(
                  "px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px",
                  activeTab === "content"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                )}
              >
                발송 내용
              </button>
              {campaign.status === "SENT" && (() => {
                const count = campaign.channel === "SMS"
                  ? getTargetUsersForSms(campaign.targetFilter).length
                  : getTargetUsers(campaign.targetFilter).length;
                return (
                  <button
                    onClick={() => setActiveTab("history")}
                    className={cn(
                      "flex items-center gap-1.5 px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px",
                      activeTab === "history"
                        ? "border-indigo-500 text-indigo-600"
                        : "border-transparent text-slate-500 hover:text-slate-700"
                    )}
                  >
                    발송 내역
                    <span className={cn(
                      "rounded-full px-1.5 py-0.5 text-[11px] font-medium",
                      activeTab === "history" ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-500"
                    )}>
                      {count}
                    </span>
                  </button>
                );
              })()}
            </div>

            {/* 탭 콘텐츠: 발송 내용 */}
            {activeTab === "content" && (
              <div className="p-5">
                {/* 발신자 / 제목 헤더 */}
                {(campaign.message.senderName || (campaign.channel === "EMAIL" && campaign.message.subject) || campaign.channel === "SMS") && (
                  <div className="mb-4 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 divide-y divide-slate-200">
                    {campaign.message.senderName && (
                      <div className="flex items-center gap-4 px-4 py-3">
                        <span className="w-14 shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-400">발신자</span>
                        <span className="text-sm font-medium text-slate-800">{campaign.message.senderName}</span>
                      </div>
                    )}
                    {campaign.channel === "EMAIL" && campaign.message.subject && (
                      <div className="flex items-center gap-4 px-4 py-3">
                        <span className="w-14 shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-400">제목</span>
                        <span className="text-sm font-semibold text-slate-900">{campaign.message.subject}</span>
                      </div>
                    )}
                    {campaign.channel === "SMS" && (
                      <>
                        {campaign.smsSender && (
                          <div className="flex items-center gap-4 px-4 py-3">
                            <span className="w-14 shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-400">발신번호</span>
                            <span className="text-sm font-medium text-slate-800">{campaign.smsSender}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-4 px-4 py-3">
                          <span className="w-14 shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-400">문자종류</span>
                          <span className="text-sm font-medium text-slate-800">{campaign.smsType ?? "SMS"}</span>
                          {campaign.smsUnitCost != null && (
                            <span className="ml-2 text-xs text-slate-400">건당 {campaign.smsUnitCost}원</span>
                          )}
                        </div>
                        {(campaign.smsType === "LMS" || campaign.smsType === "MMS") && campaign.message.subject && (
                          <div className="flex items-center gap-4 px-4 py-3">
                            <span className="w-14 shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-400">제목</span>
                            <span className="text-sm font-semibold text-slate-900">{campaign.message.subject}</span>
                          </div>
                        )}
                        {campaign.smsTotalCost != null && (
                          <div className="flex items-center gap-4 px-4 py-3">
                            <span className="w-14 shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-400">예상비용</span>
                            <span className="text-sm font-semibold text-indigo-600">{campaign.smsTotalCost.toLocaleString()}원</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
                {/* MMS 이미지 */}
                {campaign.channel === "SMS" && campaign.smsType === "MMS" && campaign.smsImageData && (
                  <div className="mb-4 overflow-hidden rounded-lg border border-slate-200">
                    <img src={campaign.smsImageData} alt="MMS 이미지" className="max-h-64 w-full object-contain bg-slate-100" />
                  </div>
                )}
                {campaign.channel === "EMAIL" && campaign.message.body ? (
                  <div
                    className="ProseMirror min-h-[100px] rounded-lg border border-slate-200 bg-slate-50/50 p-4 text-sm"
                    dangerouslySetInnerHTML={{ __html: campaign.message.body }}
                  />
                ) : (
                  <div className="min-h-[80px] whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800">
                    {campaign.message.body || <span className="text-slate-400">본문 없음</span>}
                  </div>
                )}
              </div>
            )}

            {/* 탭 콘텐츠: 발송 내역 */}
            {activeTab === "history" && campaign.status === "SENT" && (() => {
              const isSms = campaign.channel === "SMS";
              const failedSet = isSms
                ? new Set(campaign.failedPhones ?? [])
                : new Set(campaign.failedEmails ?? []);
              const toggleSort = (key: typeof historySort.key) => {
                setHistorySort((prev) =>
                  prev.key === key
                    ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
                    : { key, dir: "asc" }
                );
              };
              const SortIcon = ({ k }: { k: typeof historySort.key }) => {
                if (historySort.key !== k) return <ChevronsUpDown className="h-3 w-3 text-slate-300" />;
                return historySort.dir === "asc"
                  ? <ChevronUp className="h-3 w-3 text-indigo-500" />
                  : <ChevronDown className="h-3 w-3 text-indigo-500" />;
              };
              const targetUsers = isSms
                ? getTargetUsersForSms(campaign.targetFilter)
                : getTargetUsers(campaign.targetFilter);
              const allTargets = targetUsers
                .map((u) => ({
                  nickname: u.nickname ?? "—",
                  email: isSms ? (u.phone ?? "—") : u.email,
                  companyName: u.companyName ?? "—",
                  jobCategory: u.jobCategory ?? "—",
                  failed: isSms ? failedSet.has(u.phone ?? "") : failedSet.has(u.email),
                }))
                .sort((a, b) => {
                  const { key, dir } = historySort;
                  let cmp = 0;
                  if (key === "failed") {
                    cmp = Number(a.failed) - Number(b.failed);
                  } else {
                    cmp = a[key].localeCompare(b[key], "ko");
                  }
                  return dir === "asc" ? cmp : -cmp;
                });
              const successCount = allTargets.filter((u) => !u.failed).length;
              const failedCount = allTargets.filter((u) => u.failed).length;
              const targets = historyFilter === "success"
                ? allTargets.filter((u) => !u.failed)
                : historyFilter === "failed"
                  ? allTargets.filter((u) => u.failed)
                  : allTargets;
              if (allTargets.length === 0) {
                return <p className="px-5 py-8 text-center text-sm text-slate-400">발송 내역이 없습니다.</p>;
              }
              return (
                <>
                {/* 필터 바 */}
                <div className="flex items-center gap-1.5 px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                  {([
                    { value: "all", label: "전체", count: allTargets.length },
                    { value: "success", label: "성공", count: successCount },
                    { value: "failed", label: "실패", count: failedCount },
                  ] as const).map(({ value, label, count }) => (
                    <button
                      key={value}
                      onClick={() => setHistoryFilter(value)}
                      className={cn(
                        "flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                        historyFilter === value
                          ? value === "failed"
                            ? "border-red-200 bg-red-100 text-red-600"
                            : value === "success"
                              ? "border-green-200 bg-green-100 text-green-600"
                              : "border-indigo-200 bg-indigo-100 text-indigo-600"
                          : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                      )}
                    >
                      {label}
                      <span className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                        historyFilter === value ? "bg-white/60" : "bg-slate-100"
                      )}>
                        {count}
                      </span>
                    </button>
                  ))}
                </div>
                <table className="w-full table-fixed text-sm">
                  <colgroup>
                    <col className="w-[15%]" />
                    <col className="w-[28%]" />
                    <col className="w-[22%]" />
                    <col className="w-[22%]" />
                    <col className="w-[13%]" />
                  </colgroup>
                  <thead>
                    <tr className="bg-slate-50 text-xs text-slate-500 border-b border-slate-100">
                      {(["nickname", "email", "companyName", "jobCategory", "failed"] as const).map((k) => {
                        const labels = { nickname: "닉네임", email: isSms ? "전화번호" : "이메일", companyName: "회사명", jobCategory: "직군", failed: "상태" };
                        return (
                          <th key={k} className="px-4 py-2.5 text-left font-medium">
                            <button
                              onClick={() => toggleSort(k)}
                              className="flex items-center gap-1 hover:text-slate-700 transition-colors"
                            >
                              {labels[k]}
                              <SortIcon k={k} />
                            </button>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {targets.map((u) => (
                      <tr key={u.email} className="hover:bg-slate-50/60">
                        <td className="px-4 py-2.5 overflow-hidden font-medium text-slate-800"><div className="truncate">{u.nickname}</div></td>
                        <td className="px-4 py-2.5 overflow-hidden text-slate-500"><div className="truncate">{u.email}</div></td>
                        <td className="px-4 py-2.5 overflow-hidden text-slate-500"><div className="truncate">{u.companyName}</div></td>
                        <td className="px-4 py-2.5 overflow-hidden text-slate-500"><div className="truncate">{u.jobCategory}</div></td>
                        <td className="px-4 py-2.5">
                          {u.failed ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                              <XCircle className="h-3 w-3" />실패
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-600">
                              <CheckCircle2 className="h-3 w-3" />성공
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </>
              );
            })()}
          </div>
        </div>

        {/* 사이드바 */}
        <div className="w-[200px] shrink-0">
          <div className="sticky top-4 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 px-4 py-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">마케팅 목록</h3>
            </div>
            <div className="max-h-[calc(100vh-220px)] overflow-y-auto divide-y divide-slate-50 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb:hover]:bg-slate-300">
              {allCampaigns.length === 0 ? (
                <p className="px-4 py-6 text-center text-xs text-slate-400">마케팅이 없습니다</p>
              ) : (
                allCampaigns.map((c) => {
                  const sc2 = statusConfig[c.status];
                  const isActive = c.id === id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => router.push(`/campaigns/${c.id}`)}
                      className={cn(
                        "w-full px-4 py-3 text-left transition-colors hover:bg-slate-50",
                        isActive && "bg-indigo-50 border-l-2 border-indigo-500"
                      )}
                    >
                      <p className={cn(
                        "text-xs font-medium line-clamp-2 leading-snug",
                        isActive ? "text-indigo-700" : "text-slate-700"
                      )}>
                        {c.title}
                      </p>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        {sc2 && (
                          <Badge variant={sc2.variant} className="text-[10px] px-1.5 py-0">
                            {sc2.label}
                          </Badge>
                        )}
                        <span className="text-[10px] text-slate-400">
                          {new Date(c.createdAt).toLocaleDateString("ko-KR")}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteConfirm(false); }}
        >
          <div className="w-80 rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-base font-semibold text-slate-900">마케팅 삭제</h3>
            <p className="mb-5 text-sm text-slate-500">
              <span className="font-medium text-slate-700">{campaign.title}</span>을(를) 삭제합니다. 이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)}>취소</Button>
              <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white" onClick={handleDelete}>삭제</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
