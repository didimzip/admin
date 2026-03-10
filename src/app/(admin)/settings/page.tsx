"use client";

import { useState } from "react";
import { Settings, Shield, Trash2, Bell, Globe } from "lucide-react";
import { useToast } from "@/lib/toast-context";
import { recordLog } from "@/lib/audit-log-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SettingsPage() {
  const { showToast } = useToast();
  const [docRetention, setDocRetention] = useState("60");
  const [maxLoginAttempts, setMaxLoginAttempts] = useState("5");
  const [lockoutDuration, setLockoutDuration] = useState("30");
  const [maintenanceMode, setMaintenanceMode] = useState("OFF");
  const [defaultNewsletter, setDefaultNewsletter] = useState("WEEKLY");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">시스템 설정</h2>
        <p className="mt-1 text-sm text-slate-500">보안, 알림, 데이터 관리 등 시스템 전반 설정을 관리합니다.</p>
      </div>

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
