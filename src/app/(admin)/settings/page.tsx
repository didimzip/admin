"use client";

import { useState, useEffect } from "react";
import { Shield, Trash2, Bell, Globe, MessageSquare, MessageCircle, AlertTriangle, Loader2, RefreshCw, CheckCircle2, X, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/lib/toast-context";
import { recordLog } from "@/lib/audit-log-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getSystemSettings, saveSystemSettings, type SystemSettings } from "@/lib/system-settings-store";

export default function SettingsPage() {
  const { showToast } = useToast();
  const [docRetention, setDocRetention] = useState("60");
  const [maxLoginAttempts, setMaxLoginAttempts] = useState("5");
  const [lockoutDuration, setLockoutDuration] = useState("30");
  const [maintenanceMode, setMaintenanceMode] = useState("OFF");
  const [defaultNewsletter, setDefaultNewsletter] = useState("WEEKLY");

  // SMS (솔라피) 설정
  const [smsSettings, setSmsSettings] = useState<SystemSettings>({
    solapiApiKey: "",
    solapiApiSecret: "",
    solapiSender: "",
    kakaoBrandChannelId: "",
    kakaoFriendCount: 0,
    kakaoChannelUrl: "",
    kakaoChannelName: "",
    kakaoChannelImage: "",
    kakaoLastUpdated: "",
  });

  useEffect(() => {
    const saved = getSystemSettings();
    setSmsSettings(saved);
    if (saved.kakaoChannelName) {
      setKakaoChannelName(saved.kakaoChannelName);
      setKakaoChannelImage(saved.kakaoChannelImage);
    }
    if (saved.kakaoChannelUrl) {
      setKakaoChannelInput(saved.kakaoChannelUrl);
    }
  }, []);

  function handleSmsSettingChange<K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) {
    setSmsSettings((prev) => ({ ...prev, [key]: value }));
  }

  // API Key/Secret 표시 토글
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);

  // 발신번호 자동 하이픈 포맷
  function formatPhoneNumber(value: string): string {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.startsWith("02")) {
      if (digits.length <= 2) return digits;
      if (digits.length <= 5) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
      if (digits.length <= 9) return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
      return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }

  // 카카오 채널 조회
  const [kakaoChannelInput, setKakaoChannelInput] = useState("");
  const [kakaoLoading, setKakaoLoading] = useState(false);
  const [kakaoChannelName, setKakaoChannelName] = useState("");
  const [kakaoChannelImage, setKakaoChannelImage] = useState("");
  const [kakaoError, setKakaoError] = useState("");

  async function handleFetchKakaoChannel() {
    if (!kakaoChannelInput.trim()) return;
    setKakaoLoading(true);
    setKakaoError("");
    setKakaoChannelName("");
    setKakaoChannelImage("");
    try {
      const res = await fetch("/api/kakao/channel-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelInput: kakaoChannelInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setKakaoError(data.error || "조회 실패");
        return;
      }
      setKakaoChannelName(data.name);
      setKakaoChannelImage(data.profileImage);
      const now = new Date().toISOString();
      const channelUrl = kakaoChannelInput.trim();
      const updated = {
        ...smsSettings,
        kakaoBrandChannelId: data.encodedId,
        kakaoFriendCount: data.friendCount,
        kakaoChannelUrl: channelUrl,
        kakaoChannelName: data.name,
        kakaoChannelImage: data.profileImage,
        kakaoLastUpdated: now,
      };
      setSmsSettings(updated);
      saveSystemSettings(updated);
      showToast(`채널 '${data.name}' 정보를 업데이트했습니다.`);
    } catch {
      setKakaoError("채널 정보 조회 중 오류가 발생했습니다.");
    } finally {
      setKakaoLoading(false);
    }
  }

  function handleSaveSmsSettings() {
    saveSystemSettings(smsSettings);
    showToast("SMS 발신 설정이 저장되었습니다.");
    recordLog("SETTINGS_UPDATE", "SMS/카카오 발송 설정 변경", { targetType: "settings", targetId: "sms_settings" });
  }

  function handleResetSmsSettings() {
    setSmsSettings((prev) => ({
      ...prev,
      solapiApiKey: "",
      solapiApiSecret: "",
      solapiSender: "",
    }));
    setShowApiKey(false);
    setShowApiSecret(false);
    showToast("입력값이 초기화되었습니다. 저장 버튼을 눌러야 반영됩니다.");
  }

  function handleClearKakaoChannel() {
    setKakaoChannelName("");
    setKakaoChannelImage("");
    setKakaoChannelInput("");
    setKakaoError("");
    const updated = {
      ...smsSettings,
      kakaoBrandChannelId: "",
      kakaoFriendCount: 0,
      kakaoChannelUrl: "",
      kakaoChannelName: "",
      kakaoChannelImage: "",
      kakaoLastUpdated: "",
    };
    setSmsSettings(updated);
    saveSystemSettings(updated);
    showToast("카카오 채널 정보가 삭제되었습니다.");
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">시스템 설정</h2>
        <p className="mt-1 text-sm text-slate-500">보안, 알림, 데이터 관리 등 시스템 전반 설정을 관리합니다.</p>
      </div>

      {/* SMS 발신 설정 */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <MessageSquare className="h-5 w-5 text-green-600" /> SMS 발신 설정 (솔라피)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>API Key</Label>
              <div className="relative">
                <Input
                  type={showApiKey ? "text" : "password"}
                  value={smsSettings.solapiApiKey}
                  onChange={(e) => handleSmsSettingChange("solapiApiKey", e.target.value)}
                  placeholder="API Key를 입력하세요"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showApiKey ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>API Secret</Label>
              <div className="relative">
                <Input
                  type={showApiSecret ? "text" : "password"}
                  value={smsSettings.solapiApiSecret}
                  onChange={(e) => handleSmsSettingChange("solapiApiSecret", e.target.value)}
                  placeholder="API Secret을 입력하세요"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowApiSecret(!showApiSecret)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showApiSecret ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>발신번호</Label>
            <Input
              value={smsSettings.solapiSender}
              onChange={(e) => handleSmsSettingChange("solapiSender", formatPhoneNumber(e.target.value))}
              placeholder="010-0000-0000"
              className="max-w-xs"
            />
            <p className="text-xs text-slate-500">솔라피에 사전 등록된 발신번호만 사용할 수 있습니다.</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h4 className="text-sm font-medium text-slate-700">SMS 단가 안내 (VAT 별도)</h4>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <div><span className="text-xs text-slate-500">SMS (90바이트):</span> <span className="ml-1 text-sm font-medium">13원</span></div>
              <div><span className="text-xs text-slate-500">LMS (2,000바이트):</span> <span className="ml-1 text-sm font-medium">29원</span></div>
              <div><span className="text-xs text-slate-500">MMS (이미지):</span> <span className="ml-1 text-sm font-medium">60원</span></div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={handleResetSmsSettings} className="text-slate-500 hover:text-red-500">초기화</Button>
            <Button size="sm" onClick={handleSaveSmsSettings}>SMS 설정 저장</Button>
          </div>
        </CardContent>
      </Card>

      {/* 카카오 브랜드 메시지 설정 */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <MessageCircle className="h-5 w-5 text-[#FEE500]" /> 카카오 브랜드 메시지 설정
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* ── 상태 A: 채널 미등록 ── */}
          {!kakaoChannelName ? (
            <>
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                <MessageCircle className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-3 text-sm font-medium text-slate-600">등록된 카카오톡 채널이 없습니다</p>
                <p className="mt-1 text-xs text-slate-400">채널을 등록하면 친구 수를 자동으로 가져와 브랜드 메시지 발송 가능 여부를 확인합니다.</p>
              </div>
              <div className="space-y-1.5">
                <Label>카카오톡 채널 URL</Label>
                <div className="flex gap-2">
                  <Input
                    value={kakaoChannelInput}
                    onChange={(e) => setKakaoChannelInput(e.target.value)}
                    placeholder="https://pf.kakao.com/_xxxxx 또는 _xxxxx"
                    onKeyDown={(e) => { if (e.key === "Enter") handleFetchKakaoChannel(); }}
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    onClick={handleFetchKakaoChannel}
                    disabled={kakaoLoading || !kakaoChannelInput.trim()}
                    className="shrink-0 gap-1.5"
                  >
                    {kakaoLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    등록
                  </Button>
                </div>
                <p className="text-xs text-slate-500">채널 홈 URL을 입력하면 채널명과 친구 수를 자동으로 가져옵니다.</p>
                {kakaoError && (
                  <p className="text-xs text-red-500">{kakaoError}</p>
                )}
              </div>
            </>
          ) : (
            /* ── 상태 B: 채널 등록됨 ── */
            <>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start gap-4">
                  {kakaoChannelImage ? (
                    <img src={kakaoChannelImage} alt="" className="h-12 w-12 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-slate-200 shrink-0 flex items-center justify-center">
                      <MessageCircle className="h-6 w-6 text-slate-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-slate-800">{kakaoChannelName}</p>
                      <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    </div>
                    <p className="mt-0.5 text-sm text-slate-600">
                      친구 <span className="font-semibold">{smsSettings.kakaoFriendCount.toLocaleString()}</span>명
                    </p>
                    {smsSettings.kakaoChannelUrl && (
                      <p className="mt-0.5 text-xs text-slate-400">
                        {smsSettings.kakaoChannelUrl.startsWith("http")
                          ? smsSettings.kakaoChannelUrl
                          : `https://pf.kakao.com/${smsSettings.kakaoChannelUrl}`}
                      </p>
                    )}
                    {smsSettings.kakaoLastUpdated && (
                      <p className="mt-1 text-xs text-slate-400">
                        마지막 업데이트: {new Date(smsSettings.kakaoLastUpdated).toLocaleString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 border-t border-slate-200 pt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleFetchKakaoChannel}
                    disabled={kakaoLoading}
                    className="gap-1.5 text-xs"
                  >
                    {kakaoLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                    업데이트
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleClearKakaoChannel}
                    className="gap-1.5 text-xs text-slate-400 hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    삭제
                  </Button>
                </div>
              </div>
              {kakaoError && (
                <p className="text-xs text-red-500">{kakaoError}</p>
              )}
            </>
          )}

          {/* 브랜드 메시지 활성화 상태 */}
          {smsSettings.kakaoFriendCount < 50000 && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <div>
                <p className="text-sm font-medium text-amber-800">브랜드 메시지 기능이 비활성화되어 있습니다</p>
                <p className="mt-0.5 text-xs text-amber-600">
                  카카오톡 채널 친구 수가 5만 이상이어야 브랜드 메시지 발송이 가능합니다.
                  {smsSettings.kakaoFriendCount > 0 && ` 현재: ${smsSettings.kakaoFriendCount.toLocaleString()}명 / 50,000명`}
                </p>
              </div>
            </div>
          )}
          {smsSettings.kakaoFriendCount >= 50000 && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3">
              <p className="text-sm font-medium text-green-700">브랜드 메시지 기능이 활성화되어 있습니다</p>
              <p className="mt-0.5 text-xs text-green-600">
                채널 친구 수: {smsSettings.kakaoFriendCount.toLocaleString()}명 — 마케팅 발송에서 브랜드 메시지를 사용할 수 있습니다.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <Shield className="h-5 w-5 text-slate-600" /> 보안 설정
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>최대 로그인 시도 횟수</Label>
              <Input type="number" value={maxLoginAttempts} onChange={(e) => setMaxLoginAttempts(e.target.value)} />
              <p className="text-xs text-slate-500">설정 횟수 초과 시 계정이 일시 잠금됩니다.</p>
            </div>
            <div className="space-y-1.5">
              <Label>계정 잠금 기간 (분)</Label>
              <Input type="number" value={lockoutDuration} onChange={(e) => setLockoutDuration(e.target.value)} />
              <p className="text-xs text-slate-500">잠금 후 자동 해제까지의 시간입니다.</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>유지보수 모드</Label>
            <Select value={maintenanceMode} onValueChange={setMaintenanceMode}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="OFF">비활성</SelectItem>
                <SelectItem value="ON">활성 (관리자만 접근 가능)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">활성화 시 일반 회원은 서비스에 접근할 수 없습니다.</p>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <Trash2 className="h-5 w-5 text-slate-600" /> 데이터 관리
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>서류 이미지 자동 파기 (승인 후 N일)</Label>
            <div className="flex items-center gap-2">
              <Input type="number" className="w-32" value={docRetention} onChange={(e) => setDocRetention(e.target.value)} />
              <span className="text-sm text-slate-500">일</span>
            </div>
            <p className="text-xs text-slate-500">인증 승인 완료 후 설정 기간이 지나면 업로드된 서류 이미지가 자동 삭제됩니다.</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h4 className="text-sm font-medium text-slate-700">현재 저장 현황</h4>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <div><span className="text-xs text-slate-500">전체 서류:</span> <span className="ml-1 text-sm font-medium">10건</span></div>
              <div><span className="text-xs text-slate-500">파기 대상:</span> <span className="ml-1 text-sm font-medium text-orange-600">2건</span></div>
              <div><span className="text-xs text-slate-500">저장 용량:</span> <span className="ml-1 text-sm font-medium">24.5 MB</span></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <Bell className="h-5 w-5 text-slate-600" /> 알림 설정
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>기본 뉴스레터 발송 주기</Label>
            <Select value={defaultNewsletter} onValueChange={setDefaultNewsletter}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="DAILY">매일</SelectItem>
                <SelectItem value="WEEKLY">매주</SelectItem>
                <SelectItem value="BIWEEKLY">격주</SelectItem>
                <SelectItem value="MONTHLY">매월</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h4 className="text-sm font-medium text-slate-700">알림 수신 현황</h4>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <div><span className="text-xs text-slate-500">마케팅 수신 동의:</span> <span className="ml-1 text-sm font-medium">18명</span></div>
              <div><span className="text-xs text-slate-500">수신 거부:</span> <span className="ml-1 text-sm font-medium">8명</span></div>
              <div><span className="text-xs text-slate-500">최근 발송일:</span> <span className="ml-1 text-sm font-medium">2026-03-01</span></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Info */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <Globe className="h-5 w-5 text-slate-600" /> 서비스 정보
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            <div><span className="text-sm text-slate-500">서비스명:</span> <span className="ml-2 text-sm font-medium">DidimZip</span></div>
            <div><span className="text-sm text-slate-500">버전:</span> <span className="ml-2 text-sm font-medium">0.1.0</span></div>
            <div><span className="text-sm text-slate-500">프레임워크:</span> <span className="ml-2 text-sm font-medium">Next.js 16.1.6</span></div>
            <div><span className="text-sm text-slate-500">환경:</span> <span className="ml-2 text-sm font-medium">Development</span></div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={() => {
          showToast("설정이 저장되었습니다.");
          recordLog("SETTINGS_UPDATE", `시스템 설정 변경 (서류보관 ${docRetention}일, 잠금시도 ${maxLoginAttempts}회, 뉴스레터 ${defaultNewsletter})`, { targetType: "settings", targetId: "sys_001" });
        }}>설정 저장</Button>
      </div>
    </div>
  );
}
