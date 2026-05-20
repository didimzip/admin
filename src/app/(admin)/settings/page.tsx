"use client";

import { useState, useEffect } from "react";
import { Shield, Trash2, Bell, Globe, MessageSquare, MessageCircle, AlertTriangle, Loader2, RefreshCw, CheckCircle2 } from "lucide-react";
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

  // SMS (알리고) 설정
  const [smsSettings, setSmsSettings] = useState<SystemSettings>({
    aligoApiKey: "",
    aligoUserId: "",
    aligoSender: "",
    aligoTestMode: true,
    kakaoBrandChannelId: "",
    kakaoFriendCount: 0,
  });

  useEffect(() => {
    setSmsSettings(getSystemSettings());
  }, []);

  function handleSmsSettingChange<K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) {
    setSmsSettings((prev) => ({ ...prev, [key]: value }));
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
      setSmsSettings((prev) => ({
        ...prev,
        kakaoBrandChannelId: data.encodedId,
        kakaoFriendCount: data.friendCount,
      }));
      showToast(`채널 "${data.name}" 정보를 불러왔습니다. 친구 ${data.friendCount.toLocaleString()}명`);
    } catch {
      setKakaoError("채널 정보 조회 중 오류가 발생했습니다.");
    } finally {
      setKakaoLoading(false);
    }
  }

  function handleSaveSmsSettings() {
    saveSystemSettings(smsSettings);
    showToast("SMS/카카오 설정이 저장되었습니다.");
    recordLog("SETTINGS_UPDATE", "SMS/카카오 발송 설정 변경", { targetType: "settings", targetId: "sms_settings" });
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
            <MessageSquare className="h-5 w-5 text-green-600" /> SMS 발신 설정 (알리고)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>알리고 API Key</Label>
              <Input
                type="password"
                value={smsSettings.aligoApiKey}
                onChange={(e) => handleSmsSettingChange("aligoApiKey", e.target.value)}
                placeholder="API Key를 입력하세요"
              />
            </div>
            <div className="space-y-1.5">
              <Label>알리고 사용자 ID</Label>
              <Input
                value={smsSettings.aligoUserId}
                onChange={(e) => handleSmsSettingChange("aligoUserId", e.target.value)}
                placeholder="사용자 ID를 입력하세요"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>발신번호</Label>
              <Input
                value={smsSettings.aligoSender}
                onChange={(e) => handleSmsSettingChange("aligoSender", e.target.value)}
                placeholder="02-1234-5678"
              />
              <p className="text-xs text-slate-500">사전 등록된 발신번호만 사용할 수 있습니다.</p>
            </div>
            <div className="space-y-1.5">
              <Label>테스트 모드</Label>
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => handleSmsSettingChange("aligoTestMode", !smsSettings.aligoTestMode)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    smsSettings.aligoTestMode ? "bg-green-500" : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
                      smsSettings.aligoTestMode ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
                <span className="text-sm text-slate-600">
                  {smsSettings.aligoTestMode ? "활성 (요금 미발생)" : "비활성 (실제 발송)"}
                </span>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h4 className="text-sm font-medium text-slate-700">SMS 단가 안내</h4>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <div><span className="text-xs text-slate-500">SMS (90바이트):</span> <span className="ml-1 text-sm font-medium">8.4원</span></div>
              <div><span className="text-xs text-slate-500">LMS (2,000바이트):</span> <span className="ml-1 text-sm font-medium">25.9원</span></div>
              <div><span className="text-xs text-slate-500">MMS (이미지):</span> <span className="ml-1 text-sm font-medium">60원</span></div>
            </div>
          </div>
          <div className="flex justify-end">
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
          {/* 채널 URL 입력 + 자동 조회 */}
          <div className="space-y-1.5">
            <Label>카카오톡 채널 URL 또는 ID</Label>
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
                variant="outline"
                onClick={handleFetchKakaoChannel}
                disabled={kakaoLoading || !kakaoChannelInput.trim()}
                className="shrink-0 gap-1.5"
              >
                {kakaoLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                조회
              </Button>
            </div>
            <p className="text-xs text-slate-500">채널 홈 URL을 입력하면 채널명과 친구 수를 자동으로 가져옵니다.</p>
            {kakaoError && (
              <p className="text-xs text-red-500">{kakaoError}</p>
            )}
          </div>

          {/* 조회 결과 표시 */}
          {kakaoChannelName && (
            <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              {kakaoChannelImage && (
                <img src={kakaoChannelImage} alt="" className="h-10 w-10 rounded-full object-cover" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-slate-800">{kakaoChannelName}</p>
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                </div>
                <p className="text-xs text-slate-500">
                  채널 ID: {smsSettings.kakaoBrandChannelId} · 친구 <span className="font-semibold text-slate-700">{smsSettings.kakaoFriendCount.toLocaleString()}</span>명
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleFetchKakaoChannel}
                disabled={kakaoLoading}
                className="shrink-0 text-xs text-slate-500"
              >
                {kakaoLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              </Button>
            </div>
          )}

          {/* 수동 입력 (폴백) */}
          {!kakaoChannelName && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>채널 ID (수동 입력)</Label>
                <Input
                  value={smsSettings.kakaoBrandChannelId}
                  onChange={(e) => handleSmsSettingChange("kakaoBrandChannelId", e.target.value)}
                  placeholder="_xxxxx"
                />
              </div>
              <div className="space-y-1.5">
                <Label>채널 친구 수 (수동 입력)</Label>
                <Input
                  type="number"
                  value={smsSettings.kakaoFriendCount || ""}
                  onChange={(e) => handleSmsSettingChange("kakaoFriendCount", Number(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
            </div>
          )}

          {/* 브랜드 메시지 활성화 상태 */}
          {smsSettings.kakaoFriendCount < 50000 && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <div>
                <p className="text-sm font-medium text-amber-800">브랜드 메시지 기능이 비활성화되어 있습니다</p>
                <p className="mt-0.5 text-xs text-amber-600">
                  카카오톡 채널 친구 수가 5만 이상이어야 브랜드 메시지 발송이 가능합니다.
                  현재: {smsSettings.kakaoFriendCount.toLocaleString()}명 / 50,000명
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
          <div className="flex justify-end">
            <Button size="sm" onClick={handleSaveSmsSettings}>카카오 설정 저장</Button>
          </div>
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
