// ─── 시스템 설정 (알리고 SMS + 카카오 브랜드 메시지) ─────────────────────────

export interface SystemSettings {
  aligoApiKey: string;
  aligoUserId: string;
  aligoSender: string;       // 발신번호 (예: "02-1234-5678")
  aligoTestMode: boolean;    // true = 테스트모드 (요금 미발생)
  kakaoBrandChannelId: string;
  kakaoFriendCount: number;  // 5만 이상이면 BRANDMSG 활성
}

const STORAGE_KEY = "didimzip_admin_system_settings";

const DEFAULT_SETTINGS: SystemSettings = {
  aligoApiKey: "",
  aligoUserId: "",
  aligoSender: "",
  aligoTestMode: true,
  kakaoBrandChannelId: "",
  kakaoFriendCount: 0,
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
  return !!(s.aligoApiKey && s.aligoUserId && s.aligoSender);
}
