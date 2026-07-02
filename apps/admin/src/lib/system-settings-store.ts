// ─── 시스템 설정 (솔라피 SMS + 카카오 브랜드 메시지) ─────────────────────────

export interface SystemSettings {
  solapiApiKey: string;
  solapiApiSecret: string;
  solapiSender: string;        // 발신번호 (예: "01012345678")
  kakaoBrandChannelId: string;
  kakaoFriendCount: number;    // 5만 이상이면 BRANDMSG 활성
  kakaoChannelUrl: string;     // 사용자가 입력한 원본 URL/ID
  kakaoChannelName: string;
  kakaoChannelImage: string;
  kakaoLastUpdated: string;    // ISO 날짜 문자열
}

const STORAGE_KEY = "didimzip_admin_system_settings";

const DEFAULT_SETTINGS: SystemSettings = {
  solapiApiKey: "",
  solapiApiSecret: "",
  solapiSender: "",
  kakaoBrandChannelId: "",
  kakaoFriendCount: 0,
  kakaoChannelUrl: "",
  kakaoChannelName: "",
  kakaoChannelImage: "",
  kakaoLastUpdated: "",
};

export function getSystemSettings(): SystemSettings {
  if (typeof window === "undefined") return { ...DEFAULT_SETTINGS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveSystemSettings(settings: SystemSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function isBrandMsgEnabled(): boolean {
  return getSystemSettings().kakaoFriendCount >= 50000;
}

export function isSmsConfigured(): boolean {
  const s = getSystemSettings();
  return !!(s.solapiApiKey && s.solapiApiSecret && s.solapiSender);
}
